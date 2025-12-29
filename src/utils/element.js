/**
 * @fileoverview 元素创建工具 - 提供DOM元素的创建和操作方法
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 元素基础方法集合
 * @type {Object}
 */
const elementBase = {
	/**
	 * 移除自身元素
	 * @param {number} [milliseconds] - 延迟毫秒数
	 * @returns {void}
	 */
	removeSelf(milliseconds) {
		if (milliseconds) {
			const ms = typeof milliseconds === "number" ? milliseconds : parseInt(milliseconds);
			setTimeout(() => this.parentNode?.removeChild(this), ms);
			return;
		}
		this.parentNode?.removeChild(this);
	},
};

/**
 * 创建DOM元素
 * @param {string} [className] - CSS类名
 * @param {HTMLElement} [parentNode] - 父节点
 * @param {string} [tagName='div'] - HTML标签名
 * @returns {HTMLElement} 创建的元素
 */
export function createElement(className, parentNode, tagName = "div") {
	const element = document.createElement(tagName);
	element.view = {};
	Object.assign(element, elementBase);
	if (className) element.className = className;
	if (parentNode) parentNode.appendChild(element);
	return element;
}

/**
 * 元素工具对象（兼容原有API）
 * @type {{base: Object, create: Function, clone: Function}}
 */
export const element = {
	base: elementBase,
	create: createElement,
	clone: el => el?.cloneNode?.(true),
};
