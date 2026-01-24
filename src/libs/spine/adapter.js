/**
 * @fileoverview AnimationPlayer适配器
 */

import { spineVersionManager } from "./manager.js";

export class AnimationPlayerAdapter {
	static async initialize(options = {}) {
		const { preloadVersions = ["3.8"], autoDetect = true, debug = false } = options;

		// 设置调试模式
		spineVersionManager.debug = debug;

		// 预加载默认版本
		if (preloadVersions.length > 0) {
			await spineVersionManager.preload(preloadVersions);
		}

		// 确保window.spine指向默认版本
		if (!window.spine && preloadVersions.length > 0) {
			const defaultVersion = preloadVersions[0];
			const runtime = await spineVersionManager.loadRuntime(defaultVersion);
			window.spine = runtime;
		}

		if (debug) {
			console.log("[Spine] 多版本支持已初始化");
		}
	}

	static enhancePlayer(player) {
		// 保存原始方法
		const originalLoadSkeleton = player.loadSkeleton?.bind(player);

		// 添加版本管理器引用
		player.spineVersionManager = spineVersionManager;
		player.currentSpineVersion = null;

		player.loadSkeletonWithVersion = async function (name, forceVersion = null) {
			// 如果有原始方法，先尝试使用
			if (originalLoadSkeleton && !forceVersion) {
				return originalLoadSkeleton(name);
			}

			// 使用多版本加载
			const jsonPath = `${this.pathPrefix || ""}/${name}.json`;

			// 加载JSON数据
			const response = await fetch(jsonPath);
			const skeletonData = await response.json();

			// 检测版本
			const version = forceVersion || spineVersionManager.detectVersion(skeletonData);

			// 如果版本变化，需要切换Runtime
			if (this.currentSpineVersion !== version) {
				if (this.debug) {
					console.log(`[Spine] 切换到 v${version} Runtime`);
				}
				const runtime = await spineVersionManager.loadRuntime(version);

				// 更新window.spine和player的spine引用
				window.spine = runtime;
				this.currentSpineVersion = version;

				// 重新初始化Spine组件
				if (this.gl) {
					this.spine.shader = runtime.webgl.Shader.newTwoColoredTextured(this.gl);
					this.spine.batcher = new runtime.webgl.PolygonBatcher(this.gl);
					this.spine.skeletonRenderer = new runtime.webgl.SkeletonRenderer(this.gl);
					this.spine.assetManager = new runtime.webgl.AssetManager(this.gl, this.pathPrefix || "");
				}
			}

			// 使用原始方法加载
			if (originalLoadSkeleton) {
				return originalLoadSkeleton(name);
			}
		};

		player.getCurrentSpineVersion = function () {
			return this.currentSpineVersion;
		};

		player.getLoadedSpineVersions = function () {
			return spineVersionManager.getLoadedVersions();
		};

		player.spineDebug = false;
	}

	static async setup(options = {}) {
		await this.initialize(options);
	}
}

export async function setupMultiVersionSpine(options = {}) {
	return AnimationPlayerAdapter.setup(options);
}
