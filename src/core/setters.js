/**
 * @fileoverview decadeUI.set模块，提供各种设置器方法
 */

/**
 * 创建decadeUI.set模块
 * @returns {Object} set模块对象
 */
export function createDecadeUISetModule() {
	return {
		/**
		 * 设置活动元素
		 * @param {HTMLElement} element - 要激活的元素
		 */
		activeElement(element) {
			const deactive = decadeUI.$activeElement;
			if (deactive === element) return;
			decadeUI.$activeElement = element;
			deactive?.ondeactive?.();
			element?.onactive?.();
		},
	};
}
