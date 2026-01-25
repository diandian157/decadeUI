import { describe, it, expect } from "vitest";
import { CubicBezierEase, ease } from "../../src/animation/easing.js";

describe("animation/easing.js", () => {
	describe("CubicBezierEase", () => {
		it("应该正确初始化", () => {
			const bezier = new CubicBezierEase(0.25, 0.1, 0.25, 1);
			expect(bezier.cX).toBe(0.75);
			expect(bezier.cY).toBeCloseTo(0.3, 10);
		});

		it("边界值测试", () => {
			const bezier = new CubicBezierEase(0.25, 0.1, 0.25, 1);
			expect(bezier.ease(0)).toBeCloseTo(0, 3);
			expect(bezier.ease(1)).toBeCloseTo(1, 3);
		});

		it("应该产生平滑曲线", () => {
			const bezier = new CubicBezierEase(0.25, 0.1, 0.25, 1);
			const values = [0, 0.25, 0.5, 0.75, 1].map(x => bezier.ease(x));
			for (let i = 1; i < values.length; i++) {
				expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
			}
		});
	});

	describe("ease() 默认函数", () => {
		it("应该返回缓动值", () => {
			expect(ease(0)).toBeCloseTo(0, 2);
			expect(ease(1)).toBeCloseTo(1, 2);
			expect(ease(0.5)).toBeGreaterThan(0);
			expect(ease(0.5)).toBeLessThan(1);
		});
	});
});
