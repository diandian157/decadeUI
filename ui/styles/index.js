/**
 * 样式加载器
 * 根据样式配置动态加载对应CSS
 */

// 样式索引映射: 1=shousha, 2=shizhounian, 3=xinsha, 4=online, 5=baby, 6=codename
export const SKIN_CONFIG = {
	1: { name: "shousha", folder: "shousha" },
	2: { name: "shizhounian", folder: "shizhounian" },
	3: { name: "xinsha", folder: "xinsha" },
	4: { name: "online", folder: "online" },
	5: { name: "baby", folder: "baby" },
	6: { name: "codename", folder: "codename" },
};

// 样式选项到样式的映射
export const STYLE_TO_SKIN = {
	on: "shizhounian",
	off: "shousha",
	othersOff: "xinsha",
	onlineUI: "online",
	babysha: "baby",
	codename: "codename",
};

// 获取当前样式配置
export function getCurrentSkin() {
	const skinId = lib.config?.["extension_十周年UI_shoushaUIstyle"] || 2;
	return SKIN_CONFIG[skinId] || SKIN_CONFIG[2];
}

// 根据样式选项获取样式名
export function getSkinByStyle(style) {
	return STYLE_TO_SKIN[style] || "shizhounian";
}

// 获取资源路径
export function getAssetPath(category, filename) {
	const skin = getCurrentSkin();
	const basePath = "extension/十周年UI/ui/assets";
	return `${basePath}/${category}/${skin.folder}/${filename}`;
}

// 获取共享资源路径
export function getSharedAssetPath(category, filename) {
	return `extension/十周年UI/ui/assets/${category}/shared/${filename}`;
}

// 加载CSS文件
export function loadStylesheet(path) {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `${lib.assetURL}${path}`;
	document.head.appendChild(link);
	return link;
}

// 初始化样式 - 加载各模块CSS
export function initStyles(skinName) {
	const basePath = "extension/十周年UI/ui/styles";

	// 如果没有传入样式名，自动获取
	if (!skinName) {
		const style = lib.config?.["extension_十周年UI_newDecadeStyle"] || "on";
		skinName = STYLE_TO_SKIN[style] || "shizhounian";
	}

	// 加载字体
	loadStylesheet(`${basePath}/fonts.css`);

	// 加载基础样式
	loadStylesheet(`${basePath}/base.css`);

	// 加载各模块样式样式
	loadStylesheet(`${basePath}/character/${skinName}.css`);
	loadStylesheet(`${basePath}/lbtn/${skinName}.css`);
	loadStylesheet(`${basePath}/skill/${skinName}.css`);
}

export default {
	getCurrentSkin,
	getSkinByStyle,
	getAssetPath,
	getSharedAssetPath,
	loadStylesheet,
	initStyles,
	SKIN_CONFIG,
	STYLE_TO_SKIN,
};
