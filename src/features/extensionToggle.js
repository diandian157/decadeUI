"use strict";

/**
 * @fileoverview 扩展快捷开关 - 关闭其他/恢复其他扩展
 * 用户/其他扩展可以在自己扩展里通过设置 _status.PROTECTED_EXTENSIONS 来追加自己需要保护的扩展
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {string} 存储键名 */
const STORAGE_KEY = "extension_十周年UI_closedExtensions";

/**
 * 获取当前扩展名称
 * @returns {string}
 */
const getCurrentExtName = () => window.decadeUIName || "十周年UI";

/**
 * 获取受保护的扩展白名单（动态读取，确保其他扩展有机会设置）
 * @returns {string[]}
 */
const getProtectedExtensions = () => _status.PROTECTED_EXTENSIONS ?? [];

/**
 * 获取其他扩展列表
 * @returns {string[]}
 */
const getOtherExtensions = () => {
	const current = getCurrentExtName();
	const protectedList = getProtectedExtensions();
	return (lib.config.extensions || []).filter(ext => ext !== current && !protectedList.includes(ext));
};

/**
 * 获取已启用的扩展列表
 * @returns {string[]}
 */
const getEnabledExtensions = () => getOtherExtensions().filter(ext => lib.config[`extension_${ext}_enable`]);

/**
 * 获取已关闭的扩展列表
 * @returns {string[]}
 */
const getClosedExtensions = () => {
	const saved = lib.config[STORAGE_KEY];
	return Array.isArray(saved) ? saved : [];
};

/**
 * 检查是否有已关闭的扩展
 * @returns {boolean}
 */
const hasClosedExtensions = () => getClosedExtensions().length > 0;

/**
 * 获取按钮文本
 * @returns {string}
 */
const getButtonText = () => (hasClosedExtensions() ? "恢复其他扩展" : "关闭其他扩展");

/**
 * 切换扩展状态
 */
const toggleExtensions = () => {
	const hasClosed = hasClosedExtensions();
	const list = hasClosed ? getClosedExtensions() : getEnabledExtensions();

	if (list.length === 0) {
		alert(hasClosed ? "没有需要恢复的扩展" : "没有其他已启用的扩展");
		return;
	}

	const action = hasClosed ? "恢复其他" : "关闭其他";
	const extList = list.map(ext => `· ${ext}`).join("\n");
	if (!confirm(`确定${action}以下 ${list.length} 个扩展？\n\n${extList}\n\n将自动重启游戏。`)) return;

	if (hasClosed) {
		list.forEach(ext => {
			if (lib.config.extensions?.includes(ext)) {
				game.saveConfig(`extension_${ext}_enable`, true);
			}
		});
		game.saveConfig(STORAGE_KEY, []);
	} else {
		game.saveConfig(STORAGE_KEY, list);
		list.forEach(ext => game.saveConfig(`extension_${ext}_enable`, false));
	}

	setTimeout(() => game.reload(), 100);
};

/**
 * 初始化扩展快捷开关
 */
export function setupExtensionToggle() {
	// 暴露方法供config调用
	if (window.decadeUI) {
		window.decadeUI.toggleExtensions = toggleExtensions;
	}

	// 顶部菜单按钮
	const timer = setInterval(() => {
		if (!ui.system1 && !ui.system2) return;
		clearInterval(timer);

		const btn = ui.create.system(getButtonText(), toggleExtensions, true);

		const _saveConfig = game.saveConfig;
		game.saveConfig = function (key) {
			const result = _saveConfig.apply(this, arguments);
			if (key === STORAGE_KEY) btn.innerHTML = getButtonText();
			return result;
		};
	}, 500);
}
