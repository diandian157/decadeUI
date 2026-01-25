/**
 * @fileoverview animation/utils.js 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lerp, getBrowserInfo, throttle } from "../../src/animation/utils.js";

describe("animation/utils.js", () => {
	describe("lerp()", () => {
		it("应该在 fraction=0 时返回 min", () => {
			expect(lerp(0, 100, 0)).toBe(0);
			expect(lerp(-50, 50, 0)).toBe(-50);
		});

		it("应该在 fraction=1 时返回 max", () => {
			expect(lerp(0, 100, 1)).toBe(100);
			expect(lerp(-50, 50, 1)).toBe(50);
		});

		it("应该在 fraction=0.5 时返回中点", () => {
			expect(lerp(0, 100, 0.5)).toBe(50);
			expect(lerp(-100, 100, 0.5)).toBe(0);
			expect(lerp(10, 20, 0.5)).toBe(15);
		});

		it("应该正确插值任意 fraction", () => {
			expect(lerp(0, 100, 0.25)).toBe(25);
			expect(lerp(0, 100, 0.75)).toBe(75);
			expect(lerp(10, 20, 0.3)).toBeCloseTo(13, 5);
		});

		it("应该处理负数范围", () => {
			expect(lerp(-100, -50, 0.5)).toBe(-75);
			expect(lerp(-10, -5, 0)).toBe(-10);
			expect(lerp(-10, -5, 1)).toBe(-5);
		});

		it("应该处理 min > max 的情况", () => {
			expect(lerp(100, 0, 0.5)).toBe(50);
			expect(lerp(10, 5, 0.5)).toBe(7.5);
		});

		it("应该处理小数", () => {
			expect(lerp(0.5, 1.5, 0.5)).toBe(1);
			expect(lerp(1.2, 3.8, 0.25)).toBeCloseTo(1.85, 5);
		});

		it("应该是线性的", () => {
			const values = [0, 0.25, 0.5, 0.75, 1].map(f => lerp(0, 100, f));
			// 检查等差数列
			for (let i = 1; i < values.length; i++) {
				const diff = values[i] - values[i - 1];
				expect(diff).toBeCloseTo(25, 5);
			}
		});

		it("应该处理极小的 fraction", () => {
			expect(lerp(0, 100, 0.001)).toBeCloseTo(0.1, 5);
		});

		it("应该处理极大的 fraction", () => {
			expect(lerp(0, 100, 0.999)).toBeCloseTo(99.9, 5);
		});
	});

	describe("getBrowserInfo()", () => {
		let originalNavigator;
		let originalWindow;

		beforeEach(() => {
			originalNavigator = global.navigator;
			originalWindow = global.window;
		});

		afterEach(() => {
			global.navigator = originalNavigator;
			global.window = originalWindow;
		});

		it("应该返回数组格式 [name, major, minor, patch]", () => {
			const info = getBrowserInfo();
			expect(Array.isArray(info)).toBe(true);
			expect(info).toHaveLength(4);
		});

		it("应该识别 Chrome（通过 Electron）", () => {
			global.window = {
				process: {
					versions: {
						chrome: "120.0.6099.109",
					},
				},
			};

			const info = getBrowserInfo();
			expect(info[0]).toBe("chrome");
			expect(info[1]).toBe(120);
			expect(info[2]).toBe(0);
			expect(info[3]).toBe(6099);
		});

		it("应该处理 Chrome UA 字符串", () => {
			global.window = {};
			global.navigator = {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				userAgentData: undefined,
			};

			const info = getBrowserInfo();
			expect(info[0]).toBe("chrome");
			expect(info[1]).toBe(120);
		});

		it("应该处理 Firefox UA 字符串", () => {
			global.window = {};
			global.navigator = {
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
				userAgentData: undefined,
			};

			const info = getBrowserInfo();
			expect(info[0]).toBe("firefox");
			expect(info[1]).toBe(121);
		});

		it("应该处理未知浏览器", () => {
			global.window = {};
			global.navigator = {
				userAgent: "Unknown Browser",
				userAgentData: undefined,
			};

			const info = getBrowserInfo();
			expect(info[0]).toBe("other");
			expect(isNaN(info[1])).toBe(true);
		});
	});

	describe("throttle()", () => {
		it("应该在超时后执行第一次调用", async () => {
			const fn = vi.fn();
			const throttled = throttle(fn, 50);

			throttled("arg1");
			expect(fn).toHaveBeenCalledTimes(0); // 第一次调用会延迟

			await new Promise(resolve => setTimeout(resolve, 60));

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn).toHaveBeenCalledWith("arg1");
		});

		it("应该在超时后执行后续调用", async () => {
			const fn = vi.fn();
			const throttled = throttle(fn, 50);

			throttled("call1");
			throttled("call2");
			throttled("call3");

			expect(fn).toHaveBeenCalledTimes(0);

			await new Promise(resolve => setTimeout(resolve, 60));

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn).toHaveBeenCalledWith("call3");
		});

		it("应该使用最后一次调用的参数", async () => {
			const fn = vi.fn();
			const throttled = throttle(fn, 50);

			throttled("first");
			throttled("second");
			throttled("third");

			await new Promise(resolve => setTimeout(resolve, 60));

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn).toHaveBeenCalledWith("third");
		});

		it("应该在指定的上下文中执行", async () => {
			const context = { value: 42 };
			const fn = vi.fn(function () {
				return this.value;
			});
			const throttled = throttle(fn, 50, context);

			throttled();

			await new Promise(resolve => setTimeout(resolve, 60));

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn.mock.instances[0]).toBe(context);
		});

		it("应该处理多个参数", async () => {
			const fn = vi.fn();
			const throttled = throttle(fn, 50);

			throttled("arg1", "arg2", "arg3");

			await new Promise(resolve => setTimeout(resolve, 60));

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn).toHaveBeenCalledWith("arg1", "arg2", "arg3");
		});

		it("应该在节流期间只保留最后一次调用", async () => {
			const fn = vi.fn();
			const throttled = throttle(fn, 50);

			throttled(1);
			throttled(2);
			throttled(3);

			await new Promise(resolve => setTimeout(resolve, 60));

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn).toHaveBeenCalledWith(3);
		});
	});
});
