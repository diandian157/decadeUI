"use strict";

/**
 * 时间步进器模块
 */

import { ease } from "./easing.js";
import { lerp } from "./utils.js";

/**
 * 动画时间步进控制器
 */
export class TimeStep {
	constructor({ start, end, duration }) {
		this.start = this.current = start;
		this.end = end;
		this.time = 0;
		this.percent = 0;
		this.duration = duration;
		this.completed = false;
	}

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
