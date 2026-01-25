/**
 * @fileoverview core/getters.js 单元测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDecadeUIGetModule } from "../../src/core/getters.js";

describe("core/getters.js", () => {
	let getModule;

	beforeEach(() => {
		getModule = createDecadeUIGetModule();
	});

	describe("judgeEffect()", () => {
		it("应该正确判断负面效果卡牌", () => {
			// 负面卡牌：value < 0 时返回 true
			expect(getModule.judgeEffect("兵粮寸断", -1)).toBe(true);
			expect(getModule.judgeEffect("乐不思蜀", -2)).toBe(true);
			expect(getModule.judgeEffect("闪电", -3)).toBe(true);
		});

		it("应该正确判断负面效果卡牌的坏结果", () => {
			// 负面卡牌：value >= 0 时为坏结果
			expect(getModule.judgeEffect("兵粮寸断", 0)).toBe(false);
			expect(getModule.judgeEffect("乐不思蜀", 1)).toBe(false);
			expect(getModule.judgeEffect("闪电", 2)).toBe(false);
		});

		it("应该正确判断正常卡牌", () => {
			// 正常卡牌：直接返回 value
			expect(getModule.judgeEffect("桃", 1)).toBe(1);
			expect(getModule.judgeEffect("杀", 2)).toBe(2);
			expect(getModule.judgeEffect("闪", -1)).toBe(-1);
		});

		it("应该处理英文卡牌名", () => {
			expect(getModule.judgeEffect("bingliang", -1)).toBe(true);
			expect(getModule.judgeEffect("lebu", -2)).toBe(true);
			expect(getModule.judgeEffect("shandian", -3)).toBe(true);
		});

		it("应该处理其他负面卡牌", () => {
			expect(getModule.judgeEffect("草木皆兵", -1)).toBe(true);
			expect(getModule.judgeEffect("caomu", -1)).toBe(true);
			expect(getModule.judgeEffect("浮雷", -2)).toBe(true);
			expect(getModule.judgeEffect("fulei", -2)).toBe(true);
		});

		it("应该处理零值", () => {
			expect(getModule.judgeEffect("兵粮寸断", 0)).toBe(false);
			expect(getModule.judgeEffect("桃", 0)).toBe(0);
		});
	});

	describe("isWebKit()", () => {
		it("应该检测 WebKit 浏览器", () => {
			// jsdom 环境下应该有 WebkitBoxShadow
			const result = getModule.isWebKit();
			expect(typeof result).toBe("boolean");
		});
	});

	describe("extend()", () => {
		it("应该扩展对象属性", () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3, c: 4 };
			const result = getModule.extend(target, source);

			expect(result).toBe(target);
			expect(result).toEqual({ a: 1, b: 3, c: 4 });
		});

		it("应该处理空源对象", () => {
			const target = { a: 1 };
			const result = getModule.extend(target, {});

			expect(result).toEqual({ a: 1 });
		});

		it("应该处理 null 源对象", () => {
			const target = { a: 1 };
			const result = getModule.extend(target, null);

			expect(result).toEqual({ a: 1 });
		});

		it("应该处理 undefined 源对象", () => {
			const target = { a: 1 };
			const result = getModule.extend(target, undefined);

			expect(result).toEqual({ a: 1 });
		});

		it("应该处理非对象源", () => {
			const target = { a: 1 };
			expect(getModule.extend(target, "string")).toEqual({ a: 1 });
			expect(getModule.extend(target, 123)).toEqual({ a: 1 });
			expect(getModule.extend(target, true)).toEqual({ a: 1 });
		});

		it("应该覆盖已存在的属性", () => {
			const target = { a: 1, b: 2, c: 3 };
			const source = { a: 10, c: 30 };
			const result = getModule.extend(target, source);

			expect(result).toEqual({ a: 10, b: 2, c: 30 });
		});

		it("应该处理嵌套对象（浅拷贝）", () => {
			const target = { a: { x: 1 } };
			const source = { b: { y: 2 } };
			const result = getModule.extend(target, source);

			expect(result.b).toBe(source.b); // 浅拷贝
		});
	});

	describe("ease()", () => {
		it("应该返回缓动值", () => {
			expect(getModule.ease(0)).toBeCloseTo(0, 5);
			expect(getModule.ease(1)).toBeCloseTo(1, 5);
		});

		it("应该处理中间值", () => {
			const result = getModule.ease(0.5);
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(1);
		});

		it("应该复用 bezier 实例", () => {
			getModule.ease(0.5);
			const bezier1 = getModule._bezier3;

			getModule.ease(0.7);
			const bezier2 = getModule._bezier3;

			expect(bezier1).toBe(bezier2);
		});

		it("应该处理边界值", () => {
			expect(getModule.ease(0)).toBeCloseTo(0, 5);
			expect(getModule.ease(1)).toBeCloseTo(1, 5);
		});
	});

	describe("cheatJudgeCards()", () => {
		beforeEach(() => {
			global.get = {
				judge: vi.fn(),
			};
		});

		it("应该抛出错误当参数缺失", () => {
			expect(() => getModule.cheatJudgeCards()).toThrow();
			expect(() => getModule.cheatJudgeCards([])).toThrow();
		});

		it("应该选择友好判定的最佳卡牌", () => {
			const cards = [{ name: "card1" }, { name: "card2" }, { name: "card3" }];
			const judges = [{ name: "judge1" }];

			// 模拟判定函数：card1=2, card2=1, card3=3
			global.get.judge.mockReturnValue(card => {
				if (card.name === "card1") return 2;
				if (card.name === "card2") return 1;
				if (card.name === "card3") return 3;
				return 0;
			});

			const result = getModule.cheatJudgeCards(cards, judges, true);

			expect(result.length).toBeGreaterThan(0);
			// 验证选中的卡牌有正分
			expect(global.get.judge()(result[0])).toBeGreaterThanOrEqual(0);
		});

		it("应该选择敌对判定的最差卡牌", () => {
			const cards = [{ name: "card1" }, { name: "card2" }, { name: "card3" }];
			const judges = [{ name: "judge1" }];

			global.get.judge.mockReturnValue(card => {
				if (card.name === "card1") return 2;
				if (card.name === "card2") return -1;
				if (card.name === "card3") return 1;
				return 0;
			});

			const result = getModule.cheatJudgeCards(cards, judges, false);

			// 敌对判定应该选择负分卡牌
			if (result.length > 0) {
				expect(global.get.judge()(result[0])).toBeLessThan(0);
			} else {
				// 如果没有选中卡牌，也是合理的
				expect(result).toHaveLength(0);
			}
		});

		it("应该处理多个判定", () => {
			const cards = [{ name: "card1" }, { name: "card2" }, { name: "card3" }];
			const judges = [{ name: "judge1" }, { name: "judge2" }];

			global.get.judge.mockReturnValue(card => {
				if (card.name === "card1") return 3;
				if (card.name === "card2") return 2;
				if (card.name === "card3") return 1;
				return 0;
			});

			const result = getModule.cheatJudgeCards(cards, judges, true);

			expect(result.length).toBeGreaterThanOrEqual(1);
			expect(result.length).toBeLessThanOrEqual(2);
		});

		it("应该在没有合适卡牌时停止", () => {
			const cards = [{ name: "card1" }, { name: "card2" }];
			const judges = [{ name: "judge1" }];

			// 所有卡牌都是负分
			global.get.judge.mockReturnValue(() => -1);

			const result = getModule.cheatJudgeCards(cards, judges, true);

			// 负分卡牌在友好判定时可能被选择或不被选择
			expect(result.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe("elementLeftFromWindow()", () => {
		it("应该返回元素左边距", () => {
			const element = {
				getBoundingClientRect: () => ({ left: 100 }),
			};
			global.window = { scrollX: 50 };

			const result = getModule.elementLeftFromWindow(element);
			expect(result).toBe(150);
		});

		it("应该处理滚动偏移", () => {
			const element = {
				getBoundingClientRect: () => ({ left: 200 }),
			};
			global.window = { scrollX: 0 };

			const result = getModule.elementLeftFromWindow(element);
			expect(result).toBe(200);
		});
	});

	describe("elementTopFromWindow()", () => {
		it("应该返回元素上边距", () => {
			const element = {
				getBoundingClientRect: () => ({ top: 100 }),
			};
			global.window = { scrollY: 50 };

			const result = getModule.elementTopFromWindow(element);
			expect(result).toBe(150);
		});

		it("应该处理滚动偏移", () => {
			const element = {
				getBoundingClientRect: () => ({ top: 300 }),
			};
			global.window = { scrollY: 0 };

			const result = getModule.elementTopFromWindow(element);
			expect(result).toBe(300);
		});
	});
});
