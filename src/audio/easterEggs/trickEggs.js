/**
 * @fileoverview 锦囊相关彩蛋配置
 * 定义使用锦囊卡牌时触发的彩蛋语音规则
 *
 * 配置字段说明：
 * - cards: 触发卡牌名称数组
 * - player: 使用者武将名（可选）
 * - targetHas: 目标中需包含的武将名，支持字符串或数组（可选）
 * - needPlayer: 场上需存在的武将名（可选）
 * - target: 语音播放者武将名，默认为 player（可选）
 * - text: 彩蛋台词
 * - audio: 音频文件名
 * - condition: 复杂条件函数，用于无法用声明式表达的场景（可选）
 */

"use strict";

/**
 * @type {Array<Object>}
 * 锦囊彩蛋配置数组
 */
export const trickEasterEggs = [
	{ cards: ["baiyin"], player: "zhangfei", needPlayer: "machao", text: "马超！汝的头在此！敢来取否！", audio: "zhangfei3.mp3" },
	{ cards: ["tiesuo"], player: "caocao", needPlayer: "pangtong", text: "非先生良谋，安能破东吴也？", audio: "caocao6.mp3" },
	{ cards: ["lebu"], player: "caoshuang", targetHas: "simayi", text: "老贼装疯卖傻，当我等皆三岁小儿？", audio: "caoshuang1.mp3" },
	{ cards: ["lebu"], player: "caopi", targetHas: "liushan", target: "liushan", text: "此间乐，不思蜀也！", audio: "liushan1.mp3" },
	{ cards: ["lebu"], player: "sunhao", targetHas: ["zhangxuan", "zhangyao"], text: "形似而魂飞，汝非我佳人。", audio: "sunhao3.mp3" },
	{ cards: ["lebu"], player: "liuyan", targetHas: "liuhong", text: "谁又在心怀不轨？", audio: "liuyan6.mp3" },
	{ cards: ["bingliang"], player: "zhangchangpu", targetHas: "zhonghui", text: "功课没做完不许吃饭！", audio: "zhangchangpu2.mp3" },
	{ cards: ["wugu"], player: "zhangfei", text: "俺颇有家资！", audio: "zhangfei5.mp3" },
	{ cards: ["wugu"], player: "caocao", needPlayer: "yuanshao", text: "吾任天下之智，以道御之，无所不可！", audio: "caocao18.mp3" },
	{ cards: ["wugu"], player: "liuyan", text: "益州熟，天下足！", audio: "liuyan5.mp3" },
	{ cards: ["wuzhong"], player: "jiaxu", text: "兵不厌诈，可伪许之。", audio: "jiaxu3.mp3" },
	{ cards: ["huogong"], player: "caocao", targetHas: "chunyuqiong", target: "chunyuqiong", text: "阿满！烧我粮是吧！", audio: "chunyuqiong2.mp3" },
	{ cards: ["huogong"], player: "luxun", targetHas: "liubei", text: "玄德公七十里连营，安在否？", audio: "luxun1.mp3" },
	{ cards: ["huogong"], player: "zhouyu", targetHas: "caocao", text: "赤壁火起，曹贼霸业成空！", audio: "zhouyu1.mp3" },
	{ cards: ["jiedao"], player: "jiaxu", targetHas: ["lijue", "guosi"], text: "今可率众而息，理攻长安，为董公报仇！", audio: "jiaxu1.mp3" },
	{ cards: ["juedou"], player: "yuanshao", targetHas: "dongzhuo", text: "吾剑也未尝不利！", audio: "yuanshao2.mp3" },
	{ cards: ["juedou"], player: "guanyu", targetHas: "huangzhong", text: "不用拖刀计，实难取胜。", audio: "guanyu5.mp3" },
	{ cards: ["juedou"], player: "huangzhong", targetHas: "xiahouyuan", text: "昔廉颇年八十，尚食斗米、肉十斤，何况黄忠未及七十乎？", audio: "huangzhong1.mp3" },
	{ cards: ["juedou"], player: "dongzhuo", targetHas: "caocao", text: "曹操这个杂种，竟敢行刺洒家！", audio: "dongzhuo2.mp3" },
	{ cards: ["juedou"], player: "guotu", targetHas: "yuanshao", text: "主公，所谓秦失其鹿，先得者王。", audio: "guotu2.mp3" },
	{ cards: ["juedou"], player: "dongzhuo", targetHas: "yuanshu", text: "天下事在我！我今为之，谁敢不从！汝视我之剑不利否？", audio: "dongzhuo5.mp3" },
	{ cards: ["guohe"], player: "ganning", targetHas: "caocao", text: "劫寨将轻骑，驱兵饮巨瓯！", audio: "ganning1.mp3" },
	{ cards: ["shunshou"], player: "guozhao", targetHas: "zhenji", text: "姐姐的凤冠，妹妹笑纳了", audio: "guozhao1.mp3" },
	{ cards: ["shunshou"], player: "liuyan", targetHas: "zhangfei", text: "求借将军兵器一用！", audio: "liuyan2.mp3" },
	{ cards: ["shunshou"], player: "zhouxuan", targetHas: "caopi", text: "待我一观陛下手相", audio: "zhouxuan1.mp3" },
	{ cards: ["shunshou"], player: "caocao", targetHas: "qinyilu", text: "汝妻子我养之！", audio: "caocao12.mp3" },
	{ cards: ["shunshou"], player: "dongzhuo", targetHas: "wangyun", text: "老王，你还有个女儿啊！", audio: "dongzhuo1.mp3" },
	{ cards: ["shunshou"], player: "dongzhuo", targetHas: "liru", text: "哈哈哈，你真不愧是老夫的智囊啊！", audio: "dongzhuo3.mp3" },
	{ cards: ["shunshou"], player: "dongzhuo", targetHas: "diaochan", text: "哼哼哼哼，更衣好啊！", audio: "dongzhuo4.mp3" },
	{ cards: ["shunshou"], player: "jianggan", targetHas: "zhouyu", text: "读，读书人之事，何谓之窃？", audio: "jianggan1.mp3" },
	{ cards: ["shunshou"], player: "liuhong", targetHas: "hejin", text: "这卖官鬻爵，卿可愿解囊否？", audio: "liuhong2.mp3" },
	{ cards: ["shunshou"], player: "yuanshu", targetHas: "luji", text: "陆朗做宾客，而怀橘乎？", audio: "yuanshu1.mp3" },
	{ cards: ["shunshou"], player: "zhangkai", targetHas: "caocao", text: "曹太公，把钱财交出来吧！", audio: "zhangkai1.mp3" },
	{ cards: ["juedou"], player: "lusu", targetHas: "guanyu", text: "今屯兵于陆口，请关云长赴会！", audio: "lusu1.mp3" },
	{ cards: ["guohe"], player: "lvmeng", targetHas: "ganning", text: "天下未定，斗将如甘宁难得，宜容忍之。", audio: "lvmeng1.mp3" },
	{ cards: ["juedou"], player: "machao", targetHas: "zhangfei", text: "张翼德，汝的头在此，敢来取否？", audio: "machao4.mp3" },
	{ cards: ["bingliang"], player: "menghuo", targetHas: "zhugeliang", text: "公，天威也，南人不复反矣。", audio: "menghuo1.mp3" },
	{ cards: ["nanman"], player: "menghuo", targetHas: "zhugeliang", text: "你今第七次擒我，休来使诈！", audio: "menghuo2.mp3" },
	{ cards: ["guohe"], player: "miheng", targetHas: "caocao", text: "宦官之后，除了挟天子以令诸侯，还懂什么治国安民！", audio: "miheng2.mp3" },
	{ cards: ["guohe"], player: "miheng", targetHas: "simayi", text: "你这州牧，莫不是靠逢迎袁绍得来的？", audio: "miheng3.mp3" },
	{ cards: ["guohe"], player: "miheng", targetHas: "huangzu", text: "竖子！我到阴间也要骂你不停！", audio: "miheng4.mp3" },
	{ cards: ["taoyuan"], player: "caocao", text: "前有梅林，甘酸足以止渴！", audio: "caocao20.mp3" },
	{ cards: ["shunshou"], player: "simayi", targetHas: "caocao", text: "孟德公的大好江山，老夫替你好好治理把！", audio: "simayi2.mp3" },
	{ cards: ["wugu"], player: "jushou", targetHas: "yuanshao", text: "挟天子以令诸侯，蓄士马以讨不庭，谁可御之？", audio: "jushou1.mp3" },
];
