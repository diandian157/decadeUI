import { lib, get } from "../../../noname.js";

const PREFIX_CONFIGS = Object.freeze({
	界: { className: "jie-mark", property: "$jieMark" },
	神: { className: "shen-mark", property: "$shenMark" },
	武: { className: "wu-mark", property: "$wuMark" },
	族: { className: "clan-mark", property: "$clanMark" },
	标: { className: "std-mark", property: "$stdMark" },
	新杀: { className: "dc-mark", property: "$dcMark" },
	"新杀|牢": { className: "lao-mark", property: "$laoMark" },
	乐: { className: "yue-mark", property: "$yueMark" },
	谋: { className: "sb-mark", property: "$sbMark" },
	新杀谋: { className: "sb-mark", property: "$sbMark" },
	界SP: { className: "jie-mark", property: "$jieMark" },
	OL: { className: "ol-mark", property: "$olMark" },
	OL谋: { className: "sb-mark", property: "$sbMark" },
	SP: { className: "sp-mark", property: "$spMark" },
	星: { className: "star-mark", property: "$starMark" },
	"☆": { className: "star-mark", property: "$starMark" },
	爻: { className: "yao-mark", property: "$yaoMark" },
	"牢|爻": { className: "lao-mark", property: "$laoMark" },
	OL界: { className: "jie-mark", property: "$jieMark" },
	OL谋: { className: "sb-mark", property: "$sbMark" },
	魔: { className: "dm-mark", property: "$dmMark" },
	闪: { className: "shan-mark", property: "$shanMark" },
	晋: { className: "jin-mark", property: "$jinMark" },
	威: { className: "v-mark", property: "$vMark" },
	手杀: { className: "mb-mark", property: "$mbMark" },
	"手杀|牢": { className: "lao-mark", property: "$laoMark" },
	手杀SP: { className: "mb-mark", property: "$mbMark" },
	玄: { className: "xuan-mark", property: "$xuanMark" },
	势: { className: "pot-mark", property: "$potMark" },
	友: { className: "you-mark", property: "$youMark" },
	手杀界: { className: "jie-mark", property: "$jieMark" },
	TW: { className: "tw-mark", property: "$twMark" },
	TW谋: { className: "sb-mark", property: "$sbMark" },
	幻: { className: "huan-mark", property: "$huanMark" },
	起: { className: "jsrg-mark", property: "$jsrgMark" },
	"TW|起": { className: "jsrg-mark", property: "$jsrgMark" },
	经典: { className: "jd-mark", property: "$jdMark" },
	经典神: { className: "shen-mark", property: "$shenMark" },
	忍: { className: "ren-mark", property: "$renMark" },
	有: { className: "nailong-mark", property: "$nailongMark" },
	烈: { className: "lie-mark", property: "$lieMark" },
	OL乐: { className: "yue-mark", property: "$yueMark" },
	韩氏: { className: "hanshi-mark", property: "$hanshiMark" },
	魂: { className: "hun-mark", property: "$hunMark" },
	汉: { className: "han-mark", property: "$hanMark" },
	OL汉: { className: "han-mark", property: "$hanMark" },
	狂: { className: "kuang-mark", property: "$kuangMark" },
	旧: { className: "old-mark", property: "$oldMark" },
	"旧|OL": { className: "old-mark", property: "$oldMark" },
	旧神: { className: "old-mark", property: "$oldMark" },
	毅重: { className: "old-mark", property: "$oldMark" },
	节钺: { className: "old-mark", property: "$oldMark" },
	牢: { className: "lao-mark", property: "$laoMark" },
	"牢|神": { className: "lao-mark", property: "$laoMark" },
	旧晋: { className: "old-mark", property: "$oldMark" },
	"牢|SP": { className: "lao-mark", property: "$laoMark" },
	欢杀: { className: "Mbaby-mark", property: "$MbabyMark" },
	"欢杀|神": { className: "shen-mark", property: "$shenMark" },
	"SP|欢杀|神": { className: "shen-mark", property: "$shenMark" },
	"欢杀|谋": { className: "sb-mark", property: "$sbMark" },
	"欢杀|星": { className: "star-mark", property: "$starMark" },
	"SP|欢杀": { className: "sp-mark", property: "$spMark" },
	喵: { className: "miao-mark", property: "$miaoMark" },
	念: { className: "nian-mark", property: "$nianMark" },
	战: { className: "zhan-mark", property: "$zhanMark" },
	微信: { className: "wei-mark", property: "$weiMark" },
	"SP|微信|神": { className: "shen-mark", property: "$shenMark" },
	"微信|牢": { className: "lao-mark", property: "$laoMark" },
	"微信|神": { className: "shen-mark", property: "$shenMark" },
	"微信|☆": { className: "star-mark", property: "$starMark" },
	"微信|谋": { className: "sb-mark", property: "$sbMark" },
	"微信|界": { className: "jie-mark", property: "$jieMark" },
	"SP|微信": { className: "sp-mark", property: "$spMark" },
	极: { className: "ji-mark", property: "$jiMark" },
	极略SK: { className: "sk-mark", property: "$skMark" },
	"极略★SK": { className: "sk-mark", property: "$skMark" },
	极略SK神: { className: "shen-mark", property: "$shenMark" },
	极略SP神: { className: "shen-mark", property: "$shenMark" },
	极略SR: { className: "sr-mark", property: "$srMark" },
	"旧|神": { className: "old-mark", property: "$oldMark" },
	"旧|界": { className: "old-mark", property: "$oldMark" },
	"旧|谋": { className: "old-mark", property: "$oldMark" },
	"旧|幻": { className: "old-mark", property: "$oldMark" },
	"旧|势": { className: "old-mark", property: "$oldMark" },
	"旧|☆": { className: "old-mark", property: "$oldMark" },
	"旧|SP": { className: "old-mark", property: "$oldMark" },
	"旧|友": { className: "old-mark", property: "$oldMark" },
	"旧|族": { className: "old-mark", property: "$oldMark" },
	"旧|星": { className: "old-mark", property: "$oldMark" },
	"旧|威": { className: "old-mark", property: "$oldMark" },
	"旧|武": { className: "old-mark", property: "$oldMark" },
	"旧|侠": { className: "old-mark", property: "$oldMark" },
	"旧|起": { className: "old-mark", property: "$oldMark" },
	"旧|玄": { className: "old-mark", property: "$oldMark" },
	TW神: { className: "shen-mark", property: "$shenMark" },
	手杀神: { className: "shen-mark", property: "$shenMark" },
	OL神: { className: "shen-mark", property: "$shenMark" },
	战役篇: { className: "zhan-mark", property: "$zhanMark" },
	战役篇神: { className: "shen-mark", property: "$shenMark" },
	"骏骊|神": { className: "shen-mark", property: "$shenMark" },
	S特神: { className: "shen-mark", property: "$shenMark" },
	桃神: { className: "shen-mark", property: "$shenMark" },
	桃: { className: "tao-mark", property: "$taoMark" },
	汉末神: { className: "shen-mark", property: "$shenMark" },
	汉末: { className: "han-mark", property: "$hanMark" },
	长安神: { className: "shen-mark", property: "$shenMark" },
	长安: { className: "chang-mark", property: "$changMark" },
	渭南神: { className: "shen-mark", property: "$shenMark" },
	渭南: { className: "wn-mark", property: "$wnMark" },
	荆神: { className: "shen-mark", property: "$shenMark" },
	荆: { className: "jing-mark", property: "$jingMark" },
	疑: { className: "sxrm-mark", property: "$sxrmMark" },
	梦: { className: "meng-mark", property: "$mengMark" },
	承: { className: "cheng-mark", property: "$chengMark" },
	转: { className: "zhuan-mark", property: "$zhuanMark" },
	合: { className: "he-mark", property: "$heMark" },
	衰: { className: "shuai-mark", property: "$shuaiMark" },
	兴: { className: "xing-mark", property: "$xingMark" },
	SCL: { className: "scl-mark", property: "$sclMark" },
	将: { className: "jiang-mark", property: "$jiangMark" },
	用间: { className: "yongjian-mark", property: "$yongjianMark" },
	"★": { className: "star-mark", property: "$starMark" },
	君: { className: "jun-mark", property: "$junMark" },
	侠: { className: "xia-mark", property: "$xiaMark" },
	K系列: { className: "k-mark", property: "$kMark" },
	智将: { className: "zhijiang-mark", property: "$zhijiangMark" },
	龙: { className: "long-mark", property: "$longMark" },
	欧陆: { className: "eu-mark", property: "$euMark" },
	九鼎: { className: "jiding-mark", property: "$jidingMark" },
	燕幽: { className: "yy-mark", property: "$yyMark" },
	荆扬: { className: "jianghua-mark", property: "$jianghuaMark" },
	蛇: { className: "she-mark", property: "$sheMark" },
	青史: { className: "qingshi-mark", property: "$qingshiMark" },
	徐兖: { className: "xuyuan-mark", property: "$xuyuanMark" },
	风云: { className: "fengyun-mark", property: "$fengyunMark" },
	"26|神": { className: "shen-mark", property: "$shenMark" },
	慢: { className: "man-mark", property: "$manMark" },
	飞鸿: { className: "feihong-mark", property: "$feihongMark" },
	"飞鸿|神": { className: "shen-mark", property: "$shenMark" },
	"☆神": { className: "shen-mark", property: "$shenMark" },
	虎翼: { className: "huyi-mark", property: "$huyiMark" },
	闪耀: { className: "shanyao-mark", property: "$shanyaoMark" },
	领主: { className: "lingzhu-mark", property: "$lingzhuMark" },
	闪耀战姬: { className: "shanyao-mark", property: "$shanyaoMark" },
	志气: { className: "zhi-mark", property: "$zhiMark" },
	"旧|魔": { className: "old-mark", property: "$oldMark" },
	"牢|谋": { className: "lao-mark", property: "$laoMark" },
	"26|SP": { className: "sp-mark", property: "$spMark" },
	文心雕龙: { className: "wen-mark", property: "$wenMark" },
	礼: { className: "li-mark", property: "$liMark" },
	"手杀|SP": { className: "sp-mark", property: "$spMark" },
	书: { className: "shu-mark", property: "$shuMark" },
	数: { className: "shuxue-mark", property: "$shuxueMark" },
	御: { className: "yu-mark", property: "$yuMark" },
	手杀乐: { className: "yue-mark", property: "$yueMark" },
	射: { className: "sheji-mark", property: "$shejiMark" },
});

