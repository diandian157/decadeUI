"use strict";

/**
 * @fileoverview Spine 动画播放器核心渲染引擎 - 负责 WebGL 渲染和骨骼动画管理
 * @description 提供完整的 Spine 骨骼动画加载、播放、渲染功能，支持多个动画同时播放
 */
import { _status } from "noname";
import { APNode } from "./APNode.js";

/**
 * Spine 动画播放器类 - 基于 WebGL 的高性能骨骼动画渲染器
 * @class
 * @description 封装了 Spine 运行时的完整功能，包括资源加载、动画播放、渲染循环等
 */
export class AnimationPlayer {
	/**
	 * 创建动画播放器实例
	 * @param {string} pathPrefix - 动画资源文件的路径前缀
	 * @param {HTMLElement|string} parentNode - 父 DOM 节点或 "offscreen" 表示离屏渲染
	 * @param {string|HTMLCanvasElement} [elementId] - Canvas 元素 ID 或离屏 Canvas 对象
	 */
	constructor(pathPrefix, parentNode, elementId) {
		if (!window.spine) {
			console.error("spine 未定义.");
			this.spine = { assets: {} };
			this.gl = null;
			this.check();
			return;
		}

		let canvas;
		if (parentNode === "offscreen") {
			canvas = elementId;
			this.offscreen = true;
		} else {
			canvas = document.createElement("canvas");
			canvas.className = "animation-player";
			if (elementId) canvas.id = elementId;
			if (parentNode) parentNode.appendChild(canvas);
		}

		const config = { alpha: true };
		let gl = canvas.getContext("webgl2", config);
		if (!gl) {
			gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
		} else {
			gl.isWebgl2 = true;
		}

		if (gl) {
			this.spine = {
				shader: spine.webgl.Shader.newTwoColoredTextured(gl),
				batcher: new spine.webgl.PolygonBatcher(gl),
				skeletonRenderer: new spine.webgl.SkeletonRenderer(gl),
				assetManager: new spine.webgl.AssetManager(gl, pathPrefix),
				assets: {},
				skeletons: [],
			};
		} else {
			this.spine = { assets: {} };
			console.error("当前设备不支持 WebGL.");
		}

		this.gl = gl;
		this.canvas = this.$canvas = canvas;
		this.frameTime = undefined;
		this.running = false;
		this.resized = false;
		this.dpr = 1;
		this.nodes = [];
		this.BUILT_ID = 0;
		this._dprAdaptive = false;
		this.unpackPremultipliedAlpha = false;

		Object.defineProperties(this, {
			dprAdaptive: {
				get() {
					return this._dprAdaptive;
				},
				set(value) {
					if (this._dprAdaptive !== value) {
						this._dprAdaptive = value;
						this.resized = false;
					}
				},
			},
			useMipMaps: {
				get() {
					return this.gl?.useMipMaps;
				},
				set(value) {
					if (this.gl) this.gl.useMipMaps = value;
				},
			},
		});

		if (!this.offscreen) {
			this.canvas.width = canvas.clientWidth;
			this.canvas.height = canvas.clientHeight;
		}

		this.check();
	}

	/**
	 * 检查 WebGL 可用性，不可用时禁用所有方法
	 * @description 当 WebGL 不可用时，将所有方法替换为空函数，避免运行时错误
	 */
	check() {
		if (!this.gl) {
			const empty = () => {};
			for (const key of Object.keys(this.__proto__)) {
				if (typeof this.__proto__[key] === "function") this.__proto__[key] = empty;
			}
			for (const key of Object.keys(this)) {
				if (typeof this[key] === "function" && key !== "check") this[key] = empty;
			}
		}
	}

	/**
	 * 创建纹理区域对象
	 * @param {HTMLImageElement} image - 图像元素
	 * @param {string} name - 纹理名称
	 * @returns {spine.TextureAtlasRegion} 纹理区域对象
	 * @description 将图像包装为 Spine 可用的纹理区域
	 */
	createTextureRegion(image, name) {
		const page = new spine.TextureAtlasPage();
		page.name = name;
		page.uWrap = page.vWrap = spine.TextureWrap.ClampToEdge;
		page.texture = this.spine.assetManager.textureLoader(image);
		page.texture.setWraps(page.uWrap, page.vWrap);
		page.width = page.texture.getImage().width;
		page.height = page.texture.getImage().height;

		const region = new spine.TextureAtlasRegion();
		region.page = page;
		region.rotate = false;
		region.width = region.originalWidth = page.width;
		region.height = region.originalHeight = page.height;
		region.x = region.y = 0;
		region.u = region.v = 0;
		region.u2 = region.v2 = 1;
		region.index = -1;
		region.texture = page.texture;
		region.renderObject = region;
		return region;
	}

