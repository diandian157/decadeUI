/**
 * @fileoverview 扩展预加载入口 - 游戏初始化前执行
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { initEruda, initNodeFS } from "./core/debug.js";
import { initDecadeModule, EXCLUDED_MODES } from "./core/decadeModule.js";
import { setupConnectMode, setupLayoutVisualMenu } from "./core/connectMode.js";
import { initApp } from "./core/app.js";
import { fixMoveAnimZoom } from "./overrides/moveAnimFix.js";
import { initPrecontentUI } from "./ui/progress-bar.js";
import { initCardAlternateNameVisible } from "./ui/cardAlternateName.js";

/**
 * Precontent主入口 - 游戏初始化前执行
 */
export async function precontent() {
	const mode = get.mode();
	if (EXCLUDED_MODES.includes(mode)) return;

	initEruda();
	initNodeFS();
	setupLayoutVisualMenu();

	window.decadeModule = initDecadeModule();

	setupConnectMode();
	initApp();

	if (!lib.config.asset_version) {
		game.saveConfig("asset_version", "无");
	}

	fixMoveAnimZoom();
	initPrecontentUI();
	initCardAlternateNameVisible();
}
