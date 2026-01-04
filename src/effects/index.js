"use strict";

/**
 * @fileoverview 特效模块入口，导出所有特效相关功能
 */

import { lib, game, ui, get, ai, _status } from "noname";

export { CONFIG, GENERAL_NAME_STYLE } from "./config.js";
export * from "./utils.js";
export { drawLine } from "./line.js";
export { playKillEffect } from "./kill.js";
export { playSkillEffect } from "./skill.js";
export { setupCardGhost, addGhostTrail, setGhostEffectEnabled, GHOST_CONFIG } from "./cardGhost.js";

// ==================== 游戏集成 ====================

import { drawLine } from "./line.js";
import { playKillEffect } from "./kill.js";
import { playSkillEffect } from "./skill.js";
import { setupCardGhost, addGhostTrail, setGhostEffectEnabled } from "./cardGhost.js";

/**
 * 初始化特效模块到 decadeUI
 * @returns {void}
 */
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
		ghost: {
			add: addGhostTrail,
			setEnabled: setGhostEffectEnabled,
		},
	};

	setupCardGhost();
}
