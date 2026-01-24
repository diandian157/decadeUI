/**
 * @fileoverview Spine多版本支持系统 - 统一导出接口
 */

export { SpineVersionManager, spineVersionManager } from "./manager.js";
export { SpineLoader, spineLoader } from "./loader.js";
export { AnimationPlayerAdapter, setupMultiVersionSpine } from "./adapter.js";
export { spineConfig } from "./config.js";

export async function loadSpineAnimation(jsonPath, atlasPath, options = {}) {
	const { spineLoader } = await import("./loader.js");
	return spineLoader.load({
		jsonPath,
		atlasPath,
		...options,
	});
}

export function detectSpineVersion(skeletonData) {
	const { spineVersionManager } = require("./manager.js");
	return spineVersionManager.detectVersion(skeletonData);
}
