/**
 * @fileoverview DecadeModule初始化模块，负责加载样式和资源
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { createScriptElement, createLinkElement } from "./loader.js";
import { checkVersionCompatibility } from "../utils/version.js";
import { prefixMarkModule } from "../ui/prefixMark.js";

/** @type {Array<string>} 排除的游戏模式 */
const EXCLUDED_MODES = ["chess", "tafang", "hs_hearthstone"];

/** @type {Array<string>} 样式配置选项 */
const STYLE_OPTIONS = ["on", "off", "othersOff", "onlineUI", "babysha", "codename"];

/** @type {Object<string, string>} 样式到皮肤的映射 */
const STYLE_TO_SKIN = {
	on: "shizhounian",
	off: "shousha",
	othersOff: "xinsha",
	onlineUI: "online",
	babysha: "baby",
	codename: "codename",
};

/** @type {Object<string, number>} 样式到索引的映射 */
const STYLE_TO_INDEX = {
	on: 2,
	off: 1,
	othersOff: 3,
	onlineUI: 4,
	babysha: 5,
	codename: 6,
};

/**
 * 获取配置项值
 * @param {string} key - 配置键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
function getConfigValue(key, defaultValue) {
	const configKey = `extension_十周年UI_${key}`;
	const value = lib.config[configKey];
	return value !== undefined ? value : defaultValue;
}

/**
 * 初始化decadeModule
 * @returns {Object} 模块对象
 */
export function initDecadeModule() {
	checkVersionCompatibility();

	if (!ui.css.layout) return {};
	if (!ui.css.layout.href?.includes("long2")) {
		ui.css.layout.href = `${lib.assetURL}layout/long2/layout.css`;
	}

	const module = {
		/**
		 * 加载JS文件
		 * @param {string} path - 文件路径
		 * @returns {HTMLScriptElement|null} script元素
		 */
		js: path => path && createScriptElement(path, false),
		/**
		 * 异步加载JS文件
		 * @param {string} path - 文件路径
		 * @returns {HTMLScriptElement|null} script元素
		 */
		jsAsync: path => path && createScriptElement(path, true),
		/**
		 * 加载CSS文件
		 * @param {string} path - 文件路径
		 * @returns {HTMLLinkElement|null} link元素
		 */
		css: path => path && createLinkElement(path),
		/** @type {Array<Function>} 模块列表 */
		modules: [],
		/**
		 * 导入模块
		 * @param {Function} mod - 模块函数
		 */
		import(mod) {
			if (typeof mod === "function") this.modules.push(mod);
		},
		prefixMark: prefixMarkModule,
	};

	/**
	 * 初始化模块
	 * @returns {Promise<Object>} this
	 */
	module.init = async function () {
		const cssFiles = ["src/styles/extension.css", "src/styles/decadeLayout.css", "src/styles/card.css", "src/styles/meihua.css"];
		cssFiles.forEach(path => this.css(`${decadeUIPath}${path}`));

		const style = getConfigValue("newDecadeStyle", "on");
		const styleIndex = STYLE_OPTIONS.indexOf(style);
		this.css(`${decadeUIPath}src/styles/player${styleIndex !== -1 ? styleIndex + 1 : 2}.css`);
		this.css(`${decadeUIPath}src/styles/equip.css`);
		this.css(`${decadeUIPath}src/styles/layout.css`);
		document.body.setAttribute("data-style", style);

		if (getConfigValue("meanPrettify", false)) {
			ui.css.decadeMenu = this.css(`${decadeUIPath}src/styles/menu.css`);
		}

		const currentMode = get.mode();
		const isPhoneLayout = lib.config.phonelayout;

		if (!EXCLUDED_MODES.includes(currentMode)) {
			const skinName = STYLE_TO_SKIN[style] || "shizhounian";
			const uiPath = `${decadeUIPath}ui/`;

			this.css(`${uiPath}styles/fonts.css`);
			this.css(`${uiPath}styles/base.css`);
			this.css(`${uiPath}styles/character/${skinName}.css`);
			this.css(`${uiPath}styles/lbtn/${skinName}.css`);
			this.css(`${uiPath}styles/skill/${skinName}.css`);

			if (!isPhoneLayout) {
				this.css(`${uiPath}styles/lbtn/window/${skinName}.css`);
				this.css(`${uiPath}styles/skill/window/${skinName}.css`);
			}
		}

		// 初始化亮将钩子
		this.prefixMark.setupShowCharacterHook();

		return this;
	};

	return module.init();
}

export { EXCLUDED_MODES };
