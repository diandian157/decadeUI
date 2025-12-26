"use strict";

/**
 * 特效模块入口
 */

export { CONFIG, GENERAL_NAME_STYLE } from "./config.js";
export * from "./utils.js";
export { drawLine } from "./line.js";
export { playKillEffect } from "./kill.js";
export { playSkillEffect } from "./skill.js";

// ==================== 游戏集成 ====================

import { drawLine } from "./line.js";
import { playKillEffect } from "./kill.js";
import { playSkillEffect } from "./skill.js";

/** 初始化特效模块到 decadeUI */
export function setupEffects() {
	if (typeof decadeUI === "undefined") {
		console.error("decadeUI 未定义，无法初始化特效模块");
		return;
	}

	decadeUI.effect = {
		dialog: {
			create: () => decadeUI.dialog.create("effect-dialog dui-dialog"),
		},
		line: drawLine,
		kill: playKillEffect,
		skill: playSkillEffect,
	};
}
