"use strict";

/**
 * @fileoverview 禁用浏览器快捷键
 * 防止玩家在游戏过程中误触浏览器快捷键导致游戏中断
 */

/**
 * 需要禁用的浏览器快捷键列表
 * @type {Array<{ctrl?: boolean, shift?: boolean, alt?: boolean, key: string, description: string}>}
 */
const BLOCKED_SHORTCUTS = [
	// 文件操作
	{ ctrl: true, key: "s", description: "保存页面" },
	{ ctrl: true, key: "o", description: "打开文件" },
	{ ctrl: true, key: "p", description: "打印" },
	{ ctrl: true, shift: true, key: "s", description: "另存为" },

	// 窗口/标签页操作
	{ ctrl: true, key: "w", description: "关闭标签页" },
	{ ctrl: true, key: "n", description: "新建窗口" },
	{ ctrl: true, shift: true, key: "n", description: "新建隐私窗口" },
	{ ctrl: true, key: "t", description: "新建标签页" },
	{ ctrl: true, shift: true, key: "t", description: "恢复关闭的标签页" },

	// 页面操作
	{ ctrl: true, key: "f", description: "查找" },
	{ ctrl: true, key: "h", description: "历史记录" },
	{ ctrl: true, key: "j", description: "下载" },
	{ ctrl: true, key: "d", description: "添加书签" },
	{ ctrl: true, shift: true, key: "d", description: "保存所有标签为书签" },

	// 其他
	{ ctrl: true, key: "u", description: "查看源代码" },
	{ ctrl: true, shift: true, key: "Delete", description: "清除浏览数据" },
];

/**
 * 检查事件是否匹配某个快捷键配置
 * @param {KeyboardEvent} event - 键盘事件
 * @param {Object} shortcut - 快捷键配置
 * @returns {boolean}
 */
function matchesShortcut(event, shortcut) {
	const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
	const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
	const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
	const altMatch = shortcut.alt ? event.altKey : !event.altKey;

	return keyMatch && ctrlMatch && shiftMatch && altMatch;
}

/**
 * 处理键盘事件，拦截浏览器快捷键
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyDown(event) {
	for (const shortcut of BLOCKED_SHORTCUTS) {
		if (matchesShortcut(event, shortcut)) {
			// 只阻止浏览器默认行为，不阻止事件传播
			// 这样游戏内的快捷键监听器仍然可以接收到事件
			event.preventDefault();
			return;
		}
	}
}

/**
 * 检测是否在浏览器环境
 * @returns {boolean}
 */
function isBrowserEnvironment() {
	// 排除 Electron、Cordova 等客户端环境
	return (
		typeof window !== "undefined" &&
		typeof window.document !== "undefined" &&
		!window.require && // Electron
		!window.cordova && // Cordova
		!window.nw // NW.js
	);
}

/**
 * 初始化浏览器快捷键禁用功能
 */
export function setupDisableBrowserShortcuts() {
	if (!isBrowserEnvironment()) return;

	// 使用捕获阶段监听，确保在游戏监听器之前拦截
	document.addEventListener("keydown", handleKeyDown, { capture: true });
}
