import { defineConfig, type PluginOption } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function symlinkToMainProject(): PluginOption {
	return {
		name: "symlink-to-main-project",
		buildStart() {
			const coreDir = path.resolve(__dirname, "../../../apps/core");
			if (!fs.existsSync(coreDir)) return;

			const targetPath = path.resolve(coreDir, "extension/十周年UI");
			const distPath = path.resolve(__dirname, "dist");

			if (fs.existsSync(targetPath)) return;

			fs.mkdirSync(path.dirname(targetPath), { recursive: true });
			fs.symlinkSync(distPath, targetPath, "junction");
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
		symlinkToMainProject(),
	],
	build: {
		sourcemap: false,
		minify: "terser",
		terserOptions: {
			format: {
				comments: false,
			},
			mangle: {
				reserved: ["game", "player", "card", "event", "trigger", "result", "lib", "get", "ui", "ai", "_status"],
			},
		},
		lib: {
			entry: {
				extension: "src/index.ts",
				"src/ui/skillButtonTooltip": "src/ui/skillButtonTooltip.js",
				"ui/constants": "ui/constants.js",
				"ui/utils": "ui/utils.js",
				"ui/lbtn/plugin": "ui/lbtn/plugin.js",
				"ui/lbtn/chatSystem": "ui/lbtn/chatSystem.js",
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
