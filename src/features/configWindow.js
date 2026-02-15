/**
 * @fileoverview 配置窗口功能模块
 * @description 初始化独立配置窗口功能
 * @module features/configWindow
 */
import { showDecadeConfigWindow, hideDecadeConfigWindow } from "../config/config-window.js";

/**
 * 设置配置窗口功能
 */
export function setupConfigWindow() {
	if (window.decadeUI) {
		window.decadeUI.showConfigWindow = showDecadeConfigWindow;
		window.decadeUI.hideConfigWindow = hideDecadeConfigWindow;
	}

	// 添加快捷键支持 (Ctrl+Shift+C 打开配置窗口)
	document.addEventListener("keydown", e => {
		if (e.ctrlKey && e.shiftKey && e.key === "C") {
			e.preventDefault();
			showDecadeConfigWindow();
		}
	});
}
