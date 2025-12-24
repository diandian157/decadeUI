"use strict";

/**
 * 手牌拖拽排序模块
 * 支持 Pointer/Touch/Mouse 事件，实现手牌拖拽交换位置
 */

import { ui } from "noname";

// ==================== 配置 ====================
const DRAG_THRESHOLD = 5; // 拖拽触发阈值(px)

// ==================== 状态 ====================
let isDragging = false;
let sourceNode = null;
let movedNode = null;
let originalPointerEvents = null;

// ==================== 设备检测 ====================
const isMobileDevice = /(iPhone|iPod|Android|ios|iPad|Mobile)/i.test(navigator.userAgent);
const supportsPointer = "PointerEvent" in window;

// 根据设备选择事件类型
const evts = supportsPointer ? ["pointerdown", "pointermove", "pointerup"] : isMobileDevice ? ["touchstart", "touchmove", "touchend"] : ["mousedown", "mousemove", "mouseup"];

const cancelEvt = supportsPointer ? "pointercancel" : isMobileDevice ? "touchcancel" : null;

// ==================== 工具函数 ====================

/** RAF Promise 封装 */
const raf = cb => new Promise(resolve => requestAnimationFrame(() => resolve(cb())));

/** 统一获取坐标点 */
const getPoint = e => {
	if (supportsPointer) return e;
	return e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
};

/** 获取元素 transform 值 */
const getTransformValues = element =>
	raf(() => {
		try {
			const style = window.getComputedStyle(element);
			const matrix = new DOMMatrixReadOnly(style.transform);
			return { translateX: matrix.m41, translateY: matrix.m42, scale: matrix.m11 };
		} catch {
			return { translateX: 0, translateY: 0, scale: 1 };
		}
	});

/** 检查容器是否可滚动 */
const isContainerScrollable = () => {
	if (!ui?.handcards1Container) return false;
	return ui.handcards1Container.classList.contains("scrollh") || getComputedStyle(ui.handcards1Container).overflowX === "scroll";
};

/** 获取卡牌元素 */
const getCardElement = target => target?.closest(".card") ?? null;

