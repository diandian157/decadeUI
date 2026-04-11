"use strict";

/**
 * @fileoverview 动态播放器模块 - 支持离屏渲染的高性能 Spine 动画播放器
 * @description 提供基于 OffscreenCanvas 和 Web Worker 的动画播放能力，可在主线程或离屏线程中渲染动画
 */
import { _status } from "noname";
import { AnimationPlayer } from "./AnimationPlayer.js";
import { throttle, observeSize } from "./utils.js";

/**
 * 播放器实例的唯一标识计数器
 * @type {number}
 */
let BUILT_ID = 0;

/**
 * Web Worker 实例池，用于离屏渲染
 * @type {Worker[]}
 */
const DynamicWorkers = new Array(2);

/**
 * 动态播放器类 - 用于播放 Spine 骨骼动画
 * @class
 * @description 支持两种渲染模式：离屏渲染（使用 Web Worker）和主线程渲染
 */
export class DynamicPlayer {
	/**
	 * 创建动态播放器实例
	 * @param {string} pathPrefix - 动画资源文件的路径前缀
	 */
	constructor(pathPrefix) {
		/** @type {number} 播放器的唯一标识 */
		this.id = BUILT_ID++;

		/** @type {number} 设备像素比，用于高清屏适配 */
		this.dpr = 1;

		/** @type {number} 画布宽度（像素） */
		this.width = 120;

		/** @type {number} 画布高度（像素） */
		this.height = 180;

		/** @type {boolean} 是否自动适配设备像素比 */
		this.dprAdaptive = false;

		/** @type {number} 动画实例的内部计数器 */
		this.BUILT_ID = 0;

		/** @type {boolean} 是否解包预乘 Alpha 通道 */
		this.unpackPremultipliedAlpha = false;

		const supportsOffscreen = false;

		/** @type {boolean} 是否使用离屏渲染模式 */
		this.offscreen = false;

		if (supportsOffscreen) {
			this._initOffscreenRenderer(pathPrefix);
		}

		if (!this.offscreen) {
			this._initMainThreadRenderer(pathPrefix);
		}
	}

	/**
	 * 初始化离屏渲染器（使用 Web Worker）
	 * @private
	 * @param {string} pathPrefix - 动画资源文件的路径前缀
	 * @description 在 Worker 线程中渲染动画，避免阻塞主线程，提升性能
	 */
	_initOffscreenRenderer(pathPrefix) {
		for (let i = 0; i < DynamicWorkers.length; i++) {
			if (!DynamicWorkers[i]) {
				DynamicWorkers[i] = new Worker(decadeUIPath + "src/animation/dynamicWorker.js");
				DynamicWorkers[i].capacity = 0;
			} else if (DynamicWorkers[i].capacity >= 4) {
				continue;
			}

			this.renderer = DynamicWorkers[i];
			this.canvas = document.createElement("canvas");
			this.canvas.className = "animation-player";

			observeSize(
				this.canvas,
				throttle(
					newSize => {
						this.height = Math.round(newSize.height);
						this.width = Math.round(newSize.width);
						this.update();
					},
					100,
					this
				)
			);

			const canvas = this.canvas.transferControlToOffscreen();
			DynamicWorkers[i].postMessage({ message: "CREATE", id: this.id, canvas, pathPrefix }, [canvas]);

			DynamicWorkers[i].capacity++;
			this.offscreen = true;
			break;
		}
	}

	/**
	 * 初始化主线程渲染器
	 * @private
	 * @param {string} pathPrefix - 动画资源文件的路径前缀
	 * @description 在主线程中渲染动画，兼容不支持离屏渲染的环境
	 */
	_initMainThreadRenderer(pathPrefix) {
		const renderer = new AnimationPlayer(pathPrefix);
		this.canvas = renderer.canvas;
		this.renderer = renderer;
		decadeUI.bodySensor.addListener(
			throttle(
				() => {
					this.renderer.resized = false;
				},
				100,
				this
			),
			true
		);
	}

