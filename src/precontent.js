import { lib, game, get } from "noname";
import { initEruda, initNodeFS } from "./core/debug.js";
import { initDecadeModule, EXCLUDED_MODES } from "./core/decadeModule.js";
import { setupConnectMode, setupLayoutVisualMenu } from "./core/connectMode.js";
import { initApp } from "./core/app.js";
import { fixMoveAnimZoom } from "./overrides/moveAnimFix.js";
import { initPrecontentUI } from "./ui/progress-bar.js";
import { initCardAlternateNameVisible } from "./ui/cardAlternateName.js";

/**
 * Precontent 主入口
 */
export async function precontent() {
	const mode = get.mode();
	if (EXCLUDED_MODES.includes(mode)) return;

	// 初始化调试工具
	initEruda();
	initNodeFS();

	// 设置布局菜单
	setupLayoutVisualMenu();

	// 初始化 decadeModule
	window.decadeModule = initDecadeModule();

	// 设置联机模式
	setupConnectMode();

	// 初始化 app 全局对象
	initApp();

	// 初始化资源版本配置
	if (!lib.config.asset_version) {
		game.saveConfig("asset_version", "无");
	}

	// 修复移动动画
	fixMoveAnimZoom();

	// 初始化 UI
	initPrecontentUI();
	initCardAlternateNameVisible();
}
