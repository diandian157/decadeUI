/**
 * @fileoverview 小小玩楞配置定义
 * @description 纯配置数据，不包含业务逻辑
 * @module config/definitions/misc
 */
import { createCollapseTitle, createCollapseEnd } from "../utils.js";

/**
 * 小小玩楞折叠标题
 * @type {Object}
 */
export const stuff_title = createCollapseTitle("stuff_title", "小小玩楞");

/**
 * 更多音效配置
 * @type {Object}
 */
export const bettersound = {
	name: "更多音效",
	intro: "开启后，点击卡牌或按钮和出牌弃牌会有音效播放",
	init: true,
};

/**
 * 中二模式配置
 * @type {Object}
 */
export const skillDieAudio = {
	name: "中二模式",
	intro: "众所周知，使用技能前需要吟唱。",
	init: true,
};

/**
 * 武将背景配置
 * @type {Object}
 */
export const wujiangbeijing = {
	name: "武将背景",
	init: true,
	intro: "开启后，单双将和国战模式将用设置好的武将背景",
};

/**
 * 官方势力配置
 * @type {Object}
 */
export const shiliyouhua = {
	name: "官方势力",
	init: true,
	intro: "开启后，非魏蜀吴群晋势力的角色将会重新选择势力",
};

/**
 * 重铸交互配置
 * @type {Object}
 */
export const enableRecastInteraction = {
	name: "重铸交互（Beta）",
	init: true,
	intro: "开启后，可重铸卡牌可以通过不选目标直接重铸，无需额外操作，重启生效",
};

/**
 * 自由选将筛选框配置
 * @type {Object}
 */
export const mx_decade_characterDialog = {
	name: "自由选将筛选框",
	init: "extension-OL-system",
	intro: "更改自由选将筛选框",
	item: {
		default: "默认本体框",
		"extension-OL-system": "扩展内置框",
		offDialog: "关闭筛选框",
	},
};

/**
 * 小小玩楞折叠结束标记
 * @type {Object}
 */
export const stuff_title_end = createCollapseEnd("stuff_title");

/**
 * 小小玩楞配置集合
 * @type {Object}
 */
export const miscConfigs = {
	stuff_title,
	bettersound,
	skillDieAudio,
	wujiangbeijing,
	shiliyouhua,
	mx_decade_characterDialog,
	enableRecastInteraction,
	stuff_title_end,
};