	/**
	 * 播放指定的动画
	 * @param {string|Object} sprite - 动画名称（字符串）或动画配置对象
	 * @param {string} sprite.name - 动画名称
	 * @param {boolean} [sprite.loop=true] - 是否循环播放
	 * @param {Function} [sprite.oncomplete] - 动画播放完成时的回调函数
	 * @returns {Object} 返回包含动画信息的配置对象
	 * @description 支持传入动画名称或完整配置对象，动画会以淡入效果开始播放
	 */
	play(sprite) {
		const item = typeof sprite === "string" ? { name: sprite } : sprite;
		this.unpackPremultipliedAlpha = !!item.unpackPremultipliedAlpha;
		item.id = this.BUILT_ID++;
		item.loop = true;

		if (this.offscreen) {
			if (!this.initialized) {
				this.initialized = true;
				this.dpr = Math.max(window.devicePixelRatio * (window.documentZoom || 1), 1);
				this.height = this.canvas.clientHeight;
				this.width = this.canvas.clientWidth;
			}
			if (typeof item.oncomplete === "function") {
				item.oncomplete = item.oncomplete.toString();
			}
			this.renderer.postMessage({
				message: "PLAY",
				id: this.id,
				dpr: this.dpr,
				dprAdaptive: this.dprAdaptive,
				outcropMask: this.outcropMask,
				useMipMaps: this.useMipMaps,
				width: this.width,
				height: this.height,
				sprite: item,
				unpackPremultipliedAlpha: !!item.unpackPremultipliedAlpha,
			});
		} else {
			const dynamic = this.renderer;
			dynamic.useMipMaps = this.useMipMaps;
			dynamic.dprAdaptive = this.dprAdaptive;
			dynamic.outcropMask = this.outcropMask;
			dynamic.unpackPremultipliedAlpha = !!item.unpackPremultipliedAlpha;
			if (item.unpackPremultipliedAlpha && item.alpha !== true) {
				item.alpha = true;
			}

			const run = () => {
				const t = dynamic.playSpine(item);
				t.opacity = 0;
				t.fadeTo(1, 600);
			};

			if (dynamic.hasSpine(item.name)) run();
			else dynamic.loadSpine(item.name, "skel", run);
		}
		return item;
	}

	/**
	 * 停止播放指定的动画
	 * @param {Object} sprite - 要停止的动画配置对象（通常是 play 方法返回的对象）
	 */
	stop(sprite) {
		if (this.offscreen) {
			this.renderer.postMessage({ message: "STOP", id: this.id, sprite });
		} else {
			this.renderer.stopSpine(sprite);
		}
	}

	/**
	 * 停止播放所有正在运行的动画
	 */
	stopAll() {
		if (this.offscreen) {
			this.renderer.postMessage({ message: "STOPALL", id: this.id });
		} else {
			this.renderer.stopSpineAll();
		}
	}

	/**
	 * 更新播放器的渲染参数
	 * @param {boolean} [force] - 是否强制更新（传入 false 时仅更新 dpr，不发送消息）
	 * @description 当画布尺寸、设备像素比或其他渲染参数变化时调用此方法
	 */
	update(force) {
		if (!this.offscreen) {
			this.renderer.resized = false;
			this.renderer.useMipMaps = this.useMipMaps;
			this.renderer.dprAdaptive = this.dprAdaptive;
			this.renderer.outcropMask = this.outcropMask;
			this.renderer.unpackPremultipliedAlpha = this.unpackPremultipliedAlpha;
			return;
		}
		this.dpr = Math.max(window.devicePixelRatio * (window.documentZoom || 1), 1);
		if (force === false) return;
		this.renderer.postMessage({
			message: "UPDATE",
			id: this.id,
			dpr: this.dpr,
			dprAdaptive: this.dprAdaptive,
			outcropMask: this.outcropMask,
			useMipMaps: this.useMipMaps,
			width: this.width,
			height: this.height,
			unpackPremultipliedAlpha: this.unpackPremultipliedAlpha,
		});
	}
}

export { BUILT_ID, DynamicWorkers };
