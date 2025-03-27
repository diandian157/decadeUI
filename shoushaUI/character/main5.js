app.import(function (lib, game, ui, get, ai, _status, app) {
//第一页
	var plugin = {
		name: "character",
		filter() {
			return !['chess', 'tafang', 'stone', 'connect'].includes(get.mode());
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
				/*	if (e.target === container) {
						container.hide();
						game.resume2();
					}*/
				});
				//底图
						container.style.backgroundColor='RGBA(0, 0, 0, 0.85)';
				var dialog = ui.create.div(".character-dialog.popped", container);
        var blackBg1=ui.create.div(".blackBg.one", dialog);
        var blackBg2=ui.create.div(".blackBg.two", dialog);
        var basicInfo=ui.create.div(".basicInfo", blackBg1);
      

				// var xinxi = ui.create.div(".xinxi", dialog);
				var rightPane = ui.create.div(".right", blackBg2);

			

		

     //(暂时注释) var viewBusinessCard=ui.create.div(".viewBusinessCard","查看名片", blackBg1);
       var viewBusinessCard=ui.create.div(".viewBusinessCard","", blackBg1);

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
					

          //武将
					if (lib.config.extension_十周年UI_ZLLT == true) {
						var biankuang = ui.create.div(".biankuang", blackBg1);
					} else {
						var biankuang = ui.create.div(".biankuang2", blackBg1);
					}
					
					//biankuang.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/name5_${player.group}.png`);

					if (lib.config.extension_十周年UI_ZLLT == true) {
						var leftPane = ui.create.div(".left", biankuang);
					} else {
						var leftPane = ui.create.div(".left2", biankuang);
					}
					leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
					createButton(name, leftPane.firstChild);
					createButton(name2, leftPane.firstChild);
					
		  //边框
		  var biankuang3 = ui.create.div(".biankuang3",blackBg1);
		  biankuang3.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/baby_${player.group}.png`);
		  
		   //势力
		  var biankuang4 = ui.create.div(".biankuang4",blackBg1);
		  biankuang4.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/babys_${player.group}.png`);	
				
            //通过势力判断技能框的背景颜色
          var extensionPath = lib.assetURL + 'extension/十周年UI/shoushaUI/';
          var group = player.group;
          if (group != 'wei' && group != 'shu' && group != 'wu' && group != 'qun' && group != 'ye'
            && group != 'jin' && group != 'daqin' && group != 'western' && group != 'shen' && group != 'key'&& group != 'Han'&& group != 'qin')
            group = 'default';
       
            
          //武将名	
           var nametext='';
          if(name && name2){
            if(name == 'unknown') nametext+='未知';
            else if(lib.translate[name + '_ab']) nametext+=lib.translate[name + '_ab'];
            else nametext+=get.translation(name);
            nametext+=' / ';
            if(name2 == 'unknown') nametext+='未知';
            else if(lib.translate[name2 + '_ab']) nametext+=lib.translate[name2 + '_ab'];
            else nametext+=get.translation(name2);
          }
          else{
            if(name == 'unknown') nametext+='未知';
            else if(lib.translate[name + '_ab']) nametext+=lib.translate[name + '_ab'];
            else nametext+=get.translation(name);
          }
          var namestyle = ui.create.div('.name',nametext,dialog);
          namestyle.dataset.camp = group;
          if(name && name2) {
            namestyle.style.fontSize = '20px';
            namestyle.style.letterSpacing = '1px';
          }
          
     //等阶。适配最新版千幻
          var rarity = game.getRarity(name);
          if(!rarity) rarity = 'junk';
          var pe = ui.create.div('.pe1',dialog);
          var url;
          if(lib.config['extension_千幻聆音_enable']){
            var temp;
            switch(game.qhly_getSkinLevel(name,game.qhly_getSkin(name),true,false)){
              case 'xiyou': temp='rare';break;
              case 'shishi': temp='epic';break;
              case 'chuanshuo': temp='legend';break;
              case 'putong': temp='common';break;
              case 'dongtai': temp='legend';break;
              case 'jueban': temp='unique';break;
              case 'xianding': temp='restrictive';break;
              default: temp='junk';
            }
            url = extensionPath + 'character/images/pe_' + temp + '.png';
          }
          else url = extensionPath + 'character/images/pe_' + rarity + '.png';
          pe.style.backgroundImage = 'url("' + url + '")';
   
          
    
   
          //星星
           var xingxing = ui.create.div('.xingxing', biankuang4);
            xingxing.
            setBackgroundImage('extension/十周年UI/shoushaUI/character/images/baby/' + rarity +'.png');
            
         //吊坠配件
           var diaozhui= ui.create.div('.diaozhui', biankuang4);
            diaozhui.
            setBackgroundImage('extension/十周年UI/shoushaUI/character/images/baby/diaozhui5.png');
diaozhui.addEventListener("click", event => {
 game.playAudio('../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3'); // 可选：播放关闭时的音频
                container.hide();
		    	game.resume2();
			});



					//角色名-资料页
					name.innerText = get.translation(player.name);

	

			
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
						var shanchang = ["sp_diaochan", "sp_zhaoyun", "sp_sunshangxiang", "sp_caoren", "sp_jiangwei", "sp_machao", "sp_caiwenji", "jsp_guanyu", "jsp_huangyueying", "sp_pangde", "sp_jiaxu", "yuanshu", "sp_zhangliao", "sp_ol_zhanghe", "wulan", "leitong", "huaman", "wangshuang", "wenyang", "re_liuzan", "caobuxing", "re_maliang", "xin_baosanniang", "re_xinxianying", "dongxie", "guozhao", "fanyufeng", "ruanyu", "liangxing", "re_dongzhao", "yangwan", "re_panshu", "dufuren", "zhouyi", "lvlingqi", "re_kanze", "caojinyu", "caocao", "simayi", "xiahoudun", "zhangliao", "xuzhu", "guojia", "zhenji", "liubei", "guanyu", "zhangfei", "zhugeliang", "zhaoyun", "machao", "huangyueying", "sunquan", "ganning", "lvmeng", "huanggai", "zhouyu", "daqiao", "luxun", "sunshangxiang", "huatuo", "lvbu", "diaochan"];
						var jingjitu = ["jingji1", "jingji2", "jingji3", "jingji4"];
						var xingbietu = ["xingbie1", "xingbie2"];

						shanchang1.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						shanchang2.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						shanchang3.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						shanchang4.setBackgroundImage("image/character/" + shanchang.randomGet() + ".jpg");
						useless.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/useless.png");
						useless2.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/useless2.png");
						minixingxiang.style.backgroundImage = player.node.avatar.style.backgroundImage;
						jingji.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/" + jingjitu.randomGet() + ".png");
						xingbie.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/" + xingbietu.randomGet() + ".png");
					};
					
					
					
					
					
