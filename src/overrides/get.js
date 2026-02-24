/**
 * Get覆写模块
 */
import { game, get } from "noname";
import { wrapAfter } from "../utils/safeOverride.js";

export function applyGetOverrides() {
	const restoreFns = [];

	restoreFns.push(
		wrapAfter(get, "skillState", function (skills, player) {
			if (game.me !== player && skills?.global) {
				skills.global = skills.global.concat();
				for (let i = skills.global.length - 1; i >= 0; i--) {
					if (skills.global[i].includes("decadeUI")) {
						skills.global.splice(i, 1);
					}
				}
			}
		})
	);

	return restoreFns;
}

export function getObjtype(obj) {
	obj = Object.prototype.toString.call(obj);
	const map = {
		"[object Array]": "array",
		"[object Object]": "object",
		"[object HTMLDivElement]": "div",
		"[object HTMLTableElement]": "table",
		"[object HTMLTableRowElement]": "tr",
		"[object HTMLTableCellElement]": "td",
		"[object HTMLBodyElement]": "td",
	};
	return map[obj];
}
