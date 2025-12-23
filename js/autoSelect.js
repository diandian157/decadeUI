"use strict";
decadeModule.import((lib, game, ui, _get, _ai, _status) => {
	const isEnabled = () => lib.config.extension_十周年UI_autoSelect !== false;

	const getRange = (event, type) => {
		const select = event[`select${type}`];
		if (select === undefined) return [1, 1];
		if (typeof select === "number") return [select, select];
		if (typeof select === "function") {
			const result = select();
			if (typeof result === "number") return [result, result];
			if (Array.isArray(result)) return result;
		}
		if (Array.isArray(select)) return select;
		return [1, 1];
	};

	const getTargetState = () => {
		const cards = ui.selected.cards?.map(c => c.cardid || c.name).join(",") || "";
		const skill = _status.event?.skill || "";
		return `${skill}|${cards}`;
	};

	const shouldAutoSelectTarget = event => {
		if (!isEnabled()) return false;
		if (!event.filterTarget) return false;
		if (_status.auto) return false;
		if (event.noAutoSelect) return false;
		if (event.complexSelect || event.complexTarget) return false;
		const range = getRange(event, "Target");
		if (range[0] !== range[1]) return false;
		const state = getTargetState();
		if (event._autoTargetState === state) return false;
		return true;
	};

	const isRespondEvent = event => {
		if (event.name === "chooseToRespond") return true;
		if (event.respondTo) return true;
		if (event.type === "wuxie") return true;
		if (event.name === "phaseDiscard") return false;
		const parent = event.getParent?.();
		if (parent?.name === "phaseDiscard") return false;
		if (parent?.name === "chooseToRespond") return true;
		if (parent?.respondTo) return true;
		if (parent?.name === "dying" || event.dying) return true;
		if (event.forced || event.forceDirect) return true;
		if (event.name === "chooseCard" && !event.dialog?.querySelector(".buttons")) return true;
		if (event.name === "chooseToDiscard") {
			const range = getRange(event, "Card");
			if (range[0] === 1 && range[1] === 1) return true;
		}
		return false;
	};

	const shouldAutoSelectCard = event => {
		if (!isEnabled()) return false;
		if (!event.filterCard) return false;
		if (_status.auto) return false;
		if (event.noAutoSelect) return false;
		if (event.complexSelect || event.complexCard) return false;
		if (!isRespondEvent(event)) return false;
		const range = getRange(event, "Card");
		if (range[0] !== range[1]) return false;
		if (event._autoCardDone) return false;
		return true;
	};

	const performAutoSelectTarget = () => {
		const event = _status.event;
		if (!shouldAutoSelectTarget(event)) return false;

		const selectableTargets = game.players.filter(p => p.classList.contains("selectable") && !p.classList.contains("selected"));
		const selectedCount = ui.selected.targets?.length || 0;
		const range = getRange(event, "Target");
		const needed = range[0] - selectedCount;

		if (needed > 0 && selectableTargets.length === needed) {
			selectableTargets.forEach(target => {
				target.classList.add("selected");
				ui.selected.targets.add(target);
			});
			event._autoTargetState = getTargetState();
			return true;
		}
		return false;
	};

	const performAutoSelectCard = () => {
		const event = _status.event;
		if (!shouldAutoSelectCard(event)) return false;

		const player = event.player;
		if (!player) return false;

		const cards = player.getCards(event.position || "h");
		const selectableCards = cards.filter(card => card.classList.contains("selectable") && !card.classList.contains("selected"));
		const selectedCount = ui.selected.cards?.length || 0;
		const range = getRange(event, "Card");
		const needed = range[0] - selectedCount;

		if (needed > 0 && selectableCards.length >= needed) {
			const toSelect = selectableCards.slice(0, needed);
			toSelect.forEach(card => {
				card.classList.add("selected");
				ui.selected.cards.add(card);
				if (card.updateTransform) card.updateTransform(true);
			});
			event._autoCardDone = true;
			return true;
		}
		return false;
	};

	const originalCancel = ui.click.cancel;
	ui.click.cancel = function () {
		const event = _status.event;
		if (event) {
			delete event._autoCardDone;
			delete event._autoTargetState;
		}
		return originalCancel.apply(this, arguments);
	};

	const originalCard = ui.click.card;
	ui.click.card = function () {
		const event = _status.event;
		if (event) {
			if (this.classList?.contains("selected")) {
				event._autoCardDone = true;
			} else {
				delete event._autoCardDone;
				delete event._autoTargetState;
			}
		}
		return originalCard.apply(this, arguments);
	};

	const originalSkill = ui.click.skill;
	ui.click.skill = function () {
		const event = _status.event;
		if (event) {
			delete event._autoCardDone;
			delete event._autoTargetState;
		}
		return originalSkill.apply(this, arguments);
	};

	if (lib.hooks?.checkEnd) {
		lib.hooks.checkEnd.add("_decadeUI_autoSelect", (event, { ok }) => {
			if (ok) return;
			setTimeout(() => {
				if (_status.event !== event) return;
				if (_status.paused && !_status.imchoosing) return;
				const cardChanged = performAutoSelectCard();
				const targetChanged = performAutoSelectTarget();
				if (cardChanged || targetChanged) {
					game.check();
				}
			}, 0);
		});
	}
});
