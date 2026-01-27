/**
 * @fileoverview 技能自动确认模块
 * @description 在关闭全局自动确认的情况下，让技能仍然保持自动确认
 */
import { lib, game, get, _status } from "noname";

/**
 * 判断是否为技能事件
 * @param {GameEvent} event
 * @returns {boolean}
 */
function isSkillEvent(event) {
	if (!event) return false;
	if (event.skill) return true;
	if (event._backup && event._backup.skill) return true;
	return false;
}

/**
 * 判断技能是否需要手动确认
 * @param {string} skill - 技能名
 * @param {GameEvent} event - 游戏事件
 * @returns {boolean}
 */
function skillNeedsManualConfirm(skill, event) {
	if (!skill) return false;

	const skillinfo = get.info(skill);
	if (!skillinfo) return false;

	// 限定技、觉醒技、标记手动确认的技能
	if (skillinfo.manualConfirm === true) return true;
	if (skillinfo.limited === true) return true;
	if (skillinfo.skillAnimation === true) return true;

	// 需要选择目标的技能
	if (event && event.filterTarget && typeof event.filterTarget === "function") {
		const targets = game.filterPlayer();
		const hasSelectableTarget = targets.some(target => {
			try {
				return event.filterTarget(get.card(), event.player, target);
			} catch (e) {
				return false;
			}
		});
		if (hasSelectableTarget) return true;
	}

	if (skillinfo.filterTarget && typeof skillinfo.filterTarget === "function") {
		return true;
	}

	return false;
}

/**
 * 判断是否应该强制自动确认
 * @param {GameEvent} event
 * @returns {boolean}
 */
function shouldForceAutoConfirm(event) {
	if (lib.config.auto_confirm) return false;
	if (!isSkillEvent(event)) return false;

	const skill = event.skill || (event._backup && event._backup.skill);
	if (skillNeedsManualConfirm(skill, event)) return false;

	const card = get.card();
	if (card) {
		const cardinfo = get.info(card);
		if (cardinfo?.manualConfirm === true) return false;
	}

	return true;
}

/**
 * 设置技能自动确认功能
 */
export function setupSkillAutoConfirm() {
	const originalGameCheck = game.check;

	// 覆写 game.check，在技能事件时临时开启自动确认
	game.check = function (event = _status.event) {
		const originalAutoConfirm = lib.config.auto_confirm;

		try {
			if (shouldForceAutoConfirm(event)) {
				lib.config.auto_confirm = true;
			}
			return originalGameCheck.call(this, event);
		} finally {
			lib.config.auto_confirm = originalAutoConfirm;
		}
	};

	// 监听 checkEnd 钩子，二次确认
	const checkEndHandler = ({ args }) => {
		const [event, checkData] = args;

		if (lib.config.auto_confirm) return;
		if (!isSkillEvent(event)) return;

		const skill = event.skill || (event._backup && event._backup.skill);
		if (skillNeedsManualConfirm(skill, event)) return;

		const card = get.card();
		if (card) {
			const cardinfo = get.info(card);
			if (cardinfo?.manualConfirm === true) return;
		}

		if (checkData) {
			checkData.auto_confirm = true;
			checkData.autoConfirm = true;
		}
	};

	lib.announce.subscribe("Noname.Hook.checkEnd", checkEndHandler);

	if (!window.decadeUI) window.decadeUI = {};
	window.decadeUI._skillAutoConfirmHandler = checkEndHandler;
}
