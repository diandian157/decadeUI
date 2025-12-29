/**
 * @fileoverview 手牌提示模块
 * 提供手牌提示的创建、显示、隐藏等功能
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建手牌提示
 * @param {string} text - 提示文本
 * @param {object} decadeUI - DecadeUI实例
 * @returns {HTMLElement} 提示元素
 */
export function showHandTip(text, decadeUI) {
	/** @type {HTMLElement[]} */
	const tips = decadeUI.statics?.handTips || [];
	if (!decadeUI.statics) decadeUI.statics = {};
	if (!decadeUI.statics.handTips) decadeUI.statics.handTips = tips;

	/** @type {HTMLElement|undefined} */
	let tip;

	// 查找可复用的提示
	for (let i = 0; i < tips.length; i++) {
		if (tip === undefined && tips[i].closed) {
			tip = tips[i];
			tip.closed = false;
		} else {
			tips[i].hide();
		}
	}

	// 创建新提示
	if (tip === undefined) {
		tip = createHandTip(decadeUI);
		tips.unshift(tip);
	}

	tip.setText(text);
	tip.show();
	return tip;
}

/**
 * 创建手牌提示元素
 * @param {object} decadeUI - DecadeUI实例
 * @returns {HTMLElement} 提示元素
 */
function createHandTip(decadeUI) {
	const create =
		decadeUI.element?.create ||
		((cls, parent) => {
			const el = document.createElement("div");
			if (cls) el.className = cls;
			if (parent) parent.appendChild(el);
			return el;
		});

	const tip = create("hand-tip", window.ui?.arena);

	/**
	 * 清空提示内容
	 */
	tip.clear = function () {
		const nodes = this.childNodes;
		for (let i = 0; i < nodes.length; i++) {
			nodes[i].textContent = "";
		}
		this.dataset.text = "";
	};

	/**
	 * 设置提示文本
	 * @param {string} text - 文本内容
	 * @param {string} [type] - 文本类型
	 */
	tip.setText = function (text, type) {
		this.clear();
		this.appendText(text, type);
	};

	/**
	 * 设置信息提示
	 * @param {string} text - 信息内容
	 */
	tip.setInfomation = function (text) {
		if (!this.$info) {
			this.$info = create("hand-tip-info", window.ui?.arena);
		}
		this.$info.innerHTML = text;
	};

	/**
	 * 追加文本
	 * @param {string} text - 文本内容
	 * @param {string} [type] - 文本类型
	 * @returns {HTMLElement|undefined} 文本节点
	 */
	tip.appendText = function (text, type) {
		if (text === undefined || text === "") return;
		if (type === undefined) type = "";

		const nodes = this.childNodes;
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].textContent === "") {
				nodes[i].textContent = text;
				nodes[i].dataset.type = type;
				return nodes[i];
			}
		}

		const span = document.createElement("span");
		span.textContent = text;
		span.dataset.type = type;
		return this.appendChild(span);
	};

	/**
	 * 描边文本
	 */
	tip.strokeText = function () {
		this.dataset.text = this.innerText;
	};

	/**
	 * 显示提示
	 */
	tip.show = function () {
		this.classList.remove("hidden");
		if (this.$info?.innerHTML) this.$info.show?.();
	};

	/**
	 * 隐藏提示
	 */
	tip.hide = function () {
		this.classList.add("hidden");
		if (this.$info) this.$info.hide?.();
	};

	/**
	 * 关闭提示
	 */
	tip.close = function () {
		this.closed = true;
		this.hide();
		if (this.$info) this.$info.innerHTML = "";

		const tips = decadeUI.statics?.handTips || [];
		for (let i = 0; i < tips.length; i++) {
			if (tips[i].closed) continue;
			tips[i].show();
			return;
		}
	};

	/**
	 * 检查提示是否为空
	 * @returns {boolean} 是否为空
	 */
	tip.isEmpty = function () {
		const nodes = this.childNodes;
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].textContent !== "") return false;
		}
		return true;
	};

	return tip;
}
