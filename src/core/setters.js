/**
 * decadeUI.set 模块
 */

/** 创建decadeUI.set模块 */
export function createDecadeUISetModule() {
	return {
		activeElement(element) {
			const deactive = dui.$activeElement;
			dui.$activeElement = element;
			if (deactive && deactive !== element && typeof deactive.ondeactive === "function") {
				deactive.ondeactive();
			}
			if (element && element !== deactive && typeof element.onactive === "function") {
				element.onactive();
			}
		},
	};
}
