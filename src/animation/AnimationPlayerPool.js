"use strict";

/**
 * @fileoverview 动画播放器对象池，管理多个AnimationPlayer实例以提高性能
 */

import { AnimationPlayer } from "./AnimationPlayer.js";

/**
 * 动画播放器对象池类
 */
export class AnimationPlayerPool {
	/**
	 * @param {number} [size=1] - 池大小
	 * @param {string} pathPrefix - 资源路径前缀
	 * @param {string} [thisName] - 池名称
	 */
	constructor(size, pathPrefix, thisName) {
		if (!self.spine) {
			console.error("spine 未定义.");
			return;
		}
		this.name = thisName;
		this.animations = Array.from({ length: size || 1 }, () => new AnimationPlayer(pathPrefix));
	}

	/**
	 * 加载骨骼资源到所有播放器
	 * @param {string} filename - 骨骼文件名
	 * @param {string} skelType - 骨骼类型
	 * @param {Function} [onload] - 加载成功回调
	 * @param {Function} [onerror] - 加载失败回调
	 */
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

	/**
	 * 在指定元素上播放骨骼动画
	 * @param {HTMLElement} element - 目标元素
	 * @param {string|Object} animation - 动画名称或配置
	 * @param {Object} [position] - 位置配置
	 */
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
