/**
 * @fileoverview 卡牌皮肤加载器
 * @description 处理卡牌皮肤的加载、缓存和回退逻辑
 * @module overrides/card/skin-loader
 */
import { lib, get } from "noname";
import { cardSkinMeta } from "../../config/utils.js";

/**
 * 皮肤回退映射表
 * @type {Object<string, string>}
 */
const FALLBACK_MAP = {
	bingkele: "decade",
	gold: "caise",
};

/**
 * 获取卡牌资源缓存
 * @returns {Object|null} 资源缓存对象
 */
export function getCardResources() {
	return window.decadeUI?.statics?.cards;
}

/**
 * 获取或创建皮肤缓存
 * @param {string} skinKey - 皮肤键名
 * @returns {Object} 皮肤缓存对象
 */
export function getSkinCache(skinKey) {
	const res = getCardResources();
	if (!res) return {};
	return res[skinKey] || (res[skinKey] = {});
}

/**
 * 检查皮肤是否已完成预读
 * @param {string} skinKey - 皮肤键名
 * @returns {boolean} 是否已完成预读
 */
export function isSkinPreloaded(skinKey) {
	const res = getCardResources();
	return !!res?.READ_OK?.[skinKey];
}

/**
 * 获取回退皮肤键名
 * @param {string} skinKey - 当前皮肤键名
 * @returns {string|null} 回退皮肤键名，无回退则返回null
 */
export function getFallbackKey(skinKey) {
	const fallbackKey = FALLBACK_MAP[skinKey];
	return fallbackKey && cardSkinMeta[fallbackKey] ? fallbackKey : null;
}

/**
 * 构建皮肤URL
 * @param {string} skinKey - 皮肤键名
 * @param {string} filename - 文件名
 * @returns {string} 完整URL
 */
export function buildSkinUrl(skinKey, filename) {
	const skin = cardSkinMeta[skinKey];
	if (!skin) return "";

	const decadeUIName = window.decadeUI?.extensionName || "十周年UI";
	const folder = skin.dir || skinKey;
	const extension = skin.extension || "png";
	return `${lib.assetURL}extension/${decadeUIName}/image/card-skins/${folder}/${filename}.${extension}`;
}

/**
 * 生成卡牌皮肤文件名
 * @param {string} cardName - 卡牌名称
 * @param {string|Array|null} cardNature - 卡牌属性
 * @returns {string} 文件名
 */
export function generateSkinFilename(cardName, cardNature) {
	let filename = cardName;
	// 处理杀的属性
	if (cardName === "sha" && cardNature && !Array.isArray(cardNature)) {
		const natures = get.natureList(cardNature).sort(lib.sort.nature);
		filename += "_" + natures.join("_");
	}
	return filename;
}

/**
 * 从缓存获取已加载的皮肤资源
 * @param {string} skinKey - 皮肤键名
 * @param {string} filename - 文件名
 * @returns {{asset: Object|null, url: string|null}} 资源信息
 */
export function getCachedSkin(skinKey, filename) {
	const cache = getSkinCache(skinKey);
	const asset = cache[filename];

	if (asset?.loaded === true && asset.url) {
		return { asset, url: asset.url };
	}
	return { asset: asset || null, url: null };
}

/**
 * 尝试获取回退皮肤URL
 * @param {string} fallbackKey - 回退皮肤键名
 * @param {string} filename - 文件名
 * @returns {string|null} 回退皮肤URL，无可用回退则返回null
 */
export function getFallbackSkinUrl(fallbackKey, filename) {
	if (!fallbackKey) return null;

	const fallbackCache = getSkinCache(fallbackKey);
	const fallbackAsset = fallbackCache[filename];

	if (fallbackAsset?.loaded === true) {
		return fallbackAsset.url;
	}
	return null;
}

/**
 * 创建皮肤资源对象
 * @param {string} filename - 文件名
 * @returns {Object} 资源对象
 */
export function createSkinAsset(filename) {
	return {
		name: filename,
		url: undefined,
		loaded: undefined,
		image: undefined,
	};
}

/**
 * 加载皮肤图片
 * @param {Object} options - 加载选项
 * @param {string} options.url - 图片URL
 * @param {Object} options.asset - 资源对象
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 失败回调
 * @returns {HTMLImageElement} 图片元素
 */
export function loadSkinImage({ url, asset, onSuccess, onError }) {
	const image = new Image();

	image.onload = () => {
		asset.loaded = true;
		asset.url = url;
		onSuccess?.(url);
	};

	image.onerror = () => {
		onError?.();
	};

	asset.url = url;
	asset.image = image;
	image.src = url;

	return image;
}

/**
 * 加载回退皮肤
 * @param {Object} options - 加载选项
 * @param {Object} options.asset - 原资源对象
 * @param {string} options.fallbackKey - 回退皮肤键名
 * @param {string} options.filename - 文件名
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onFail - 失败回调
 */
export function loadFallbackSkin({ asset, fallbackKey, filename, onSuccess, onFail }) {
	const fallbackUrl = buildSkinUrl(fallbackKey, filename);

	const fallbackImage = new Image();
	fallbackImage.onload = () => {
		asset.loaded = true;
		asset.url = fallbackUrl;
		onSuccess?.(fallbackUrl);
	};
	fallbackImage.onerror = () => {
		asset.loaded = false;
		onFail?.();
	};
	fallbackImage.src = fallbackUrl;
}
