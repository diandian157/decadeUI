/**
 * 十周年UI扩展更新器
 * 提供版本检查和更新提示功能
 */

import { lib, game } from "noname";

export class DecadeUIUpdater {
	constructor(extensionName, currentVersion, updateURL) {
		this.extensionName = extensionName;
		this.currentVersion = currentVersion;
		this.updateURL = updateURL;
	}

	/**
	 * 比较版本号
	 * @param {string} v1 - 版本1
	 * @param {string} v2 - 版本2
	 * @returns {number} 1表示v1>v2, -1表示v1<v2, 0表示相等
	 */
	compareVersion(v1, v2) {
		const parts1 = v1.split(".").map(Number);
		const parts2 = v2.split(".").map(Number);
		const maxLength = Math.max(parts1.length, parts2.length);

		for (let i = 0; i < maxLength; i++) {
			const num1 = parts1[i] || 0;
			const num2 = parts2[i] || 0;

			if (num1 > num2) return 1;
			if (num1 < num2) return -1;
		}

		return 0;
	}

	/**
	 * 检查更新
	 * @returns {Promise<Object|null>} 返回更新信息或null
	 */
	async checkUpdate() {
		try {
			const response = await fetch(this.updateURL);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const updateInfo = await response.json();
			const latestVersion = updateInfo.version;

			if (this.compareVersion(latestVersion, this.currentVersion) > 0) {
				return {
					hasUpdate: true,
					currentVersion: this.currentVersion,
					latestVersion: latestVersion,
					changeLog: updateInfo.changeLog || [],
					downloadURL: updateInfo.downloadURL,
					diskURL: updateInfo.diskURL,
					forumURL: updateInfo.forumURL,
				};
			}

			return { hasUpdate: false };
		} catch (error) {
			console.error(`[${this.extensionName}] 检查更新失败:`, error);
			return null;
		}
	}

	/**
	 * 显示更新提示
	 * @param {Object} updateInfo - 更新信息
	 */
	showUpdateNotification(updateInfo) {
		if (!updateInfo || !updateInfo.hasUpdate) return;

		const changeLogText = updateInfo.changeLog.length > 0 ? `<br><br>更新内容：<br>${updateInfo.changeLog.map(log => `• ${log}`).join("<br>")}` : "";

		const message = `
			<div style="text-align: left; padding: 10px;">
				<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
					发现新版本！
				</div>
				<div style="margin-bottom: 5px;">
					当前版本：${updateInfo.currentVersion}
				</div>
				<div style="margin-bottom: 10px;">
					最新版本：<span style="color: #4CAF50;">${updateInfo.latestVersion}</span>
				</div>
				${changeLogText}
				<div style="margin-top: 15px; font-size: 14px; color: #666;">
					请前往 选项 → 扩展 → 十周年UI 进行更新
				</div>
			</div>
		`;

		game.alert(message);
	}

	/**
	 * 自动检查更新（静默模式）
	 * @param {boolean} showNotification - 是否显示通知
	 */
	async autoCheck(showNotification = true) {
		const updateInfo = await this.checkUpdate();

		if (updateInfo && updateInfo.hasUpdate && showNotification) {
			this.showUpdateNotification(updateInfo);
		}

		return updateInfo;
	}
}

/**
 * 创建更新器实例
 * @param {string} extensionName - 扩展名称
 * @param {string} currentVersion - 当前版本
 * @param {string} updateURL - 更新地址
 * @returns {DecadeUIUpdater}
 */
export function createUpdater(extensionName, currentVersion, updateURL) {
	return new DecadeUIUpdater(extensionName, currentVersion, updateURL);
}
