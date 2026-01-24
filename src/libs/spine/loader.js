/**
 * @fileoverview Spine资源加载器
 */

import { spineVersionManager } from "./manager.js";

export class SpineLoader {
	constructor() {
		this.skeletonCache = new Map();
		this.atlasCache = new Map();
		this.debug = false;
	}

	async load({ jsonPath, atlasPath, cache = true, forceVersion = null }) {
		try {
			// 检查缓存
			const cacheKey = `${jsonPath}|${atlasPath}`;
			if (cache && this.skeletonCache.has(cacheKey)) {
				if (this.debug) {
					console.log(`[Spine] 使用缓存: ${jsonPath}`);
				}
				return this.skeletonCache.get(cacheKey);
			}

			// 加载JSON数据
			const skeletonData = await this._loadJSON(jsonPath);

			// 检测或使用指定版本
			const version = forceVersion || spineVersionManager.detectVersion(skeletonData);

			// 加载对应版本的Runtime
			const runtime = await spineVersionManager.loadRuntime(version);

			// 加载图集
			const atlas = await this._loadAtlas(atlasPath, runtime);

			// 创建骨骼数据
			const atlasLoader = new runtime.AtlasAttachmentLoader(atlas);
			const skeletonJson = new runtime.SkeletonJson(atlasLoader);

			// 解析骨骼数据
			const skeleton = skeletonJson.readSkeletonData(skeletonData);

			const result = {
				version,
				runtime,
				skeleton,
				atlas,
				skeletonData,
				jsonPath,
				atlasPath,
			};

			// 缓存结果
			if (cache) {
				this.skeletonCache.set(cacheKey, result);
			}

			if (this.debug) {
				console.log(`[Spine] 加载成功: ${jsonPath} (v${version})`);
			}
			return result;
		} catch (error) {
			console.error(`[Spine] 加载失败: ${jsonPath}`, error);
			throw error;
		}
	}

	async _loadJSON(path) {
		const response = await fetch(path);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${path}`);
		}
		return await response.json();
	}

	async _loadAtlas(path, runtime) {
		const response = await fetch(path);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${path}`);
		}

		const atlasText = await response.text();

		// 创建纹理加载器
		const textureLoader = imagePath => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "anonymous";

				img.onload = () => {
					resolve(img);
				};

				img.onerror = () => {
					reject(new Error(`图片加载失败: ${imagePath}`));
				};

				// 处理相对路径
				const baseDir = path.substring(0, path.lastIndexOf("/") + 1);
				img.src = baseDir + imagePath;
			});
		};

		// 创建图集
		return new runtime.TextureAtlas(atlasText, textureLoader);
	}

	async preloadBatch(animations) {
		if (this.debug) {
			console.log(`[Spine] 批量预加载 ${animations.length} 个动画`);
		}
		const promises = animations.map(config => this.load(config).catch(err => console.error("[Spine] 预加载失败:", config, err)));
		return await Promise.all(promises);
	}

	clearCache(jsonPath = null) {
		if (jsonPath) {
			for (const [key] of this.skeletonCache.entries()) {
				if (key.startsWith(jsonPath)) {
					this.skeletonCache.delete(key);
					if (this.debug) {
						console.log(`[Spine] 清除缓存: ${key}`);
					}
				}
			}
		} else {
			// 清除全部缓存
			this.skeletonCache.clear();
			this.atlasCache.clear();
			if (this.debug) {
				console.log("[Spine] 清除所有缓存");
			}
		}
	}

	getCacheStats() {
		return {
			skeletonCount: this.skeletonCache.size,
			atlasCount: this.atlasCache.size,
			loadedVersions: spineVersionManager.getLoadedVersions(),
		};
	}
}

export const spineLoader = new SpineLoader();
