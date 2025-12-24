"use strict";

/**
 * Spine 动画 Web Worker
 * 用于在独立线程中处理动态皮肤的 Spine 动画渲染
 */

// ============ 环境兼容 ============

// Worker 环境模拟
self.window = self;
self.devicePixelRatio = 1;
self.documentZoom = 1;
self.HTMLCanvasElement = () => "HTMLCanvasElement";
self.HTMLElement = () => "HTMLElement";

// 扩展数组方法：移除指定元素
if (!Array.prototype.remove) {
	Array.prototype.remove = function (item) {
		const index = this.indexOf(item);
		return index >= 0 ? this.splice(index, 1) : item;
	};
}

// 加载 Spine 库（非模块脚本）
importScripts("../libs/spine.js");

// 动态导入模块
import { AnimationPlayer } from "./AnimationPlayer.js";

// ============ 动画实例管理 ============

const MAX_DYNAMICS = 4;
const dynamics = [];

dynamics.getById = function (id) {
	return this.find(item => item.id === id) ?? null;
};

// ============ 消息处理 ============

const handlers = {
	// 创建动画实例
	CREATE({ id, pathPrefix, canvas }) {
		if (dynamics.length >= MAX_DYNAMICS) return;

		const player = new AnimationPlayer(pathPrefix, "offscreen", canvas);
		player.id = id;
		dynamics.push(player);
	},

	// 播放动画
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

	// 停止指定动画
	STOP({ id, sprite }) {
		dynamics.getById(id)?.stopSpine(sprite);
	},

	// 停止所有动画
	STOPALL({ id }) {
		dynamics.getById(id)?.stopSpineAll();
	},

	// 更新动画参数
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
