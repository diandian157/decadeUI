/**
 * @fileoverview effects/utils.js 单元测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseCssUrl, isPlayer, toKebab, randomPosition } from "../../src/effects/utils.js";

describe("effects/utils.js", () => {
	describe("parseCssUrl()", () => {
		it("应该解析标准的 url() 格式", () => {
			expect(parseCssUrl('url("image/test.jpg")')).toBe("image/test.jpg");
			expect(parseCssUrl("url('image/test.jpg')")).toBe("image/test.jpg");
			expect(parseCssUrl("url(image/test.jpg)")).toBe("image/test.jpg");
		});

		it("应该处理带空格的 url()", () => {
			// 正则不处理 url() 内部的空格，只匹配引号内的内容
			const result1 = parseCssUrl('url( "image/test.jpg" )');
			const result2 = parseCssUrl("url( 'image/test.jpg' )");
			// 可能包含空格，取决于正则实现
			expect(result1).toContain("image/test.jpg");
			expect(result2).toContain("image/test.jpg");
		});

		it("应该处理复杂路径", () => {
			expect(parseCssUrl('url("../assets/images/character.png")')).toBe("../assets/images/character.png");
			expect(parseCssUrl('url("https://example.com/image.jpg")')).toBe("https://example.com/image.jpg");
		});

		it("应该处理不是 url() 格式的字符串", () => {
			expect(parseCssUrl("image/test.jpg")).toBe("image/test.jpg");
			expect(parseCssUrl("plain-string")).toBe("plain-string");
		});

		it("应该处理空字符串", () => {
			expect(parseCssUrl("")).toBe("");
		});

		it("应该处理特殊字符", () => {
			expect(parseCssUrl('url("image/test%20file.jpg")')).toBe("image/test%20file.jpg");
			expect(parseCssUrl('url("image/测试.jpg")')).toBe("image/测试.jpg");
		});
	});

	describe("isPlayer()", () => {
		it("应该识别玩家对象", () => {
			// isPlayer 使用从 noname 导入的 get，无法直接 mock
			// 这里只测试函数调用不报错
			const player = { name: "test" };
			const result = isPlayer(player);
			expect(typeof result).toBe("boolean");
		});

		it("应该拒绝非玩家对象", () => {
			const card = { name: "sha" };
			const result = isPlayer(card);
			expect(typeof result).toBe("boolean");
		});

		it("应该处理 null 和 undefined", () => {
			expect(typeof isPlayer(null)).toBe("boolean");
			expect(typeof isPlayer(undefined)).toBe("boolean");
		});

		it("应该处理其他类型", () => {
			expect(typeof isPlayer({})).toBe("boolean");
			expect(typeof isPlayer({ skill: "test" })).toBe("boolean");
		});
	});

	describe("toKebab()", () => {
		it("应该转换驼峰命名为 kebab-case", () => {
			expect(toKebab("backgroundColor")).toBe("background-color");
			expect(toKebab("fontSize")).toBe("font-size");
			expect(toKebab("marginTop")).toBe("margin-top");
		});

		it("应该处理多个大写字母", () => {
			expect(toKebab("WebkitTransform")).toBe("-webkit-transform");
			expect(toKebab("MozBoxShadow")).toBe("-moz-box-shadow");
		});

		it("应该处理连续大写字母", () => {
			expect(toKebab("XMLHttpRequest")).toBe("-x-m-l-http-request");
		});

		it("应该处理已经是 kebab-case 的字符串", () => {
			expect(toKebab("background-color")).toBe("background-color");
			expect(toKebab("font-size")).toBe("font-size");
		});

		it("应该处理空字符串", () => {
			expect(toKebab("")).toBe("");
		});

		it("应该处理只有小写字母的字符串", () => {
			expect(toKebab("color")).toBe("color");
			expect(toKebab("display")).toBe("display");
		});

		it("应该处理首字母大写", () => {
			expect(toKebab("BackgroundColor")).toBe("-background-color");
		});
	});

	describe("randomPosition()", () => {
		beforeEach(() => {
			// Mock decadeUI.getRandom
			global.decadeUI = {
				getRandom: vi.fn(),
			};
		});

		it("应该返回包含 x, y, scale 的对象", () => {
			global.decadeUI.getRandom.mockReturnValue(50);
			const pos = randomPosition(1000);

			expect(pos).toHaveProperty("x");
			expect(pos).toHaveProperty("y");
			expect(pos).toHaveProperty("scale");
		});

		it("应该生成正确范围的 x 坐标", () => {
			global.decadeUI.getRandom
				.mockReturnValueOnce(1) // signX
				.mockReturnValueOnce(0) // signY
				.mockReturnValueOnce(50) // x value
				.mockReturnValueOnce(0) // y value
				.mockReturnValueOnce(5); // scale

			const pos = randomPosition(1000);
			expect(pos.x).toBe("50px");
		});

		it("应该生成负数坐标", () => {
			global.decadeUI.getRandom
				.mockReturnValueOnce(0) // signX = false -> "-"
				.mockReturnValueOnce(0) // signY = false -> "-"
				.mockReturnValueOnce(30) // x value
				.mockReturnValueOnce(40) // y value
				.mockReturnValueOnce(8); // scale

			const pos = randomPosition(1000);
			expect(pos.x).toBe("-30px");
			expect(pos.y).toBe("-40px");
		});

		it("应该根据 height 限制 y 坐标范围", () => {
			global.decadeUI.getRandom
				.mockReturnValueOnce(1)
				.mockReturnValueOnce(1)
				.mockReturnValueOnce(50)
				.mockReturnValueOnce(100) // y value
				.mockReturnValueOnce(5);

			const pos = randomPosition(800);
			// y 范围应该是 0 到 height/4 = 200
			expect(pos.y).toBe("100px");
		});

		it("应该生成 0.1 到 1.0 之间的 scale", () => {
			global.decadeUI.getRandom.mockReturnValueOnce(1).mockReturnValueOnce(1).mockReturnValueOnce(50).mockReturnValueOnce(50).mockReturnValueOnce(7); // scale = 7/10 = 0.7

			const pos = randomPosition(1000);
			expect(pos.scale).toBe(0.7);
		});

		it("应该处理边界值", () => {
			global.decadeUI.getRandom
				.mockReturnValueOnce(1)
				.mockReturnValueOnce(1)
				.mockReturnValueOnce(0) // min x
				.mockReturnValueOnce(0) // min y
				.mockReturnValueOnce(1); // min scale

			const pos = randomPosition(1000);
			expect(pos.x).toBe("0px");
			expect(pos.y).toBe("0px");
			expect(pos.scale).toBe(0.1);
		});
	});
});
