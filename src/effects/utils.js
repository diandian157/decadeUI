"use strict";

/**
 * 特效工具函数
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** 获取玩家头像节点 */
export function getAvatar(player, isUnseen = false) {
	return isUnseen ? player.node.avatar2 : player.node.avatar;
}

/** 解析CSS url() */
export function parseCssUrl(url) {
	const match = url.match(/^url\(["']?(.+?)["']?\)$/);
	return match ? match[1] : url;
}

/** 创建DOM元素 */
export function create(className, parent = null, styles = {}) {
	const el = decadeUI.dialog.create(className, parent);
	Object.assign(el.style, styles);
	return el;
}

/** 安全移除子元素 */
export function removeChild(parent, child) {
	if (parent?.contains(child)) parent.removeChild(child);
}

/** 验证玩家对象 */
export function isPlayer(obj) {
	return get.itemtype(obj) === "player";
}

/** 检查图片是否存在 */
export function checkImage(url) {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;
	});
}

/** 获取最优图片路径(优先立绘) */
export async function getOptimalPath(originalUrl) {
	const url = parseCssUrl(originalUrl);
	if (url.includes("image/lihui")) return url;

	if (url.includes("image/character")) {
		const lihuiPath = url.replace(/image\/character/, "image/lihui");
		if (await checkImage(lihuiPath)) return lihuiPath;
	}
	return url;
}

/** 获取默认头像路径 */
export function getDefaultAvatar(player) {
	const gender = player.sex === "female" ? "female" : "male";
	return `${lib.assetURL}image/character/default_silhouette_${gender}.jpg`;
}

/** 生成随机位置(用于击杀特效光效) */
export function randomPosition(height) {
	const signX = decadeUI.getRandom(0, 1) ? "" : "-";
	const signY = decadeUI.getRandom(0, 1) ? "" : "-";
	return {
		x: `${signX}${decadeUI.getRandom(0, 100)}px`,
		y: `${signY}${decadeUI.getRandom(0, height / 4)}px`,
		scale: decadeUI.getRandom(1, 10) / 10,
	};
}

/** 获取玩家显示名 */
export function getName(player, useName2 = false) {
	const name = useName2 ? player.name2 : player.name;
	return name ? get.slimNameHorizontal(name) : "";
}

/** 驼峰转kebab-case */
export function toKebab(str) {
	return str.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
}