//技能文本
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
		//技能			
			if (oSkills.length) {
						ui.create.div(".xcaption", rightPane.firstChild);
						oSkills.forEach(function (name) {
							if (player.forbiddenSkills[name]) {
								if (player.forbiddenSkills[name].length) ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + lib.translate[name] + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + "（与" + get.translation(player.forbiddenSkills[name]) + "冲突）" + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
								else ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + lib.translate[name] + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + "（双将禁用）" + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
							} else if (player.hiddenSkills.includes(name)) {
								if (lib.skill[name].preHidden && get.mode() == "guozhan") {
									var id = name + "_idx";
									id = ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + lib.translate[name]  + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + "</span>" + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div>' + "</div>", rightPane.firstChild);
									var underlinenode = id.querySelector(".underlinenode");
									if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove("on");
									underlinenode.link = name;
									underlinenode.listen(ui.click.hiddenskill);
								} else ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' +  lib.translate[name] + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
							} else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) ui.create.div(".xskill", "<div data-color>" + '<span style="opacity:0.5">' + lib.translate[name]  + "</span>" + "</div>" + "<div>" + '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + "</span>" + "</div>", rightPane.firstChild);
							else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
								var id = name + "_id";
								id = ui.create.div(".xskill", "<div data-color>" + lib.translate[name]  + "</div>" + "<div>" + get.skillInfoTranslation(name, player) + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div>' + "</div>", rightPane.firstChild);
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
								id = ui.create.div(".xskill", "<div data-color>"  + lib.translate[name] + "</div>" + "<div>" + get.skillInfoTranslation(name, player) + '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>' + "</div>", rightPane.firstChild);
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
							} else ui.create.div(".xskill", "<div data-color>" + lib.translate[name] + "</div>" + "<div>" + get.skillInfoTranslation(name, player) + "</div>", rightPane.firstChild);
						});
					}
		//装备*
		
					var eSkills = player.getVCards("e");
					if (eSkills.length) {
						ui.create.div(".xcaption", "装备区域", rightPane.firstChild);

						//装备描述
						eSkills.forEach(function (card) {
							let str = [get.translation(card), get.translation(card.name + "_info")];
							const cards = card.cards;
							if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) str[0] += "（" + get.translation(card.cards) + "）";
							const special = card.cards?.find(item => item.name == card.name && lib.card[item.name]?.cardPrompt);
							if (special) str[1] = lib.card[special.name].cardPrompt(special, player);
							ui.create.div(".xskill", "<div data-color>" + str[0] + "</div><div>" + str[1] + "</div>", rightPane.firstChild);
						});
					}
			// 装备
			/*
var eSkills = player.getVCards("e");
if (eSkills.length) {
    ui.create.div(".xcaption", "装备区域", rightPane.firstChild);
    // 装备描述
    eSkills.forEach(function (card) {
        // 获取卡牌名称（去掉【】及其内部内容）
        const cardName = get.translation(card);
        const cardNameClean = removeBracketsAndContent(cardName); // 调用清理函数

        // 获取卡牌描述
        let cardDescription = get.translation(card.name + "_info");

        // 处理子卡片
        let displayName = cardNameClean;
        const cards = card.cards;
        if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) {
            displayName += "（" + get.translation(card.cards) + "）";
        }

        // 处理特殊装备效果
        const special = card.cards?.find(item => item.name == card.name && lib.card[item.name]?.cardPrompt);
        if (special) {
            cardDescription = lib.card[special.name].cardPrompt(special, player);
        }

        // 创建显示元素
        ui.create.div(".xskill", "<div data-color>" + displayName + "</div><div>" + cardDescription + "</div>", rightPane.firstChild);
    });
}

// 去掉【】及其内部内容的函数
function removeBracketsAndContent(text) {
    // 匹配【】及其内部的所有字符（包括花色、数字、符号）
    return text.replace(/【.*?】/g, '');
}		*/

      //判定牌


					var judges = player.getVCards("j");
					if (judges.length) {
						ui.create.div(".xcaption", "判定区域", rightPane.firstChild);
						judges.forEach(function (card) {
							const cards = card.cards;
							let str = get.translation(card);
							if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) {
								if (!lib.card[card]?.blankCard || player.isUnderControl(true)) str += "（" + get.translation(cards) + "）";
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

           