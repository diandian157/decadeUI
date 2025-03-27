app.import(function (lib, game, ui, get, ai, _status, app) {
	var plugin = {
		name: "character",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			app.reWriteFunction(lib, {
				setIntro: [
					function (args, node) {
						if (get.itemtype(node) === "player") {
							if (lib.config.touchscreen) {
								lib.setLongPress(node, plugin.click.playerIntro);
							} else {
								if (lib.config.right_info) {
									node.oncontextmenu = plugin.click.playerIntro;
								}
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
				var player = this.parentNode;
				if (!game.getIdentityList) return;
				if (player.node.guessDialog) {
					player.node.guessDialog.classList.toggle("hidden");
				} else {
					var list = game.getIdentityList(player);
					if (!list) return;
					var guessDialog = ui.create.div(".guessDialog", player);
					var container = ui.create.div(guessDialog);

					lib.setScroll(guessDialog);
					player.node.guessDialog = guessDialog;
				}
			},
			playerIntro(e) {
				e.stopPropagation();

				if (plugin.playerDialog) {
					return plugin.playerDialog.show(this);
				}

				var container = ui.create.div(".popup-container.hidden", ui.window, function (e) {
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});
				var dialog = ui.create.div(".character-dialog.popped", container);
        var blackBg1=ui.create.div(".blackBg.one", dialog);
        var blackBg2=ui.create.div(".blackBg.two", dialog);
        var basicInfo=ui.create.div(".basicInfo", blackBg1);
        //官阶
        var officalMap={
          offical_icon_1:'士兵',
          offical_icon_2:'十夫长',
          offical_icon_3:'百夫长',
          offical_icon_4:'千夫长',
          offical_icon_5:'校尉',
          offical_icon_6:'先锋',
          offical_icon_7:'中军将军',
          offical_icon_8:'领军将军',
          offical_icon_9:'骠骑将军',
          offical_icon_10:'大将军',
          offical_icon_11:'大元帅',
        }
        var officalbg=ui.create.div(".offical-bg", blackBg1);
        var officalIcon=ui.create.div(".offical-icon", officalbg);
        var randomOffical=Object.keys(officalMap).randomGet();
        officalIcon.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/shousha/${randomOffical}.png`);
        var officalText=ui.create.div(".offical-text",officalMap[randomOffical], officalbg);

        var fightbg=ui.create.div(".fight-bg", blackBg1);

				// var xinxi = ui.create.div(".xinxi", dialog);
				var rightPane = ui.create.div(".right", blackBg2);

				var mingcheng = ui.create.div(".mingcheng", basicInfo);

				var dengji = ui.create.div(".dengji", basicInfo);

				//胜率
				var shenglv = ui.create.div(".shenglv", fightbg);

				//逃率
				var taolv = ui.create.div(".shenglv", fightbg);

        var viewBusinessCard=ui.create.div(".viewBusinessCard","查看名片", blackBg1);

				var createButton = function (name, parent) {
					if (!name) return;
					if (!lib.character[name]) return;
					var button = ui.create.button(name, "character", parent, true);
				};

				container.show = function (player) {
					var name = player.name1 || player.name;
					var name2 = player.name2;
					if (player.classList.contains("unseen") && player !== game.me) {
						name = "unknown";
					}
					if (player.classList.contains("unseen2") && player !== game.me) {
						name2 = "unknown";
					}

					//var url = extensionPath + 'character/images/name2_' + value + '.png';
          //武将
					if (lib.config.extension_十周年UI_ZLLT == true) {
						var biankuang = ui.create.div(".biankuang", blackBg2);
					} else {
						var biankuang = ui.create.div(".biankuang2", blackBg2);
					}
					biankuang.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/shousha/name2_${player.group}.png`);

					if (lib.config.extension_十周年UI_ZLLT == true) {
						var leftPane = ui.create.div(".left", biankuang);
					} else {
						var leftPane = ui.create.div(".left2", biankuang);
					}
					leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
					createButton(name, leftPane.firstChild);
					createButton(name2, leftPane.firstChild);
          var biankuangname = ui.create.div(".biankuangname", biankuang);
          var xing = ui.create.div(".xing", biankuang);

					var num = 1,
						rarity = game.getRarity(player.name);
					switch (rarity) {
						case "legend":
							num = 5;
							break;
						case "epic":
							num = 4;
							break;
						case "rare":
							num = 3;
							break;
						case "junk":
							num = 2;
							break;
						default:
							num = 1;
							break;
					}
					for (var numKey = 0; numKey < num; numKey++) ui.create.div(".item", xing);

					//角色名-资料页
					biankuangname.innerText = get.translation(player.name);

					mingcheng.innerText = get.translation(player.name);
					// mingcheng.style.cssText = "display: block;position: absolute;top: -15px;right: 423px;font-size:20px;color:#4B3B30;text-shadow:none;font-weight:bold;font-family: 'FZLBJW';z-index:68";

					//角色等级
					dengji.innerText= "Lv："+Math.floor(Math.random() * (200 - 1 + 1) + 1);
					//dengji.style.cssText = "display: block;position: absolute;top: -13px;right: 325px;font-size:21px;font-family:'shousha';color: white; !important; z-index:68";

					shenglv.innerHTML = `<span style="font-size: 20px;">胜率：</span>`+(num = Math.floor(Math.random() * (99 - 0 + 1) + 0)) + "." + (num = Math.floor(Math.random() * (99 - 0 + 1) + 0)) + "%";
					//shenglv.style.cssText = "display: block;position: absolute;top: 68px;right: 383px;font-size:28px;font-family:'shousha';color: white; webkit-text-stroke:0.5px black !important; z-index:68";

					taolv.innerHTML = `<span style="font-size: 20px;">逃率：</span>`+(num = Math.floor(Math.random() * (99 - 0 + 1) + 0)) + "." + (num = Math.floor(Math.random() * (99 - 0 + 1) + 0)) + "%";
					//taolv.style.cssText = "display: block;position: absolute;top: 68px;right: 170px;font-size:28px;font-family:'shousha';color: white; webkit-text-stroke:0.5px black !important; z-index:68";

					var shanchang = get.config("recentCharacter");

					dialog.classList.add("single");
					viewBusinessCard.onclick = function () {
						var popuperContainer = ui.create.div(".popup-container", { background: "rgb(0,0,0,0)" }, ui.window);
						popuperContainer.addEventListener("click", event => {
							event.stopPropagation();
							popuperContainer.delete(200);
						});
						var bigdialog = ui.create.div(".bigdialog", popuperContainer);

						var kuangkuang1 = ui.create.div(".kuangkuang1", bigdialog);
						var kuangkuang2 = ui.create.div(".kuangkuang2", bigdialog);
						var kuangkuang3 = ui.create.div(".kuangkuang3", bigdialog);
						var kuangkuang4 = ui.create.div(".kuangkuang4", bigdialog);

						var shanchang1 = ui.create.div(".shanchang1", bigdialog);
						var shanchang2 = ui.create.div(".shanchang2", bigdialog);
						var shanchang3 = ui.create.div(".shanchang3", bigdialog);
						var shanchang4 = ui.create.div(".shanchang4", bigdialog);
						var minixingxiang = ui.create.div(".minixingxiang", bigdialog);
						var jingji = ui.create.div(".jingji", bigdialog);
						var xingbie = ui.create.div(".xingbie", bigdialog);
						var useless = ui.create.div(".useless", bigdialog);
						var useless2 = ui.create.div(".useless2", bigdialog);
						var wanjiaming = ui.create.div(
							".wanjiaming",
							bigdialog,
							player === game.me
								? lib.config.connect_nickname
								: get.translation(
										(innerText = num =
											[
												"氪金抽66",
												"卡宝真可爱",
												"蒸蒸日上",
												"√卡视我如父",
												"麒麟弓免疫枸杞",
												"坏可宣（老坏批）",
												"六千大败而归",
												"开局酒古锭",
												"遇事不决刷个乐",
												"见面两刀喜相逢",
												"改名出66",
												"时代的六万五",
												"韩旭",
												"司马长衫",
												"ogx",
												"狗卡不如无名杀",
												"王八万",
												"一拳兀突骨",
												"开局送神将",
												"丈八二桃",
												"装甲车车",
												"等我喝口酒",
												"Samuri",
												"马",
												"Log-Frunki",
												"aoe银钱豹",
												"没有丈八就托管",
												"无中yyds",
												"给咸鱼鸽鸽打call",
												"小零二哟～",
												"长歌最帅了",
												"大猫有侠者之风",
												"布灵布灵❤️",
												"我爱～摸鱼🐠～",
												"小寻寻真棒",
												"呲牙哥超爱笑",
												"是俺杀哒",
												"阿七阿七",
												"祖安·灰晖是龙王",
												"吃颗桃桃好遗计",
												"好可宣✓良民",
												"藏海表锅好",
												"金乎？木乎？水乎！！",
												"无法也无天",
												"西风不识相",
												"神秘喵酱",
												"星城在干嘛？",
												"子鱼今天摸鱼了吗？",
												"阳光苞里有阳光",
												"诗笺的小裙裙",
												"轮回中的消逝",
												"乱踢jb的云野",
												"小一是不是...是不是...",
												"美羊羊爱瑟瑟",
												"化梦的星辰",
												"杰哥带你登dua郎",
												"世中君子人",
												"叹年华未央",
												"短咕咕",
												"洛天依？！",
												"黄老板是好人～",
												"来点瑟瑟文和",
												"鲨鱼配辣椒",
												"萝卜～好萝卜",
												"废城君",
												"E佬细节鬼才",
												"感到棘手要怀念谁？",
												"半价小薯片",
												"JK欧拉欧拉欧拉",
												"新年快乐",
												"乔姐带你飞",
												"12345678？",
												"缘之空",
												"小小恐龙",
												"教主：杀我！",
												"才思泉涌的司马",
												"我是好人",
												"喜怒无常的大宝",
												"黄赌毒",
												"阴间杀～秋",
												"敢于劈瓜的关羽",
												"暮暮子",
											].randomGet(1))
								  )
						);
						var gonghui = ui.create.div(".gonghui", bigdialog, get.translation((innerText = "(" + (num = ["无名杀会员", "手机三国杀会员", "三国杀ol会员", "三国杀十周年会员", "怒焰三国杀会员", "欢乐三国杀会员", "阵面对决会员"]).randomGet(1) + ")")));
						var xianhua = ui.create.div(".xianhua", bigdialog, get.translation((innerText = "鲜花" + (num = Math.floor(Math.random() * (999 - 1 + 1) + 1)))));
						var jidan = ui.create.div(".jidan", bigdialog, get.translation((innerText = "鸡蛋" + (num = Math.floor(Math.random() * (999 - 1 + 1) + 1)))));
						var fenxiang = ui.create.div(".fenxiang", bigdialog, get.translation((innerText = "分享")));
						var zhanshi = ui.create.div(".zhanshi", bigdialog, get.translation((innerText = "展示(诏令－1)")));

						//var shanchang = get.config('recentCharacter');
					/*	var shanchang = ["sp_diaochan", "sp_zhaoyun", "sp_sunshangxiang", "sp_caoren", "sp_jiangwei", "sp_machao", "sp_caiwenji", "jsp_guanyu", "jsp_huangyueying", "sp_pangde", "sp_jiaxu", "yuanshu", "sp_zhangliao", "sp_ol_zhanghe", "wulan", "leitong", "huaman", "wangshuang", "wenyang", "re_liuzan", "caobuxing", "re_maliang", "xin_baosanniang", "re_xinxianying", "dongxie", "guozhao", "fanyufeng", "ruanyu", "liangxing", "re_dongzhao", "yangwan", "re_panshu", "dufuren", "zhouyi", "lvlingqi", "re_kanze", "caojinyu", "caocao", "simayi", "xiahoudun", "zhangliao", "xuzhu", "guojia", "zhenji", "liubei", "guanyu", "zhangfei", "zhugeliang", "zhaoyun", "machao", "huangyueying", "sunquan", "ganning", "lvmeng", "huanggai", "zhouyu", "daqiao", "luxun", "sunshangxiang", "huatuo", "lvbu", "diaochan"];*/
						var list = [];
            			for (i in lib.character) {
            				if (!lib.filter.characterDisabled(i)) {
            					list.push(i);
            				}
            			}
            			var choose = [];
            			_status.characterlist = list;
            			event.filterChoice = function (name1, name2) {
            				var info1 = lib.character[name1];
            				var info2 = lib.character[name2];
            				if (!info1 || !info2) return;
            				var num = 0;
            				if (info1[0] == info2[0]) num++;
            				if (get.infoMaxHp(info1[2]) == get.infoMaxHp(info2[2])) num++;
            				if (info1[3].length == info2[3].length) num++;
            				return num > 1;
            			};
            			let shanchang=list.randomGets(4);
            			const elements = [shanchang1, shanchang2, shanchang3, shanchang4];
                        for (let i = 0; i < elements.length; i++) {
                            const element = elements[i];
                            const value = shanchang[i % shanchang.length]; // 确保 shanchang 数组不会越界
                            element.setBackground(value, 'character');
                        };
						var jingjitu = ["jingji1", "jingji2", "jingji3", "jingji4"];
						var xingbietu = ["xingbie1", "xingbie2"];
						/*shanchang1.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						shanchang2.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						shanchang3.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						shanchang4.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");*/
						useless.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/shousha/useless.png");
						useless2.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/shousha/useless2.png");
						minixingxiang.style.backgroundImage = player.node.avatar.style.backgroundImage;
						jingji.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/shousha/" + jingjitu.randomGet() + ".png");
						xingbie.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/shousha/" + xingbietu.randomGet() + ".png");
					};

					rightPane.innerHTML = "<div></div>";
					lib.setScroll(rightPane.firstChild);
					var oSkills = player.getSkills(null, false, false).slice(0);
					oSkills = oSkills.filter(function (skill) {
						if (!lib.skill[skill] || skill == "jiu") return false;
						if (lib.skill[skill].nopop || lib.skill[skill].equipSkill) return false;
						return lib.translate[skill + "_info"] && lib.translate[skill + "_info"] != "";
					});
					if (player == game.me && player.hiddenSkills.length) oSkills.addArray(player.hiddenSkills);

					var allShown = player.isUnderControl() || (!game.observe && game.me && game.me.hasSkillTag("viewHandcard", null, player, true));
					var shownHs = player.getShownCards();
					if (shownHs.length) {
						ui.create.div(".xcaption", player.getCards("h").some(card => !shownHs.includes(card)) ? "明置的手牌" : "手牌区域", rightPane.firstChild);
						shownHs.forEach(function (item) {
							var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
							card.style.zoom = "0.6";
							rightPane.firstChild.appendChild(card);
						});
						if (allShown) {
							var hs = player.getCards("h");
							hs.removeArray(shownHs);
							if (hs.length) {
								ui.create.div(".xcaption", "其他手牌", rightPane.firstChild);
								hs.forEach(function (item) {
									var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
									card.style.zoom = "0.6";
									rightPane.firstChild.appendChild(card);
								});
							}
						}
					} else if (allShown) {
						var hs = player.getCards("h");
						if (hs.length) {
							ui.create.div(".xcaption", "手牌区域", rightPane.firstChild);
							hs.forEach(function (item) {
								var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
								card.style.zoom = "0.6";
								rightPane.firstChild.appendChild(card);
							});
						}
					}

					if (oSkills.length) {
						ui.create.div(".xcaption", "武将技能", rightPane.firstChild);
						oSkills.forEach(function (name) {
							if (player.forbiddenSkills[name]) {
								if (player.forbiddenSkills[name].length) ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + "【" + lib.translate[name] + "】" + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + "（与" + get.translation(player.forbiddenSkills[name]) + "冲突）" + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
								else ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + "【" + lib.translate[name] + "】" + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + "（双将禁用）" + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
							} else if (player.hiddenSkills.includes(name)) {
								if (lib.skill[name].preHidden && get.mode() == "guozhan") {
									var id = name + "_idx";
									id = ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + "【" + lib.translate[name] + "】" + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + "</span>" + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div>' + "</div>", rightPane.firstChild);
									var underlinenode = id.querySelector(".underlinenode");
									if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove("on");
									underlinenode.link = name;
									underlinenode.listen(ui.click.hiddenskill);
								} else ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + "【" + lib.translate[name] + "】" + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
							} else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + "【" + lib.translate[name] + "】" + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
							else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
								var id = name + "_id";
								id = ui.create.div(".xskill", "<div data-color>" + "【" + lib.translate[name] + "】" + "</div>" + "<div>" + get.skillInfoTranslation(name, player) + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div>' + "</div>", rightPane.firstChild);
								var underlinenode = id.querySelector(".underlinenode");
								if (lib.skill[name].frequent) {
									if (lib.config.autoskilllist.includes(name)) {
										underlinenode.classList.remove("on");
									}
								}
								if (lib.skill[name].subfrequent) {
									for (var j = 0; j < lib.skill[name].subfrequent.length; j++) {
										if (lib.config.autoskilllist.includes(name + "_" + lib.skill[name].subfrequent[j])) {
											underlinenode.classList.remove("on");
										}
									}
								}
								if (lib.config.autoskilllist.includes(name)) underlinenode.classList.remove("on");
								underlinenode.link = name;
								underlinenode.listen(ui.click.autoskill2);
							} else if (lib.skill[name].clickable && player.isIn() && player.isUnderControl(true)) {
								var id = name + "_idy";
								id = ui.create.div(".xskill", "<div data-color>" + "【" + lib.translate[name] + "】" + "</div>" + "<div>" + get.skillInfoTranslation(name, player) + '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>' + "</div>", rightPane.firstChild);
								var intronode = id.querySelector(".skillbutton");
								if (!_status.gameStarted || (lib.skill[name].clickableFilter && !lib.skill[name].clickableFilter(player))) {
									intronode.classList.add("disabled");
									intronode.style.opacity = 0.5;
								} else {
									intronode.link = player;
									intronode.func = lib.skill[name].clickable;
									intronode.classList.add("pointerdiv");
									intronode.listen(ui.click.skillbutton);
								}
							} else ui.create.div(".xskill", "<div data-color>【" + lib.translate[name] + "】</div>" + "<div>" + get.skillInfoTranslation(name, player) + "</div>", rightPane.firstChild);
						});
					}

					var eSkills = player.getVCards("e");
					if (eSkills.length) {
						ui.create.div(".xcaption", "装备区域", rightPane.firstChild);
						eSkills.forEach(function (card) {
							let str = [get.translation(card), get.translation(card.name + "_info")];
							if (card.cards?.length) str[0] += "（" + get.translation(card.cards) + "）";
							const special = card.cards?.find(item => item.name == card.name && lib.card[item.name]?.cardPrompt);
							if (special) str[1] = lib.card[special.name].cardPrompt(special, player);
							ui.create.div(".xskill", "<div data-color>" + str[0] + "</div><div>" + str[1] + "</div>", rightPane.firstChild);
						});
					}

					var judges = player.getVCards("j");
					if (judges.length) {
						ui.create.div(".xcaption", "判定区域", rightPane.firstChild);
						judges.forEach(function (card) {
							const cards = card.cards;
							let str = get.translation(card);
							if (!cards?.length || cards?.length !== 1 || cards[0].name !== card.name) {
								if (!lib.card[card]?.blankCard || player.isUnderControl(true)) {
									if (cards?.length) str += "（" + get.translation(cards) + "）";
								}
							}
							ui.create.div(".xskill", "<div data-color>" + str + "</div><div>" + get.translation(card.name + "_info") + "</div>", rightPane.firstChild);
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
