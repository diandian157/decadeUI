/**
 * 自动选择模块 - 在特定条件下自动选择卡牌和目标
 */

import { lib, game, ui, _status } from "noname";
import { wrapAround } from "../utils/safeOverride.js";

const autoStates = new WeakMap();

const isEnabled = () => lib.config.extension_十周年UI_autoSelect !== false;

/**
 * 获取选择数量范围
 * @param {GameEvent} event
 * @param {string} type - 'Card' 或 'Target'
 * @returns {[number, number]}
 */
const getRange = (event, type) => {
	const select = event[`select${type}`];
	if (select === undefined) return [1, 1];
	if (typeof select === "number") return [select, select];
	if (typeof select === "function") {
		const result = select();
		return typeof result === "number" ? [result, result] : Array.isArray(result) ? result : [1, 1];
	}
	return Array.isArray(select) ? select : [1, 1];
};

/**
 * 获取事件状态
 * @param {GameEvent} event
 * @returns {{cardDone: boolean, targetState: string, manualCancel: Set<string>}}
 */
const getState = event => {
	if (!autoStates.has(event)) {
		autoStates.set(event, {
			cardDone: false,
			targetState: "",
			manualCancel: new Set(),
		});
	}
	return autoStates.get(event);
};

/**
 * 生成目标选择状态标识
 * @returns {string}
 */
const getTargetState = () => {
	const cards = ui.selected.cards?.map(c => c.cardid || c.name).join(",") || "";
	const skill = _status.event?.skill || "";
	return `${skill}|${cards}`;
};

/**
 * 判断是否为响应类事件
 * @param {GameEvent} event
 * @returns {boolean}
 */
const isRespondEvent = event => {
	if (event.name === "chooseToRespond" || event.respondTo || event.type === "wuxie") return true;
	if (event.forceDirect) return true;

	const parent = event.getParent?.();
	if (parent?.name === "chooseToRespond" || parent?.respondTo || parent?.name === "dying" || event.dying) return true;

	if (event.name === "phaseDiscard" || parent?.name === "phaseDiscard") return false;

	if (event.name === "chooseCard" && !event.dialog?.querySelector(".buttons")) {
		const [min, max] = getRange(event, "Card");
		if (min === 1 && max === 1) return true;
	}

	if (event.name === "chooseToDiscard") {
		const [min, max] = getRange(event, "Card");
		if (min === 1 && max === 1) {
			const pos = event.position;
			if (!event.ai || (pos !== "he" && pos !== "hes")) return true;
		}
	}

	return false;
};

/**
 * 检查是否应自动选择目标
 * @param {GameEvent} event
 * @returns {boolean}
 */
const shouldAutoSelectTarget = event => {
	if (!isEnabled() || !event.filterTarget || _status.auto) return false;
	if (event.noAutoSelect || event.complexSelect || event.complexTarget) return false;

	const state = getState(event);
	if (state.manualCancel.has("target")) return false;

	const [min, max] = getRange(event, "Target");
	if (min !== max) return false;
	if (min !== 1) return false;

	const targetState = getTargetState();
	return state.targetState !== targetState;
};

/**
 * 检查是否应自动选择卡牌
 * @param {GameEvent} event
 * @returns {boolean}
 */
const shouldAutoSelectCard = event => {
	if (!isEnabled() || !event.filterCard || _status.auto) return false;
	if (event.noAutoSelect || event.complexSelect || event.complexCard) return false;
	if (!isRespondEvent(event)) return false;

	const state = getState(event);
	if (state.manualCancel.has("card") || state.cardDone) return false;

	const [min, max] = getRange(event, "Card");
	if (min !== max) return false;

	if (event.name === "chooseToDiscard" && min > 1 && event.ai) {
		const pos = event.position;
		if (pos === "he" || pos === "hes") return false;
	}

	return true;
};

/**
 * 执行自动选择目标
 * @returns {boolean}
 */
const performAutoSelectTarget = () => {
	const event = _status.event;
	if (!shouldAutoSelectTarget(event)) return false;

	const selectableTargets = game.players.filter(p => p.classList.contains("selectable") && !p.classList.contains("selected"));
	const selectedCount = ui.selected.targets?.length || 0;
	const needed = getRange(event, "Target")[0] - selectedCount;

	if (needed > 0 && selectableTargets.length === needed) {
		selectableTargets.forEach(target => {
			target.classList.add("selected");
			ui.selected.targets.add(target);
		});
		getState(event).targetState = getTargetState();
		return true;
	}
	return false;
};

/**
 * 执行自动选择卡牌
 * @returns {boolean}
 */
const performAutoSelectCard = () => {
	const event = _status.event;
	if (!shouldAutoSelectCard(event)) return false;

	const player = event.player;
	if (!player) return false;

	const cards = player.getCards(event.position || "h");
	const selectableCards = cards.filter(card => card.classList.contains("selectable") && !card.classList.contains("selected"));
	const selectedCount = ui.selected.cards?.length || 0;
	const needed = getRange(event, "Card")[0] - selectedCount;

	if (needed > 0 && selectableCards.length >= needed) {
		selectableCards.slice(0, needed).forEach(card => {
			card.classList.add("selected");
			ui.selected.cards.add(card);
			card.updateTransform?.(true);
		});
		getState(event).cardDone = true;
		return true;
	}
	return false;
};

/**
 * 初始化自动选择模块
 */
export function setupAutoSelect() {
	wrapAround(ui.click, "cancel", function (original, ...args) {
		autoStates.delete(_status.event);
		return original.apply(this, args);
	});

	wrapAround(ui.click, "card", function (original, ...args) {
		const event = _status.event;
		if (event) {
			const state = getState(event);
			if (this.classList?.contains("selected")) {
				state.cardDone = false;
				state.targetState = "";
				state.manualCancel.add("card");
				state.manualCancel.delete("target");
			} else {
				state.manualCancel.clear();
				state.cardDone = true;
			}
		}
		return original.apply(this, args);
	});

	wrapAround(ui.click, "skill", function (original, ...args) {
		autoStates.delete(_status.event);
		return original.apply(this, args);
	});

	wrapAround(ui.click, "target", function (original, ...args) {
		const event = _status.event;
		if (event && this.classList?.contains("selected")) {
			const state = getState(event);
			state.targetState = "";
			state.manualCancel.add("target");
		}
		return original.apply(this, args);
	});

	lib.hooks?.checkEnd?.add("_decadeUI_autoSelect", (event, { ok }) => {
		if (ok || _status.event !== event || !event.isMine() || (_status.paused && !_status.imchoosing)) return;

		const changed = performAutoSelectCard() || performAutoSelectTarget();
		if (changed) {
			game.check();
			if (!event.forced && !event.fakeforce && ui.confirm?.str === "o") {
				ui.create.confirm("oc");
			}
		}
	});
}
