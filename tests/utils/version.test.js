/**
 * @fileoverview version.js 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compareVersions, checkVersionCompatibility } from "../../src/utils/version.js";
import { lib, game } from "noname";

describe("utils/version.js", () => {
	describe("compareVersions()", () => {
		describe("相等情况", () => {
			it("应该识别完全相同的版本号", () => {
				expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
				expect(compareVersions("2.5.3", "2.5.3")).toBe(0);
				expect(compareVersions("10.20.30", "10.20.30")).toBe(0);
			});

			it("应该识别补零后相等的版本号", () => {
				expect(compareVersions("1.0", "1.0.0")).toBe(0);
				expect(compareVersions("2.5", "2.5.0.0")).toBe(0);
				expect(compareVersions("1", "1.0.0")).toBe(0);
			});
		});

		describe("大于情况", () => {
			it("应该识别主版本号更大", () => {
				expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
				expect(compareVersions("10.0.0", "9.0.0")).toBe(1);
			});

			it("应该识别次版本号更大", () => {
				expect(compareVersions("1.2.0", "1.1.0")).toBe(1);
				expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
			});

			it("应该识别补丁版本号更大", () => {
				expect(compareVersions("1.0.2", "1.0.1")).toBe(1);
				expect(compareVersions("1.0.10", "1.0.9")).toBe(1);
			});

			it("应该正确处理不同长度的版本号", () => {
				expect(compareVersions("1.1", "1.0.9")).toBe(1);
				expect(compareVersions("2.0", "1.9.9.9")).toBe(1);
			});
		});

		describe("小于情况", () => {
			it("应该识别主版本号更小", () => {
				expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
				expect(compareVersions("9.0.0", "10.0.0")).toBe(-1);
			});

			it("应该识别次版本号更小", () => {
				expect(compareVersions("1.1.0", "1.2.0")).toBe(-1);
				expect(compareVersions("1.9.0", "1.10.0")).toBe(-1);
			});

			it("应该识别补丁版本号更小", () => {
				expect(compareVersions("1.0.1", "1.0.2")).toBe(-1);
				expect(compareVersions("1.0.9", "1.0.10")).toBe(-1);
			});

			it("应该正确处理不同长度的版本号", () => {
				expect(compareVersions("1.0.9", "1.1")).toBe(-1);
				expect(compareVersions("1.9.9.9", "2.0")).toBe(-1);
			});
		});

		describe("边界情况", () => {
			it("应该处理单段版本号", () => {
				expect(compareVersions("1", "2")).toBe(-1);
				expect(compareVersions("2", "1")).toBe(1);
				expect(compareVersions("5", "5")).toBe(0);
			});

			it("应该处理两段版本号", () => {
				expect(compareVersions("1.5", "1.6")).toBe(-1);
				expect(compareVersions("2.0", "1.9")).toBe(1);
			});

			it("应该处理多段版本号", () => {
				expect(compareVersions("1.2.3.4.5", "1.2.3.4.6")).toBe(-1);
				expect(compareVersions("1.0.0.0.1", "1.0.0.0.0")).toBe(1);
			});

			it("应该处理零版本号", () => {
				expect(compareVersions("0.0.0", "0.0.1")).toBe(-1);
				expect(compareVersions("0.1.0", "0.0.9")).toBe(1);
			});
		});

		describe("实际版本号测试", () => {
			it("应该正确比较无名杀常见版本号", () => {
				expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
				expect(compareVersions("1.10.5", "1.10.4")).toBe(1);
				expect(compareVersions("1.11.1", "1.10.9")).toBe(1);
			});
		});
	});

	describe("checkVersionCompatibility()", () => {
		let confirmSpy;
		let consoleLogSpy;
		let setTimeoutSpy;

		beforeEach(() => {
			// Mock confirm
			confirmSpy = vi.spyOn(global, "confirm").mockReturnValue(true);
			// Mock console
			consoleLogSpy = vi.spyOn(game, "print").mockImplementation(() => {});
			// Mock setTimeout
			setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation(fn => fn());
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("版本相等时不应该弹出提示", () => {
			lib.version = "1.10.0";
			lib.extensionPack.十周年UI.minNonameVersion = "1.10.0";

			checkVersionCompatibility();

			expect(confirmSpy).not.toHaveBeenCalled();
		});

		it("当前版本低于要求版本时应该提示更新无名杀", () => {
			lib.version = "1.9.0";
			lib.extensionPack.十周年UI.minNonameVersion = "1.10.0";

			checkVersionCompatibility();

			expect(confirmSpy).toHaveBeenCalled();
			const confirmMessage = confirmSpy.mock.calls[0][0];
			expect(confirmMessage).toContain("请更新无名杀");
			expect(confirmMessage).toContain("1.10.0");
			expect(confirmMessage).toContain("1.9.0");
		});

		it("当前版本高于要求版本时应该提示更新十周年UI", () => {
			lib.version = "1.11.0";
			lib.extensionPack.十周年UI.minNonameVersion = "1.10.0";

			checkVersionCompatibility();

			expect(confirmSpy).toHaveBeenCalled();
			const confirmMessage = confirmSpy.mock.calls[0][0];
			expect(confirmMessage).toContain("请更新十周年UI");
			expect(confirmMessage).toContain("1.11.0");
		});

		it("用户确认后应该打印日志", () => {
			confirmSpy.mockReturnValue(true);
			lib.version = "1.9.0";
			lib.extensionPack.十周年UI.minNonameVersion = "1.10.0";

			checkVersionCompatibility();

			expect(consoleLogSpy).toHaveBeenCalledWith("已确认版本不匹配，继续游戏...");
		});

		it("应该使用 setTimeout 延迟弹窗", () => {
			lib.version = "1.9.0";
			lib.extensionPack.十周年UI.minNonameVersion = "1.10.0";

			checkVersionCompatibility();

			expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
		});
	});
});
