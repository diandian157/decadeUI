/**
 * 元素创建工具
 * @description 从concore.js提取的element工具
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 元素基础方法
 */
const elementBase = {
	/**
	 * 移除自身
	 * @param {number} milliseconds 延迟毫秒数
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
 * 创建元素
 * @param {string} className 类名
 * @param {HTMLElement} parentNode 父节点
 * @param {string} tagName 标签名，默认div
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
 */
export const element = {
	base: elementBase,
	create: createElement,
	clone: el => el?.cloneNode?.(true),
};