/** 设置卡牌 transform */
const setCardTransform = async (card, tx, ty, scale = card?.scale ?? 1) => {
	if (!card || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
	await raf(() => {
		card.tx = tx;
		card.ty = ty;
		const transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
		card.style.transform = transform;
		card._transform = transform;
	});
};

/** 更新手牌布局 */
const updateHandLayout = () =>
	raf(() => {
		if (isContainerScrollable() && sourceNode) {
			cleanupDrag(true);
		}
		window.dui?.layout?.updateHand?.();
	});

// ==================== 拖拽核心逻辑 ====================

/** 清理拖拽状态 */
const cleanupDrag = async (skipLayoutUpdate = false) => {
	const sourceCard = sourceNode;
	if (!sourceCard) return;

	// 未移动则恢复原位
	if (isDragging && !movedNode) {
		sourceCard.style.transform = `translate(${sourceCard.initialTranslateX}px, ${sourceCard.initialTranslateY}px) scale(${sourceCard.scale})`;
	}

	// 恢复样式
	Object.assign(sourceCard.style, {
		transition: "",
		pointerEvents: originalPointerEvents ?? "",
		opacity: "1",
		zIndex: "",
	});

	// 移除事件监听
	document.removeEventListener(evts[1], dragCardMove);
	document.removeEventListener(evts[2], dragCardEnd);
	if (cancelEvt) document.removeEventListener(cancelEvt, dragCardEnd);
	window.removeEventListener("blur", dragCardEnd);
	window.removeEventListener(evts[2], dragCardEnd);

	// 重置状态
	sourceNode = null;
	movedNode = null;
	isDragging = false;

	if (!skipLayoutUpdate) {
		raf(() => window.dui?.layout?.updateHand?.());
	}
};

/** 拖拽开始 */
const dragCardStart = async e => {
	if (!supportsPointer && e.button === 2) return;
	if (isContainerScrollable()) return;
	if (sourceNode) await cleanupDrag(true);

	const cardElement = getCardElement(e.target);
	if (!cardElement) return;

	const { clientX, clientY } = getPoint(e);
	const transform = await getTransformValues(cardElement);

	// 记录初始状态
	sourceNode = cardElement;
	Object.assign(cardElement, {
		startX: clientX,
		startY: clientY,
		initialTranslateX: transform.translateX,
		initialTranslateY: transform.translateY,
		scale: transform.scale,
	});

	isDragging = false;
	originalPointerEvents = getComputedStyle(cardElement).pointerEvents;

	// 绑定事件
	document.addEventListener(evts[1], dragCardMove, { passive: false });
	document.addEventListener(evts[2], dragCardEnd, { passive: false });
	if (cancelEvt) document.addEventListener(cancelEvt, dragCardEnd, { passive: false });
	window.addEventListener("blur", dragCardEnd, { once: true, passive: false });
	window.addEventListener(evts[2], dragCardEnd, { once: true, passive: false });
};

/** 拖拽移动 */
const dragCardMove = async e => {
	try {
		const sourceCard = sourceNode;
		if (!sourceCard) return;
		if (isContainerScrollable()) {
			await cleanupDrag();
			return;
		}

		const { clientX, clientY, pageX, pageY } = getPoint(e);
		const dx = clientX - sourceCard.startX;
		const dy = clientY - sourceCard.startY;

		// 判断是否达到拖拽阈值
		if (!isDragging) {
			if (Math.sqrt(dx * dx + dy * dy) <= DRAG_THRESHOLD) return;
			if (isContainerScrollable()) {
				await cleanupDrag();
				return;
			}

			isDragging = true;
			e.preventDefault();
			e.stopPropagation();

			// 设置拖拽样式
			Object.assign(sourceCard.style, {
				pointerEvents: "none",
				transition: "none",
				opacity: "0.5",
				zIndex: "99",
			});
		}

		// 计算新位置(考虑缩放)
		const zoomFactor = window.game?.documentZoom ?? 1;
		const newX = sourceCard.initialTranslateX + dx / zoomFactor;
		sourceCard.style.transform = `translate(${newX}px, ${sourceCard.initialTranslateY}px) scale(${sourceCard.scale})`;

		// 检测目标卡牌并交换
		const targetCard = getCardElement(document.elementFromPoint(pageX, pageY));
		if (targetCard && targetCard !== sourceCard && targetCard.parentNode === ui.handcards1 && movedNode !== targetCard) {
			movedNode = targetCard;
			await swapCardPosition(sourceCard, targetCard);
		}
	} catch {
		await cleanupDrag();
	}
};

/** 交换卡牌位置 */
const swapCardPosition = async (sourceCard, targetCard) => {
	const handContainer = ui.handcards1;
	const children = Array.from(handContainer.childNodes);
	const sourceIndex = children.indexOf(sourceCard);
	const targetIndex = children.indexOf(targetCard);

	if (sourceIndex === -1 || targetIndex === -1) return;

	const cardScale = window.dui?.boundsCaches?.hand?.cardScale ?? 1;
	const isMovingLeft = sourceIndex > targetIndex;

	// 移动 DOM 节点
	handContainer.insertBefore(sourceCard, isMovingLeft ? targetCard : targetCard.nextSibling);

	// 更新源卡牌和目标卡牌位置
	const sourceTx = Number.isFinite(sourceCard.tx) ? sourceCard.tx : sourceCard.initialTranslateX;
	await setCardTransform(sourceCard, targetCard.tx, sourceCard.initialTranslateY, cardScale);
	await setCardTransform(targetCard, sourceTx, targetCard.ty, cardScale);

	// 更新中间卡牌位置
	const start = isMovingLeft ? targetIndex + 1 : sourceIndex;
	const end = isMovingLeft ? sourceIndex : targetIndex - 1;
	const updatedChildren = Array.from(handContainer.childNodes);

	await Promise.all(
		updatedChildren.slice(start, end + 1).map(async card => {
			if (!card || card === sourceCard || typeof card.tx === "undefined") return;
			const originalIdx = children.indexOf(card);
			const neighborIdx = isMovingLeft ? originalIdx - 1 : originalIdx + 1;
			const neighborCard = children[neighborIdx];
			if (neighborCard) {
				await setCardTransform(card, neighborCard.tx, card.ty, cardScale);
			}
		})
	);

	await updateHandLayout();
};

/** 拖拽结束 */
const dragCardEnd = () => cleanupDrag();

// ==================== 初始化 ====================

/** 确保所有卡牌有位置信息 */
const ensureCardPositions = async () => {
	if (!ui?.handcards1) return;
	const cards = ui.handcards1.querySelectorAll(".card");
	await Promise.all(
		Array.from(cards, async card => {
			if (typeof card.tx === "undefined" || typeof card.ty === "undefined") {
				const { translateX, translateY } = await getTransformValues(card);
				card.tx = translateX;
				card.ty = translateY;
			}
		})
	);
};

/** 初始化拖拽功能 */
const initCardDragSwap = async () => {
	if (!ui?.handcards1) {
		setTimeout(initCardDragSwap, 1000);
		return;
	}
	const handContainer = ui.handcards1;
	handContainer.removeEventListener(evts[0], dragCardStart);
	handContainer.addEventListener(evts[0], dragCardStart, { passive: false });
	await ensureCardPositions();
};

import { lib } from "noname";

/** 初始化并挂载到 dui */
export function setupCardDragSort() {
	// 检查配置是否启用
	if (!lib.config.extension_十周年UI_translate) return;

	// 挂载到全局 dui 对象
	const dui = window.dui || {};
	window.dui = dui;

	dui.dragThreshold = DRAG_THRESHOLD;
	dui.isDragging = false;
	dui.getTransformValues = getTransformValues;
	dui.isContainerScrollable = isContainerScrollable;
	dui.getCardElement = getCardElement;
	dui.setCardTransform = setCardTransform;
	dui.updateHandLayout = updateHandLayout;
	dui.cleanupDrag = cleanupDrag;
	dui.dragCardStart = dragCardStart;
	dui.dragCardMove = dragCardMove;
	dui.swapCardPosition = swapCardPosition;
	dui.dragCardEnd = dragCardEnd;
	dui.ensureCardPositions = ensureCardPositions;
	dui.initCardDragSwap = initCardDragSwap;

	// 延迟初始化
	if (document.readyState === "complete") {
		setTimeout(initCardDragSwap, 1000);
	} else {
		window.addEventListener("load", () => setTimeout(initCardDragSwap, 1000));
	}
}
