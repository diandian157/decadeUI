"use strict";

/**
 * @fileoverview 电脑端快捷切换样式
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {string[]} Alt+1~6 对应的样式 */
const STYLES = ["on", "off", "othersOff", "onlineUI", "babysha", "codename"];

/**
 * 处理样式快捷键
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleStyleHotkey(event) {
	if (!event.altKey) return;

	const keyNum = parseInt(event.key);
	if (isNaN(keyNum) || keyNum < 1 || keyNum > 6) return;

	event.preventDefault();

	const newStyle = STYLES[keyNum - 1];
	if (lib.config.extension_十周年UI_newDecadeStyle === newStyle) return;

	game.saveConfig("extension_十周年UI_newDecadeStyle", newStyle);
	setTimeout(() => game.reload(), 100);
}

/**
 * 设置 Alt+1~6 快捷键切换样式
 */
export function setupStyleHotkeys() {
	document.addEventListener("keydown", handleStyleHotkey);
}
