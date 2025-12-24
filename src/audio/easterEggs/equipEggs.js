"use strict";

/**
 * 装备相关彩蛋配置
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
	{ cards: ["guding"], player: "", speaker: "xusheng", condition: ctx => !ctx.hasName(ctx.player, "xusheng") && ctx.findPlayer?.("xusheng"), text: "我刀呢？", audio: "xusheng3.mp3" },
];
