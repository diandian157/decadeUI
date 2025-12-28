"use strict";

/**
 * 动画播放器对象池 - 管理多个播放器实例
 */

import { AnimationPlayer } from "./AnimationPlayer.js";

export class AnimationPlayerPool {
	constructor(size, pathPrefix, thisName) {
		if (!self.spine) {
			console.error("spine 未定义.");
			return;
		}
		this.name = thisName;
		this.animations = Array.from({ length: size || 1 }, () => new AnimationPlayer(pathPrefix));
	}

	loadSpine(filename, skelType, onload, onerror) {
		this.animations[0].loadSpine(
			filename,
			skelType,
			() => {
				// 预加载到其他播放器
				for (let i = 1; i < this.animations.length; i++) {
					const ap = this.animations[i];
					if (window.requestIdleCallback) {
						requestIdleCallback(() => ap.prepSpine(filename, true), { timeout: 200 });
					} else {
						setTimeout(() => ap.prepSpine(filename, true), 50);
					}
				}
				if (onload) onload();
			},
			onerror
		);
	}

	playSpineTo(element, animation, position) {
		if (position?.parent) {
			position.parent = undefined;
		}

		// 复用已绑定的播放器
		if (element._ap?.canvas.parentNode === element) {
			element._ap.playSpine(animation, position);
			return;
		}

		// 查找空闲播放器
		for (const ap of this.animations) {
			if (!ap.running) {
				if (ap.canvas.parentNode !== element) {
					element._ap = ap;
					element.appendChild(ap.canvas);
				}
				ap.playSpine(animation, position);
				return;
			}
		}
		console.error(`spine: ${this.name || ""} 可用动画播放组件不足`);
	}
}
