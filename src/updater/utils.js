/**
 * 工具函数
 * @description 提供通用的辅助功能
 */

/**
 * 带超时的fetch请求
 * @param {string} url - 请求URL
 * @param {Object} options - 选项
 * @returns {Promise<any>} 响应数据
 */
export async function fetchWithTimeout(url, options = {}) {
	const { timeout = 10000, ...fetchOptions } = options;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...fetchOptions,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		clearTimeout(timeoutId);

		if (error.name === "AbortError") {
			throw new Error(`请求超时 (${timeout}ms)`);
		}

		throw error;
	}
}

/**
 * Base64转ArrayBuffer（支持大文件分块处理）
 * @param {string} base64 - Base64字符串
 * @param {number} chunkSize - 块大小
 * @returns {Promise<ArrayBuffer>} ArrayBuffer
 */
export async function base64ToArrayBuffer(base64, chunkSize = 8192) {
	// 移除可能的换行符和空格
	base64 = base64.replace(/[\r\n\s]/g, "");

	// 小文件直接解码
	if (base64.length <= chunkSize * 10) {
		return base64ToArrayBufferSync(base64);
	}

	// 大文件分块解码
	return await base64ToArrayBufferAsync(base64, chunkSize);
}

/**
 * 同步Base64解码
 */
function base64ToArrayBufferSync(base64) {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);

	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return bytes.buffer;
}

/**
 * 异步Base64解码（分块处理，避免阻塞UI）
 */
async function base64ToArrayBufferAsync(base64, chunkSize) {
	return new Promise((resolve, reject) => {
		// 使用requestIdleCallback或setTimeout在空闲时处理
		const scheduleWork = typeof requestIdleCallback === "function" ? callback => requestIdleCallback(() => callback()) : callback => setTimeout(callback, 0);

		scheduleWork(async () => {
			try {
				// 计算总大小
				let padding = 0;
				const length = base64.length;

				if (length > 0 && base64[length - 1] === "=") {
					padding++;
					if (length > 1 && base64[length - 2] === "=") {
						padding++;
					}
				}

				const totalSize = Math.floor((length * 3) / 4) - padding;
				const buffer = new ArrayBuffer(totalSize);
				const bytes = new Uint8Array(buffer);

				// 确保chunkSize是4的倍数（Base64特性）
				const alignedChunkSize = Math.max(4, chunkSize - (chunkSize % 4));
				let offset = 0;

				// 分块解码
				for (let i = 0; i < length; i += alignedChunkSize) {
					const end = Math.min(i + alignedChunkSize, length);
					const chunk = base64.slice(i, end);

					try {
						const binaryString = atob(chunk);
						const chunkBytes = new Uint8Array(binaryString.length);

						for (let j = 0; j < binaryString.length; j++) {
							chunkBytes[j] = binaryString.charCodeAt(j);
						}

						bytes.set(chunkBytes, offset);
						offset += chunkBytes.length;
					} catch (error) {
						throw new Error(`解码失败 (位置 ${i}): ${error.message}`);
					}

					// 每处理4个块就让出控制权
					if (i % (alignedChunkSize * 4) === 0) {
						await new Promise(r => setTimeout(r, 0));
					}
				}

				resolve(buffer);
			} catch (error) {
				reject(new Error(`Base64转换失败: ${error.message}`));
			}
		});
	});
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatSize(bytes) {
	if (bytes < 1024) {
		return bytes.toFixed(2) + " B";
	} else if (bytes < 1024 * 1024) {
		return (bytes / 1024).toFixed(2) + " KB";
	} else if (bytes < 1024 * 1024 * 1024) {
		return (bytes / (1024 * 1024)).toFixed(2) + " MB";
	} else {
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
	}
}

/**
 * 延迟函数
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
export function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 重试延迟
 * @returns {Promise<any>} 函数执行结果
 */
export async function retry(fn, maxRetries = 3, delayMs = 1000) {
	let lastError;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			console.warn(`[重试 ${i + 1}/${maxRetries}] 失败:`, error.message);

			if (i < maxRetries - 1) {
				await delay(delayMs * (i + 1)); // 指数退避
			}
		}
	}

	throw lastError;
}
