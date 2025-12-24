"use strict";

/**
 * 缓动函数模块
 */

/**
 * 三次贝塞尔缓动曲线
 */
export class CubicBezierEase {
	constructor(p1x, p1y, p2x, p2y) {
		this.cX = 3 * p1x;
		this.bX = 3 * (p2x - p1x) - this.cX;
		this.aX = 1 - this.cX - this.bX;
		this.cY = 3 * p1y;
		this.bY = 3 * (p2y - p1y) - this.cY;
		this.aY = 1 - this.cY - this.bY;
	}

	getX(t) {
		return t * (this.cX + t * (this.bX + t * this.aX));
	}

	getXDerivative(t) {
		return this.cX + t * (2 * this.bX + 3 * this.aX * t);
	}

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

// 默认缓动实例
let defaultEase = null;

/**
 * 默认缓动函数 (ease-out)
 */
export function ease(fraction) {
	if (!defaultEase) {
		defaultEase = new CubicBezierEase(0.25, 0.1, 0.25, 1);
	}
	return defaultEase.ease(fraction);
}
