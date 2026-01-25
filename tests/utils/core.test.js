/**
 * @fileoverview utils/core.js 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRandom, isMobile } from "../../src/utils/core.js";
import { lib } from "noname";

describe("utils/core.js", () => {
	describe("getRandom()", () => {
		it("应该返回范围内的随机整数", () => {
			for (let i = 0; i < 100; i++) {
				const result = getRandom(1, 10);
				expect(result).toBeGreaterThanOrEqual(1);
				expect(result).toBeLessThanOrEqual(10);
				expect(Number.isInteger(result)).toBe(true);
			}
		});

		it("应该处理 min > max 的情况（自动交换）", () => {
			for (let i = 0; i < 50; i++) {
				const result = getRandom(10, 1);
				expect(result).toBeGreaterThanOrEqual(1);
				expect(result).toBeLessThanOrEqual(10);
			}
		});

		it("应该处理 min === max 的情况", () => {
			const result = getRandom(5, 5);
			expect(result).toBe(5);
		});

		it("应该处理负数范围", () => {
			for (let i = 0; i < 50; i++) {
				const result = getRandom(-10, -1);
				expect(result).toBeGreaterThanOrEqual(-10);
				expect(result).toBeLessThanOrEqual(-1);
			}
		});

		it("应该处理跨越零的范围", () => {
			for (let i = 0; i < 50; i++) {
				const result = getRandom(-5, 5);
				expect(result).toBeGreaterThanOrEqual(-5);
				expect(result).toBeLessThanOrEqual(5);
			}
		});

		it("应该使用默认值", () => {
			const result = getRandom();
			expect(Number.isInteger(result)).toBe(true);
			expect(result).toBeGreaterThanOrEqual(-2147483648);
			expect(result).toBeLessThanOrEqual(2147483648);
		});

		it("应该处理只传入 min 的情况", () => {
			const result = getRandom(10);
			expect(Number.isInteger(result)).toBe(true);
		});

		it("应该返回整数（不是浮点数）", () => {
			for (let i = 0; i < 20; i++) {
				const result = getRandom(1, 100);
				expect(result % 1).toBe(0);
			}
		});

		it("应该有合理的分布（统计测试）", () => {
			const counts = { low: 0, high: 0 };
			const iterations = 1000;

			for (let i = 0; i < iterations; i++) {
				const result = getRandom(1, 10);
				if (result <= 5) counts.low++;
				else counts.high++;
			}

			// 期望分布大致均匀（允许一定偏差）
			const ratio = counts.low / counts.high;
			expect(ratio).toBeGreaterThan(0.7);
			expect(ratio).toBeLessThan(1.3);
		});
	});

	describe("isMobile()", () => {
		beforeEach(() => {
			// 保存原始值
			lib._originalDevice = lib.device;
		});

		afterEach(() => {
			// 恢复原始值
			lib.device = lib._originalDevice;
		});

		it("应该识别 Android 设备", () => {
			lib.device = "android";
			expect(isMobile()).toBe(true);
		});

		it("应该识别 iOS 设备", () => {
			lib.device = "ios";
			expect(isMobile()).toBe(true);
		});

		it("PC 不应该被识别为移动端", () => {
			lib.device = "pc";
			expect(isMobile()).toBe(false);
		});

		it("未知设备不应该被识别为移动端", () => {
			lib.device = "unknown";
			expect(isMobile()).toBe(false);
		});

		it("空值不应该被识别为移动端", () => {
			lib.device = null;
			expect(isMobile()).toBe(false);
		});

		it("应该区分大小写", () => {
			lib.device = "Android"; // 大写
			expect(isMobile()).toBe(false);

			lib.device = "IOS"; // 大写
			expect(isMobile()).toBe(false);
		});
	});
});
