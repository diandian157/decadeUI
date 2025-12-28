/**
 * 武将详情插件
 * 根据配置自动加载对应样式
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { createCharacterPluginForSkin, getCurrentSkinName } from "./skins/index.js";

/**
 * 创建武将详情插件
 * 根据当前样式配置自动选择对应实现
 */
export function createCharacterPlugin(lib, game, ui, get, ai, _status, app) {
	// 获取当前样式名称
	const skinName = getCurrentSkinName();
	console.log(`[十周年UI] Character模块加载样式: ${skinName}`);

	// 创建对应样式的插件
	const plugin = createCharacterPluginForSkin(lib, game, ui, get, ai, _status, app);

	return plugin;
}
