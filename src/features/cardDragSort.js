"use strict";

/**
 * 手牌拖拽排序模块
 * 水平拖动排序手牌，垂直拖出则放行给本体处理拖拽选目标
 */

import { lib, game, ui, get, ai, _status } from "noname";

const DRAG_THRESHOLD = 5;
const ESCAPE_THRESHOLD = 50;

let dragMode = null;
let sourceNode = null;
let movedNode = null;
let startX = 0;
let startY = 0;
let initialTransform = { x: 0, y: 0, scale: 1 };
let originalPointerEvents = null;
let savedWaitingForDrag = null;

const isMobile = /(iPhone|iPod|Android|ios|iPad|Mobile)/i.test(navigator.userAgent);
const hasPointer = "PointerEvent" in window;
const evts = hasPointer ? ["pointerdown", "pointermove", "pointerup"] : isMobile ? ["touchstart", "touchmove", "touchend"] : ["mousedown", "mousemove", "mouseup"];
const cancelEvt = hasPointer ? "pointercancel" : isMobile ? "touchcancel" : null;

const raf = fn => new Promise(r => requestAnimationFrame(() => r(fn())));
const getPoint = e => (hasPointer ? e : (e.touches?.[0] ?? e.changedTouches?.[0] ?? e));
const getCard = t => t?.closest?.(".card") ?? null;

const getTransform = el =>
	raf(() => {
		try {
			const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
			return { x: m.m41, y: m.m42, scale: m.m11 };
		} catch {
			return { x: 0, y: 0, scale: 1 };
		}
	});

const isScrollable = () => ui?.handcards1Container?.classList.contains("scrollh") || getComputedStyle(ui?.handcards1Container).overflowX === "scroll";

const setTransform = async (card, tx, ty, scale = card?.scale ?? 1) => {
	if (!card || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
	await raf(() => {
		card.tx = tx;
		card.ty = ty;
		card.style.transform = card._transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
	});
};

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
	if (!skipLayout) raf(() => window.dui?.layout?.updateHand?.());
};

const onStart = async e => {
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

const onMove = async e => {
	const card = sourceNode;
	if (!card) return;
	if (isScrollable()) return cleanup();

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

const swapCards = async (src, tgt) => {
	const container = ui.handcards1;
	const children = Array.from(container.childNodes);
	const srcIdx = children.indexOf(src),
		tgtIdx = children.indexOf(tgt);
	if (srcIdx === -1 || tgtIdx === -1) return;

	const scale = window.dui?.boundsCaches?.hand?.cardScale ?? 1;
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

	raf(() => window.dui?.layout?.updateHand?.());
};

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

const init = async () => {
	if (!ui?.handcards1) return setTimeout(init, 1000);
	ui.handcards1.removeEventListener(evts[0], onStart);
	ui.handcards1.addEventListener(evts[0], onStart, { passive: false });
};

const destroy = () => {
	cleanup(true);
	ui?.handcards1?.removeEventListener(evts[0], onStart);
};

export function setupCardDragSort(enabled = lib.config.extension_十周年UI_translate) {
	const dui = window.dui || {};
	window.dui = dui;

	Object.assign(dui, { initCardDragSwap: init, destroyCardDragSwap: destroy });

	if (!enabled) return destroy();

	document.readyState === "complete" ? setTimeout(init, 1000) : window.addEventListener("load", () => setTimeout(init, 1000), { once: true });
}
