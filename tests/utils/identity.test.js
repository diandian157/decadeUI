import { describe, it, expect, beforeEach } from "vitest";
import { getPlayerIdentity } from "../../src/utils/identity.js";
import { get, _status, createMockPlayer } from "noname";

describe("utils/identity.js", () => {
	describe("getPlayerIdentity()", () => {
		it("应该验证参数", () => {
			expect(() => getPlayerIdentity(null)).toThrow();
			const player = createMockPlayer({ identity: "zhu" });
			expect(() => getPlayerIdentity(player)).not.toThrow();
		});

		describe("identity 模式", () => {
			beforeEach(() => {
				get.mode = () => "identity";
			});

			it("应该返回英文身份", () => {
				const player = createMockPlayer({
					identity: "zhu",
					identityShown: true,
				});
				expect(getPlayerIdentity(player)).toBe("zhu");
			});
		});

		describe("guozhan 模式", () => {
			beforeEach(() => {
				get.mode = () => "guozhan";
			});

			it("应该返回势力", () => {
				const player = createMockPlayer({ identity: "wei" });
				expect(getPlayerIdentity(player)).toBe("wei");
			});
		});

		describe("doudizhu 模式", () => {
			beforeEach(() => {
				get.mode = () => "doudizhu";
			});

			it("应该转换身份", () => {
				const player = createMockPlayer({ identity: "zhu" });
				expect(getPlayerIdentity(player)).toBe("dizhu");
			});
		});

		describe("boss 模式", () => {
			beforeEach(() => {
				get.mode = () => "boss";
			});

			it("应该转换为boss", () => {
				const player = createMockPlayer({ identity: "zhu" });
				expect(getPlayerIdentity(player)).toBe("boss");
			});
		});
	});
});
