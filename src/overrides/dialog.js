/**
 * Dialog覆写模块
 * @description lib.element.dialog的覆写方法
 */
import { lib, ui } from "noname";

// 基础方法引用
let baseDialogClose = null;

/**
 * 设置基础dialog方法引用
 */
export function setBaseDialogMethods(base) {
	baseDialogClose = base?.close;
}

/**
 * dialog.open 覆写
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
 * dialog.close 覆写
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
