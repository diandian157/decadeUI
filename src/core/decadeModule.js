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
const STYLE_MAP = { on: 2, off: 1, othersOff: 3, onlineUI: 4, babysha: 5, codename: 6 };

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
		// CSS文件已迁移至 src/css 目录
		const cssFiles = ["src/css/extension.css", "src/css/decadeLayout.css", "src/css/card.css", "src/css/meihua.css"];
		cssFiles.forEach(path => this.css(`${decadeUIPath}${path}`));

		const style = lib.config.extension_十周年UI_newDecadeStyle;
		const styleIndex = STYLE_OPTIONS.indexOf(style);
		this.css(`${decadeUIPath}src/css/player${styleIndex !== -1 ? styleIndex + 1 : 2}.css`);
		this.css(`${decadeUIPath}src/css/equip.css`);
		this.css(`${decadeUIPath}src/css/layout.css`);
		document.body.setAttribute("data-style", style ?? "on");

		if (lib.config.extension_十周年UI_meanPrettify) {
			this.css(`${decadeUIPath}src/css/menu.css`);
		}

		this.jsAsync(`${decadeUIPath}src/libs/spine.js`);

		// 加载样式相关资源
		const layoutPath = `${decadeUIPath}shoushaUI/`;
		const listmap = STYLE_MAP[style] ?? 2;
		const currentMode = get.mode();

		if (!EXCLUDED_MODES.includes(currentMode)) {
			["character", "lbtn", "skill"].forEach(pack => {
				const cssPath = pack === "character" ? `${layoutPath}${pack}/main${listmap}.css` : `${layoutPath}${pack}/main${listmap}${lib.config.phonelayout ? "" : "_window"}.css`;
				this.css(cssPath);
				this.jsAsync(`${layoutPath}${pack}/main${listmap}.js`);
			});
		}

		return this;
	};

	return module.init();
}

export { EXCLUDED_MODES };
