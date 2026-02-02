/**
 * 十周年UI自动更新系统
 * @module updater
 * @description 提供完整的版本检查、文件下载、增量更新功能
 */

import { VersionChecker } from "./versionChecker.js";
import { FileDownloader } from "./fileDownloader.js";
import { UpdateInstaller } from "./updateInstaller.js";
import { UpdateUI } from "./updateUI.js";
import { lib, game } from "noname";

/**
 * 更新器配置
 */
const UPDATER_CONFIG = {
	// GitHub仓库信息
	github: {
		owner: "diandian157",
		repo: "decadeUI",
		branch: "main",
	},
	// 扩展信息
	extension: {
		name: "十周年UI",
		path: "extension/十周年UI",
	},
	// 更新配置
	options: {
		timeout: 10000, // 请求超时时间
		chunkSize: 8192, // Base64解码块大小
		autoCheck: false, // 自动检查更新
		checkInterval: 86400000, // 检查间隔（24小时）
	},
};

/**
 * 更新管理器
 */
export class UpdateManager {
	constructor(config = {}) {
		this.config = { ...UPDATER_CONFIG, ...config };
		this.versionChecker = new VersionChecker(this.config);
		this.fileDownloader = new FileDownloader(this.config);
		this.updateInstaller = new UpdateInstaller(this.config);
		this.updateUI = new UpdateUI(this.config);
		this.isUpdating = false;
	}

	/**
	 * 检查更新
	 * @param {boolean} silent - 静默模式（不显示"已是最新"提示）
	 * @returns {Promise<Object>} 更新信息
	 */
	async checkForUpdates(silent = false) {
		if (this.isUpdating) {
			if (!silent) alert("正在检查更新中，请勿重复操作");
			return { hasUpdate: false };
		}

		try {
			this.isUpdating = true;

			// 1. 获取当前版本
			const currentVersion = await this.getCurrentVersion();

			// 2. 获取远程版本信息
			const remoteInfo = await this.versionChecker.fetchLatestVersion();
			if (!remoteInfo) {
				throw new Error("无法获取远程版本信息");
			}

			// 3. 比较版本
			const comparison = this.versionChecker.compareVersions(currentVersion, remoteInfo.version);

			if (comparison >= 0) {
				// 当前版本已是最新
				if (!silent) {
					alert("当前已是最新版本！");
				}
				return { hasUpdate: false, currentVersion, remoteInfo };
			}

			// 4. 有新版本可用
			return {
				hasUpdate: true,
				currentVersion,
				remoteVersion: remoteInfo.version,
				changelog: remoteInfo.changelog,
				publishDate: remoteInfo.date,
				minCompatibility: remoteInfo.minNonameVersion,
			};
		} catch (error) {
			console.error("[十周年UI更新] 检查更新失败:", error);
			if (!silent) {
				alert(`检查更新失败：${error.message}`);
			}
			return { hasUpdate: false, error: error.message };
		} finally {
			this.isUpdating = false;
		}
	}

	/**
	 * 执行更新
	 * @param {Object} updateInfo - 更新信息
	 * @returns {Promise<boolean>} 是否更新成功
	 */
	async performUpdate(updateInfo) {
		if (this.isUpdating) {
			alert("正在更新中，请勿重复操作");
			return false;
		}

		try {
			this.isUpdating = true;

			// 1. 显示更新确认对话框
			const confirmed = await this.updateUI.showUpdateDialog(updateInfo);
			if (!confirmed) {
				return false;
			}

			// 2. 获取文件变更列表
			const progress = this.updateUI.createProgress("正在分析文件变更...");
			const changedFiles = await this.versionChecker.getChangedFiles(updateInfo.currentVersion, updateInfo.remoteVersion);
			progress.remove();

			if (!changedFiles || changedFiles.length === 0) {
				alert("没有需要更新的文件");
				return false;
			}

			// 3. 下载并安装文件
			const success = await this.updateInstaller.installUpdate(changedFiles, updateInfo.remoteVersion, (current, total, filename) => {
				// 进度回调
				this.updateUI.updateProgress(current, total, filename);
			});

			if (success) {
				// 4. 更新成功，提示重启
				if (confirm("更新完成！是否立即重启游戏？")) {
					game.reload();
				}
				return true;
			} else {
				alert("更新失败，请查看控制台了解详情");
				return false;
			}
		} catch (error) {
			console.error("[十周年UI更新] 更新失败:", error);
			alert(`更新失败：${error.message}`);
			return false;
		} finally {
			this.isUpdating = false;
			this.updateUI.hideProgress();
		}
	}

	/**
	 * 一键更新（检查+安装）
	 * @param {boolean} silent - 静默模式
	 * @returns {Promise<boolean>} 是否更新成功
	 */
	async autoUpdate(silent = false) {
		const updateInfo = await this.checkForUpdates(silent);

		if (!updateInfo.hasUpdate) {
			return false;
		}

		return await this.performUpdate(updateInfo);
	}

	/**
	 * 获取当前版本
	 * @returns {Promise<string>} 当前版本号
	 */
	async getCurrentVersion() {
		try {
			const infoPath = `${lib.assetURL}${this.config.extension.path}/info.json`;
			const info = await lib.init.promises.json(infoPath);
			return info.version;
		} catch (error) {
			console.error("[十周年UI更新] 获取当前版本失败:", error);
			return "0.0.0";
		}
	}

	/**
	 * 启用自动检查更新
	 */
	enableAutoCheck() {
		if (this.autoCheckTimer) {
			clearInterval(this.autoCheckTimer);
		}

		// 立即检查一次
		setTimeout(() => {
			this.autoUpdate(true);
		}, 3000);

		// 定期检查
		this.autoCheckTimer = setInterval(() => {
			this.autoUpdate(true);
		}, this.config.options.checkInterval);
	}

	/**
	 * 禁用自动检查更新
	 */
	disableAutoCheck() {
		if (this.autoCheckTimer) {
			clearInterval(this.autoCheckTimer);
			this.autoCheckTimer = null;
		}
	}
}

/**
 * 创建更新管理器实例
 * @param {Object} config - 配置对象
 * @returns {UpdateManager} 更新管理器实例
 */
export function createUpdateManager(config) {
	return new UpdateManager(config);
}

// 导出默认实例
export const updateManager = new UpdateManager();
