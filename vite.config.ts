import { defineConfig, type PluginOption } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

// 构建后复制到主项目扩展目录
function copyToMainProject(): PluginOption {
	return {
		name: "copy-to-main-project",
		async closeBundle() {
			try {
				const mainProjectDir = path.resolve(__dirname, "../../../apps/core/extension");
				if (!fs.existsSync(path.resolve(__dirname, "../../../apps/core"))) return;

				const distPath = path.resolve(__dirname, "dist");
				const targetPath = path.join(mainProjectDir, "十周年UI");

				if (process.platform === "win32") {
					await execAsync(`robocopy "${distPath}" "${targetPath}" /E /IS /IT /PURGE`).catch(() => {});
				} else {
					if (fs.existsSync(targetPath)) {
						await fs.promises.rm(targetPath, { recursive: true, force: true });
					}
					await fs.promises.cp(distPath, targetPath, { recursive: true });
				}
			} catch (error) {}
		},
	};
}

export default defineConfig(({ mode }) => ({
	define: {
		"process.env.NODE_ENV": JSON.stringify(mode),
	},
	plugins: [
		viteStaticCopy({
			targets: [
				{ src: "src/libs", dest: "src" },
				{ src: "src/styles", dest: "src" },
				{ src: "src/config/*.css", dest: "src/config" },
				{ src: "src/features/*.css", dest: "src/features" },
				{ src: "src/features/*.txt", dest: "src/features" },
				{ src: "src/skins/dynamicSkin.js", dest: "src/skins" },
				{ src: "assets", dest: "" },
				{ src: "audio", dest: "" },
				{ src: "image", dest: "" },
				{ src: "ui/assets", dest: "ui" },
				{ src: "ui/styles", dest: "ui" },
				{ src: "ui/character/skins/*.js", dest: "ui/character/skins" },
				{ src: "ui/skill/skins/*.js", dest: "ui/skill/skins" },
				{ src: "ui/lbtn/skins/*.js", dest: "ui/lbtn/skins" },
				{ src: "docs", dest: "" },
				{ src: "info.json", dest: "" },
				{ src: "LICENSE", dest: "" },
				{ src: "README.md", dest: "" },
			],
		}) as PluginOption,
		copyToMainProject(),
	],
	build: {
		sourcemap: false,
		minify: "terser",
		terserOptions: {
			format: {
				comments: false,
			},
		},
		lib: {
			entry: {
				extension: "src/index.ts",
				"src/ui/skillButtonTooltip": "src/ui/skillButtonTooltip.js",
				"ui/constants": "ui/constants.js",
				"ui/utils": "ui/utils.js",
				"ui/lbtn/plugin": "ui/lbtn/plugin.js",
				"ui/skill/plugin": "ui/skill/plugin.js",
				"ui/character/plugin": "ui/character/plugin.js",
			},
			formats: ["es"],
		},
		outDir: `dist`,
		emptyOutDir: true,
		rollupOptions: {
			preserveEntrySignatures: "strict",
			external: ["noname", /src\/skins\/dynamicSkin\.js$/],
			output: {
				preserveModules: true,
				preserveModulesRoot: "./",
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				assetFileNames: "[name][extname]",
			},
		},
	},
}));
