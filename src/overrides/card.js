/**
 * @fileoverview Card覆写模块（兼容入口）
 * @description 从模块化目录重新导出，保持向后兼容
 * @deprecated 请直接从 './card/index.js' 导入
 */
export {
	// 皮肤相关
	applyCardSkin,
	handleSkinFallback,
	refreshCardSkin,
	// 皮肤加载器
	getCardResources,
	getSkinCache,
	isSkinPreloaded,
	getFallbackKey,
	buildSkinUrl,
	generateSkinFilename,
	// 卡牌覆写方法
	cardInit,
	cardCopy,
	cardUpdateTransform,
	cardMoveTo,
	cardMoveDelete,
	setBaseCardMethods,
	applyCardOverrides,
} from "./card/index.js";
