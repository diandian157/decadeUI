/**
 * @fileoverview 前缀角标模块
 * 根据武将前缀显示对应的角标样式
 * 提供三个接口支持外部扩展：
 * - registerPrefix(prefix, styleName) - 注册单个前缀
 * - registerPrefixes(configs) - 批量注册
 * - hasPrefix(prefix) - 检查前缀是否存在
 */

import { lib, game, ui, get, ai, _status } from "noname";

// ==================== 前缀配置映射 ====================

/** @type {Record<string, string>} 前缀到样式名的映射 */
const PREFIX_CONFIGS = {
	界: "jie",
	神: "shen",
	武: "wu",
	族: "clan",
	标: "std",
	乐: "yue",
	谋: "sb",
	SP: "sp",
	OL: "ol",
	TW: "tw",
	星: "star",
	"☆": "star",
	"★": "star",
	新杀: "dc",
	新杀谋: "sb",
	"新杀|牢": "lao",
	OL谋: "sb",
	OL界: "jie",
	OL神: "shen",
	OL乐: "yue",
	OL汉: "han",
	手杀: "mb",
	手杀SP: "mb",
	手杀界: "jie",
	手杀神: "shen",
	手杀乐: "yue",
	"手杀|牢": "lao",
	"手杀|SP": "sp",
	手杀合: "he",
	TW谋: "sb",
	TW神: "shen",
	"TW|起": "jsrg",
	旧: "old",
	旧神: "old",
	旧晋: "old",
	毅重: "old",
	节钺: "old",
	"旧|OL": "old",
	"旧|神": "old",
	"旧|界": "old",
	"旧|谋": "old",
	"旧|幻": "old",
	"旧|势": "old",
	"旧|☆": "old",
	"旧|SP": "old",
	"旧|友": "old",
	"旧|族": "old",
	"旧|星": "old",
	"旧|威": "old",
	"旧|武": "old",
	"旧|侠": "old",
	"旧|起": "old",
	"旧|玄": "old",
	"旧|魔": "old",
	牢: "lao",
	"牢|爻": "lao",
	"牢|神": "lao",
	"牢|SP": "lao",
	"牢|谋": "lao",
	微信: "wei",
	"微信|牢": "lao",
	"微信|神": "shen",
	"微信|☆": "star",
	"微信|谋": "sb",
	"微信|界": "jie",
	"SP|微信": "sp",
	"SP|微信|神": "shen",
	欢杀: "Mbaby",
	"欢杀|神": "shen",
	"欢杀|谋": "sb",
	"欢杀|星": "star",
	"SP|欢杀": "sp",
	"SP|欢杀|神": "shen",
	"欢杀|界": "jie",
	极: "ji",
	极略SK: "sk",
	"极略★SK": "sk",
	极略SK神: "shen",
	极略SP神: "shen",
	极略SR: "sr",
	界SP: "jie",
	爻: "yao",
	魔: "dm",
	"TW|魔": "dm",
	闪: "shan",
	晋: "jin",
	威: "v",
	玄: "xuan",
	势: "pot",
	友: "you",
	幻: "huan",
	起: "jsrg",
	经典: "jd",
	经典神: "shen",
	忍: "ren",
	有: "nailong",
	烈: "lie",
	韩氏: "hanshi",
	魂: "hun",
	汉: "han",
	狂: "kuang",
	喵: "miao",
	念: "nian",
	战: "zhan",
	战役篇: "zhan",
	战役篇神: "shen",
	桃: "tao",
	桃神: "shen",
	汉末: "han",
	汉末神: "shen",
	长安: "chang",
	长安神: "shen",
	渭南: "wn",
	渭南神: "shen",
	荆: "jing",
	荆神: "shen",
	疑: "sxrm",
	梦: "meng",
	承: "cheng",
	转: "zhuan",
	合: "he",
	衰: "shuai",
	兴: "xing",
	SCL: "scl",
	将: "jiang",
	用间: "yongjian",
	君: "jun",
	侠: "xia",
	K系列: "k",
	智将: "zhijiang",
	龙: "long",
	欧陆: "eu",
	九鼎: "jiding",
	燕幽: "yy",
	荆扬: "jianghua",
	蛇: "she",
	青史: "qingshi",
	徐兖: "xuyuan",
	风云: "fengyun",
	慢: "man",
	飞鸿: "feihong",
	虎翼: "huyi",
	闪耀: "shanyao",
	闪耀战姬: "shanyao",
	领主: "lingzhu",
	志气: "zhi",
	文心雕龙: "wen",
	礼: "li",
	书: "shu",
	数: "shuxue",
	御: "yu",
	射: "sheji",
	"骏骊|神": "shen",
	S特神: "shen",
	"26|神": "shen",
	"26|SP": "sp",
	"飞鸿|神": "shen",
	"☆神": "shen",
	"赛马|神": "shen",
	"SP|赛马|神": "shen",
};

