/**
 * @fileoverview 杀相关彩蛋配置
 * 定义使用杀卡牌时触发的彩蛋语音规则
 *
 * 配置字段说明：
 * - cards: 触发卡牌名称数组
 * - player: 使用者武将名（可选）
 * - targetHas: 目标中需包含的武将名，支持字符串或数组（可选）
 * - targetGroup: 目标阵营限制（可选）
 * - needPlayer: 场上需存在的武将名（可选）
 * - target: 语音播放者武将名，默认为 player（可选）
 * - text: 彩蛋台词
 * - audio: 音频文件名
 * - sequence: 序列台词数组，循环播放（可选）
 * - sequenceKey: 序列状态键生成函数（可选）
 * - condition: 复杂条件函数，用于无法用声明式表达的场景（可选）
 */

"use strict";

/**
 * @type {Array<Object>}
 * 杀彩蛋配置数组
 */
export const shaEasterEggs = [
	{ cards: ["sha"], player: "zhangfei", targetHas: "lvbu", text: "三姓家奴休走！", audio: "zhangfei1.mp3" },
	{ cards: ["sha"], player: "zhangxiu", targetHas: "caocao", text: "无耻曹贼！", audio: "zhangxiu1.mp3" },
	{ cards: ["sha"], player: "xuzhu", targetHas: "xuyou", text: "许攸如此无礼，某杀之矣！", audio: "xuchu1.mp3" },
	{ cards: ["sha"], player: "yuanshao", targetHas: "dongzhuo", text: "汝剑利！吾剑未尝不利！", audio: "yuanshao1.mp3" },
	{ cards: ["sha"], player: "simayi", targetHas: "caocao", target: "caocao", text: "仲达啊，孤终究还是看错了你", audio: "caocao4.mp3" },
	{ cards: ["sha"], player: "guansuo", needPlayer: "baosanniang", text: "伤病已无碍。三娘，此次南征，我定要为你拿下首功！", audio: "guansuo1.mp3" },
	{ cards: ["sha"], player: "zhangliao", targetGroup: "wu", text: "雁门张文远在此！", audio: "zhangliao1.mp3" },
	{ cards: ["sha"], player: "dingshangwan", targetHas: "caocao", text: "原来你曹孟德也会痛", audio: "dingshangwan1.mp3" },
	{ cards: ["sha"], player: "dingshangwan", targetHas: "zoushi", text: "祸水！还我儿命来！", audio: "dingshangwan2.mp3" },
	{ cards: ["sha"], player: "simayi", targetHas: "caoshuang", text: "汝当真以为老夫病入膏肓？哈哈哈哈哈！", audio: "simayi1.mp3" },
	{ cards: ["sha"], player: "caopi", targetHas: "sunquan", text: "吴王颇知学乎？", audio: "caopi2.mp3" },
	{ cards: ["sha"], player: "lvbu", targetHas: "dingyuan", text: "义父再送儿一场富贵如何！", audio: "lvbu1.mp3" },
	{ cards: ["sha"], player: "zhangchangpu", targetHas: "zhonghui", text: "从小到大，最不乖的就是你！", audio: "zhangchangpu1.mp3" },
	{ cards: ["sha"], player: "bozai", text: "哈！" },
	{ cards: ["sha"], player: "xiangjiaoduanwu", text: "哈！" },
	{ cards: ["sha"], player: "sunce", targetHas: "yuji", text: "此乃妖人，能以妖术惑众，不可不除！", audio: "sunce1.mp3" },
	{ cards: ["sha"], player: "sunshangxiang", targetHas: "dingfeng", text: "你只怕周瑜，独不怕我？", audio: "sunshangxiang1.mp3" },
	{ cards: ["sha"], player: "sunshangxiang", targetHas: "xusheng", text: "周瑜杀得尔等，我岂杀不得周瑜？", audio: "sunshangxiang2.mp3" },
	{ cards: ["sha"], player: "zhonghui", targetHas: "simazhao", text: "你司马家做得，我便做不得？", audio: "zhonghui3.mp3" },
	{ cards: ["sha"], player: "zhangxiu", targetHas: "caoang", text: "父债子偿，今日你在劫难逃！", audio: "zhangxiu4.mp3" },
	{ cards: ["sha"], player: "jiangwei", targetHas: "zhaoyun", text: "老将军可知天水姜伯约！", audio: "jiangwei1.mp3" },
	{ cards: ["sha"], player: "jiangwei", targetHas: "dengai", text: "身后无主，纵使夺得祁山九寨又将何为？", audio: "jiangwei2.mp3" },
	{ cards: ["sha"], player: "hetaihou", targetHas: "wangrong", text: "哀家赐你美酒，尔还不谢恩！", audio: "hetaihou1.mp3" },
	{ cards: ["sha"], player: "huaxin", targetHas: "fuhuanghou", text: "大美冷宫，领包入住！", audio: "huaxin1.mp3" },
	{ cards: ["sha"], player: "jiaxu", targetHas: ["liuxie", "wangyun"], text: "可伤天和，可伤人和，维不可伤文和！", audio: "jiaxu2.mp3" },
	{ cards: ["sha"], player: "liru", targetHas: "liubian", text: "乖，张嘴，酒来了！", audio: "liru1.mp3" },
	{ cards: ["sha"], player: "xiahouyuan", targetHas: "liangxing", target: "liangxing", text: "不是，真动手啊！", audio: "liangxing1.mp3" },
	{ cards: ["sha"], player: "madai", targetHas: "weiyan", text: "匹夫！我当真敢杀你！", audio: "madai1.mp3" },
	{ cards: ["sha"], player: "quyi", targetHas: "gongsunzan", text: "套马的汉字自当威武雄壮！", audio: "quyi1.mp3" },
	{ cards: ["sha"], player: "shamoke", targetHas: "ganning", text: "我，蛮夷也，只识弯弓射乌鸦！", audio: "shamoke1.mp3" },
	{ cards: ["sha"], player: "sunhao", targetHas: "zhangyao", text: "吾之红楼，容不下汝！", audio: "sunhao1.mp3" },
	{ cards: ["sha"], player: "sunhao", targetHas: "zhangxuan", text: "形似而魂飞，汝非我佳人。", audio: "sunhao2.mp3" },
	{ cards: ["sha"], player: "xiahoujie", targetHas: "zhangfei", text: "就你嗓门大是吧！", audio: "xiahoujie1.mp3" },
	{ cards: ["sha"], player: "huangzhong", targetHas: "xiahouyuan", target: "xiahouyuan", text: "来骗！来偷袭！", audio: "xiahouyuan1.mp3" },
	{ cards: ["sha"], player: "caocao", targetHas: "xunyu", text: "君要臣死，臣不得不死。", audio: "xunyu1.mp3" },
	{ cards: ["sha"], player: "wangyi", targetHas: "yangwan", target: "yangwan", text: "我待汝为姊妹，汝视我为仇畴。", audio: "yangwan1.mp3" },
	{ cards: ["sha"], player: "caocao", targetHas: "yangxiu", target: "yangxiu", text: "都是鸡肋惹的祸。", audio: "yangxiu1.mp3" },
	{ cards: ["sha"], player: "zhangfei", targetHas: "yanyan", text: "老匹夫，安敢欺我无谋！", audio: "yanyan8.mp3" },
	{ cards: ["sha"], player: "dengai", targetHas: "zhugezhan", text: "生死存亡之际，在此一举！", audio: "dengai1.mp3" },
	{ cards: ["sha"], player: "diaochan", targetHas: "lvbu", text: "往日情分已断，休怪貂蝉无礼！", audio: "diaochan5.mp3" },
	{ cards: ["sha"], player: "liubei", targetHas: "liushan", text: "为汝这孺子，几损我一员大将。", audio: "liubei7.mp3" },
	{ cards: ["sha"], player: "guanyu", targetHas: "pangde", text: "庞德竖子，何敢藐视吾耶！", audio: "guanyu9.mp3" },
	{ cards: ["sha"], player: "guanyu", targetHas: "yanwen", text: "吾观颜良，如插标卖首耳！", audio: "guanyu11.mp3" },
	{ cards: ["sha"], player: "huangzhong", targetHas: "xiahouyuan", text: "夏侯小儿，纳命来！", audio: "huangzhong2.mp3" },
	{
		cards: ["sha"],
		player: "machao",
		targetHas: "caocao",
		sequence: [
			{ text: "穿红袍是曹贼！", audio: "machao1.mp3" },
			{ text: "长髯者是曹贼！", audio: "machao2.mp3" },
			{ text: "短髯者是曹贼！", audio: "machao3.mp3" },
		],
		sequenceKey: () => "machao-cao-cao",
	},
	{ cards: ["sha"], player: "xusheng", targetHas: "caochong", text: "今儿，给冲儿来刀狠的！", audio: "xusheng1.mp3" },
	{ cards: ["sha"], player: "luxun", targetHas: "liubei", text: "刘备兵疲意沮，取之正在今日！", audio: "luxun2.mp3" },
	{ cards: ["sha"], player: "luzhi", targetHas: ["zhangjiao", "zhangliang", "zhangbao"], text: "平定黄巾之乱，吾之本职。", audio: "luzhi1.mp3" },
	{ cards: ["sha"], player: "lvbu", targetHas: "dongzhuo", text: "大丈夫生于天地之间，岂能郁郁久居人下！", audio: "lvbu6.mp3" },
	{ cards: ["sha", "juedou"], player: "sunjian", targetHas: "dongzhuo", text: "休要走脱了此篡逆之辈！", audio: "sunjian2.mp3" },
	{ cards: ["sha"], player: "pangde", targetHas: "guanyu", text: "吾闻勇将不怯死以苟免，壮士不毁节而求生。", audio: "pangde1.mp3" },
];
