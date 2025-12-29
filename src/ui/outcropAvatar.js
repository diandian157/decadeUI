/**
 * @fileoverview 露头头像模块
 * 根据露头样式配置切换武将头像图片路径
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {Record<string, string>} 露头样式对应的图片目录 */
const OUTCROP_PATHS = {
	shizhounian: "extension/十周年UI/image/character/dcloutou/",
	shousha: "extension/十周年UI/image/character/ssloutou/",
};

/** 默认剪影图片名称 */
const DEFAULT_SILHOUETTES = {
	male: "default_silhouette_male.jpg",
	female: "default_silhouette_female.jpg",
	double: "default_silhouette_double.jpg",
};

/** @type {Map<string, Promise<boolean>>} 图片存在性缓存 */
const imageExistsCache = new Map();

/**
 * 获取武将露头图片路径
 * @param {string} characterName - 武将名称
 * @param {string} outcropStyle - 露头样式
 * @returns {string|null} 图片路径，如果是off则返回null
 */
export function getOutcropImagePath(characterName, outcropStyle) {
	if (!outcropStyle || outcropStyle === "off" || !OUTCROP_PATHS[outcropStyle]) {
		return null;
	}
	return `${lib.assetURL}${OUTCROP_PATHS[outcropStyle]}${characterName}.jpg`;
}

/**
 * 获取武将默认剪影图片路径
 * @param {string} characterName - 武将名称
 * @param {string} outcropStyle - 露头样式
 * @returns {string|null} 默认剪影路径
 */
export function getDefaultSilhouettePath(characterName, outcropStyle) {
	if (!outcropStyle || outcropStyle === "off" || !OUTCROP_PATHS[outcropStyle]) {
		return null;
	}

	const info = lib.character[characterName];
	if (!info) return null;

	const sex = info[0];
	let silhouette;

	if (sex === "male") {
		silhouette = DEFAULT_SILHOUETTES.male;
	} else if (sex === "female") {
		silhouette = DEFAULT_SILHOUETTES.female;
	} else if (sex === "double") {
		silhouette = DEFAULT_SILHOUETTES.double;
	} else {
		// 未知性别默认使用男性剪影
		silhouette = DEFAULT_SILHOUETTES.male;
	}

	return `${lib.assetURL}${OUTCROP_PATHS[outcropStyle]}${silhouette}`;
}

/**
 * 检查露头图片是否存在
 * @param {string} path - 图片路径
 * @returns {Promise<boolean>}
 */
export function checkImageExists(path) {
	if (imageExistsCache.has(path)) {
		return imageExistsCache.get(path);
	}

	const promise = new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = path;
	});

	imageExistsCache.set(path, promise);
	return promise;
}

/**
 * 设置玩家头像
 * @param {string} characterName - 武将名称
 * @param {HTMLElement} avatarNode - 头像节点
 * @param {string} outcropStyle - 露头样式
 */
async function setPlayerAvatar(characterName, avatarNode, outcropStyle) {
	if (!avatarNode || !characterName) return;

	const outcropPath = getOutcropImagePath(characterName, outcropStyle);

	if (outcropPath) {
		if (await checkImageExists(outcropPath)) {
			avatarNode.setBackgroundImage(outcropPath);
			return;
		}

		// 露头图不存在，尝试使用默认剪影
		const silhouettePath = getDefaultSilhouettePath(characterName, outcropStyle);
		if (silhouettePath && (await checkImageExists(silhouettePath))) {
			avatarNode.setBackgroundImage(silhouettePath);
			return;
		}
	}

	// 没有露头图片或样式为off，使用本体默认路径
	avatarNode.setBackground(characterName, "character");
}

/**
 * 更新单个玩家的露头头像
 * @param {Object} player - 玩家对象
 * @param {string} outcropStyle - 露头样式
 */
export function updatePlayerOutcropAvatar(player, outcropStyle) {
	if (!player?.node) return Promise.resolve();

	const name1 = player.name1 || player.name;
	const name2 = player.name2;

	const tasks = [];

	// 更新主将头像
	if (player.node.avatar && name1) {
		tasks.push(setPlayerAvatar(name1, player.node.avatar, outcropStyle));
	}

	// 更新副将头像
	if (player.node.avatar2 && name2) {
		tasks.push(setPlayerAvatar(name2, player.node.avatar2, outcropStyle));
	}

	return Promise.all(tasks);
}

/**
 * 更新所有玩家的露头头像
 * @param {string} [outcropStyle] - 露头样式，不传则从配置读取
 */
export function updateAllOutcropAvatars(outcropStyle) {
	outcropStyle = outcropStyle ?? lib.config.extension_十周年UI_outcropSkin ?? "off";

	const players = [...(game.players || []), ...(game.dead || [])];
	return Promise.all(players.map(player => updatePlayerOutcropAvatar(player, outcropStyle)));
}

/**
 * 清除图片缓存（用于切换样式时）
 */
export function clearOutcropCache() {
	imageExistsCache.clear();
}

/**
 * 初始化露头头像功能
 */
export function setupOutcropAvatar() {
	// 挂载到decadeUI供外部调用
	const decadeUI = /** @type {any} */ (window).decadeUI;
	if (decadeUI) {
		decadeUI.updateOutcropAvatar = updatePlayerOutcropAvatar;
		decadeUI.updateAllOutcropAvatars = updateAllOutcropAvatars;
		decadeUI.clearOutcropCache = clearOutcropCache;
	}
}
