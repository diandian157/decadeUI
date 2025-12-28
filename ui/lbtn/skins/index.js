/**
 * lbtn样式管理器
 * 根据不同样式加载对应的按钮控制逻辑
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { createShoushaLbtnPlugin } from "./shousha.js";
import { createShizhounianLbtnPlugin } from "./shizhounian.js";
import { createXinshaLbtnPlugin } from "./xinsha.js";
import { createOnlineLbtnPlugin } from "./online.js";
import { createBabyLbtnPlugin } from "./baby.js";
import { createCodenameLbtnPlugin } from "./codename.js";

// 样式到创建函数的映射
const SKIN_CREATORS = {
	shousha: createShoushaLbtnPlugin,
	shizhounian: createShizhounianLbtnPlugin,
	xinsha: createXinshaLbtnPlugin,
	online: createOnlineLbtnPlugin,
	baby: createBabyLbtnPlugin,
	codename: createCodenameLbtnPlugin,
};

// 样式选项到样式名的映射
const STYLE_TO_SKIN = {
	off: "shousha",
	on: "shizhounian",
	othersOff: "xinsha",
	onlineUI: "online",
	babysha: "baby",
	codename: "codename",
};

/**
 * 获取当前样式名
 */
export function getCurrentSkin(lib) {
	const style = lib.config.extension_十周年UI_newDecadeStyle;
	return STYLE_TO_SKIN[style] || "shizhounian";
}

/**
 * 创建对应样式的lbtn插件
 */
export function createLbtnPluginForSkin(skinName, lib, game, ui, get, ai, _status, app) {
	const creator = SKIN_CREATORS[skinName];
	if (!creator) {
		console.warn(`[LbtnSkin] Unknown skin: ${skinName}, fallback to shizhounian`);
		return createShizhounianLbtnPlugin(lib, game, ui, get, ai, _status, app);
	}
	return creator(lib, game, ui, get, ai, _status, app);
}
