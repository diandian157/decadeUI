/**
 * shoushaUI 模块加载器
 * 用于在app.import中加载模块化后的代码
 */

// 动态导入所有模块
async function loadModules() {
	const [constants, utils, styles, enhancedInfo, characterPlugin, lbtnPlugin, skillPlugin] = await Promise.all([import("./constants.js"), import("./utils.js"), import("./styles/index.js"), import("./character/EnhancedInfoManager.js"), import("./character/plugin.js"), import("./lbtn/plugin.js"), import("./skill/plugin.js")]);

	return {
		// 常量
		CONSTANTS: constants.CONSTANTS,
		GUANJIE: constants.GUANJIE,
		DUANWEI: constants.DUANWEI,
		NICKNAMES: constants.NICKNAMES,
		TITLES: constants.TITLES,

		// 工具
		Utils: utils.Utils,
		generateRandomData: utils.generateRandomData,
		getGroupBackgroundImage: utils.getGroupBackgroundImage,
		numberToImages: utils.numberToImages,
		createStars: utils.createStars,

		// 样式
		initStyles: styles.initStyles,
		getCurrentSkin: styles.getCurrentSkin,
		getAssetPath: styles.getAssetPath,

		// 插件
		EnhancedInfoManager: enhancedInfo.EnhancedInfoManager,
		createCharacterPlugin: characterPlugin.createCharacterPlugin,
		createLbtnPlugin: lbtnPlugin.createLbtnPlugin,
		createSkillPlugin: skillPlugin.createSkillPlugin,
	};
}

// 创建character插件入口
export function createCharacterEntry() {
	return async (lib, game, ui, get, ai, _status, app) => {
		const { createCharacterPlugin } = await import("./character/plugin.js");
		return createCharacterPlugin(lib, game, ui, get, ai, _status, app);
	};
}

// 创建lbtn插件入口
export function createLbtnEntry() {
	return async (lib, game, ui, get, ai, _status, app) => {
		const { createLbtnPlugin } = await import("./lbtn/plugin.js");
		return createLbtnPlugin(lib, game, ui, get, ai, _status, app);
	};
}

// 创建skill插件入口
export function createSkillEntry() {
	return async (lib, game, ui, get, ai, _status, app) => {
		const { createSkillPlugin } = await import("./skill/plugin.js");
		return createSkillPlugin(lib, game, ui, get, ai, _status, app);
	};
}

// 初始化所有UI模块
export async function initAllModules(lib, game, ui, get, ai, _status, app) {
	const { initStyles } = await import("./styles/index.js");

	// 初始化样式
	initStyles();

	// 创建插件
	const [characterPlugin, lbtnPlugin, skillPlugin] = await Promise.all([createCharacterEntry()(lib, game, ui, get, ai, _status, app), createLbtnEntry()(lib, game, ui, get, ai, _status, app), createSkillEntry()(lib, game, ui, get, ai, _status, app)]);

	return {
		character: characterPlugin,
		lbtn: lbtnPlugin,
		skill: skillPlugin,
	};
}

export { loadModules };
