/**
 * @fileoverview 配置项相关工具函数
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 获取从当前元素到结束标记之间的所有兄弟元素
 * @description 用于实现折叠菜单功能，收集需要隐藏/显示的菜单项
 * @param {HTMLElement} parent - 起始元素（标题元素）
 * @param {string} endId - 结束标记元素的ID
 * @returns {HTMLElement[]} 介于起始和结束标记之间的所有DOM元素
 */
export function getMenuItems(parent, endId) {
	const items = [];
	let next = parent.nextSibling;
	while (next) {
		const idEl = next.querySelector?.("[id]");
		if (idEl?.id === endId) break;
		items.push(next);
		next = next.nextSibling;
	}
	return items;
}

/**
 * 折叠菜单切换函数
 * @description 点击标题时切换菜单项的显示/隐藏状态
 * @this {HTMLElement} 标题元素
 * @param {string} configKey - 配置键名，用于存储折叠状态和元素引用
 * @param {string} title - 菜单标题文本
 * @param {string} [color="gold"] - 标题颜色
 */
export function colMenu(configKey, title, color = "gold") {
	const endId = configKey + "_end";
	const isCollapsed = !lib.config[configKey];

	if (isCollapsed) {
		lib.config[configKey] = getMenuItems(this, endId);
		this.innerHTML = `<span style='color:${color}'><font size='4'>${title}（点击展开）▷</font></span>`;
		lib.config[configKey].forEach(el => (el.style.display = "none"));
	} else {
		this.innerHTML = `<span style='color:${color}'><font size='4'>${title}（点击折叠）▽</font></span>`;
		lib.config[configKey].forEach(el => (el.style.display = ""));
		delete lib.config[configKey];
	}
}

/**
 * 创建折叠菜单标题配置
 * @param {string} key - 配置键名（不含 _end 后缀）
 * @param {string} title - 菜单标题
 * @param {string} [color="orange"] - 标题颜色
 */
export const createCollapseTitle = (key, title, color = "orange") => ({
	clear: true,
	name: `<span style='color:${color}'><font size='4'>${title}（点击折叠）▽</font></span>`,
	onclick() {
		colMenu.call(this, key, title, color);
	},
});

/**
 * 创建折叠菜单结束标记
 * @param {string} key - 配置键名（不含 _end 后缀）
 */
export const createCollapseEnd = key => ({
	clear: true,
	name: `<span id='${key}_end'></span>`,
});

/**
 * 解析输入框数值并限制范围
 * @param {HTMLElement} element
 * @param {number} defaultVal
 * @param {number} min
 * @param {number} max
 * @param {number} [decimals=0]
 * @returns {number}
 */
export const parseInputValue = (element, defaultVal, min, max, decimals = 0) => {
	element.innerHTML = element.innerHTML.replace(/<br>/g, "");
	let value = parseFloat(element.innerHTML);
	if (isNaN(value)) value = defaultVal;
	value = Math.max(min, Math.min(max, value));
	element.innerHTML = decimals > 0 ? value.toFixed(decimals) : value;
	return value;
};

/** @type {Array<{key: string, dir: string, label: string, extension: string}>} 卡牌皮肤预设 */
export const cardSkinPresets = [
	{ key: "online", dir: "online", label: "OL卡牌", extension: "jpg" },
	{ key: "caise", dir: "caise", label: "彩色卡牌", extension: "webp" },
	{ key: "decade", dir: "decade", label: "原十周年", extension: "png" },
	{ key: "bingkele", dir: "bingkele", label: "哈基米哦", extension: "png" },
	{ key: "gold", dir: "gold", label: "手杀金卡", extension: "webp" },
];

/** @type {Record<string, Object>} 卡牌皮肤元数据映射 */
export const cardSkinMeta = cardSkinPresets.reduce((map, skin) => {
	map[skin.key] = skin;
	return map;
}, {});
