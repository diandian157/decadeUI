/**
 * 版本检查器
 * @description 负责版本比较、远程版本获取、文件变更检测
 */

import { fetchWithTimeout } from "./utils.js";

export class VersionChecker {
	constructor(config) {
		this.config = config;
	}

	/**
	 * 获取最新版本信息
	 * @returns {Promise<Object>} 版本信息
	 */
	async fetchLatestVersion() {
		try {
			console.log("[十周年UI更新] 从GitHub获取版本信息...");
			const url = this.getGithubReleaseUrl();
			const data = await fetchWithTimeout(url, {
				timeout: this.config.options.timeout,
			});

			return this.parseReleaseData(data);
		} catch (error) {
			console.error("[十周年UI更新] 获取失败:", error.message);
			throw new Error("无法获取更新信息");
		}
	}

	/**
	 * 获取文件变更列表
	 * @param {string} fromVersion - 起始版本
	 * @param {string} toVersion - 目标版本
	 * @returns {Promise<Array>} 变更文件列表
	 */
	async getChangedFiles(fromVersion, toVersion) {
		const { owner, repo } = this.config.github;
		const url = `https://api.github.com/repos/${owner}/${repo}/compare/${fromVersion}...${toVersion}`;

		const data = await fetchWithTimeout(url, {
			timeout: this.config.options.timeout,
		});

		return this.parseChangedFiles(data.files || []);
	}

	/**
	 * 解析文件变更列表
	 */
	parseChangedFiles(files) {
		return files
			.map(file => ({
				filename: file.filename,
				status: file.status, // added, modified, removed
				size: file.size || 0,
				sha: file.sha,
			}))
			.filter(file => {
				// 过滤不需要更新的文件
				const excludePatterns = [/^\.git/, /^\.github/, /^README/i, /^LICENSE/i, /\.md$/i];

				return !excludePatterns.some(pattern => pattern.test(file.filename));
			});
	}

	/**
	 * 比较版本号
	 * @param {string} v1 - 版本1
	 * @param {string} v2 - 版本2
	 * @returns {number} 1: v1>v2, -1: v1<v2, 0: 相等
	 */
	compareVersions(v1, v2) {
		const normalize = v => v.replace(/^v/i, "").split(".").map(Number);

		const parts1 = normalize(v1);
		const parts2 = normalize(v2);
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
	 * 解析Release数据
	 */
	parseReleaseData(data) {
		return {
			version: data.tag_name,
			changelog: data.body || "",
			date: new Date(data.published_at).toLocaleDateString("zh-CN"),
			minNonameVersion: this.extractMinVersion(data.name),
			assets: data.assets || [],
		};
	}

	/**
	 * 从Release名称提取最低兼容版本
	 * 例如: "v1.0.0-1.11.0" -> "1.11.0"
	 */
	extractMinVersion(releaseName) {
		if (!releaseName || !releaseName.includes("-")) {
			return null;
		}
		return releaseName.split("-").pop();
	}

	/**
	 * 获取GitHub Release URL
	 */
	getGithubReleaseUrl() {
		const { owner, repo } = this.config.github;
		return `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
	}
}
