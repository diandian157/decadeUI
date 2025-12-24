"use strict";

/**
 * 连线特效模块
 */

import { CONFIG } from "./config.js";

/** 绘制连线特效 */
export function drawLine(dots) {
	decadeUI.animate.add(
		function (source, target, e) {
			const ctx = e.context;
			ctx.shadowColor = "yellow";
			ctx.shadowBlur = 1;

			this.head = this.head || 0;
			this.tail = this.tail || -1;

			const speed = CONFIG.ANIM_SPEED * (e.deltaTime / CONFIG.FRAME_RATE);
			this.head = Math.min(this.head + speed, 1);

			if (this.head >= 1) this.tail += speed;
			if (this.tail > 1) return true;

			const tail = Math.max(0, this.tail);
			const lerp = decadeUI.get.lerp;

			e.drawLine(lerp(source.x, target.x, tail), lerp(source.y, target.y, tail), lerp(source.x, target.x, this.head), lerp(source.y, target.y, this.head), CONFIG.LINE_COLOR, CONFIG.LINE_WIDTH);
			return false;
		},
		true,
		{ x: dots[0], y: dots[1] },
		{ x: dots[2], y: dots[3] }
	);
}
