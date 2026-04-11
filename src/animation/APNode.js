"use strict";

/**
 * @fileoverview 动画播放节点模块 - 管理单个 Spine 骨骼动画的状态、变换和时间步进
 * @description 提供动画节点的位置、缩放、旋转、透明度等属性的动画过渡能力
 */
import { _status } from "noname";
import { TimeStep } from "./TimeStep.js";
import { useNewDpr } from "./utils.js";

/**
 * 动画播放节点类 - 表示一个可播放的 Spine 骨骼动画实例
 * @class
 * @description 封装了动画的位置、缩放、旋转、透明度等属性，支持平滑过渡动画
 */
export class APNode {
	/**
	 * 创建动画播放节点实例
	 * @param {Object} [params={}] - 初始化参数对象
	 * @param {string} [params.name] - 节点名称，用于标识和调试
	 * @param {spine.Skeleton} [params.skeleton] - Spine 骨骼对象
	 * @param {number|number[]} [params.x] - X 坐标，可以是数值或 [偏移量, 比例] 数组
	 * @param {number|number[]} [params.y] - Y 坐标，可以是数值或 [偏移量, 比例] 数组
	 * @param {number|number[]} [params.width] - 宽度，可以是数值或 [偏移量, 比例] 数组
	 * @param {number|number[]} [params.height] - 高度，可以是数值或 [偏移量, 比例] 数组
	 * @param {number} [params.scale] - 缩放比例（1 为原始大小）
	 * @param {number} [params.angle] - 旋转角度（度数）
	 * @param {number} [params.opacity] - 透明度（0-1 之间）
	 * @param {boolean} [params.flipX] - 是否水平翻转
	 * @param {boolean} [params.flipY] - 是否垂直翻转
	 * @param {boolean} [params.loop] - 是否循环播放动画
	 * @param {number} [params.loopCount] - 循环播放次数
	 * @param {number} [params.speed] - 播放速度倍率
	 * @param {string} [params.action] - 要播放的动画动作名称
	 * @param {Object} [params.clip] - 裁剪区域配置
	 * @param {string[]} [params.hideSlots] - 要隐藏的插槽名称数组
	 * @param {string[]} [params.clipSlots] - 要裁剪的插槽名称数组
	 * @param {boolean} [params.disableMask] - 是否禁用遮罩
	 * @param {boolean} [params.alpha] - 是否使用预乘 Alpha
	 * @param {boolean} [params.unpackPremultipliedAlpha] - 是否解包预乘 Alpha 通道
	 * @param {Function} [params.onupdate] - 每帧更新时的回调函数
	 * @param {Function} [params.oncomplete] - 动画播放完成时的回调函数
	 * @param {HTMLElement} [params.referNode] - 参考 DOM 节点，用于相对定位
	 * @param {boolean} [params.referFollow] - 是否跟随参考节点移动
	 */
	constructor(params = {}) {
		/** @type {number|undefined} 节点的唯一标识 */
		this.id = undefined;

		/** @type {string} 节点名称 */
		this.name = params.name;

		/** @type {spine.Skeleton} Spine 骨骼对象 */
		this.skeleton = params.skeleton;

		/** @type {number|number[]} X 坐标位置 */
		this.x = params.x;

		/** @type {number|number[]} Y 坐标位置 */
		this.y = params.y;

		/** @type {number|number[]} 节点宽度 */
		this.width = params.width;

		/** @type {number|number[]} 节点高度 */
		this.height = params.height;

		/** @type {number} 旋转角度 */
		this.angle = params.angle;

		/** @type {number} 缩放比例 */
		this.scale = params.scale;

		/** @type {number} 透明度 */
		this.opacity = params.opacity;

		/** @type {boolean} 是否水平翻转 */
		this.flipX = params.flipX;

		/** @type {boolean} 是否垂直翻转 */
		this.flipY = params.flipY;

		/** @type {Object} 裁剪区域配置 */
		this.clip = params.clip;

		/** @type {string[]} 要隐藏的插槽列表 */
		this.hideSlots = params.hideSlots;

		/** @type {string[]} 要裁剪的插槽列表 */
		this.clipSlots = params.clipSlots;

		/** @type {boolean} 是否禁用遮罩 */
		this.disableMask = params.disableMask;

		/** @type {boolean} 是否使用预乘 Alpha */
		this.premultipliedAlpha = params.alpha;

		/** @type {boolean} 是否解包预乘 Alpha 通道 */
		this.unpackPremultipliedAlpha = !!params.unpackPremultipliedAlpha;

		/** @type {number|undefined} 渲染时的 X 坐标 */
		this.renderX = undefined;

		/** @type {number|undefined} 渲染时的 Y 坐标 */
		this.renderY = undefined;

		/** @type {number|undefined} 渲染时的旋转角度 */
		this.renderAngle = undefined;

		/** @type {number|undefined} 渲染时的缩放比例 */
		this.renderScale = undefined;

		/** @type {number|undefined} 渲染时的透明度 */
		this.renderOpacity = undefined;

		/** @type {Object|undefined} 渲染时的裁剪区域 */
		this.renderClip = undefined;

		/** @type {spine.webgl.Matrix4} MVP 变换矩阵 */
		this.mvp = new spine.webgl.Matrix4();

		/** @type {string} 当前播放的动画动作名称 */
		this.action = params.action;

		/** @type {boolean} 是否循环播放 */
		this.loop = params.loop;

		/** @type {number} 循环播放次数 */
		this.loopCount = params.loopCount;

		/** @type {number} 播放速度倍率 */
		this.speed = params.speed;

		/** @type {boolean} 动画是否已完成 */
		this.completed = true;

		/** @type {Function} 每帧更新回调 */
		this.onupdate = params.onupdate;

		/** @type {Function|string} 动画完成回调 */
		this.oncomplete = params.oncomplete;

		/** @type {HTMLElement} 参考 DOM 节点 */
		this.referNode = params.referNode;

		/** @type {boolean} 是否跟随参考节点 */
		this.referFollow = params.referFollow;

		/** @type {Object|undefined} 参考节点的边界信息 */
		this.referBounds = undefined;

		/** @type {Object.<string, TimeStep>} 属性时间步进映射表 */
		this.timestepMap = {};
	}