	/**
	 * 检查指定骨骼动画是否已加载
	 * @param {string} filename - 骨骼文件名（不含扩展名）
	 * @returns {boolean} 如果已加载返回 true，否则返回 false
	 */
	hasSpine(filename) {
		return this.spine.assets[filename] !== undefined;
	}

	/**
	 * 加载骨骼动画资源
	 * @param {string} filename - 骨骼文件名（不含扩展名）
	 * @param {string} [skelType="skel"] - 骨骼文件类型，可选 "skel"（二进制）或 "json"（文本）
	 * @param {Function} [onload] - 加载成功时的回调函数
	 * @param {Function} [onerror] - 加载失败时的回调函数
	 * @description 异步加载骨骼数据文件（.skel 或 .json）和纹理图集文件（.atlas）
	 */
	loadSpine(filename, skelType, onload, onerror) {
		if (!this.spine.assetManager) {
			if (onerror) onerror();
			return;
		}

		const type = (skelType || "skel").toLowerCase();
		const manager = this.spine.assetManager;
		const assets = this.spine.assets;

		const reader = {
			filename,
			skelType: type,
			loaded: 0,
			errors: 0,
			toLoad: 2,

			onerror: () => {
				reader.toLoad--;
				reader.errors++;
				if (reader.toLoad === 0) {
					console.error(`loadSpine: [${filename}] 加载失败.`);
					if (onerror) onerror();
				}
			},

			onload: () => {
				reader.toLoad--;
				reader.loaded++;
				if (reader.toLoad === 0) {
					if (reader.errors > 0) {
						console.error(`loadSpine: [${filename}] 加载失败.`);
						if (onerror) onerror();
					} else {
						assets[filename] = { name: filename, skelType: type };
						if (onload) onload();
					}
				}
			},

			ontextLoad: (path, data) => {
				const atlasReader = new spine.TextureAtlasReader(data);
				const prefix = this._getPathPrefix(filename);
				let imageName = null;

				while (true) {
					let line = atlasReader.readLine();
					if (line === null) break;
					line = line.trim();
					if (line.length === 0) {
						imageName = null;
					} else if (!imageName) {
						imageName = line;
						reader.toLoad++;
						manager.loadTexture(prefix + imageName, reader.onload, reader.onerror);
					}
				}
				reader.onload();
			},
		};

		if (type === "json") {
			manager.loadText(filename + ".json", reader.onload, reader.onerror);
		} else {
			manager.loadBinary(filename + ".skel", reader.onload, reader.onerror);
		}
		manager.loadText(filename + ".atlas", reader.ontextLoad, reader.onerror);
	}

	/**
	 * 从文件名中提取路径前缀
	 * @private
	 * @param {string} filename - 完整文件名或路径
	 * @returns {string} 路径前缀（包含末尾的斜杠），如果没有路径则返回空字符串
	 */
	_getPathPrefix(filename) {
		const a = filename.lastIndexOf("/");
		const b = filename.lastIndexOf("\\");
		if (a === -1 && b === -1) return "";
		return filename.substring(0, Math.max(a, b) + 1);
	}

