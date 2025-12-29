/**
 * @fileoverview 锦囊相关彩蛋配置
 * 定义使用锦囊卡牌时触发的彩蛋语音规则
 */

"use strict";

/**
 * @type {Array<Object>}
 * 锦囊彩蛋配置数组
 */
export const trickEasterEggs = [
	{ cards: ["baiyin"], player: "zhangfei", condition: ctx => ctx.findPlayer?.("machao"), text: "马超！汝的头在此！敢来取否！", audio: "zhangfei3.mp3" },
	{ cards: ["tiesuo"], player: "caocao", condition: ctx => ctx.findPlayer?.("pangtong"), text: "非先生良谋，安能破东吴也？", audio: "caocao6.mp3" },
	{ cards: ["lebu"], player: "caoshuang", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "simayi")), text: "老贼装疯卖傻，当我等皆三岁小儿？", audio: "caoshuang1.mp3" },
	{ cards: ["lebu"], player: "caopi", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liushan")), target: "liushan", text: "此间乐，不思蜀也！", audio: "liushan1.mp3" },
	{ cards: ["lebu"], player: "sunhao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhangxuan") || ctx.hasName(t, "zhangyao")), text: "形似而魂飞，汝非我佳人。", audio: "sunhao3.mp3" },
	{ cards: ["lebu"], player: "liuyan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liuhong")), text: "谁又在心怀不轨？", audio: "liuyan6.mp3" },
	{ cards: ["bingliang"], player: "zhangchangpu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhonghui")), text: "功课没做完不许吃饭！", audio: "zhangchangpu2.mp3" },
	{ cards: ["wugu"], player: "zhangfei", text: "俺颇有家资！", audio: "zhangfei5.mp3" },
	{ cards: ["wugu"], player: "caocao", condition: ctx => ctx.findPlayer?.("yuanshao"), text: "吾任天下之智，以道御之，无所不可！", audio: "caocao18.mp3" },
	{ cards: ["wugu"], player: "liuyan", text: "益州熟，天下足！", audio: "liuyan5.mp3" },
	{ cards: ["wuzhong"], player: "jiaxu", text: "兵不厌诈，可伪许之。", audio: "jiaxu3.mp3" },
	{ cards: ["huogong"], player: "caocao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "chunyuqiong")), target: "chunyuqiong", text: "阿满！烧我粮是吧！", audio: "chunyuqiong2.mp3" },
	{ cards: ["huogong"], player: "luxun", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liubei")), text: "玄德公七十里连营，安在否？", audio: "luxun1.mp3" },
	{ cards: ["huogong"], player: "zhouyu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caocao")), text: "赤壁火起，曹贼霸业成空！", audio: "zhouyu1.mp3" },
	{ cards: ["jiedao"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "lijue") || ctx.hasName(t, "guosi")), text: "今可率众而息，理攻长安，为董公报仇！", audio: "jiaxu1.mp3" },
	{ cards: ["juedou"], player: "yuanshao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dongzhuo")), text: "吾剑也未尝不利！", audio: "yuanshao2.mp3" },
	{ cards: ["juedou"], player: "guanyu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "huangzhong")), text: "不用拖刀计，实难取胜。", audio: "guanyu5.mp3" },
	{ cards: ["juedou"], player: "huangzhong", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "xiahouyuan")), text: "昔廉颇年八十，尚食斗米、肉十斤，何况黄忠未及七十乎？", audio: "huangzhong1.mp3" },
	{ cards: ["juedou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caocao")), text: "曹操这个杂种，竟敢行刺洒家！", audio: "dongzhuo2.mp3" },
	{ cards: ["juedou"], player: "guotu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yuanshao")), text: "主公，所谓秦失其鹿，先得者王。", audio: "guotu2.mp3" },
	{ cards: ["juedou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yuanshu")), text: "天下事在我！我今为之，谁敢不从！汝视我之剑不利否？", audio: "dongzhuo5.mp3" },
	{ cards: ["guohe"], player: "ganning", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caocao")), text: "劫寨将轻骑，驱兵饮巨瓯！", audio: "ganning1.mp3" },
	{ cards: ["shunshou"], player: "guozhao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhenji")), text: "姐姐的凤冠，妹妹笑纳了", audio: "guozhao1.mp3" },
	{ cards: ["shunshou"], player: "liuyan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhangfei")), text: "求借将军兵器一用！", audio: "liuyan2.mp3" },
	{ cards: ["shunshou"], player: "zhouxuan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caopi")), text: "待我一观陛下手相", audio: "zhouxuan1.mp3" },
	{ cards: ["shunshou"], player: "caocao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "qinyilu")), text: "汝妻子我养之！", audio: "caocao12.mp3" },
	{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "wangyun")), text: "老王，你还有个女儿啊！", audio: "dongzhuo1.mp3" },
	{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liru")), text: "哈哈哈，你真不愧是老夫的智囊啊！", audio: "dongzhuo3.mp3" },
	{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "diaochan")), text: "哼哼哼哼，更衣好啊！", audio: "dongzhuo4.mp3" },
	{ cards: ["shunshou"], player: "jianggan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhouyu")), text: "读，读书人之事，何谓之窃？", audio: "jianggan1.mp3" },
	{ cards: ["shunshou"], player: "liuhong", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "hejin")), text: "这卖官鬻爵，卿可愿解囊否？", audio: "liuhong2.mp3" },
	{ cards: ["shunshou"], player: "yuanshu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "luji")), text: "陆朗做宾客，而怀橘乎？", audio: "yuanshu1.mp3" },
	{ cards: ["shunshou"], player: "zhangkai", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caocao")), text: "曹太公，把钱财交出来吧！", audio: "zhangkai1.mp3" },
];
