/**
 * 技能控制插件
 * 根据当前样式加载对应的技能控制逻辑
 */

import { getCurrentSkin, createSkillPluginForSkin } from "./skins/index.js";

/**
 * 创建技能插件
 * 自动根据当前样式选择对应的实现
 */
export function createSkillPlugin(lib, game, ui, get, ai, _status, app) {
	const skinName = getCurrentSkin(lib);
	console.log(`[SkillPlugin] Loading skin: ${skinName}`);
	return createSkillPluginForSkin(skinName, lib, game, ui, get, ai, _status, app);
}
