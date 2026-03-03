/**
 * @fileoverview 音频彩蛋钩子模块
 * 提供游戏中各种彩蛋语音的触发机制，包括卡牌使用、受伤、死亡、回合开始等事件
 */

"use strict";

import { lib, game, get, _status } from "noname";
import { cardEasterEggs } from "./easterEggs/cardEasterEggs.js";
import { damageEasterEggs, deathEasterEggs, phaseStartEasterEggs } from "./easterEggs/eventEggs.js";
import { gameStartDialogues } from "./easterEggs/dialogueEggs.js";

/**
 * @type {Array<Object>}
 * 所有卡牌彩蛋配置
 */
const allCardEasterEggs = cardEasterEggs;

/**
 * 检查武将名是否已亮将（非暗置状态）
 * @param {Object} player - 玩家对象
 * @param {string} charName - 武将名
 * @returns {boolean} 该武将是否已亮将
 */
const isCharacterRevealed = (player, charName) => {
	if (!player?.isUnseen) return true;

	const replaceList = lib.characterReplace?.[charName] || [charName];

	if (player.name1 && replaceList.includes(player.name1) && !player.isUnseen(0)) return true;
	if (player.name2 && replaceList.includes(player.name2) && !player.isUnseen(1)) return true;
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

	const replaceList = lib.characterReplace?.[name] || [name];
	const hasChar = nameList.some(n => replaceList.includes(n));

	if (!hasChar) return false;
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
 * @param {string} file - 音频文件名（支持相对路径，如 "hajimi/tangmu.mp3"）
 */
const playAudio = file => {
	const audioPath = file.includes("/") ? `audio/${file}` : `audio/caidan/${file}`;
	game.playAudio("..", "extension", "十周年UI", audioPath);
};

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
		const text = seq?.text || rule.text;
		if (text) speaker.say?.(text);
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

		const allRevealed = dialogue.players.every(name => findPlayer(name));
		if (!allRevealed) continue;

		triggeredDialogues.add(dialogue);

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
 * 匹配彩蛋规则（声明式配置）
 * @param {Object} rule - 彩蛋规则
 * @param {Object} ctx - 上下文对象
 * @returns {boolean} 是否匹配
 */
const matchCardEasterEgg = (rule, ctx) => {
	if (!rule.cards.includes(ctx.cardName)) return false;

	if (rule.player && !hasName(ctx.player, rule.player)) return false;
	if (rule.player === "" && rule.speaker && hasName(ctx.player, rule.speaker)) return false;

	if (rule.group && ctx.player?.group !== rule.group) return false;

	if (rule.needPlayer && !findPlayer(rule.needPlayer)) return false;

	if (rule.targetHas) {
		const names = Array.isArray(rule.targetHas) ? rule.targetHas : [rule.targetHas];
		const hasTarget = ctx.targets?.some(t => names.some(n => hasName(t, n)));
		if (!hasTarget) return false;
	}

	if (rule.targetGroup) {
		const hasTargetGroup = ctx.targets?.some(t => t.group === rule.targetGroup);
		if (!hasTargetGroup) return false;
	}

	if (rule.condition && !rule.condition(ctx)) return false;

	return true;
};

/**
 * 设置音频彩蛋钩子
 * 初始化所有彩蛋触发机制
 */
export function setupAudioHooks() {
	const originalUseCard = lib.element.Player.prototype.useCard;
	lib.element.Player.prototype.useCard = function (...args) {
		const event = originalUseCard.apply(this, args);
		if (!event?.card || !event?.player) return event;
		if (!lib.config.extension_十周年UI_audioEasterEggs) return event;

		const cardName = get.name(event.card, event.player);
		const ctx = createContext(event, cardName);

		for (const rule of allCardEasterEggs) {
			if (!matchCardEasterEgg(rule, ctx)) continue;

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

	const originalDamage = lib.element.Player.prototype.damage;
	lib.element.Player.prototype.damage = function (...args) {
		const event = originalDamage.apply(this, args);
		if (!lib.config.extension_十周年UI_audioEasterEggs) return event;

		event?.then(() => {
			const damaged = event?.player || this;
			if (!damaged) return;
			triggerEasterEgg(
				damageEasterEggs,
				rule => {
					const players = Array.isArray(rule.player) ? rule.player : [rule.player];
					if (!players.some(p => hasName(damaged, p))) return false;
					if (rule.nature && event.nature !== rule.nature) return false;
					return true;
				},
				() => damaged
			);
		});
		return event;
	};

	const originalDie = lib.element.Player.prototype.$die;
	lib.element.Player.prototype.$die = function (...args) {
		const result = originalDie.apply(this, args);
		if (!lib.config.extension_十周年UI_audioEasterEggs) return result;

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

	const originalTrigger = lib.element.GameEvent.prototype.trigger;
	lib.element.GameEvent.prototype.trigger = function (name) {
		const result = originalTrigger.apply(this, arguments);

		if (lib.config.extension_十周年UI_audioEasterEggs) {
			if (name === "phaseBeginStart" && _status.currentPhase) {
				triggerEasterEgg(
					phaseStartEasterEggs,
					rule => hasName(_status.currentPhase, rule.player),
					() => _status.currentPhase
				);
			}

			if (name === "chooseToCompareAfter" || (name === "compare" && ["chooseToCompare", "chooseToCompareMultiple"].includes(this.name))) {
				handleZhangfeiTie(this);
			}

			if (name === "showCharacterEnd") {
				checkAndTriggerDialogue();
			}
		}

		return result;
	};

	lib.announce.subscribe("gameStart", () => {
		if (!game.players?.length) return;
		if (!lib.config.extension_十周年UI_audioEasterEggs) return;

		const isGuozhanMode = game.players.some(p => p.isUnseen?.());
		if (isGuozhanMode) return;

		checkAndTriggerDialogue();
	});
}
