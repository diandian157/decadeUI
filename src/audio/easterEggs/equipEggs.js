/**
 * @fileoverview 装备相关彩蛋配置
 * 定义装备卡牌使用时触发的彩蛋语音规则
 *
 * 配置字段说明：
 * - cards: 触发卡牌名称数组
 * - player: 使用者武将名（可选，空字符串表示任意玩家）
 * - needPlayer: 场上需存在的武将名（可选）
 * - speaker: 语音播放者武将名（可选）
 * - target: 语音播放者武将名，默认为 player（可选）
 * - text: 彩蛋台词
 * - audio: 音频文件名
 * - sequence: 序列台词数组，循环播放（可选）
 * - sequenceKey: 序列状态键生成函数（可选）
 * - condition: 复杂条件函数，用于无法用声明式表达的场景（可选）
 */

"use strict";

/**
 * @type {Array<Object>}
 * 装备彩蛋配置数组
 */
export const equipEasterEggs = [
	{ cards: ["zhangba"], player: "zhangfei", text: "得此神兵，某自当纵横天下！", audio: "zhangfei4.mp3" },
	{
		cards: ["zhangba"],
		player: "liuyan",
		sequence: [
			{ text: "奇哉怪也，此物怎会在我手中？", audio: "liuyan1.mp3" },
			{ text: "这丈八不会打断了吧。", audio: "liuyan3.mp3" },
			{ text: "我得此等好兵器，可用九鼎烹鹿！", audio: "liuyan4.mp3" },
		],
		sequenceKey: () => "liuyan",
	},
	{ cards: ["chitu"], player: "lvbu", text: "赤兔马，我们走！", audio: "lvbu2.mp3" },
	{ cards: ["fangtian"], player: "lvbu", text: "得方天画戟，弑天下群雄！", audio: "lvbu3.mp3" },
	{ cards: ["qilin"], player: "lvbu", text: "辕门射戟，箭无虚发！", audio: "lvbu4.mp3" },
	{ cards: ["qinggang"], player: "caocao", text: "此剑，终物归原主！", audio: "caocao11.mp3" },
	{ cards: ["qinglong"], player: "guanyu", text: "青龙在手，可斩天下豪杰！", audio: "guanyu1.mp3" },
	{ cards: ["chitu"], player: "guanyu", text: "得此宝马，兄虽距千里，亦可一夕而至！", audio: "guanyu2.mp3" },
	{ cards: ["dilu"], player: "liubei", text: "乘良驹渡险，愿盘息冲天！", audio: "liubei1.mp3" },
	{ cards: ["qinggang"], player: "zhaoyun", text: "宝剑，自当配于英雄！", audio: "zhaoyun2.mp3" },
	{ cards: ["guding"], player: "xusheng", text: "在下，要给诸位来刀狠的", audio: "xusheng2.mp3" },
	{ cards: ["guding"], player: "", speaker: "xusheng", needPlayer: "xusheng", text: "我刀呢？", audio: "xusheng3.mp3" },
	{ cards: ["guding"], player: "sunjian", text: "看着我的刀再说一遍！", audio: "sunjian3.mp3" },
];
