/**
 * @fileoverview Canvas动画模块，提供基于requestAnimationFrame的动画系统
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建绘图上下文辅助对象
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {number} deltaTime - 帧间隔时间
 * @returns {Object} 绘图上下文辅助对象
 */
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

/**
 * 创建Canvas动画模块
 * @returns {Object} 动画模块对象
 */
export const createDecadeUIAnimateModule = () => ({
	/** @type {Array} 动画更新任务列表 */
	updates: [],
	/** @type {HTMLCanvasElement|null} Canvas元素 */
	canvas: null,
	/** @type {number|null} 动画帧ID */
	frameId: null,
	/** @type {number|null} 上一帧时间戳 */
	frameTime: null,

	/**
	 * 检查并初始化Canvas
	 * @returns {boolean} 是否初始化成功
	 */
	check() {
		if (!ui.arena) return false;
		if (!this.canvas) {
			this.canvas = ui.arena.appendChild(document.createElement("canvas"));
			this.canvas.id = "decadeUI-canvas-arena";
		}
		return true;
	},

	/**
	 * 添加动画更新任务
	 * @param {Function} updateFn - 更新函数
	 * @param {...*} initArgs - 初始化参数
	 */
	add(updateFn, ...initArgs) {
		if (typeof updateFn !== "function" || !this.check()) return;
		this.updates.push({
			update: updateFn,
			inits: initArgs.slice(1),
			id: decadeUI.getRandom(0, 100),
		});
		if (!this.frameId) this.frameId = requestAnimationFrame(this.update.bind(this));
	},

	/**
	 * 动画帧更新
	 */
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
