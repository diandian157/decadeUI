"use strict";

/**
 * @fileoverview 动画播放器对象池，管理多个AnimationPlayer实例以提高性能
 */
import { lib, game, ui, get, ai, _status } from "noname";
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
		this.size = size || 1;
		this.pathPrefix = pathPrefix;
		this.animations = [];
		this.assetTypes = new Map();
	}

	/**
	 * 加载骨骼资源到所有播放器
	 * @param {string} filename - 骨骼文件名
	 * @param {string} skelType - 骨骼类型
	 * @param {Function} [onload] - 加载成功回调
	 * @param {Function} [onerror] - 加载失败回调
	 */
	loadSpine(filename, skelType, onload, onerror) {
		this.assetTypes.set(filename, skelType || "skel");
		onload?.();
	}

	hasSpine(filename) {
		return this.assetTypes.has(filename) || this.animations.some(ap => ap.hasSpine(filename));
	}

	createPlayer(element) {
		if (this.animations.length >= this.size) return null;
		const ap = new AnimationPlayer(this.pathPrefix);
		if (!ap.gl) return null;
		ap._cardElement = element;
		ap._pendingCardLoads = new Map();
		ap.onIdle = () => this.releasePlayer(ap);
		this.animations.push(ap);
		element._ap = ap;
		element.appendChild(ap.canvas);
		return ap;
	}

	releasePlayer(ap) {
		if (!ap || ap._cardReleased) return;
		ap._cardReleased = true;
		const element = ap._cardElement;
		if (element?._ap === ap) delete element._ap;
		const index = this.animations.indexOf(ap);
		if (index !== -1) this.animations.splice(index, 1);
		ap.destroy();
	}

	playOnPlayer(ap, element, animation, position) {
		const sprite = typeof animation === "string" ? { name: animation } : { ...animation };
		if (ap.hasSpine(sprite.name)) return ap.playSpine(sprite, position);
		const pending = ap._pendingCardLoads.get(sprite.name);
		if (pending) {
			pending.push({ sprite, position });
			return;
		}
		ap._pendingCardLoads.set(sprite.name, [{ sprite, position }]);
		const fileType = this.assetTypes.get(sprite.name) || (sprite.json ? "json" : "skel");
		ap.loadSpine(
			sprite.name,
			fileType,
			() => {
				const requests = ap._pendingCardLoads.get(sprite.name) || [];
				ap._pendingCardLoads.delete(sprite.name);
				if (ap._cardReleased || !element.isConnected) return this.releasePlayer(ap);
				ap.prepSpine(sprite.name);
				for (const request of requests) ap.playSpine(request.sprite, request.position);
			},
			() => {
				ap._pendingCardLoads.delete(sprite.name);
				if (!ap.running) this.releasePlayer(ap);
			}
		);
	}

	/**
	 * 在指定元素上播放骨骼动画
	 * @param {HTMLElement} element - 目标元素
	 * @param {string|Object} animation - 动画名称或配置
	 * @param {Object} [position] - 位置配置
	 */
	playSpineTo(element, animation, position) {
		if (!(element instanceof HTMLElement) || !animation) return;
		if (position?.parent) {
			position.parent = undefined;
		}

		// 复用已绑定的播放器
		if (element._ap?.canvas?.parentNode === element && this.animations.includes(element._ap)) {
			return this.playOnPlayer(element._ap, element, animation, position);
		}

		const ap = this.createPlayer(element);
		if (!ap) return console.error(`spine: ${this.name || ""} 可用动画播放组件不足`);
		return this.playOnPlayer(ap, element, animation, position);
	}
}
