"use strict";

/**
 * @fileoverview 动画播放节点模块，管理单个骨骼动画的状态、变换和时间步进
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { TimeStep } from "./TimeStep.js";
import { useNewDpr } from "./utils.js";

/**
 * 动画播放节点类
 */
export class APNode {
	/**
	 * @param {Object} [params={}] - 初始化参数
	 * @param {string} [params.name] - 节点名称
	 * @param {spine.Skeleton} [params.skeleton] - 骨骼对象
	 * @param {number|Array} [params.x] - X坐标
	 * @param {number|Array} [params.y] - Y坐标
	 * @param {number} [params.scale] - 缩放比例
	 * @param {number} [params.angle] - 旋转角度
	 * @param {number} [params.opacity] - 透明度
	 * @param {boolean} [params.loop] - 是否循环
	 * @param {string} [params.action] - 动画动作名
	 */
	constructor(params = {}) {
		// 基础属性
		this.id = undefined;
		this.name = params.name;
		this.skeleton = params.skeleton;

		// 变换属性
		this.x = params.x;
		this.y = params.y;
		this.width = params.width;
		this.height = params.height;
		this.angle = params.angle;
		this.scale = params.scale;
		this.opacity = params.opacity;
		this.flipX = params.flipX;
		this.flipY = params.flipY;

		// 裁剪属性
		this.clip = params.clip;
		this.hideSlots = params.hideSlots;
		this.clipSlots = params.clipSlots;
		this.disableMask = params.disableMask;

		// 渲染属性
		this.renderX = this.renderY = this.renderAngle = undefined;
		this.renderScale = this.renderOpacity = this.renderClip = undefined;
		this.mvp = new spine.webgl.Matrix4();

		// 动画属性
		this.action = params.action;
		this.loop = params.loop;
		this.loopCount = params.loopCount;
		this.speed = params.speed;
		this.completed = true;

		// 回调
		this.onupdate = params.onupdate;
		this.oncomplete = params.oncomplete;

		// 参考节点
		this.referNode = params.referNode;
		this.referFollow = params.referFollow;
		this.referBounds = undefined;

		// 时间步进映射
		this.timestepMap = {};
	}

	/**
	 * 渐变透明度
	 * @param {number} opacity - 目标透明度
	 * @param {number} duration - 过渡时长(ms)
	 * @returns {APNode} 当前节点
	 */
	fadeTo(opacity, duration) {
		if (opacity !== undefined) {
			this.updateTimeStep("opacity", this.opacity ?? 1, opacity, duration);
			this.opacity = opacity;
		}
		return this;
	}

	/**
	 * 移动到指定位置
	 * @param {number|Array} x - 目标X坐标
	 * @param {number|Array} y - 目标Y坐标
	 * @param {number} duration - 过渡时长(ms)
	 * @returns {APNode} 当前节点
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
	 * 缩放到指定大小
	 * @param {number} scale - 目标缩放比例
	 * @param {number} duration - 过渡时长(ms)
	 * @returns {APNode} 当前节点
	 */
	scaleTo(scale, duration) {
		if (scale !== undefined) {
			this.updateTimeStep("scale", this.scale ?? 1, scale, duration);
			this.scale = scale;
		}
		return this;
	}

	/**
	 * 旋转到指定角度
	 * @param {number} angle - 目标角度
	 * @param {number} duration - 过渡时长(ms)
	 * @returns {APNode} 当前节点
	 */
	rotateTo(angle, duration) {
		if (angle !== undefined) {
			this.updateTimeStep("angle", this.angle ?? 0, angle, duration);
			this.angle = angle;
		}
		return this;
	}

