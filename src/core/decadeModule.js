/**
 * DecadeModule 初始化模块
 */
import { lib, ui, get } from "noname";
import { createScriptElement, createLinkElement } from "./loader.js";
import { checkVersionCompatibility } from "../utils/version.js";
import { prefixMarkModule } from "../ui/prefixMark.js";

// 排除的游戏模式
const EXCLUDED_MODES = ["chess", "tafang", "hs_hearthstone"];

// 样式配置
const STYLE_OPTIONS = ["on", "off", "othersOff", "onlineUI", "babysha", "codename"];

// 样式到皮肤的映射
const STYLE_TO_SKIN = {
	on: "shizhounian",
	off: "shousha",
	othersOff: "xinsha",
	onlineUI: "online",
	babysha: "baby",
	codename: "codename",
};

// 样式到索引的映射（兼容旧的main*.js命名）
const STYLE_TO_INDEX = {
	on: 2,
	off: 1,
	othersOff: 3,
	onlineUI: 4,
	babysha: 5,
	codename: 6,
};

/**
 * 初始化 decadeModule
 */
export function initDecadeModule() {
	checkVersionCompatibility();

	if (!ui.css.layout) return {};
	if (!ui.css.layout.href?.includes("long2")) {
		ui.css.layout.href = `${lib.assetURL}layout/long2/layout.css`;
	}

	const module = {
		js: path => path && createScriptElement(path, false),
		jsAsync: path => path && createScriptElement(path, true),
		css: path => path && createLinkElement(path),
		modules: [],
		import(mod) {
			if (typeof mod === "function") this.modules.push(mod);
		},
		prefixMark: prefixMarkModule,
	};

	module.init = function () {
		// CSS文件已迁移至 src/styles 目录
		const cssFiles = ["src/styles/extension.css", "src/styles/decadeLayout.css", "src/styles/card.css", "src/styles/meihua.css"];
		cssFiles.forEach(path => this.css(`${decadeUIPath}${path}`));

		const style = lib.config.extension_十周年UI_newDecadeStyle;
		const styleIndex = STYLE_OPTIONS.indexOf(style);
		this.css(`${decadeUIPath}src/styles/player${styleIndex !== -1 ? styleIndex + 1 : 2}.css`);
		this.css(`${decadeUIPath}src/styles/equip.css`);
		this.css(`${decadeUIPath}src/styles/layout.css`);
		document.body.setAttribute("data-style", style ?? "on");

		if (lib.config.extension_十周年UI_meanPrettify) {
			this.css(`${decadeUIPath}src/styles/menu.css`);
		}

		this.jsAsync(`${decadeUIPath}src/libs/spine.js`);

		// 加载样式相关资源
		const currentMode = get.mode();
		const isPhoneLayout = lib.config.phonelayout;

		if (!EXCLUDED_MODES.includes(currentMode)) {
			// 根据皮肤加载对应模块样式
			const skinName = STYLE_TO_SKIN[style] || "shizhounian";

			// 加载基础样式
			const uiPath = `${decadeUIPath}ui/`;
			this.css(`${uiPath}styles/fonts.css`);
			this.css(`${uiPath}styles/base.css`);

			// 加载各模块的皮肤CSS
			this.css(`${uiPath}styles/character/${skinName}.css`);
			this.css(`${uiPath}styles/lbtn/${skinName}.css`);
			this.css(`${uiPath}styles/skill/${skinName}.css`);

			// 非触屏布局加载window样式覆盖
			if (!isPhoneLayout) {
				this.css(`${uiPath}styles/lbtn/window/${skinName}.css`);
				this.css(`${uiPath}styles/skill/window/${skinName}.css`);
			}

			// UI模块JS在content.js中加载
		}

		return this;
	};

	return module.init();
}

export { EXCLUDED_MODES };
