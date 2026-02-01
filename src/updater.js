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

		const _0x1a2b = [
			"\x3c\x70\x20\x73\x74\x79\x6c\x65\x3d\x22\x74\x65\x78\x74\x2d\x61\x6c\x69\x67\x6e\x3a\x6c\x65\x66\x74\x3b\x6d\x61\x72\x67\x69\x6e\x3a\x30\x3b\x70\x61\x64\x64\x69\x6e\x67\x3a\x31\x30\x70\x78\x22\x3e",
			"\u5341\u5468\u5e74\x55\x49\u6709\u66f4\u65b0\x3c\x62\x72\x3e",
			"\u6700\u65b0\u7248\u672c\u4e3a",
			"\x3c\x62\x72\x3e\u8fdb\u5165\u7fa4\u804a\u4e0b\u8f7d\x3c\x61\x20\x68\x72\x65\x66\x3d\x22\x68\x74\x74\x70\x73\x3a\x2f\x2f\x71\x6d\x2e\x71\x71\x2e\x63\x6f\x6d\x2f\x71\x2f\x43\x71\x6f\x37\x4c\x73\x5a\x48\x37\x47\x22\x20\x74\x61\x72\x67\x65\x74\x3d\x22\x5f\x62\x6c\x61\x6e\x6b\x22\x20\x73\x74\x79\x6c\x65\x3d\x22\x63\x6f\x6c\x6f\x72\x3a\x23\x34\x41\x39\x30\x45\x32\x3b\x74\x65\x78\x74\x2d\x64\x65\x63\x6f\x72\x61\x74\x69\x6f\x6e\x3a\x75\x6e\x64\x65\x72\x6c\x69\x6e\x65\x22\x3e\x39\x38\x35\x39\x31\x34\x39\x30\x30\x3c\x2f\x61\x3e\x3c\x62\x72\x3e",
			"\u6216\u8005\x3c\x61\x20\x68\x72\x65\x66\x3d\x22\x68\x74\x74\x70\x73\x3a\x2f\x2f\x67\x69\x74\x68\x75\x62\x2e\x63\x6f\x6d\x2f\x64\x69\x61\x6e\x64\x69\x61\x6e\x31\x35\x37\x2f\x64\x65\x63\x61\x64\x65\x55\x49\x2f\x72\x65\x6c\x65\x61\x73\x65\x73\x22\x20\x74\x61\x72\x67\x65\x74\x3d\x22\x5f\x62\x6c\x61\x6e\x6b\x22\x20\x73\x74\x79\x6c\x65\x3d\x22\x63\x6f\x6c\x6f\x72\x3a\x23\x34\x41\x39\x30\x45\x32\x3b\x74\x65\x78\x74\x2d\x64\x65\x63\x6f\x72\x61\x74\x69\x6f\x6e\x3a\x75\x6e\x64\x65\x72\x6c\x69\x6e\x65\x22\x3e\u8fdb\u5165\x47\x69\x74\x48\x75\x62\u4ed3\u5e93\u4e0b\u8f7d\x3c\x2f\x61\x3e\x3c\x62\x72\x3e",
			"\u672c\u6e38\u620f\u5b8c\u5168\u514d\u8d39\uff0c\u5982\u679c\u4f60\u662f\u4ed8\u8d39\u8d2d\u4e70\u7684\u8bf7\u4e3e\u62a5\u5546\u5bb6\u5e76\u9000\u6b3e\uff01",
			"\x3c\x2f\x70\x3e",
		];

		const message = _0x1a2b[0] + _0x1a2b[1] + _0x1a2b[2] + updateInfo.latestVersion + _0x1a2b[3] + _0x1a2b[4] + _0x1a2b[5] + _0x1a2b[6];

		// 使用游戏自带的alert
		if (typeof game !== "undefined" && game.alert) {
			game.alert(message);
		} else if (typeof alert !== "undefined") {
			alert(message);
		}
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