	/**
	 * 准备骨骼数据以供播放
	 * @param {string} filename - 骨骼文件名（不含扩展名）
	 * @param {boolean} [autoLoad] - 如果骨骼未加载，是否自动加载
	 * @returns {spine.Skeleton|string|undefined} 返回骨骼对象，或 "loading" 表示正在加载，或 undefined 表示失败
	 * @description 从已加载的资源创建骨骼实例，如果骨骼已存在则复用
	 */
	prepSpine(filename, autoLoad) {
		const assets = this.spine.assets;
		if (!assets[filename]) {
			if (autoLoad) {
				this.loadSpine(filename, "skel", () => this.prepSpine(filename));
				return "loading";
			}
			console.error(`prepSpine: [${filename}] 骨骼没有加载`);
			return;
		}

		const skeletons = this.spine.skeletons;
		for (const sk of skeletons) {
			if (sk.name === filename && sk.completed) return sk;
		}

		const asset = assets[filename];
		const manager = this.spine.assetManager;

	if (!asset.skelRawData) {
		const prefix = this._getPathPrefix(filename);
		const atlas = new spine.TextureAtlas(manager.get(filename + ".atlas"), path => manager.get(prefix + path));
		const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
		if (this.ignoreMissingRegions) {
			const createPlaceholder = (method, name, path) => {
				const region = atlas.regions?.[0];
				if (!region) return null;
				const attachment = method === "newMeshAttachment" ? new spine.MeshAttachment(name) : new spine.RegionAttachment(name);
				if (method === "newMeshAttachment") attachment.region = region;
				else attachment.setRegion(region);
				if (attachment.color) attachment.color.a = 0;
				attachment._missingRegion = path;
				return attachment;
			};
			for (const method of ["newRegionAttachment", "newMeshAttachment"]) {
				const createAttachment = atlasLoader[method].bind(atlasLoader);
				atlasLoader[method] = (skin, name, path) => {
					try {
						return createAttachment(skin, name, path);
					} catch (error) {
						if (!String(error?.message).startsWith("Region not found in atlas:")) throw error;
						console.warn(`[十周年UI] 动态背景缺少 atlas region，已使用透明占位：${path}`);
						return createPlaceholder(method, name, path);
					}
				};
			}
		}
		asset.skelRawData = asset.skelType === "json" ? new spine.SkeletonJson(atlasLoader) : new spine.SkeletonBinary(atlasLoader);
		asset.ready = true;
	}

		const data = asset.skelRawData.readSkeletonData(manager.get(`${filename}.${asset.skelType}`));
		const skeleton = new spine.Skeleton(data);
		skeleton.name = filename;
		skeleton.completed = true;
		skeleton.setSkinByName("default");
		skeleton.setToSetupPose();
		skeleton.updateWorldTransform();

		skeleton.state = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
		skeleton.state.addListener({
			complete(track) {
				const node = skeleton.node;
				if (node) {
					track.loop = node.loop ?? false;
					if (track.loop && node.loopCount > 0) {
						node.loopCount--;
						if (node.loopCount === 0) track.loop = false;
					}
					skeleton.completed = node.completed = !track.loop;
					if (node.complete) node.complete();
				} else {
					skeleton.completed = !track.loop;
					console.error("skeleton complete: 超出预期的错误");
				}
			},
		});

		skeleton.bounds = { offset: new spine.Vector2(), size: new spine.Vector2() };
		skeleton.getBounds(skeleton.bounds.offset, skeleton.bounds.size, []);
		skeleton.defaultAction = data.animations[0].name;
		skeleton.node = undefined;
		skeletons.push(skeleton);
		return skeleton;
	}

	/**
	 * 播放骨骼动画
	 * @param {string|Object|APNode} sprite - 骨骼文件名、动画配置对象或动画节点实例
	 * @param {string} sprite.name - 骨骼文件名
	 * @param {string} [sprite.action] - 要播放的动画动作名称
	 * @param {boolean} [sprite.loop] - 是否循环播放
	 * @param {Object} [position] - 位置和变换配置
	 * @param {number|number[]} [position.x] - X 坐标
	 * @param {number|number[]} [position.y] - Y 坐标
	 * @param {number|number[]} [position.width] - 宽度
	 * @param {number|number[]} [position.height] - 高度
	 * @param {number} [position.scale] - 缩放比例
	 * @param {number} [position.angle] - 旋转角度
	 * @param {HTMLElement} [position.parent] - 参考父节点
	 * @param {boolean} [position.follow] - 是否跟随父节点
	 * @returns {APNode|undefined} 返回动画节点实例，失败时返回 undefined
	 * @description 开始播放指定的骨骼动画，如果渲染循环未运行则自动启动
	 */
	playSpine(sprite, position) {
		if (sprite === undefined) {
			console.error("playSpine: parameter undefined");
			return;
		}

		if (typeof sprite === "string") sprite = { name: sprite };

		if (!this.hasSpine(sprite.name)) {
			console.error(`playSpine: [${sprite.name}] 骨骼没有加载`);
			return;
		}

		let skeleton;
		if (!(sprite instanceof APNode && sprite.skeleton.completed)) {
			skeleton = this.spine.skeletons.find(sk => sk.name === sprite.name && sk.completed);
			if (!skeleton) skeleton = this.prepSpine(sprite.name);

			if (!(sprite instanceof APNode)) {
				const param = sprite;
				sprite = new APNode(sprite);
				sprite.id = param.id ?? this.BUILT_ID++;
				this.nodes.push(sprite);
			}
			sprite.skeleton = skeleton;
			skeleton.node = sprite;
		} else {
			skeleton = sprite.skeleton;
		}

		sprite.completed = skeleton.completed = false;

		if (position) {
			Object.assign(sprite, {
				x: position.x,
				y: position.y,
				height: position.height,
				width: position.width,
				scale: position.scale,
				angle: position.angle,
				referNode: position.parent,
				referFollow: position.follow,
			});
		}

		const entry = skeleton.state.setAnimation(0, sprite.action || skeleton.defaultAction, sprite.loop);
		entry.mixDuration = 0;

		if (this.requestId === undefined) {
			this.running = true;
			if (!this.offscreen) this.canvas.style.visibility = "visible";
			this.requestId = requestAnimationFrame(this.render.bind(this));
		}

		sprite.referBounds = undefined;
		return sprite;
	}

