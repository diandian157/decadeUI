/**
 * 文件下载器
 * @description 负责从GitHub下载文件，支持进度回调
 */

export class FileDownloader {
	constructor(config) {
		this.config = config;
	}

	/**
	 * 下载单个文件
	 * @param {string} filename - 文件路径
	 * @param {string} version - 版本标签
	 * @param {Function} onProgress - 进度回调
	 * @returns {Promise<ArrayBuffer>} 文件内容
	 */
	async downloadFile(filename, version, onProgress) {
		const { owner, repo } = this.config.github;
		// 使用raw内容URL，直接获取文件
		const url = `https://raw.githubusercontent.com/${owner}/${repo}/${version}/${filename}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const reader = response.body.getReader();
		const contentLength = parseInt(response.headers.get("Content-Length") || "0");

		let receivedBytes = 0;
		const chunks = [];

		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

			chunks.push(value);
			receivedBytes += value.length;

			if (onProgress) {
				onProgress(receivedBytes, contentLength, filename);
			}
		}

		// 合并所有chunks
		const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;

		for (const chunk of chunks) {
			result.set(chunk, offset);
			offset += chunk.length;
		}

		return result.buffer;
	}

	/**
	 * 批量下载文件
	 * @param {Array} files - 文件列表
	 * @param {string} version - 版本标签
	 * @param {Function} onProgress - 进度回调 (current, total, filename)
	 * @returns {Promise<Array>} 下载结果列表
	 */
	async downloadFiles(files, version, onProgress) {
		const results = [];
		const total = files.length;

		for (let i = 0; i < total; i++) {
			const file = files[i];

			try {
				const content = await this.downloadFile(file.filename, version, (received, fileTotal, filename) => {
					if (onProgress) {
						onProgress(i + 1, total, filename || file.filename);
					}
				});

				results.push({
					filename: file.filename,
					content,
					success: true,
				});

				console.log(`[十周年UI更新] 下载完成: ${file.filename}`);
			} catch (error) {
				console.error(`[十周年UI更新] 下载失败: ${file.filename}`, error);
				results.push({
					filename: file.filename,
					error: error.message,
					success: false,
				});
			}
		}

		return results;
	}
}
