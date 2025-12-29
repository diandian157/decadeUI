"use strict";

/**
 * @fileoverview 手牌拖拽排序模块
 * 水平拖动排序手牌，垂直拖出则放行给本体处理拖拽选目标
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {number} 拖拽触发阈值 */
const DRAG_THRESHOLD = 5;

/** @type {number} 脱离排序模式的垂直阈值 */
const ESCAPE_THRESHOLD = 50;

/** @type {string|null} 当前拖拽模式 */
let dragMode = null;

/** @type {HTMLElement|null} 源卡牌节点 */
let sourceNode = null;

/** @type {HTMLElement|null} 移动目标节点 */
let movedNode = null;

/** @type {number} 起始X坐标 */
let startX = 0;

/** @type {number} 起始Y坐标 */
let startY = 0;

/** @type {{x: number, y: number, scale: number}} 初始变换 */
let initialTransform = { x: 0, y: 0, scale: 1 };

/** @type {string|null} 原始指针事件样式 */
let originalPointerEvents = null;

/** @type {Object|null} 保存的等待拖拽状态 */
let savedWaitingForDrag = null;

/** @type {boolean} 是否为移动设备 */
const isMobile = /(iPhone|iPod|Android|ios|iPad|Mobile)/i.test(navigator.userAgent);

/** @type {boolean} 是否支持指针事件 */
const hasPointer = "PointerEvent" in window;

/** @type {string[]} 事件名称数组 */
const evts = hasPointer ? ["pointerdown", "pointermove", "pointerup"] : isMobile ? ["touchstart", "touchmove", "touchend"] : ["mousedown", "mousemove", "mouseup"];

/** @type {string|null} 取消事件名称 */
const cancelEvt = hasPointer ? "pointercancel" : isMobile ? "touchcancel" : null;

/**
 * 包装函数为 Promise
 * @param {Function} fn - 要执行的函数
 * @returns {Promise}
 */
const raf = fn => new Promise(r => requestAnimationFrame(() => r(fn())));

/**
 * 获取事件坐标点
 * @param {Event} e - 事件对象
 * @returns {Object} 坐标点
 */
const getPoint = e => (hasPointer ? e : (e.touches?.[0] ?? e.changedTouches?.[0] ?? e));

/**
 * 获取目标卡牌元素
 * @param {HTMLElement} t - 目标元素
 * @returns {HTMLElement|null}
 */
const getCard = t => t?.closest?.(".card") ?? null;

/**
 * 获取元素变换信息
 * @param {HTMLElement} el - 元素
 * @returns {Promise<{x: number, y: number, scale: number}>}
 */
const getTransform = el =>
	raf(() => {
		try {
			const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
			return { x: m.m41, y: m.m42, scale: m.m11 };
		} catch {
			return { x: 0, y: 0, scale: 1 };
		}
	});

/**
 * 检查是否可滚动
 * @returns {boolean}
 */
const isScrollable = () => ui?.handcards1Container?.classList.contains("scrollh") || getComputedStyle(ui?.handcards1Container).overflowX === "scroll";

/**
 * 设置卡牌变换
 * @param {HTMLElement} card - 卡牌元素
 * @param {number} tx - X偏移
 * @param {number} ty - Y偏移
 * @param {number} [scale] - 缩放比例
 */