	/**
	 * 循环播放骨骼动画
	 * @param {string|Object} sprite - 骨骼文件名或动画配置对象
	 * @param {Object} [position] - 位置和变换配置
	 * @returns {APNode|undefined} 返回动画节点实例
	 * @description playSpine 的便捷方法，自动设置 loop 为 true
	 */
	loopSpine(sprite, position) {
		if (typeof sprite === "string") sprite = { name: sprite, loop: true };
		else sprite.loop = true;
		return this.playSpine(sprite, position);
	}

	/**
	 * 停止播放指定的动画
	 * @param {APNode|number} sprite - 动画节点实例或节点 ID
	 * @returns {APNode|null} 返回被停止的节点，如果未找到则返回 null
	 */
	stopSpine(sprite) {
		const id = sprite.id ?? sprite;
		for (const item of this.nodes) {
			if (item.id === id && !item.completed) {
				item.completed = true;
				item.skeleton.state.setEmptyAnimation(0);
				if (item.skeleton) {
					item.skeleton.completed = true;
					item.skeleton.node = undefined;
				}
				return item;
			}
		}
		return null;
	}

	/**
	 * 停止播放所有正在运行的动画
	 * @description 将所有动画节点标记为已完成，并清空它们的动画状态
	 */
	stopSpineAll() {
		for (const sprite of this.nodes) {
			if (!sprite.completed) {
				sprite.completed = true;
				sprite.skeleton.state.setEmptyAnimation(0);
				if (sprite.skeleton) {
					sprite.skeleton.completed = true;
					sprite.skeleton.node = undefined;
				}
			}
		}
	}

	destroy() {
		if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
		this.requestId = undefined;
		this.running = false;
		this.nodes.length = 0;
		this.canvas?.remove?.();
		if (this.gl && !this.gl.isContextLost?.()) {
			try {
				this.gl.getExtension("WEBGL_lose_context")?.loseContext();
			} catch (error) {}
		}
		if (this.spine) {
			this.spine.skeletons = [];
			this.spine.assets = {};
			if (this.spine.assetManager) this.spine.assetManager.assets = {};
		}
		this.onIdle = null;
		this.gl = null;
	}

	/**
	 * 获取骨骼的所有可用动画动作列表
	 * @param {string} filename - 骨骼文件名（不含扩展名）
	 * @returns {Array<{name: string, duration: number}>|undefined} 动作列表，每项包含动作名称和持续时间（秒）
	 */
	getSpineActions(filename) {
		if (!this.hasSpine(filename)) {
			console.error(`getSpineActions: [${filename}] 骨骼没有加载`);
			return;
		}
		let skeleton = this.spine.skeletons.find(sk => sk.name === filename);
		if (!skeleton) skeleton = this.prepSpine(filename);
		return skeleton.data.animations.map(a => ({ name: a.name, duration: a.duration }));
	}

