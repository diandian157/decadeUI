/**
 * @fileoverview config/utils.js 单元测试
 */
import { describe, it, expect, beforeEach } from "vitest";
import { parseInputValue, cardSkinPresets, cardSkinMeta } from "../../src/config/utils.js";

describe("config/utils.js", () => {
	describe("parseInputValue()", () => {
		let mockElement;

		beforeEach(() => {
			mockElement = {
				innerHTML: "",
			};
		});

		it("应该解析有效的整数", () => {
			mockElement.innerHTML = "42";
			const result = parseInputValue(mockElement, 0, 0, 100);

			expect(result).toBe(42);
			expect(mockElement.innerHTML).toBe("42");
		});

		it("应该解析有效的浮点数", () => {
			mockElement.innerHTML = "3.14";
			const result = parseInputValue(mockElement, 0, 0, 10, 2);

			expect(result).toBeCloseTo(3.14, 2);
			expect(mockElement.innerHTML).toBe("3.14");
		});

		it("应该限制最小值", () => {
			mockElement.innerHTML = "-10";
			const result = parseInputValue(mockElement, 0, 0, 100);

			expect(result).toBe(0);
			expect(mockElement.innerHTML).toBe("0");
		});

		it("应该限制最大值", () => {
			mockElement.innerHTML = "150";
			const result = parseInputValue(mockElement, 0, 0, 100);

			expect(result).toBe(100);
			expect(mockElement.innerHTML).toBe("100");
		});

		it("应该处理 NaN（使用默认值）", () => {
			mockElement.innerHTML = "not a number";
			const result = parseInputValue(mockElement, 50, 0, 100);

			expect(result).toBe(50);
			expect(mockElement.innerHTML).toBe("50");
		});

		it("应该处理空字符串（使用默认值）", () => {
			mockElement.innerHTML = "";
			const result = parseInputValue(mockElement, 25, 0, 100);

			expect(result).toBe(25);
			expect(mockElement.innerHTML).toBe("25");
		});

		it("应该移除 <br> 标签", () => {
			mockElement.innerHTML = "42<br>";
			const result = parseInputValue(mockElement, 0, 0, 100);

			expect(result).toBe(42);
			expect(mockElement.innerHTML).not.toContain("<br>");
		});

		it("应该处理小数位数", () => {
			mockElement.innerHTML = "3.14159";
			const result = parseInputValue(mockElement, 0, 0, 10, 2);

			expect(result).toBeCloseTo(3.14, 2);
			expect(mockElement.innerHTML).toBe("3.14");
		});

		it("应该处理零小数位", () => {
			mockElement.innerHTML = "3.7";
			const result = parseInputValue(mockElement, 0, 0, 10, 0);

			expect(result).toBe(3.7);
			expect(mockElement.innerHTML).toBe("3.7");
		});

		it("应该处理负数范围", () => {
			mockElement.innerHTML = "-5";
			const result = parseInputValue(mockElement, 0, -10, 10);

			expect(result).toBe(-5);
			expect(mockElement.innerHTML).toBe("-5");
		});

		it("应该处理边界值（等于 min）", () => {
			mockElement.innerHTML = "0";
			const result = parseInputValue(mockElement, 50, 0, 100);

			expect(result).toBe(0);
		});

		it("应该处理边界值（等于 max）", () => {
			mockElement.innerHTML = "100";
			const result = parseInputValue(mockElement, 50, 0, 100);

			expect(result).toBe(100);
		});

		it("应该处理科学计数法", () => {
			mockElement.innerHTML = "1e2";
			const result = parseInputValue(mockElement, 0, 0, 200);

			expect(result).toBe(100);
		});

		it("应该处理前导零", () => {
			mockElement.innerHTML = "007";
			const result = parseInputValue(mockElement, 0, 0, 100);

			expect(result).toBe(7);
		});
	});

	describe("cardSkinPresets", () => {
		it("应该是一个数组", () => {
			expect(Array.isArray(cardSkinPresets)).toBe(true);
		});

		it("应该包含预期的皮肤", () => {
			expect(cardSkinPresets.length).toBeGreaterThan(0);
		});

		it("每个皮肤应该有必需的属性", () => {
			cardSkinPresets.forEach(skin => {
				expect(skin).toHaveProperty("key");
				expect(skin).toHaveProperty("dir");
				expect(skin).toHaveProperty("label");
				expect(skin).toHaveProperty("extension");

				expect(typeof skin.key).toBe("string");
				expect(typeof skin.dir).toBe("string");
				expect(typeof skin.label).toBe("string");
				expect(typeof skin.extension).toBe("string");
			});
		});

		it("应该包含 online 皮肤", () => {
			const online = cardSkinPresets.find(s => s.key === "online");
			expect(online).toBeDefined();
			expect(online.label).toBe("OL卡牌");
		});

		it("应该包含 decade 皮肤", () => {
			const decade = cardSkinPresets.find(s => s.key === "decade");
			expect(decade).toBeDefined();
			expect(decade.label).toBe("原十周年");
		});

		it("key 应该是唯一的", () => {
			const keys = cardSkinPresets.map(s => s.key);
			const uniqueKeys = new Set(keys);
			expect(keys.length).toBe(uniqueKeys.size);
		});
	});

	describe("cardSkinMeta", () => {
		it("应该是一个对象", () => {
			expect(typeof cardSkinMeta).toBe("object");
			expect(cardSkinMeta).not.toBeNull();
		});

		it("应该包含所有预设皮肤", () => {
			cardSkinPresets.forEach(preset => {
				expect(cardSkinMeta[preset.key]).toBeDefined();
				expect(cardSkinMeta[preset.key]).toEqual(preset);
			});
		});

		it("应该可以通过 key 快速访问", () => {
			expect(cardSkinMeta.online).toBeDefined();
			expect(cardSkinMeta.decade).toBeDefined();
			expect(cardSkinMeta.gold).toBeDefined();
		});

		it("应该保持与 presets 的一致性", () => {
			const metaKeys = Object.keys(cardSkinMeta);
			const presetKeys = cardSkinPresets.map(s => s.key);

			expect(metaKeys.sort()).toEqual(presetKeys.sort());
		});
	});
});
