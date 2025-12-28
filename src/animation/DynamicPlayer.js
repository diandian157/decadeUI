"use strict";

/**
 * 动态播放器 - 支持OffscreenCanvas的高性能播放器
 */

import { AnimationPlayer } from "./AnimationPlayer.js";
import { throttle, observeSize } from "./utils.js";

let BUILT_ID = 0;
const DynamicWorkers = new Array(2);

export class DynamicPlayer {
	constructor(pathPrefix) {
		this.id = BUILT_ID++;
		this.dpr = 1;
		this.width = 120;
		this.height = 180;
		this.dprAdaptive = false;
		this.BUILT_ID = 0;

		const supportsOffscreen = self.OffscreenCanvas !== undefined;
		this.offscreen = false;

		if (supportsOffscreen) {
			this._initOffscreenRenderer(pathPrefix);
		}

		if (!this.offscreen) {
			this._initMainThreadRenderer(pathPrefix);
		}
	}

	/** 初始化离屏渲染器 */
	_initOffscreenRenderer(pathPrefix) {
		for (let i = 0; i < DynamicWorkers.length; i++) {
			if (!DynamicWorkers[i]) {
				// 使用 ES Module Worker
				DynamicWorkers[i] = new Worker(decadeUIPath + "src/animation/dynamicWorker.js", { type: "module" });
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

	/** 初始化主线程渲染器 */
	_initMainThreadRenderer(pathPrefix) {
		const renderer = new AnimationPlayer(decadeUIPath + pathPrefix);
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

	play(sprite) {
		const item = typeof sprite === "string" ? { name: sprite } : sprite;
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
			});
		} else {
			const dynamic = this.renderer;
			dynamic.useMipMaps = this.useMipMaps;
			dynamic.dprAdaptive = this.dprAdaptive;
			dynamic.outcropMask = this.outcropMask;

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

	stop(sprite) {
		if (this.offscreen) {
			this.renderer.postMessage({ message: "STOP", id: this.id, sprite });
		} else {
			this.renderer.stopSpine(sprite);
		}
	}

	stopAll() {
		if (this.offscreen) {
			this.renderer.postMessage({ message: "STOPALL", id: this.id });
		} else {
			this.renderer.stopSpineAll();
		}
	}

	update(force) {
		if (!this.offscreen) {
			this.renderer.resized = false;
			this.renderer.useMipMaps = this.useMipMaps;
			this.renderer.dprAdaptive = this.dprAdaptive;
			this.renderer.outcropMask = this.outcropMask;
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
		});
	}
}

// 导出静态变量供外部访问
export { BUILT_ID, DynamicWorkers };
