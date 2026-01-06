/**
 * @fileoverview 对话框模块，提供对话框创建、动画和事件管理功能
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建事件监听器管理器
 * @param {HTMLElement} dialog - 对话框元素
 * @returns {Object} 监听器管理器
 */
const createListenerManager = dialog => ({
	_dialog: dialog,
	_list: [],
	/**
	 * 添加事件监听
	 * @param {HTMLElement} element - DOM元素
	 * @param {string} event - 事件名
	 * @param {Function} handler - 处理函数
	 * @param {boolean} useCapture - 是否捕获
	 */
	add(element, event, handler, useCapture) {
		if (!(element instanceof HTMLElement) || !event || typeof handler !== "function") {
			return console.error("Invalid arguments for listener");
		}
		this._list.push([element, event, handler]);
		element.addEventListener(event, handler, useCapture);
	},
	/**
	 * 移除事件监听
	 * @param {HTMLElement} element - DOM元素
	 * @param {string} event - 事件名
	 * @param {Function} handler - 处理函数
	 */
	remove(element, event, handler) {
		for (let i = this._list.length - 1; i >= 0; i--) {
			const [el, evt, fn] = this._list[i];
			const match = (!element || el === element) && (!event || evt === event) && (!handler || fn === handler);
			if (match) {
				el.removeEventListener(evt, fn);
				this._list.splice(i, 1);
			}
		}
	},
	/**
	 * 清除所有监听
	 */
	clear() {
		this._list.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
		this._list.length = 0;
	},
});

/**
 * 解析时间字符串为毫秒
 * @param {string|number} duration - 时间值
 * @returns {number} 毫秒数
 */
function parseDuration(duration) {
	if (typeof duration === "number") return duration;
	if (duration.includes("ms")) return parseInt(duration);
	if (duration.includes("s")) return parseFloat(duration) * 1000;
	return parseInt(duration);
}

/**
 * 创建对话框模块
 * @returns {Object} 对话框模块对象
 */
export const createDecadeUIDialogModule = () => ({
	/**
	 * 创建对话框元素
	 * @param {string} className - CSS类名
	 * @param {HTMLElement} parentNode - 父节点
	 * @param {string} tagName - 标签名
	 * @returns {HTMLElement} 对话框元素
	 */
	create(className, parentNode, tagName = "div") {
		const element = document.createElement(tagName);
		Object.keys(decadeUI.dialog).forEach(key => {
			if (decadeUI.dialog[key] && key !== "listens") element[key] = decadeUI.dialog[key];
		});
		element.listens = createListenerManager(element);
		if (className) element.className = className;
		if (parentNode) parentNode.appendChild(element);
		return element;
	},
	/**
	 * 显示对话框
	 */
	show() {
		if (this === decadeUI.dialog) return;
		this.classList.remove("hidden");
	},
	/**
	 * 隐藏对话框
	 */
	hide() {
		if (this === decadeUI.dialog) return;
		this.classList.add("hidden");
	},
	/**
	 * 执行动画
	 * @param {string} property - CSS属性
	 * @param {string|number} duration - 动画时长
	 * @param {Array} toValues - 目标值
	 * @param {Array} fromValues - 起始值
	 */
	animate(property, duration, toValues, fromValues) {
		if (this === decadeUI.dialog || !property || !duration || !toValues) return;
		const props = property.replace(/\s/g, "").split(",");
		const ms = parseDuration(duration);
		if (isNaN(ms)) return console.error("Invalid duration");
		if (fromValues) props.forEach((prop, i) => this.style.setProperty(prop, fromValues[i]));
		const { transitionDuration, transitionProperty } = this.style;
		this.style.transitionDuration = `${ms}ms`;
		this.style.transitionProperty = property;
		ui.refresh(this);
		props.forEach((prop, i) => this.style.setProperty(prop, toValues[i]));
		setTimeout(() => {
			this.style.transitionDuration = transitionDuration;
			this.style.transitionProperty = transitionProperty;
		}, ms);
	},
	/**
	 * 关闭对话框
	 * @param {number|string} delay - 延迟时间
	 * @param {boolean} fadeOut - 是否淡出
	 */
	close(delay, fadeOut) {
		if (this === decadeUI.dialog || !this.parentNode) return;
		this.listens.clear();
		if (fadeOut && delay) this.addTempClass("opacity", delay, [0]);
		if (delay) {
			const ms = typeof delay === "number" ? delay : parseInt(delay);
			setTimeout(() => this.parentNode?.removeChild(this), ms);
		} else {
			this.parentNode.removeChild(this);
		}
	},
	listens: createListenerManager(null),
});
