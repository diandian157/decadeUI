/**
 * @fileoverview 整体外观配置定义
 * @description 纯配置数据，不包含业务逻辑
 * @module config/definitions/appearance
 */
import { createCollapseTitle, createCollapseEnd } from "../utils.js";
import { onExtensionToggleClick, onExtensionToggleUpdate, onNewDecadeStyleClick, onNewDecadeStyleUpdate, onOutcropSkinClick, onOutcropSkinUpdate, onBorderLevelUpdate, onAloneEquipUpdate, onMeanPrettifyClick, onDynamicSkinClick, onDynamicSkinOutcropUpdate } from "../handlers/appearance-handlers.js";
import { updateManager } from "../../updater/index.js";
import { game } from "noname";

/**
 * 扩展开关配置
 * @type {Object}
 */
export const extensionToggle = {
	clear: true,
	onclick: onExtensionToggleClick,
	update: onExtensionToggleUpdate,
};

/**
 * 调试助手配置
 * @type {Object}
 */
export const eruda = {
	name: "调试助手",
	init: false,
};

/**
 * 自动检查更新配置
 * @type {Object}
 */
export const autoCheckUpdate = {
	name: "自动检查更新",
	intro: "启动游戏时自动检查更新（静默模式，不打扰游戏）",
	init: false,
	onclick(checked) {
		game.saveExtensionConfig("十周年UI", "autoCheckUpdate", checked);
		if (checked) {
			updateManager.enableAutoCheck();
		} else {
			updateManager.disableAutoCheck();
		}
	},
};

/**
 * 手动检查更新按钮
 * @type {Object}
 */
export const checkUpdate = {
	clear: true,
	name: '<button style="width:100%; padding:12px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:bold; transition:all 0.3s;">🔄 检查更新</button>',
	intro: "立即检查并安装更新",
	onclick: async function () {
		try {
			await updateManager.autoUpdate(false);
		} catch (error) {
			alert(`更新失败：${error.message}`);
		}
	},
};

/**
 * 整体外观折叠标题
 * @type {Object}
 */
export const outward_title = createCollapseTitle("outward_title", "整体外观");

/**
 * 切换样式配置
 * @type {Object}
 */
export const newDecadeStyle = {
	name: "切换样式",
	intro: "切换武将边框样式和界面布局，选择不同设置后游戏会自动重启，电脑端支持alt+123456快捷切换",
	init: "on",
	item: {
		on: "十周年",
		off: "移动版",
		othersOff: "一将成名",
		onlineUI: "online",
		babysha: "欢乐三国杀",
		codename: "名将杀",
	},
	onclick: onNewDecadeStyleClick,
	update: onNewDecadeStyleUpdate,
};

/**
 * 露头样式配置
 * @type {Object}
 */
export const outcropSkin = {
	name: "露头样式",
	init: "off",
	item: { shizhounian: "十周年露头", shousha: "手杀露头", off: "关闭" },
	update: onOutcropSkinUpdate,
	onclick: onOutcropSkinClick,
};

/**
 * 等阶边框配置
 * @type {Object}
 */
export const borderLevel = {
	name: "等阶边框",
	init: "five",
	item: { one: "一阶", two: "二阶", three: "三阶", four: "四阶", five: "五阶", random: "随机" },
	update: onBorderLevelUpdate,
};

/**
 * 单独装备栏配置
 * @type {Object}
 */
export const aloneEquip = {
	name: "单独装备栏",
	intro: "切换玩家装备栏为单独装备栏或非单独装备栏",
	init: true,
	update: onAloneEquipUpdate,
};

/**
 * 菜单美化配置
 * @type {Object}
 */
export const meanPrettify = {
	name: "菜单美化",
	intro: "开启全屏的菜单样式",
	init: false,
	onclick: onMeanPrettifyClick,
};

/**
 * 动态皮肤配置
 * @type {Object}
 */
export const dynamicSkin = {
	name: "动态皮肤",
	intro: "开启后显示动态皮肤，阵亡后也保留",
	init: false,
	onclick: onDynamicSkinClick,
};

/**
 * 动皮露头配置
 * @type {Object}
 */
export const dynamicSkinOutcrop = {
	name: "动皮露头",
	init: false,
	update: onDynamicSkinOutcropUpdate,
};

/**
 * 击杀特效配置
 * @type {Object}
 */
export const killEffect = {
	name: "击杀特效",
	intro: "开启后，击杀敌方角色时会显示击杀特效",
	init: true,
};

/**
 * 整体外观折叠结束标记
 * @type {Object}
 */
export const outward_title_end = createCollapseEnd("outward_title");

/**
 * 整体外观配置集合
 * @type {Object}
 */
export const appearanceConfigs = {
	extensionToggle,
	eruda,
	autoCheckUpdate,
	checkUpdate,
	outward_title,
	newDecadeStyle,
	outcropSkin,
	borderLevel,
	aloneEquip,
	meanPrettify,
	dynamicSkin,
	dynamicSkinOutcrop,
	killEffect,
	outward_title_end,
};