const setTransform = async (card, tx, ty, scale = card?.scale ?? 1) => {
	if (!card || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
	await raf(() => {
		card.tx = tx;
		card.ty = ty;
		card.style.transform = card._transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
	});
};

/**
 * 清理拖拽状态
 * @param {boolean} [skipLayout=false] - 是否跳过布局更新
 */
const cleanup = async (skipLayout = false) => {
	const card = sourceNode;
	if (!card) return;

	if (dragMode === "sort" && !movedNode) {
		card.style.transform = `translate(${initialTransform.x}px, ${initialTransform.y}px) scale(${initialTransform.scale})`;
	}

	Object.assign(card.style, { transition: "", pointerEvents: originalPointerEvents ?? "", opacity: "1", zIndex: "" });

	document.removeEventListener(evts[1], onMove);
	document.removeEventListener(evts[2], onEnd);
	if (cancelEvt) document.removeEventListener(cancelEvt, onEnd);
	window.removeEventListener("blur", onEnd);

	sourceNode = movedNode = dragMode = savedWaitingForDrag = null;
	if (!skipLayout) raf(() => window.decadeUI?.layout?.updateHand?.());
	_status.dragged = null;
};

/**
 * 拖拽开始处理
 * @param {Event} e - 事件对象
 */
const onStart = async e => {
	if (game.me?.hasSkillTag("noSortCard")) return;
	if (!hasPointer && e.button === 2) return;
	if (isScrollable()) return;
	if (sourceNode) await cleanup(true);

	const card = getCard(e.target);
	if (!card || card.parentNode !== ui.handcards1) return;

	const { clientX, clientY } = getPoint(e);
	const t = await getTransform(card);

	sourceNode = card;
	startX = clientX;
	startY = clientY;
	initialTransform = { x: t.x, y: t.y, scale: t.scale };
	card.scale = t.scale;
	dragMode = null;
	originalPointerEvents = getComputedStyle(card).pointerEvents;
	savedWaitingForDrag = card._waitingfordrag || { clientX, clientY };
	delete card._waitingfordrag;

	document.addEventListener(evts[1], onMove, { passive: false });
	document.addEventListener(evts[2], onEnd, { passive: false });
	if (cancelEvt) document.addEventListener(cancelEvt, onEnd, { passive: false });
	window.addEventListener("blur", onEnd, { once: true });
};

/**
 * 拖拽移动处理
 * @param {Event} e - 事件对象
 */
const onMove = async e => {
	const card = sourceNode;
	if (!card) return;
	if (isScrollable()) return cleanup();

	_status.dragged = true;

	const { clientX, clientY, pageX, pageY } = getPoint(e);
	const dx = clientX - startX,
		dy = clientY - startY;
	const absDx = Math.abs(dx),
		absDy = Math.abs(dy);

	if (!dragMode) {
		if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;

		// 垂直拖动或向上超出阈值 → 放行给本体
		if (absDy > absDx || dy < -ESCAPE_THRESHOLD) {
			dragMode = "escaped";
			if (savedWaitingForDrag) card._waitingfordrag = savedWaitingForDrag;
			return cleanup(true);
		}

		// 水平拖动 → 排序模式
		dragMode = "sort";
		e.preventDefault();
		e.stopPropagation();
		_status.mousedragging = _status.mousedragorigin = null;
		delete card._waitingfordrag;
		Object.assign(card.style, { pointerEvents: "none", transition: "none", opacity: "0.5", zIndex: "99" });
	}

	if (dragMode === "sort") {
		// 排序中向上超出阈值 → 脱离
		if (dy < -ESCAPE_THRESHOLD) {
			card.style.transform = `translate(${initialTransform.x}px, ${initialTransform.y}px) scale(${initialTransform.scale})`;
			dragMode = "escaped";
			if (savedWaitingForDrag) card._waitingfordrag = savedWaitingForDrag;
			return cleanup(true);
		}

		e.preventDefault();
		e.stopPropagation();

		const zoom = window.game?.documentZoom ?? 1;
		card.style.transform = `translate(${initialTransform.x + dx / zoom}px, ${initialTransform.y}px) scale(${card.scale})`;

		const target = getCard(document.elementFromPoint(pageX, pageY));
		if (target && target !== card && target.parentNode === ui.handcards1 && movedNode !== target) {
			movedNode = target;
			await swapCards(card, target);
		}
	}
};

/**
 * 交换两张卡牌位置
 * @param {HTMLElement} src - 源卡牌
 * @param {HTMLElement} tgt - 目标卡牌
 */
const swapCards = async (src, tgt) => {
	const container = ui.handcards1;
	const children = Array.from(container.childNodes);
	const srcIdx = children.indexOf(src),
		tgtIdx = children.indexOf(tgt);
	if (srcIdx === -1 || tgtIdx === -1) return;

	const scale = window.decadeUI?.boundsCaches?.hand?.cardScale ?? 1;
	const moveLeft = srcIdx > tgtIdx;

	container.insertBefore(src, moveLeft ? tgt : tgt.nextSibling);

	const srcTx = Number.isFinite(src.tx) ? src.tx : initialTransform.x;
	await setTransform(src, tgt.tx, initialTransform.y, scale);
	await setTransform(tgt, srcTx, tgt.ty, scale);

	const [start, end] = moveLeft ? [tgtIdx + 1, srcIdx] : [srcIdx, tgtIdx - 1];
	const updated = Array.from(container.childNodes);

	await Promise.all(
		updated.slice(start, end + 1).map(async c => {
			if (!c || c === src || c.tx === undefined) return;
			const neighbor = children[children.indexOf(c) + (moveLeft ? -1 : 1)];
			if (neighbor) await setTransform(c, neighbor.tx, c.ty, scale);
		})
	);

	raf(() => window.decadeUI?.layout?.updateHand?.());
};

/**
 * 拖拽结束处理
 * @param {Event} e - 事件对象
 */
const onEnd = e => {
	if (dragMode === "sort") {
		e?.preventDefault?.();
		e?.stopPropagation?.();
		e?.stopImmediatePropagation?.();
		_status.mousedragging = _status.mousedragorigin = null;
		_status.mouseleft = false;
		_status.clicked = true;
		if (sourceNode) {
			delete sourceNode._waitingfordrag;
			if (sourceNode.classList.contains("selected")) {
				sourceNode.classList.remove("selected");
				const idx = ui.selected.cards.indexOf(sourceNode);
				if (idx > -1) ui.selected.cards.splice(idx, 1);
				game.uncheck();
				game.check();
			}
		}
	}
	cleanup();
};

/**
 * 初始化拖拽排序
 */
const init = async () => {
	if (!ui?.handcards1) return setTimeout(init, 1000);
	ui.handcards1.removeEventListener(evts[0], onStart);
	ui.handcards1.addEventListener(evts[0], onStart, { passive: false });
};

/**
 * 销毁拖拽排序
 */
const destroy = () => {
	cleanup(true);
	ui?.handcards1?.removeEventListener(evts[0], onStart);
};

/**
 * 设置手牌拖拽排序功能
 * @param {boolean} [enabled] - 是否启用
 */
export function setupCardDragSort(enabled = lib.config.extension_十周年UI_translate) {
	const _decadeUI = window.decadeUI || {};
	window.decadeUI = _decadeUI;

	Object.assign(_decadeUI, { initCardDragSwap: init, destroyCardDragSwap: destroy });

	if (!enabled) return destroy();

	document.readyState === "complete" ? setTimeout(init, 1000) : window.addEventListener("load", () => setTimeout(init, 1000), { once: true });
}