const CONFIG_KEYS = {
	NEW_DECADE_STYLE: "extension_十周年UI_newDecadeStyle",
};

export const prefixMarkModule = {
	prefix_configs: PREFIX_CONFIGS,

	shouldShowPrefixMark() {
		return lib.config?.[CONFIG_KEYS.NEW_DECADE_STYLE] === "on";
	},

	getPrefixConfig(character) {
		const prefixKey = `${character}_prefix`;
		const refreshPrefix = lib.translate?.[prefixKey];
		return refreshPrefix ? PREFIX_CONFIGS[refreshPrefix] : null;
	},

	createMarkElement(config, playerElement) {
		return playerElement[config.property] ?? (playerElement[config.property] = dui.element.create(config.className, playerElement));
	},

	updateNameElement(playerElement, character) {
		const nameElement = playerElement.node?.name;
		if (nameElement) {
			nameElement.innerText = get.rawName2(character);
		}
	},

	showPrefixMark(character, playerElement) {
		if (!this.shouldShowPrefixMark()) {
			return;
		}

		const config = this.getPrefixConfig(character);
		if (!config) {
			return;
		}

		const markElement = this.createMarkElement(config, playerElement);
		if (!playerElement.contains(markElement)) {
			playerElement.appendChild(markElement);
		}

		this.updateNameElement(playerElement, character);
	},

	clearPrefixMarks(playerElement) {
		if (!playerElement) return;

		Object.values(PREFIX_CONFIGS).forEach(config => {
			const markElement = playerElement[config.property];
			if (markElement) {
				markElement.remove();
				delete playerElement[config.property];
			}
		});
	},
};
