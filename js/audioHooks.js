"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	const hasName = (player, name) => get.nameList(player).some(n => n && n.includes(name));
	const findPlayer = name => game.players?.find(p => hasName(p, name));
	const playAudio = file => game.playAudio("..", "extension", "十周年UI", `audio/caidan/${file}`);

	// 使用卡牌彩蛋
	const cardEasterEggs = [
		{ cards: ["jiu"], player: "zhugeliang", text: "北伐，启动！", audio: "zhugeliang1.mp3" },
		{ cards: ["jiu"], player: "weiyan", text: "北伐中原？延视为己任久矣！", audio: "weiyan1.mp3" },
		{ cards: ["jiu"], player: "caocao", condition: () => game.players?.some(p => hasName(p, "guanyu")), text: "云长公，请饮此热酒！", audio: "caocao3.mp3" },
		{ cards: ["tao"], player: "dianwei", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "主公勿忧！典韦来也！", audio: "dianwei1.mp3" },
		{ cards: ["tao"], player: "zhugeliang", condition: ctx => ctx.targets?.find(t => hasName(t, "feiyi")), target: "feiyi", text: "丞相所托，我等必不辜负！", audio: "feiyi1.mp3" },
		{ cards: ["tao"], player: "zhaoyun", condition: ctx => ctx.targets?.find(t => hasName(t, "liushan")), text: "阿斗，跟云叔走！", audio: "zhaoyun1.mp3" },
		{ cards: ["sha"], player: "zhangfei", condition: ctx => ctx.targets?.some(t => hasName(t, "lvbu")), text: "三姓家奴休走！", audio: "zhangfei1.mp3" },
		{ cards: ["sha"], player: "zhangxiu", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "无耻曹贼！", audio: "zhangxiu1.mp3" },
		{ cards: ["sha"], player: "xuzhu", condition: ctx => ctx.targets?.some(t => hasName(t, "xuyou")), text: "许攸如此无礼，某杀之矣！", audio: "xuchu1.mp3" },
		{ cards: ["sha"], player: "yuanshao", condition: ctx => ctx.targets?.some(t => hasName(t, "dongzhuo")), text: "汝剑利！吾剑未尝不利！", audio: "yuanshao1.mp3" },
		{ cards: ["sha"], player: "simayi", condition: ctx => ctx.targets?.find(t => hasName(t, "caocao")), target: "caocao", text: "仲达啊，孤终究还是看错了你", audio: "caocao4.mp3" },
		{ cards: ["sha"], player: "guansuo", condition: () => game.players?.some(p => hasName(p, "baosanniang")), text: "伤病已无碍。三娘，此次南征，我定要为你拿下首功！", audio: "guansuo1.mp3" },
		{ cards: ["sha"], player: "zhangliao", condition: ctx => ctx.targets?.some(t => t.group === "wu"), text: "雁门张文远在此！", audio: "zhangliao1.mp3" },
		{ cards: ["tao"], player: "lvbu", condition: ctx => ctx.targets?.find(t => hasName(t, "diaochan")), target: "diaochan", text: "呵呵呵，嗯~", audio: "diaochan2.mp3" },
		{ cards: ["baiyin"], player: "zhangfei", condition: () => game.players?.some(p => hasName(p, "machao")), text: "马超！汝的头在此！敢来取否！", audio: "zhangfei3.mp3" },
		{ cards: ["tiesuo"], player: "caocao", condition: () => game.players?.some(p => hasName(p, "pangtong")), text: "非先生良谋，安能破东吴也？", audio: "caocao6.mp3" },
		{ cards: ["tao"], player: "chendao", condition: ctx => ctx.targets?.find(t => hasName(t, "liubei")), text: "主公，我来救你！", audio: "chendao1.mp3" },
		{ cards: ["sha"], player: "simayi", condition: ctx => ctx.targets?.some(t => hasName(t, "caoshuang")), text: "汝当真以为老夫病入膏肓？哈哈哈哈哈！", audio: "simayi1.mp3" },
		{ cards: ["lebu"], player: "caoshuang", condition: ctx => ctx.targets?.some(t => hasName(t, "simayi")), text: "老贼装疯卖傻，当我等皆三岁小儿？", audio: "caoshuang1.mp3" },
		{ cards: ["sha"], player: "caopi", condition: ctx => ctx.targets?.some(t => hasName(t, "sunquan")), text: "吴王颇知学乎？", audio: "caopi2.mp3" },
		{ cards: ["tao"], player: "guojia", condition: ctx => ctx.targets?.find(t => hasName(t, "caocao")), target: "caocao", text: "有奉孝在，不使吾有此失也！", audio: "caocao10.mp3" },
		{ cards: ["zhangba"], player: "zhangfei", text: "得此神兵，某自当纵横天下！", audio: "zhangfei4.mp3" },
		{
			cards: ["zhangba"],
			player: "liuyan",
			sequence: [
				{ text: "奇哉怪也，此物怎会在我手中？", audio: "liuyan1.mp3" },
				{ text: "这丈八不会打断了吧。", audio: "liuyan3.mp3" },
				{ text: "我得此等好兵器，可用九鼎烹鹿！", audio: "liuyan4.mp3" },
			],
			sequenceKey: () => "liuyan",
		},
		{ cards: ["tao"], player: "caoying", condition: ctx => ctx.targets?.find(t => hasName(t, "zhaoyun")), text: "赵子龙，只能死在我手上", audio: "caoying1.mp3" },
		{ cards: ["sha"], player: "dingshangwan", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "原来你曹孟德也会痛", audio: "dingshangwan1.mp3" },
		{ cards: ["sha"], player: "dingshangwan", condition: ctx => ctx.targets?.some(t => hasName(t, "zoushi")), text: "祸水！还我儿命来！", audio: "dingshangwan2.mp3" },
		{ cards: ["shunshou"], player: "guozhao", condition: ctx => ctx.targets?.some(t => hasName(t, "zhenji")), text: "姐姐的凤冠，妹妹笑纳了", audio: "guozhao1.mp3" },
		{ cards: ["shunshou"], player: "liuyan", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangfei")), text: "求借将军兵器一用！", audio: "liuyan2.mp3" },
		{
			cards: ["sha"],
			player: "machao",
			condition: ctx => ctx.targets?.find(t => hasName(t, "caocao")),
			sequence: [
				{ text: "穿红袍是曹贼！", audio: "machao1.mp3" },
				{ text: "长髯者是曹贼！", audio: "machao2.mp3" },
				{ text: "短髯者是曹贼！", audio: "machao3.mp3" },
			],
			sequenceKey: () => "machao-cao-cao",
		},
		{ cards: ["sha"], player: "lvbu", condition: ctx => ctx.targets?.some(t => hasName(t, "dingyuan")), text: "义父再送儿一场富贵如何！", audio: "lvbu1.mp3" },
		{ cards: ["chitu"], player: "lvbu", text: "赤兔马，我们走！", audio: "lvbu2.mp3" },
		{ cards: ["fangtian"], player: "lvbu", text: "得方天画戟，弑天下群雄！", audio: "lvbu3.mp3" },
		{ cards: ["sha"], player: "zhangchangpu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhonghui")), text: "从小到大，最不乖的就是你！", audio: "zhangchangpu1.mp3" },
		{ cards: ["bingliang"], player: "zhangchangpu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhonghui")), text: "功课没做完不许吃饭！", audio: "zhangchangpu2.mp3" },
		{ cards: ["sha"], player: "bozai", text: "哈！" },
		{ cards: ["sha"], player: "xiangjiaoduanwu", text: "哈！" },
		{ cards: ["qinggang"], player: "caocao", text: "此剑，终物归原主！", audio: "caocao11.mp3" },
		{ cards: ["shunshou"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "qinyilu")), text: "汝妻子我养之！", audio: "caocao12.mp3" },
		{ cards: ["jiu"], player: "caocao", text: "醉酒当歌！人生几何！", audio: "caocao13.mp3" },
		{ cards: ["jiu"], player: "caochun", text: "壮士醉沙场！烈马啸西风！", audio: "caochun1.mp3" },
		{ cards: ["jiu"], player: "zhonghui", text: "偷本非礼，所以不拜", audio: "zhonghui1.mp3" },
		{ cards: ["tao"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => hasName(t, "jiangwei")), text: "伯约何来迟也", audio: "zhonghui2.mp3" },
		{ cards: ["tao"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangxiu")), target: "zhangxiu", text: "多谢文和，拉兄弟一把！", audio: "zhangxiu2.mp3" },
		{ cards: ["jiu"], player: "zerong", text: "酒肉穿肠过，佛祖心中留", audio: "zerong1.mp3" },
		{ cards: ["shunshou"], player: "zhouxuan", condition: ctx => ctx.targets?.some(t => hasName(t, "caopi")), text: "待我一观陛下手相", audio: "zhouxuan1.mp3" },
		{ cards: ["qinglong"], player: "guanyu", text: "青龙在手，可斩天下豪杰！", audio: "guanyu1.mp3" },
		{ cards: ["chitu"], player: "guanyu", text: "得此宝马，兄虽距千里，亦可一夕而至！", audio: "guanyu2.mp3" },
		{ cards: ["jiu"], player: "guanyu", text: "走马杀贼，提酒尚温", audio: "guanyu3.mp3" },
		{ cards: ["tao"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "今恩义两清！再见，当较生死！", audio: "guanyu4.mp3" },
		{ cards: ["wugu"], player: "zhangfei", text: "俺颇有家资！", audio: "zhangfei5.mp3" },
		{ cards: ["tao"], player: "chengong", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "我欲弃此县令！随公去图大事！", audio: "chengong2.mp3" },
		{ cards: ["jiu"], player: "chunyuqiong", text: "接着奏乐！嗝~接着喝！", audio: "chunyuqiong1.mp3" },
		{ cards: ["huogong"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "chunyuqiong")), target: "chunyuqiong", text: "阿满！烧我粮是吧！", audio: "chunyuqiong2.mp3" },
		{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "wangyun")), text: "老王，你还有个女儿啊！", audio: "dongzhuo1.mp3" },
		{ cards: ["sha"], player: "xusheng", condition: ctx => ctx.targets?.some(t => hasName(t, "caochong")), text: "今儿，给冲儿来刀狠的！", audio: "xusheng1.mp3" },
		{ cards: ["guding"], player: "xusheng", text: "在下，要给诸位来刀狠的", audio: "xusheng2.mp3" },
		{ cards: ["sha"], player: "sunce", condition: ctx => ctx.targets?.some(t => hasName(t, "yuji")), text: "此乃妖人，能以妖术惑众，不可不除！", audio: "sunce1.mp3" },
		{ cards: ["sha"], player: "sunshangxiang", condition: ctx => ctx.targets?.some(t => hasName(t, "dingfeng")), text: "你只怕周瑜，独不怕我？", audio: "sunshangxiang1.mp3" },
		{ cards: ["sha"], player: "sunshangxiang", condition: ctx => ctx.targets?.some(t => hasName(t, "xusheng")), text: "周瑜杀得尔等，我岂杀不得周瑜？", audio: "sunshangxiang2.mp3" },
		{ cards: ["sha"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => hasName(t, "simazhao")), text: "你司马家做得，我便做不得？", audio: "zhonghui3.mp3" },
		{ cards: ["tao"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangchangpu")), text: "母亲自幼严教，方有儿今日不世之功。", audio: "zhonghui4.mp3" },
		{ cards: ["sha"], player: "zhangxiu", condition: ctx => ctx.targets?.some(t => hasName(t, "caoang")), text: "父债子偿，今日你在劫难逃！", audio: "zhangxiu4.mp3" },
		{ cards: ["tao"], player: "huatuo", condition: ctx => ctx.targets?.some(t => hasName(t, "guanyu")), text: "刮骨之痛若无误，将军神人也！", audio: "huatuo1.mp3" },
		{ cards: ["tao"], player: "huatuo", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "医者如何能见死不救", audio: "huatuo2.mp3" },
		{ cards: ["sha"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => hasName(t, "zhaoyun")), text: "老将军可知天水姜伯约！", audio: "jiangwei1.mp3" },
		{ cards: ["sha"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => hasName(t, "dengai")), text: "身后无主，纵使夺得祁山九寨又将何为？", audio: "jiangwei2.mp3" },
		{ cards: ["sha"], player: "hetaihou", condition: ctx => ctx.targets?.some(t => hasName(t, "wangrong")), text: "哀家赐你美酒，尔还不谢恩！", audio: "hetaihou1.mp3" },
		{ cards: ["sha"], player: "huaxin", condition: ctx => ctx.targets?.some(t => hasName(t, "fuhuanghou")), text: "大美冷宫，领包入住！", audio: "huaxin1.mp3" },
		{ cards: ["jiedao"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => hasName(t, "lijue") || hasName(t, "guosi")), text: "今可率众而息，理攻长安，为董公报仇！", audio: "jiaxu1.mp3" },
		{ cards: ["sha"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => hasName(t, "liuxie") || hasName(t, "wangyun")), text: "可伤天和，可伤人和，维不可伤文和！", audio: "jiaxu2.mp3" },
		{ cards: ["shunshou"], player: "jianggan", condition: ctx => ctx.targets?.some(t => hasName(t, "zhouyu")), text: "读，读书人之事，何谓之窃？", audio: "jianggan1.mp3" },
		{ cards: ["sha"], player: "liru", condition: ctx => ctx.targets?.some(t => hasName(t, "liubian")), text: "乖，张嘴，酒来了！", audio: "liru1.mp3" },
		{ cards: ["sha"], player: "xiahouyuan", condition: ctx => ctx.targets?.some(t => hasName(t, "liangxing")), target: "liangxing", text: "不是，真动手啊！", audio: "liangxing1.mp3" },
		{ cards: ["dilu"], player: "liubei", text: "乘良驹渡险，愿盘息冲天！", audio: "liubei1.mp3" },
		{ cards: ["tao"], player: "liubei", condition: ctx => ctx.targets?.some(t => hasName(t, "guanyu") || hasName(t, "zhangfei")), text: "不求同年同月同日生，只求同年同月同日死。", audio: "liubei2.mp3" },
		{ cards: ["lebu"], player: "caopi", condition: ctx => ctx.targets?.some(t => hasName(t, "liushan")), target: "liushan", text: "此间乐，不思蜀也！", audio: "liushan1.mp3" },
		{ cards: ["tao"], player: "zhaozhong", condition: ctx => ctx.targets?.some(t => hasName(t, "liuhong")), target: "liuhong", text: "世上只有妈妈好！", audio: "liuhong1.mp3" },
		{ cards: ["shunshou"], player: "liuhong", condition: ctx => ctx.targets?.some(t => hasName(t, "hejin")), text: "这卖官鬻爵，卿可愿解囊否？", audio: "liuhong2.mp3" },
		{ cards: ["tao"], player: "liuyong", condition: ctx => ctx.targets?.some(t => hasName(t, "liushan")), text: "兄不知弟忠。弟不知兄愚！", audio: "liuyong1.mp3" },
		{ cards: ["tao"], player: "yanghu", condition: ctx => ctx.targets?.some(t => hasName(t, "lukang")), target: "lukang", text: "羊祜其真人者！", audio: "lukang1.mp3" },
		{ cards: ["huogong"], player: "luxun", condition: ctx => ctx.targets?.some(t => hasName(t, "liubei")), text: "玄德公七十里连营，安在否？", audio: "luxun1.mp3" },
		{ cards: ["tao"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "lvbu")), target: "lvbu", text: "布飘零半生，只恨未逢明主，公若不弃，布愿拜为义父！", audio: "lvbu5.mp3" },
		{ cards: ["qilin"], player: "lvbu", text: "辕门射戟，箭无虚发！", audio: "lvbu4.mp3" },
		{ cards: ["sha"], player: "madai", condition: ctx => ctx.targets?.some(t => hasName(t, "weiyan")), text: "匹夫！我当真敢杀你！", audio: "madai1.mp3" },
		{ cards: ["sha"], player: "quyi", condition: ctx => ctx.targets?.some(t => hasName(t, "gongsunzan")), text: "套马的汉字自当威武雄壮！", audio: "quyi1.mp3" },
		{ cards: ["sha"], player: "shamoke", condition: ctx => ctx.targets?.some(t => hasName(t, "ganning")), text: "我，蛮夷也，只识弯弓射乌鸦！", audio: "shamoke1.mp3" },
		{ cards: ["sha"], player: "sunhao", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangyao")), text: "吾之红楼，容不下汝！", audio: "sunhao1.mp3" },
		{ cards: ["sha"], player: "sunhao", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangxuan")), text: "形似而魂飞，汝非我佳人。", audio: "sunhao2.mp3" },
		{ cards: ["lebu"], player: "sunhao", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangxuan") || hasName(t, "zhangyao")), text: "形似而魂飞，汝非我佳人。", audio: "sunhao3.mp3" },
		{ cards: ["tao"], player: "sunquan", condition: ctx => ctx.targets?.some(t => hasName(t, "lingtong")), text: "孤有卓世良药，可医公绩之急。", audio: "sunquan1.mp3" },
		{ cards: ["sha"], player: "xiahoujie", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangfei")), text: "就你嗓门大是吧！", audio: "xiahoujie1.mp3" },
		{ cards: ["sha"], player: "huangzhong", condition: ctx => ctx.targets?.some(t => hasName(t, "xiahouyuan")), target: "xiahouyuan", text: "来骗！来偷袭！", audio: "xiahouyuan1.mp3" },
		{ cards: ["jiu"], player: "xurong", text: "已饮佳酿，正待尔等骨肉下酒！", audio: "xurong1.mp3" },
		{ cards: ["sha"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "xunyu")), text: "君要臣死，臣不得不死。", audio: "xunyu1.mp3" },
		{ cards: ["sha"], player: "wangyi", condition: ctx => ctx.targets?.some(t => hasName(t, "yangwan")), target: "yangwan", text: "我待汝为姊妹，汝视我为仇畴。", audio: "yangwan1.mp3" },
		{ cards: ["sha"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "yangxiu")), target: "yangxiu", text: "都是鸡肋惹的祸。", audio: "yangxiu1.mp3" },
		{ cards: ["juedou"], player: "yuanshao", condition: ctx => ctx.targets?.some(t => hasName(t, "dongzhuo")), text: "吾剑也未尝不利！", audio: "yuanshao2.mp3" },
		{ cards: ["shunshou"], player: "yuanshu", condition: ctx => ctx.targets?.some(t => hasName(t, "luji")), text: "陆朗做宾客，而怀橘乎？", audio: "yuanshu1.mp3" },
		{ cards: ["tao"], player: "liubei", condition: ctx => ctx.targets?.some(t => hasName(t, "yuanshu")), target: "yuanshu", text: "多谢将军，以泌水相赠！", audio: "yuanshu2.mp3" },
		{ cards: ["jiu"], player: "zhangfei", text: "本将军，嗝~千杯不醉！", audio: "zhangfei7.mp3" },
		{ cards: ["sha"], player: "zhangfei", condition: ctx => ctx.targets?.some(t => hasName(t, "yanyan")), text: "老匹夫，安敢欺我无谋！", audio: "yanyan8.mp3" },
		{ cards: ["shunshou"], player: "zhangkai", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "曹太公，把钱财交出来吧！", audio: "zhangkai1.mp3" },
		{ cards: ["qinggang"], player: "zhaoyun", text: "宝剑，自当配于英雄！", audio: "zhaoyun2.mp3" },
		{ cards: ["huogong"], player: "zhouyu", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "赤壁火起，曹贼霸业成空！", audio: "zhouyu1.mp3" },
		{ cards: ["tao"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "xunyu")), text: "吾之子房也！", audio: "caocao16.mp3" },
		{ cards: ["wugu"], player: "caocao", condition: () => game.players?.some(p => hasName(p, "yuanshao")), text: "吾任天下之智，以道御之，无所不可！", audio: "caocao18.mp3" },
		{ cards: ["sha"], player: "dengai", condition: ctx => ctx.targets?.some(t => hasName(t, "zhugezhan")), text: "生死存亡之际，在此一举！", audio: "dengai1.mp3" },
		{ cards: ["tao"], player: "diaochan", condition: ctx => ctx.targets?.some(t => hasName(t, "lvbu")), text: "将军不必多礼，貂蝉感激将军的救命之恩。", audio: "diaochan3.mp3" },
		{ cards: ["juedou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "曹操这个杂种，竟敢行刺洒家！", audio: "dongzhuo2.mp3" },
		{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "liru")), text: "哈哈哈，你真不愧是老夫的智囊啊！", audio: "dongzhuo3.mp3" },
		{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "diaochan")), text: "哼哼哼哼，更衣好啊！", audio: "dongzhuo4.mp3" },
		{ cards: ["sha", "juedou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "yuanshu")), text: "天下事在我！我今为之，谁敢不从！汝视我之剑不利否？", audio: "dongzhuo5.mp3" },
		{ cards: ["guohe"], player: "ganning", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "劫寨将轻骑，驱兵饮巨瓯！", audio: "ganning1.mp3" },
		{ cards: ["juedou"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "huangzhong")), text: "不用拖刀计，实难取胜。", audio: "guanyu5.mp3" },
		{ cards: ["tao"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "liubei")), text: "关某之命即是刘兄之命，关某之躯即为刘兄之躯！", audio: "guanyu6.mp3" },
		{ cards: ["tao"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangliao")), text: "某素知文远乃忠义之士。", audio: "guanyu8.mp3" },
		{ cards: ["sha"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "pangde")), text: "庞德竖子，何敢藐视吾耶！", audio: "guanyu9.mp3" },
		{ cards: ["tao"], player: "zhangfei", condition: ctx => ctx.targets?.some(t => hasName(t, "guanyu")), target: "guanyu", text: "我的好三弟！", audio: "guanyu10.mp3" },
		{ cards: ["sha"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "yanwen")), text: "吾观颜良，如插标卖首耳！", audio: "guanyu11.mp3" },
		{ cards: ["tao"], player: "guojia", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "嘉，感丞相大恩，虽死不能报万一。", audio: "guojia1.mp3" },
		{ cards: ["tao"], player: "guotu", condition: ctx => ctx.targets?.some(t => hasName(t, "yuanshao")), text: "以明公之神武，引河朔之强众，以伐曹操，易如覆手，何必乃尔！", audio: "guotu1.mp3" },
		{ cards: ["juedou"], player: "guotu", condition: ctx => ctx.targets?.some(t => hasName(t, "yuanshao")), text: "主公，所谓秦失其鹿，先得者王。", audio: "guotu2.mp3" },
		{ cards: ["sha"], player: "huanggai", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "曹贼休走！", audio: "huanggai1.mp3" },
		{ cards: ["juedou"], player: "huangzhong", condition: ctx => ctx.targets?.some(t => hasName(t, "xiahouyuan")), text: "昔廉颇年八十，尚食斗米、肉十斤，何况黄忠未及七十乎？", audio: "huangzhong1.mp3" },
		{ cards: ["sha"], player: "huangzhong", condition: ctx => ctx.targets?.some(t => hasName(t, "xiahouyuan")), text: "夏侯小儿，纳命来！", audio: "huangzhong2.mp3" },
		{ cards: ["tao"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => hasName(t, "zhonghui")), text: "功高盖主，赏无可赏，士季兄不会没有准备吧？", audio: "jiangwei5.mp3" },
		{ cards: ["wuzhong"], player: "jiaxu", text: "兵不厌诈，可伪许之。", audio: "jiaxu3.mp3" },
		{ cards: ["guding"], player: "", speaker: "xusheng", condition: ctx => !hasName(ctx.player, "xusheng") && findPlayer("xusheng"), text: "我刀呢？", audio: "xusheng3.mp3" },
		{ cards: ["sha"], player: "diaochan", condition: ctx => ctx.targets?.some(t => hasName(t, "lvbu")), text: "往日情分已断，休怪貂蝉无礼！", audio: "diaochan5.mp3" },
		{ cards: ["tao"], player: "liubei", condition: ctx => ctx.targets?.some(t => hasName(t, "zhugeliang")), text: "君才十倍于曹丕，必能安邦定国，终定大事。", audio: "liubei6.mp3" },
		{ cards: ["sha"], player: "liubei", condition: ctx => ctx.targets?.some(t => hasName(t, "liushan")), text: "为汝这孺子，几损我一员大将。", audio: "liubei7.mp3" },
		{ cards: ["tao"], player: "liubei", condition: ctx => ctx.targets?.some(t => hasName(t, "wolongfengchu")), text: "卧龙凤雏，虽千万人吾往矣。", audio: "liubei8.mp3" },
		{ cards: ["tao"], player: "liushan", condition: ctx => ctx.targets?.some(t => hasName(t, "zhugeliang")), text: "聪慧有何用，他有相父吗？朕有相父就够了。", audio: "liushan2.mp3" },
		{ cards: ["tao", "jiu"], player: "liushan", text: "父亲，我一定要光复汉室！", audio: "liushan3.mp3" },
		{ cards: ["wugu"], player: "liuyan", text: "益州熟，天下足！", audio: "liuyan5.mp3" },
		{ cards: ["lebu"], player: "liuyan", condition: ctx => ctx.targets?.some(t => hasName(t, "liuhong")), text: "谁又在心怀不轨？", audio: "liuyan6.mp3" },
	];

	const originalUseCard = lib.element.Player.prototype.useCard;
	lib.element.Player.prototype.useCard = function (...args) {
		const event = originalUseCard.apply(this, args);
		if (!event || !event.card || !event.player) return event;
		const cardName = get.name(event.card, event.player);
		const ctx = { card: event.card, player: event.player, targets: event.targets, cardName };
		for (const rule of cardEasterEggs) {
			if (!rule.cards.includes(cardName)) continue;
			if (!hasName(event.player, rule.player)) continue;
			if (rule.condition && !rule.condition(ctx)) continue;
			const speaker = rule.speaker ? findPlayer(rule.speaker) : rule.target ? ctx.targets?.find(t => hasName(t, rule.target)) : event.player;
			if (speaker) {
				const seq = nextSequence(rule, ctx);
				const text = seq?.text || rule.text;
				const audio = seq?.audio || rule.audio;
				if (text) speaker.say?.(text);
				if (audio) playAudio(audio);
				break;
			}
		}
		return event;
	};

	const sequenceState = new Map();
	const nextSequence = (rule, ctx) => {
		if (!rule.sequence?.length) return null;
		const key = (typeof rule.sequenceKey === "function" && rule.sequenceKey(ctx)) || `${rule.player}-${rule.cards.join(",")}`;
		const index = sequenceState.get(key) || 0;
		const result = rule.sequence[index % rule.sequence.length];
		sequenceState.set(key, index + 1);
		return result;
	};

	// 受伤特殊语音，真不是乃杀
	const damageEasterEggs = [{ player: "diaochan", text: "嗯啊~", audio: "diaochan1.mp3" }];

	const originalDamage = lib.element.Player.prototype.damage;
	lib.element.Player.prototype.damage = function (...args) {
		const event = originalDamage.apply(this, args);
		event?.then(() => {
			const damaged = event?.player || this;
			if (!damaged) return;
			for (const rule of damageEasterEggs) {
				if (hasName(damaged, rule.player)) {
					damaged.say?.(rule.text);
					playAudio(rule.audio);
					break;
				}
			}
		});
		return event;
	};

	// 这何尝不是一种苦命鸳鸯
	const deathEasterEggs = [
		{ deceased: "yuanshao", speaker: "caocao", text: "今本初已丧，我不能不为之流涕也", audio: "caocao7.mp3" },
		{ deceased: "liuhong", speaker: "zhangjiao", text: "带着你的大汉，去死吧！", audio: "zhangjiao2.mp3" },
	];

	const originalDie = lib.element.Player.prototype.$die;
	lib.element.Player.prototype.$die = function (...args) {
		const result = originalDie.apply(this, args);
		for (const rule of deathEasterEggs) {
			if (!hasName(this, rule.deceased)) continue;
			const speaker = findPlayer(rule.speaker);
			if (!speaker) continue;
			speaker.say?.(rule.text);
			if (rule.audio) playAudio(rule.audio);
			break;
		}
		return result;
	};

	// 回合开始彩蛋
	const phaseStartEasterEggs = [
		{ player: "caiwenji", text: "聆听吧，这是献给你的镇魂曲（", audio: "caiwenji1.mp3" },
		{ player: "sunhao", text: "朕的天下，都在碗底！", audio: "sunhao4.mp3" },
	];

	const originalTrigger = lib.element.GameEvent.prototype.trigger;
	lib.element.GameEvent.prototype.trigger = function (name) {
		const result = originalTrigger.apply(this, arguments);
		if (name === "phaseBeginStart") {
			const phasedPlayer = _status.currentPhase;
			if (phasedPlayer) {
				for (const rule of phaseStartEasterEggs) {
					if (hasName(phasedPlayer, rule.player)) {
						phasedPlayer.say?.(rule.text);
						if (rule.audio) playAudio(rule.audio);
						break;
					}
				}
			}
		}
		if (name === "chooseToCompareAfter" || (name === "compare" && ["chooseToCompare", "chooseToCompareMultiple"].includes(this.name))) {
			handleZhangfeiTie(this);
		}
		return result;
	};

	// 拼点相同彩蛋
	const handleZhangfeiTie = event => {
		if (event._zhangfeiTieHandled) return;
		const { player, target, result, num1, num2 } = event;
		const participants = [player, target].filter(p => p && get.itemtype(p) === "player");
		if (participants.length < 2) return;
		const tie = result?.tie || (typeof num1 === "number" && typeof num2 === "number" && num1 === num2);
		if (!tie) return;
		const speaker = participants.find(p => hasName(p, "zhangfei"));
		if (!speaker) return;
		speaker.say?.("俺也一样！");
		playAudio("zhangfei6.mp3");
		event._zhangfeiTieHandled = true;
	};

	// 真是一对苦命鸳鸯啊
	const gameStartDialogues = [
		{
			players: ["lvbu", "dongzhuo"],
			dialogues: [
				{ player: "lvbu", text: "你，你可有何话说？", delay: 500 },
				{ player: "dongzhuo", text: "再无话说，请速速动手！", delay: 1500 },
			],
		},
		{
			players: ["caocao", "chengong"],
			dialogues: [
				{ player: "caocao", text: "公台，别来无恙", audio: "caocao1.mp3", delay: 500 },
				{ player: "chengong", text: "汝心术不正！吾不栖汝！", audio: "chengong1.mp3", delay: 1500 },
			],
		},
		{
			players: ["wanglang", "zhugeliang"],
			dialogues: [
				{ player: "wanglang", text: "诸葛村夫，怎敢与管仲乐毅自恃？", audio: "wanglang1.mp3", delay: 500 },
				{ player: "zhugeliang", text: "我从未见过！有如此厚颜无耻之人！", audio: "zhugeliang2.mp3", delay: 1500 },
			],
		},
		{
			players: ["caocao", "miheng"],
			dialogues: [
				{ player: "caocao", text: "你以为辱骂几句，便能彰显才学？", audio: "caocao5.mp3", delay: 500 },
				{ player: "miheng", text: "我就骂你！我就骂你！", audio: "miheng1.mp3", delay: 1500 },
			],
		},
		{ players: ["zhugeliang", "luji"], dialogues: [{ player: "zhugeliang", text: "此真，旧病复发也。哈哈哈哈", audio: "zhugeliang4.mp3", delay: 500 }] },
		{ players: ["zhugeliang", "simayi"], dialogues: [{ player: "zhugeliang", text: "仲达，想要我的四轮车吗？", audio: "zhugeliang3.mp3", delay: 500 }] },
		{ players: ["simahui", "zhugeliang"], dialogues: [{ player: "simahui", text: "孔明虽得其主，不得其时。", audio: "simahui1.mp3", delay: 500 }] },
		{ players: ["zhangfei", "zhugeliang"], dialogues: [{ player: "zhangfei", text: "诸葛亮！俺今天就算绑，也要把你绑回去！", audio: "zhangfei2.mp3", delay: 500 }] },
		{ players: ["caocao", "guanyu"], dialogues: [{ player: "caocao", text: "云长，别来无恙否？", audio: "caocao2.mp3", delay: 500 }] },
		{ players: ["caocao", "yuanshu"], dialogues: [{ player: "caocao", text: "竖子不足与谋！", audio: "caocao9.mp3", delay: 500 }] },
		{ players: ["caopi", "sunquan"], dialogues: [{ player: "caopi", text: "孙权小丑，凭江悖暴。", audio: "caopi1.mp3", delay: 500 }] },
		{ players: ["chenshi", "simayi"], dialogues: [{ player: "chenshi", text: "司马懿，现在就来抓你！", audio: "chenshi1.mp3", delay: 500 }] },
		{ players: ["caocao", "machao"], dialogues: [{ player: "caocao", text: "马儿不死，我无葬身之地！", audio: "caocao8.mp3", delay: 500 }] },
		{ players: ["zhugeliang", "jiangwei"], dialogues: [{ player: "zhugeliang", text: "吾得伯约，如得一凤凰尔", audio: "zhugeliang5.mp3", delay: 500 }] },
		{ players: ["zhugeliang", "pangtong"], dialogues: [{ player: "zhugeliang", text: "士元兄，倘若不如意，一定要来荆州啊", audio: "zhugeliang6.mp3", delay: 500 }] },
		{ players: ["caocao", "dingshangwan"], dialogues: [{ player: "caocao", text: "逝者已往，夫人何必画地为牢", audio: "caocao14.mp3", delay: 500 }] },
		{ players: ["caojinyu", "heyan"], dialogues: [{ player: "caojinyu", text: "身为男儿身，却无英雄志", audio: "caojinyu1.mp3", delay: 500 }] },
		{ players: ["zhangjiao", "liuhong"], dialogues: [{ player: "zhangjiao", text: "这覆舟的水，都是百姓的泪！", audio: "zhangjiao1.mp3", delay: 500 }] },
		{ players: ["sunlingluan", "zhangfen"], dialogues: [{ player: "sunlingluan", text: "我终于，等到你了", audio: "sunlingluan1.mp3", delay: 500 }] },
		{ players: ["dianwei", "caocao"], dialogues: [{ player: "dianwei", text: "主公，戒色！", audio: "dianwei2.mp3", delay: 500 }] },
		{ players: ["zhangxiu", "caocao"], dialogues: [{ player: "zhangxiu", text: "明年的今天，便是你的祭日！", audio: "zhangxiu3.mp3", delay: 500 }] },
		{ players: ["jiangwei", "liubei"], dialogues: [{ player: "jiangwei", text: "往昔未见先主，今日始见龙颜！", audio: "jiangwei3.mp3", delay: 500 }] },
		{ players: ["jiangwei", "liushan"], dialogues: [{ player: "jiangwei", text: "愿陛下忍数日之辱，臣必使社稷危而复安!", audio: "jiangwei4.mp3", delay: 500 }] },
		{ players: ["huaxiong", "guanyu"], dialogues: [{ player: "huaxiong", text: "何方小将，报上名来!", audio: "huaxiong1.mp3", delay: 500 }] },
		{ players: ["jiachong", "caomao"], dialogues: [{ player: "jiachong", text: "天子谋反，当与民同罪!", audio: "jiachong1.mp3", delay: 500 }] },
		{ players: ["kebineng", "hanlong"], dialogues: [{ player: "kebineng", text: "年轻人总是太极端。", audio: "kebineng1.mp3", delay: 500 }] },
		{ players: ["lijue", "tangji"], dialogues: [{ player: "lijue", text: "本将军见妾而倾心，当栖之。", audio: "lijue1.mp3", delay: 500 }] },
		{ players: ["liubei", "zhugeliang"], dialogues: [{ player: "liubei", text: "备三顾先生茅庐，今日始见庐山。", audio: "liubei3.mp3", delay: 500 }] },
		{ players: ["liubei", "liubiao"], dialogues: [{ player: "liubei", text: "日月蹉跎人亦将老，而弟功业未建。", audio: "liubei4.mp3", delay: 500 }] },
		{ players: ["liubei", "guanyu", "zhangfei"], dialogues: [{ player: "liubei", text: "昔年桃园一拜，今日沙场再会，誓同生死！", audio: "liubei5.mp3", delay: 500 }] },
		{ players: ["liuchen", "liushan"], dialogues: [{ player: "liuchen", text: "孩儿刘谌，宁死不降！", audio: "liuchen1.mp3", delay: 500 }] },
		{ players: ["simahui", "liubei"], dialogues: [{ player: "simahui", text: "琴音高亢。必有英雄相听！", audio: "simahui2.mp3", delay: 500 }] },
		{ players: ["sunchen", "sunxiu"], dialogues: [{ player: "sunchen", text: "陛下可不要忘恩负义哟~", audio: "sunchen1.mp3", delay: 500 }] },
		{ players: ["sunquan", "gongsunyuan"], dialogues: [{ player: "sunquan", text: "说谎的人，要吞一千根针。", audio: "sunquan2.mp3", delay: 500 }] },
		{ players: ["sunquan", "yiji"], dialogues: [{ player: "sunquan", text: "侍奉无道之君，很幸苦吧。", audio: "sunquan3.mp3", delay: 500 }] },
		{ players: ["weiyan", "liubei"], dialogues: [{ player: "weiyan", text: "贼众，且魏拒之！贼寡，且魏吞之！", audio: "weiyan2.mp3", delay: 500 }] },
		{ players: ["xiahoujie", "zhangfei"], dialogues: [{ player: "xiahoujie", text: "沙场重地，切勿喧哗！", audio: "xiahoujie2.mp3", delay: 500 }] },
		{ players: ["yufan", "yujin"], dialogues: [{ player: "yufan", text: "败军之将，何颜苟活？", audio: "yufan1.mp3", delay: 500 }] },
		{ players: ["yuanshu", "liubei"], dialogues: [{ player: "yuanshu", text: "刘玄德，是个忠厚人啊~", audio: "yuanshu3.mp3", delay: 500 }] },
		{ players: ["zhanghu", "yuechen"], dialogues: [{ player: "zhanghu", text: "我们俩真是太强啦！", audio: "zhanghu1.mp3", delay: 500 }] },
		{ players: ["zhoushan", "zhangfei"], dialogues: [{ player: "zhoushan", text: "有话好好说，哪有见面就动手的？", audio: "zhoushan1.mp3", delay: 500 }] },
		{ players: ["caocao", "liubei"], dialogues: [{ player: "caocao", text: "天下英雄谁敌手！", audio: "caocao15.mp3", delay: 500 }] },
		{ players: ["caocao", "xunyu"], dialogues: [{ player: "caocao", text: "忠正密谋，抚宁内外，文若是也！", audio: "caocao17.mp3", delay: 500 }] },
		{ players: ["diaochan", "lvbu"], dialogues: [{ player: "diaochan", text: "将军英勇无比，貂蝉敬仰万分。", audio: "diaochan4.mp3", delay: 500 }] },
		{ players: ["guanyu", "sunquan"], dialogues: [{ player: "guanyu", text: "虎女，安能嫁犬子？", audio: "guanyu7.mp3", delay: 500 }] },
	];

	lib.announce.subscribe("gameStart", () => {
		if (!game.players?.length) return;
		for (const dialogue of gameStartDialogues) {
			const foundPlayers = dialogue.players.map(name => findPlayer(name)).filter(Boolean);
			if (foundPlayers.length !== dialogue.players.length) continue;
			dialogue.dialogues.forEach(({ player, text, audio, delay }) => {
				const targetPlayer = foundPlayers[dialogue.players.indexOf(player)];
				setTimeout(() => {
					targetPlayer.say?.(text);
					if (audio) playAudio(audio);
				}, delay);
			});
		}
	});
});
