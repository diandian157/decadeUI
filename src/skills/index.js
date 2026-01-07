/**
 * @fileoverview 十周年UI - 技能模块入口
 * @description 统一导出和初始化所有技能模块
 * @module skills
 */

import { lib, game, _status } from "noname";
import { initRecast } from "./recast.js";

// 导入拆分的技能模块
import { animateSkill } from "./animate.js";
import { baseSkill } from "./base.js";
import { inheritSkill } from "./inherit.js";
import { inheritComplexSkill } from "./inherit-complex.js";
import { guhuoSkill } from "./guhuo.js";
import { inheritSubSkill, factionOptimizeSkill } from "./sub-skills.js";

// 合并所有继承技能
const mergedInheritSkill = {
	...inheritSkill,
	...inheritComplexSkill,
	...guhuoSkill,
};

// 导出各模块供外部使用
export { animateSkill, baseSkill, inheritSubSkill };
export { initCanvas, loadImageToCanvas, createCanvasStyle } from "./utils.js";

/**
 * 初始化技能模块
 * @description 注册所有技能到游戏系统
 * @returns {void}
 */
export function initSkills() {
	if (_status.connectMode) return;

	// 挂载到decadeUI
	decadeUI.animateSkill = animateSkill;
	decadeUI.skill = baseSkill;
	decadeUI.inheritSkill = mergedInheritSkill;
	decadeUI.inheritSubSkill = inheritSubSkill;

	// 注册动画技能
	for (const key of Object.keys(animateSkill)) {
		lib.skill[key] = animateSkill[key];
		game.addGlobalSkill(key);
	}

	// 注册基础技能
	Object.assign(lib.skill, baseSkill);

	// 合并继承技能
	for (const key of Object.keys(mergedInheritSkill)) {
		if (lib.skill[key]) {
			Object.assign(lib.skill[key], mergedInheritSkill[key]);
		}
	}

	// 合并继承子技能
	for (const key of Object.keys(inheritSubSkill)) {
		if (!lib.skill[key]?.subSkill) continue;
		for (const j of Object.keys(inheritSubSkill[key])) {
			if (lib.skill[key].subSkill[j]) {
				Object.assign(lib.skill[key].subSkill[j], inheritSubSkill[key][j]);
			}
		}
	}

	// 势力优化
	if (lib.config["extension_十周年UI_shiliyouhua"]) {
		Object.defineProperty(lib, "group", {
			get: () => ["wei", "shu", "wu", "qun", "jin"],
			set: () => {},
		});
		lib.skill._slyh = factionOptimizeSkill._slyh;
	}

	// 初始化重铸模块
	initRecast();
}
