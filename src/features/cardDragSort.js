/**
 * 手牌拖拽排序模块 - 水平拖动排序手牌，垂直拖出则放行给本体处理
 */

import { lib, game, ui, _status } from "noname";

const DRAG_THRESHOLD = 5;
const ESCAPE_THRESHOLD = 50;
const DRAG_MODE = { NONE: null, SORT: "sort", ESCAPED: "escaped" };

const isMobile = /(iPhone|iPod|Android|ios|iPad|Mobile)/i.test(navigator.userAgent);
const hasPointer = "PointerEvent" in window;
const evts = hasPointer
	? ["pointerdown", "pointermove", "pointerup"]
	: isMobile
		? ["touchstart", "touchmove", "touchend"]
		: ["mousedown", "mousemove", "mouseup"];
const cancelEvt = hasPointer ? "pointercancel" : isMobile ? "touchcancel" : null;

const state = {
	dragMode: DRAG_MODE.NONE,
	sourceNode: null,
	movedNode: null,
	startX: 0,
	startY: 0,
	initialTransform: { x: 0, y: 0, scale: 1 },
	originalPointerEvents: null,
	savedWaitingForDrag: null,
};

const raf = fn => new Promise(r => requestAnimationFrame(() => r(fn())));
const getPoint = e => (hasPointer ? e : (e.touches?.[0] ?? e.changedTouches?.[0] ?? e));
const getCard = t => t?.closest?.(".card") ?? null;
const isScrollable = () => ui?.handcards1Container?.classList.contains("scrollh") || getComputedStyle(ui?.handcards1Container).overflowX === "scroll";

/**
 * 获取元素变换信息
 * @param {HTMLElement} el
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
 * 设置卡牌变换
 * @param {HTMLElement} card
 * @param {number} tx
 * @param {number} ty
 * @param {number} scale
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
 * @param {boolean} skipLayout
 */
const cleanup = async (skipLayout = false) => {
	const card = state.sourceNode;
	if (!card) return;

	if (state.dragMode === DRAG_MODE.SORT && !state.movedNode) {
		card.style.transform = `translate(${state.initialTransform.x}px, ${state.initialTransform.y}px) scale(${state.initialTransform.scale})`;
	}

	Object.assign(card.style, { transition: "", pointerEvents: state.originalPointerEvents ?? "", opacity: "1", zIndex: "" });

	document.removeEventListener(evts[1], onMove);
	document.removeEventListener(evts[2], onEnd);
	if (cancelEvt) document.removeEventListener(cancelEvt, onEnd);
	window.removeEventListener("blur", onEnd);

	Object.assign(state, {
		sourceNode: null,
		movedNode: null,
		dragMode: DRAG_MODE.NONE,
		savedWaitingForDrag: null,
	});

	if (!skipLayout) raf(() => window.decadeUI?.layout?.updateHand?.());
	_status.dragged = null;
};

/**
 * 拖拽开始处理
 * @param {Event} e
 */
const onStart = async e => {
	if (!lib.config.enable_drag) return;
	if (game.me?.hasSkillTag("noSortCard")) return;
	if (!hasPointer && e.button === 2) return;
	if (isScrollable()) return;
	if (state.sourceNode) await cleanup(true);

	const card = getCard(e.target);
	if (!card || card.parentNode !== ui.handcards1) return;

	const { clientX, clientY } = getPoint(e);
	const t = await getTransform(card);

	Object.assign(state, {
		sourceNode: card,
		startX: clientX,
		startY: clientY,
		initialTransform: { x: t.x, y: t.y, scale: t.scale },
		dragMode: DRAG_MODE.NONE,
		originalPointerEvents: getComputedStyle(card).pointerEvents,
		savedWaitingForDrag: card._waitingfordrag || { clientX, clientY },
	});

	card.scale = t.scale;
	delete card._waitingfordrag;

	document.addEventListener(evts[1], onMove, { passive: false });
	document.addEventListener(evts[2], onEnd, { passive: false });
	if (cancelEvt) document.addEventListener(cancelEvt, onEnd, { passive: false });
	window.addEventListener("blur", onEnd, { once: true });
};

