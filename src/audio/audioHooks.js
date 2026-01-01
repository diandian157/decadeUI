/**
 * @fileoverview 音频彩蛋钩子模块
 * 提供游戏中各种彩蛋语音的触发机制，包括卡牌使用、受伤、死亡、回合开始等事件
 */

"use strict";

import { lib, game, ui, get, ai, _status } from "noname";
import { cardEasterEggs } from "./easterEggs/cardEggs.js";
import { shaEasterEggs } from "./easterEggs/shaEggs.js";
import { equipEasterEggs } from "./easterEggs/equipEggs.js";
import { trickEasterEggs } from "./easterEggs/trickEggs.js";
import { damageEasterEggs, deathEasterEggs, phaseStartEasterEggs } from "./easterEggs/eventEggs.js";
import { gameStartDialogues } from "./easterEggs/dialogueEggs.js";

/**
 * @type {Array<Object>}
 * 合并所有卡牌彩蛋配置
 */
const allCardEasterEggs = [...cardEasterEggs, ...shaEasterEggs, ...equipEasterEggs, ...trickEasterEggs];

/**
 * 检查武将名是否已亮将（非暗置状态）
 * @param {Object} player - 玩家对象
 * @param {string} charName - 武将名
 * @returns {boolean} 该武将是否已亮将
 */
const isCharacterRevealed = (player, charName) => {
	if (!player?.isUnseen) return true; // 非国战模式，视为已亮
	// 检查主将
	if (player.name1?.includes(charName) && !player.isUnseen(0)) return true;
	// 检查副将
	if (player.name2?.includes(charName) && !player.isUnseen(1)) return true;
	return false;
};

/**
 * 检查玩家是否包含指定名称且已亮将
 * @param {Object} player - 玩家对象
 * @param {string} name - 要检查的名称
 * @returns {boolean} 是否包含该名称且已亮将
 */
const hasName = (player, name) => {
	if (get.itemtype(player) !== "player") return false;
	const nameList = get.nameList(player);
	const hasChar = nameList.some(n => n?.includes(name));
	if (!hasChar) return false;
	// 检查该武将是否已亮将
	return isCharacterRevealed(player, name);
};

/**
 * 根据名称查找玩家
 * @param {string} name - 玩家名称
 * @returns {Object|undefined} 找到的玩家对象
 */
const findPlayer = name => game.players?.find(p => hasName(p, name));

/**
 * 播放彩蛋音频
 * @param {string} file - 音频文件名
 */
const playAudio = file => game.playAudio("..", "extension", "十周年UI", `audio/caidan/${file}`);

/**
 * @type {Map<string, number>}
 * 序列状态管理器
 */
const sequenceState = new Map();

/**
 * 获取下一个序列项
 * @param {Object} rule - 彩蛋规则
 * @param {Object} ctx - 上下文对象
 * @returns {Object|null} 序列项或null
 */
const nextSequence = (rule, ctx) => {
	if (!rule.sequence?.length) return null;
	const key = rule.sequenceKey?.(ctx) || `${rule.player}-${rule.cards.join(",")}`;
	const index = sequenceState.get(key) || 0;
	sequenceState.set(key, index + 1);
	return rule.sequence[index % rule.sequence.length];
};

/**
 * 触发彩蛋语音
 * @param {Array<Object>} rules - 彩蛋规则数组
 * @param {Function} matcher - 匹配函数
 * @param {Function} getSpeaker - 获取说话者函数
 * @returns {boolean} 是否成功触发
 */
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

/**
 * 处理张飞拼点平局彩蛋
 * @param {Object} event - 拼点事件对象
 */
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

/**
 * 创建彩蛋上下文对象
 * @param {Object} event - 游戏事件
 * @param {string} cardName - 卡牌名称
 * @returns {Object} 上下文对象
 */
const createContext = (event, cardName) => ({
	card: event.card,
	player: event.player,
	targets: event.targets,
	cardName,
	hasName,
	findPlayer: name => findPlayer(name),
});

/**
 * @type {Set<Object>}
 * 已触发的游戏开始对话，防止重复触发
 */
const triggeredDialogues = new Set();

/**
 * 检查并触发游戏开始对话
 * 当所有相关武将都亮将后触发
 */
const checkAndTriggerDialogue = () => {
	for (const dialogue of gameStartDialogues) {
		if (triggeredDialogues.has(dialogue)) continue;

		// 检查所有相关武将是否都已亮将
		const allRevealed = dialogue.players.every(name => findPlayer(name));
		if (!allRevealed) continue;

		// 标记为已触发
		triggeredDialogues.add(dialogue);

		// 触发对话
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
};

/**
 * 设置音频彩蛋钩子
 * 初始化所有彩蛋触发机制
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

	// Hook: 回合开始 & 拼点 & 亮将
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

		// 亮将后检查游戏开始对话
		if (name === "showCharacterEnd") {
			checkAndTriggerDialogue();
		}

		return result;
	};

	// Hook: 游戏开始（非国战模式直接触发）
	lib.announce.subscribe("gameStart", () => {
		if (!game.players?.length) return;

		// 检查是否为国战模式（有玩家处于暗置状态）
		const isGuozhanMode = game.players.some(p => p.isUnseen?.());
		if (isGuozhanMode) {
			// 国战模式：等待亮将事件触发
			return;
		}

		// 非国战模式：直接触发
		checkAndTriggerDialogue();
	});
}
