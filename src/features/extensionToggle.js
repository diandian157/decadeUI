"use strict";

/**
 * 扩展快捷开关 - 关闭其他/恢复其他其他扩展
 */

import { lib, game, ui, get, ai, _status } from "noname";

const STORAGE_KEY = "extension_十周年UI_closedExtensions";
const getCurrentExtName = () => window.decadeUIName || "十周年UI";

// 白名单：这些扩展不会被关闭
const PROTECTED_EXTENSIONS = ["AI禁将", "自用插件", "奇妙工具", "全能搜索"];

const getOtherExtensions = () => {
	const current = getCurrentExtName();
	return (lib.config.extensions || []).filter(ext => ext !== current && !PROTECTED_EXTENSIONS.includes(ext));
};

const getEnabledExtensions = () => getOtherExtensions().filter(ext => lib.config[`extension_${ext}_enable`]);

const getClosedExtensions = () => {
	const saved = lib.config[STORAGE_KEY];
	return Array.isArray(saved) ? saved : [];
};

const hasClosedExtensions = () => getClosedExtensions().length > 0;

const getButtonText = () => (hasClosedExtensions() ? "恢复其他扩展" : "关闭其他扩展");

/** 切换扩展状态 */
const toggleExtensions = () => {
	const hasClosed = hasClosedExtensions();
	const list = hasClosed ? getClosedExtensions() : getEnabledExtensions();

	if (list.length === 0) {
		alert(hasClosed ? "没有需要恢复其他的扩展" : "没有其他已启用的扩展");
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

/** 初始化 */
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
