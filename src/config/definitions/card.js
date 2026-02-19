/**
 * @fileoverview 卡牌相关配置定义
 * @description 纯配置数据，不包含业务逻辑
 * @module config/definitions/card
 */
import { createCollapseTitle, createCollapseEnd, cardSkinPresets } from "../utils.js";
import {
	onCardGhostEffectClick,
	onAutoSelectClick,
	onAutoSelectUpdate,
	onHandTipHeightBlur,
	onHandTipHeightUpdate,
	onCardScaleBlur,
	onCardScaleUpdate,
	onDiscardScaleBlur,
	onDiscardScaleUpdate,
	onHandFoldMinBlur,
	onHandFoldMinUpdate,
	onCardPrettifyClick,
	onCardkmhClick,
	onCardkmhUpdate,
	onChupaizhishiUpdate,
} from "../handlers/card-handlers.js";

/**
 * 卡牌相关折叠标题
 * @type {Object}
 */
export const card_title = createCollapseTitle("card_title", "卡牌相关");

/**
 * 幻影出牌配置
 * @type {Object}
 */
export const cardGhostEffect = {
	name: "幻影出牌",
	intro: "开启后，卡牌打出或摸牌时会产生幻影拖尾效果，性能杀手请注意",
	init: true,
	onclick: onCardGhostEffectClick,
};

/**
 * 自动选择配置
 * @type {Object}
 */
export const autoSelect = {
	name: "自动选择",
	intro: "开启后会关闭自动确认，自动选择单个合法目标和手牌，重启生效",
	init: true,
	onclick: onAutoSelectClick,
	update: onAutoSelectUpdate,
};

/**
 * 出牌信息提示配置
 * @type {Object}
 */
export const cardPrompt = {
	name: "出牌信息提示",
	init: true,
};

/**
 * 出牌信息提示高度配置
 * @type {Object}
 */
export const handTipHeight = {
	name: "出牌信息提示高度",
	init: "20",
	intro: "输入0~100的数值，设置手牌提示框的底部高度百分比（默认值为20）",
	input: true,
	onblur: onHandTipHeightBlur,
	update: onHandTipHeightUpdate,
};

/**
 * 手牌大小配置
 * @type {Object}
 */
export const cardScale = {
	name: "手牌大小",
	intro: "输入0.10~1.00的小数，回车保存并生效",
	init: "0.18",
	input: true,
	onblur: onCardScaleBlur,
	update: onCardScaleUpdate,
};

/**
 * 弃牌堆卡牌大小配置
 * @type {Object}
 */
export const discardScale = {
	name: "弃牌堆卡牌大小",
	intro: "输入0.10~1.00的小数，回车保存并生效",
	init: "0.14",
	input: true,
	onblur: onDiscardScaleBlur,
	update: onDiscardScaleUpdate,
};

/**
 * 手牌折叠最小间距配置
 * @type {Object}
 */
export const handFoldMin = {
	name: "手牌折叠",
	intro: "输入数值，控制手牌折叠时的最小间距（默认值为9，建议不要超过80）",
	init: "9",
	input: true,
	onblur: onHandFoldMinBlur,
	update: onHandFoldMinUpdate,
};

/**
 * 卡牌美化配置
 * @type {Object}
 */
export const cardPrettify = {
	name: "卡牌美化",
	init: "decade",
	item: cardSkinPresets.reduce(
		(options, skin) => {
			options[skin.key] = skin.label;
			return options;
		},
		{ off: "关闭" }
	),
	onclick: onCardPrettifyClick,
};

/**
 * 卡牌边框配置
 * @type {Object}
 */
export const cardkmh = {
	name: "卡牌边框",
	init: "off",
	item: { off: "关闭", kuang1: "大司马", kuang2: "大将军", kuang3: "国都护" },
	onclick: onCardkmhClick,
	update: onCardkmhUpdate,
};

/**
 * 出牌指示配置
 * @type {Object}
 */
export const chupaizhishi = {
	name: "出牌指示",
	intro: "切换目标指示特效",
	init: "off",
	item: {
		jiangjun: "将军",
		weijiangjun: "卫将军",
		cheqijiangjun: "车骑将军",
		biaoqijiangjun: "骠骑将军",
		dajiangjun: "大将军",
		dasima: "大司马",
		shoushaX: "手杀经典",
		shousha: "手杀新版",
		random: "随机",
		off: "关闭",
	},
	update: onChupaizhishiUpdate,
};

/**
 * 卡牌相关折叠结束标记
 * @type {Object}
 */
export const card_title_end = createCollapseEnd("card_title");

/**
 * 卡牌相关配置集合
 * @type {Object}
 */
export const cardConfigs = {
	card_title,
	cardGhostEffect,
	autoSelect,
	cardPrompt,
	handTipHeight,
	cardScale,
	discardScale,
	handFoldMin,
	cardPrettify,
	cardkmh,
	chupaizhishi,
	card_title_end,
};
