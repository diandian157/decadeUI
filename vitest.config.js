import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		// 测试环境
		environment: "jsdom",

		// 全局设置
		globals: true,

		// 覆盖率配置
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: [
				// 阶段1：核心模块
				"src/utils/**/*.js",
				"src/animation/easing.js",
				"src/animation/utils.js",
				"src/animation/TimeStep.js",
				"src/config/utils.js",
				// 阶段2：扩展模块
				"src/effects/utils.js",
				"src/core/getters.js",
				"src/features/didYouKnow.js",
			],
			exclude: ["**/*.test.js", "node_modules/**"],
		},

		// 测试文件匹配
		include: ["tests/**/*.test.js"],

		// 测试超时
		testTimeout: 5000,
	},

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			noname: path.resolve(__dirname, "./tests/mocks/noname.js"),
		},
	},
});
