/**
 * @fileoverview 卡牌幻影拖尾模块
 * 使用对象池 + 节流RAF追踪 + CSS动画实现幻影效果
 * 性能杀手，必要可以手动减低幻影生成间隔 + 幻影持续时间 + 对象池最大容量
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {boolean} 是否已初始化 */
let initialized = false;

/** @type {boolean} 是否启用幻影效果 */
let enabled = true;

/** @type {Set<HTMLElement>} 正在追踪的卡牌 */
const trackingCards = new Set();

/** @type {number|null} 全局RAF ID */
let globalRafId = null;

/** @type {number} 上次生成幻影的时间 */
let lastSpawnTime = 0;

/** @type {number} 幻影生成间隔(ms) */
const SPAWN_INTERVAL = 10;

/** @type {number} 幻影持续时间(ms) */
const GHOST_DURATION = 300;

/** @type {string} 发光颜色 */
const GLOW_COLOR = "rgba(255, 0, 0, 0.53)";

/** @type {number} 对象池最大容量 */
const POOL_MAX_SIZE = 30;

/** @type {HTMLElement[]} 幻影对象池 */
const ghostPool = [];

/**
 * 从对象池获取幻影元素
 * @returns {HTMLElement}
 */
function acquireGhost() {
	if (ghostPool.length > 0) {
		return ghostPool.pop();
	}
	const ghost = document.createElement("div");
	ghost.className = "card-ghost-trail";
	return ghost;
}

/**
 * 归还幻影元素到对象池
 * @param {HTMLElement} ghost
 */
function releaseGhost(ghost) {
	if (ghost.parentNode) {
		ghost.parentNode.removeChild(ghost);
	}
	ghost.style.cssText = "";
	ghost.style.transition = "";
	ghost.style.opacity = "";
	ghost.style.transform = "";

	if (ghostPool.length < POOL_MAX_SIZE) {
		ghostPool.push(ghost);
	}
}

/**
 * 创建幻影元素
 * @param {HTMLElement} card
 */
function spawnGhost(card) {
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

	// 下一帧开始动画
	requestAnimationFrame(() => {
		ghost.style.transition = `opacity ${GHOST_DURATION}ms ease-out, transform ${GHOST_DURATION}ms ease-out`;
		ghost.style.opacity = "0";
		ghost.style.transform = "scale(0.85)";
	});

	// 归还到对象池
	setTimeout(() => releaseGhost(ghost), GHOST_DURATION + 50);
}

/**
 * 全局追踪循环 - 单个RAF处理所有卡牌
 */
function trackLoop() {
	if (trackingCards.size === 0) {
		globalRafId = null;
		return;
	}

	const now = Date.now();

	// 节流：控制幻影生成频率
	if (now - lastSpawnTime >= SPAWN_INTERVAL) {
		lastSpawnTime = now;

		trackingCards.forEach(card => {
			// 检查卡牌是否还在DOM中
			if (!card.parentNode) {
				trackingCards.delete(card);
				return;
			}

			const rect = card.getBoundingClientRect();
			const lastPos = card._ghostLastPos;

			// 检测移动
			if (lastPos) {
				const dx = Math.abs(rect.left - lastPos.x);
				const dy = Math.abs(rect.top - lastPos.y);
				if (dx > 2 || dy > 2) {
					spawnGhost(card);
				}
			}

			card._ghostLastPos = { x: rect.left, y: rect.top };
		});
	}

	globalRafId = requestAnimationFrame(trackLoop);
}

/**
 * 开始追踪卡牌
 * @param {HTMLElement} card
 */
function startTracking(card) {
	if (!enabled || !card || trackingCards.has(card)) return;

	card._ghostLastPos = null;
	trackingCards.add(card);

	// 启动全局循环
	if (globalRafId === null) {
		lastSpawnTime = 0;
		globalRafId = requestAnimationFrame(trackLoop);
	}
}

/**
 * 停止追踪卡牌
 * @param {HTMLElement} card
 */
function stopTracking(card) {
	trackingCards.delete(card);
	delete card._ghostLastPos;
}

/**
 * 为卡牌添加幻影效果
 * @param {HTMLElement} card
 * @param {number} [duration=800] 追踪持续时间
 */
export function addGhostTrail(card, duration = 800) {
	if (!enabled || !card) return;

	startTracking(card);

	// 监听动画结束
	const cleanup = () => {
		setTimeout(() => stopTracking(card), 100);
	};

	card.addEventListener("transitionend", cleanup, { once: true });
	card.addEventListener("transitioncancel", cleanup, { once: true });

	// 备用清理 （应该用不到，万一呢
	setTimeout(() => stopTracking(card), duration);
}

/**
 * 注入CSS样式
 */
function injectStyles() {
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
}

/**
 * 包装$throwordered2
 */
function wrapThrowordered2(original) {
	return function (card) {
		const result = original.apply(this, arguments);
		if (enabled && card && !card.classList?.contains("card-ghost-trail")) {
			requestAnimationFrame(() => addGhostTrail(card, 1000));
		}
		return result;
	};
}

/**
 * 包装layoutDrawCards
 */
function wrapLayoutDrawCards(original) {
	return function (cards) {
		const result = original.apply(this, arguments);
		if (enabled && cards) {
			const arr = Array.isArray(cards) ? cards : [cards];
			requestAnimationFrame(() => {
				arr.forEach(card => {
					if (card && !card.classList?.contains("card-ghost-trail")) {
						addGhostTrail(card, 600);
					}
				});
			});
		}
		return result;
	};
}

/**
 * 初始化
 */
export function setupCardGhost() {
	if (initialized) return;
	initialized = true;

	enabled = lib.config["extension_十周年UI_cardGhostEffect"] !== false;
	injectStyles();

	// 出牌
	if (lib.element?.player?.$throwordered2) {
		lib.element.player.$throwordered2 = wrapThrowordered2(lib.element.player.$throwordered2);
	}

	// 摸牌
	setTimeout(() => {
		if (window.decadeUI?.layoutDrawCards && !window.decadeUI._ghostHooked) {
			window.decadeUI._ghostHooked = true;
			window.decadeUI.layoutDrawCards = wrapLayoutDrawCards(window.decadeUI.layoutDrawCards);
		}
	}, 100);
}

/**
 * 设置启用状态
 */
export function setGhostEffectEnabled(value) {
	enabled = !!value;
	if (!enabled) {
		trackingCards.clear();
	}
}

/**
 * 清空对象池 （用于内存清理
 */
export function clearGhostPool() {
	ghostPool.length = 0;
}

export const GHOST_CONFIG = { SPAWN_INTERVAL, GHOST_DURATION, GLOW_COLOR, POOL_MAX_SIZE };
