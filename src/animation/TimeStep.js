"use strict";

/**
 * @fileoverview 时间步进器模块，提供动画属性的平滑过渡控制
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { ease } from "./easing.js";
import { lerp } from "./utils.js";

/**
 * 动画时间步进控制器类
 */
export class TimeStep {
	/**
	 * @param {Object} options - 配置选项
	 * @param {number|Array} options.start - 起始值
	 * @param {number|Array} options.end - 结束值
	 * @param {number} options.duration - 持续时长(ms)
	 */
	constructor({ start, end, duration }) {
		this.start = this.current = start;
		this.end = end;
		this.time = 0;
		this.percent = 0;
		this.duration = duration;
		this.completed = false;
	}

	/**
	 * 更新时间步进状态
	 * @param {number} delta - 时间增量(ms)
	 */
	update(delta) {
		this.time += delta;
		this.percent = ease(Math.min(this.time / this.duration, 1));

		const isArray = Array.isArray(this.start) || Array.isArray(this.end);
		const start = Array.isArray(this.start) ? this.start : [this.start, 0];
		const end = Array.isArray(this.end) ? this.end : [this.end, 0];

		this.current = isArray ? [lerp(start[0], end[0], this.percent), lerp(start[1], end[1], this.percent)] : lerp(start[0], end[0], this.percent);

		if (this.time >= this.duration) this.completed = true;
	}
}
