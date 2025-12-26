/**
 * 扩展启动模块
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { INCOMPATIBLE_MODES, RECOMMENDED_LAYOUT } from "./constants.js";

/** 初始化扩展，检查兼容性 */
export const bootstrapExtension = () => {
	const mode = typeof get.mode === "function" ? get.mode() : get.mode;
	if (INCOMPATIBLE_MODES.has(mode)) return false;

	if (game.hasExtension?.("皮肤切换")) game.menuZoom = 1;
	// 首次导入时配置项可能未定义，使用默认值 true
	const aloneEquip = lib.config.extension_十周年UI_aloneEquip;
	_status.nopopequip = aloneEquip !== undefined ? aloneEquip : true;

	// 布局不符合推荐时，提示用户切换
	if (lib.config.layout !== RECOMMENDED_LAYOUT) {
		if (confirm("十周年UI提醒您，请使用<新版>布局以获得良好体验。\n点击确定自动切换，点击取消保持当前布局。")) {
			game.saveConfig("layout", RECOMMENDED_LAYOUT);
			lib.config.layout = RECOMMENDED_LAYOUT;
			// 界面就绪后热更新布局
			lib.arenaReady?.push(() => lib.init.layout(RECOMMENDED_LAYOUT, true));
		}
	}

	console.time(decadeUIName);
	return true;
};