/**
 * 拖拽移动处理
 * @param {Event} e
 */
const onMove = async e => {
	const card = state.sourceNode;
	if (!card) return;
	if (isScrollable()) return cleanup();

	_status.dragged = true;

	const { clientX, clientY, pageX, pageY } = getPoint(e);
	const dx = clientX - state.startX;
	const dy = clientY - state.startY;
	const absDx = Math.abs(dx);
	const absDy = Math.abs(dy);

	if (!state.dragMode) {
		if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;

		if (absDy > absDx || dy < -ESCAPE_THRESHOLD) {
			state.dragMode = DRAG_MODE.ESCAPED;
			if (state.savedWaitingForDrag) card._waitingfordrag = state.savedWaitingForDrag;
			return cleanup(true);
		}

		state.dragMode = DRAG_MODE.SORT;
		e.preventDefault();
		e.stopPropagation();
		_status.mousedragging = _status.mousedragorigin = null;
		delete card._waitingfordrag;
		Object.assign(card.style, { pointerEvents: "none", transition: "none", opacity: "0.5", zIndex: "99" });
	}

	if (state.dragMode === DRAG_MODE.SORT) {
		if (dy < -ESCAPE_THRESHOLD) {
			card.style.transform = `translate(${state.initialTransform.x}px, ${state.initialTransform.y}px) scale(${state.initialTransform.scale})`;
			state.dragMode = DRAG_MODE.ESCAPED;
			if (state.savedWaitingForDrag) card._waitingfordrag = state.savedWaitingForDrag;
			return cleanup(true);
		}

		e.preventDefault();
		e.stopPropagation();

		const zoom = window.game?.documentZoom ?? 1;
		card.style.transform = `translate(${state.initialTransform.x + dx / zoom}px, ${state.initialTransform.y}px) scale(${card.scale})`;

		const target = getCard(document.elementFromPoint(pageX, pageY));
		if (target && target !== card && target.parentNode === ui.handcards1 && state.movedNode !== target) {
			state.movedNode = target;
			await swapCards(card, target);
		}
	}
};

/**
 * 交换两张卡牌位置
 * @param {HTMLElement} src
 * @param {HTMLElement} tgt
 */
const swapCards = async (src, tgt) => {
	const container = ui.handcards1;
	const children = Array.from(container.childNodes);
	const srcIdx = children.indexOf(src);
	const tgtIdx = children.indexOf(tgt);
	if (srcIdx === -1 || tgtIdx === -1) return;

	const scale = window.decadeUI?.boundsCaches?.hand?.cardScale ?? 1;
	const moveLeft = srcIdx > tgtIdx;

	container.insertBefore(src, moveLeft ? tgt : tgt.nextSibling);

	const srcTx = Number.isFinite(src.tx) ? src.tx : state.initialTransform.x;
	await setTransform(src, tgt.tx, state.initialTransform.y, scale);
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
 * @param {Event} e
 */
const onEnd = e => {
	if (state.dragMode === DRAG_MODE.SORT) {
		e?.preventDefault?.();
		e?.stopPropagation?.();
		e?.stopImmediatePropagation?.();
		_status.mousedragging = _status.mousedragorigin = null;
		_status.mouseleft = false;
		_status.clicked = true;
		if (state.sourceNode) {
			delete state.sourceNode._waitingfordrag;
			if (state.sourceNode.classList.contains("selected")) {
				state.sourceNode.classList.remove("selected");
				const idx = ui.selected.cards.indexOf(state.sourceNode);
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
 */
export function setupCardDragSort() {
	const _decadeUI = window.decadeUI || {};
	window.decadeUI = _decadeUI;

	Object.assign(_decadeUI, { initCardDragSwap: init, destroyCardDragSwap: destroy });

	document.readyState === "complete" ? setTimeout(init, 1000) : window.addEventListener("load", () => setTimeout(init, 1000), { once: true });
}
