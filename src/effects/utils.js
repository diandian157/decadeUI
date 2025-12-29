"use strict";

/**
 * @fileoverview 特效模块工具函数集合
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 获取玩家头像节点
 * @param {Object} player - 玩家对象
 * @param {boolean} [isUnseen=false] - 是否使用副将头像
 * @returns {HTMLElement} 头像DOM节点
 */
export function getAvatar(player, isUnseen = false) {
	return isUnseen ? player.node.avatar2 : player.node.avatar;
}

/**
 * 解析CSS url()
 * @param {string} url - CSS url字符串
 * @returns {string} 解析后的URL
 */
export function parseCssUrl(url) {
	const match = url.match(/^url\(["']?(.+?)["']?\)$/);
	return match ? match[1] : url;
}

/**
 * 创建DOM元素
 * @param {string} className - CSS类名
 * @param {HTMLElement|null} [parent=null] - 父元素
 * @param {Object} [styles={}] - 样式对象
 * @returns {HTMLElement} 创建的DOM元素
 */
export function create(className, parent = null, styles = {}) {
	const el = decadeUI.dialog.create(className, parent);
	Object.assign(el.style, styles);
	return el;
}

/**
 * 安全移除子元素
 * @param {HTMLElement} parent - 父元素
 * @param {HTMLElement} child - 子元素
 * @returns {void}
 */
export function removeChild(parent, child) {
	if (parent?.contains(child)) parent.removeChild(child);
}

/**
 * 验证玩家对象
 * @param {*} obj - 待验证对象
 * @returns {boolean} 是否为有效玩家对象
 */
export function isPlayer(obj) {
	return get.itemtype(obj) === "player";
}

/**
 * 检查图片是否存在
 * @param {string} url - 图片URL
 * @returns {Promise<boolean>} 图片是否可加载
 */
export function checkImage(url) {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;
	});
}

/**
 * 获取最优图片路径(优先立绘)
 * @param {string} originalUrl - 原始URL
 * @returns {Promise<string>} 最优图片路径
 */
export async function getOptimalPath(originalUrl) {
	const url = parseCssUrl(originalUrl);
	if (url.includes("image/lihui")) return url;

	if (url.includes("image/character")) {
		const lihuiPath = url.replace(/image\/character/, "image/lihui");
		if (await checkImage(lihuiPath)) return lihuiPath;
	}
	return url;
}

/**
 * 获取默认头像路径
 * @param {Object} player - 玩家对象
 * @returns {string} 默认头像路径
 */
export function getDefaultAvatar(player) {
	const gender = player.sex === "female" ? "female" : "male";
	return `${lib.assetURL}image/character/default_silhouette_${gender}.jpg`;
}

/**
 * 生成随机位置(用于击杀特效光效)
 * @param {number} height - 窗口高度
 * @returns {{x: string, y: string, scale: number}} 随机位置和缩放
 */
export function randomPosition(height) {
	const signX = decadeUI.getRandom(0, 1) ? "" : "-";
	const signY = decadeUI.getRandom(0, 1) ? "" : "-";
	return {
		x: `${signX}${decadeUI.getRandom(0, 100)}px`,
		y: `${signY}${decadeUI.getRandom(0, height / 4)}px`,
		scale: decadeUI.getRandom(1, 10) / 10,
	};
}

/**
 * 获取玩家显示名
 * @param {Object} player - 玩家对象
 * @param {boolean} [useName2=false] - 是否使用副将名
 * @returns {string} 玩家显示名
 */
export function getName(player, useName2 = false) {
	const name = useName2 ? player.name2 : player.name;
	return name ? get.slimNameHorizontal(name) : "";
}

/**
 * 驼峰转kebab-case
 * @param {string} str - 驼峰字符串
 * @returns {string} kebab-case字符串
 */
export function toKebab(str) {
	return str.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
}
