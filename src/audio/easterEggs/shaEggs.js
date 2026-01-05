/**
 * @fileoverview 杀相关彩蛋配置
 * 定义使用杀卡牌时触发的彩蛋语音规则
 */

"use strict";

/**
 * @type {Array<Object>}
 * 杀彩蛋配置数组
 */
export const shaEasterEggs = [
	{ cards: ["sha"], player: "zhangfei", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "lvbu")), text: "三姓家奴休走！", audio: "zhangfei1.mp3" },
	{ cards: ["sha"], player: "zhangxiu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caocao")), text: "无耻曹贼！", audio: "zhangxiu1.mp3" },
	{ cards: ["sha"], player: "xuzhu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "xuyou")), text: "许攸如此无礼，某杀之矣！", audio: "xuchu1.mp3" },
	{ cards: ["sha"], player: "yuanshao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dongzhuo")), text: "汝剑利！吾剑未尝不利！", audio: "yuanshao1.mp3" },
	{ cards: ["sha"], player: "simayi", condition: ctx => ctx.targets?.find(t => ctx.hasName(t, "caocao")), target: "caocao", text: "仲达啊，孤终究还是看错了你", audio: "caocao4.mp3" },
	{ cards: ["sha"], player: "guansuo", condition: ctx => ctx.findPlayer?.("baosanniang"), text: "伤病已无碍。三娘，此次南征，我定要为你拿下首功！", audio: "guansuo1.mp3" },
	{ cards: ["sha"], player: "zhangliao", condition: ctx => ctx.targets?.some(t => t.group === "wu"), text: "雁门张文远在此！", audio: "zhangliao1.mp3" },
	{ cards: ["sha"], player: "dingshangwan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caocao")), text: "原来你曹孟德也会痛", audio: "dingshangwan1.mp3" },
	{ cards: ["sha"], player: "dingshangwan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zoushi")), text: "祸水！还我儿命来！", audio: "dingshangwan2.mp3" },
	{ cards: ["sha"], player: "simayi", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caoshuang")), text: "汝当真以为老夫病入膏肓？哈哈哈哈哈！", audio: "simayi1.mp3" },
	{ cards: ["sha"], player: "caopi", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "sunquan")), text: "吴王颇知学乎？", audio: "caopi2.mp3" },
	{ cards: ["sha"], player: "lvbu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dingyuan")), text: "义父再送儿一场富贵如何！", audio: "lvbu1.mp3" },
	{ cards: ["sha"], player: "zhangchangpu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhonghui")), text: "从小到大，最不乖的就是你！", audio: "zhangchangpu1.mp3" },
	{ cards: ["sha"], player: "bozai", text: "哈！" },
	{ cards: ["sha"], player: "xiangjiaoduanwu", text: "哈！" },
	{ cards: ["sha"], player: "sunce", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yuji")), text: "此乃妖人，能以妖术惑众，不可不除！", audio: "sunce1.mp3" },
	{ cards: ["sha"], player: "sunshangxiang", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dingfeng")), text: "你只怕周瑜，独不怕我？", audio: "sunshangxiang1.mp3" },
	{ cards: ["sha"], player: "sunshangxiang", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "xusheng")), text: "周瑜杀得尔等，我岂杀不得周瑜？", audio: "sunshangxiang2.mp3" },
	{ cards: ["sha"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "simazhao")), text: "你司马家做得，我便做不得？", audio: "zhonghui3.mp3" },
	{ cards: ["sha"], player: "zhangxiu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caoang")), text: "父债子偿，今日你在劫难逃！", audio: "zhangxiu4.mp3" },
	{ cards: ["sha"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhaoyun")), text: "老将军可知天水姜伯约！", audio: "jiangwei1.mp3" },
	{ cards: ["sha"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dengai")), text: "身后无主，纵使夺得祁山九寨又将何为？", audio: "jiangwei2.mp3" },
	{ cards: ["sha"], player: "hetaihou", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "wangrong")), text: "哀家赐你美酒，尔还不谢恩！", audio: "hetaihou1.mp3" },
	{ cards: ["sha"], player: "huaxin", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "fuhuanghou")), text: "大美冷宫，领包入住！", audio: "huaxin1.mp3" },
	{ cards: ["sha"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liuxie") || ctx.hasName(t, "wangyun")), text: "可伤天和，可伤人和，维不可伤文和！", audio: "jiaxu2.mp3" },
	{ cards: ["sha"], player: "liru", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liubian")), text: "乖，张嘴，酒来了！", audio: "liru1.mp3" },
	{ cards: ["sha"], player: "xiahouyuan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liangxing")), target: "liangxing", text: "不是，真动手啊！", audio: "liangxing1.mp3" },
	{ cards: ["sha"], player: "madai", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "weiyan")), text: "匹夫！我当真敢杀你！", audio: "madai1.mp3" },
	{ cards: ["sha"], player: "quyi", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "gongsunzan")), text: "套马的汉字自当威武雄壮！", audio: "quyi1.mp3" },
	{ cards: ["sha"], player: "shamoke", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "ganning")), text: "我，蛮夷也，只识弯弓射乌鸦！", audio: "shamoke1.mp3" },
	{ cards: ["sha"], player: "sunhao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhangyao")), text: "吾之红楼，容不下汝！", audio: "sunhao1.mp3" },
	{ cards: ["sha"], player: "sunhao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhangxuan")), text: "形似而魂飞，汝非我佳人。", audio: "sunhao2.mp3" },
	{ cards: ["sha"], player: "xiahoujie", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhangfei")), text: "就你嗓门大是吧！", audio: "xiahoujie1.mp3" },
	{ cards: ["sha"], player: "huangzhong", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "xiahouyuan")), target: "xiahouyuan", text: "来骗！来偷袭！", audio: "xiahouyuan1.mp3" },
	{ cards: ["sha"], player: "caocao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "xunyu")), text: "君要臣死，臣不得不死。", audio: "xunyu1.mp3" },
	{ cards: ["sha"], player: "wangyi", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yangwan")), target: "yangwan", text: "我待汝为姊妹，汝视我为仇畴。", audio: "yangwan1.mp3" },
	{ cards: ["sha"], player: "caocao", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yangxiu")), target: "yangxiu", text: "都是鸡肋惹的祸。", audio: "yangxiu1.mp3" },
	{ cards: ["sha"], player: "zhangfei", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yanyan")), text: "老匹夫，安敢欺我无谋！", audio: "yanyan8.mp3" },
	{ cards: ["sha"], player: "dengai", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhugezhan")), text: "生死存亡之际，在此一举！", audio: "dengai1.mp3" },
	{ cards: ["sha"], player: "diaochan", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "lvbu")), text: "往日情分已断，休怪貂蝉无礼！", audio: "diaochan5.mp3" },
	{ cards: ["sha"], player: "liubei", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liushan")), text: "为汝这孺子，几损我一员大将。", audio: "liubei7.mp3" },
	{ cards: ["sha"], player: "guanyu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "pangde")), text: "庞德竖子，何敢藐视吾耶！", audio: "guanyu9.mp3" },
	{ cards: ["sha"], player: "guanyu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "yanwen")), text: "吾观颜良，如插标卖首耳！", audio: "guanyu11.mp3" },
	{ cards: ["sha"], player: "huangzhong", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "xiahouyuan")), text: "夏侯小儿，纳命来！", audio: "huangzhong2.mp3" },
	// 马超杀曹操序列
	{
		cards: ["sha"],
		player: "machao",
		condition: ctx => ctx.targets?.find(t => ctx.hasName(t, "caocao")),
		sequence: [
			{ text: "穿红袍是曹贼！", audio: "machao1.mp3" },
			{ text: "长髯者是曹贼！", audio: "machao2.mp3" },
			{ text: "短髯者是曹贼！", audio: "machao3.mp3" },
		],
		sequenceKey: () => "machao-cao-cao",
	},
	{ cards: ["sha"], player: "xusheng", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "caochong")), text: "今儿，给冲儿来刀狠的！", audio: "xusheng1.mp3" },
	{ cards: ["sha"], player: "luxun", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "liubei")), text: "刘备兵疲意沮，取之正在今日！", audio: "luxun2.mp3" },
	{ cards: ["sha"], player: "luzhi", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "zhangjiao") || ctx.hasName(t, "zhangliang") || ctx.hasName(t, "zhangbao")), text: "平定黄巾之乱，吾之本职。", audio: "luzhi1.mp3" },
	{ cards: ["sha"], player: "lvbu", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dongzhuo")), text: "大丈夫生于天地之间，岂能郁郁久居人下！", audio: "lvbu6.mp3" },
	{ cards: ["sha", "juedou"], player: "sunjian", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "dongzhuo")), text: "休要走脱了此篡逆之辈！", audio: "sunjian2.mp3" },
	{ cards: ["sha"], player: "pangde", condition: ctx => ctx.targets?.some(t => ctx.hasName(t, "guanyu")), text: "吾闻勇将不怯死以苟免，壮士不毁节而求生。", audio: "pangde1.mp3" },
];
