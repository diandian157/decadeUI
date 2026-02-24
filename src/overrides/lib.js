/**
 * Lib覆写模块
 */
import { lib, ui } from "noname";
import { wrapAround } from "../utils/safeOverride.js";

export function applyLibOverrides() {
	const restoreFns = [];

	if (lib.init && typeof lib.init.cssstyles === "function") {
		restoreFns.push(
			wrapAround(lib.init, "cssstyles", function (original) {
				const temp = lib.config.glow_phase;
				lib.config.glow_phase = "";
				original.call(this);
				lib.config.glow_phase = temp;

				if (ui.css?.styles?.sheet) {
					const fontFamily = lib.config.name_font || "xinkai";
					const rule = `.avatar-name, .avatar-name-default { font-family: "${fontFamily}", "xinwei" }`;
					ui.css.styles.sheet.insertRule(rule, 0);
				}
			})
		);
	}

	return restoreFns;
}
