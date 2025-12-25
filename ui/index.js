/**
 * shoushaUI 模块化入口
 * 统一导出所有UI模块
 */

// 常量
export { CONSTANTS, NICKNAMES, TITLES, GUANJIE, DUANWEI, VIP_TYPES, VALID_GROUPS, GUOZHAN_IDENTITY_COLORS, IDENTITY_COLORS } from "./constants.js";

// 工具函数
export { Utils, getRandomPercentage, randomInt, numberToImages, createStars, createLeftPane, calculateWinRate, createCharButton, generateRandomData, getGroupBackgroundImage, playAudio, addClickEffect, hideDialog } from "./utils.js";

// 样式管理
export { getCurrentSkin, getAssetPath, getSharedAssetPath, loadStylesheet, initStyles, SKIN_CONFIG } from "./styles/index.js";

// 武将详情
export { EnhancedInfoManager } from "./character/EnhancedInfoManager.js";
export { createCharacterPlugin } from "./character/plugin.js";

// 左侧按钮
export { createLbtnPlugin } from "./lbtn/plugin.js";
export { buildModeWinTranslations, initIdentityShow, updateIdentityShow } from "./lbtn/identityShow.js";
export { showCardPileStatistics, sortHandCards, AutoSort, DistanceDisplay, handleConfirm } from "./lbtn/controls.js";
export { addChatWord } from "./lbtn/chatSystem.js";

// 技能控制
export { createSkillPlugin } from "./skill/plugin.js";

// 初始化函数
export function initUI(lib, game, ui, get, ai, _status, app) {
	// 初始化样式
	initStyles();

	// 创建插件
	const characterPlugin = createCharacterPlugin(lib, game, ui, get, ai, _status, app);
	const lbtnPlugin = createLbtnPlugin(lib, game, ui, get, ai, _status, app);
	const skillPlugin = createSkillPlugin(lib, game, ui, get, ai, _status, app);

	return {
		character: characterPlugin,
		lbtn: lbtnPlugin,
		skill: skillPlugin,
	};
}
