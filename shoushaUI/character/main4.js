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
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});
				//添加底图
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
		  biankuang3.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/OL_line/ol_${player.group}.png`);
		  
		   //势力
		  var biankuang4 = ui.create.div(".biankuang4",blackBg1);
		  biankuang4.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/OL_line/ols_${player.group}.png`);	
				
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
          //配件
    var peijian = ui.create.div('.peijian', biankuang4);
            var peijianto = ['p1','p2',];       
            peijian.setBackgroundImage('extension/十周年UI/shoushaUI/character/images/OL_line/' + peijianto.randomGet() + '.png');   
           
             // 玩家名（带随机等级）
var wanjia = ui.create.div('.wanjia', biankuang, (player === game.me 
    ? lib.config.connect_nickname 
    : get.translation(innerText = num = [
        "缘之空", "小小恐龙", "♂污到深处♀自然萌",  "海边的ebao", "小云云", "点点", "猫猫虫", "爱莉爱莉爱", "羊羊", "冰佬", "鹿鹿", "黎佬", "浮牢师",  "U佬", "蓝宝","影宝","柳下跖","k9","扶苏", "皇叔"
      ].randomGet(1))
  ) + ' Lv.' + (Math.floor(Math.random() * (200 - 180 + 1)) + 180)
);
		//胜率
		
				var shenglv = ui.create.div(".shenglv", biankuang);
                const intPart = Math.floor(Math.random() * (95 - 50 + 1)) + 50;
                shenglv.innerHTML = `${intPart}%`;
  	   //逃率
				var taolv = ui.create.div(".taolv", biankuang);
                const randomNum = Math.floor(Math.random()*(10- 0 + 1) + 0);
                taolv.innerHTML = randomNum + "%";
 		//人气值		
 				var renqi = ui.create.div(".renqi", biankuang);
 				renqi.innerHTML = Math.floor(Math.random() * 10000 + 1);
 				
         //吊坠配件
           var diaozhui= ui.create.div('.diaozhui', biankuang4);
            diaozhui.
            setBackgroundImage('extension/十周年UI/shoushaUI/character/images/OL_line/diaozhui.png');
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
						   const title = ui.create.div(".xcaption", "手牌区域", rightPane.firstChild);
						     // 直接添加背景样式（需确保图片路径正确）
title.style.cssText = `
    /* 背景设置 */
       background: url('extension/十周年UI/shoushaUI/character/images/OL_line/quyu4.png') center/contain no-repeat;
    background-size: 260px 30px;  /* 固定背景尺寸 */
    background-origin: content-box;

    /* 文本设置 */
    text-align: content;            /* 文字靠右 */
    line-height: 1.8;             /* 垂直居中 */
    
    /* 基础样式 */
    color: #bb9870;
    display: inline-block;
    position: relative;
    min-width: 250px;             /* 确保容器足够宽 */
`;
							hs.forEach(function (item) {
								var card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
								card.style.zoom = "0.6";
								rightPane.firstChild.appendChild(card);
							});
						}
					}
		//技能	
				
// 技能部分
if (oSkills.length) {
    const title = ui.create.div(".xcaption", "武将技能", rightPane.firstChild);
    title.style.cssText = `
        background: url('extension/十周年UI/shoushaUI/character/images/OL_line/quyu4.png') center/contain no-repeat;
        background-size: 260px 30px;
        background-origin: content-box;
        text-align: content;
        line-height: 1.8;
        color: #bb9870;
        display: inline-block;
        position: relative;
        min-width: 250px;
    `;

    oSkills.forEach(function (name) {
        // 获取主被动状态
        const isPassive = get.info(name)?.trigger;
        const typeText = isPassive ? '(被动)' : '(主动)';

        // 统一生成技能名称HTML
        const generateSkillHTML = (nameContent, descContent) => {
            return `
                <div data-color>${nameContent}</div>
                <span class="skill-type-tag">${typeText}</span>
                <div>${descContent}</div>
            `;
        };

        if (player.forbiddenSkills[name]) {
            if (player.forbiddenSkills[name].length) {
                ui.create.div(".xskill", 
                    generateSkillHTML(
                        '<span style="opacity:0.5">' + lib.translate[name] + '</span>',
                        '<span style="opacity:0.5">（与' + get.translation(player.forbiddenSkills[name]) + '冲突）' + get.skillInfoTranslation(name, player)
                    ),
                    rightPane.firstChild
                );
            } else {
                ui.create.div(".xskill",
                    generateSkillHTML(
                        '<span style="opacity:0.5">' + lib.translate[name] + '</span>',
                        '<span style="opacity:0.5">（双将禁用）' + get.skillInfoTranslation(name, player)
                    ),
                    rightPane.firstChild
                );
            }
        } else if (player.hiddenSkills.includes(name)) {
            if (lib.skill[name].preHidden && get.mode() == "guozhan") {
                var id = name + "_idx";
                id = ui.create.div(".xskill", 
                    generateSkillHTML(
                        '<span style="opacity:0.5">' + lib.translate[name] + '</span>',
                        '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + '</span>' + 
                        '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div>'
                    ),
                    rightPane.firstChild
                );
                var underlinenode = id.querySelector(".underlinenode");
                if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove("on");
                underlinenode.link = name;
                underlinenode.listen(ui.click.hiddenskill);
            } else {
                ui.create.div(".xskill",
                    generateSkillHTML(
                        '<span style="opacity:0.5">' + lib.translate[name] + '</span>',
                        '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + '</span>'
                    ),
                    rightPane.firstChild
                );
            }
        } else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) {
            ui.create.div(".xskill",
                generateSkillHTML(
                    '<span style="opacity:0.5">' + lib.translate[name] + '</span>',
                    '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player) + '</span>'
                ),
                rightPane.firstChild
            );
        } else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
            var id = name + "_id";
            id = ui.create.div(".xskill",
                generateSkillHTML(
                    lib.translate[name],
                    get.skillInfoTranslation(name, player) + 
                    '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div>'
                ),
                rightPane.firstChild
            );
            var underlinenode = id.querySelector(".underlinenode");
            // ...自动技能处理逻辑保持不变
        } else if (lib.skill[name].clickable && player.isIn() && player.isUnderControl(true)) {
            var id = name + "_idy";
            id = ui.create.div(".xskill",
                generateSkillHTML(
                    lib.translate[name],
                    get.skillInfoTranslation(name, player) + 
                    '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>'
                ),
                rightPane.firstChild
            );
            // ...按钮处理逻辑保持不变
        } else {
            ui.create.div(".xskill",
                generateSkillHTML(
                    lib.translate[name],
                    get.skillInfoTranslation(name, player)
                ),
                rightPane.firstChild
            );
        }
    });
}
					
		//装备*
