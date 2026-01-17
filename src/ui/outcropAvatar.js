/**
 * @fileoverview 露头头像模块
 * 支持懒加载和请求节流，避免大量并发请求导致卡顿
 * 支持扩展按约定目录结构提供露头图
 */

import { lib, game, _status } from "noname";

/** @type {Record<string, string>} 露头样式对应的子目录名 */
const OUTCROP_SUBDIRS = {
	shizhounian: "dcloutou",
	shousha: "ssloutou",
};

/** @type {Map<string, Promise<boolean>>} 图片存在性缓存 */
const imageExistsCache = new Map();

/** 请求节流控制 */
const requestQueue = {
	pending: [],
	active: 0,
	maxConcurrent: 4,

	add(task) {
		if (this.active < this.maxConcurrent) {
			this.active++;
			task();
		} else {
			this.pending.push(task);
		}
	},

	next() {
		this.active--;
		if (this.pending.length > 0 && this.active < this.maxConcurrent) {
			this.active++;
			this.pending.shift()();
		}
	},
};

/**
 * 获取当前露头样式配置
 * @returns {string}
 */
export const getOutcropStyle = () => lib.config?.extension_十周年UI_outcropSkin ?? "off";

/**
 * 解析武将图片引用，提取实际武将名称
 * 支持格式:
 * 1. 图片路径: "image/character/yj_puyuan.jpg" -> "yj_puyuan"
 * 2. 武将引用: "character:xurong" -> "xurong"
 * @param {string} ref - 图片路径或武将引用
 * @returns {string|null}
 */
function parseCharacterRef(ref) {
	if (!ref || typeof ref !== "string") return null;
	if (ref.startsWith("character:")) return ref.slice(10);
	const match = ref.match(/image\/character\/([^\/]+)\.(jpg|png|webp|gif)$/i);
	return match ? match[1] : null;
}

/**
 * 从武将扩展信息数组中查找 character:xxx 引用
 * @param {Array} extArray - 扩展信息数组
 * @returns {string|null}
 */
function findCharacterRefInArray(extArray) {
	if (!Array.isArray(extArray)) return null;
	for (const item of extArray) {
		if (typeof item === "string" && item.startsWith("character:")) {
			return item.slice(10);
		}
	}
	return null;
}

/**
 * 获取武将所属扩展名
 * 从武将图片路径中提取扩展名
 * @param {string} characterName - 武将名称
 * @returns {string|null} 扩展名
 */
