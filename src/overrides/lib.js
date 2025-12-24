/**
 * Lib覆写模块
 * @description lib对象的覆写方法
 */

import { lib, ui } from "noname";

// 基础方法引用
let baseLibInitCssstyles = null;

/**
 * 设置基础lib方法引用
 */
export function setBaseLibMethods(base) {
	baseLibInitCssstyles = base?.init?.cssstyles;
}

/**
 * lib.init.cssstyles 覆写
 */
export function libInitCssstyles() {
	const temp = lib.config.glow_phase;
	lib.config.glow_phase = "";
	baseLibInitCssstyles?.call(this);
	lib.config.glow_phase = temp;
	ui.css.styles.sheet.insertRule('.avatar-name, .avatar-name-default { font-family: "' + (lib.config.name_font || "xinkai") + '", "xinwei" }', 0);
}

/**
 * 应用lib覆写
 */
export function applyLibOverrides() {
	// 基础方法在外部设置
}
