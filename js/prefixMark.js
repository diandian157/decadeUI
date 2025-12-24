import { lib, get } from "noname";

const PREFIX_CONFIGS = Object.freeze({
	界: "jie",
	神: "shen",
	武: "wu",
	族: "clan",
	标: "std",
	新杀: "dc",
	"新杀|牢": "lao",
	乐: "yue",
	谋: "sb",
	新杀谋: "sb",
	界SP: "jie",
	OL: "ol",
	OL谋: "sb",
	SP: "sp",
	星: "star",
	"☆": "star",
	爻: "yao",
	"牢|爻": "lao",
	OL界: "jie",
	魔: "dm",
	闪: "shan",
	晋: "jin",
	威: "v",
	手杀: "mb",
	"手杀|牢": "lao",
	手杀SP: "mb",
	玄: "xuan",
	势: "pot",
	友: "you",
	手杀界: "jie",
	TW: "tw",
	TW谋: "sb",
	幻: "huan",
	起: "jsrg",
	"TW|起": "jsrg",
	经典: "jd",
	经典神: "shen",
	忍: "ren",
	有: "nailong",
	烈: "lie",
	OL乐: "yue",
	韩氏: "hanshi",
	魂: "hun",
	汉: "han",
	OL汉: "han",
	狂: "kuang",
	旧: "old",
	"旧|OL": "old",
	旧神: "old",
	毅重: "old",
	节钺: "old",
	牢: "lao",
	"牢|神": "lao",
	旧晋: "old",
	"牢|SP": "lao",
	欢杀: "Mbaby",
	"欢杀|神": "shen",
	"SP|欢杀|神": "shen",
	"欢杀|谋": "sb",
	"欢杀|星": "star",
	"SP|欢杀": "sp",
	喵: "miao",
	念: "nian",
	战: "zhan",
	微信: "wei",
	"SP|微信|神": "shen",
	"微信|牢": "lao",
	"微信|神": "shen",
	"微信|☆": "star",
	"微信|谋": "sb",
	"微信|界": "jie",
	"SP|微信": "sp",
	极: "ji",
	极略SK: "sk",
	"极略★SK": "sk",
	极略SK神: "shen",
	极略SP神: "shen",
	极略SR: "sr",
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
	TW神: "shen",
	手杀神: "shen",
	OL神: "shen",
	战役篇: "zhan",
	战役篇神: "shen",
	"骏骊|神": "shen",
	S特神: "shen",
	桃神: "shen",
	桃: "tao",
	汉末神: "shen",
	汉末: "han",
	长安神: "shen",
	长安: "chang",
	渭南神: "shen",
	渭南: "wn",
	荆神: "shen",
	荆: "jing",
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
	"★": "star",
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
	"26|神": "shen",
	慢: "man",
	飞鸿: "feihong",
	"飞鸿|神": "shen",
	"☆神": "shen",
	虎翼: "huyi",
	闪耀: "shanyao",
	领主: "lingzhu",
	闪耀战姬: "shanyao",
	志气: "zhi",
	"旧|魔": "old",
	"牢|谋": "lao",
	"26|SP": "sp",
	文心雕龙: "wen",
	礼: "li",
	"手杀|SP": "sp",
	书: "shu",
	数: "shuxue",
	御: "yu",
	手杀乐: "yue",
	射: "sheji",
});

const CONFIG_KEY = "extension_十周年UI_newDecadeStyle";

function getMarkId(name) {
	return `${name}-mark`;
}

function getPropertyName(name) {
	return `$${name}Mark`;
}

export const prefixMarkModule = {
	prefix_configs: PREFIX_CONFIGS,

	shouldShowPrefixMark: () => lib.config?.[CONFIG_KEY] === "on",

	getPrefixConfig(character) {
		const prefix = lib.translate?.[`${character}_prefix`];
		if (!prefix || !PREFIX_CONFIGS[prefix]) return null;
		const name = PREFIX_CONFIGS[prefix];
		return { className: getMarkId(name), property: getPropertyName(name) };
	},

	createMarkElement(config, playerElement) {
		return (playerElement[config.property] ??= dui.element.create(config.className, playerElement));
	},

	showPrefixMark(character, playerElement) {
		if (!this.shouldShowPrefixMark()) return;

		const config = this.getPrefixConfig(character);
		if (!config) return;

		const markElement = this.createMarkElement(config, playerElement);
		if (!playerElement.contains(markElement)) {
			playerElement.appendChild(markElement);
		}

		const nameElement = playerElement.node?.name;
		if (nameElement) {
			nameElement.innerText = get.rawName2(character);
		}
	},

	clearPrefixMarks(playerElement) {
		if (!playerElement) return;

		const processedNames = new Set();
		Object.values(PREFIX_CONFIGS).forEach(name => {
			if (processedNames.has(name)) return;
			processedNames.add(name);

			const property = getPropertyName(name);
			const markElement = playerElement[property];
			if (markElement) {
				markElement.remove();
				delete playerElement[property];
			}
		});
	},
};