function getCharacterExtension(characterName) {
	const characterInfo = lib.character?.[characterName];
	if (!characterInfo) return null;

	if (characterInfo.img) {
		const match = characterInfo.img.match(/^extension\/([^\/]+)\//);
		if (match) return match[1];
	}

	if (Array.isArray(characterInfo.trashBin)) {
		for (const item of characterInfo.trashBin) {
			if (typeof item === "string" && item.startsWith("img:")) {
				const match = item.slice(4).match(/^extension\/([^\/]+)\//);
				if (match) return match[1];
			}
		}
	}

	return null;
}

/**
 * 获取武将用于露头图查找的实际名称
 * 优先级: img属性 > trashBin中的character引用 > 武将本身名称
 * @param {string} characterName - 武将名称
 * @returns {string}
 */
export function getOutcropCharacterName(characterName) {
	if (!characterName) return characterName;

	const characterInfo = lib.character?.[characterName];
	if (!characterInfo) return characterName;

	if (characterInfo.img) {
		const name = parseCharacterRef(characterInfo.img);
		if (name) return name;
	}

	const refName = findCharacterRefInArray(characterInfo.trashBin);
	if (refName) return refName;

	return characterName;
}

/**
 * 获取武将露头图片路径
 * 查找顺序：扩展目录 > 十周年UI目录
 * @param {string} characterName - 武将名称
 * @param {string} [outcropStyle] - 露头样式
 * @returns {string|null}
 */
export function getOutcropImagePath(characterName, outcropStyle) {
	outcropStyle = outcropStyle ?? getOutcropStyle();
	if (!outcropStyle || outcropStyle === "off" || !OUTCROP_SUBDIRS[outcropStyle]) {
		return null;
	}

	const actualName = getOutcropCharacterName(characterName);
	const subdir = OUTCROP_SUBDIRS[outcropStyle];

	// 先检查武将所属扩展的露头图目录
	const extName = getCharacterExtension(characterName);
	if (extName) {
		return `${lib.assetURL}extension/${extName}/image/character/${subdir}/${actualName}.jpg`;
	}

	// 回退到十周年UI目录
	return `${lib.assetURL}extension/十周年UI/image/character/${subdir}/${actualName}.jpg`;
}

/**
 * 检查露头图片是否存在（带节流）
 * @param {string} path - 图片路径
 * @returns {Promise<boolean>}
 */
export function checkImageExists(path) {
	if (imageExistsCache.has(path)) {
		return imageExistsCache.get(path);
	}

	const promise = new Promise(resolve => {
		requestQueue.add(() => {
			const img = new Image();
			const cleanup = result => {
				requestQueue.next();
				resolve(result);
			};
			img.onload = () => cleanup(true);
			img.onerror = () => cleanup(false);
			img.src = path;
		});
	});

	imageExistsCache.set(path, promise);
	return promise;
}

/**
 * 检查玩家是否处于隐匿状态
 * @param {HTMLElement} node - avatar节点
 * @param {boolean} isVice - 是否是副将
 * @returns {boolean}
 */
function isPlayerUnseen(node, isVice) {
	const player = node?.parentElement;
	if (!player?.classList) return false;

	if (isVice) {
		return player.classList.contains("unseen2_show") || player.classList.contains("unseen2");
	}
	return player.classList.contains("unseen_show") || player.classList.contains("unseen");
}

/**
 * 应用露头头像到节点
 * @param {string} characterName - 武将名称
 * @param {HTMLElement} node - 目标节点
 * @param {string} [outcropStyle] - 露头样式
 * @returns {Promise<boolean>} 是否成功应用露头图
 */
export async function applyOutcropAvatar(characterName, node, outcropStyle) {
	if (!node || !characterName) return false;

	outcropStyle = outcropStyle ?? getOutcropStyle();
	if (outcropStyle === "off") {
		node.classList.remove("has-outcrop");
		return false;
	}

	const subdir = OUTCROP_SUBDIRS[outcropStyle];
	if (!subdir) {
		node.classList.remove("has-outcrop");
		return false;
	}

	// 检查是否处于隐匿状态
	const isVice = node.classList.contains("avatar2");
	if (isPlayerUnseen(node, isVice)) {
		const hiddenPath = `${lib.assetURL}extension/十周年UI/image/character/${subdir}/hidden_image.jpg`;
		if (await checkImageExists(hiddenPath)) {
			node.style.setProperty("background-image", `url("${hiddenPath}")`, "important");
			node.classList.add("has-outcrop");
			return true;
		}
		node.classList.remove("has-outcrop");
		return false;
	}

	const actualName = getOutcropCharacterName(characterName);
	const candidatePaths = [];

	// 1. 扩展目录的露头图
	const extName = getCharacterExtension(characterName);
	if (extName) {
		candidatePaths.push(`${lib.assetURL}extension/${extName}/image/character/${subdir}/${actualName}.jpg`);
	}

	// 2. 十周年UI目录的露头图
	candidatePaths.push(`${lib.assetURL}extension/十周年UI/image/character/${subdir}/${actualName}.jpg`);

	// 依次检查路径
	for (const path of candidatePaths) {
		if (await checkImageExists(path)) {
			node.style.backgroundImage = `url("${path}")`;
			node.classList.add("has-outcrop");
			return true;
		}
	}

	// 没有露头图，移除露头样式class，交给本体处理
	node.classList.remove("has-outcrop");
	return false;
}

/**
 * 更新单个玩家的露头头像
 * @param {Object} player - 玩家对象
 * @param {string} [outcropStyle] - 露头样式
 */
export async function updatePlayerOutcropAvatar(player, outcropStyle) {
	if (!player?.node) return;

	outcropStyle = outcropStyle ?? getOutcropStyle();
	const tasks = [];

	const name1 = player.name1 || player.name;
	if (player.node.avatar && name1) {
		tasks.push(applyOutcropAvatar(name1, player.node.avatar, outcropStyle));
	}

	const name2 = player.name2;
	if (player.node.avatar2 && name2) {
		tasks.push(applyOutcropAvatar(name2, player.node.avatar2, outcropStyle));
	}

	await Promise.all(tasks);
}

/**
 * 更新所有玩家的露头头像
 * @param {string} [outcropStyle] - 露头样式
 */
export function updateAllOutcropAvatars(outcropStyle) {
	outcropStyle = outcropStyle ?? getOutcropStyle();
	const players = [...(game.players || []), ...(game.dead || [])];
	return Promise.all(players.map(p => updatePlayerOutcropAvatar(p, outcropStyle)));
}

/**
 * 清除图片缓存
 */
export function clearOutcropCache() {
	imageExistsCache.clear();
}

/**
 * 创建懒加载观察器
 * @param {(node: HTMLElement) => void} callback - 进入视口时的回调
 * @returns {IntersectionObserver}
 */
export function createLazyObserver(callback) {
	return new IntersectionObserver(
		entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					callback(entry.target);
				}
			});
		},
		{ rootMargin: "50px" }
	);
}

/** @type {IntersectionObserver|null} 全局懒加载观察器 */
let globalLazyObserver = null;

