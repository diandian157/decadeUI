/**
 * 扩展启动模块
 */
import { lib, game, get, _status } from "noname";
import { INCOMPATIBLE_MODES, RECOMMENDED_LAYOUT } from "./constants.js";

/** 初始化扩展，检查兼容性 */
export const bootstrapExtension = () => {
	const mode = typeof get.mode === "function" ? get.mode() : get.mode;
	if (INCOMPATIBLE_MODES.has(mode)) return false;

	if (game.hasExtension?.("皮肤切换")) game.menuZoom = 1;
	_status.nopopequip = lib.config.extension_十周年UI_aloneEquip;

	if (lib.config.layout !== RECOMMENDED_LAYOUT) {
		if (confirm("十周年UI提醒您，请使用<新版>布局以获得良好体验。\n点击确定自动切换，点击取消保持当前布局。")) {
			lib.config.layout = RECOMMENDED_LAYOUT;
			game.saveConfig("layout", RECOMMENDED_LAYOUT);
			alert("布局已切换，游戏将自动重启。");
			setTimeout(() => location.reload(), 100);
		}
	}

	console.time(decadeUIName);
	return true;
};