	/**
	 * 获取骨骼的边界信息
	 * @param {string} filename - 骨骼文件名（不含扩展名）
	 * @returns {Object|undefined} 边界信息对象，包含 offset 和 size 属性
	 * @description 返回骨骼在默认姿态下的包围盒信息
	 */
	getSpineBounds(filename) {
		if (!this.hasSpine(filename)) {
			console.error(`getSpineBounds: [${filename}] 骨骼没有加载`);
			return;
		}
		if (!this.resized) {
			const dpr = this.dprAdaptive ? Math.max(window.devicePixelRatio * (window.documentZoom || 1), 1) : 1;
			this.canvas.elementHeight = this.canvas.clientHeight;
			this.canvas.elementWidth = this.canvas.clientWidth;
			this.canvas.height = this.canvas.elementHeight * dpr;
			this.canvas.width = this.canvas.elementWidth * dpr;
		}
		let skeleton = this.spine.skeletons.find(sk => sk.name === filename);
		if (!skeleton) skeleton = this.prepSpine(filename);
		return skeleton.bounds;
	}

	/**
	 * 渲染循环主函数（每帧调用）
	 * @param {number} timestamp - 当前帧的时间戳（毫秒）
	 * @description 更新所有动画节点状态并渲染到画布，当没有活动节点时自动停止渲染循环
	 */
	render(timestamp) {
		const canvas = this.canvas;
		const offscreen = this.offscreen;
		if (!offscreen && !canvas.isConnected) this.stopSpineAll();
		const dpr = this.dprAdaptive ? (offscreen ? this.dpr || 1 : Math.max(window.devicePixelRatio * (window.documentZoom || 1), 1)) : 1;

		const delta = timestamp - (this.frameTime ?? timestamp);
		this.frameTime = timestamp;

		let erase = true;
		if (!this.resized || canvas.width === 0 || canvas.height === 0) {
			this.resized = true;
			if (!offscreen) {
				canvas.width = dpr * canvas.clientWidth;
				canvas.height = dpr * canvas.clientHeight;
				erase = false;
			} else {
				if (this.width) {
					canvas.width = dpr * this.width;
					erase = false;
				}
				if (this.height) {
					canvas.height = dpr * this.height;
					erase = false;
				}
			}
		}

		const eventArgs = { dpr, delta, canvas, frameTime: timestamp };

		for (let i = this.nodes.length - 1; i >= 0; i--) {
			const node = this.nodes[i];
			if (!node.completed) {
				node.update(eventArgs);
			} else {
				this.nodes.splice(i, 1);
			}
		}

		const gl = this.gl;
		gl.viewport(0, 0, canvas.width, canvas.height);
		if (erase) {
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
		}

		if (this.nodes.length === 0) {
			this.frameTime = this.requestId = undefined;
			this.running = false;
			if (!offscreen) this.canvas.style.visibility = "hidden";
			this.onIdle?.(this);
			return;
		}

		const { shader, batcher, skeletonRenderer: renderer } = this.spine;
		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(0, 0, canvas.width, canvas.height);

		if (!this.bindShader) {
			this.bindShader = shader;
			shader.bind();
			shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
		}

		for (const sprite of this.nodes) {
			if (sprite.renderClip) {
				gl.clipping = sprite.renderClip;
				gl.scissor(gl.clipping.x, gl.clipping.y, gl.clipping.width, gl.clipping.height);
			}

			const skeleton = sprite.skeleton;
			const state = skeleton.state;
			const speed = sprite.speed ?? 1;

			skeleton.flipX = sprite.flipX;
			skeleton.flipY = sprite.flipY;
			skeleton.opacity = sprite.renderOpacity ?? 1;
			state.hideSlots = sprite.hideSlots;
			state.update((delta / 1000) * speed);
			state.apply(skeleton);
			skeleton.updateWorldTransform();

			shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, sprite.mvp.values);
			batcher.begin(shader);

			renderer.premultipliedAlpha = sprite.premultipliedAlpha;
			renderer.outcropMask = this.outcropMask;
			renderer.unpackPremultipliedAlpha = this.unpackPremultipliedAlpha;
			if (renderer.outcropMask) {
				renderer.outcropX = sprite.renderX;
				renderer.outcropY = sprite.renderY;
				renderer.outcropScale = sprite.renderScale;
				renderer.outcropAngle = sprite.renderAngle;
				renderer.clipSlots = sprite.clipSlots;
			}
			renderer.hideSlots = sprite.hideSlots;
			renderer.disableMask = sprite.disableMask;
			renderer.draw(batcher, skeleton);
			batcher.end();

			if (gl.clipping) {
				gl.clipping = undefined;
				gl.scissor(0, 0, canvas.width, canvas.height);
			}
		}

		gl.disable(gl.SCISSOR_TEST);
		this.requestId = requestAnimationFrame(this.render.bind(this));
	}
}
