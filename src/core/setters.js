/**
 * decadeUI.set 模块
 */

/** 创建decadeUI.set模块 */
export function createDecadeUISetModule() {
	return {
		activeElement(element) {
			const deactive = decadeUI.$activeElement;
			if (deactive === element) return;
			decadeUI.$activeElement = element;
			deactive?.ondeactive?.();
			element?.onactive?.();
		},
	};
}