	/**
	 * 更新节点状态
	 * @param {Object} e - 事件参数
	 * @param {number} e.dpr - 设备像素比
	 * @param {number} e.delta - 时间增量
	 * @param {HTMLCanvasElement} e.canvas - 画布元素
	 */
	update(e) {
		const calc = (value, refer, dpr) => {
			return Array.isArray(value) ? value[0] * dpr + value[1] * refer : value * dpr;
		};

		const zoom = useNewDpr ? parseFloat(window.getComputedStyle(document.body).zoom) : 1;
		const dpr = e.dpr / zoom;
		const referSize = { width: e.canvas.width, height: e.canvas.height };
		const domNode = this.referNode instanceof HTMLElement ? this.referNode : undefined;

		// 计算参考节点边界
		if (domNode && (this.referFollow || !this.referBounds)) {
			this.referBounds = this._calcReferBounds(domNode, dpr);
			referSize.height = this.referBounds.height * dpr;
			referSize.width = this.referBounds.width * dpr;
		}

		const skeletonSize = this.skeleton.bounds.size;
		let renderX, renderY, renderScale, renderScaleX, renderScaleY;

		// 更新X位置
		const tsX = this.timestepMap.x;
		if (tsX && !tsX.completed) {
			tsX.update(e.delta);
			renderX = calc(tsX.current, referSize.width, dpr);
		} else if (this.x !== undefined) {
			renderX = calc(this.x, referSize.width, dpr);
		}

		// 更新Y位置
		const tsY = this.timestepMap.y;
		if (tsY && !tsY.completed) {
			tsY.update(e.delta);
			renderY = calc(tsY.current, referSize.height, dpr);
		} else if (this.y !== undefined) {
			renderY = calc(this.y, referSize.height, dpr);
		}

		// 计算尺寸缩放
		if (this.width !== undefined) renderScaleX = calc(this.width, referSize.width, dpr) / skeletonSize.x;
		if (this.height !== undefined) renderScaleY = calc(this.height, referSize.height, dpr) / skeletonSize.y;

		// 应用参考节点偏移
		if (domNode) {
			renderX = renderX !== undefined ? renderX + this.referBounds.x * dpr : (this.referBounds.x + this.referBounds.width / 2) * dpr;
			renderY = renderY !== undefined ? renderY + this.referBounds.y * dpr : (this.referBounds.y + this.referBounds.height / 2) * dpr;
		}

		// 构建MVP矩阵
		this.mvp.ortho2d(0, 0, e.canvas.width, e.canvas.height);
		this._applyTranslation(renderX, renderY);

		// 更新缩放
		const tsScale = this.timestepMap.scale;
		renderScale = tsScale && !tsScale.completed ? (tsScale.update(e.delta), tsScale.current) : (this.scale ?? 1);

		if (renderScaleX && !renderScaleY) renderScale *= renderScaleX;
		else if (!renderScaleX && renderScaleY) renderScale *= renderScaleY;
		else if (renderScaleX && renderScaleY) renderScale *= Math.min(renderScaleX, renderScaleY);
		else renderScale *= dpr * zoom;

		if (renderScale !== 1) this.mvp.scale(renderScale, renderScale, 0);

		// 更新角度
		const tsAngle = this.timestepMap.angle;
		this.renderAngle = tsAngle && !tsAngle.completed ? (tsAngle.update(e.delta), tsAngle.current) : this.angle;
		if (this.renderAngle) this.mvp.rotate(this.renderAngle, 0, 0, 1);

		// 更新透明度
		const tsOpacity = this.timestepMap.opacity;
		this.renderOpacity = tsOpacity && !tsOpacity.completed ? (tsOpacity.update(e.delta), tsOpacity.current) : this.opacity;

		// 保存渲染状态
		this.renderX = renderX;
		this.renderY = renderY;
		this.renderScale = renderScale;

		// 计算裁剪区域
		if (this.clip) {
			this.renderClip = {
				x: calc(this.clip.x, e.canvas.width, dpr),
				y: calc(this.clip.y, e.canvas.height, dpr),
				width: calc(this.clip.width, e.canvas.width, dpr),
				height: calc(this.clip.height, e.canvas.height, dpr),
			};
		}

		if (this.onupdate) this.onupdate();
	}

	/**
	 * 计算参考节点边界
	 * @param {HTMLElement} domNode - DOM节点
	 * @param {number} dpr - 设备像素比
	 * @returns {Object} 边界信息
	 * @private
	 */
	_calcReferBounds(domNode, dpr) {
		// 检测getBoundingClientRect是否被皮肤切换扩展修改
		// 皮肤切换扩展在Chrome 128+会修改getBoundingClientRect，返回值已除以documentZoom
		const isNativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect.toString().includes("[native code]");

		let rect = domNode.getBoundingClientRect();

		if (useNewDpr) {
			if (isNativeGetBoundingClientRect) {
				// 原生函数，需要手动处理zoom
				let zoom = 1,
					ele = domNode;
				while (ele && ele !== document.body) {
					zoom *= parseFloat(window.getComputedStyle(ele).zoom);
					ele = ele.parentElement;
				}
				rect = new DOMRect(rect.x / zoom, rect.y / zoom, rect.width / zoom, rect.height / zoom);
			} else {
				// getBoundingClientRect被修改，返回值已除以documentZoom
				// 需要乘回documentZoom以保持与原生行为一致
				const documentZoom = window.documentZoom || 1;
				rect = new DOMRect(rect.x * documentZoom, rect.y * documentZoom, rect.width * documentZoom, rect.height * documentZoom);
				// 然后按原逻辑处理父元素zoom
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
	 * 应用位移变换
	 * @param {number} [x] - X坐标
	 * @param {number} [y] - Y坐标
	 * @private
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
	 * 设置动画动作
	 * @param {string} action - 动作名称
	 * @param {number} [transition] - 过渡时长(ms)
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
	 * 重置为默认动作
	 * @param {number} [transition] - 过渡时长(ms)
	 */
	resetAction(transition) {
		if (!this.skeleton || this.skeleton.node !== this) {
			return console.error("resetAction: 节点失去关联");
		}
		const entry = this.skeleton.state.setAnimation(0, this.skeleton.defaultAction, this.loop);
		entry.mixDuration = transition === undefined ? 0.5 : transition / 1000;
	}

	/**
	 * 完成回调处理
	 */
	complete() {
		if (!this.oncomplete) return;
		if (typeof this.oncomplete === "string") {
			const code = this.oncomplete;
			const a = code.indexOf("{"),
				b = code.lastIndexOf("}");
			if (a === -1 || b === -1) {
				this.oncomplete = undefined;
				return console.error(this.name + " 的oncomplete函数语法错误");
			}
			this.oncomplete = new Function(code.substring(a + 1, b));
		}
		if (typeof this.oncomplete === "function") this.oncomplete();
	}

	/**
	 * 更新时间步进
	 * @param {string} key - 属性键名
	 * @param {number|Array} start - 起始值
	 * @param {number|Array} end - 结束值
	 * @param {number} duration - 持续时长(ms)
	 * @returns {TimeStep|undefined} 时间步进对象
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
