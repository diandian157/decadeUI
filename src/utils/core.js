/**
 * 核心工具函数
 * @description 从concore.js提取的独立工具函数
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 判断是否移动端
 */
export function isMobile() {
	return get.is.phoneLayout() || lib.device === "android" || lib.device === "ios";
}

/**
 * 获取随机数
 * @param {number} min 最小值
 * @param {number} max 最大值
 */
export function getRandom(min = -2147483648, max = 2147483648) {
	if (min > max) [min, max] = [max, min];
	return Math.floor(Math.random() * (max + 1 - min)) + min;
}

/**
 * 获取元素映射位置
 * @param {HTMLElement} elementFrom 源元素
 * @param {HTMLElement} elementTo 目标元素
 */
export function getMapElementPos(elementFrom, elementTo) {
	if (!(elementFrom instanceof HTMLElement) || !(elementTo instanceof HTMLElement)) {
		console.error("getMapElementPos: 参数必须是HTMLElement");
		return null;
	}
	const rectFrom = elementFrom.getBoundingClientRect();
	const rectTo = elementTo.getBoundingClientRect();
	return {
		x: rectFrom.left - rectTo.left,
		y: rectFrom.top - rectTo.top,
		left: rectFrom.left - rectTo.left,
		top: rectFrom.top - rectTo.top,
	};
}

/**
 * 延迟移除卡牌
 * @param {Array|HTMLElement} cards 卡牌元素
 * @param {number} delay 延迟时间
 * @param {number} fadeDelay 淡出延迟
 */
export function delayRemoveCards(cards, delay, fadeDelay) {
	if (!Array.isArray(cards)) cards = [cards];
	setTimeout(() => {
		if (fadeDelay == null) {
			cards.forEach(card => card.remove());
			return;
		}
		cards.forEach(card => card.classList.add("removing"));
		setTimeout(() => cards.forEach(card => card.remove()), fadeDelay);
	}, delay);
}
