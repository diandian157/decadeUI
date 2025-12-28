/**
 * character样式管理器
 * 根据配置加载对应样式
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { createShoushaCharacterPlugin } from "./shousha.js";
import { createShizhounianCharacterPlugin } from "./shizhounian.js";
import { createXinshaCharacterPlugin } from "./xinsha.js";
import { createOnlineCharacterPlugin } from "./online.js";
import { createBabyCharacterPlugin } from "./baby.js";
import { createCodenameCharacterPlugin } from "./codename.js";

// 样式到样式的映射
export const STYLE_TO_SKIN = {
	off: "shousha",
	on: "shizhounian",
	othersOff: "xinsha",
	onlineUI: "online",
	babysha: "baby",
	codename: "codename",
};

// 样式创建函数映射
const SKIN_CREATORS = {
	shousha: createShoushaCharacterPlugin,
	shizhounian: createShizhounianCharacterPlugin,
	xinsha: createXinshaCharacterPlugin,
	online: createOnlineCharacterPlugin,
	baby: createBabyCharacterPlugin,
	codename: createCodenameCharacterPlugin,
};

/**
 * 获取当前样式名称
 */
export function getCurrentSkinName() {
	const style = window.lib?.config?.["extension_十周年UI_newDecadeStyle"] || "on";
	return STYLE_TO_SKIN[style] || "shizhounian";
}

/**
 * 创建对应样式的character插件
 */
export function createCharacterPluginForSkin(lib, game, ui, get, ai, _status, app) {
	const skinName = getCurrentSkinName();
	const creator = SKIN_CREATORS[skinName];

	if (creator) {
		return creator(lib, game, ui, get, ai, _status, app);
	}

	// 默认使用十周年风格
	return createShizhounianCharacterPlugin(lib, game, ui, get, ai, _status, app);
}
