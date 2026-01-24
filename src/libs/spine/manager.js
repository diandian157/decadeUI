/**
 * @fileoverview Spine版本管理器 - 检测版本并动态加载Runtime
 */

export class SpineVersionManager {
	constructor() {
		this.loadedRuntimes = new Map();
		this.loadingPromises = new Map();
		this.currentVersion = null;
		this.debug = false;
		this.versionConfig = {
			3.8: { path: "extension/十周年UI/src/libs/spine/spine-3.8.js" },
			4.1: { path: "extension/十周年UI/src/libs/spine/spine-4.1.js" },
			4.2: { path: "extension/十周年UI/src/libs/spine/spine-4.2.js" },
		};
		this.defaultVersion = "3.8";
	}

	detectVersion(skeletonData) {
		try {
			// 如果是字符串，先解析
			const data = typeof skeletonData === "string" ? JSON.parse(skeletonData) : skeletonData;

			// 从skeleton.spine字段读取版本
			const versionString = data?.skeleton?.spine || data?.version || "";

			if (!versionString) {
				console.warn("[Spine] 无法检测版本，使用默认版本:", this.defaultVersion);
				return this.defaultVersion;
			}

			// 解析版本号
			const version = this._parseVersion(versionString);
			if (this.debug) {
				console.log(`[Spine] 检测版本: ${versionString} -> ${version}`);
			}

			return version;
		} catch (error) {
			console.error("[Spine] 版本检测失败:", error);
			return this.defaultVersion;
		}
	}

	_parseVersion(versionString) {
		const match = versionString.match(/^(\d+)\.(\d+)/);
		if (!match) return this.defaultVersion;

		const major = parseInt(match[1]);
		const minor = parseInt(match[2]);

		// 版本映射规则
		if (major === 3) {
			// 3.6, 3.7, 3.8 都使用 3.8 Runtime
			return "3.8";
		} else if (major === 4) {
			if (minor === 0 || minor === 1) {
				// 4.0, 4.1 使用 4.1 Runtime
				return "4.1";
			} else if (minor === 2) {
				// 4.2 使用 4.2 Runtime
				return "4.2";
			} else if (minor >= 3) {
				// 4.3+ 暂时使用 4.2 Runtime（向下兼容）
				console.warn(`[Spine] 版本 ${versionString} 较新，使用 4.2 Runtime`);
				return "4.2";
			}
		}

		console.warn(`[Spine] 未知版本 ${versionString}，使用默认版本`);
		return this.defaultVersion;
	}

	async loadRuntime(version) {
		// 检查是否已加载
		if (this.loadedRuntimes.has(version)) {
			return this.loadedRuntimes.get(version);
		}

		// 检查是否正在加载
		if (this.loadingPromises.has(version)) {
			return this.loadingPromises.get(version);
		}

		// 开始加载
		const config = this.versionConfig[version];
		if (!config) {
			throw new Error(`[Spine] 不支持的版本: ${version}`);
		}

		if (this.debug) {
			console.log(`[Spine] 加载 ${version} Runtime`);
		}

		const loadPromise = this._loadScript(config.path, version);
		this.loadingPromises.set(version, loadPromise);

		try {
			const runtime = await loadPromise;
			this.loadedRuntimes.set(version, runtime);
			this.loadingPromises.delete(version);
			this.currentVersion = version;

			return runtime;
		} catch (error) {
			this.loadingPromises.delete(version);
			console.error(`[Spine] 加载 ${version} Runtime 失败:`, error);
			throw error;
		}
	}

	_loadScript(path, version) {
		return new Promise((resolve, reject) => {
			// 保存当前的window.spine（如果存在）
			const oldSpine = window.spine;

			const script = document.createElement("script");
			script.src = path;
			script.async = false; // 同步加载，确保spine对象立即可用

			script.onload = () => {
				// IIFE格式的spine-webgl.js会直接设置window.spine
				const spineRuntime = window.spine;

				if (!spineRuntime) {
					reject(new Error(`[Spine] 加载失败: 未找到 window.spine`));
					return;
				}

				// 创建版本特定的副本，避免冲突
				const versionedRuntime = Object.assign({}, spineRuntime);

				resolve(versionedRuntime);
			};

			script.onerror = () => {
				reject(new Error(`[Spine] 加载失败: ${path}`));
			};

			document.head.appendChild(script);
		});
	}

	async autoLoad(skeletonData) {
		const version = this.detectVersion(skeletonData);
		const runtime = await this.loadRuntime(version);
		return { version, runtime };
	}

	async preload(versions = ["3.8"]) {
		if (this.debug) {
			console.log(`[Spine] 预加载: ${versions.join(", ")}`);
		}
		const promises = versions.map(version => this.loadRuntime(version).catch(err => console.error(`[Spine] 预加载 ${version} 失败:`, err)));
		await Promise.all(promises);
	}

	getLoadedVersions() {
		return Array.from(this.loadedRuntimes.keys());
	}

	getVersionInfo(version) {
		return this.versionConfig[version] || null;
	}

	clearCache() {
		this.loadedRuntimes.clear();
		this.loadingPromises.clear();
		this.currentVersion = null;
		if (this.debug) {
			console.log("[Spine] 缓存已清除");
		}
	}
}

export const spineVersionManager = new SpineVersionManager();