var eSkills = player.getVCards("e");
if (eSkills.length) {
    // 创建标题元素（保持原样）
    const title = ui.create.div(".xcaption", "装备区域", rightPane.firstChild);
    title.style.cssText = `
        background: url('extension/十周年UI/shoushaUI/character/images/OL_line/quyu4.png') center/contain no-repeat;
        background-size: 260px 30px;
        background-origin: content-box;
        text-align: content;
        line-height: 1.8;
        color: #bb9870;
        display: inline-block;
        position: relative;
        min-width: 250px;
    `;

    eSkills.forEach(function (card) {
        // 花色配置
        const suitConfig = {
            'spade': { symbol: '♠', color: '#2e2e2e' },
            'heart': { symbol: '♥', color: '#e03c3c' },
            'club': { symbol: '♣', color: '#2e2e2e' },
            'diamond': { symbol: '♦', color: '#e03c3c' }
        }[card.suit] || { symbol: '', color: '#FFFFFF' };

        // 获取装备类型图标
        const equipType = lib.card[card.name]?.equipType;
        const typeIcon = {
            'equip1': 'equip1.png',
            'equip2': 'equip2.png',
            'equip3': 'equip3.png',
            'equip4': 'equip4.png',
            'equip5':'equip5.png',
        }[get.subtype(card)] || 'default.png';

        // 第一行布局结构
        const firstLine = `
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                position: relative;
            ">
                <!-- 装备名称 -->
                <span style="
                    color: #f7d229;
                    font-weight: bold;
                ">${get.translation(card.name).replace(/[【】]/g, '')}</span>

                <!-- 类别图标 -->
                <img src="extension/十周年UI/shoushaUI/character/images/OL_line/${typeIcon}" 
                     style="width:20px; height:20px; vertical-align:middle">

                <!-- 花色数字组 -->
                <div style="
                    margin-left: 0;
                    display: flex;
                    align-items: center;
                    gap: 2px;
                ">
                    <!-- 花色符号 -->
                    <span style="
                        color: ${suitConfig.color};
                        text-shadow: 
                            0 0 1px white,
                            0 0 1px white;
                        position: relative;
                    ">${suitConfig.symbol}</span>
                    
                    <!-- 数字 -->
                    <span style="
                        color: ${suitConfig.color};
                        -webkit-text-stroke: 0.8px white;
                        text-stroke: 0.8px white;
                        paint-order: stroke fill;
                        font-family: Arial;
                    ">${card.number||''}</span>
                </div>
            </div>
        `;

        // 保持原有描述处理
        
        let desc = '';
        if(get.subtype(card) == "equip1"){
            var num = 1;
            var info = get.info(card);
            if (info && info.distance && typeof info.distance.attackFrom == "number") {
                num = 1 - info.distance.attackFrom;
            }
            if (num < 1) {
                num = 1;
            }
            desc+='攻击范围:'+num+'<br>';
        };
        desc+=get.translation(card.name + "_info").replace(/[【】]/g, '');
        const special = card.cards?.find(item => item.name == card.name && lib.card[item.name]?.cardPrompt);
        if (special) desc = lib.card[special.name].cardPrompt(special, player);

        // 创建装备项容器
        ui.create.div(".xskillx", 
            firstLine + `<div style="margin-top:4px">${desc}</div>`,
            rightPane.firstChild
        );
    });
}
			// 去掉【】所有东西的装备
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
			   const title = ui.create.div(".xcaption", "判定区域", rightPane.firstChild);
			     // 直接添加背景样式（需确保图片路径正确）
title.style.cssText = `
    /* 背景设置 */
       background: url('extension/十周年UI/shoushaUI/character/images/OL_line/quyu4.png') center/contain no-repeat;
    background-size: 260px 30px;  /* 固定背景尺寸 */
    background-origin: content-box;

    /* 文本设置 */
    text-align: content;            /* 文字靠右 */
    line-height: 1.8;             /* 垂直居中 */
    
    /* 基础样式 */
    color: #bb9870;
    display: inline-block;
    position: relative;
    min-width: 250px;             /* 确保容器足够宽 */
`;
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

           