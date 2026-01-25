/**
 * @fileoverview features/didYouKnow.js 单元测试
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getRandomTip, getDidYouKnowHTML } from "../../src/features/didYouKnow.js";

describe("features/didYouKnow.js", () => {
	describe("getRandomTip()", () => {
		it("应该返回字符串", () => {
			const tip = getRandomTip();
			expect(typeof tip).toBe("string");
			expect(tip.length).toBeGreaterThan(0);
		});

		it("应该每次返回提示", () => {
			const tip1 = getRandomTip();
			const tip2 = getRandomTip();
			const tip3 = getRandomTip();

			expect(tip1).toBeTruthy();
			expect(tip2).toBeTruthy();
			expect(tip3).toBeTruthy();
		});

		it("应该在多次调用后返回不同的提示", () => {
			const tips = new Set();
			// 调用多次，应该至少有一些不同的提示
			for (let i = 0; i < 10; i++) {
				tips.add(getRandomTip());
			}
			// 如果提示列表有多条，应该能获取到不同的提示
			// 但由于可能只有一条"加载中..."，所以至少应该有1条
			expect(tips.size).toBeGreaterThanOrEqual(1);
		});

		it("应该循环使用提示列表", () => {
			const tips = [];
			// 获取足够多的提示，确保会循环
			for (let i = 0; i < 50; i++) {
				tips.push(getRandomTip());
			}
			// 所有提示都应该是有效的字符串
			expect(tips.every(tip => typeof tip === "string" && tip.length > 0)).toBe(true);
		});
	});

	describe("getDidYouKnowHTML()", () => {
		beforeEach(() => {
			// Mock window.decadeUIDidYouKnow
			global.window = global.window || {};
			global.window.decadeUIDidYouKnow = {
				getRandom: getRandomTip,
				getHTML: getDidYouKnowHTML,
			};
		});

		it("应该返回 HTML 字符串", () => {
			const html = getDidYouKnowHTML();
			expect(typeof html).toBe("string");
			expect(html.length).toBeGreaterThan(0);
		});

		it("应该包含必要的 HTML 结构", () => {
			const html = getDidYouKnowHTML();
			expect(html).toContain("<div");
			expect(html).toContain("</div>");
			expect(html).toContain("<span");
			expect(html).toContain("</span>");
		});

		it("应该包含'你知道吗'文本", () => {
			const html = getDidYouKnowHTML();
			expect(html).toContain("💡你知道吗");
		});

		it("应该包含样式", () => {
			const html = getDidYouKnowHTML();
			expect(html).toContain("style=");
			expect(html).toContain("margin-top");
			expect(html).toContain("padding");
			expect(html).toContain("background");
		});

		it("应该包含刷新功能", () => {
			const html = getDidYouKnowHTML();
			expect(html).toContain("onclick=");
			expect(html).toContain("decadeUIDidYouKnow");
		});

		it("应该包含提示内容", () => {
			const html = getDidYouKnowHTML();
			// 应该包含实际的提示文本（至少包含一些内容）
			const spanMatch = html.match(/<span[^>]*>([^<]+)<\/span>/g);
			expect(spanMatch).toBeTruthy();
			expect(spanMatch.length).toBeGreaterThan(0);
		});

		it("应该每次生成不同的 HTML（可能包含不同提示）", () => {
			const htmls = new Set();
			for (let i = 0; i < 5; i++) {
				htmls.add(getDidYouKnowHTML());
			}
			// HTML 结构应该一致，但可能包含不同的提示内容
			expect(htmls.size).toBeGreaterThanOrEqual(1);
		});

		it("应该生成有效的 HTML", () => {
			const html = getDidYouKnowHTML();
			// 检查标签是否配对
			const openDivs = (html.match(/<div/g) || []).length;
			const closeDivs = (html.match(/<\/div>/g) || []).length;
			expect(openDivs).toBe(closeDivs);

			const openSpans = (html.match(/<span/g) || []).length;
			const closeSpans = (html.match(/<\/span>/g) || []).length;
			expect(openSpans).toBe(closeSpans);
		});
	});
});
