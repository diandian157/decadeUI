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
import { setupMultiVersionSpine } from "./libs/spine/adapter.js";
import { spineConfig } from "./libs/spine/config.js";
import { spineVersionManager, spineLoader } from "./libs/spine/index.js";

/**
 * Precontent主入口 - 游戏初始化前执行
 */
export async function precontent() {
	const mode = get.mode();
	if (EXCLUDED_MODES.includes(mode)) return;

	initEruda();
	initNodeFS();
	setupLayoutVisualMenu();

	// 初始化多版本Spine支持
	spineVersionManager.debug = spineConfig.debug;
	spineLoader.debug = spineConfig.debug;

	await setupMultiVersionSpine({
		preloadVersions: spineConfig.preloadVersions,
		autoDetect: spineConfig.autoDetect,
		debug: spineConfig.debug,
	});

	window.decadeModule = await initDecadeModule();

	setupConnectMode();
	initApp();

	if (!lib.config.asset_version) {
		game.saveConfig("asset_version", "无");
	}

	fixMoveAnimZoom();
	initPrecontentUI();
	initCardAlternateNameVisible();
}