// ==================== 工具函数 ====================

/** @type {string} 配置键名 */
const CONFIG_KEY = "extension_十周年UI_newDecadeStyle";

/**
 * 获取标记类名
 * @param {string} name - 样式名称
 * @returns {string} CSS类名
 */
const getMarkClassName = name => `${name}-mark`;

/**
 * 获取属性名
 * @param {string} name - 样式名称
 * @returns {string} 属性名
 */
const getPropertyName = name => `${name}Mark`;

// ==================== 导出模块 ====================

export const prefixMarkModule = {
	/**
	 * 获取前缀配置副本
	 * @returns {Record<string, string>}
	 */
	get prefixConfigs() {
		return { ...PREFIX_CONFIGS };
	},

	/**
	 * 注册单个前缀样式
	 * @param {string} prefix - 前缀名称，如 "自定义"
	 * @param {string} styleName - 样式名称，如 "custom"（对应 CSS 类名 .custom-mark）
	 * @returns {boolean} 是否注册成功
	 */
	registerPrefix(prefix, styleName) {
		if (typeof prefix !== "string" || typeof styleName !== "string") return false;
		if (!prefix.trim() || !styleName.trim()) return false;
		PREFIX_CONFIGS[prefix] = styleName;
		return true;
	},

	/**
	 * 批量注册前缀样式
	 * @param {Record<string, string>} configs - { 前缀: 样式名 } 映射对象
	 * @returns {string[]} 注册成功的前缀列表
	 */
	registerPrefixes(configs) {
		if (!configs || typeof configs !== "object") return [];
		/** @type {string[]} */
		const registered = [];
		for (const [prefix, styleName] of Object.entries(configs)) {
			if (this.registerPrefix(prefix, styleName)) {
				registered.push(prefix);
			}
		}
		return registered;
	},

	/**
	 * 检查前缀是否已注册
	 * @param {string} prefix - 前缀名称
	 * @returns {boolean}
	 */
	hasPrefix(prefix) {
		return prefix in PREFIX_CONFIGS;
	},

	/**
	 * 检查是否启用前缀标记功能
	 * @returns {boolean}
	 */
	shouldShowPrefixMark: () => lib.config?.[CONFIG_KEY] === "on",

	/**
	 * 获取武将对应的前缀配置
	 * @param {string} character - 武将名称
	 * @returns {{className: string, property: string}|null} 配置对象或null
	 */
	getPrefixConfig(character) {
		const prefix = lib.translate?.[`${character}_prefix`];
		const name = PREFIX_CONFIGS[prefix];
		if (!name) return null;
		return {
			className: getMarkClassName(name),
			property: getPropertyName(name),
		};
	},

	/**
	 * 创建或获取已有的标记元素
	 * @param {{className: string, property: string}} config - 配置对象
	 * @param {HTMLElement} playerElement - 玩家元素
	 * @returns {HTMLElement} 标记元素
	 */
	createMarkElement(config, playerElement) {
		return (playerElement[config.property] ??= decadeUI.element.create(config.className, playerElement));
	},

	/**
	 * 显示武将前缀标记
	 * @param {string} character - 武将名称
	 * @param {HTMLElement} playerElement - 玩家元素
	 */
	showPrefixMark(character, playerElement) {
		if (!this.shouldShowPrefixMark()) return;

		const config = this.getPrefixConfig(character);
		if (!config) return;

		const markElement = this.createMarkElement(config, playerElement);
		if (!playerElement.contains(markElement)) {
			playerElement.appendChild(markElement);
		}

		// 更新武将名称（去除前缀）
		const nameElement = playerElement.node?.name;
		if (nameElement) {
			nameElement.innerText = get.rawName2(character);
		}
	},

	/**
	 * 清除所有前缀标记
	 * @param {HTMLElement} playerElement - 玩家元素
	 */
	clearPrefixMarks(playerElement) {
		if (!playerElement) return;

		// 去重：多个前缀可能映射到同一标记
		const uniqueNames = [...new Set(Object.values(PREFIX_CONFIGS))];

		uniqueNames.forEach(name => {
			const property = getPropertyName(name);
			const markElement = playerElement[property];
			if (markElement) {
				markElement.remove();
				delete playerElement[property];
			}
		});
	},
};
