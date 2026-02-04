"use strict";

/**
 * @fileoverview 动画工具函数模块，提供节流、尺寸观察、插值等通用功能
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func - 要节流的函数
 * @param {number} timeout - 节流时间间隔(ms)
 * @param {*} context - 执行上下文
 * @returns {Function} 节流后的函数
 */
export function throttle(func, timeout, context) {
	let args, timer, previous;
	return (...innerArgs) => {
		if (timer) clearTimeout(timer);
		if (previous === null) previous = performance.now();
		args = innerArgs;
		const timestamp = performance.now() - previous;
		if (timestamp >= timeout) {
			timer = previous = null;
			func.apply(context, args);
		} else {
			timer = setTimeout(() => {
				timer = previous = null;
				func.apply(context, args);
			}, timeout - timestamp);
		}
	};
}

/**
 * 创建元素尺寸观察器
 * @type {Function|null}
 * @param {HTMLElement} target - 目标元素
 * @param {Function} callback - 尺寸变化回调
 */
export const observeSize = (() => {
	if (!self.ResizeObserver) return null;
	const observer = new ResizeObserver(entries => {
		for (const entry of entries) {
			const callback = observer.callbacks[entry.target.observeId];
			if (callback) {
				const rect = entry.contentRect;
				callback({ width: rect.width, height: rect.height });
			}
		}
	});
	observer.observeId = 0;
	observer.callbacks = {};
	return (target, callback) => {
		target.observeId = observer.observeId++;
		observer.observe(target);
		observer.callbacks[target.observeId] = callback;
	};
})();

/**
 * 线性插值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} fraction - 插值比例(0-1)
 * @returns {number} 插值结果
 */
export function lerp(min, max, fraction) {
	return (max - min) * fraction + min;
}

/**
 * 获取浏览器信息
 * @returns {Array} [浏览器名称, 主版本号, 次版本号, 补丁版本号]
 */
export function getBrowserInfo() {
	// Electron环境
	if (typeof window?.process?.versions === "object" && window.process.versions.chrome) {
		const versions = window.process.versions.chrome
			.split(".")
			.slice(0, 3)
			.map(v => parseInt(v, 10));
		return ["chrome", ...versions];
	}
	// 现代浏览器API
	if (navigator.userAgentData?.brands?.length) {
		const brandInfo = navigator.userAgentData.brands.find(({ brand }) => {
			const lower = brand.toLowerCase();
			return lower.includes("chrome") || lower.includes("chromium");
		});
		return brandInfo ? ["chrome", parseInt(brandInfo.version, 10), 0, 0] : ["other", NaN, NaN, NaN];
	}
	// 传统UA解析
	const regex = /(firefox|chrome|safari)\/(\d+(?:\.\d+)+)/;
	const matched = navigator.userAgent.toLowerCase().match(regex);
	if (!matched) return ["other", NaN, NaN, NaN];

	if (matched[1] !== "safari") {
		const [major, minor, patch] = matched[2].split(".");
		return [matched[1], parseInt(major, 10), parseInt(minor, 10), parseInt(patch, 10)];
	}
	// Safari特殊处理
	const ua = navigator.userAgent.toLowerCase();
	const result = /macintosh/.test(ua)
		? ua.match(/version\/(\d+(?:\.\d+)+).*safari/)
		: ua.match(/(?:iphone|ipad); cpu (?:iphone )?os (\d+(?:_\d+)+)/);
	if (!result) return ["other", NaN, NaN, NaN];
	const [major, minor, patch] = result[1].split(/[._]/);
	return ["safari", parseInt(major, 10), parseInt(minor, 10), parseInt(patch, 10)];
}

/** @type {Array} 浏览器信息缓存 */
const browserInfo = getBrowserInfo();

/** @type {boolean} 是否使用新版DPR计算方式 */
export const useNewDpr = (browserInfo[0] === "chrome" && browserInfo[1] >= 128) || (browserInfo[0] === "firefox" && browserInfo[1] >= 126);
