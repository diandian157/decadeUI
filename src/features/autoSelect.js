"use strict";

/**
 * 自动选择模块 - 在特定条件下自动选择卡牌和目标
 */

import { lib, game, ui, get, ai, _status } from "noname";

// ==================== 工具函数 ====================

/** 检查功能是否启用 */
const isEnabled = () => lib.config.extension_十周年UI_autoSelect !== false;

/** 获取选择数量范围，统一返回 [min, max] 格式 */
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

/** 生成目标选择状态标识（用于防止重复触发） */
const getTargetState = () => {
	const cards = ui.selected.cards?.map(c => c.cardid || c.name).join(",") || "";
	const skill = _status.event?.skill || "";
	return `${skill}|${cards}`;
};

// ==================== 条件判断 ====================

/** 判断是否为响应类事件（需要快速响应的场景） */
const isRespondEvent = event => {
	// 直接响应事件
	if (event.name === "chooseToRespond" || event.respondTo || event.type === "wuxie") return true;

	// 排除弃牌阶段
	if (event.name === "phaseDiscard") return false;
	const parent = event.getParent?.();
	if (parent?.name === "phaseDiscard") return false;

	// 父事件为响应类
	if (parent?.name === "chooseToRespond" || parent?.respondTo) return true;

	// 濒死求桃
	if (parent?.name === "dying" || event.dying) return true;

	// 强制事件
	if (event.forced || event.forceDirect) return true;

	// 无按钮的选牌事件
	if (event.name === "chooseCard" && !event.dialog?.querySelector(".buttons")) return true;

	// 单张弃牌
	if (event.name === "chooseToDiscard") {
		const range = getRange(event, "Card");
		if (range[0] === 1 && range[1] === 1) {
			const pos = event.position;
			if (!event.ai || (pos !== "he" && pos !== "hes")) return true;
		}
	}

	return false;
};

/** 检查是否应自动选择目标 */
const shouldAutoSelectTarget = event => {
	if (!isEnabled() || !event.filterTarget || _status.auto) return false;
	if (event.noAutoSelect || event.complexSelect || event.complexTarget) return false;

	const range = getRange(event, "Target");
	if (range[0] !== range[1]) return false;

	const state = getTargetState();
	return event._autoTargetState !== state;
};

/** 检查是否应自动选择卡牌 */
const shouldAutoSelectCard = event => {
	if (!isEnabled() || !event.filterCard || _status.auto) return false;
	if (event.noAutoSelect || event.complexSelect || event.complexCard) return false;
	if (!isRespondEvent(event)) return false;

	const range = getRange(event, "Card");
	if (range[0] !== range[1]) return false;

	if (event.name === "chooseToDiscard" && range[0] > 1 && event.ai) {
		const pos = event.position;
		if (pos === "he" || pos === "hes") return false;
	}

	return !event._autoCardDone;
};

// ==================== 自动选择执行 ====================

/** 执行自动选择目标 */
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
		event._autoTargetState = getTargetState();
		return true;
	}
	return false;
};

/** 执行自动选择卡牌 */
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
		event._autoCardDone = true;
		return true;
	}
	return false;
};

// ==================== 事件钩子 ====================

/** 重置自动选择状态 */
const resetAutoState = event => {
	if (event) {
		delete event._autoCardDone;
		delete event._autoTargetState;
	}
};

/** 初始化自动选择模块 */
export function setupAutoSelect() {
	// 取消时重置状态
	const originalCancel = ui.click.cancel;
	ui.click.cancel = function () {
		resetAutoState(_status.event);
		return originalCancel.apply(this, arguments);
	};

	// 手动选卡时更新状态
	const originalCard = ui.click.card;
	ui.click.card = function () {
		const event = _status.event;
		if (event) {
			if (this.classList?.contains("selected")) {
				event._autoCardDone = true;
			} else {
				resetAutoState(event);
			}
		}
		return originalCard.apply(this, arguments);
	};

	// 切换技能时重置状态
	const originalSkill = ui.click.skill;
	ui.click.skill = function () {
		resetAutoState(_status.event);
		return originalSkill.apply(this, arguments);
	};

	// 注册 checkEnd 钩子
	lib.hooks?.checkEnd?.add("_decadeUI_autoSelect", (event, { ok }) => {
		if (ok) return;

		setTimeout(() => {
			if (_status.event !== event) return;
			if (_status.paused && !_status.imchoosing) return;

			const changed = performAutoSelectCard() || performAutoSelectTarget();
			if (changed) game.check();
		}, 0);
	});
}
