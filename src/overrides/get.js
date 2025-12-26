/**
 * Get 覆写模块
 * @description get对象相关的覆写方法
 */

import { lib, game, ui, get, ai, _status } from "noname";

// 基础方法引用
let baseGetMethods = null;

/**
 * 设置基础方法引用
 */
export function setBaseGetMethods(methods) {
	baseGetMethods = methods;
}

/**
 * 技能状态覆写 - 排除十周年UI技能
 */
export function getSkillState(player) {
	const skills = baseGetMethods.skillState.apply(this, arguments);
	if (game.me !== player) {
		const global = (skills.global = skills.global.concat());
		for (let i = global.length - 1; i >= 0; i--) {
			if (global[i].includes("decadeUI")) global.splice(i, 1);
		}
	}
	return skills;
}

/**
 * 对象类型判断
 */
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

/**
 * 应用get覆写
 */
export function applyGetOverrides() {
	// 基础方法在外部设置
}
