"use strict";

/**
 * 音频彩蛋钩子模块
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { cardEasterEggs } from "./easterEggs/cardEggs.js";
import { shaEasterEggs } from "./easterEggs/shaEggs.js";
import { equipEasterEggs } from "./easterEggs/equipEggs.js";
import { trickEasterEggs } from "./easterEggs/trickEggs.js";
import { damageEasterEggs, deathEasterEggs, phaseStartEasterEggs } from "./easterEggs/eventEggs.js";
import { gameStartDialogues } from "./easterEggs/dialogueEggs.js";

// 合并所有卡牌彩蛋
const allCardEasterEggs = [...cardEasterEggs, ...shaEasterEggs, ...equipEasterEggs, ...trickEasterEggs];

// 工具函数
const hasName = (player, name) => get.nameList(player).some(n => n?.includes(name));
const findPlayer = name => game.players?.find(p => hasName(p, name));
const playAudio = file => game.playAudio("..", "extension", "十周年UI", `audio/caidan/${file}`);

// 序列状态管理
const sequenceState = new Map();
const nextSequence = (rule, ctx) => {
	if (!rule.sequence?.length) return null;
	const key = rule.sequenceKey?.(ctx) || `${rule.player}-${rule.cards.join(",")}`;
	const index = sequenceState.get(key) || 0;
	sequenceState.set(key, index + 1);
	return rule.sequence[index % rule.sequence.length];
};

// 触发彩蛋语音
const triggerEasterEgg = (rules, matcher, getSpeaker) => {
	for (const rule of rules) {
		if (!matcher(rule)) continue;
		const speaker = getSpeaker(rule);
		if (!speaker) continue;
		const seq = rule.sequence ? nextSequence(rule, {}) : null;
		speaker.say?.(seq?.text || rule.text);
		if (seq?.audio || rule.audio) playAudio(seq?.audio || rule.audio);
		return true;
	}
	return false;
};

// 张飞拼点平局处理
const handleZhangfeiTie = event => {
	const player = event.player;
	const target = event.target || event.targets?.[0];
	if (!player || !target) return;
	if (event.result1 !== event.result2) return;
	if (hasName(player, "zhangfei") || hasName(target, "zhangfei")) {
		const zhangfei = hasName(player, "zhangfei") ? player : target;
		zhangfei.say?.("俺也一样！");
		playAudio("zhangfei6.mp3");
	}
};

// 创建上下文对象
const createContext = (event, cardName) => ({
	card: event.card,
	player: event.player,
	targets: event.targets,
	cardName,
	hasName,
	findPlayer: name => findPlayer(name),
});

/**
 * 设置音频彩蛋钩子
 */
export function setupAudioHooks() {
	// Hook: 使用卡牌
	const originalUseCard = lib.element.Player.prototype.useCard;
	lib.element.Player.prototype.useCard = function (...args) {
		const event = originalUseCard.apply(this, args);
		if (!event?.card || !event?.player) return event;

		const cardName = get.name(event.card, event.player);
		const ctx = createContext(event, cardName);

		for (const rule of allCardEasterEggs) {
			if (!rule.cards.includes(cardName)) continue;
			if (rule.player && !hasName(event.player, rule.player)) continue;
			if (rule.condition && !rule.condition(ctx)) continue;

			const speaker = rule.speaker ? findPlayer(rule.speaker) : rule.target ? ctx.targets?.find(t => hasName(t, rule.target)) : event.player;

			if (speaker) {
				const seq = nextSequence(rule, ctx);
				speaker.say?.(seq?.text || rule.text);
				if (seq?.audio || rule.audio) playAudio(seq?.audio || rule.audio);
				break;
			}
		}
		return event;
	};

	// Hook: 受伤
	const originalDamage = lib.element.Player.prototype.damage;
	lib.element.Player.prototype.damage = function (...args) {
		const event = originalDamage.apply(this, args);
		event?.then(() => {
			const damaged = event?.player || this;
			if (!damaged) return;
			triggerEasterEgg(
				damageEasterEggs,
				rule => hasName(damaged, rule.player),
				() => damaged
			);
		});
		return event;
	};

	// Hook: 死亡
	const originalDie = lib.element.Player.prototype.$die;
	lib.element.Player.prototype.$die = function (...args) {
		const result = originalDie.apply(this, args);
		for (const rule of deathEasterEggs) {
			if (!hasName(this, rule.deceased)) continue;
			const speaker = findPlayer(rule.speaker);
			if (!speaker) continue;
			speaker.say?.(rule.text);
			if (rule.audio) playAudio(rule.audio);
			break;
		}
		return result;
	};

	// Hook: 回合开始 & 拼点
	const originalTrigger = lib.element.GameEvent.prototype.trigger;
	lib.element.GameEvent.prototype.trigger = function (name) {
		const result = originalTrigger.apply(this, arguments);

		// 回合开始
		if (name === "phaseBeginStart" && _status.currentPhase) {
			triggerEasterEgg(
				phaseStartEasterEggs,
				rule => hasName(_status.currentPhase, rule.player),
				() => _status.currentPhase
			);
		}

		// 拼点相同
		if (name === "chooseToCompareAfter" || (name === "compare" && ["chooseToCompare", "chooseToCompareMultiple"].includes(this.name))) {
			handleZhangfeiTie(this);
		}

		return result;
	};

	// Hook: 游戏开始
	lib.announce.subscribe("gameStart", () => {
		if (!game.players?.length) return;

		for (const dialogue of gameStartDialogues) {
			const foundPlayers = dialogue.players.map(findPlayer).filter(Boolean);
			if (foundPlayers.length !== dialogue.players.length) continue;

			dialogue.dialogues.forEach(({ player, text, audio, delay }) => {
				setTimeout(() => {
					const speaker = findPlayer(player);
					if (speaker) {
						speaker.say?.(text);
						if (audio) playAudio(audio);
					}
				}, delay);
			});
			break;
		}
	});
}
