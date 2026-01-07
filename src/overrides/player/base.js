/**
 * @fileoverview Player覆写基础模块
 * @description 管理基础方法引用和通用工具函数
 * @module overrides/player/base
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 基础玩家方法引用对象
 * @type {Object|null}
 * @private
 */
let basePlayerMethods = null;

/**
 * 设置基础玩家方法引用
 * @param {Object} methods - 基础方法对象，包含lib.element.player的原始方法
 * @returns {void}
 * @example
 */
export function setBasePlayerMethods(methods) {
	basePlayerMethods = methods;
}

/**
 * 获取基础玩家方法引用
 * @returns {Object|null} 基础方法对象
 */
export function getBasePlayerMethods() {
	return basePlayerMethods;
}

/**
 * 播放出牌音效
 * @returns {void}
 */
export function playShowCardAudio() {
	if (!lib.config["extension_十周年UI_bettersound"]) return;
	game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard.mp3");
}

/**
 * 获取decadeUI引用（延迟获取，避免循环依赖）
 * @type {Object|null}
 * @private
 */
let _decadeUI = null;

/**
 * 获取decadeUI对象引用
 * @returns {Object} decadeUI对象
 */
export function getDui() {
	if (!_decadeUI) _decadeUI = window.decadeUI;
	return _decadeUI;
}

/**
 * 应用player覆写（占位函数）
 * @description 基础方法在decadeUI.js中通过override机制设置
 * @returns {void}
 */
export function applyPlayerOverrides() {
	if (!lib.element?.player) return;
}
