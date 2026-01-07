/**
 * @fileoverview UI更新方法模块
 * @description 包含各种UI更新相关的覆写方法
 * @module overrides/ui/update
 */

import { lib, game, ui, get, _status } from "noname";
import { throttle } from "../../animation/index.js";
import { getBaseUiUpdate } from "./base.js";

/**
 * 更新控制栏位置
 * @description 处理stayleft控件的位置计算
 */
export function uiUpdatec() {
	const controls = ui.control.childNodes;
	let stayleft;
	let offsetLeft;

	for (let i = 0; i < controls.length; i++) {
		if (!stayleft && controls[i].stayleft) {
			stayleft = controls[i];
		} else if (!offsetLeft) {
			offsetLeft = controls[i].offsetLeft;
		}
		if (stayleft && offsetLeft) break;
	}

	if (stayleft) {
		if (ui.$stayleft != stayleft) {
			stayleft._width = stayleft.offsetWidth;
			ui.$stayleft = stayleft;
		}
		if (offsetLeft < stayleft._width) {
			stayleft.style.position = "static";
		} else {
			stayleft.style.position = "absolute";
		}
	}
}

/**
 * 更新手牌布局
 * @description 触发decadeUI的手牌布局更新
 */
export function uiUpdatehl() {
	decadeUI.queueNextFrameTick(decadeUI.layoutHand, decadeUI);
}

/**
 * 更新判定区
 * @description 更新玩家判定区的卡牌显示
 * @param {Object} player - 玩家对象
 */
export function uiUpdatej(player) {
	if (!player) return;

	const judges = player.node.judges.childNodes;
	for (let i = 0; i < judges.length; i++) {
		if (judges[i].classList.contains("removing")) continue;
		judges[i].classList.remove("drawinghidden");

		if (_status.connectMode) {
			const bgMark = lib.translate[judges[i].name + "_bg"] || get.translation(judges[i].name)[0];
			judges[i].node.judgeMark.node.judge.innerHTML = bgMark;
		}
	}
}

/**
 * 更新标记（空实现）
 * @description 十周年UI中标记更新由其他机制处理
 * @param {Object} player - 玩家对象
 */
export function uiUpdatem(player) {}

/**
 * 更新缩放
 * @description 设置文档缩放比例
 */
export function uiUpdatez() {
	window.documentZoom = game.documentZoom;
	document.body.style.zoom = game.documentZoom;
	document.body.style.width = "100%";
	document.body.style.height = "100%";
	document.body.style.transform = "";
}

/**
 * 更新对话框
 * @description 更新对话框的高度和滚动状态
 */
export function uiUpdate() {
	for (const update of ui.updates) update();

	if (ui.dialog === undefined || ui.dialog.classList.contains("noupdate")) return;

	if (game.chess) return getBaseUiUpdate()?.();

	// 处理对话框样式
	if ((!ui.dialog.buttons || !ui.dialog.buttons.length) && !ui.dialog.forcebutton && ui.dialog.classList.contains("fullheight") === false && get.mode() !== "stone") {
		ui.dialog.classList.add("prompt");
	} else {
		ui.dialog.classList.remove("prompt");

		let height = ui.dialog.content.offsetHeight;
		if (decadeUI.isMobile()) {
			height = decadeUI.get.bodySize().height * 0.75 - 80;
		} else {
			height = decadeUI.get.bodySize().height * 0.45;
		}
		ui.dialog.style.height = Math.min(height, ui.dialog.content.offsetHeight) + "px";
	}

	// 处理滚动样式
	if (!ui.dialog.forcebutton && !ui.dialog._scrollset) {
		ui.dialog.classList.remove("scroll1");
		ui.dialog.classList.remove("scroll2");
	} else {
		ui.dialog.classList.add("scroll1");
		ui.dialog.classList.add("scroll2");
	}
}

/**
 * 更新判定标记
 * @description 更新判定区节点的变换样式
 * @param {Object} player - 玩家对象
 * @param {NodeList} nodes - 节点列表
 * @param {number} [start=0] - 起始位置
 * @param {boolean} [inv] - 是否反转
 */
export function uiUpdatejm(player, nodes, start, inv) {
	if (typeof start != "number") start = 0;

	for (let i = 0; i < nodes.childElementCount; i++) {
		const node = nodes.childNodes[i];
		if (i < start) {
			node.style.transform = "";
		} else if (node.classList.contains("removing")) {
			start++;
		} else {
			node.classList.remove("drawinghidden");
		}
	}
}

/**
 * 节流更新 - 延迟初始化
 * @type {Function|null}
 * @private
 */
let _uiUpdatexr = null;

/**
 * 节流更新方法
 * @description 使用节流函数限制更新频率
 * @returns {*} 更新结果
 */
export function uiUpdatexr() {
	if (!_uiUpdatexr) {
		_uiUpdatexr = throttle(ui.updatex, 100, ui);
	}
	return _uiUpdatexr.apply(this, arguments);
}
