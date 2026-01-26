import js from "@eslint/js";
import globals from "globals";

export default [
	{
		ignores: ["**/node_modules/**", "**/dist/**", "**/assets/**", "**/audio/**", "**/image/**", "src/libs/eruda.js", "src/libs/spine.js", "**/coverage/**"],
	},
	js.configs.recommended,
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.es2021,
				...globals.worker,
				// 无名杀全局变量
				lib: "readonly",
				game: "readonly",
				ui: "readonly",
				get: "readonly",
				ai: "readonly",
				_status: "readonly",
				player: "writable",
				card: "writable",
				result: "writable",
				num: "writable",
				// 第三方库
				spine: "readonly",
				eruda: "readonly",
				JSZip: "readonly",
				require: "readonly",
				importScripts: "readonly",
				// 十周年UI全局变量
				decadeUI: "writable",
				decadeUIName: "writable",
				decadeUIPath: "writable",
				decadeModule: "writable",
				app: "writable",
				dcdAnim: "writable",
			},
		},
		rules: {
			// 只保留关键错误
			"no-undef": "error",
			"no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_|^lib$|^game$|^ui$|^get$|^ai$|^player$|^e$",
					caughtErrorsIgnorePattern: "^_|^e$",
				},
			],
			"no-console": "off",
			"no-debugger": "off",
			"no-constant-condition": ["error", { checkLoops: false }],
			"no-empty": ["error", { allowEmptyCatch: true }],
			"no-irregular-whitespace": ["error", { skipStrings: true, skipTemplates: true }],
			"no-useless-escape": "off",
			"no-prototype-builtins": "off",
			"no-self-assign": "off",
			"no-global-assign": "off",

			// 全部关闭，以后有空慢慢改
			"prefer-const": "off",
			"no-var": "off",
			eqeqeq: "off",
			curly: "off",
			"no-fallthrough": "off",

			// 全部关闭，以后有空慢慢改
			semi: "off",
			quotes: "off",
			indent: "off",
			"comma-dangle": "off",
			"no-trailing-spaces": "off",
			"eol-last": "off",
		},
	},
	// 测试文件特殊配置
	{
		files: ["tests/**/*.js", "**/*.test.js", "vitest.config.js"],
		languageOptions: {
			globals: {
				...globals.node,
				global: "writable",
				__dirname: "readonly",
				__filename: "readonly",
			},
		},
	},
];
