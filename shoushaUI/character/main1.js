app.import((lib, game, ui, get, ai, _status, app) => {
	// 获取势力背景图片路径接口
	function getName2BackgroundImage(group) {
		if (!group || group === "unknown") {
			return `extension/十周年UI/shoushaUI/character/images/shousha/character/name2_unknown.png`;
		}
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "devil", "daqin", "western", "shen", "key", "Han", "qin"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `extension/十周年UI/shoushaUI/character/images/shousha/character/name2_${group}.png`;
	}
	// 生成随机数据
	function generateRandomData(player) {
		const guanjieLevel = Math.floor(Math.random() * 13 + 1);
		return {
			winRate: get.SL ? get.SL(player) * 100 + "%" : Math.floor(Math.random() * (95 - 50 + 1)) + 50 + "%",
			guanjieLevel: guanjieLevel,
			popularity: Math.floor(Math.random() * 10000 + 1),
			escapeRate: Math.floor(Math.random() * (10 - 0 + 1) + 0),
			rankLevel: Math.floor(Math.random() * 6 + 1),
			level: Math.floor(Math.random() * 101) + 100,
			gailevel: Math.floor(Math.random() * (80 - 20 + 1)) + 20,
			vipLevel: Math.min(guanjieLevel + 1, 10),
			mvpCount: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
		};
	}
	const CONSTANTS = {
		// 官阶翻译映射
		GUANJIE_TRANSLATION: {
			1: ["士兵", ["步卒", "伍长", "什长", "队率", "屯长", "部曲"]],
			2: ["十夫长", ["县尉", "都尉", "步兵校尉", "典军校尉"]],
			3: ["百夫长", ["骑郎将", "车郎将", "羽林中郎将", "虎贲中郎将"]],
			4: ["千夫长", ["折冲将军", "虎威将军", "征虏将军", "荡寇将军"]],
			5: ["校尉", ["监军将军", "抚军将军", "典军将军", "领军将军"]],
			6: ["先锋将军", ["后将军", "左将军", "右将军", "前将军"]],
			7: ["骠骑将军", ["护军", "左护军", "右护军", "中护军"]],
			8: ["领军将军", ["都护", "左都护", "右都护", "中都护"]],
			9: ["中军将军", ["卫将军"]],
			10: ["大将军", ["车骑将军"]],
			11: ["大元帅", ["骠骑将军"]],
			12: ["大将军", ["大将军"]],
			13: ["大元帅", ["大司马"]],
		},
		// 段位翻译映射
		DUANWEI_TRANSLATION: {
			1: ["青铜Ⅰ", "青铜Ⅱ", "青铜Ⅲ"],
			2: ["白银Ⅰ", "白银Ⅱ", "白银Ⅲ"],
			3: ["黄金Ⅰ", "黄金Ⅱ", "黄金Ⅲ", "黄金Ⅳ"],
			4: ["翡翠Ⅰ", "翡翠Ⅱ", "翡翠Ⅲ", "翡翠Ⅳ"],
			5: ["大师Ⅰ", "大师Ⅱ", "大师Ⅲ", "大师Ⅳ", "大师Ⅴ"],
			6: ["传说Ⅰ", "传说Ⅱ", "绝世传说"],
		},
		// 图片路径前缀
		IMAGE_PATH_PREFIX: "extension/十周年UI/shoushaUI/character/images/shousha/dengjie/",
	};

	class EnhancedInfoManager {
		constructor() {
			this.playerDialog = null;
		}

		// 创建详细资料弹窗
		createEnhancedDetailPopup(player, randomData) {
			const popuperContainer = ui.create.div(
				".popup-container",
				{
					background: "rgb(0,0,0,0.8)",
				},
				ui.window
			);

			// 关闭按钮
			const guanbi = ui.create.div(".guanbi", popuperContainer);
			guanbi.addEventListener("click", () => {
				popuperContainer.style.display = "none";
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
			});

			const bigdialog = ui.create.div(".bigdialog", popuperContainer);

			// 创建各种信息区域
			this.createAvatarInfo(bigdialog, player, randomData);
			this.createRankInfo(bigdialog, randomData);
			this.createDuanweiInfo(bigdialog, randomData);
			this.createSkillInfo(bigdialog, player, randomData);

			return popuperContainer;
		}

		// 头像信息
		createAvatarInfo(bigdialog, player, randomData) {
			const minixingxiang = ui.create.div(".minixingxiang", bigdialog);
			const minixingxiangdi = ui.create.div(".minixingxiangdi", bigdialog);
			const xingbie = ui.create.div(".xingbie", minixingxiangdi);
			const xingbietu = ["pubui_icon_male", "pubui_icon_female"];
			xingbie.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/shousha/${xingbietu.randomGet()}.png`);

			const nameX = ui.create.div(
				".nameX",
				minixingxiang,
				player === game.me
					? lib.config.connect_nickname
					: get.translation([
						"氪金抽66", "卡宝真可爱", "蒸蒸日上", "√卡视我如父", "麒麟弓免疫枸杞",
						"坏可宣（老坏批）", "六千大败而归", "开局酒古锭", "遇事不决刷个乐",
						"见面两刀喜相逢", "改名出66", "时代的六万五", "韩旭", "司马长衫",
						"ogx", "狗卡不如无名杀", "王八万", "一拳兀突骨", "开局送神将",
						"丈八二桃", "装甲车车", "等我喝口酒", "Samuri", "马", "Log-Frunki",
						"aoe银钱豹", "没有丈八就托管", "无中yyds", "给咸鱼鸽鸽打call",
						"小零二哟～", "长歌最帅了", "大猫有侠者之风", "布灵布灵❤️",
						"我爱～摸鱼🐠～", "小寻寻真棒", "呲牙哥超爱笑", "是俺杀哒",
						"阿七阿七", "祖安·灰晖是龙王", "吃颗桃桃好遗计", "好可宣✓良民",
						"藏海表锅好", "金乎？木乎？水乎！！", "无法也无天", "西风不识相",
						"神秘喵酱", "星城在干嘛？", "子鱼今天摸鱼了吗？", "阳光苞里有阳光",
						"诗笺的小裙裙", "轮回中的消逝", "乱踢jb的云野", "小一是不是...是不是...",
						"美羊羊爱瑟瑟", "化梦的星辰", "杰哥带你登dua郎", "世中君子人",
						"叹年华未央", "短咕咕", "洛天依？！", "黄老板是好人～",
						"来点瑟瑟文和", "鲨鱼配辣椒", "萝卜～好萝卜", "废城君",
						"E佬细节鬼才", "感到棘手要怀念谁？", "半价小薯片",
						"JK欧拉欧拉欧拉", "新年快乐", "乔姐带你飞", "12345678？",
						"缘之空", "小小恐龙", "教主：杀我！", "才思泉涌的司马",
						"我是好人", "喜怒无常的大宝", "黄赌毒", "阴间杀～秋",
						"敢于劈瓜的关羽", "暮暮子",
					].randomGet(1))
			);

			const wanjiachenghao = ui.create.div(
				".wanjiachenghao",
				bigdialog,
				get.translation([
					"幸运爆棚", "可可爱爱", "蒸蒸日上", "当街弑父", "霹雳弦惊",
					"玄铁赛季", "大败而归", "好谋无断", "当机立断", "侠肝义胆",
					"无敌之人", "颇有家资", "韩旭的马", "司马长衫", "野猪突击",
					"杀杀杀杀", "俺也一样", "一拳兀突骨", "开局送一波",
					"丈八二桃把营连", "没事儿我掉什么血", "痛饮庆功酒",
					"男上加男", "马到成功", "这么说你很勇哦", "高风亮节",
					"白银赛季", "攻城拔寨", "建功立业", "很有智慧", "古之恶来",
					"猛虎啸林", "龙泉鱼渊", "兵起玄黄", "勇气参与奖",
					"敢不敢比划比划？", "是俺杀哒，都是俺杀哒！", "阿弥陀佛",
					"拦住他就要歪嘴了", "吃颗桃桃好遗计", "花姑娘的干活",
					"如履薄冰", "龙虎英雄傲苍穹", "无法也无天", "西风不识相",
					"你过江我也过江", "中门对狙", "好色之徒", "建安风骨",
					"高门雅士", "以一敌千", "恣意狂纵", "零陵上将军",
					"泥菩萨过江", "变化万千", "杰哥带你登dua郎",
				].randomGet(1))
			);

			minixingxiang.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/shousha/xingxiang${Math.floor(Math.random() * 6)}.png`);
		}

		// 官阶信息
		createRankInfo(bigdialog, randomData) {
			const guanjie = ui.create.div(".guanjie", bigdialog);
			guanjie.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}offical_icon_${randomData.guanjieLevel}.png`);
			const guanjieInfo = CONSTANTS.GUANJIE_TRANSLATION[randomData.guanjieLevel];
			ui.create.div(".guanjiewenzi", `<center>${guanjieInfo[0]}`, guanjie);
		}

		// 段位信息
		createDuanweiInfo(bigdialog, randomData) {
			const paiwei = ui.create.div(".paiweiditu", bigdialog);
			const duanwei = ui.create.div(".duanwei", paiwei);
			const duanweiInfo = CONSTANTS.DUANWEI_TRANSLATION[randomData.rankLevel];
			ui.create.div(".duanweishuzi", `<center>${duanweiInfo.randomGet()}`, paiwei);
			duanwei.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}pwtx_${randomData.rankLevel}.png`);

			ui.create.div(".xinyufen", `鲜花<br>${randomData.popularity}`, paiwei);
			ui.create.div(".renqizhi", `鸡蛋<br>${randomData.popularity}`, paiwei);
			ui.create.div(".paiweiType", "本赛季", paiwei);
			ui.create.div(".typeleft", paiwei);
			const typeright = ui.create.div(".typeright", paiwei);
			const width = (randomData.gailevel / 100) * 83;
			typeright.style.width = width + "px";
			ui.create.div(".dengjiX", randomData.gailevel + "%", paiwei);

			ui.create.div(".huiyuanX", "LV." + randomData.level, paiwei);
			ui.create.div(".gonghui", paiwei, get.translation(`(${["无名杀会员", "手机三国杀会员", "三国杀ol会员", "三国杀十周年会员", "怒焰三国杀会员", "欢乐三国杀会员", "阵面对决会员"].randomGet(1)})`));
		}

		// 擅长武将信息
		createSkillInfo(bigdialog, player, randomData) {
			window.zhanshi = {
				name: "十周年UI",
				url: lib.assetURL + "extension/十周年UI",
				SS_DaTing_zhounianqing_beijingyanhua: {
					name: "../../../十周年UI/shoushaUI/character/images/shousha/guge/SS_DaTing_zhounianqing_beijingyanhua",
				},
			};

			if (player == game.me) {
				this.createPlayerButtons(bigdialog, [
					{ class: "useless1", text: "分享", icon: "useless1.png" },
					{ class: "useless2", text: "展示(诏令－1)", icon: "useless2.png" },
					{ class: "useless3", text: "调整武将", icon: "useless1.png" },
					{ class: "useless4", text: "我的家园", icon: "useless1.png" }
				]);
			} else {
				this.createPlayerButtons(bigdialog, [
					{ class: "useless1", text: "拉黑名单", icon: "useless1.png" },
					{ class: "useless2", text: "私聊", icon: "useless1.png" },
					{ class: "useless3", text: "加为好友", icon: "useless1.png" },
					{ class: "useless4", text: "教训他", icon: "useless1.png" }
				]);
			}

			const shanchangdialog = ui.create.div(".shanchangdialog", bigdialog);
			const shanchang = Object.keys(lib.character)
				.filter(key => !lib.filter.characterDisabled(key))
				.randomGets(4);

			// 创建星级函数
			function createStars(container, rarity) {
				const num = { legend: 5, epic: 4, rare: 3, junk: 2 }[rarity] || 3;
				for (let i = 0; i < num; i++) ui.create.div(".item", container);
				for (let i = 0; i < 5 - num; i++) ui.create.div(".item.huixing", container);
			}

			// 创建武将区域函数
			function createLeftPane(parent, charName, player) {
				const skin = lib.config["extension_十周年UI_outcropSkin"];
				const skinClassMap = {
					shizhounian: ".left3",
					shousha: ".left2",
				};
				const cls = skinClassMap[skin] || ".left";
				const leftPane = ui.create.div(cls, parent);
				leftPane.setBackground(charName, "character");
				return leftPane;
			}

			for (let i = 0; i < 4; i++) {
				const charName = shanchang[i];
				const group = lib.character[charName][1];
				const charContainer = ui.create.div(`.shanchang`, shanchangdialog);
				const kuang = ui.create.div(`.kuang`, charContainer);
				kuang.setBackgroundImage(getName2BackgroundImage(group));
				const leftPane = createLeftPane(kuang, charName, player);
				const xing = ui.create.div(".xing", kuang);
				createStars(xing, game.getRarity(charName));
				const biankuangname = ui.create.div(".biankuangname", kuang);
				biankuangname.innerHTML = get.slimName(charName);

				// 添加换肤按钮
				if (window.zyile_charactercard) {
					const huanfu = ui.create.div(".huanfu", charContainer);
					huanfu.onclick = () => {
						window.zyile_charactercard(charName, charContainer, false);
					};
				}
			}
		}

		// 创建玩家按钮
		createPlayerButtons(bigdialog, buttons) {
			buttons.forEach(btn => {
				const button = ui.create.div(`.${btn.class}`, bigdialog, get.translation(btn.text));
				button.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/shousha/${btn.icon}`);
				button.onclick = function () {
					button.style.transform = "scale(0.9)";
					setTimeout(() => {
						button.style.transform = "scale(1)";
					}, 100);
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");

					// 特殊处理展示按钮
					if (btn.text === "展示(诏令－1)") {
						window.zhanshi = window.zhanshi || {
							name: "十周年UI",
							url: lib.assetURL + "extension/十周年UI",
							SS_DaTing_zhounianqing_beijingyanhua: {
								name: "../../../十周年UI/shoushaUI/character/images/shousha/guge/SS_DaTing_zhounianqing_beijingyanhua",
							},
						};

						if (window.dcdAnim && window.dcdAnim.loadSpine) {
							dcdAnim.loadSpine(window.zhanshi.SS_DaTing_zhounianqing_beijingyanhua.name, "skel", function () {
								dcdAnim.playSpine(window.zhanshi.SS_DaTing_zhounianqing_beijingyanhua, {
									speed: 1,
									scale: 0.95,
									parent: bigdialog
								});
							});
						}
					}
				};
			});
		}
	}

	const plugin = {
		name: "character",
		// 势力背景接口，外部可通过覆盖此方法自定义背景逻辑
		getName2BackgroundImage(group) {
			return getName2BackgroundImage(group);
		},
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) { },
		precontent() {
			app.reWriteFunction(lib, {
				setIntro: [
					function (args, node) {
						if (get.itemtype(node) === "player") {
							if (lib.config.touchscreen) {
								lib.setLongPress(node, plugin.click.playerIntro);
							} else if (lib.config.right_info) {
								node.oncontextmenu = plugin.click.playerIntro;
							}
							return node;
						}
					},
				],
			});
		},
		click: {
			identity(e) {
				e.stopPropagation();
				const player = this.parentNode;
				if (!game.getIdentityList) return;
				if (player.node.guessDialog) {
					player.node.guessDialog.classList.toggle("hidden");
				} else {
					const list = game.getIdentityList(player);
					if (!list) return;
					const guessDialog = ui.create.div(".guessDialog", player);
					const container = ui.create.div(guessDialog);
					lib.setScroll(guessDialog);
					player.node.guessDialog = guessDialog;
				}
			},
			playerIntro(e) {
				e.stopPropagation();
				if (plugin.playerDialog) {
					return plugin.playerDialog.show(this);
				}
				const container = ui.create.div(".popup-container.hidden", ui.window, e => {
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});

				container.show = function (player) {
					const dialog = ui.create.div(".character-dialog.popped", container);
					const blackBg1 = ui.create.div(".blackBg.one", dialog);
					const blackBg2 = ui.create.div(".blackBg.two", dialog);
					const basicInfo = ui.create.div(".basicInfo", blackBg1);

					const officalbg = ui.create.div(".offical-bg", blackBg1);
					const officalIcon = ui.create.div(".offical-icon", officalbg);
					const randomOffical = generateRandomData(player);
					if (player == game.me) {
						randomOffical.guanjieLevel = 13;
					}
					officalIcon.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}offical_icon_${randomOffical.guanjieLevel}.png`);
					const officalInfo = CONSTANTS.GUANJIE_TRANSLATION[randomOffical.guanjieLevel];
					ui.create.div(".offical-text", `<center>${officalInfo[0]}`, officalbg);
					const fightbg = ui.create.div(".fight-bg", blackBg1);
					const rightPane = ui.create.div(".right", blackBg2);
					const mingcheng = ui.create.div(".mingcheng", basicInfo);
					const dengji = ui.create.div(".dengji", basicInfo);
					const shenglv = ui.create.div(".shenglv", fightbg);
					const taolv = ui.create.div(".shenglv", fightbg);
					const viewBusinessCard = ui.create.div(".viewBusinessCard", "查看名片", blackBg1);
					const createButton = (name, parent) => {
						if (!name || !lib.character[name]) return;
						ui.create.button(name, "character", parent, true);
					};

					function createLeftPane(parent) {
						const skin = lib.config["extension_十周年UI_outcropSkin"];
						const skinClassMap = {
							shizhounian: ".left3",
							shousha: ".left2",
						};
						const cls = skinClassMap[skin] || ".left";
						return ui.create.div(cls, parent);
					}
					function createStars(container, rarity) {
						const num = { legend: 5, epic: 4, rare: 3, junk: 2 }[rarity] || 3;
						for (let i = 0; i < num; i++) ui.create.div(".item", container);
						for (let i = 0; i < 5 - num; i++) ui.create.div(".item.huixing", container);
					}
					if (!player.name2) {
						// 处理单武将情况
						let name = player.name1 || player.name;
						let name2 = player.name2;
						if (player.classList.contains("unseen") && player !== game.me) name = "unknown";
						if (player.classList.contains("unseen2") && player !== game.me) name2 = "unknown";

						let biankuang = ui.create.div(".biankuang", blackBg2);
						let leftPane = createLeftPane(biankuang);
						if (player.classList.contains("unseen") && player !== game.me) {
							biankuang.setBackgroundImage(plugin.getName2BackgroundImage("unknown"));
							leftPane.style.backgroundImage = "url('image/character/hidden_image.jpg')";
						} else {
							biankuang.setBackgroundImage(plugin.getName2BackgroundImage(player.group));
							leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
						}
						createButton(name, leftPane.firstChild);
						createButton(name2, leftPane.firstChild);
						const biankuangname = ui.create.div(".biankuangname", biankuang);
						if (!(player.classList.contains("unseen") && player !== game.me)) {
							const xing = ui.create.div(".xing", biankuang);
							createStars(xing, game.getRarity(player.name));
						}
						biankuangname.innerHTML = get.slimName(name);
					} else {
						// 处理双将
						rightPane.style.left = "280px";
						rightPane.style.width = "calc(100% - 300px)";
						let name = player.name1 || player.name;
						let name2 = player.name2;
						let group1 = lib.character[name][1];
						let group2 = lib.character[name2][1];
						if (player.classList.contains("unseen") && player !== game.me) name = "unknown";
						if (player.classList.contains("unseen2") && player !== game.me) name2 = "unknown";

						let biankuang = ui.create.div(".biankuang", blackBg2);
						let biankuang2 = ui.create.div(".biankuang2", blackBg2);
						let leftPane = createLeftPane(biankuang);
						let leftPane2 = createLeftPane(biankuang2);
						if (player.classList.contains("unseen") && player !== game.me) {
							biankuang.setBackgroundImage(plugin.getName2BackgroundImage("unknown"));
							leftPane.style.backgroundImage = "url('image/character/hidden_image.jpg')";
						} else {
							biankuang.setBackgroundImage(plugin.getName2BackgroundImage(group1));
							leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
						}

						if (player.classList.contains("unseen2") && player !== game.me) {
							biankuang2.setBackgroundImage(plugin.getName2BackgroundImage("unknown"));
							leftPane2.style.backgroundImage = "url('image/character/hidden_image.jpg')";
						} else {
							biankuang2.setBackgroundImage(plugin.getName2BackgroundImage(group2));
							leftPane2.setBackground(name2, "character");
						}
						createButton(name, leftPane.firstChild);
						createButton(name2, leftPane2.firstChild);
						const biankuangname = ui.create.div(".biankuangname", biankuang);
						const biankuangname2 = ui.create.div(".biankuangname2", biankuang2);
						if (!(player.classList.contains("unseen") && player !== game.me)) {
							const xing = ui.create.div(".xing", biankuang);
							createStars(xing, game.getRarity(player.name));
						}
						if (!(player.classList.contains("unseen2") && player !== game.me)) {
							const xing2 = ui.create.div(".xing", biankuang2);
							createStars(xing2, game.getRarity(player.name2));
						}
						biankuangname.innerHTML = get.slimName(name);
						biankuangname2.innerHTML = get.slimName(name2);
					}
					mingcheng.innerHTML = player.nickname || (player === game.me ? lib.config.connect_nickname : get.translation(player.name));
					if (player == game.me) {
						dengji.innerText = `Lv：220`;
					} else {
						dengji.innerText = `Lv：${Math.floor(Math.random() * 219 + 1)}`;
					}
					// 获取游戏记录
					const gameRecord = lib.config.gameRecord[lib.config.mode];
					let winRate;
					// 胜率计算逻辑
					if (gameRecord && !lib.config.mode === "guozhan" && !_status.connectMode) {
						const wins = gameRecord.str.match(/(\d+)胜/g)?.map(win => parseInt(win)) || [0];
						const losses = gameRecord.str.match(/(\d+)负/g)?.map(loss => parseInt(loss)) || [0];
						const totalWins = wins.reduce((acc, win) => acc + win, 0);
						const totalLosses = losses.reduce((acc, loss) => acc + loss, 0);
						const totalGames = totalWins + totalLosses;
						winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
					} else {
						winRate = Math.random() * 100;
					}
					// 辅助函数：生成随机百分比
					function getRandomPercentage() {
						return (Math.random() * 100).toFixed(2);
					}
					// 根据玩家身份设置胜率和逃率
					let winPercentage;
					let runPercentage;
					if (player == game.me) {
						winPercentage = winRate.toFixed(2);
						runPercentage = '0.00';
					} else {
						winPercentage = getRandomPercentage();
						runPercentage = getRandomPercentage();
					}
					// 辅助函数：将数字转换为图片
					function numberToImages(number) {
						const numberStr = number.toString();
						let imageHTML = '';
						for (let i = 0; i < numberStr.length; i++) {
							const char = numberStr[i];
							let imgSrc;
							if (char === '.') {
								imgSrc = lib.assetURL + "extension/十周年UI/shoushaUI/character/images/shousha/num/point.png";
							} else {
								imgSrc = lib.assetURL + "extension/十周年UI/shoushaUI/character/images/shousha/num/" + char + ".png";
							}
							imageHTML += '<img src="' + imgSrc + '" alt="' + char + '" style="--w: 25px;--h: calc(var(--w) * 52 / 38);width: var(--w);height: var(--h); margin-right:-9px;">';


						}
						const percentImgSrc = lib.assetURL + "extension/十周年UI/shoushaUI/character/images/shousha/num/personui_percentage.png";
						imageHTML += '<img src="' + percentImgSrc + '" alt="personui_percentage" style="--w: 28px;--h: calc(var(--w) * 51 / 41);width: var(--w);height: var(--h);">';
						return imageHTML;
					}
					// 胜率/逃率
					shenglv.innerHTML = '<span>胜&nbsp;率：</span><div style="margin-top:-30px;margin-left:55px; display:flex; align-items:flex-start;">' + numberToImages(winPercentage) + '</div>';
					taolv.innerHTML = '<span>逃&nbsp;率：</span><div style="margin-top:-30px;margin-left:55px; display:flex; align-items:flex-start;">' + numberToImages(runPercentage) + '</div>';

					dialog.classList.add("single");
					viewBusinessCard.onclick = () => {
						// 隐藏当前弹窗
						container.hide();
						game.resume2();

						// 生成随机数据
						const randomData = generateRandomData(player);
						const infoManager = new EnhancedInfoManager();
						const detailPopup = infoManager.createEnhancedDetailPopup(player, randomData);
						document.body.appendChild(detailPopup);
						detailPopup.style.display = "block";

						// 添加背景点击关闭
						detailPopup.addEventListener("click", event => {
							if (event.target === detailPopup) {
								detailPopup.style.display = "none";
								game.resume2();
							}
						});
					};

					rightPane.innerHTML = "<div></div>";
					lib.setScroll(rightPane.firstChild);
					let oSkills = player.getSkills(null, false, false).slice(0);
					oSkills = oSkills.filter(skill => lib.skill[skill] && skill !== "jiu" && !lib.skill[skill].nopop && !lib.skill[skill].equipSkill && lib.translate[skill + "_info"] && lib.translate[skill + "_info"] !== "");
					if (player === game.me && player.hiddenSkills.length) oSkills.addArray(player.hiddenSkills);
					const allShown = player.isUnderControl() || (!game.observe && game.me && game.me.hasSkillTag("viewHandcard", null, player, true));
					const shownHs = player.getShownCards();
					if (shownHs.length) {
						ui.create.div(".xcaption", player.hasCard(card => !shownHs.includes(card), "h") ? "明置的手牌" : "手牌区域", rightPane.firstChild);
						shownHs.forEach(item => {
							const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
							card.style.zoom = "0.6";
							rightPane.firstChild.appendChild(card);
						});
						if (allShown) {
							const hs = player.getCards("h");
							hs.removeArray(shownHs);
							if (hs.length) {
								ui.create.div(".xcaption", "其他手牌", rightPane.firstChild);
								hs.forEach(item => {
									const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
									card.style.zoom = "0.6";
									rightPane.firstChild.appendChild(card);
								});
							}
						}
					} else if (allShown) {
						const hs = player.getCards("h");
						if (hs.length) {
							ui.create.div(".xcaption", "手牌区域", rightPane.firstChild);
							hs.forEach(item => {
								const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
								card.style.zoom = "0.6";
								rightPane.firstChild.appendChild(card);
							});
						}
					}
					if (oSkills.length) {
						let captionText = "武将技能";
						const modeCaptionMap = {
							doudizhu: "武将技能·斗地主",
							identity: "武将技能·身份",
							versus: "武将技能·团战",
							single: "武将技能·1v1",
							guozhan: "武将技能·国战",
						};
						captionText = modeCaptionMap[lib.config.mode] || captionText;
						ui.create.div(".xcaption", captionText, rightPane.firstChild);
						oSkills.forEach(name => {
							const skillEnabled = get.info(name).enable;
							const skillIcon = skillEnabled ? "sp_zhu" : "sp_bei";
							const baseIcon = `<img src="extension/十周年UI/shoushaUI/character/images/shousha/${skillIcon}.png" style="width:25px;height:25px;margin-bottom:-7px;">`;
							const transparentIcon = `<img src="extension/十周年UI/shoushaUI/character/images/shousha/${skillIcon}.png" style="width:25px;height:25px;margin-bottom:-7px;opacity:0.5;">`;
							const skillName = `【${lib.translate[name]}】`;
							const skillInfo = get.skillInfoTranslation(name, player, false);

							if (player.forbiddenSkills[name]) {
								const conflict = player.forbiddenSkills[name].length ? `（与${get.translation(player.forbiddenSkills[name])}冲突）` : "（双将禁用）";
								ui.create.div(".xskill", `<div data-color><span style="opacity:0.5">${skillName}</span></div><div><span style="opacity:0.5">${conflict}${skillInfo}</span></div>`, rightPane.firstChild);
							} else if (player.hiddenSkills.includes(name)) {
								if (lib.skill[name].preHidden && get.mode() === "guozhan") {
									const id = ui.create.div(".xskill", transparentIcon + `<div data-color><span style="opacity:0.5">${skillName}</span></div><div><span style="opacity:0.5">${skillInfo}</span><br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div></div>`, rightPane.firstChild);
									const underlinenode = id.querySelector(".underlinenode");
									if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove("on");
									underlinenode.link = name;
									underlinenode.listen(ui.click.hiddenskill);
								} else {
									ui.create.div(".xskill", transparentIcon + `<div data-color><span style="opacity:0.5">${skillName}</span></div><div><span style="opacity:0.5">${skillInfo}</span></div>`, rightPane.firstChild);
								}
							} else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) {
								ui.create.div(".xskill", transparentIcon + `<div data-color><span style="opacity:0.5">${skillName}</span></div><div><span style="opacity:0.5">${skillInfo}</span></div>`, rightPane.firstChild);
							} else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
								const id = ui.create.div(".xskill", baseIcon + `<div data-color>${skillName}</div><div>${skillInfo}<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div></div>`, rightPane.firstChild);
								const underlinenode = id.querySelector(".underlinenode");

								// 处理自动技能开关状态
								const shouldDisable = (lib.skill[name].frequent && lib.config.autoskilllist.includes(name)) || (lib.skill[name].subfrequent && lib.skill[name].subfrequent.some(sub => lib.config.autoskilllist.includes(name + "_" + sub)));
								if (shouldDisable) underlinenode.classList.remove("on");

								underlinenode.link = name;
								underlinenode.listen(ui.click.autoskill2);
							} else if (lib.skill[name].clickable && player.isIn() && player.isUnderControl(true) && player === game.me) {
								const id = ui.create.div(".xskill", baseIcon + `<div data-color>${skillName}</div><div>${skillInfo}<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px;color: rgba(255, 203, 0, 1);">点击发动</div></div>`, rightPane.firstChild);
								const intronode = id.querySelector(".skillbutton");

								if (!_status.gameStarted || (lib.skill[name].clickableFilter && !lib.skill[name].clickableFilter(player))) {
									intronode.classList.add("disabled");
									intronode.style.opacity = 0.5;
								} else {
									intronode.link = player;
									intronode.func = lib.skill[name].clickable;
									intronode.classList.add("pointerdiv");
									intronode.listen(() => {
										container.hide();
										game.resume2();
									});
									intronode.listen(ui.click.skillbutton);
								}
							} else {
								ui.create.div(".xskill", baseIcon + `<div data-color>${skillName}</div><div>${skillInfo}</div>`, rightPane.firstChild);
							}
						});
					}
					const eSkills = player.getCards("e");
					if (eSkills.length) {
						ui.create.div(".xcaption", "装备区域", rightPane.firstChild);
						eSkills.forEach(card => {
							const cards = card.cards;
							let isQiexie = card.name.startsWith("qiexie_");
							let displayName = card.name + "_info";
							let str = [get.translation(isQiexie ? card.name : card), get.translation(displayName)];
							if (Array.isArray(cards) && cards.length) {
								str[0] += `（${get.translation(card.cards)}）`;
							}
							if (lib.card[card.name]?.cardPrompt) {
								str[1] = lib.card[card.name].cardPrompt(card, player);
							}
							if (isQiexie && lib.translate[card.name + "_append"]) {
								str[1] += `<br><br><div style="font-size: 0.85em; font-family: xinwei; line-height: 1.2;">${lib.translate[card.name + "_append"]}</div>`;
							}
							ui.create.div(".xskill", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, rightPane.firstChild);
						});
					}
					const judges = player.getCards("j");
					if (judges.length) {
						ui.create.div(".xcaption", "判定区域", rightPane.firstChild);
						judges.forEach(card => {
							const cards = card.cards;
							let str = [get.translation(card), get.translation(card.name + "_info")];
							if ((Array.isArray(cards) && cards.length && !lib.card[card]?.blankCard) || player.isUnderControl(true)) str[0] += `（${get.translation(cards)}）`;
							ui.create.div(".xskill", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, rightPane.firstChild);
						});
					}
					container.classList.remove("hidden");
					game.pause2();
				};
				plugin.characterDialog = container;
				container.show(this);
			},
		},
	};
	return plugin;
});