	/**
	 * 平滑过渡到目标透明度
	 * @param {number} opacity - 目标透明度值（0-1 之间，0 为完全透明，1 为完全不透明）
	 * @param {number} duration - 过渡动画时长（毫秒）
	 * @returns {APNode} 返回当前节点实例，支持链式调用
	 * @example
	 * node.fadeTo(0.5, 1000); // 在 1 秒内淡化到 50% 透明度
	 */
	fadeTo(opacity, duration) {
		if (opacity !== undefined) {
			this.updateTimeStep("opacity", this.opacity ?? 1, opacity, duration);
			this.opacity = opacity;
		}
		return this;
	}

	/**
	 * 平滑移动到目标位置
	 * @param {number|number[]} x - 目标 X 坐标，可以是数值或 [偏移量, 比例] 数组
	 * @param {number|number[]} y - 目标 Y 坐标，可以是数值或 [偏移量, 比例] 数组
	 * @param {number} duration - 过渡动画时长（毫秒）
	 * @returns {APNode} 返回当前节点实例，支持链式调用
	 * @example
	 * node.moveTo(100, 200, 500); // 在 0.5 秒内移动到 (100, 200)
	 * node.moveTo([0, 0.5], [0, 0.5], 500); // 移动到画布中心
	 */
	moveTo(x, y, duration) {
		if (x !== undefined) {
			this.updateTimeStep("x", this.x ?? [0, 0.5], x, duration);
			this.x = x;
		}
		if (y !== undefined) {
			this.updateTimeStep("y", this.y ?? [0, 0.5], y, duration);
			this.y = y;
		}
		return this;
	}

	/**
	 * 平滑缩放到目标大小
	 * @param {number} scale - 目标缩放比例（1 为原始大小，2 为放大两倍，0.5 为缩小一半）
	 * @param {number} duration - 过渡动画时长（毫秒）
	 * @returns {APNode} 返回当前节点实例，支持链式调用
	 * @example
	 * node.scaleTo(1.5, 800); // 在 0.8 秒内放大到 1.5 倍
	 */
	scaleTo(scale, duration) {
		if (scale !== undefined) {
			this.updateTimeStep("scale", this.scale ?? 1, scale, duration);
			this.scale = scale;
		}
		return this;
	}

	/**
	 * 平滑旋转到目标角度
	 * @param {number} angle - 目标旋转角度（度数，正值为顺时针旋转）
	 * @param {number} duration - 过渡动画时长（毫秒）
	 * @returns {APNode} 返回当前节点实例，支持链式调用
	 * @example
	 * node.rotateTo(90, 1000); // 在 1 秒内旋转到 90 度
	 */
	rotateTo(angle, duration) {
		if (angle !== undefined) {
			this.updateTimeStep("angle", this.angle ?? 0, angle, duration);
			this.angle = angle;
		}
		return this;
	}

