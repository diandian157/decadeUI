"use strict";

/**
 * @fileoverview 缓动函数模块，提供三次贝塞尔曲线缓动实现
 */

/**
 * 三次贝塞尔缓动曲线类
 */
export class CubicBezierEase {
	/**
	 * @param {number} p1x - 控制点1的X坐标
	 * @param {number} p1y - 控制点1的Y坐标
	 * @param {number} p2x - 控制点2的X坐标
	 * @param {number} p2y - 控制点2的Y坐标
	 */
	constructor(p1x, p1y, p2x, p2y) {
		this.cX = 3 * p1x;
		this.bX = 3 * (p2x - p1x) - this.cX;
		this.aX = 1 - this.cX - this.bX;
		this.cY = 3 * p1y;
		this.bY = 3 * (p2y - p1y) - this.cY;
		this.aY = 1 - this.cY - this.bY;
	}

	/**
	 * 获取X坐标值
	 * @param {number} t - 参数t
	 * @returns {number} X坐标
	 */
	getX(t) {
		return t * (this.cX + t * (this.bX + t * this.aX));
	}

	/**
	 * 获取X的导数值
	 * @param {number} t - 参数t
	 * @returns {number} X的导数
	 */
	getXDerivative(t) {
		return this.cX + t * (2 * this.bX + 3 * this.aX * t);
	}

	/**
	 * 计算缓动值
	 * @param {number} x - 输入值(0-1)
	 * @returns {number} 缓动后的值
	 */
	ease(x) {
		let t = x,
			prev;
		do {
			prev = t;
			t -= (this.getX(t) - x) / this.getXDerivative(t);
		} while (Math.abs(t - prev) > 1e-4);
		return t * (this.cY + t * (this.bY + t * this.aY));
	}
}

/** @type {CubicBezierEase|null} 默认缓动实例 */
let defaultEase = null;

/**
 * 默认缓动函数(ease-out)
 * @param {number} fraction - 进度值(0-1)
 * @returns {number} 缓动后的值
 */
export function ease(fraction) {
	if (!defaultEase) {
		defaultEase = new CubicBezierEase(0.25, 0.1, 0.25, 1);
	}
	return defaultEase.ease(fraction);
}
