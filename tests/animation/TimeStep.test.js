/**
 * @fileoverview animation/TimeStep.js 单元测试
 */
import { describe, it, expect, beforeEach } from "vitest";
import { TimeStep } from "../../src/animation/TimeStep.js";

describe("animation/TimeStep.js", () => {
	describe("TimeStep 类", () => {
		describe("构造函数", () => {
			it("应该正确初始化单个数值", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				expect(step.start).toBe(0);
				expect(step.end).toBe(100);
				expect(step.current).toBe(0);
				expect(step.duration).toBe(1000);
				expect(step.time).toBe(0);
				expect(step.percent).toBe(0);
				expect(step.completed).toBe(false);
			});

			it("应该正确初始化数组值", () => {
				const step = new TimeStep({ start: [0, 0], end: [100, 200], duration: 1000 });

				expect(step.start).toEqual([0, 0]);
				expect(step.end).toEqual([100, 200]);
				expect(step.current).toEqual([0, 0]);
			});

			it("应该处理负数", () => {
				const step = new TimeStep({ start: -50, end: 50, duration: 1000 });

				expect(step.start).toBe(-50);
				expect(step.end).toBe(50);
			});
		});

		describe("update() 方法", () => {
			it("应该更新时间和百分比", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(500);

				expect(step.time).toBe(500);
				expect(step.percent).toBeGreaterThan(0);
				expect(step.percent).toBeLessThan(1);
			});

			it("应该更新当前值（单个数值）", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(500);

				expect(step.current).toBeGreaterThan(0);
				expect(step.current).toBeLessThan(100);
			});

			it("应该更新当前值（数组）", () => {
				const step = new TimeStep({ start: [0, 0], end: [100, 200], duration: 1000 });

				step.update(500);

				expect(Array.isArray(step.current)).toBe(true);
				expect(step.current[0]).toBeGreaterThan(0);
				expect(step.current[0]).toBeLessThan(100);
				expect(step.current[1]).toBeGreaterThan(0);
				expect(step.current[1]).toBeLessThan(200);
			});

			it("应该在完成时设置 completed 标志", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(1000);

				expect(step.completed).toBe(true);
			});

			it("应该在超过持续时间时设置 completed", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(1500);

				expect(step.completed).toBe(true);
			});

			it("应该支持多次更新", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(250);
				expect(step.time).toBe(250);

				step.update(250);
				expect(step.time).toBe(500);

				step.update(500);
				expect(step.time).toBe(1000);
				expect(step.completed).toBe(true);
			});

			it("应该使用缓动函数", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(500);

				// 使用 ease-out 曲线，中点应该大于线性插值的 50
				expect(step.current).toBeGreaterThan(50);
			});

			it("应该在完成时接近结束值", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(1000);

				expect(step.current).toBeCloseTo(100, 1);
			});

			it("应该处理零持续时间", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 0 });

				step.update(0);

				expect(step.completed).toBe(true);
			});

			it("应该处理负数范围", () => {
				const step = new TimeStep({ start: -100, end: -50, duration: 1000 });

				step.update(500);

				expect(step.current).toBeGreaterThan(-100);
				expect(step.current).toBeLessThan(-50);
			});

			it("应该处理反向动画（start > end）", () => {
				const step = new TimeStep({ start: 100, end: 0, duration: 1000 });

				step.update(500);

				expect(step.current).toBeGreaterThan(0);
				expect(step.current).toBeLessThan(100);
			});
		});

		describe("边界情况", () => {
			it("应该处理极小的 delta", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(1);

				expect(step.time).toBe(1);
				expect(step.current).toBeGreaterThan(0);
			});

			it("应该处理极大的 delta", () => {
				const step = new TimeStep({ start: 0, end: 100, duration: 1000 });

				step.update(10000);

				expect(step.completed).toBe(true);
			});

			it("应该处理 start === end", () => {
				const step = new TimeStep({ start: 50, end: 50, duration: 1000 });

				step.update(500);

				expect(step.current).toBeCloseTo(50, 5);
			});

			it("应该处理混合类型（start 是数值，end 是数组）", () => {
				const step = new TimeStep({ start: 0, end: [100, 200], duration: 1000 });

				step.update(500);

				expect(Array.isArray(step.current)).toBe(true);
			});
		});
	});
});