	/**
	 * 更新节点的渲染状态（每帧调用）
	 * @param {Object} e - 更新事件参数对象
	 * @param {number} e.dpr - 设备像素比，用于高清屏适配
	 * @param {number} e.delta - 距离上一帧的时间增量（毫秒）
	 * @param {HTMLCanvasElement} e.canvas - 渲染目标画布元素
	 * @description 计算节点的最终渲染位置、缩放、旋转等属性，并更新 MVP 变换矩阵
	 */
	update(e) {
		const calc = (value, refer) => {
			return Array.isArray(value) ? value[0] + value[1] * refer : value;
		};

		const zoom = useNewDpr ? parseFloat(window.getComputedStyle(document.body).zoom) : 1;
		const dpr = e.dpr / zoom;
		const referSize = { width: e.canvas.width, height: e.canvas.height };
		const domNode = this.referNode instanceof HTMLElement ? this.referNode : undefined;

		if (domNode) {
			if (this.referFollow || !this.referBounds) {
				this.referBounds = this._calcReferBounds(domNode);
			}
			referSize.height = this.referBounds.height * dpr;
			referSize.width = this.referBounds.width * dpr;
		}

		const skeletonSize = this.skeleton.bounds.size;
		let renderX, renderY, renderScale, renderScaleX, renderScaleY;

		const tsX = this.timestepMap.x;
		if (tsX && !tsX.completed) {
			tsX.update(e.delta);
			renderX = calc(tsX.current, referSize.width);
		} else if (this.x !== undefined) {
			renderX = calc(this.x, referSize.width);
		}

		const tsY = this.timestepMap.y;
		if (tsY && !tsY.completed) {
			tsY.update(e.delta);
			renderY = calc(tsY.current, referSize.height);
		} else if (this.y !== undefined) {
			renderY = calc(this.y, referSize.height);
		}

		if (this.width !== undefined) renderScaleX = calc(this.width, referSize.width) / skeletonSize.x;
		if (this.height !== undefined) renderScaleY = calc(this.height, referSize.height) / skeletonSize.y;

		if (domNode) {
			renderX = renderX !== undefined ? renderX + this.referBounds.x * dpr : (this.referBounds.x + this.referBounds.width / 2) * dpr;
			renderY = renderY !== undefined ? renderY + this.referBounds.y * dpr : (this.referBounds.y + this.referBounds.height / 2) * dpr;
		}

		this.mvp.ortho2d(0, 0, e.canvas.width, e.canvas.height);
		this._applyTranslation(renderX, renderY);

		const tsScale = this.timestepMap.scale;
		renderScale = tsScale && !tsScale.completed ? (tsScale.update(e.delta), tsScale.current) : (this.scale ?? 1);

		if (renderScaleX && !renderScaleY) renderScale *= renderScaleX;
		else if (!renderScaleX && renderScaleY) renderScale *= renderScaleY;
		else if (renderScaleX && renderScaleY) renderScale *= Math.min(renderScaleX, renderScaleY);
		else renderScale *= dpr * zoom;

		if (renderScale !== 1) this.mvp.scale(renderScale, renderScale, 0);

		const tsAngle = this.timestepMap.angle;
		this.renderAngle = tsAngle && !tsAngle.completed ? (tsAngle.update(e.delta), tsAngle.current) : this.angle;
		if (this.renderAngle) this.mvp.rotate(this.renderAngle, 0, 0, 1);

		const tsOpacity = this.timestepMap.opacity;
		this.renderOpacity = tsOpacity && !tsOpacity.completed ? (tsOpacity.update(e.delta), tsOpacity.current) : this.opacity;

		this.renderX = renderX;
		this.renderY = renderY;
		this.renderScale = renderScale;

		if (this.clip) {
			this.renderClip = {
				x: calc(this.clip.x, e.canvas.width),
				y: calc(this.clip.y, e.canvas.height),
				width: calc(this.clip.width, e.canvas.width),
				height: calc(this.clip.height, e.canvas.height),
			};
		}

		if (this.onupdate) this.onupdate();
	}

