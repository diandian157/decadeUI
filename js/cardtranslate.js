(() => {
	const { dui = {} } = window;
	window.dui = dui;
	dui.dragThreshold = 5;
	dui.cardMargin = 8;
	dui.isDragging = false;
	dui.sourceNode = null;
	dui.movedNode = null;
	dui.originalPointerEvents = null;
	dui.isMobileDevice = /(iPhone|iPod|Android|ios|iPad|Mobile)/i.test(navigator.userAgent);
	dui.supportsPointer = "PointerEvent" in window;
	dui.evts = dui.supportsPointer ? ["pointerdown", "pointermove", "pointerup"] : dui.isMobileDevice ? ["touchstart", "touchmove", "touchend"] : ["mousedown", "mousemove", "mouseup"];
	dui.cancelEvt = dui.supportsPointer ? "pointercancel" : dui.isMobileDevice ? "touchcancel" : null;
	const raf = cb => new Promise(resolve => requestAnimationFrame(() => resolve(cb())));
	const getPoint = e => {
		if (dui.supportsPointer) return e;
		const touch = e.touches?.[0] ?? e.changedTouches?.[0];
		return touch ?? e;
	};

	dui.init = async () => {
		await dui.initCardDragSwap();
	};

	dui.getTransformValues = async element =>
		raf(() => {
			try {
				const style = window.getComputedStyle(element);
				const matrix = new DOMMatrixReadOnly(style.transform);
				return { translateX: matrix.m41, translateY: matrix.m42, scale: matrix.m11 };
			} catch {
				return { translateX: 0, translateY: 0, scale: 1 };
			}
		});

	dui.updateHandLayout = () =>
		raf(() => {
			if (dui.isContainerScrollable() && dui.sourceNode) {
				dui.cleanupDrag(true);
			}
			if (typeof dui.layout?.updateHand === "function") {
				dui.layout.updateHand();
			}
		});

	dui.getCardElement = target => target?.closest(".card") ?? null;

	dui.setCardTransform = async (card, tx, ty, scale = card?.scale ?? 1) => {
		if (!card || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
		await raf(() => {
			card.tx = tx;
			card.ty = ty;
			const transformValue = `translate(${tx}px, ${ty}px) scale(${scale})`;
			card.style.transform = transformValue;
			card._transform = transformValue;
		});
	};
	dui.isContainerScrollable = () => {
		if (!ui?.handcards1Container) return false;
		return ui.handcards1Container.classList.contains("scrollh") || getComputedStyle(ui.handcards1Container).overflowX === "scroll";
	};

	dui.cleanupDrag = async (skipLayoutUpdate = false) => {
		const sourceCard = dui.sourceNode;
		if (!sourceCard) return;
		if (dui.isDragging) {
			if (!dui.movedNode) {
				sourceCard.style.transform = `translate(${sourceCard.initialTranslateX}px, ${sourceCard.initialTranslateY}px) scale(${sourceCard.scale})`;
			}
		}
		Object.assign(sourceCard.style, {
			transition: "",
			pointerEvents: dui.originalPointerEvents ?? "",
			opacity: "1",
			zIndex: "",
		});
		document.removeEventListener(dui.evts[1], dui.dragCardMove);
		document.removeEventListener(dui.evts[2], dui.dragCardEnd);
		if (dui.cancelEvt) document.removeEventListener(dui.cancelEvt, dui.dragCardEnd);
		window.removeEventListener("blur", dui.dragCardEnd);
		window.removeEventListener(dui.evts[2], dui.dragCardEnd);
		dui.sourceNode = null;
		dui.movedNode = null;
		dui.isDragging = false;
		if (!skipLayoutUpdate) {
			raf(() => {
				if (typeof dui.layout?.updateHand === "function") {
					dui.layout.updateHand();
				}
			});
		}
	};

	dui.dragCardStart = async e => {
		if (!dui.supportsPointer && e.button === 2) return;
		if (dui.isContainerScrollable()) return;
		if (dui.sourceNode) {
			await dui.cleanupDrag(true);
		}
		const cardElement = dui.getCardElement(e.target);
		if (!cardElement) return;
		const { clientX: startX, clientY: startY } = getPoint(e);
		const transformValues = await dui.getTransformValues(cardElement);
		dui.sourceNode = cardElement;
		Object.assign(cardElement, {
			startX,
			startY,
			initialTranslateX: transformValues.translateX,
			initialTranslateY: transformValues.translateY,
			scale: transformValues.scale,
		});
		dui.isDragging = false;
		dui.originalPointerEvents = getComputedStyle(cardElement).pointerEvents;
		document.addEventListener(dui.evts[1], dui.dragCardMove, { passive: false });
		document.addEventListener(dui.evts[2], dui.dragCardEnd, { passive: false });
		if (dui.cancelEvt) document.addEventListener(dui.cancelEvt, dui.dragCardEnd, { passive: false });
		window.addEventListener("blur", dui.dragCardEnd, { once: true, passive: false });
		window.addEventListener(dui.evts[2], dui.dragCardEnd, { once: true, passive: false });
	};
	dui.dragCardMove = async e => {
		try {
			const sourceCard = dui.sourceNode;
			if (!sourceCard) return;
			if (dui.isContainerScrollable()) {
				await dui.cleanupDrag();
				return;
			}
			const { clientX: currentX, clientY: currentY, pageX, pageY } = getPoint(e);
			const dx = currentX - sourceCard.startX;
			const dy = currentY - sourceCard.startY;
			if (!dui.isDragging) {
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (distance > dui.dragThreshold) {
					if (dui.isContainerScrollable()) {
						await dui.cleanupDrag();
						return;
					}
					dui.isDragging = true;
					e.preventDefault();
					e.stopPropagation();
					Object.assign(sourceCard.style, {
						pointerEvents: "none",
						transition: "none",
						opacity: "0.5",
						zIndex: "99",
					});
				}
			}
			if (dui.isDragging) {
				const zoomFactor = window.game?.documentZoom ?? 1;
				const newTranslateX = sourceCard.initialTranslateX + dx / zoomFactor;
				sourceCard.style.transform = `translate(${newTranslateX}px, ${sourceCard.initialTranslateY}px) scale(${sourceCard.scale})`;
				const pointElement = document.elementFromPoint(pageX, pageY);
				const targetCard = dui.getCardElement(pointElement);
				if (targetCard && targetCard !== sourceCard && targetCard.parentNode === ui.handcards1 && dui.movedNode !== targetCard) {
					dui.movedNode = targetCard;
					await dui.swapCardPosition(sourceCard, targetCard);
				}
			}
		} catch {
			await dui.cleanupDrag();
		}
	};
	dui.swapCardPosition = async (sourceCard, targetCard) => {
		const handContainer = ui.handcards1;
		const children = Array.from(handContainer.childNodes);
		const sourceIndex = children.indexOf(sourceCard);
		const targetIndex = children.indexOf(targetCard);
		if (sourceIndex === -1 || targetIndex === -1) return;
		const cardScale = window.dui?.boundsCaches?.hand?.cardScale ?? 1;
		const isMovingLeft = sourceIndex > targetIndex;
		handContainer.insertBefore(sourceCard, isMovingLeft ? targetCard : targetCard.nextSibling);
		const sourceTx = Number.isFinite(sourceCard.tx) ? sourceCard.tx : sourceCard.initialTranslateX;
		await dui.setCardTransform(sourceCard, targetCard.tx, sourceCard.initialTranslateY, cardScale);
		await dui.setCardTransform(targetCard, sourceTx, targetCard.ty, cardScale);
		const start = isMovingLeft ? targetIndex + 1 : sourceIndex;
		const end = isMovingLeft ? sourceIndex : targetIndex - 1;
		const updatedChildren = Array.from(handContainer.childNodes);
		const updatePromises = updatedChildren.slice(start, end + 1).map(async card => {
			if (!card || card === sourceCard || typeof card.tx === "undefined") return;
			const originalIdx = children.indexOf(card);
			const neighborIdx = isMovingLeft ? originalIdx - 1 : originalIdx + 1;
			const neighborCard = children[neighborIdx];
			if (neighborCard) {
				await dui.setCardTransform(card, neighborCard.tx, card.ty, cardScale);
			}
		});
		await Promise.all(updatePromises);
		await dui.updateHandLayout();
	};
	dui.dragCardEnd = async e => {
		await dui.cleanupDrag();
	};
	dui.ensureCardPositions = async () => {
		if (!ui?.handcards1) return;
		const cards = ui.handcards1.querySelectorAll(".card");
		await Promise.all(
			Array.from(cards, async card => {
				if (typeof card.tx === "undefined" || typeof card.ty === "undefined") {
					const { translateX, translateY } = await dui.getTransformValues(card);
					card.tx = translateX;
					card.ty = translateY;
				}
			})
		);
	};

	dui.initCardDragSwap = async () => {
		if (!ui?.handcards1) {
			setTimeout(dui.initCardDragSwap, 1000);
			return;
		}
		const handContainer = ui.handcards1;
		handContainer.removeEventListener(dui.evts[0], dui.dragCardStart);
		handContainer.addEventListener(dui.evts[0], dui.dragCardStart, { passive: false });
		await dui.ensureCardPositions();
	};

	const onReady = async () => {
		setTimeout(async () => {
			await dui.init();
		}, 1000);
	};

	if (document.readyState === "complete") {
		onReady();
	} else {
		window.addEventListener("load", onReady);
	}
})();
