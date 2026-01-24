"use strict";

/**
 * @fileoverview Spine动画Web Worker，在独立线程中处理动态皮肤的Spine动画渲染
 */

// Worker环境模拟
self.window = self;
self.devicePixelRatio = 1;
self.documentZoom = 1;
self.HTMLCanvasElement = () => "HTMLCanvasElement";
self.HTMLElement = () => "HTMLElement";

// 扩展数组方法
if (!Array.prototype.remove) {
	Array.prototype.remove = function (item) {
		const index = this.indexOf(item);
		return index >= 0 ? this.splice(index, 1) : item;
	};
}

importScripts("../libs/spine/spine-3.8.js");

import { AnimationPlayer } from "./AnimationPlayer.js";

/** @type {number} 最大动画实例数 */
const MAX_DYNAMICS = 4;

/** @type {AnimationPlayer[]} 动画实例数组 */
const dynamics = [];

/**
 * 根据ID获取动画实例
 * @param {number} id - 实例ID
 * @returns {AnimationPlayer|null} 动画实例
 */
dynamics.getById = function (id) {
	return this.find(item => item.id === id) ?? null;
};

/**
 * 消息处理器
 * @type {Object.<string, Function>}
 */
const handlers = {
	/**
	 * 创建动画实例
	 * @param {Object} params - 参数
	 * @param {number} params.id - 实例ID
	 * @param {string} params.pathPrefix - 资源路径前缀
	 * @param {OffscreenCanvas} params.canvas - 离屏画布
	 */
	CREATE({ id, pathPrefix, canvas }) {
		if (dynamics.length >= MAX_DYNAMICS) return;

		const player = new AnimationPlayer(pathPrefix, "offscreen", canvas);
		player.id = id;
		dynamics.push(player);
	},

	/**
	 * 播放动画
	 * @param {Object} params - 参数
	 * @param {number} params.id - 实例ID
	 * @param {string|Object} params.sprite - 动画配置
	 */
	PLAY({ id, sprite: spriteConfig }) {
		const dynamic = dynamics.getById(id);
		if (!dynamic) return;

		const sprite = typeof spriteConfig === "string" ? { name: spriteConfig } : spriteConfig;
		sprite.loop = true;

		const play = () => {
			const track = dynamic.playSpine(sprite);
			track.opacity = 0;
			track.fadeTo(1, 600);
		};

		if (dynamic.hasSpine(sprite.name) && dynamic.playSpine) {
			play();
		} else {
			dynamic.loadSpine(sprite.name, "skel", play);
		}
	},

	/**
	 * 停止指定动画
	 * @param {Object} params - 参数
	 * @param {number} params.id - 实例ID
	 * @param {Object} params.sprite - 动画配置
	 */
	STOP({ id, sprite }) {
		dynamics.getById(id)?.stopSpine(sprite);
	},

	/**
	 * 停止所有动画
	 * @param {Object} params - 参数
	 * @param {number} params.id - 实例ID
	 */
	STOPALL({ id }) {
		dynamics.getById(id)?.stopSpineAll();
	},

	/**
	 * 更新动画参数
	 * @param {Object} data - 更新数据
	 */
	UPDATE(data) {
		const dynamic = dynamics.getById(data.id);
		if (!dynamic) return;

		dynamic.resized = false;
		const props = ["dpr", "dprAdaptive", "outcropMask", "useMipMaps", "width", "height"];
		props.forEach(prop => {
			if (data[prop] != null) dynamic[prop] = data[prop];
		});
	},
};

// 监听主线程消息
self.onmessage = ({ data }) => handlers[data.message]?.(data);
