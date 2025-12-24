import { lib, ui } from "noname";

const SVG_NS = "http://www.w3.org/2000/svg";

// SVG裁剪路径配置
const CLIP_PATHS = [
	{ id: "solo-clip", d: "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z" },
	{ id: "duol-clip", d: "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z" },
	{ id: "duor-clip", d: "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z" },
	{ id: "dskin-clip", d: "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z" },
];

/**
 * 初始化十周年UI环境
 * @param {Object} ctx - 上下文对象
 * @returns {ResizeSensor} body尺寸监听器
 */
export const initializeDecadeUIEnvironment = ctx => {
	// 创建body尺寸监听器
	const sensorNode = ctx.element.create("sensor", document.body);
	sensorNode.id = "decadeUI-body-sensor";
	const bodySensor = new ctx.ResizeSensor(sensorNode);

	// 初始化SVG裁剪路径
	initSvgClipPaths();

	// 监听点击事件，更新活动元素
	document.addEventListener("click", e => dui.set.activeElement(e.target), true);

	// 设置手牌提示高度
	const handTipHeight = lib.config["extension_十周年UI_handTipHeight"] || "20";
	document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${handTipHeight}% + 10px)`);

	// 修补全局方法
	patchGlobalMethods(ctx);

	return bodySensor;
};

/** 初始化SVG裁剪路径 */
function initSvgClipPaths() {
	const svg = document.body.appendChild(document.createElementNS(SVG_NS, "svg"));
	const defs = svg.appendChild(document.createElementNS(SVG_NS, "defs"));

	CLIP_PATHS.forEach(({ id, d }) => {
		const clipPath = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
		clipPath.id = id;
		clipPath.setAttribute("clipPathUnits", "objectBoundingBox");
		clipPath.appendChild(document.createElementNS(SVG_NS, "path")).setAttribute("d", d);
	});
}

/** 修补全局方法，增加容错处理 */
function patchGlobalMethods(ctx) {
	if (!window.get) return;

	// 修补 cardsetion 方法
	if (typeof window.get.cardsetion === "function") {
		const original = window.get.cardsetion;
		window.get.cardsetion = (...args) => {
			try {
				return original.apply(ctx, args);
			} catch (e) {
				if (e?.message?.includes("indexOf")) return "";
				throw e;
			}
		};
	}

	// 修补 getPlayerIdentity 方法
	if (typeof window.get.getPlayerIdentity === "function") {
		const original = window.get.getPlayerIdentity;
		window.get.getPlayerIdentity = (player, identity, chinese, isMark) => {
			identity = identity || player?.identity || "";
			if (typeof identity !== "string") identity = "";
			if (player?.special_identity != null && typeof player.special_identity !== "string") {
				player.special_identity = "";
			}
			return original.call(ctx, player, identity, chinese, isMark);
		};
	}
}

// ==================== 对话框模块 ====================

/** 事件监听器管理器 */
const createListenerManager = dialog => ({
	_dialog: dialog,
	_list: [],

	/** 添加事件监听 */
	add(element, event, handler, useCapture) {
		if (!(element instanceof HTMLElement) || !event || typeof handler !== "function") {
			return console.error("Invalid arguments for listener");
		}
		this._list.push([element, event, handler]);
		element.addEventListener(event, handler, useCapture);
	},

	/** 移除事件监听（支持部分匹配） */
	remove(element, event, handler) {
		for (let i = this._list.length - 1; i >= 0; i--) {
			const [el, evt, fn] = this._list[i];
			const match = (!element || el === element) && (!event || evt === event) && (!handler || fn === handler);
			if (match) {
				el.removeEventListener(evt, fn);
				this._list.splice(i, 1);
			}
		}
	},

	/** 清除所有事件监听 */
	clear() {
		this._list.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
		this._list.length = 0;
	},
});

/** 解析时间字符串为毫秒 */
function parseDuration(duration) {
	if (typeof duration === "number") return duration;
	if (duration.includes("ms")) return parseInt(duration);
	if (duration.includes("s")) return parseFloat(duration) * 1000;
	return parseInt(duration);
}

/** 创建对话框模块 */
export const createDecadeUIDialogModule = () => ({
	/** 创建对话框元素 */
	create(className, parentNode, tagName = "div") {
		const element = document.createElement(tagName);

		// 复制对话框方法（排除listens）
		Object.keys(decadeUI.dialog).forEach(key => {
			if (decadeUI.dialog[key] && key !== "listens") {
				element[key] = decadeUI.dialog[key];
			}
		});

		element.listens = createListenerManager(element);
		if (className) element.className = className;
		if (parentNode) parentNode.appendChild(element);

		return element;
	},

	show() {
		if (this === decadeUI.dialog) return;
		this.classList.remove("hidden");
	},

	hide() {
		if (this === decadeUI.dialog) return;
		this.classList.add("hidden");
	},

	/** CSS过渡动画 */
	animate(property, duration, toValues, fromValues) {
		if (this === decadeUI.dialog || !property || !duration || !toValues) return;

		const props = property.replace(/\s/g, "").split(",");
		const ms = parseDuration(duration);
		if (isNaN(ms)) return console.error("Invalid duration");

		// 设置初始值
		if (fromValues) {
			props.forEach((prop, i) => this.style.setProperty(prop, fromValues[i]));
		}

		// 保存并应用过渡
		const { transitionDuration, transitionProperty } = this.style;
		this.style.transitionDuration = `${ms}ms`;
		this.style.transitionProperty = property;
		ui.refresh(this);

		// 设置目标值
		props.forEach((prop, i) => this.style.setProperty(prop, toValues[i]));

		// 恢复原始设置
		setTimeout(() => {
			this.style.transitionDuration = transitionDuration;
			this.style.transitionProperty = transitionProperty;
		}, ms);
	},

	/** 关闭并移除对话框 */
	close(delay, fadeOut) {
		if (this === decadeUI.dialog || !this.parentNode) return;

		this.listens.clear();

		if (fadeOut && delay) {
			this.animate("opacity", delay, [0]);
		}

		if (delay) {
			const ms = typeof delay === "number" ? delay : parseInt(delay);
			setTimeout(() => this.parentNode?.removeChild(this), ms);
		} else {
			this.parentNode.removeChild(this);
		}
	},

	listens: createListenerManager(null),
});

// ==================== 动画模块 ====================

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
			if (x2 == null || y2 == null) {
				ctx.lineTo(x1, y1);
			} else {
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

	/** 检查并初始化Canvas */
	check() {
		if (!ui.arena) return false;
		if (!this.canvas) {
			this.canvas = ui.arena.appendChild(document.createElement("canvas"));
			this.canvas.id = "decadeUI-canvas-arena";
		}
		return true;
	},

	/** 添加动画任务 */
	add(updateFn, ...initArgs) {
		if (typeof updateFn !== "function" || !this.check()) return;

		this.updates.push({
			update: updateFn,
			inits: initArgs.slice(1),
			id: decadeUI.getRandom(0, 100),
		});

		if (!this.frameId) {
			this.frameId = requestAnimationFrame(this.update.bind(this));
		}
	},

	/** 动画帧更新 */
	update() {
		const now = performance.now();
		const delta = now - (this.frameTime ?? now);
		this.frameTime = now;

		const drawCtx = createDrawContext(this.canvas, delta);

		// 首次更新Canvas尺寸
		if (!decadeUI.dataset.animSizeUpdated) {
			decadeUI.dataset.animSizeUpdated = true;
			this.canvas.width = this.canvas.parentNode.offsetWidth;
			this.canvas.height = this.canvas.parentNode.offsetHeight;
		}
		this.canvas.height = this.canvas.height; // 清空画布

		// 执行所有动画任务
		for (let i = this.updates.length - 1; i >= 0; i--) {
			const task = this.updates[i];
			drawCtx.save();
			const done = task.update.apply(task, [...task.inits, drawCtx]);
			drawCtx.restore();
			if (done) this.updates.splice(i, 1);
		}

		// 继续或停止动画循环
		if (this.updates.length > 0) {
			this.frameId = requestAnimationFrame(this.update.bind(this));
		} else {
			this.frameId = null;
			this.frameTime = null;
		}
	},
});

// ==================== 尺寸监听器 ====================

/** 创建ResizeSensor类 - 基于滚动事件监听元素尺寸变化 */
export const createResizeSensorClass = () => {
	class ResizeSensor {
		constructor(element) {
			this.element = element;
			this.width = element.clientWidth || 1;
			this.height = element.clientHeight || 1;
			this.maxSize = 10000;
			this.events = [];
			this.initScrollElements();
		}

		/** 初始化滚动监听元素 */
		initScrollElements() {
			const containerStyle = "position:absolute;top:0;bottom:0;left:0;right:0;z-index:-10000;overflow:hidden;visibility:hidden;transition:all 0s;";
			const childStyle = "transition:all 0s!important;animation:none!important;";

			this.expand = this.createContainer(containerStyle);
			this.shrink = this.createContainer(containerStyle);

			// expand子元素 - 超大尺寸
			const expandChild = document.createElement("div");
			expandChild.style.cssText = childStyle;
			expandChild.style.width = this.maxSize * this.width + "px";
			expandChild.style.height = this.maxSize * this.height + "px";

			// shrink子元素 - 250%尺寸
			const shrinkChild = document.createElement("div");
			shrinkChild.style.cssText = childStyle;
			shrinkChild.style.width = "250%";
			shrinkChild.style.height = "250%";

			this.expand.appendChild(expandChild);
			this.shrink.appendChild(shrinkChild);
			this.element.appendChild(this.expand);
			this.element.appendChild(this.shrink);

			// 确保父元素有定位
			if (this.expand.offsetParent !== this.element) {
				this.element.style.position = "relative";
			}

			this.resetScroll();
			this.onscroll = this.handleScroll.bind(this);
			this.expand.addEventListener("scroll", this.onscroll);
			this.shrink.addEventListener("scroll", this.onscroll);
		}

		createContainer(style) {
			const div = document.createElement("div");
			div.style.cssText = style;
			return div;
		}

		resetScroll() {
			const maxW = this.maxSize * this.width;
			const maxH = this.maxSize * this.height;
			this.expand.scrollTop = this.shrink.scrollTop = maxH;
			this.expand.scrollLeft = this.shrink.scrollLeft = maxW;
		}

		handleScroll() {
			const w = this.element.clientWidth || 1;
			const h = this.element.clientHeight || 1;

			if (w !== this.width || h !== this.height) {
				this.width = w;
				this.height = h;
				this.dispatchEvent();
			}
			this.resetScroll();
		}

		addListener(callback, capture = true) {
			this.events.push({ callback, capture });
		}

		dispatchEvent() {
			let hasDeferred = false;

			this.events.forEach(evt => {
				if (evt.capture) {
					evt.callback();
				} else {
					hasDeferred = true;
				}
			});

			if (hasDeferred) {
				requestAnimationFrame(() => this.dispatchDeferredEvents());
			}
		}

		dispatchDeferredEvents() {
			this.events.forEach(evt => {
				if (!evt.capture) evt.callback();
			});
		}

		close() {
			this.expand.removeEventListener("scroll", this.onscroll);
			this.shrink.removeEventListener("scroll", this.onscroll);
			if (this.element) {
				this.element.removeChild(this.expand);
				this.element.removeChild(this.shrink);
			}
			this.events = null;
		}
	}

	return ResizeSensor;
};
