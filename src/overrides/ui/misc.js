/**
 * @fileoverview UI杂项方法模块
 * @description 包含其他UI相关的覆写方法
 * @module overrides/ui/misc
 */

import { game } from "noname";

/**
 * 清除弃牌区
 * @description 清除场上所有已打出的卡牌
 */
export function uiClear() {
	game.addVideo("uiClear");

	const nodes = document.getElementsByClassName("thrown");

	for (let i = nodes.length - 1; i >= 0; i--) {
		if (nodes[i].fixed) continue;

		if (nodes[i].classList.contains("card")) {
			// 特殊卡牌直接删除
			if (nodes[i].name && (nodes[i].name.startsWith("shengbei_left_") || nodes[i].name.startsWith("shengbei_right_"))) {
				nodes[i].delete();
			} else {
				// 普通卡牌使用布局清理
				window.decadeUI.layout.clearout(nodes[i]);
			}
		} else {
			nodes[i].delete();
		}
	}
}
