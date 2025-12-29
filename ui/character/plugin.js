/**
 * @fileoverview 武将详情插件入口
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { getCurrentSkin, createCharacterPluginForSkin } from "./skins/index.js";

/**
 * 创建character插件
 * @returns {Promise<Object|null>}
 */
export async function createCharacterPlugin(lib, game, ui, get, ai, _status, app) {
	return createCharacterPluginForSkin(getCurrentSkin(), lib, game, ui, get, ai, _status, app);
}
