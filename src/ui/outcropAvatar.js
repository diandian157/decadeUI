/**
 * @fileoverview 露头头像模块
 * 支持懒加载和请求节流，避免大量并发请求导致卡顿
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
 * 获取武将露头图片路径
 * @param {string} characterName - 武将名称
 * @param {string} [outcropStyle] - 露头样式
 * @returns {string|null}
 */
export function getOutcropImagePath(characterName, outcropStyle) {
	outcropStyle = outcropStyle ?? getOutcropStyle();
	if (!outcropStyle || outcropStyle === "off" || !OUTCROP_PATHS[outcropStyle]) {
		return null;
	}
	return `${lib.assetURL}${OUTCROP_PATHS[outcropStyle]}${characterName}.jpg`;
}

/**
 * 获取武将默认剪影图片路径
 * @param {string} characterName - 武将名称
 * @param {string} [outcropStyle] - 露头样式
 * @returns {string|null}
 */
export function getDefaultSilhouettePath(characterName, outcropStyle) {
	outcropStyle = outcropStyle ?? getOutcropStyle();
	if (!outcropStyle || outcropStyle === "off" || !OUTCROP_PATHS[outcropStyle]) {
		return null;
	}

	const info = lib.character[characterName];
	if (!info) return null;

	const sex = info[0];
	const silhouette = sex === "female" ? DEFAULT_SILHOUETTES.female : sex === "double" ? DEFAULT_SILHOUETTES.double : DEFAULT_SILHOUETTES.male;

	return `${lib.assetURL}${OUTCROP_PATHS[outcropStyle]}${silhouette}`;
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

	const outcropPath = getOutcropImagePath(characterName, outcropStyle);
	if (outcropPath && (await checkImageExists(outcropPath))) {
		node.style.backgroundImage = `url("${outcropPath}")`;
		node.classList.add("has-outcrop");
		return true;
	}

	// 没有露头图，移除露头样式class，交给本体处理
	node.classList.remove("has-outcrop");
	if (typeof node.setBackground === "function") {
		node.setBackground(characterName, "character");
	}
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
	hookSetBackgroundImage();
	hookSetBackground();
	hookSmoothAvatar();
	hookChangeSkin();
}

/** 原始 setBackgroundImage 方法引用 */
let originalSetBackgroundImage = null;

/**
 * Hook setBackgroundImage 方法，替换剪影路径为扩展目录
 */
function hookSetBackgroundImage() {
	if (originalSetBackgroundImage) return;

	const proto = HTMLDivElement.prototype;
	originalSetBackgroundImage = proto.setBackgroundImage;

	if (!originalSetBackgroundImage) return;

	proto.setBackgroundImage = function (src, ...args) {
		const outcropStyle = getOutcropStyle();

		if (outcropStyle !== "off" && Array.isArray(src) && src.length >= 2) {
			const fallbackPath = src[1];
			if (typeof fallbackPath === "string" && fallbackPath.includes("default_silhouette_")) {
				const extSilhouettePath = fallbackPath.replace("image/character/default_silhouette_", OUTCROP_PATHS[outcropStyle] + "default_silhouette_");
				src = [src[0], extSilhouettePath];
			}
		}

		return originalSetBackgroundImage.call(this, src, ...args);
	};
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
				applyOutcropAvatar(name, this);
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
