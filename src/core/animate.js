/**
 * Canvas动画模块
 */
import { ui } from "noname";

/** 创建绘图上下文辅助对象 */
function createDrawContext(canvas, deltaTime) {
	const ctx = canvas.getContext("2d");
	return {
		canvas,
		context: ctx,
		deltaTime,
		save: () => (ctx.save(), ctx),
		restore: () => (ctx.restore(), ctx),
		drawLine(x1, y1, x2, y2, color, lineWidth) {
			ctx.beginPath();
			if (color) ctx.strokeStyle = color;
			if (lineWidth) ctx.lineWidth = lineWidth;
			if (x2 == null || y2 == null) ctx.lineTo(x1, y1);
			else {
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
			}
			ctx.stroke();
		},
		drawRect(x, y, width, height, color, lineWidth) {
			ctx.beginPath();
			if (color) ctx.strokeStyle = color;
			if (lineWidth) ctx.lineWidth = lineWidth;
			ctx.rect(x, y, width, height);
			ctx.stroke();
		},
		fillRect(x, y, width, height, color) {
			if (color) ctx.fillStyle = color;
			ctx.fillRect(x, y, width, height);
		},
		drawText(text, font, color, x, y, align, baseline, stroke = false) {
			if (!text || x == null || y == null) return;
			if (font) ctx.font = font;
			if (align) ctx.textAlign = align;
			if (baseline) ctx.textBaseline = baseline;
			if (color) ctx[stroke ? "strokeStyle" : "fillStyle"] = color;
			ctx[stroke ? "strokeText" : "fillText"](text, x, y);
		},
		drawStrokeText(text, font, color, x, y, align, baseline) {
			this.drawText(text, font, color, x, y, align, baseline, true);
		},
	};
}

/** 创建Canvas动画模块 */
export const createDecadeUIAnimateModule = () => ({
	updates: [],
	canvas: null,
	frameId: null,
	frameTime: null,

	check() {
		if (!ui.arena) return false;
		if (!this.canvas) {
			this.canvas = ui.arena.appendChild(document.createElement("canvas"));
			this.canvas.id = "decadeUI-canvas-arena";
		}
		return true;
	},

	add(updateFn, ...initArgs) {
		if (typeof updateFn !== "function" || !this.check()) return;
		this.updates.push({
			update: updateFn,
			inits: initArgs.slice(1),
			id: decadeUI.getRandom(0, 100),
		});
		if (!this.frameId) this.frameId = requestAnimationFrame(this.update.bind(this));
	},

	update() {
		const now = performance.now();
		const delta = now - (this.frameTime ?? now);
		this.frameTime = now;
		const drawCtx = createDrawContext(this.canvas, delta);

		if (!decadeUI.dataset.animSizeUpdated) {
			decadeUI.dataset.animSizeUpdated = true;
			this.canvas.width = this.canvas.parentNode.offsetWidth;
			this.canvas.height = this.canvas.parentNode.offsetHeight;
		}
		this.canvas.height = this.canvas.height;

		for (let i = this.updates.length - 1; i >= 0; i--) {
			const task = this.updates[i];
			drawCtx.save();
			const done = task.update.apply(task, [...task.inits, drawCtx]);
			drawCtx.restore();
			if (done) this.updates.splice(i, 1);
		}

		if (this.updates.length > 0) {
			this.frameId = requestAnimationFrame(this.update.bind(this));
		} else {
			this.frameId = null;
			this.frameTime = null;
		}
	},
});
