/**
 * @fileoverview 核心工具函数 - 提供通用的工具方法
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 判断当前是否为移动端环境
 * 只有真实移动设备才算mobile，PC触屏布局不算
 * @returns {boolean} 是否为移动端
 */
export function isMobile() {
	return lib.device === "android" || lib.device === "ios";
}

/**
 * 获取指定范围内的随机整数
 * @param {number} [min=-2147483648] - 最小值
 * @param {number} [max=2147483648] - 最大值
 * @returns {number} 随机整数
 */
export function getRandom(min = -2147483648, max = 2147483648) {
	if (min > max) [min, max] = [max, min];
	return Math.floor(Math.random() * (max + 1 - min)) + min;
}

/**
 * 获取两个元素之间的相对位置
 * @param {HTMLElement} elementFrom - 源元素
 * @param {HTMLElement} elementTo - 目标元素
 * @returns {{x: number, y: number, left: number, top: number}|null} 相对位置对象
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
 * 延迟移除卡牌元素
 * @param {HTMLElement[]|HTMLElement} cards - 卡牌元素或数组
 * @param {number} delay - 延迟时间(毫秒)
 * @param {number} [fadeDelay] - 淡出动画延迟(毫秒)
 * @returns {void}
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
