/**
 * 前缀角标模块
 * 根据武将前缀显示对应的角标样式
 */
import { lib, game, ui, get, ai, _status } from "noname";

// ==================== 前缀配置映射 ====================

const PREFIX_CONFIGS = Object.freeze({
	// 基础前缀
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
	// 新杀系列
	新杀: "dc",
	新杀谋: "sb",
	"新杀|牢": "lao",
	// OL系列
	OL谋: "sb",
	OL界: "jie",
	OL神: "shen",
	OL乐: "yue",
	OL汉: "han",
	// 手杀系列
	手杀: "mb",
	手杀SP: "mb",
	手杀界: "jie",
	手杀神: "shen",
	手杀乐: "yue",
	"手杀|牢": "lao",
	"手杀|SP": "sp",
	手杀合: "he",
	// TW系列
	TW谋: "sb",
	TW神: "shen",
	"TW|起": "jsrg",
	// 旧版系列
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
	// 牢系列
	牢: "lao",
	"牢|爻": "lao",
	"牢|神": "lao",
	"牢|SP": "lao",
	"牢|谋": "lao",
	// 微信系列
	微信: "wei",
	"微信|牢": "lao",
	"微信|神": "shen",
	"微信|☆": "star",
	"微信|谋": "sb",
	"微信|界": "jie",
	"SP|微信": "sp",
	"SP|微信|神": "shen",
	// 欢杀系列
	欢杀: "Mbaby",
	"欢杀|神": "shen",
	"欢杀|谋": "sb",
	"欢杀|星": "star",
	"SP|欢杀": "sp",
	"SP|欢杀|神": "shen",
	"欢杀|界": "jie",
	// 极略系列
	极: "ji",
	极略SK: "sk",
	"极略★SK": "sk",
	极略SK神: "shen",
	极略SP神: "shen",
	极略SR: "sr",
	// 其他前缀
	界SP: "jie",
	爻: "yao",
	魔: "dm",
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
});

// ==================== 工具函数 ====================

const CONFIG_KEY = "extension_十周年UI_newDecadeStyle";
const getMarkClassName = name => `${name}-mark`;
const getPropertyName = name => `${name}Mark`;

// ==================== 导出模块 ====================

export const prefixMarkModule = {
	prefix_configs: PREFIX_CONFIGS,

	/** 检查是否启用前缀标记功能 */
	shouldShowPrefixMark: () => lib.config?.[CONFIG_KEY] === "on",

	/** 获取武将对应的前缀配置 */
	getPrefixConfig(character) {
		const prefix = lib.translate?.[`${character}_prefix`];
		const name = PREFIX_CONFIGS[prefix];
		if (!name) return null;
		return {
			className: getMarkClassName(name),
			property: getPropertyName(name),
		};
	},

	/** 创建或获取已有的标记元素 */
	createMarkElement(config, playerElement) {
		return (playerElement[config.property] ??= dui.element.create(config.className, playerElement));
	},

	/** 显示武将前缀标记 */
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

	/** 清除所有前缀标记 */
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
