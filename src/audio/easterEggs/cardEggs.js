/**
 * @fileoverview 卡牌使用彩蛋配置
 * 定义酒、桃等卡牌使用时触发的彩蛋语音规则
 *
 * 配置字段说明：
 * - cards: 触发卡牌名称数组
 * - player: 使用者武将名（可选）
 * - targetHas: 目标中需包含的武将名，支持字符串或数组（可选）
 * - needPlayer: 场上需存在的武将名（可选）
 * - group: 使用者阵营限制（可选）
 * - target: 语音播放者武将名，默认为 player（可选）
 * - text: 彩蛋台词
 * - audio: 音频文件名
 * - condition: 复杂条件函数，用于无法用声明式表达的场景（可选）
 */

"use strict";

/**
 * @type {Array<Object>}
 * 卡牌使用彩蛋配置数组
 */
export const cardEasterEggs = [
	{ cards: ["jiu"], player: "zhugeliang", text: "北伐，启动！", audio: "zhugeliang1.mp3" },
	{ cards: ["jiu"], player: "weiyan", text: "北伐中原？延视为己任久矣！", audio: "weiyan1.mp3" },
	{ cards: ["jiu"], player: "caocao", needPlayer: "guanyu", text: "云长公，请饮此热酒！", audio: "caocao3.mp3" },
	{ cards: ["jiu"], player: "caocao", text: "醉酒当歌！人生几何！", audio: "caocao13.mp3" },
	{ cards: ["jiu"], player: "caochun", text: "壮士醉沙场！烈马啸西风！", audio: "caochun1.mp3" },
	{ cards: ["jiu"], player: "zhonghui", text: "偷本非礼，所以不拜", audio: "zhonghui1.mp3" },
	{ cards: ["jiu"], player: "zerong", text: "酒肉穿肠过，佛祖心中留", audio: "zerong1.mp3" },
	{ cards: ["jiu"], player: "guanyu", text: "走马杀贼，提酒尚温", audio: "guanyu3.mp3" },
	{ cards: ["jiu"], player: "chunyuqiong", text: "接着奏乐！嗝~接着喝！", audio: "chunyuqiong1.mp3" },
	{ cards: ["jiu"], player: "xurong", text: "已饮佳酿，正待尔等骨肉下酒！", audio: "xurong1.mp3" },
	{ cards: ["jiu"], player: "zhangfei", text: "本将军，嗝~千杯不醉！", audio: "zhangfei7.mp3" },
	{ cards: ["tao"], player: "dianwei", targetHas: "caocao", text: "主公勿忧！典韦来也！", audio: "dianwei1.mp3" },
	{ cards: ["tao"], player: "zhugeliang", targetHas: "feiyi", target: "feiyi", text: "丞相所托，我等必不辜负！", audio: "feiyi1.mp3" },
	{ cards: ["tao"], player: "zhaoyun", targetHas: "liushan", text: "阿斗，跟云叔走！", audio: "zhaoyun1.mp3" },
	{ cards: ["tao"], player: "lvbu", targetHas: "diaochan", target: "diaochan", text: "呵呵呵，嗯~", audio: "diaochan2.mp3" },
	{ cards: ["tao"], player: "chendao", targetHas: "liubei", text: "主公，我来救你！", audio: "chendao1.mp3" },
	{ cards: ["tao"], player: "caoying", targetHas: "zhaoyun", text: "赵子龙，只能死在我手上", audio: "caoying1.mp3" },
	{ cards: ["tao"], player: "zhonghui", targetHas: "jiangwei", text: "伯约何来迟也", audio: "zhonghui2.mp3" },
	{ cards: ["tao"], player: "jiaxu", targetHas: "zhangxiu", target: "zhangxiu", text: "多谢文和，拉兄弟一把！", audio: "zhangxiu2.mp3" },
	{ cards: ["tao"], player: "guanyu", targetHas: "caocao", text: "今恩义两清！再见，当较生死！", audio: "guanyu4.mp3" },
	{ cards: ["tao"], player: "chengong", targetHas: "caocao", text: "我欲弃此县令！随公去图大事！", audio: "chengong2.mp3" },
	{ cards: ["tao"], player: "huatuo", targetHas: "guanyu", text: "刮骨之痛若无误，将军神人也！", audio: "huatuo1.mp3" },
	{ cards: ["tao"], player: "huatuo", targetHas: "caocao", text: "医者如何能见死不救", audio: "huatuo2.mp3" },
	{ cards: ["tao"], player: "zhonghui", targetHas: "zhangchangpu", text: "母亲自幼严教，方有儿今日不世之功。", audio: "zhonghui4.mp3" },
	{ cards: ["tao"], player: "sunquan", targetHas: "lingtong", text: "孤有卓世良药，可医公绩之急。", audio: "sunquan1.mp3" },
	{ cards: ["tao"], player: "guojia", targetHas: "caocao", target: "caocao", text: "有奉孝在，不使吾有此失也！", audio: "caocao10.mp3" },
	{ cards: ["tao"], player: "zhaozhong", targetHas: "liuhong", target: "liuhong", text: "世上只有妈妈好！", audio: "liuhong1.mp3" },
	{ cards: ["tao"], player: "liuyong", targetHas: "liushan", text: "兄不知弟忠。弟不知兄愚！", audio: "liuyong1.mp3" },
	{ cards: ["tao"], player: "yanghu", targetHas: "lukang", target: "lukang", text: "羊祜其真人者！", audio: "lukang1.mp3" },
	{ cards: ["tao"], player: "dongzhuo", targetHas: "lvbu", target: "lvbu", text: "布飘零半生，只恨未逢明主，公若不弃，布愿拜为义父！", audio: "lvbu5.mp3" },
	{ cards: ["tao"], player: "diaochan", targetHas: "lvbu", text: "将军不必多礼，貂蝉感激将军的救命之恩。", audio: "diaochan3.mp3" },
	{ cards: ["tao"], player: "liubei", targetHas: "yuanshu", target: "yuanshu", text: "多谢将军，以泌水相赠！", audio: "yuanshu2.mp3" },
	{ cards: ["tao"], player: "liubei", targetHas: ["guanyu", "zhangfei"], text: "不求同年同月同日生，只求同年同月同日死。", audio: "liubei2.mp3" },
	{ cards: ["tao"], player: "liubei", targetHas: "zhugeliang", text: "君才十倍于曹丕，必能安邦定国，终定大事。", audio: "liubei6.mp3" },
	{ cards: ["tao"], player: "liubei", targetHas: "wolongfengchu", text: "卧龙凤雏，虽千万人吾往矣。", audio: "liubei8.mp3" },
	{ cards: ["tao"], player: "liushan", targetHas: "zhugeliang", text: "聪慧有何用，他有相父吗？朕有相父就够了。", audio: "liushan2.mp3" },
	{ cards: ["tao", "jiu"], player: "liushan", text: "父亲，我一定要光复汉室！", audio: "liushan3.mp3" },
	{ cards: ["tao"], player: "zhangfei", targetHas: "guanyu", target: "guanyu", text: "我的好三弟！", audio: "guanyu10.mp3" },
	{ cards: ["tao"], player: "guojia", targetHas: "caocao", text: "嘉，感丞相大恩，虽死不能报万一。", audio: "guojia1.mp3" },
	{ cards: ["tao"], player: "guotu", targetHas: "yuanshao", text: "以明公之神武，引河朔之强众，以伐曹操，易如覆手，何必乃尔！", audio: "guotu1.mp3" },
	{ cards: ["tao"], player: "jiangwei", targetHas: "zhonghui", text: "功高盖主，赏无可赏，士季兄不会没有准备吧？", audio: "jiangwei5.mp3" },
	{ cards: ["tao"], player: "guanyu", targetHas: "liubei", text: "关某之命即是刘兄之命，关某之躯即为刘兄之躯！", audio: "guanyu6.mp3" },
	{ cards: ["tao"], player: "guanyu", targetHas: "zhangliao", text: "某素知文远乃忠义之士。", audio: "guanyu8.mp3" },
	{ cards: ["tao"], player: "caocao", targetHas: "xunyu", text: "吾之子房也！", audio: "caocao16.mp3" },
	{ cards: ["tao"], group: "wei", targetHas: "caocao", target: "caocao", text: "得卿助力，孤方能登极捧日。", audio: "caocao21.mp3" },
	{ cards: ["tao"], player: "sunjian", targetHas: "sunce", text: "汉室倾覆之际，大丈夫当有所作为。", audio: "sunjian1.mp3" },
	{ cards: ["tao"], player: "simashi", targetHas: "simayi", text: "父亲，时机已至，何不一鼓作气？", audio: "simashi1.mp3" },
	{ cards: ["tao"], player: "simashi", targetHas: "xunyu", text: "贤才未有及荀令君者也。", audio: "simayi4.mp3" },
	{ cards: ["tao"], player: "simazhao", targetHas: "zhonghui", text: "今四海安定，将勇兵精，可乘势取蜀，再顺流而下，水陆并进，平吴亦不在话下。", audio: "simazhao1.mp3" },
];
