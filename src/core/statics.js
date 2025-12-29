/**
 * @fileoverview 静态资源模块，管理卡牌皮肤等静态资源的加载和缓存
 */
import { cardSkinPresets } from "../config.js";

/**
 * 创建statics模块
 * @returns {Object} statics模块对象
 */
export function createStaticsModule() {
	/** @type {Object} 卡牌皮肤缓存 */
	const cards = {};

	/**
	 * 确保皮肤缓存存在
	 * @param {string} skinKey - 皮肤键名
	 * @returns {Object} 皮肤缓存对象
	 */
	const ensureSkinCache = skinKey => {
		if (!cards[skinKey]) cards[skinKey] = {};
		return cards[skinKey];
	};

	/** @type {Object} 读取完成标记 */
	cards.READ_OK = {};

	/**
	 * 读取文件列表
	 * @param {Array} files - 文件列表
	 * @param {string} skinKey - 皮肤键名
	 * @param {string} folder - 文件夹名
	 * @param {string} extension - 文件扩展名
	 * @param {boolean} entry - 是否为目录条目
	 */
	const readFiles = (files, skinKey, folder, extension, entry) => {
		if (!folder) return;
		const skinCache = ensureSkinCache(skinKey);
		const prefix = decadeUIPath + "image/card-skins/" + folder + "/";
		const ext = extension ? "." + extension.toLowerCase() : null;
		cards.READ_OK[skinKey] = true;

		for (const current of files) {
			let filename = entry ? current.name : current;
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

	// 加载卡牌皮肤资源
	if (window.fs) {
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			fs.readdir(__dirname + "/" + decadeUIPath + "image/card-skins/" + folder + "/", (err, files) => {
				if (!err) readFiles(files, skin.key, folder, skin.extension);
			});
		});
	} else if (window.resolveLocalFileSystemURL) {
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			resolveLocalFileSystemURL(decadeUIResolvePath + "image/card-skins/" + folder + "/", entry => {
				entry.createReader().readEntries(entries => readFiles(entries, skin.key, folder, skin.extension, true));
			});
		});
	}

	return { cards, handTips: [] };
}
