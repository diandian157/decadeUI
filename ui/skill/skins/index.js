/**
 * 技能样式管理器
 * 根据不同样式加载对应的技能控制逻辑
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { createShoushaSkillPlugin } from "./shousha.js";
import { createShizhounianSkillPlugin } from "./shizhounian.js";
import { createXinshaSkillPlugin } from "./xinsha.js";
import { createOnlineSkillPlugin } from "./online.js";
import { createBabySkillPlugin } from "./baby.js";
import { createCodenameSkillPlugin } from "./codename.js";

// 样式到创建函数的映射
const SKIN_CREATORS = {
	shousha: createShoushaSkillPlugin,
	shizhounian: createShizhounianSkillPlugin,
	xinsha: createXinshaSkillPlugin,
	online: createOnlineSkillPlugin,
	baby: createBabySkillPlugin,
	codename: createCodenameSkillPlugin,
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
 * 创建对应样式的技能插件
 */
export function createSkillPluginForSkin(skinName, lib, game, ui, get, ai, _status, app) {
	const creator = SKIN_CREATORS[skinName];
	if (!creator) {
		console.warn(`[SkillSkin] Unknown skin: ${skinName}, fallback to shizhounian`);
		return createShizhounianSkillPlugin(lib, game, ui, get, ai, _status, app);
	}
	return creator(lib, game, ui, get, ai, _status, app);
}
