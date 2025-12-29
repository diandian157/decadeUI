/**
 * @fileoverview 左侧按钮插件入口
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { getCurrentSkin, createLbtnPluginForSkin } from "./skins/index.js";

/**
 * 创建lbtn插件
 * @returns {Promise<Object|null>}
 */
export async function createLbtnPlugin(lib, game, ui, get, ai, _status, app) {
	return createLbtnPluginForSkin(getCurrentSkin(), lib, game, ui, get, ai, _status, app);
}
