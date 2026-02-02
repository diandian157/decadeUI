/**
 * 更新安装器
 * @description 负责将下载的文件写入磁盘
 */

import { FileDownloader } from "./fileDownloader.js";
import { lib, game } from "noname";

export class UpdateInstaller {
	constructor(config) {
		this.config = config;
		this.downloader = new FileDownloader(config);
	}

	/**
	 * 安装更新
	 * @param {Array} changedFiles - 变更文件列表
	 * @param {string} version - 目标版本
	 * @param {Function} onProgress - 进度回调
	 * @returns {Promise<boolean>} 是否成功
	 */
	async installUpdate(changedFiles, version, onProgress) {
		try {
			// 1. 处理删除的文件
			const removedFiles = changedFiles.filter(f => f.status === "removed");
			await this.removeFiles(removedFiles);

			// 2. 下载需要更新的文件
			const filesToDownload = changedFiles.filter(f => f.status === "added" || f.status === "modified");

			if (filesToDownload.length === 0) {
				console.log("[十周年UI更新] 没有需要下载的文件");
				return true;
			}

			// 3. 批量下载
			const downloadResults = await this.downloader.downloadFiles(filesToDownload, version, onProgress);

			// 4. 写入文件
			const writeResults = await this.writeFiles(downloadResults);

			// 5. 检查是否全部成功
			const failedCount = writeResults.filter(r => !r.success).length;

			if (failedCount > 0) {
				console.warn(`[十周年UI更新] ${failedCount}个文件写入失败`);
				return false;
			}

			console.log("[十周年UI更新] 所有文件更新成功");
			return true;
		} catch (error) {
			console.error("[十周年UI更新] 安装更新失败:", error);
			throw error;
		}
	}

	/**
	 * 删除文件
	 */
	async removeFiles(files) {
		for (const file of files) {
			try {
				const fullPath = `${lib.assetURL}${this.config.extension.path}/${file.filename}`;
				await game.promises.removeFile(fullPath);
				console.log(`[十周年UI更新] 已删除: ${file.filename}`);
			} catch (error) {
				// 文件可能不存在，忽略错误
				console.warn(`[十周年UI更新] 删除失败（可能不存在）: ${file.filename}`);
			}
		}
	}

	/**
	 * 写入文件
	 */
	async writeFiles(downloadResults) {
		const results = [];

		for (const result of downloadResults) {
			if (!result.success) {
				results.push(result);
				continue;
			}

			try {
				await this.writeFile(result.filename, result.content);
				results.push({
					filename: result.filename,
					success: true,
				});
			} catch (error) {
				console.error(`[十周年UI更新] 写入失败: ${result.filename}`, error);
				results.push({
					filename: result.filename,
					error: error.message,
					success: false,
				});
			}
		}

		return results;
	}

	/**
	 * 写入单个文件
	 */
	async writeFile(filename, content) {
		// 分离路径和文件名
		const parts = filename.split("/");
		const name = parts.pop();
		const path = parts.length > 0 ? `${lib.assetURL}${this.config.extension.path}/${parts.join("/")}` : `${lib.assetURL}${this.config.extension.path}`;

		// 确保目录存在
		if (parts.length > 0) {
			await this.ensureDirectory(parts.join("/"));
		}

		// 写入文件
		await game.promises.writeFile(content, path, name);
		console.log(`[十周年UI更新] 已写入: ${filename}`);
	}

	/**
	 * 确保目录存在
	 */
	async ensureDirectory(dirPath) {
		try {
			const fullPath = `${lib.assetURL}${this.config.extension.path}/${dirPath}`;
			await game.promises.createDir(fullPath);
		} catch (error) {
			// 目录可能已存在，忽略错误
		}
	}
}
