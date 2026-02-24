/**
 * 卡牌幻影拖尾模块 - 使用对象池 + 节流RAF + CSS动画实现幻影效果
 */

import { lib, ui, _status } from "noname";
import { wrapAround } from "../utils/safeOverride.js";

const SPAWN_INTERVAL = 10;
const GHOST_DURATION = 300;
const GLOW_COLOR = "rgba(255, 0, 0, 0.53)";
const POOL_MAX_SIZE = 30;
const MAX_TRACKING_CARDS = 10;

let initialized = false;
let enabled = true;
let globalRafId = null;
let lastSpawnTime = 0;

const trackingCards = new Map();
const ghostPool = [];

/**
 * 从对象池获取幻影元素
 * @returns {HTMLElement}
 */
const acquireGhost = () => {
	if (ghostPool.length > 0) {
		return ghostPool.pop();
	}
	const ghost = document.createElement("div");
	ghost.className = "card-ghost-trail";
	return ghost;
};

/**
 * 归还幻影元素到对象池
 * @param {HTMLElement} ghost
 */
const releaseGhost = ghost => {
	if (ghost.parentNode) {
		ghost.parentNode.removeChild(ghost);
	}
	ghost.style.cssText = "";

	if (ghostPool.length < POOL_MAX_SIZE) {
		ghostPool.push(ghost);
	}
};

/**
 * 创建幻影元素
 * @param {HTMLElement} card
 */
const spawnGhost = card => {
	const rect = card.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) return;

	const ghost = acquireGhost();
	const style = getComputedStyle(card);
	const bgImage = style.backgroundImage;

	const arenaRect = ui.arena.getBoundingClientRect();
	const scaleX = arenaRect.width / ui.arena.offsetWidth || 1;
	const scaleY = arenaRect.height / ui.arena.offsetHeight || 1;
	const relativeLeft = (rect.left - arenaRect.left) / scaleX + ui.arena.scrollLeft;
	const relativeTop = (rect.top - arenaRect.top) / scaleY + ui.arena.scrollTop;

	ghost.style.cssText = `
		position: absolute;
		left: ${relativeLeft}px;
		top: ${relativeTop}px;
		width: ${rect.width / scaleX}px;
		height: ${rect.height / scaleY}px;
		background-image: ${bgImage};
		background-size: cover;
		background-position: center;
		border-radius: 4px;
		pointer-events: none;
		z-index: 1;
		opacity: 0.5;
		box-shadow: 0 0 12px ${GLOW_COLOR};
		filter: blur(1px);
	`;

	ui.arena.appendChild(ghost);

	requestAnimationFrame(() => {
		ghost.style.transition = `opacity ${GHOST_DURATION}ms ease-out, transform ${GHOST_DURATION}ms ease-out`;
		ghost.style.opacity = "0";
		ghost.style.transform = "scale(0.85)";
	});

	setTimeout(() => releaseGhost(ghost), GHOST_DURATION + 50);
};

/**
 * 全局追踪循环
 */
const trackLoop = () => {
	if (trackingCards.size === 0) {
		globalRafId = null;
		return;
	}

	const now = Date.now();

	if (now - lastSpawnTime >= SPAWN_INTERVAL) {
		lastSpawnTime = now;

		for (const [card, data] of trackingCards) {
			if (!card.parentNode || now > data.endTime) {
				trackingCards.delete(card);
				continue;
			}

			const rect = card.getBoundingClientRect();
			const lastPos = data.lastPos;

			if (lastPos) {
				const dx = Math.abs(rect.left - lastPos.x);
				const dy = Math.abs(rect.top - lastPos.y);
				if (dx > 2 || dy > 2) {
					spawnGhost(card);
				}
			}

			data.lastPos = { x: rect.left, y: rect.top };
		}
	}

	globalRafId = requestAnimationFrame(trackLoop);
};

/**
 * 开始追踪卡牌
 * @param {HTMLElement} card
 * @param {number} duration
 */
const startTracking = (card, duration) => {
	if (!enabled || !card || trackingCards.has(card)) return;

	if (trackingCards.size >= MAX_TRACKING_CARDS) {
		const oldest = trackingCards.keys().next().value;
		trackingCards.delete(oldest);
	}

	trackingCards.set(card, {
		lastPos: null,
		endTime: Date.now() + duration,
	});

	if (globalRafId === null) {
		lastSpawnTime = 0;
		globalRafId = requestAnimationFrame(trackLoop);
	}
};

/**
 * 为卡牌添加幻影效果
 * @param {HTMLElement} card
 * @param {number} duration
 */
export const addGhostTrail = (card, duration = 800) => {
	if (!enabled || !card) return;
	startTracking(card, duration);
};

/**
 * 注入CSS样式
 */
const injectStyles = () => {
	const styleId = "decade-card-ghost-styles";
	if (document.getElementById(styleId)) return;

	const style = document.createElement("style");
	style.id = styleId;
	style.textContent = `
		.card-ghost-trail {
			will-change: opacity, transform;
		}
	`;
	document.head.appendChild(style);
};

/**
 * 清理所有追踪
 */
const cleanup = () => {
	trackingCards.clear();
	if (globalRafId !== null) {
		cancelAnimationFrame(globalRafId);
		globalRafId = null;
	}
};

/**
 * 初始化
 */
export function setupCardGhost() {
	if (initialized) return;
	initialized = true;

	enabled = lib.config["extension_十周年UI_cardGhostEffect"] !== false;
	injectStyles();

	if (lib.element?.player?.$throwordered2) {
		wrapAround(lib.element.player, "$throwordered2", function (original, ...args) {
			const result = original.apply(this, args);
			if (enabled && args[0] && !args[0].classList?.contains("card-ghost-trail")) {
				requestAnimationFrame(() => addGhostTrail(args[0], 1000));
			}
			return result;
		});
	}

	setTimeout(() => {
		if (window.decadeUI?.layoutDrawCards && !window.decadeUI._ghostHooked) {
			window.decadeUI._ghostHooked = true;
			wrapAround(window.decadeUI, "layoutDrawCards", function (original, ...args) {
				const result = original.apply(this, args);
				if (enabled && args[0]) {
					const arr = Array.isArray(args[0]) ? args[0] : [args[0]];
					requestAnimationFrame(() => {
						arr.forEach(card => {
							if (card && !card.classList?.contains("card-ghost-trail")) {
								addGhostTrail(card, 600);
							}
						});
					});
				}
				return result;
			});
		}
	}, 100);

	lib.hooks?.gameStart?.add?.(() => cleanup());
	lib.hooks?.gameOver?.add?.(() => cleanup());
}

/**
 * 设置启用状态
 * @param {boolean} value
 */
export function setGhostEffectEnabled(value) {
	enabled = !!value;
	if (!enabled) cleanup();
}

/**
 * 清空对象池
 */
export function clearGhostPool() {
	ghostPool.length = 0;
}

export const GHOST_CONFIG = { SPAWN_INTERVAL, GHOST_DURATION, GLOW_COLOR, POOL_MAX_SIZE };
