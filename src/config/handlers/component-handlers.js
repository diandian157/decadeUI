/**
 * @fileoverview 部件管理配置处理函数
 * @description 处理部件管理相关配置项的onclick和update回调
 * @module config/handlers/component-handlers
 */
import { lib, game, ui, _status } from "noname";
import { parseInputValue } from "../utils.js";

/**
 * 进度条样式更新处理
 * @description 清理旧进度条并重置状态
 */
export function onJindutiaoYangshiUpdate() {
	if (window.timer) {
		clearInterval(window.timer);
		delete window.timer;
	}
	if (window.timer2) {
		clearInterval(window.timer2);
		delete window.timer2;
	}
	document.getElementById("jindutiaopl")?.remove();
	window.resetProgressBarState?.();
}

/**
 * 进度条高度失焦处理
 * @this {HTMLElement} 输入框元素
 */
export function onJindutiaoSetBlur() {
	const value = parseInputValue(this, 22, 0, 100);
	game.saveConfig("extension_十周年UI_jindutiaoSet", value);
	const progressBar = document.getElementById("jindutiaopl");
	if (progressBar) {
		progressBar.style.bottom = `${value}%`;
	}
}

/**
 * 进度条高度更新处理
 */
export function onJindutiaoSetUpdate() {
	const height = lib.config.extension_十周年UI_jindutiaoSet ?? "22";
	const progressBar = document.getElementById("jindutiaopl");
	if (progressBar) {
		progressBar.style.bottom = `${height}%`;
	}
}

/**
 * 阶段提示更新处理
 */
export function onJDTSYangshiUpdate() {
	if (lib.config.extension_十周年UI_JDTSYangshi === "0") {
		game.as_removeImage?.();
		delete _status.as_showImage_phase;
	}
}

/**
 * 狗托播报点击处理
 * @param {string} item - 播报样式选项
 */
export function onGTBBYangshiClick(item) {
	const oldValue = lib.config.extension_十周年UI_GTBBYangshi;
	game.saveConfig("extension_十周年UI_GTBBYangshi", item);

	// 清理旧的定时器
	if (window._gtbbCheckId) {
		clearInterval(window._gtbbCheckId);
		delete window._gtbbCheckId;
	}
	if (window._gtbbInterval) {
		clearInterval(window._gtbbInterval);
		delete window._gtbbInterval;
	}
	// 移除旧容器
	document.getElementById("gtbb-container")?.remove();

	// 初始化新的播报
	if (item !== "0") {
		import("../../ui/gtbb.js").then(module => module.initGTBB());
	}
}

/**
 * 标记样式更新处理
 */
export function onPlayerMarkStyleUpdate() {
	if (window.decadeUI) {
		ui.arena.dataset.playerMarkStyle = lib.config.extension_十周年UI_playerMarkStyle;
	}
}

/**
 * 光标+loading框更新处理
 */
export function onLoadingStyleUpdate() {
	if (window.decadeUI) {
		ui.arena.dataset.loadingStyle = lib.config.extension_十周年UI_loadingStyle;
	}
}

/**
 * 获得技能显示更新处理
 */
export function onGainSkillsVisibleUpdate() {
	if (window.decadeUI) {
		ui.arena.dataset.gainSkillsVisible = lib.config.extension_十周年UI_gainSkillsVisible;
	}
}
