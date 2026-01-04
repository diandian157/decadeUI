/**
 * @fileoverview 静态资源模块，管理卡牌皮肤等静态资源的加载和缓存
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { cardSkinPresets } from "../config.js";

/**
 * 全局卡牌皮肤注册队列
 * @type {Array<Object>}
 */
window._decadeUICardSkinQueue = window._decadeUICardSkinQueue || [];

/**
 * 全局卡牌皮肤注册函数（初始版本，加入队列等待处理）
 * @param {Object} options - 注册选项
 */
if (!window.registerDecadeCardSkin) {
	window.registerDecadeCardSkin = function (options) {
		window._decadeUICardSkinQueue.push(options);
	};
}

/**
 * 扫描目录获取文件列表
 * @param {string} dir - 相对路径
 * @returns {Promise<string[]>} 文件名列表
 */
const scanDirectory = dir => {
	return new Promise(resolve => {
		if (typeof game.getFileList === "function") {
			game.getFileList(
				dir,
				(_, files) => resolve(files || []),
				() => resolve([])
			);
		} else {
			resolve([]);
		}
	});
};

/**
 * 从文件列表中提取卡牌名称
 * @param {string[]} files - 文件名列表
 * @param {string} ext - 扩展名（如 ".png"）
 * @returns {string[]} 卡牌名称列表
 */
const extractCardNames = (files, ext) => {
	return files.filter(f => f.toLowerCase().endsWith(ext)).map(f => f.substring(0, f.length - ext.length));
};

/**
 * 创建statics模块
 * @returns {{cards: Object, handTips: Array, registerCardSkin: Function}} statics模块对象
 */
export function createStaticsModule() {
	/** @type {Object<string, Object>} 卡牌皮肤缓存 */
	const cards = {};

	/** @type {Object<string, boolean>} 皮肤加载完成标记 */
	cards.READ_OK = {};

	/**
	 * 确保皮肤缓存存在
	 * @param {string} skinKey - 皮肤键名
	 * @returns {Object} 皮肤缓存对象
	 */
	const ensureSkinCache = skinKey => {
		if (!cards[skinKey]) cards[skinKey] = {};
		return cards[skinKey];
	};

	/**
	 * 批量注册卡牌皮肤到缓存
	 * @param {string} skinKey - 皮肤键名
	 * @param {string} baseUrl - 图片基础URL
	 * @param {string[]} cardNames - 卡牌名称列表
	 * @param {string} ext - 扩展名
	 */
	const registerSkins = (skinKey, baseUrl, cardNames, ext) => {
		const skinCache = ensureSkinCache(skinKey);
		for (const name of cardNames) {
			if (!name || skinCache[name]) continue;
			skinCache[name] = { url: `${baseUrl}${name}.${ext}`, name, loaded: true };
		}
		cards.READ_OK[skinKey] = true;
	};

	/**
	 * 注册外部扩展的卡牌皮肤
	 * @param {Object} options - 注册选项
	 * @param {string} options.extensionName - 扩展名称
	 * @param {string} [options.skinKey="decade"] - 皮肤类型键名（decade/caise/online/gold/bingkele）
	 * @param {string} [options.folder] - 皮肤文件夹名，默认与skinKey相同
	 * @param {string} [options.extension="png"] - 图片扩展名
	 * @param {string[]} [options.cardNames] - 卡牌名称列表，不提供则自动扫描目录
	 * @example
	 * // 方式1：指定卡牌列表（推荐）
	 * registerDecadeCardSkin({
	 *   extensionName: '我的扩展',
	 *   skinKey: 'decade',
	 *   cardNames: ['mycard1', 'mycard2']
	 * });
	 * @example
	 * // 方式2：自动扫描目录（可能会占用资源
	 * registerDecadeCardSkin({
	 *   extensionName: '我的扩展',
	 *   skinKey: 'decade'
	 * });
	 */
	const registerCardSkin = options => {
		const { extensionName, skinKey = "decade", folder, extension = "png", cardNames } = options || {};

		if (!extensionName) {
			console.warn("[十周年UI] registerCardSkin: 缺少 extensionName");
			return;
		}

		const skinFolder = folder || skinKey;
		const baseUrl = `${lib.assetURL}extension/${extensionName}/image/card-skins/${skinFolder}/`;

		// 方式1：直接注册指定的卡牌列表
		if (Array.isArray(cardNames) && cardNames.length > 0) {
			registerSkins(skinKey, baseUrl, cardNames, extension);
			return;
		}

		// 方式2：扫描目录自动注册
		const dir = `extension/${extensionName}/image/card-skins/${skinFolder}`;
		scanDirectory(dir).then(files => {
			const names = extractCardNames(files, `.${extension.toLowerCase()}`);
			registerSkins(skinKey, baseUrl, names, extension);
		});
	};

	/**
	 * 处理待注册队列并更新全局注册函数
	 */
	const processQueue = () => {
		const queue = window._decadeUICardSkinQueue || [];
		queue.forEach(options => registerCardSkin(options));
		window._decadeUICardSkinQueue = [];
		window.registerDecadeCardSkin = registerCardSkin;
	};

	// 加载十周年UI自带的卡牌皮肤资源
	const loadBuiltinSkins = async () => {
		const tasks = cardSkinPresets.map(async skin => {
			const folder = skin.dir || skin.key;
			const dir = `extension/${decadeUIName}/image/card-skins/${folder}`;
			const ext = skin.extension ? `.${skin.extension.toLowerCase()}` : ".png";
			const baseUrl = `${decadeUIPath}image/card-skins/${folder}/`;

			const files = await scanDirectory(dir);
			const names = extractCardNames(files, ext);
			registerSkins(skin.key, baseUrl, names, skin.extension || "png");
		});

		await Promise.all(tasks);
		processQueue();
	};

	loadBuiltinSkins();

	return { cards, handTips: [], registerCardSkin };
}
