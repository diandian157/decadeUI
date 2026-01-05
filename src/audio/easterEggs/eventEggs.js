/**
 * @fileoverview 事件彩蛋配置
 * 定义受伤、死亡、回合开始等事件触发的彩蛋语音规则
 */

"use strict";

/**
 * @type {Array<Object>}
 * 受伤彩蛋配置数组
 */
export const damageEasterEggs = [
	{ player: "diaochan", text: "嗯啊~", audio: "diaochan1.mp3" },
	{ player: "simayi", text: "记住，耐不住性子是成不了事的", audio: "simayi3.mp3" },
];

/**
 * @type {Array<Object>}
 * 死亡彩蛋配置数组
 */
export const deathEasterEggs = [
	{ deceased: "yuanshao", speaker: "caocao", text: "今本初已丧，我不能不为之流涕也", audio: "caocao7.mp3" },
	{ deceased: "liuhong", speaker: "zhangjiao", text: "带着你的大汉，去死吧！", audio: "zhangjiao2.mp3" },
];

/**
 * @type {Array<Object>}
 * 回合开始彩蛋配置数组
 */
export const phaseStartEasterEggs = [
	{ player: "caiwenji", text: "聆听吧，这是献给你的镇魂曲（", audio: "caiwenji1.mp3" },
	{ player: "sunhao", text: "朕的天下，都在碗底！", audio: "sunhao4.mp3" },
];
