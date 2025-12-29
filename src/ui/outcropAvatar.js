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
 * 检查露头图片是否存在
 * @param {string} path - 图片路径
 * @returns {Promise<boolean>}
 */
function checkImageExists(path) {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = path;
	});
}

/**
 * 设置玩家头像
 * @param {Object} player - 玩家对象
 * @param {string} characterName - 武将名称
 * @param {HTMLElement} avatarNode - 头像节点
 * @param {string} outcropStyle - 露头样式
 */
async function setPlayerAvatar(player, characterName, avatarNode, outcropStyle) {
	if (!avatarNode || !characterName) return;

	const outcropPath = getOutcropImagePath(characterName, outcropStyle);

	if (outcropPath) {
		const exists = await checkImageExists(outcropPath);
		if (exists) {
			avatarNode.setBackgroundImage(outcropPath);
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
export async function updatePlayerOutcropAvatar(player, outcropStyle) {
	if (!player?.node) return;

	const name1 = player.name1 || player.name;
	const name2 = player.name2;

	// 更新主将头像
	if (player.node.avatar && name1) {
		await setPlayerAvatar(player, name1, player.node.avatar, outcropStyle);
	}

	// 更新副将头像
	if (player.node.avatar2 && name2) {
		await setPlayerAvatar(player, name2, player.node.avatar2, outcropStyle);
	}
}

/**
 * 更新所有玩家的露头头像
 * @param {string} [outcropStyle] - 露头样式，不传则从配置读取
 */
export async function updateAllOutcropAvatars(outcropStyle) {
	outcropStyle = outcropStyle ?? lib.config.extension_十周年UI_outcropSkin ?? "off";

	const players = [...(game.players || []), ...(game.dead || [])];
	for (const player of players) {
		await updatePlayerOutcropAvatar(player, outcropStyle);
	}
}

/**
 * 初始化露头头像功能
 */
export function setupOutcropAvatar() {
	// 挂载到decadeUI供外部调用
	if (window.decadeUI) {
		decadeUI.updateOutcropAvatar = updatePlayerOutcropAvatar;
		decadeUI.updateAllOutcropAvatars = updateAllOutcropAvatars;
	}
}