/**
 * 获取全局懒加载观察器（单例）
 * @returns {IntersectionObserver}
 */
export function getLazyObserver() {
	if (!globalLazyObserver) {
		globalLazyObserver = createLazyObserver(node => {
			const characterName = node._outcropCharacter;
			if (characterName) {
				applyOutcropAvatar(characterName, node);
				globalLazyObserver.unobserve(node);
				delete node._outcropCharacter;
			}
		});
	}
	return globalLazyObserver;
}

/**
 * 注册节点进行懒加载
 * @param {HTMLElement} node - 目标节点
 * @param {string} characterName - 武将名称
 */
export function registerLazyOutcrop(node, characterName) {
	if (!node || !characterName || getOutcropStyle() === "off") return;
	node._outcropCharacter = characterName;
	getLazyObserver().observe(node);
}

/**
 * 初始化露头头像功能
 */
export function setupOutcropAvatar() {
	const decadeUI = window.decadeUI;
	if (decadeUI) {
		decadeUI.updateOutcropAvatar = updatePlayerOutcropAvatar;
		decadeUI.updateAllOutcropAvatars = updateAllOutcropAvatars;
		decadeUI.clearOutcropCache = clearOutcropCache;
		decadeUI.registerLazyOutcrop = registerLazyOutcrop;
		decadeUI.applyOutcropAvatar = applyOutcropAvatar;
	}

	// Hook 原生方法
	hookSetBackground();
	hookSmoothAvatar();
	hookChangeSkin();
	hookShowCharacter();
}

/** 原始 setBackground 方法引用 */
let originalSetBackground = null;

/**
 * Hook setBackground 方法，拦截武将头像更换
 */
function hookSetBackground() {
	if (originalSetBackground) return;

	const proto = HTMLDivElement.prototype;
	originalSetBackground = proto.setBackground;

	if (!originalSetBackground) return;

	proto.setBackground = function (name, type, ...args) {
		const result = originalSetBackground.call(this, name, type, ...args);

		if (type === "character" && getOutcropStyle() !== "off") {
			const isPlayerAvatar = this.classList.contains("avatar") && this.parentElement?.classList.contains("player");
			if (isPlayerAvatar) {
				setTimeout(() => {
					applyOutcropAvatar(name, this);
				}, 0);
			}
		}

		return result;
	};
}

/**
 * Hook smoothAvatar 方法，在换皮动画后应用露头图
 */
function hookSmoothAvatar() {
	if (!lib.element?.Player?.prototype?.smoothAvatar) return;

	const originalSmoothAvatar = lib.element.Player.prototype.smoothAvatar;

	lib.element.Player.prototype.smoothAvatar = function (vice, video) {
		const result = originalSmoothAvatar.call(this, vice, video);

		if (getOutcropStyle() !== "off") {
			const player = this;
			setTimeout(() => {
				const characterName = vice ? player.name2 : player.name1 || player.name;
				const avatarNode = vice ? player.node?.avatar2 : player.node?.avatar;
				if (characterName && avatarNode) {
					applyOutcropAvatar(characterName, avatarNode);
				}
			}, 150);
		}

		return result;
	};
}

/**
 * Hook changeSkin 方法
 */
function hookChangeSkin() {
	if (!lib.element?.Player?.prototype?.changeSkin) return;

	const originalChangeSkin = lib.element.Player.prototype.changeSkin;

	lib.element.Player.prototype.changeSkin = function (map, character) {
		const result = originalChangeSkin.call(this, map, character);

		if (getOutcropStyle() !== "off" && character) {
			const player = this;
			setTimeout(() => {
				const isVice = player.name2 === character;
				const avatarNode = isVice ? player.node?.avatar2 : player.node?.avatar;
				if (avatarNode) {
					applyOutcropAvatar(character, avatarNode);
				}
			}, 150);
		}

		return result;
	};
}

/**
 * Hook $showCharacter 方法，在玩家亮出武将后更新露头图
 */
function hookShowCharacter() {
	if (!lib.element?.Player?.prototype?.$showCharacter) return;

	const original$showCharacter = lib.element.Player.prototype.$showCharacter;

	lib.element.Player.prototype.$showCharacter = function (num, log) {
		const result = original$showCharacter.call(this, num, log);

		if (getOutcropStyle() !== "off") {
			const player = this;
			setTimeout(() => {
				if ((num === 0 || num === 2) && player.node?.avatar) {
					const name1 = player.name1 || player.name;
					if (name1) {
						applyOutcropAvatar(name1, player.node.avatar);
					}
				}
				if ((num === 1 || num === 2) && player.node?.avatar2) {
					const name2 = player.name2;
					if (name2) {
						applyOutcropAvatar(name2, player.node.avatar2);
					}
				}
			}, 50);
		}

		return result;
	};
}
