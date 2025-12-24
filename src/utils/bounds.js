/**
 * 边界缓存类
 * @description 从concore.js提取的BoundsCache类
 */

/**
 * 边界缓存类 - 用于缓存元素的位置和尺寸
 */
export class BoundsCache {
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
	 * 检查并更新缓存
	 */
	check() {
		if (!this.updated) this.update();
	}

	/**
	 * 更新缓存
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
 * @param {object} decadeUI DecadeUI实例
 */
export function createBoundsCaches(decadeUI) {
	const caches = {};

	caches.window = new BoundsCache(null, function () {
		this.element = window.ui?.window;
	});

	caches.arena = new BoundsCache(null, function () {
		this.element = window.ui?.arena;
		if (!window.ui?.arena) return;
		this.cardScale = decadeUI.getCardBestScale?.() || window.dui?.getCardBestScale?.();
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
		this.cardScale = decadeUI.getCardBestScale?.() || window.dui?.getCardBestScale?.();
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
