/**
 * @fileoverview 布局工具函数模块
 * 提供卡牌布局绘制相关的工具函数
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 布局手牌绘制位置
 * @param {Array} cards - 卡牌数组
 * @param {object} boundsCaches - 边界缓存对象
 */
export function layoutHandDraws(cards, boundsCaches) {
	const bounds = boundsCaches.hand;
	bounds.check();

	const pw = bounds.width;
	const cw = bounds.cardWidth;
	const ch = bounds.cardHeight;
	const cs = bounds.cardScale;
	const csw = cw * cs;

	/** @type {Array} */
	const draws = [];
	const source = cards.duiMod;

	// 来源玩家不是自己时的处理
	if (source && source !== window.game?.me) {
		source.checkBoundsCache?.();
		let xMargin = 27;
		let xStart = source.cacheLeft - bounds.x - csw / 2 - (cw - csw) / 2;
		let totalW = xMargin * cards.length + (csw - xMargin);
		const limitW = source.cacheWidth + csw;

		if (totalW > limitW) {
			xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
		} else {
			xStart += (limitW - totalW) / 2;
		}

		const y = Math.round(source.cacheTop - bounds.y - 30 + (source.cacheHeight - ch) / 2);

		for (let i = 0; i < cards.length; i++) {
			const x = Math.round(xStart + i * xMargin);
			const card = cards[i];
			card.tx = x;
			card.ty = y;
			card.fixed = true;
			card.scaled = true;
			card.style.transform = `translate(${x}px, ${y}px) scale(${cs})`;
		}
		return;
	}

	// 处理有克隆的卡牌
	for (let i = 0; i < cards.length; i++) {
		const card = cards[i];
		const clone = card.clone;
		if (clone && !clone.fixed && clone.parentNode === window.ui?.arena) {
			const x = Math.round(clone.tx - bounds.x);
			const y = Math.round(clone.ty - (bounds.y + 30));
			card.tx = x;
			card.ty = y;
			card.scaled = true;
			card.style.transform = `translate(${x}px, ${y}px) scale(${cs})`;
		} else {
			draws.push(card);
		}
	}

	// 处理需要绘制的卡牌
	const y = Math.round(-ch * cs * 2);
	const xMargin = csw * 0.5;
	const xStart = (pw - xMargin * (draws.length + 1)) / 2 - (cw - csw) / 2;

	for (let i = 0; i < draws.length; i++) {
		const x = Math.round(xStart + i * xMargin);
		const card = draws[i];
		card.tx = x;
		card.ty = y;
		card.scaled = true;
		card.style.transition = "transform 400ms ease-out";
		card.style.transform = `translate(${x}px, ${y}px) scale(${cs})`;
	}
}

/**
 * 布局绘制卡牌到玩家位置
 * @param {Array} cards - 卡牌数组
 * @param {HTMLElement} player - 玩家元素
 * @param {boolean} center - 是否居中
 * @param {object} boundsCaches - 边界缓存对象
 */
export function layoutDrawCards(cards, player, center, boundsCaches) {
	const bounds = boundsCaches.arena;
	if (!bounds.updated) bounds.update();

	player.checkBoundsCache?.();

	const playerX = player.cacheLeft;
	const playerY = player.cacheTop;
	const playerW = player.cacheWidth;
	const playerH = player.cacheHeight;
	const pw = bounds.width;
	const ph = bounds.height;
	const cw = bounds.cardWidth;
	const ch = bounds.cardHeight;
	const cs = bounds.cardScale;
	const csw = cw * cs;

	let xMargin = 27;
	let xStart = (center ? (pw - playerW) / 2 : playerX) - csw / 2 - (cw - csw) / 2;
	let totalW = xMargin * cards.length + (csw - xMargin);
	const limitW = playerW + csw;

	if (totalW > limitW) {
		xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
	} else {
		xStart += (limitW - totalW) / 2;
	}

	const y = center ? Math.round((ph - ch) / 2) : Math.round(playerY + (playerH - ch) / 2);

	for (let i = 0; i < cards.length; i++) {
		const x = Math.round(xStart + i * xMargin);
		const card = cards[i];
		card.tx = x;
		card.ty = y;
		card.scaled = true;
		card.style.transform = `translate(${x}px, ${y}px) scale(${cs})`;
	}
}
