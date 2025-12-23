import { lib, game, ui, get, ai, _status } from "noname";

export let config = {
	FL0: {
		name: '<b><font color="#00FF66">★𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★',
		//name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
		intro: "",
		init: true,
		clear: true,
		onclick: () => {
			game.playAudio("..", "extension", "十周年UI/audio", "Ciallo");
		},
	},
	eruda: {
		name: "调试助手",
		init: false,
	},
	translate: {
		name: "卡牌拖拽",
		init: false,
		intro: "开启后手牌可以任意拖拽牌序，自动重启",
		onclick(bool) {
			game.saveConfig("extension_十周年UI_translate", bool);
			setTimeout(() => game.reload(), 100);
		},
		update() {
			const enabled = lib.config.extension_十周年UI_translate;
			if (enabled) {
				lib.init.js(`${lib.assetURL}extension/十周年UI/js/cardtranslate.js`);
			}
			game.saveConfig("enable_drag", !enabled);
		},
	},
	newDecadeStyle: {
		name: "切换样式",
		intro: "切换武将边框样式和界面布局，初始为十周年样式，根据个人喜好自行切换，选择不同的设置后游戏会自动重启以生效新的设置",
		init: "on",
		item: {
			on: "十周年",
			off: "移动版",
			othersOff: "一将成名",
			onlineUI: "online",
			babysha: "欢乐三国杀",
			codename: "名将杀",
		},
		onclick(control) {
			const origin = lib.config.extension_十周年UI_newDecadeStyle;
			game.saveConfig("extension_十周年UI_newDecadeStyle", control);
			if (origin !== control) {
				setTimeout(() => game.reload(), 100);
			}
		},
		update() {
			if (window.decadeUI) {
				const style = lib.config.extension_十周年UI_newDecadeStyle;
				ui.arena.dataset.newDecadeStyle = style;
				const decadeLayoutStyles = ["on", "othersOff", "onlineUI", "babysha", "codename"];
				ui.arena.dataset.decadeLayout = decadeLayoutStyles.includes(style) ? "on" : "off";
			}
		},
	},
	rightLayout: {
		name: "左右布局",
		init: "on",
		intro: "切换完以后自动重启游戏，手杀十周年一将之后的样式不再维护",
		item: {
			off: "左手",
			on: "右手",
		},
		update() {
			const layout = lib.config.extension_十周年UI_rightLayout;
			if (layout === "on" || layout === "off") {
				ui.arena.dataset.rightLayout = layout;
			}
		},
		onclick(item) {
			lib.config.extension_十周年UI_rightLayout = item ?? "off";
			game.saveConfig("extension_十周年UI_rightLayout", item);
			game.reload();
		},
	},
	cardScale: {
		name: "手牌大小",
		intro: "输入0.10~1.00的小数，回车保存并生效",
		init: "0.18",
		input: true,
		onblur: function () {
			this.innerHTML = this.innerHTML.replace(/<br>/g, "");
			let value = parseFloat(this.innerHTML);
			if (isNaN(value)) value = 0.18;
			value = Math.max(0.1, Math.min(1, value));
			this.innerHTML = value.toFixed(2);
			game.saveConfig("extension_十周年UI_cardScale", value);
			if (window.decadeUI) {
				decadeUI.zooms.card = decadeUI.getCardBestScale();
				decadeUI.layout.resize();
			}
		},
	},
	discardScale: {
		name: "弃牌堆卡牌大小",
		intro: "输入0.10~1.00的小数，回车保存并生效",
		init: "0.14",
		input: true,
		onblur: function () {
			this.innerHTML = this.innerHTML.replace(/<br>/g, "");
			let value = parseFloat(this.innerHTML);
			if (isNaN(value)) value = 0.18;
			value = Math.max(0.1, Math.min(1, value));
			this.innerHTML = value.toFixed(2);
			game.saveConfig("extension_十周年UI_discardScale", value);
			if (window.decadeUI) {
				decadeUI.layout.updateDiscard();
			}
		},
	},
	FL120: {
		name: '<b><font color="#00FF66">★𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★',
		intro: "",
		init: true,
		clear: true,
		onclick: () => {
			game.playAudio("..", "extension", "十周年UI/audio", "Ciallo");
		},
	},
	cardPrettify: (() => {
		const cardSkinPresets = [
			{ key: "online", dir: "online", label: "OL卡牌", extension: "jpg" },
			{ key: "caise", dir: "caise", label: "彩色卡牌", extension: "webp" },
			{ key: "decade", dir: "decade", label: "原十周年", extension: "png" },
			{ key: "bingkele", dir: "bingkele", label: "哈基米哦", extension: "png" },
			{ key: "GoldCard", dir: "GoldCard", label: "手杀金卡", extension: "webp" },
		];
		const cardSkinMeta = cardSkinPresets.reduce((map, skin) => {
			map[skin.key] = skin;
			return map;
		}, {});
		return {
			name: "卡牌美化",
			init: "decade",
			item: cardSkinPresets.reduce(
				(options, skin) => {
					options[skin.key] = skin.label;
					return options;
				},
				{ off: "关闭" }
			),
			_cardSkinPresets: cardSkinPresets,
			_cardSkinMeta: cardSkinMeta,
		};
	})(),
	cardkmh: {
		name: "卡牌边框",
		init: "off",
		item: {
			off: "关闭",
			kuang1: "大司马",
			kuang2: "大将军",
			kuang3: "国都护",
		},
	},
	cardbj: {
		name: "卡牌背景",
		init: "kb1",
		item: {
			kb1: "默认",
			kb2: "国都护",
			kb3: "大将军",
			kb4: "大司马",
		},
		onclick: item => {
			game.saveConfig("extension_十周年UI_cardbj", item);
		},
		visualMenu: (node, link) => {
			node.style.height = `${node.offsetWidth * 1.4}px`;
			node.style.backgroundSize = "100% 100%";
			node.className = "button character incardback";
			node.setBackgroundImage(`extension/十周年UI/assets/image/${link}.png`);
		},
	},
	chupaizhishi: {
		name: "出牌指示",
		intro: "此选项可以切换目标指示特效，根据个人喜好自行切换，重启生效",
		init: "off",
		item: {
			jiangjun: "将军",
			weijiangjun: "卫将军",
			cheqijiangjun: "车骑将军",
			biaoqijiangjun: "骠骑将军",
			dajiangjun: "大将军",
			dasima: "大司马",
			shoushaX: "手杀经典",
			shousha: "手杀新版",
			random: "随机",
			off: "关闭",
		},
		update() {
			const config = lib.config.extension_十周年UI_chupaizhishi;
			if (config === "random") {
				const options = ["shousha", "shoushaX", "jiangjun", "weijiangjun", "cheqijiangjun", "biaoqijiangjun", "dajiangjun", "dasima"];
				const selected = options.randomGet();
				if (window.decadeUI) decadeUI.config.chupaizhishi = selected;
			} else if (window.decadeUI) {
				ui.arena.dataset.chupaizhishi = config;
			}
		},
	},
	killEffect: {
		name: "击杀特效",
		intro: "开启后，击杀敌方角色时会显示击杀特效",
		init: true,
	},
	//菜单美化
	meanPrettify: {
		name: "菜单美化",
		intro: "开启全屏的菜单样式",
		init: false,
		onclick(bool) {
			game.saveConfig("extension_十周年UI_meanPrettify", bool);
			if (bool) {
				lib.init.css(`${window.decadeUIPath}extension/十周年UI`, "menu");
			} else {
				const menuLink = document.head.querySelector("link[href*='menu.css']");
				menuLink?.remove();
			}
			setTimeout(() => game.reload(), 100);
		},
	},
	bettersound: {
		name: "更多音效",
		intro: "开启后，对局内点击卡牌或按钮和出牌弃牌会有音效播放",
		init: true,
	},
	skillDieAudio: {
		name: "中二模式",
		intro: "众所周知，使用技能前需要吟唱。",
		init: true,
	},
	dynamicSkin: {
		name: "动态皮肤",
		intro: "开启后显示动态皮肤，阵亡后也保留",
		init: false,
		onclick: value => {
			game.saveConfig("extension_十周年UI_dynamicSkin", value);
			lib.config.dynamicSkin = value;
			game.saveConfig("dynamicSkin", value);
			if (confirm("此功能需要手动导入骨骼文件以及安装《皮肤切换》和《千幻聆音》扩展\n点击确定自动重启")) {
				game.reload();
			}
		},
	},
	dynamicSkinOutcrop: {
		name: "动皮露头",
		init: false,
		update() {
			if (window.decadeUI) {
				const enable = lib.config.extension_十周年UI_dynamicSkinOutcrop;
				ui.arena.dataset.dynamicSkinOutcrop = enable ? "on" : "off";
				const players = game.players;
				if (!players) return;
				players.forEach(player => {
					if (player.dynamic) {
						player.dynamic.outcropMask = enable;
						player.dynamic.update(false);
					}
				});
			}
		},
	},
	showTemp: {
		name: "卡牌显示",
		init: true,
		intro: "开启此选项后，视为卡牌显示将会替换为十周年UI内置替换显示",
		onclick(bool) {
			game.saveConfig("extension_十周年UI_showTemp", bool);
			if (game.me && lib.config.cardtempname !== "off") {
				const cards = game.me.getCards("h", card => card._tempName);
				const skill = _status.event.skill;
				const goon = skill && get.info(skill)?.viewAs && !get.info(skill).ignoreMod && cards.some(card => (ui.selected.cards || []).includes(card));
				if (cards.length) {
					cards.forEach(card => {
						card._tempName?.delete();
						delete card._tempName;
						let cardname, cardnature, cardskb;
						if (!goon) {
							cardname = get.name(card);
							cardnature = get.nature(card);
						} else {
							cardskb = typeof get.info(skill).viewAs === "function" ? get.info(skill).viewAs([card], game.me) : get.info(skill).viewAs;
							cardname = get.name(cardskb);
							cardnature = get.nature(cardskb);
						}
						if (card.name !== cardname || !get.is.sameNature(card.nature, cardnature, true)) {
							if (bool) {
								if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);
								let tempname2 = get.translation(cardname);
								if (cardnature) {
									card._tempName.dataset.nature = cardnature;
									if (cardname === "sha") {
										tempname2 = get.translation(cardnature) + tempname2;
									}
								}
								const tempname = tempname2;
								card._tempName.innerHTML = tempname;
								card._tempName.tempname = tempname;
							} else {
								const node = goon ? ui.create.cardTempName(cardskb, card) : ui.create.cardTempName(card);
								if (lib.config.cardtempname !== "default") node.classList.remove("vertical");
							}
						}
					});
					//game.uncheck();
					//game.check();
				}
			}
		},
	},
	wujiangbeijing: {
		name: "武将背景",
		init: true,
		intro: "开启后，单双将和国战模式将用设置好的武将背景",
	},
	shiliyouhua: {
		name: "官方势力",
		init: true,
		intro: "开启后，非魏蜀吴群晋势力的角色将会重新选择势力，且美化势力选择框的展示效果",
	},
	forcestyle: {
		name: "势力样式",
		init: "2",
		item: {
			1: "文字样式",
			2: "图片样式",
		},
		update() {
			if (window.decadeUI) {
				ui.arena.dataset.forcestyle = lib.config.extension_十周年UI_forcestyle;
			}
		},
	},
	cardPrompt: {
		name: "出牌信息提示",
		init: true,
	},
	handTipHeight: {
		name: "出牌信息提示高度",
		init: "20",
		intro: "输入0~100的数值，设置手牌提示框的底部高度百分比（默认值为20）",
		input: true,
		onblur: function () {
			this.innerHTML = this.innerHTML.replace(/<br>/g, "");
			let value = parseFloat(this.innerHTML);
			if (isNaN(value)) value = 20;
			value = Math.max(0, Math.min(100, value));
			this.innerHTML = value;
			game.saveConfig("extension_十周年UI_handTipHeight", value);
			if (window.decadeUI) {
				document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${value}% + 10px)`);
			}
		},
		update() {
			if (window.decadeUI) {
				const height = lib.config.extension_十周年UI_handTipHeight ?? "20";
				document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${height}% + 10px)`);
			}
		},
	},
	luckycard: {
		name: "手气卡美化",
		init: true,
		intro: "开启后，开启后手气卡锁定五次",
	},
	aloneEquip: {
		name: "单独装备栏",
		intro: "切换玩家装备栏为单独装备栏或非单独装备栏，初始为单独装备栏，根据个人喜好调整",
		init: true,
		update() {
			const config = lib.config.extension_十周年UI_aloneEquip;
			if (window.decadeUI) {
				ui.arena.dataset.aloneEquip = config ? "on" : "off";
			}
			_status.nopopequip = config;
			if (_status.gameStarted && ui?.equipSolts) {
				try {
					ui.equipSolts.style.display = config ? "" : "none";
				} catch (e) {}
				if (config && game.me !== ui.equipSolts.me) {
					if (ui.equipSolts.me) {
						ui.equipSolts.me.appendChild(ui.equipSolts.equips);
					}
					ui.equipSolts.me = game.me;
					ui.equipSolts.equips = game.me.node.equips;
					ui.equipSolts.appendChild(game.me.node.equips);
					game.me.$syncExpand();
				}
				if (!config && game.me === ui.equipSolts.me) {
					ui.equipSolts.me.appendChild(ui.equipSolts.equips);
					ui.equipSolts.me = undefined;
				}
			}
			game.uncheck();
			game.check();
		},
	},
	outcropSkin: {
		name: "露头样式",
		init: "off",
		item: {
			shizhounian: "十周年露头",
			shousha: "手杀露头",
			off: "关闭",
		},
		update() {
			if (window.decadeUI) {
				ui.arena.dataset.outcropSkin = lib.config.extension_十周年UI_outcropSkin;
			}
		},
	},
	borderLevel: {
		name: "等阶边框",
		init: "five",
		item: {
			one: "一阶",
			two: "二阶",
			three: "三阶",
			four: "四阶",
			five: "五阶",
			random: "随机",
		},
		update() {
			if (window.decadeUI) {
				const value = lib.config.extension_十周年UI_borderLevel;
				ui.arena.dataset.borderLevel = value;
				ui.arena.dataset.longLevel = value;
				if (_status.gameStarted) {
					const players = ui.arena?.querySelectorAll?.(".player") || [];
					if (value === "random") {
						const levels = ["one", "two", "three", "four", "five"];
						players.forEach(p => {
							const level = levels[Math.floor(Math.random() * levels.length)];
							p.dataset.borderLevel = level;
							p.dataset.longLevel = level;
						});
					} else {
						players.forEach(p => {
							delete p.dataset.borderLevel;
							delete p.dataset.longLevel;
						});
					}
				}
			}
		},
	},
	playerMarkStyle: {
		name: "标记样式",
		init: "decade",
		item: {
			red: "红灯笼",
			yellow: "黄灯笼",
			decade: "十周年",
		},
		update() {
			if (window.decadeUI) {
				ui.arena.dataset.playerMarkStyle = lib.config.extension_十周年UI_playerMarkStyle;
			}
		},
	},
	shadowStyle: {
		name: "特效风格",
		intro: "可根据个人喜好切换局内阴影动态特效与人物弹出文字的样式，目前只有新手杀/online样式可用",
		init: "off",
		item: {
			on: "原样式",
			off: "新样式",
		},
		update() {
			if (window.decadeUI) {
				ui.arena.dataset.shadowStyle = lib.config.extension_十周年UI_shadowStyle;
			}
		},
	},
	gainSkillsVisible: {
		name: "获得技能显示",
		init: "othersOn",
		item: {
			on: "显示",
			off: "不显示",
			othersOn: "显示他人",
		},
		update() {
			if (window.decadeUI) {
				ui.arena.dataset.gainSkillsVisible = lib.config.extension_十周年UI_gainSkillsVisible;
			}
		},
	},
	loadingStyle: {
		name: "更换光标+loading框",
		intro: "可以更换局内选项框以及光标",
		init: "off",
		item: {
			off: "关闭",
			on: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/assets/image/dialog2.png);background-size: 100% 100%;"></div>`,
			On: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/assets/image/dialog1.png);background-size: 100% 100%;"></div>`,
			othersOn: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/assets/image/dialog3.png);background-size: 100% 100%;"></div>`,
			othersOff: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/assets/image/dialog4.png);background-size: 100% 100%;"></div>`,
			onlineUI: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/assets/image/dialog5.png);background-size: 100% 100%;"></div>`,
		},
		update() {
			if (window.decadeUI) {
				ui.arena.dataset.loadingStyle = lib.config.extension_十周年UI_loadingStyle;
			}
		},
	},
	//手杀UI
	FL1: {
		name: '<b><font color="#00FF66">★𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★',
		intro: "",
		init: true,
		clear: true,
		onclick: () => {
			game.playAudio("..", "extension", "十周年UI/audio", "Ciallo");
		},
	},
	/*-----进度条-------*/
	jindutiao: {
		init: true,
		intro: "自己回合内显示进度条带素材",
		name: "进度条",
	},
	JDTS: {
		init: true,
		intro: "自己回合内显示对应阶段图片提示",
		name: "阶段提示",
	},
	jindutiaotuoguan: {
		name: "托管效果",
		init: false,
		intro: "开启进度条的情况下，开启此选项后，当玩家的进度条时间走完时，将自动托管。",
	},
	JDTSYangshi: {
		name: "阶段提示",
		init: "2",
		intro: "切换阶段提示样式，可根据个人喜好切换",
		item: {
			1: "手杀阶段提示",
			2: "十周年阶段提示",
			3: "OL阶段提示",
			4: "欢乐阶段提示",
		},
	},
	jindutiaoYangshi: {
		name: "进度条样式",
		init: "3",
		intro: "切换进度条样式，可根据个人喜好切换手杀进度条或十周年进度条，切换后重启生效",
		item: {
			1: "手杀进度条",
			2: "十周年PC端进度条",
			3: "十周年客户端进度条",
			4: "一将成名进度条",
		},
	},
	jindutiaoST: {
		name: "进度条时间间隔",
		init: "100",
		intro: "<li>设置玩家进度条的时间间隔。",
		item: {
			10: "10毫秒/次",
			50: "50毫秒/次",
			100: "100毫秒/次",
			200: "200毫秒/次",
			500: "500毫秒/次",
			800: "800毫秒/次",
			1000: "1秒/次",
			2000: "2秒/次",
		},
	},
	jindutiaoSet: {
		name: "进度条高度",
		init: "22",
		intro: "输入0~100的数值，设置玩家进度条的高度百分比（默认值为22）",
		input: true,
		onblur: function () {
			this.innerHTML = this.innerHTML.replace(/<br>/g, "");
			let value = parseFloat(this.innerHTML);
			if (isNaN(value)) value = 22;
			value = Math.max(0, Math.min(100, value));
			this.innerHTML = value;
			game.saveConfig("extension_十周年UI_jindutiaoSet", value);
			const progressBar = document.getElementById("jindutiaopl");
			if (progressBar) {
				progressBar.style.bottom = `${value}%`;
			}
		},
		update() {
			const height = lib.config.extension_十周年UI_jindutiaoSet ?? "22";
			const progressBar = document.getElementById("jindutiaopl");
			if (progressBar) {
				progressBar.style.bottom = `${height}%`;
			}
		},
	},
	FL3: {
		name: '<b><font color="#00FF66">★𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★',
		intro: "",
		init: true,
		clear: true,
		onclick: () => {
			game.playAudio("..", "extension", "十周年UI/audio", "Ciallo");
		},
	},
	/*-------狗托播报-----*/
	GTBB: {
		init: false,
		intro: "开启后，顶部会出现滚动播报栏。",
		name: "狗托播报",
	},
	GTBBYangshi: {
		name: "播报样式",
		init: "on",
		intro: "切换狗托播报样式",
		item: {
			on: "手杀",
			off: "十周年",
		},
	},
	GTBBFont: {
		name: "播报字体",
		init: "on",
		intro: "切换狗托播报字体，可根据个人喜好切换（即时生效）",
		item: {
			on: '<font face="shousha">手杀',
			off: '<font face="yuanli">十周年',
		},
	},
	GTBBTime: {
		name: "时间间隔",
		init: "60000",
		intro: "更改狗托播报出现的时间间隔，可根据个人喜好调整频率",
		item: {
			30000: "0.5min/次",
			60000: "1min/次",
			120000: "2min/次",
			300000: "5min/次",
		},
	},
	XPJ: {
		name: "小配件",
		init: "off",
		intro: "十周年样式下，选择切换左下角小配件",
		item: {
			on: "原版",
			off: "新版",
		},
	},
	LTAN: {
		init: false,
		intro: "<li>手杀样式下在游戏中，隐藏左下角的聊天按钮<li>需重启",
		name: "聊天按钮隐藏",
	},
	mx_decade_characterDialog: {
		name: "自由选将筛选框",
		init: "extension-OL-system",
		intro: "更改自由选将筛选框",
		item: {
			default: "默认本体框",
			"extension-OL-system": "扩展内置框",
			offDialog: "关闭筛选框",
		},
	},
};

export const cardSkinPresets = config.cardPrettify._cardSkinPresets;
export const cardSkinMeta = config.cardPrettify._cardSkinMeta;
