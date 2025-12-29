/**
 * @fileoverview Dialog覆写模块 - lib.element.dialog的覆写方法
 */
import { lib, game, ui, get, ai, _status } from "noname";

/** @type {Function|null} 基础方法引用 */
let baseDialogClose = null;

/**
 * 设置基础dialog方法引用
 * @param {Object} base - 基础方法对象
 */
export function setBaseDialogMethods(base) {
	baseDialogClose = base?.close;
}

/**
 * dialog.open覆写
 * @returns {HTMLElement|undefined} 对话框元素
 */
export function dialogOpen() {
	if (this.noopen) return;

	for (let i = 0; i < ui.dialogs.length; i++) {
		if (ui.dialogs[i] === this) {
			this.show();
			this.refocus();
			ui.dialogs.remove(this);
			ui.dialogs.unshift(this);
			ui.update();
			return this;
		}
		if (!this.peaceDialog) {
			if (ui.dialogs[i].static) {
				ui.dialogs[i].unfocus();
			} else {
				ui.dialogs[i].hide();
			}
		}
	}

	ui.dialog = this;
	ui.arena.appendChild(this);
	ui.dialogs.unshift(this);
	ui.update();

	if (!this.classList.contains("prompt")) {
		this.style.animation = "open-dialog 0.5s";
	}

	return this;
}

/**
 * dialog.close覆写
 * @returns {*} 关闭结果
 */
export function dialogClose() {
	if (this.intersection) {
		this.intersection.disconnect();
		this.intersection = undefined;
	}
	return baseDialogClose?.apply(this, arguments);
}

/**
 * 应用dialog覆写
 */
export function applyDialogOverrides() {
	// 此函数用于在需要时应用覆写
}
