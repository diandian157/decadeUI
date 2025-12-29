/**
 * @fileoverview 边界缓存工具 - 用于缓存和管理DOM元素的位置与尺寸信息
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 边界缓存类 - 缓存元素的位置和尺寸，支持延迟更新
 */
export class BoundsCache {
	/**
	 * @param {HTMLElement|null} element - 要缓存的DOM元素
	 * @param {Function} [updateBefore] - 更新前的回调函数
	 */
	constructor(element, updateBefore) {
		this.element = element;
		this.updateBefore = updateBefore;
		this.updated = false;
		this._x = 0;
		this._y = 0;
		this._width = 0;
		this._height = 0;
	}

	get x() {
		if (!this.updated) this.update();
		return this._x;
	}

	set x(value) {
		this._x = value;
	}

	get y() {
		if (!this.updated) this.update();
		return this._y;
	}

	set y(value) {
		this._y = value;
	}

	get width() {
		if (!this.updated) this.update();
		return this._width;
	}

	set width(value) {
		this._width = value;
	}

	get height() {
		if (!this.updated) this.update();
		return this._height;
	}

	set height(value) {
		this._height = value;
	}

	/**
	 * 检查并更新缓存（如未更新则触发更新）
	 * @returns {void}
	 */
	check() {
		if (!this.updated) this.update();
	}

	/**
	 * 强制更新缓存数据
	 * @returns {void}
	 */
	update() {
		if (this.updateBefore) this.updateBefore.call(this);
		const element = this.element;
		this.updated = true;
		if (!element) return;
		this._x = element.offsetLeft;
		this._y = element.offsetTop;
		this._width = element.offsetWidth;
		this._height = element.offsetHeight;
	}
}

/**
 * 创建边界缓存集合
 * @param {Object} decadeUI - DecadeUI实例
 * @returns {{window: BoundsCache, arena: BoundsCache, hand: BoundsCache}} 缓存集合
 */
export function createBoundsCaches(decadeUI) {
	const caches = {};

	caches.window = new BoundsCache(null, function () {
		this.element = window.ui?.window;
	});

	caches.arena = new BoundsCache(null, function () {
		this.element = window.ui?.arena;
		if (!window.ui?.arena) return;
		this.cardScale = decadeUI.getCardBestScale?.();
		if (this.cardWidth != null) return;

		// 查找现有卡牌获取尺寸
		for (const child of window.ui.arena.childNodes) {
			if (child.classList?.contains("card")) {
				this.cardWidth = child.offsetWidth;
				this.cardHeight = child.offsetHeight;
				return;
			}
		}

		// 创建临时卡牌测量尺寸
		const card = decadeUI.element?.create?.("card") || document.createElement("div");
		if (!card.className) card.className = "card";
		card.style.opacity = "0";
		window.ui.arena.appendChild(card);
		this.cardWidth = card.offsetWidth;
		this.cardHeight = card.offsetHeight;
		card.remove();
	});

	caches.hand = new BoundsCache(null, function () {
		this.element = window.ui?.me;
		if (!window.ui?.handcards1) return;
		this.cardScale = decadeUI.getCardBestScale?.();
		if (this.cardWidth != null) return;

		// 查找现有卡牌获取尺寸
		for (const child of window.ui.handcards1.childNodes) {
			if (child.classList?.contains("card")) {
				this.cardWidth = child.offsetWidth;
				this.cardHeight = child.offsetHeight;
				return;
			}
		}

		// 创建临时卡牌测量尺寸
		const card = decadeUI.element?.create?.("card") || document.createElement("div");
		if (!card.className) card.className = "card";
		card.style.opacity = "0";
		window.ui.handcards1.appendChild(card);
		this.cardWidth = card.offsetWidth;
		this.cardHeight = card.offsetHeight;
		card.remove();
	});

	return caches;
}
