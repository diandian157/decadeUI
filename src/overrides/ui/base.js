/**
 * @fileoverview UI覆写基础模块
 * @description 管理基础方法引用
 * @module overrides/ui/base
 */

// 基础方法引用

/** @type {Function|null} 基础UI更新方法 */
let baseUiUpdate = null;

/** @type {Function|null} 基础介绍点击方法 */
let baseUiClickIntro = null;

/** @type {Function|null} 基础arena方法引用 */
let baseUiCreateArena = null;

/** @type {Function|null} 基础pause方法引用 */
let baseUiCreatePause = null;

/** @type {Function|null} 基础characterDialog方法引用 */
let baseUiCreateCharacterDialog = null;

/** @type {Function|null} 基础button方法引用 */
let baseUiCreateButton = null;

/**
 * 设置基础UI方法引用
 * @param {Object} base - 基础方法对象
 */
export function setBaseUiMethods(base) {
	baseUiUpdate = base.update;
	baseUiClickIntro = base.click?.intro;
}

/**
 * 设置基础create方法引用
 * @param {Object} base - 基础方法对象
 */
export function setBaseUiCreateMethods(base) {
	baseUiCreateArena = base.arena;
	baseUiCreatePause = base.pause;
	baseUiCreateCharacterDialog = base.characterDialog;
	baseUiCreateButton = base.button;
}

/**
 * 获取基础UI更新方法
 * @returns {Function|null}
 */
export function getBaseUiUpdate() {
	return baseUiUpdate;
}

/**
 * 获取基础介绍点击方法
 * @returns {Function|null}
 */
export function getBaseUiClickIntro() {
	return baseUiClickIntro;
}

/**
 * 获取基础arena方法
 * @returns {Function|null}
 */
export function getBaseUiCreateArena() {
	return baseUiCreateArena;
}

/**
 * 获取基础pause方法
 * @returns {Function|null}
 */
export function getBaseUiCreatePause() {
	return baseUiCreatePause;
}

/**
 * 获取基础characterDialog方法
 * @returns {Function|null}
 */
export function getBaseUiCreateCharacterDialog() {
	return baseUiCreateCharacterDialog;
}

/**
 * 获取基础button方法
 * @returns {Function|null}
 */
export function getBaseUiCreateButton() {
	return baseUiCreateButton;
}

/**
 * 应用UI覆写（占位函数）
 */
export function applyUiOverrides() {
}
