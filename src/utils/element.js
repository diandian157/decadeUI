/**
 * 元素创建工具
 * @description 从concore.js提取的element工具
 */

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
			setTimeout(() => {
				if (this.parentNode) this.parentNode.removeChild(this);
			}, ms);
			return;
		}
		if (this.parentNode) this.parentNode.removeChild(this);
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

	// 添加基础方法
	for (const key in elementBase) {
		element[key] = elementBase[key];
	}

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
	clone(el) {
		// 预留克隆方法
		return el?.cloneNode?.(true);
	},
};
