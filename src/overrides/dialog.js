/**
 * Dialog覆写模块
 */
import { lib, ui } from "noname";
import { wrapBefore } from "../utils/safeOverride.js";

export function applyDialogOverrides() {
	const restoreFns = [];

	if (lib.element?.dialog) {
		restoreFns.push(
			wrapBefore(lib.element.dialog, "close", function () {
				if (this.intersection) {
					this.intersection.disconnect();
					this.intersection = undefined;
				}
			})
		);
	}

	return restoreFns;
}

/**
 * dialog.open 完全替换
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
