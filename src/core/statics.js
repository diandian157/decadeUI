/**
 * 静态资源模块
 */
import { cardSkinPresets } from "../config.js";

/** 创建statics模块 */
export function createStaticsModule() {
	const cards = {};

	const ensureSkinCache = skinKey => {
		if (!cards[skinKey]) cards[skinKey] = {};
		return cards[skinKey];
	};

	cards.READ_OK = {};

	const readFiles = (files, skinKey, folder, extension, entry) => {
		if (!folder) return;
		const skinCache = ensureSkinCache(skinKey);
		const prefix = decadeUIPath + "image/card/" + folder + "/";
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
			fs.readdir(__dirname + "/" + decadeUIPath + "image/card/" + folder + "/", (err, files) => {
				if (!err) readFiles(files, skin.key, folder, skin.extension);
			});
		});
	} else if (window.resolveLocalFileSystemURL) {
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			resolveLocalFileSystemURL(decadeUIResolvePath + "image/card/" + folder + "/", entry => {
				entry.createReader().readEntries(entries => readFiles(entries, skin.key, folder, skin.extension, true));
			});
		});
	}

	return { cards, handTips: [] };
}
