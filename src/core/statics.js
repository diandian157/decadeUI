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
	 * 读取文件列表并注册到缓存（十周年UI自带皮肤用）
	 * @param {Array} files - 文件列表
	 * @param {string} skinKey - 皮肤键名
	 * @param {string} folder - 文件夹名
	 * @param {string} extension - 文件扩展名
	 * @param {boolean} [entry=false] - 是否为目录条目（resolveLocalFileSystemURL返回的格式）
	 */
	const readFiles = (files, skinKey, folder, extension, entry) => {
		if (!folder) return;
		const skinCache = ensureSkinCache(skinKey);
		const prefix = decadeUIPath + "image/card-skins/" + folder + "/";
		const ext = extension ? "." + extension.toLowerCase() : null;
		cards.READ_OK[skinKey] = true;

		for (const current of files) {
			const filename = entry ? current.name : current;
			if (!filename || (entry && current.isDirectory)) continue;

			const lower = filename.toLowerCase();
			let cardname = filename;

			if (ext) {
				if (!lower.endsWith(ext)) continue;
				cardname = filename.substring(0, filename.length - ext.length);
			} else {
				const dotIndex = filename.lastIndexOf(".");
				if (dotIndex === -1) continue;
				cardname = filename.substring(0, dotIndex);
			}

			skinCache[cardname] = { url: prefix + filename, name: cardname, loaded: true };
		}
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
	 * // 方式2：自动扫描目录
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
		const baseUrl = lib.assetURL + `extension/${extensionName}/image/card-skins/${skinFolder}/`;
		const skinCache = ensureSkinCache(skinKey);

		// 方式1：直接注册指定的卡牌列表
		if (Array.isArray(cardNames) && cardNames.length > 0) {
			for (const cardName of cardNames) {
				if (!cardName || skinCache[cardName]) continue;
				skinCache[cardName] = {
					url: `${baseUrl}${cardName}.${extension}`,
					name: cardName,
					loaded: true,
				};
			}
			return;
		}

		// 方式2：扫描目录自动注册
		const basePath = `extension/${extensionName}/image/card-skins/${skinFolder}/`;
		const ext = "." + extension.toLowerCase();

		const processFiles = (files, isEntry) => {
			for (const current of files) {
				const filename = isEntry ? current.name : current;
				if (!filename || (isEntry && current.isDirectory)) continue;
				if (!filename.toLowerCase().endsWith(ext)) continue;

				const cardName = filename.substring(0, filename.length - ext.length);
				if (skinCache[cardName]) continue;

				skinCache[cardName] = {
					url: baseUrl + filename,
					name: cardName,
					loaded: true,
				};
			}
		};

		if (window.fs) {
			fs.readdir(__dirname + "/" + basePath, (err, files) => {
				if (!err) processFiles(files, false);
			});
		} else if (window.resolveLocalFileSystemURL) {
			const resolvePath = (typeof nonameInitialized !== "undefined" ? nonameInitialized : lib.assetURL) + basePath;
			resolveLocalFileSystemURL(resolvePath, entry => {
				entry.createReader().readEntries(entries => processFiles(entries, true));
			});
		}
	};

	/**
	 * 处理待注册队列并更新全局注册函数
	 */
	const processQueue = () => {
		const queue = window._decadeUICardSkinQueue || [];
		if (queue.length > 0) {
			queue.forEach(options => registerCardSkin(options));
			window._decadeUICardSkinQueue = [];
		}
		window.registerDecadeCardSkin = registerCardSkin;
	};

	// 加载十周年UI自带的卡牌皮肤资源
	if (window.fs) {
		let pending = cardSkinPresets.length;
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			fs.readdir(__dirname + "/" + decadeUIPath + "image/card-skins/" + folder + "/", (err, files) => {
				if (!err) readFiles(files, skin.key, folder, skin.extension);
				if (--pending === 0) processQueue();
			});
		});
	} else if (window.resolveLocalFileSystemURL) {
		let pending = cardSkinPresets.length;
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			resolveLocalFileSystemURL(
				decadeUIResolvePath + "image/card-skins/" + folder + "/",
				entry => {
					entry.createReader().readEntries(entries => {
						readFiles(entries, skin.key, folder, skin.extension, true);
						if (--pending === 0) processQueue();
					});
				},
				() => {
					if (--pending === 0) processQueue();
				}
			);
		});
	} else {
		setTimeout(processQueue, 0);
	}

	return { cards, handTips: [], registerCardSkin };
}
