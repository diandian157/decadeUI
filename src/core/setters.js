/**
 * decadeUI.set 模块
 */

/** 创建decadeUI.set模块 */
export function createDecadeUISetModule() {
	return {
		activeElement(element) {
			const deactive = dui.$activeElement;
			if (deactive === element) return;
			dui.$activeElement = element;
			deactive?.ondeactive?.();
			element?.onactive?.();
		},
	};
}
