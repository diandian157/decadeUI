/**
 * @fileoverview 技能控制插件入口
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { getCurrentSkin, createSkillPluginForSkin } from "./skins/index.js";

/**
 * 创建技能插件
 * @returns {Promise<Object|null>}
 */
export async function createSkillPlugin(lib, game, ui, get, ai, _status, app) {
	return createSkillPluginForSkin(getCurrentSkin(), lib, game, ui, get, ai, _status, app);
}