	/**
	 * 计算参考 DOM 节点的边界信息
	 * @private
	 * @param {HTMLElement} domNode - 参考的 DOM 节点
	 * @returns {Object} 边界信息对象，包含 x, y, width, height 属性
	 * @description 处理 zoom 属性和浏览器扩展对 getBoundingClientRect 的影响，确保坐标计算准确
	 */
	_calcReferBounds(domNode) {
		const isNativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect.toString().includes("[native code]");

		let rect = domNode.getBoundingClientRect();

		if (useNewDpr) {
			if (isNativeGetBoundingClientRect) {
				let zoom = 1,
					ele = domNode;
				while (ele && ele !== document.body) {
					zoom *= parseFloat(window.getComputedStyle(ele).zoom);
					ele = ele.parentElement;
				}
				rect = new DOMRect(rect.x / zoom, rect.y / zoom, rect.width / zoom, rect.height / zoom);
			} else {
				const documentZoom = window.documentZoom || 1;
				rect = new DOMRect(rect.x * documentZoom, rect.y * documentZoom, rect.width * documentZoom, rect.height * documentZoom);
				let zoom = 1,
					ele = domNode;
				while (ele && ele !== document.body) {
					zoom *= parseFloat(window.getComputedStyle(ele).zoom);
					ele = ele.parentElement;
				}
				rect = new DOMRect(rect.x / zoom, rect.y / zoom, rect.width / zoom, rect.height / zoom);
			}
		}

		const bodyHeight = decadeUI.get.bodySize().height * (useNewDpr ? window.documentZoom : 1);
		return {
			x: rect.left,
			y: bodyHeight - rect.bottom,
			width: rect.width,
			height: rect.height,
		};
	}

	/**
	 * 应用位移变换到 MVP 矩阵
	 * @private
	 * @param {number} [x] - X 坐标偏移量
	 * @param {number} [y] - Y 坐标偏移量
	 * @description 根据提供的坐标参数更新变换矩阵的位移部分
	 */
	_applyTranslation(x, y) {
		if (x !== undefined && y === undefined) {
			this.mvp.translate(x, 0, 0);
			this.mvp.setY(0);
		} else if (x === undefined && y !== undefined) {
			this.mvp.translate(0, y, 0);
			this.mvp.setX(0);
		} else if (x !== undefined && y !== undefined) {
			this.mvp.translate(x, y, 0);
		} else {
			this.mvp.setPos2D(0, 0);
		}
	}

	/**
	 * 切换到指定的动画动作
	 * @param {string} action - 要播放的动画动作名称
	 * @param {number} [transition=500] - 动作切换的过渡时长（毫秒），默认 500ms
	 * @description 平滑切换到新的动画动作，如果动作不存在会输出错误信息
	 */
	setAction(action, transition) {
		if (!this.skeleton || this.skeleton.node !== this) {
			return console.error("setAction: 节点失去关联");
		}
		if (this.skeleton.data.findAnimation(action) === null) {
			return console.error("setAction: 未找到对应骨骼动作");
		}
		const entry = this.skeleton.state.setAnimation(0, action, this.loop);
		entry.mixDuration = transition === undefined ? 0.5 : transition / 1000;
	}

	/**
	 * 重置为默认动画动作
	 * @param {number} [transition=500] - 动作切换的过渡时长（毫秒），默认 500ms
	 * @description 将动画切换回骨骼的默认动作
	 */
	resetAction(transition) {
		if (!this.skeleton || this.skeleton.node !== this) {
			return console.error("resetAction: 节点失去关联");
		}
		const entry = this.skeleton.state.setAnimation(0, this.skeleton.defaultAction, this.loop);
		entry.mixDuration = transition === undefined ? 0.5 : transition / 1000;
	}

	/**
	 * 处理动画播放完成的回调
	 * @description 当动画播放完成时调用，支持字符串形式的函数代码和函数对象
	 */
	complete() {
		if (!this.oncomplete) return;
		if (typeof this.oncomplete === "string") {
			const code = this.oncomplete;
			const a = code.indexOf("{"),
				b = code.lastIndexOf("}");
			if (a === -1 || b === -1) {
				this.oncomplete = undefined;
				return console.error(this.name + " 的 oncomplete 函数语法错误");
			}
			this.oncomplete = new Function(code.substring(a + 1, b));
		}
		if (typeof this.oncomplete === "function") this.oncomplete();
	}

	/**
	 * 更新或创建属性的时间步进动画
	 * @param {string} key - 要动画的属性名称（如 'x', 'y', 'scale', 'opacity' 等）
	 * @param {number|number[]} start - 动画起始值
	 * @param {number|number[]} end - 动画结束值
	 * @param {number} duration - 动画持续时长（毫秒）
	 * @returns {TimeStep|undefined} 返回时间步进对象，如果 duration 为 0 则返回 undefined
	 * @description 为指定属性创建平滑过渡动画，如果该属性已有动画则更新其参数
	 */
	updateTimeStep(key, start, end, duration) {
		if (!duration) return;
		let ts = this.timestepMap[key];
		if (ts) {
			ts.start = ts.completed ? start : ts.current;
			ts.end = end;
			ts.time = ts.percent = 0;
			ts.completed = false;
			ts.duration = duration;
		} else {
			ts = new TimeStep({ start, end, duration });
			this.timestepMap[key] = ts;
		}
		return ts;
	}
}
