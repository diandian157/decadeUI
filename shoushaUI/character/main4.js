app.import((lib, game, ui, get, ai, _status, app) => {
	// 常量定义
	const CONSTANTS = {
		// 官阶翻译映射
		GUANJIE_TRANSLATION: {
			1: ["骁卒", ["步卒", "伍长", "什长", "队率", "屯长", "部曲"]],
			2: ["校尉", ["县尉", "都尉", "步兵校尉", "典军校尉"]],
			3: ["郎将", ["骑郎将", "车郎将", "羽林中郎将", "虎贲中郎将"]],
			4: ["偏将军", ["折冲将军", "虎威将军", "征虏将军", "荡寇将军"]],
			5: ["将军", ["监军将军", "抚军将军", "典军将军", "领军将军"]],
			6: ["上将军", ["后将军", "左将军", "右将军", "前将军"]],
			7: ["国护军", ["护军", "左护军", "右护军", "中护军"]],
			8: ["国都护", ["都护", "左都护", "右都护", "中都护"]],
			9: ["统帅", ["卫将军"]],
			10: ["统帅", ["车骑将军"]],
			11: ["统帅", ["骠骑将军"]],
			12: ["大将军", ["大将军"]],
			13: ["大司马", ["大司马"]],
		},
		// 段位翻译映射
		DUANWEI_TRANSLATION: {
			1: ["新兵一", "新兵二", "新兵三"],
			2: ["骁骑一", "骁骑二", "骁骑三"],
			3: ["先锋一", "先锋二", "先锋三", "先锋四"],
			4: ["大将一", "大将二", "大将三", "大将四"],
			5: ["主帅一", "主帅二", "主帅三", "主帅四", "主帅五"],
			6: ["枭雄", "至尊枭雄", "绝世枭雄"],
		},
		// 花色配置
		SUIT_CONFIG: {
			spade: { symbol: "♠", color: "#2e2e2e", image: "spade.png" },
			heart: { symbol: "♥", color: "#e03c3c", image: "heart.png" },
			club: { symbol: "♣", color: "#2e2e2e", image: "club.png" },
			diamond: { symbol: "♦", color: "#e03c3c", image: "diamond.png" },
		},
		// 装备类型图标映射
		EQUIP_TYPE_ICONS: {
			equip1: "equip1.png",
			equip2: "equip2.png",
			equip3: "equip3.png",
			equip4: "equip4.png",
			equip5: "equip5.png",
		},
		// 将灯类型
		JIANGDENG_CLASSES: ["biao", "jiang", "jie", "wenwu", "guo", "jiangjie", "zu", "shan", "cui", "sp", "shen", "mou", "qi", "xian"],
		// 音频路径
		AUDIO_PATH: "../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3",
		// 图片路径前缀
		IMAGE_PATH_PREFIX: "extension/十周年UI/shoushaUI/character/images/OL_line/",
	};

	// 获取势力背景图片路径接口
	function getOlsBackgroundImage(group) {
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key", "Han", "qin"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `${CONSTANTS.IMAGE_PATH_PREFIX}ols_${group}.png`;
	}

	// 工具函数
	const Utils = {
		// 播放音频
		playAudio() {
			game.playAudio(CONSTANTS.AUDIO_PATH);
		},
		// 生成随机数据
		generateRandomData(player) {
			const guanjieLevel = Math.floor(Math.random() * 13 + 1);
			return {
				winRate: get.SL ? get.SL(player) * 100 + "%" : Math.floor(Math.random() * (95 - 50 + 1)) + 50 + "%",
				guanjieLevel: guanjieLevel,
				popularity: Math.floor(Math.random() * 10000 + 1),
				escapeRate: Math.floor(Math.random() * (10 - 0 + 1) + 0),
				rankLevel: Math.floor(Math.random() * 6 + 1),
				level: [Math.floor(Math.random() * (200 - 180 + 1)) + 180, 200, 200].randomGet(),
				vipLevel: Math.min(guanjieLevel + 1, 10),
				mvpCount: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
			};
		},
		// 创建边框颜色
		createBiankuangColor(kuang, group) {
			const tempPlayer = document.createElement("div");
			tempPlayer.classList.add("player");
			const tempCampWrap = document.createElement("div");
			tempCampWrap.classList.add("camp-wrap");
			tempCampWrap.setAttribute("data-camp", group);
			tempPlayer.appendChild(tempCampWrap);
			const tempCampBack = document.createElement("div");
			tempCampBack.classList.add("camp-back");
			tempCampWrap.appendChild(tempCampBack);
			document.body.appendChild(tempPlayer);
			const computedStyle = window.getComputedStyle(tempCampBack);
			let backgroundStyle = computedStyle.background;
			if (!backgroundStyle || backgroundStyle === "none") {
				backgroundStyle = computedStyle.backgroundColor;
			}
			document.body.removeChild(tempPlayer);
			const backgroundImageMatch = backgroundStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
			if (backgroundImageMatch) {
				let backgroundImageUrl = backgroundImageMatch[1];
				backgroundImageUrl = new URL(backgroundImageUrl, window.location.href).href;
				kuang.style.backgroundImage = `url(${backgroundImageUrl})`;
			} else {
				kuang.style.background = backgroundStyle;
			}
		},
		// 获取武将名称
		getCharacterName(name, player) {
			if (name === "unknown") return "未知";
			return get.slimNameHorizontal(name);
		},
		// 生成技能HTML
		generateSkillHTML(nameContent, descContent, typeText) {
			const skillTypeHTML = `<span class="skill-type-tag">(${typeText})</span>`;
			return `<div data-color>${nameContent}</div>${skillTypeHTML}<div>${descContent}</div>`;
		},
		// 获取技能类型文本
		getSkillTypeText(info, player, name) {
			if (info.juexingji || info.limited) {
				return player.awakenedSkills.includes(name) ? "已发动" : "未发动";
			}
			return info.enable ? "主动" : "被动";
		},
		// 创建卡牌元素
		createCardElement(item, zoom = "0.6") {
			const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
			card.style.zoom = zoom;
			return card;
		},
		// 获取装备描述
		getEquipmentDescription(card, player) {
			let desc = "";
			if (get.subtypes(card).includes("equip1")) {
				let num = 1;
				const info = get.info(card);
				if (typeof info?.distance?.attackFrom === "number") {
					num -= info.distance.attackFrom;
				}
				desc += `攻击范围 :   ${num}<br>`;
			}
			desc += get.translation(card.name + "_info").replace(/[【】]/g, "");
			const special = card.cards?.find(item => item.name === card.name && lib.card[item.name]?.cardPrompt);
			if (special) {
				desc = lib.card[special.name].cardPrompt(special, player);
			}
			return desc;
		},
	};
	// 角色信息管理器
	class CharacterInfoManager {
		constructor() {
			this.playerDialog = null;
		}
		// 创建角色对话框
		createCharacterDialog() {
			const container = ui.create.div(".popup-container.hidden", ui.window, e => {
				if (e.target === container) {
					Utils.playAudio();
					container.hide();
					plugin.playerDialog = null;
					game.resume2();
				}
			});
			container.style.backgroundColor = "RGBA(0, 0, 0, 0.5)";
			const dialog = ui.create.div(".character-dialog.popped", container);
			const blackBg1 = ui.create.div(".blackBg.one", dialog);
			const blackBg2 = ui.create.div(".blackBg.two", dialog);
			const basicInfo = ui.create.div(".basicInfo", blackBg1);
			const rightPane = ui.create.div(".right", blackBg2);
			return { container, dialog, blackBg1, blackBg2, basicInfo, rightPane };
		}
		// 创建基础信息区域
		createBasicInfoArea(blackBg1, player, name, name2, container) {
			const biankuang = ui.create.div(".biankuang2", blackBg1);
			const leftPane = ui.create.div(".left2", biankuang);
			leftPane.setBackground(name, "character");
			const randomData = Utils.generateRandomData(player);
			// 创建边框和势力图标
			const biankuang3 = ui.create.div(".biankuang3", blackBg1);
			Utils.createBiankuangColor(biankuang3, name === "unknown" ? player.group : lib.character[name][1]);
			const biankuang4 = ui.create.div(".biankuang4", blackBg1);
			const groupForBg = name === "unknown" ? player.group : lib.character[name][1];
			biankuang4.setBackgroundImage(plugin.getOlsBackgroundImage(groupForBg));
			// 创建玩家信息
			this.createPlayerInfo(biankuang, player, randomData);
			// 创建关闭按钮
			this.createCloseButton(biankuang4, container);
			return { leftPane, randomData, biankuang3, biankuang4 };
		}
		// 创建玩家信息
		createPlayerInfo(biankuang, player, randomData) {
			const wanjia = ui.create.div(".wanjia", biankuang, `${player.nickname}Lv.${randomData.level}`);
			const shenglv = ui.create.div(".shenglv", biankuang);
			shenglv.innerHTML = randomData.winRate;
			const taolv = ui.create.div(".taolv", biankuang);
			taolv.innerHTML = randomData.escapeRate + "%";
			const renqizz = ui.create.div(".renqi", biankuang);
			renqizz.innerHTML = randomData.popularity;
		}
		// 创建关闭按钮
		createCloseButton(biankuang4, container) {
			const diaozhui = ui.create.div(".diaozhui", biankuang4);
			diaozhui.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}diaozhui.png`);
			diaozhui.addEventListener("click", event => {
				Utils.playAudio();
				container.hide();
				plugin.playerDialog = null;
				game.resume2();
			});
		}
		// 创建详细资料弹窗
		createDetailPopup(player, randomData) {
			const popuperContainer = ui.create.div(
				".popup-container",
				{
					background: "rgb(0,0,0,0.8)",
				},
				ui.window
			);
			popuperContainer.style.display = "none";
			const guanbi = ui.create.div(".guanbi", popuperContainer);
			guanbi.addEventListener("click", () => {
				popuperContainer.style.display = "none";
				Utils.playAudio();
			});
			const bigdialog = ui.create.div(".bigdialog", popuperContainer);
			// 创建各种信息区域
			this.createAvatarInfo(bigdialog, player, randomData);
			this.createRankInfo(bigdialog, randomData);
			this.createJiangdengInfo(bigdialog, randomData);
			this.createDuanweiInfo(bigdialog, randomData);
			this.createSkillInfo(bigdialog, player, randomData);
			return popuperContainer;
		}
		// 创建头像信息
		createAvatarInfo(bigdialog, player, randomData) {
			const minixingxiang = ui.create.div(".minixingxiang", bigdialog);
			ui.create.div(".nameX", player.nickname, minixingxiang);
			ui.create.div(".dengjiX", randomData.level + "级", minixingxiang);
			ui.create.div(".huiyuanX", "会员" + randomData.vipLevel, minixingxiang);
			minixingxiang.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/xingxiang${Math.floor(Math.random() * 6)}.png`);
		}
		// 创建官阶信息
		createRankInfo(bigdialog, randomData) {
			const guanjie = ui.create.div(".guanjie", bigdialog);
			guanjie.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}sactx_${randomData.guanjieLevel}.png`);
			const guanjieInfo = CONSTANTS.GUANJIE_TRANSLATION[randomData.guanjieLevel];
			const guanjieName = ui.create.div(".guanjiewenzi", `<center>${guanjieInfo[0]}<br><center>${guanjieInfo[1].randomGet()}`, guanjie);
			ui.create.div(".xinyufen", "100", bigdialog);
			ui.create.div(".renqizhi", `${randomData.popularity}`, bigdialog);
		}
		// 创建将灯信息
		createJiangdengInfo(bigdialog, randomData) {
			const jddialog = ui.create.div(".jddialog", bigdialog);
			const jiangdengsuiji = CONSTANTS.JIANGDENG_CLASSES.randomGets(randomData.guanjieLevel > 8 ? randomData.guanjieLevel + 1 : [randomData.guanjieLevel - 1, randomData.guanjieLevel].randomGet());
			let jiangdengLiang = [];
			let jiangdengLiangguanjie = randomData.guanjieLevel > 4 ? ["biao", "sp", "guo", "jiang", "jie"] : ["biao", "guo", "jiang"];
			if (randomData.guanjieLevel > 6) jiangdengLiangguanjie.push("jiangjie");
			for (let i of CONSTANTS.JIANGDENG_CLASSES) {
				if (jiangdengLiangguanjie.includes(i) || jiangdengsuiji.includes(i)) {
					jiangdengLiang.push(i);
				}
			}
			for (let i = 0; i < CONSTANTS.JIANGDENG_CLASSES.length; i++) {
				const name = CONSTANTS.JIANGDENG_CLASSES[i];
				const jdditu = ui.create.div(".jdditu", jddialog);
				const jdtubiao = ui.create.div(jiangdengLiang.includes(name) ? ".jdtubiao" : ".jdtubiaoan", jdditu);
				jdtubiao.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}${name}.png`);
				if (jiangdengLiang.includes(name)) {
					ui.create.div(`.jd${name}donghua`, jdtubiao);
				}
			}
		}
		// 创建段位信息
		createDuanweiInfo(bigdialog, randomData) {
			const paiwei = ui.create.div(".paiweiditu", bigdialog);
			const duanwei = ui.create.div(".duanwei", paiwei);
			const duanweiInfo = CONSTANTS.DUANWEI_TRANSLATION[randomData.rankLevel];
			const duanweishuzi = ui.create.div(".duanweishuzi", `<center>${duanweiInfo.randomGet()}`, paiwei);
			duanwei.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}pwtx_${randomData.rankLevel}.png`);
			const shenglv = ui.create.div(".shenglvx", "百场胜率 " + randomData.winRate + "<br>MVP        " + randomData.mvpCount + "次", paiwei);
			ui.create.div(".paiweiType", "排位赛", paiwei);
			ui.create.div(".typeleft", paiwei);
			ui.create.div(".typeright", paiwei);
		}
		// 创建擅长武将信息
		createSkillInfo(bigdialog, player, randomData) {
			const shanchangdialog = ui.create.div(".shanchangdialog", bigdialog);
			const shanchang = Object.keys(lib.character)
				.filter(key => !lib.filter.characterDisabled(key))
				.randomGets(5);
			for (let i = 0; i < 5; i++) {
				const charName = shanchang[i];
				const group = lib.character[charName][1];
				const charPic = ui.create.div(`.shanchang`, shanchangdialog);
				charPic.setBackground(charName, "character");
				// 换肤按钮
				const huanfu = ui.create.div(`.huanfu`, charPic);
				huanfu.onclick = () => {
					window.zyile_charactercard ? window.zyile_charactercard(charName, charPic, false) : ui.click.charactercard(charName, charPic, lib.config.mode === "guozhan" ? "guozhan" : true);
				};
				// 势力边框
				const kuang = ui.create.div(`.kuang`, charPic);
				ui.create.div(`.xing`, kuang);
				const prefixName = get.slimNameHorizontal(charName);
				ui.create.div(".charName", prefixName, kuang);
				const shili = ui.create.div(`.shili`, kuang);
				shili.setBackgroundImage(plugin.getOlsBackgroundImage(group));
				Utils.createBiankuangColor(kuang, group);
			}
		}
		// 显示角色信息
		show(player, nametype, bool) {
			if (bool) {
				Utils.playAudio();
				let name = player.name1 || player.name;
				let name2 = player.name2;
				if (player.classList.contains("unseen") && player !== game.me) {
					name = "unknown";
				}
				if (player.classList.contains("unseen2") && player !== game.me) {
					name2 = "unknown";
				}
				const { container, dialog, blackBg1, blackBg2, basicInfo, rightPane } = this.createCharacterDialog();
				const { leftPane, randomData, biankuang3, biankuang4 } = this.createBasicInfoArea(blackBg1, player, name, name2, container);
				// 创建详细资料按钮
				this.createDetailButton(blackBg1, player, randomData);
				// 创建武将名称
				this.createCharacterName(dialog, player, name, name2, leftPane, biankuang3, biankuang4, rightPane);
				// 创建配件
				const peijian = ui.create.div(".peijian", biankuang4);
				const peijianto = ["p1", "p2"];
				peijian.setBackgroundImage(`${CONSTANTS.IMAGE_PATH_PREFIX}${peijianto.randomGet()}.png`);
				// 创建右侧信息面板
				this.createRightPanel(dialog, rightPane, player, nametype);
				container.classList.remove("hidden");
				game.pause2();
			}
		}
		// 创建详细资料按钮
		createDetailButton(blackBg1, player, randomData) {
			let popuperContainer = null;
			let popuperContainerBool = true;
			const xinxi = ui.create.div(".xinxi", blackBg1);
			xinxi.onclick = () => {
				Utils.playAudio();
				if (!popuperContainerBool) {
					if (popuperContainer) {
						popuperContainer.style.display = "block";
					}
					popuperContainerBool = true;
				} else {
					if (!popuperContainer) {
						popuperContainer = this.createDetailPopup(player, randomData);
					}
					popuperContainer.style.display = "block";
					popuperContainerBool = false;
				}
			};
		}
		// 创建武将名称
		createCharacterName(dialog, player, name, name2, leftPane, biankuang3, biankuang4, rightPane) {
			let nametext = Utils.getCharacterName(name, player);
			let nametext2 = "";
			if (name2) {
				nametext2 = Utils.getCharacterName(name2, player);
			}
			const namestyle = ui.create.div(".name", nametext, dialog);
			let playerx = player;
			let sjright = null;
			let sjleft = null;
			if (name2) {
				sjright = ui.create.div(".sjright", leftPane);
				sjright.onclick = event => {
					event.stopPropagation();
					sjright.style.display = "none";
					namestyle.innerHTML = nametext2;
					this.createRightPanel(dialog, rightPane, playerx, "name2");
					leftPane.setBackground(name2, "character");
					Utils.createBiankuangColor(biankuang3, name2 === "unknown" ? playerx.group : lib.character[name2][1]);
					const groupForBg2 = name2 === "unknown" ? playerx.group : lib.character[name2][1];
					biankuang4.setBackgroundImage(plugin.getOlsBackgroundImage(groupForBg2));
					if (!sjleft) {
						sjleft = this.createLeftSwitchButton(leftPane, sjright, rightPane, namestyle, nametext, playerx, name, biankuang3, biankuang4, dialog);
					} else {
						sjleft.style.display = "block";
					}
				};
			}
			namestyle.dataset.camp = player.group;
			if (name && name2) {
				namestyle.style.fontSize = "20px";
				namestyle.style.letterSpacing = "1px";
			}
		}
		// 创建左侧切换按钮
		createLeftSwitchButton(leftPane, sjright, rightPane, namestyle, nametext, playerx, name, biankuang3, biankuang4, dialog) {
			const sjleft = ui.create.div(".sjleft", leftPane);
			sjleft.onclick = event => {
				event.stopPropagation();
				sjleft.style.display = "none";
				sjright.style.display = "block";
				namestyle.innerHTML = nametext;
				this.createRightPanel(dialog, rightPane, playerx, "name1");
				leftPane.setBackground(name, "character");
				Utils.createBiankuangColor(biankuang3, name === "unknown" ? playerx.group : lib.character[name][1]);
				const groupForBg1 = name === "unknown" ? playerx.group : lib.character[name][1];
				biankuang4.setBackgroundImage(plugin.getOlsBackgroundImage(groupForBg1));
			};
			return sjleft;
		}
		// 创建右侧信息面板
		createRightPanel(dialog, rightPane, player, nametype) {
			dialog.classList.add("single");
			rightPane.innerHTML = "<div></div>";
			lib.setScroll(rightPane.firstChild);
			// 获取技能列表
			const oSkills = this.getSkillsList(player, nametype);
			// 创建技能区域
			this.createSkillsSection(rightPane.firstChild, oSkills, player, nametype);
			// 创建手牌区域
			this.createHandCardsSection(rightPane.firstChild, player);
			// 创建装备区域
			this.createEquipmentSection(rightPane.firstChild, player);
			// 创建判定区域
			this.createJudgeSection(rightPane.firstChild, player);
		}
		// 获取技能列表
		getSkillsList(player, nametype) {
			let skills;
			if (player.name2 && nametype) {
				// 只显示主将/副将技能
				if (nametype === "name1") {
					skills = lib.character[player.name1][3].slice(0);
				} else if (nametype === "name2") {
					skills = lib.character[player.name2][3].slice(0);
				}
			} else {
				skills = player.getSkills(null, false, false).slice(0);
			}
			skills = skills.filter(skill => {
				if (!lib.skill[skill] || skill === "jiu") return false;
				if (lib.skill[skill].nopop || lib.skill[skill].equipSkill) return false;
				return lib.translate[skill + "_info"] && lib.translate[skill + "_info"] !== "";
			});
			if (player === game.me && player.hiddenSkills && player.hiddenSkills.length && !nametype) {
				skills.addArray(player.hiddenSkills);
			}
			return skills;
		}
		// 创建技能区域
		createSkillsSection(container, oSkills, player, nametype) {
			if (!oSkills.length) return;
			ui.create.div(".xcaption", "武将技能", container);
			const hasSkills = [];
			for (let name of oSkills) {
				if (hasSkills.includes(name)) continue;
				if (player.name2 && nametype && (!lib.character[player.name1][3].includes(name) || !lib.character[player.name2][3].includes(name))) {
					if (nametype === "name1" && lib.character[player.name2][3].includes(name)) continue;
					if (nametype === "name2" && lib.character[player.name1][3].includes(name)) continue;
				}
				this.createSkillItem(container, name, player, hasSkills);
			}
		}
		// 创建技能项
		createSkillItem(container, name, player, hasSkills) {
			const info = get.info(name);
			const typeText = Utils.getSkillTypeText(info, player, name);
			if (player.forbiddenSkills[name]) {
				this.createForbiddenSkillItem(container, name, player, typeText);
			} else if (player.hiddenSkills.includes(name)) {
				this.createHiddenSkillItem(container, name, player, typeText);
			} else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) {
				this.createNormalSkillItem(container, name, player, typeText);
			} else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
				this.createFrequentSkillItem(container, name, player, typeText);
			} else if (lib.skill[name].clickable && player.isIn() && player.isUnderControl(true) && player === game.me) {
				this.createClickableSkillItem(container, name, player, typeText);
			} else {
				this.createNormalSkillItem(container, name, player, typeText);
			}
			// 处理衍生技能
			if (info.derivation) {
				this.createDerivationSkills(container, info.derivation, player, hasSkills);
			}
		}
		// 创建禁用技能项
		createForbiddenSkillItem(container, name, player, typeText) {
			const skillHTML = Utils.generateSkillHTML(`<span style="opacity:1">${lib.translate[name]}</span>`, `<span style="opacity:1">(与${get.translation(player.forbiddenSkills[name])}冲突)${get.skillInfoTranslation(name, player, false)}</span>`, typeText);
			ui.create.div(".xskill", skillHTML, container);
		}
		// 创建隐藏技能项
		createHiddenSkillItem(container, name, player, typeText) {
			if (lib.skill[name].preHidden && get.mode() === "guozhan") {
				const id = ui.create.div(".xskill", Utils.generateSkillHTML('<span style="opacity:0.5">' + lib.translate[name] + "</span>", '<span style="opacity:0.5">' + get.skillInfoTranslation(name, player, false) + '</span><br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div>', typeText), container);
				const underlinenode = id.querySelector(".underlinenode");
				if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove("on");
				underlinenode.link = name;
				underlinenode.listen(ui.click.hiddenskill);
			} else {
				ui.create.div(".xskill", Utils.generateSkillHTML(lib.translate[name], get.skillInfoTranslation(name, player, false), typeText), container);
			}
		}
		// 创建普通技能项
		createNormalSkillItem(container, name, player, typeText) {
			ui.create.div(".xskill", Utils.generateSkillHTML(lib.translate[name], get.skillInfoTranslation(name, player, false), typeText), container);
		}
		// 创建频繁技能项
		createFrequentSkillItem(container, name, player, typeText) {
			const id = ui.create.div(".xskill", Utils.generateSkillHTML(lib.translate[name], get.skillInfoTranslation(name, player, false) + '<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div>', typeText), container);
			const underlinenode = id.querySelector(".underlinenode");
			if (lib.skill[name].frequent && lib.config.autoskilllist.includes(name)) {
				underlinenode.classList.remove("on");
			}
			if (lib.skill[name].subfrequent) {
				for (let j = 0; j < lib.skill[name].subfrequent.length; j++) {
					if (lib.config.autoskilllist.includes(name + "_" + lib.skill[name].subfrequent[j])) {
						underlinenode.classList.remove("on");
					}
				}
			}
			underlinenode.link = name;
			underlinenode.listen(ui.click.autoskill2);
		}
		// 创建可点击技能项
		createClickableSkillItem(container, name, player, typeText) {
			const intronode = ui.create.div(".xskill", Utils.generateSkillHTML(lib.translate[name], get.skillInfoTranslation(name, player, false) + '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>', typeText), container);
			if (!_status.gameStarted || (lib.skill[name].clickableFilter && !lib.skill[name].clickableFilter(player))) {
				intronode.classList.add("disabled");
				intronode.style.opacity = 0.5;
			} else {
				intronode.link = player;
				intronode.func = lib.skill[name].clickable;
				intronode.classList.add("pointerdiv");
				intronode.listen(() => {
					container.parentNode.parentNode.parentNode.parentNode.hide();
					game.resume2();
				});
				intronode.listen(ui.click.skillbutton);
			}
		}
		// 创建衍生技能
		createDerivationSkills(container, derivation, player, hasSkills) {
			const createYanshengSkill = skill => {
				hasSkills.push(skill);
				const ysskillname = get.skillTranslation(skill);
				let info = get.info(skill);
				let has;
				if (info.juexingji || info.limited) {
					if (!player.hasSkill(skill)) {
						has = player.awakenedSkills.includes(skill) ? "已发动" : "未生效";
					} else has = "未发动";
				} else {
					has = player.hasSkill(skill) ? "已生效" : "未生效";
				}
				const ysskillmiaoshu = get.translation(skill + "_info");
				let ysSkillNameTypeHTML;
				if (!info.enable && !info.trigger && !info.mod && !info.group) {
					ysSkillNameTypeHTML = `<span class="yanshengji">${ysskillname}</span>`;
				} else {
					ysSkillNameTypeHTML = has !== "未生效" ? `<span class="yanshengji">${ysskillname}(${has})</span>` : `<span style="color: #978a81;" class="yanshengji">${ysskillname}(${has})</span>`;
				}
				const ysSkillDescHTML = `<span class="yanshengjiinfo">${ysskillmiaoshu}</span>`;
				const ysSkillHTML = ysSkillNameTypeHTML + ysSkillDescHTML;
				ui.create.div(".xskill", ysSkillHTML, container);
			};
			if (Array.isArray(derivation)) {
				for (let skill of derivation) {
					createYanshengSkill(skill);
				}
			} else {
				createYanshengSkill(derivation);
			}
		}
		// 创建手牌区域
		createHandCardsSection(container, player) {
			const allShown = player.isUnderControl() || (!game.observe && game.me && game.me.hasSkillTag("viewHandcard", null, player, true));
			const shownHs = player.getShownCards();
			if (shownHs.length) {
				ui.create.div(".xcaption", player.hasCard(card => !shownHs.includes(card), "h") ? "明置的手牌" : "手牌区", container);
				shownHs.forEach(item => {
					const card = Utils.createCardElement(item);
					container.appendChild(card);
				});
				if (allShown) {
					const hs = player.getCards("h");
					hs.removeArray(shownHs);
					if (hs.length) {
						ui.create.div(".xcaption", "其他手牌", container);
						hs.forEach(item => {
							const card = Utils.createCardElement(item);
							container.appendChild(card);
						});
					}
				}
			} else if (allShown) {
				const hs = player.getCards("h");
				if (hs.length) {
					ui.create.div(".xcaption", "手牌区", container);
					hs.forEach(item => {
						const card = Utils.createCardElement(item);
						container.appendChild(card);
					});
				}
			}
		}
		// 创建装备区域
		createEquipmentSection(container, player) {
			const eSkills = player.getCards("e");
			if (!eSkills.length) return;
			ui.create.div(".xcaption", "装备区", container);
			eSkills.forEach(card => {
				const suitConfig = CONSTANTS.SUIT_CONFIG[card.suit] || { symbol: "", color: "#FFFFFF" };
				const typeIcon = CONSTANTS.EQUIP_TYPE_ICONS[get.subtype(card)] || "default.png";
				const dianshu = get.strNumber(card.number);
				const firstLine =
					'<div style="display: flex; align-items: center; gap: 8px; position: relative;">' + '<span style="color: #f7d229; font-weight: bold;">' + get.translation(card.name).replace(/[【】]/g, "") + "</span>" + '<img src="' + CONSTANTS.IMAGE_PATH_PREFIX + typeIcon + '" style="width:14px; height:20px; vertical-align:middle">' + '<div style="margin-left: 0; display: flex; align-items: center; gap: 2px;">' + (suitConfig.image ? '<img src="' + CONSTANTS.IMAGE_PATH_PREFIX + suitConfig.image + '" style="width: 16px;height: 16px;margin-left: -2px;margin-top: 3px;filter: drop-shadow(0 0 1px white);">' : '<span style="color: ' + suitConfig.color + ';margin-left:-2px;margin-top:3px;text-shadow: 0 0 1px white;position: relative;">' + suitConfig.symbol + "</span>") + '<span style="margin-left: 3px;margin-top: 3px;font-size: 18px;color: ' + (suitConfig.color === "#e03c3c" ? suitConfig.color : "#efdbb6") + ';font-family: shousha;">' + (dianshu || "") + "</span>" + "</div>" + "</div>";
				let desc = Utils.getEquipmentDescription(card, player);
				ui.create.div(".xskillx", firstLine + '<div style="margin-top:4px;white-space: pre-wrap;">' + desc + "</div>", container);
			});
		}
		// 创建判定区域
		createJudgeSection(container, player) {
			const judges = player.getCards("j");
			if (!judges.length) return;
			ui.create.div(".xcaption", "判定区域", container);
			judges.forEach(card => {
				const cards = card.cards;
				const str = [get.translation(card), get.translation(card.name + "_info")];
				if ((Array.isArray(cards) && cards.length && !lib.card[card]?.blankCard) || player.isUnderControl(true)) {
					str[0] += `（${get.translation(cards)}）`;
				}
				ui.create.div(".xskill", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, container);
			});
		}
	}
	// 插件主对象
	const plugin = {
		name: "character",
		// 势力背景接口，外部可通过覆盖此方法自定义背景逻辑
		getOlsBackgroundImage(group) {
			return getOlsBackgroundImage(group);
		},
		filter() {
			return !["chess", "tafang", "stone"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			app.reWriteFunction(lib, {
				setIntro: [
					function (args, node) {
						if (get.itemtype(node) === "player") {
							if (lib.config.touchscreen) lib.setLongPress(node, plugin.click.playerIntro);
							else if (lib.config.right_info)
								node.oncontextmenu = function (e) {
									if (e && e.preventDefault) e.preventDefault();
									if (e && e.stopPropagation) e.stopPropagation();
									plugin.click.playerIntro.call(this, e);
									return false;
								};
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
				if (player.node.guessDialog) player.node.guessDialog.classList.toggle("hidden");
				else {
					const list = game.getIdentityList(player);
					if (!list) return;
					const guessDialog = ui.create.div(".guessDialog", player);
					const container = ui.create.div(guessDialog);
					lib.setScroll(guessDialog);
					player.node.guessDialog = guessDialog;
				}
			},
			playerIntro(e) {
				if (e && e.preventDefault) e.preventDefault();
				if (e && e.stopPropagation) e.stopPropagation();
				if (plugin.playerDialog) {
					return plugin.playerDialog.show(this);
				}
				const manager = new CharacterInfoManager();
				plugin.playerDialog = manager;
				manager.show(this, "name1", true);
			},
		},
	};
	return plugin;
});
