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
		{ cards: ["tao", "taoyuan"], player: "dianwei", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "主公勿忧！典韦来也！", audio: "dianwei1.mp3" },
		{ cards: ["tao", "taoyuan"], player: "zhugeliang", condition: ctx => ctx.targets?.find(t => hasName(t, "feiyi")), target: "feiyi", text: "丞相所托，我等必不辜负！", audio: "feiyi1.mp3" },
		{ cards: ["tao", "taoyuan"], player: "zhaoyun", condition: ctx => ctx.targets?.find(t => hasName(t, "liushan")), text: "阿斗，跟云叔走！", audio: "zhaoyun1.mp3" },
		{ cards: ["sha", "juedou"], player: "zhangfei", condition: ctx => ctx.targets?.some(t => hasName(t, "lvbu")), text: "三姓家奴休走！", audio: "zhangfei1.mp3" },
		{ cards: ["sha", "juedou"], player: "zhangxiu", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "无耻曹贼！", audio: "zhangxiu1.mp3" },
		{ cards: ["sha", "juedou"], player: "xuzhu", condition: ctx => ctx.targets?.some(t => hasName(t, "xuyou")), text: "许攸如此无礼，某杀之矣！", audio: "xuchu1.mp3" },
		{ cards: ["sha", "juedou"], player: "yuanshao", condition: ctx => ctx.targets?.some(t => hasName(t, "dongzhuo")), text: "汝剑利！吾剑未尝不利！", audio: "yuanshao1.mp3" },
		{ cards: ["sha", "juedou"], player: "simayi", condition: ctx => ctx.targets?.find(t => hasName(t, "caocao")), target: "caocao", text: "仲达啊，孤终究还是看错了你", audio: "caocao4.mp3" },
		{ cards: ["sha", "juedou"], player: "guansuo", condition: () => game.players?.some(p => hasName(p, "baosanniang")), text: "伤病已无碍。三娘，此次南征，我定要为你拿下首功！", audio: "guansuo1.mp3" },
		{ cards: ["sha", "juedou"], player: "zhangliao", condition: ctx => ctx.targets?.some(t => t.group === "wu"), text: "雁门张文远在此！", audio: "zhangliao1.mp3" },
		{ cards: ["sha", "juedou"], player: "diaochan", text: "哈哈，嗯~", audio: "diaochan2.mp3" },
		{ cards: ["baiyin"], player: "zhangfei", condition: () => game.players?.some(p => hasName(p, "machao")), text: "马超！汝的头在此！敢来取否！", audio: "zhangfei3.mp3" },
		{ cards: ["tiesuo"], player: "caocao", condition: () => game.players?.some(p => hasName(p, "pangtong")), text: "非先生良谋，安能破东吴也？", audio: "caocao6.mp3" },
		{ cards: ["tao", "taoyuan"], player: "chendao", condition: ctx => ctx.targets?.find(t => hasName(t, "liubei")), text: "主公，我来救你！", audio: "chendao1.mp3" },
		{ cards: ["sha", "juedou"], player: "simayi", condition: ctx => ctx.targets?.some(t => hasName(t, "caoshuang")), text: "汝当真以为老夫病入膏肓？哈哈哈哈哈！", audio: "simayi1.mp3" },
		{ cards: ["lebu"], player: "caoshuang", condition: ctx => ctx.targets?.some(t => hasName(t, "simayi")), text: "老贼装疯卖傻，当我等皆三岁小儿？", audio: "caoshuang1.mp3" },
		{ cards: ["sha", "juedou"], player: "caopi", condition: ctx => ctx.targets?.some(t => hasName(t, "sunquan")), text: "吴王颇知学乎？", audio: "caopi2.mp3" },
		{ cards: ["tao", "taoyuan"], player: "guojia", condition: ctx => ctx.targets?.find(t => hasName(t, "caocao")), target: "caocao", text: "有奉孝在，不使吾有此失也！", audio: "caocao10.mp3" },
		{ cards: ["zhangba"], player: "zhangfei", text: "得此神兵，某自当纵横天下！", audio: "zhangfei4.mp3" },
		{ cards: ["zhangba"], player: "liuyan", text: "哈哈哈哈哈，我会图谋不轨？", audio: "liuyan1.mp3" },
		{ cards: ["tao", "taoyuan"], player: "caoying", condition: ctx => ctx.targets?.find(t => hasName(t, "zhaoyun")), text: "赵子龙，只能死在我手上", audio: "caoying1.mp3" },
		{ cards: ["sha", "juedou"], player: "dingshangwan", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "原来你曹孟德也会痛", audio: "dingshangwan1.mp3" },
		{ cards: ["sha", "juedou"], player: "dingshangwan", condition: ctx => ctx.targets?.some(t => hasName(t, "zoushi")), text: "祸水！还我儿命来！", audio: "dingshangwan2.mp3" },
		{ cards: ["shunshou"], player: "guozhao", condition: ctx => ctx.targets?.some(t => hasName(t, "zhenji")), text: "姐姐的凤冠，妹妹笑纳了", audio: "guozhao1.mp3" },
		{ cards: ["shunshou"], player: "liuyan", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangfei")), text: "求借将军兵器一用！", audio: "liuyan2.mp3" },
		{
			cards: ["sha", "juedou"],
			player: "machao",
			condition: ctx => ctx.targets?.find(t => hasName(t, "caocao")),
			sequence: [
				{ text: "穿红袍是曹贼！", audio: "machao1.mp3" },
				{ text: "长髯者是曹贼！", audio: "machao2.mp3" },
				{ text: "短髯者是曹贼！", audio: "machao3.mp3" },
			],
			sequenceKey: () => "machao-cao-cao",
		},
		{ cards: ["sha", "juedou"], player: "lvbu", condition: ctx => ctx.targets?.some(t => hasName(t, "dingyuan")), text: "义父再送儿一场富贵如何！", audio: "lvbu1.mp3" },
		{ cards: ["chitu"], player: "lvbu", text: "赤兔马，我们走！", audio: "lvbu2.mp3" },
		{ cards: ["fangtian"], player: "lvbu", text: "得方天画戟，弑天下群雄！", audio: "lvbu3.mp3" },
		{ cards: ["sha", "juedou"], player: "zhangchangpu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhonghui")), text: "从小到大，最不乖的就是你！", audio: "zhangchangpu1.mp3" },
		{ cards: ["bingliang"], player: "zhangchangpu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhonghui")), text: "功课没做完不许吃饭！", audio: "zhangchangpu2.mp3" },
		{ cards: ["sha", "juedou"], player: "bozai", text: "哈！" },
		{ cards: ["sha", "juedou"], player: "xiangjiaoduanwu", text: "哈！" },
		{ cards: ["qinggang"], player: "caocao", text: "此剑，终物归原主！", audio: "caocao11.mp3" },
		{ cards: ["shunshou"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "qinyilu")), text: "汝妻子我养之！", audio: "caocao12.mp3" },
		{ cards: ["jiu"], player: "caocao", text: "醉酒当歌！人生几何！", audio: "caocao13.mp3" },
		{ cards: ["jiu"], player: "caochun", text: "壮士醉沙场！烈马啸西风！", audio: "caochun1.mp3" },
		{ cards: ["jiu"], player: "zhonghui", text: "偷本非礼，所以不拜", audio: "zhonghui.mp3" },
		{ cards: ["tao", "taoyuan"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => hasName(t, "jiangwei")), text: "伯约何来迟也", audio: "zhonghui2.mp3" },
		{ cards: ["tao", "taoyuan"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangxiu")), target: "zhangxiu", text: "多谢文和，拉兄弟一把！", audio: "zhangxiu2.mp3" },
		{ cards: ["jiu"], player: "zerong", text: "酒肉穿肠过，佛祖心中留", audio: "zerong1.mp3" },
		{ cards: ["shunshou"], player: "zhouxuan", condition: ctx => ctx.targets?.some(t => hasName(t, "caopi")), text: "待我一观陛下手相", audio: "zhouxuan1.mp3" },
		{ cards: ["qinglong"], player: "guanyu", text: "青龙在手，可斩天下豪杰！", audio: "guanyu1.mp3" },
		{ cards: ["chitu"], player: "guanyu", text: "得此宝马，兄虽距千里，亦可一夕而至！", audio: "guanyu2.mp3" },
		{ cards: ["jiu"], player: "guanyu", text: "走马杀贼，提酒尚温", audio: "guanyu3.mp3" },
		{ cards: ["tao", "taoyuan"], player: "guanyu", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "今恩义两清！再见，当较生死！", audio: "guanyu4.mp3" },
		{ cards: ["wugu"], player: "zhangfei", text: "俺颇有家资！", audio: "zhangfei5.mp3" },
		{ cards: ["tao", "taoyuan"], player: "chengong", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "我欲弃此县令！随公去图大事！", audio: "chengong2.mp3" },
		{ cards: ["jiu"], player: "chunyuqiong", text: "接着奏乐！嗝~接着喝！", audio: "chunyuqiong1.mp3" },
		{ cards: ["huogong"], player: "caocao", condition: ctx => ctx.targets?.some(t => hasName(t, "chunyuqiong")), target: "chunyuqiong", text: "阿满！烧我粮是吧！", audio: "chunyuqiong2.mp3" },
		{ cards: ["shunshou"], player: "dongzhuo", condition: ctx => ctx.targets?.some(t => hasName(t, "wangyun")), text: "老王，你还有个女儿啊！", audio: "dongzhuo1.mp3" },
		{ cards: ["sha"], player: "xusheng", condition: ctx => ctx.targets?.some(t => hasName(t, "caochong")), text: "今儿，给冲儿来刀狠的！", audio: "xusheng1.mp3" },
		{ cards: ["guding"], player: "xusheng", text: "在下，要给诸位来刀狠的", audio: "xusheng2.mp3" },
		{ cards: ["sha", "juedou"], player: "sunce", condition: ctx => ctx.targets?.some(t => hasName(t, "yuji")), text: "此乃妖人，能以妖术惑众，不可不除！", audio: "sunce1.mp3" },
		{ cards: ["sha", "juedou"], player: "sunshangxiang", condition: ctx => ctx.targets?.some(t => hasName(t, "dingfeng")), text: "你只怕周瑜，独不怕我？", audio: "sunshangxiang1.mp3" },
		{ cards: ["sha", "juedou"], player: "sunshangxiang", condition: ctx => ctx.targets?.some(t => hasName(t, "xusheng")), text: "周瑜杀得尔等，我岂杀不得周瑜？", audio: "sunshangxiang2.mp3" },
		{ cards: ["sha", "juedou"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => hasName(t, "simazhao")), text: "你司马家做得，我便做不得？", audio: "zhonghui3.mp3" },
		{ cards: ["tao", "taoyuan"], player: "zhonghui", condition: ctx => ctx.targets?.some(t => hasName(t, "zhangchangpu")), text: "母亲自幼严教，方有儿今日不世之功。", audio: "zhonghui4.mp3" },
		{ cards: ["sha", "juedou"], player: "zhangxiu", condition: ctx => ctx.targets?.some(t => hasName(t, "caoang")), text: "父债子偿，今日你在劫难逃！", audio: "zhangxiu4.mp3" },
		{ cards: ["tao", "taoyuan"], player: "huatuo", condition: ctx => ctx.targets?.some(t => hasName(t, "guanyu")), text: "刮骨之痛若无误，将军神人也！", audio: "huatuo1.mp3" },
		{ cards: ["tao", "taoyuan"], player: "huatuo", condition: ctx => ctx.targets?.some(t => hasName(t, "caocao")), text: "医者如何能见死不救", audio: "huatuo2.mp3" },
		{ cards: ["sha", "juedou"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => hasName(t, "zhaoyun")), text: "老将军可知天水姜伯约！", audio: "jiangwei1.mp3" },
		{ cards: ["sha", "juedou"], player: "jiangwei", condition: ctx => ctx.targets?.some(t => hasName(t, "dengai")), text: "身后无主，纵使夺得祁山九寨又将何为？", audio: "jiangwei2.mp3" },
		{ cards: ["sha", "juedou"], player: "hetaihou", condition: ctx => ctx.targets?.some(t => hasName(t, "wangrong")), text: "哀家赐你美酒，尔还不谢恩！", audio: "hetaihou1.mp3" },
		{ cards: ["sha", "juedou"], player: "huaxin", condition: ctx => ctx.targets?.some(t => hasName(t, "fuhuanghou")), text: "大美冷宫，领包入住！", audio: "huaxin1.mp3" },
		{ cards: ["jiedao"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => hasName(t, "lijue") || hasName(t, "guosi")), text: "今可率众而息，理攻长安，为董公报仇！", audio: "jiaxu1.mp3" },
		{ cards: ["sha", "juedou"], player: "jiaxu", condition: ctx => ctx.targets?.some(t => hasName(t, "liuxie") || hasName(t, "wangyun")), text: "可伤天和，可伤人和，维不可伤文和！", audio: "jiaxu2.mp3" },
		{ cards: ["shunshou"], player: "jianggan", condition: ctx => ctx.targets?.some(t => hasName(t, "zhouyu")), text: "读，读书人之事，和谓之窃？", audio: "jianggan1.mp3" },
		{ cards: ["sha", "juedou"], player: "liru", condition: ctx => ctx.targets?.some(t => hasName(t, "liubian")), text: "乖，张嘴，酒来了！", audio: "liru1.mp3" },
		{ cards: ["sha", "juedou"], player: "xiahouyuan", condition: ctx => ctx.targets?.some(t => hasName(t, "liangxing")), target: "liangxing", text: "不是，真动手啊！", audio: "liangxing1.mp3" },
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
			const speaker = rule.target ? ctx.targets?.find(t => hasName(t, rule.target)) : event.player;
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
	const phaseStartEasterEggs = [{ player: "caiwenji", text: "聆听吧，这是献给你的镇魂曲（", audio: "caiwenji1.mp3" }];

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
