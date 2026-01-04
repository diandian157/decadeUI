/**
 * @fileoverview 扩展配置项定义
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { refreshCardSkin } from "./overrides/card.js";
import { chupaiAnimations } from "./animation/configs/skillAnimations.js";

/**
 * 获取从当前元素到结束标记之间的所有兄弟元素
 * @description 用于实现折叠菜单功能，收集需要隐藏/显示的菜单项
 * @param {HTMLElement} parent - 起始元素（标题元素）
 * @param {string} endId - 结束标记元素的ID
 * @returns {HTMLElement[]} 介于起始和结束标记之间的所有DOM元素
 */
function getMenuItems(parent, endId) {
	const items = [];
	let next = parent.nextSibling;
	while (next) {
		const idEl = next.querySelector?.("[id]");
		if (idEl?.id === endId) break;
		items.push(next);
		next = next.nextSibling;
	}
	return items;
}

/**
 * 折叠菜单切换函数
 * @description 点击标题时切换菜单项的显示/隐藏状态
 * @this {HTMLElement} 标题元素
 * @param {string} configKey - 配置键名，用于存储折叠状态和元素引用
 * @param {string} title - 菜单标题文本
 * @param {string} [color="gold"] - 标题颜色
 */
function colMenu(configKey, title, color = "gold") {
	const endId = configKey + "_end";
	const isCollapsed = !lib.config[configKey];

	if (isCollapsed) {
		lib.config[configKey] = getMenuItems(this, endId);
		this.innerHTML = `<span style='color:${color}'><font size='4'>${title}（点击展开）▷</font></span>`;
		lib.config[configKey].forEach(el => (el.style.display = "none"));
	} else {
		this.innerHTML = `<span style='color:${color}'><font size='4'>${title}（点击折叠）▽</font></span>`;
		lib.config[configKey].forEach(el => (el.style.display = ""));
		delete lib.config[configKey];
	}
}

/** @type {Array<{key: string, dir: string, label: string, extension: string}>} 卡牌皮肤预设 */
const cardSkinPresets = [
	{ key: "online", dir: "online", label: "OL卡牌", extension: "jpg" },
	{ key: "caise", dir: "caise", label: "彩色卡牌", extension: "webp" },
	{ key: "decade", dir: "decade", label: "原十周年", extension: "png" },
	{ key: "bingkele", dir: "bingkele", label: "哈基米哦", extension: "png" },
	{ key: "gold", dir: "gold", label: "手杀金卡", extension: "webp" },
];

/** @type {Record<string, Object>} 卡牌皮肤元数据映射 */
const cardSkinMeta = cardSkinPresets.reduce((map, skin) => {
	map[skin.key] = skin;
	return map;
}, {});

/** 播放Ciallo音效 */
const playCialloAudio = () => game.playAudio("..", "extension", "十周年UI/audio", "Ciallo");

/** 创建分隔线配置 */
const createSeparator = () => ({
	name: '<b><font color="#00FF66">★𝑪𝒊𝒂𝒍𝒍𝒐～(∠・ω< )⌒★',
	intro: "",
	init: true,
	clear: true,
	onclick: playCialloAudio,
});

/**
 * 解析输入框数值并限制范围
 * @param {HTMLElement} element
 * @param {number} defaultVal
 * @param {number} min
 * @param {number} max
 * @param {number} [decimals=0]
 * @returns {number}
 */
const parseInputValue = (element, defaultVal, min, max, decimals = 0) => {
	element.innerHTML = element.innerHTML.replace(/<br>/g, "");
	let value = parseFloat(element.innerHTML);
	if (isNaN(value)) value = defaultVal;
	value = Math.max(min, Math.min(max, value));
	element.innerHTML = decimals > 0 ? value.toFixed(decimals) : value;
	return value;
};

/** @type {Object} 扩展配置项 */
export let config = {
	FL0: createSeparator(),

	extensionToggle: {
		clear: true,
		onclick: () => window.decadeUI?.toggleExtensions?.(),
		update() {
			const key = "extension_十周年UI_closedExtensions";
			const closed = Array.isArray(lib.config[key]) ? lib.config[key] : [];
			const menu = lib.extensionMenu?.extension_十周年UI?.extensionToggle;
			if (menu) menu.name = closed.length > 0 ? `<ins>一键恢复 ${closed.length} 个扩展</ins>` : "<ins>一键关闭其他扩展</ins>";
		},
	},

	eruda: {
		name: "调试助手",
		init: false,
	},

	// 整体外观
	outward_title: {
		clear: true,
		name: `<span style='color:orange'><font size='4'>整体外观（点击折叠）▽</font></span>`,
		onclick() {
			colMenu.call(this, "outward_title", "整体外观", "orange");
		},
	},

	newDecadeStyle: {
		name: "切换样式",
		intro: "切换武将边框样式和界面布局，选择不同设置后游戏会自动重启，电脑端支持alt+123456快捷切换",
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
			if (origin !== control) setTimeout(() => game.reload(), 100);
		},
		update() {
			if (!window.decadeUI) return;
			const style = lib.config.extension_十周年UI_newDecadeStyle;
			ui.arena.dataset.newDecadeStyle = style;
			const decadeLayoutStyles = ["on", "othersOff", "onlineUI", "babysha", "codename"];
			ui.arena.dataset.decadeLayout = decadeLayoutStyles.includes(style) ? "on" : "off";
		},
	},

	rightLayout: {
		name: "左右布局",
		init: "on",
		intro: "切换完以后自动重启游戏",
		item: { off: "左手", on: "右手" },
		update() {
			const layout = lib.config.extension_十周年UI_rightLayout;
			if (layout === "on" || layout === "off") ui.arena.dataset.rightLayout = layout;
		},
		onclick(item) {
			lib.config.extension_十周年UI_rightLayout = item ?? "off";
			game.saveConfig("extension_十周年UI_rightLayout", item);
			game.reload();
		},
	},

	outcropSkin: {
		name: "露头样式",
		init: "off",
		item: { shizhounian: "十周年露头", shousha: "手杀露头", off: "关闭" },
		update() {
			if (!window.decadeUI) return;
			const style = lib.config.extension_十周年UI_outcropSkin;
			ui.arena.dataset.outcropSkin = style;
			decadeUI.updateAllOutcropAvatars?.(style);
		},
		onclick(item) {
			game.saveConfig("extension_十周年UI_outcropSkin", item);
			if (window.decadeUI) {
				ui.arena.dataset.outcropSkin = item;
				decadeUI.updateAllOutcropAvatars?.(item);
			}
		},
	},

	borderLevel: {
		name: "等阶边框",
		init: "five",
		item: { one: "一阶", two: "二阶", three: "三阶", four: "四阶", five: "五阶", random: "随机" },
		update() {
			if (!window.decadeUI) return;
			const value = lib.config.extension_十周年UI_borderLevel;
			ui.arena.dataset.borderLevel = value;
			ui.arena.dataset.longLevel = value;

			if (!_status.gameStarted) return;
			const players = ui.arena?.querySelectorAll?.(".player") || [];
			if (value === "random") {
				const levels = ["one", "two", "three", "four", "five"];
				players.forEach(p => {
					const level = p === game.me ? "five" : levels[Math.floor(Math.random() * levels.length)];
					p.dataset.borderLevel = level;
					p.dataset.longLevel = level;
				});
			} else {
				players.forEach(p => {
					delete p.dataset.borderLevel;
					delete p.dataset.longLevel;
				});
			}
		},
	},

	aloneEquip: {
		name: "单独装备栏",
		intro: "切换玩家装备栏为单独装备栏或非单独装备栏",
		init: true,
		update() {
			const config = lib.config.extension_十周年UI_aloneEquip;
			if (window.decadeUI) ui.arena.dataset.aloneEquip = config ? "on" : "off";
			_status.nopopequip = config;

			if (!_status.gameStarted || !ui?.equipSolts) return;

			try {
				ui.equipSolts.style.display = config ? "" : "none";
			} catch (e) {}

			if (config && game.me !== ui.equipSolts.me) {
				ui.equipSolts.me?.appendChild(ui.equipSolts.equips);
				ui.equipSolts.me = game.me;
				ui.equipSolts.equips = game.me.node.equips;
				ui.equipSolts.appendChild(game.me.node.equips);
				game.me.$syncExpand();
			}
			if (!config && game.me === ui.equipSolts.me) {
				ui.equipSolts.me.appendChild(ui.equipSolts.equips);
				ui.equipSolts.me = undefined;
			}
			game.uncheck();
			game.check();
		},
	},

	meanPrettify: {
		name: "菜单美化",
		intro: "开启全屏的菜单样式",
		init: false,
		onclick(bool) {
			game.saveConfig("extension_十周年UI_meanPrettify", bool);
			ui.css.decadeMenu?.remove();
			delete ui.css.decadeMenu;
			if (bool) ui.css.decadeMenu = lib.init.css(`${window.decadeUIPath}src/styles`, "menu");
		},
	},

	dynamicSkin: {
		name: "动态皮肤",
		intro: "开启后显示动态皮肤，阵亡后也保留",
		init: false,
		onclick: value => {
			game.saveConfig("extension_十周年UI_dynamicSkin", value);
			lib.config.dynamicSkin = value;
			game.saveConfig("dynamicSkin", value);
		},
	},

	dynamicSkinOutcrop: {
		name: "动皮露头",
		init: false,
		update() {
			if (!window.decadeUI) return;
			const enable = lib.config.extension_十周年UI_dynamicSkinOutcrop;
			ui.arena.dataset.dynamicSkinOutcrop = enable ? "on" : "off";
			game.players?.forEach(player => {
				if (player.dynamic) {
					player.dynamic.outcropMask = enable;
					player.dynamic.update(false);
				}
			});
		},
	},

	killEffect: {
		name: "击杀特效",
		intro: "开启后，击杀敌方角色时会显示击杀特效",
		init: true,
	},

	outward_title_end: { clear: true, name: "<span id='outward_title_end'></span>" },

	// 卡牌相关
	card_title: {
		clear: true,
		name: `<span style='color:orange'><font size='4'>卡牌相关（点击折叠）▽</font></span>`,
		onclick() {
			colMenu.call(this, "card_title", "卡牌相关", "orange");
		},
	},

	translate: {
		name: "卡牌拖拽",
		init: false,
		intro: "开启后手牌可以任意拖拽牌序并支持本体拖拽",
		onclick(bool) {
			game.saveConfig("extension_十周年UI_translate", bool);
			window.decadeUI?.destroyCardDragSwap?.();
			if (bool) window.decadeUI?.initCardDragSwap?.();
		},
	},

	cardGhostEffect: {
		name: "幻影出牌",
		intro: "开启后，卡牌打出或摸牌时会产生幻影拖尾效果，性能杀手请注意",
		init: true,
		onclick(bool) {
			game.saveConfig("extension_十周年UI_cardGhostEffect", bool);
			window.decadeUI?.effect?.ghost?.setEnabled?.(bool);
		},
	},

	autoSelect: {
		name: "自动选择",
		intro: "开启后会关闭自动确认，自动选择单个合法目标和手牌，重启生效",
		init: true,
		onclick(bool) {
			game.saveConfig("extension_十周年UI_autoSelect", bool);
			game.saveConfig("auto_confirm", !bool);
			lib.config.auto_confirm = !bool;
		},
		update() {
			if (lib.config.extension_十周年UI_autoSelect !== false) {
				game.saveConfig("auto_confirm", false);
				lib.config.auto_confirm = false;
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
		onblur() {
			const value = parseInputValue(this, 20, 0, 100);
			game.saveConfig("extension_十周年UI_handTipHeight", value);
			if (window.decadeUI) document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${value}% + 10px)`);
		},
		update() {
			if (window.decadeUI) {
				const height = lib.config.extension_十周年UI_handTipHeight ?? "20";
				document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${height}% + 10px)`);
			}
		},
	},

	cardScale: {
		name: "手牌大小",
		intro: "输入0.10~1.00的小数，回车保存并生效",
		init: "0.18",
		input: true,
		onblur() {
			const value = parseInputValue(this, 0.18, 0.1, 1, 2);
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
		onblur() {
			const value = parseInputValue(this, 0.18, 0.1, 1, 2);
			game.saveConfig("extension_十周年UI_discardScale", value);
			if (window.decadeUI) decadeUI.layout.updateDiscard();
		},
	},

	cardPrettify: {
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
		onclick(item) {
			game.saveConfig("extension_十周年UI_cardPrettify", item);
			[ui.cardPile, ui.discardPile].forEach(pile => pile?.childNodes?.forEach(refreshCardSkin));
			game.players?.forEach(p => {
				["handcards1", "handcards2", "equips", "judges"].forEach(key => {
					p.node?.[key]?.childNodes?.forEach(refreshCardSkin);
				});
			});
			// 冰可乐彩蛋
			game.players?.forEach(p => {
				const isBozai1 = p.name === "bozai" || p.name1 === "bozai";
				const isBozai2 = p.name2 === "bozai";
				if (!isBozai1 && !isBozai2) return;

				if (item === "bingkele") {
					const url = `https://q1.qlogo.cn/g?b=qq&nk=739201322&s=640&t=${Date.now()}`;
					if (isBozai1) {
						p.node.avatar.setBackgroundImage(url);
						if (p.node.name) p.node.name.innerHTML = "冰可乐喵";
					}
					if (isBozai2 && p.node.avatar2) {
						p.node.avatar2.setBackgroundImage(url);
						if (p.node.name2) p.node.name2.innerHTML = "冰可乐喵";
					}
				} else {
					if (isBozai1) {
						p.node.avatar.setBackground(p.name1 || p.name, "character");
						if (p.node.name) p.node.name.innerHTML = get.slimName(p.name1 || p.name);
					}
					if (isBozai2 && p.node.avatar2) {
						p.node.avatar2.setBackground(p.name2, "character");
						if (p.node.name2) p.node.name2.innerHTML = get.slimName(p.name2);
					}
				}
			});
		},
	},

	cardkmh: {
		name: "卡牌边框",
		init: "off",
		item: { off: "关闭", kuang1: "大司马", kuang2: "大将军", kuang3: "国都护" },
		onclick(item) {
			game.saveConfig("extension_十周年UI_cardkmh", item);
			const bgMap = { kuang1: "kb4", kuang2: "kb3", kuang3: "kb2" };
			game.saveConfig("extension_十周年UI_cardbj", bgMap[item] || null);
			window.decadeUI?.updateCardStyles?.();
		},
		update() {
			if (!game?.saveConfig) return;
			const border = lib.config.extension_十周年UI_cardkmh || "off";
			const bgMap = { kuang1: "kb4", kuang2: "kb3", kuang3: "kb2" };
			game.saveConfig("extension_十周年UI_cardbj", bgMap[border] || null);
		},
	},

	chupaizhishi: {
		name: "出牌指示",
		intro: "切换目标指示特效",
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
			if (!window.decadeUI) return;
			const config = lib.config.extension_十周年UI_chupaizhishi;
			const options = ["shousha", "shoushaX", "jiangjun", "weijiangjun", "cheqijiangjun", "biaoqijiangjun", "dajiangjun", "dasima"];
			decadeUI.config.chupaizhishi = config === "random" ? options.randomGet() : config;
			ui.arena.dataset.chupaizhishi = config;

			if (!game.players || !decadeUI.animation) return;
			game.players.forEach(player => {
				if (player.ChupaizhishiXid) {
					decadeUI.animation.stopSpine(player.ChupaizhishiXid);
					delete player.ChupaizhishiXid;
				}
				if (player.classList.contains("selectable") && config !== "off") {
					const anim = chupaiAnimations[decadeUI.config.chupaizhishi];
					if (anim) player.ChupaizhishiXid = decadeUI.animation.playSpine({ name: anim.name, loop: true }, { parent: player, scale: anim.scale });
				}
			});
		},
	},

	card_title_end: { clear: true, name: "<span id='card_title_end'></span>" },

	// 部件管理
	component_title: {
		clear: true,
		name: `<span style='color:orange'><font size='4'>部件管理（点击折叠）▽</font></span>`,
		onclick() {
			colMenu.call(this, "component_title", "部件管理", "orange");
		},
	},

	jindutiaoYangshi: {
		name: "进度条",
		init: "2",
		intro: "切换进度条样式",
		item: { 0: "关闭", 1: "手杀进度条", 2: "十周年PC端进度条", 3: "十周年客户端进度条", 4: "一将成名进度条" },
		update() {
			if (window.timer) {
				clearInterval(window.timer);
				delete window.timer;
			}
			if (window.timer2) {
				clearInterval(window.timer2);
				delete window.timer2;
			}
			document.getElementById("jindutiaopl")?.remove();
			window.resetProgressBarState?.();
		},
	},

	jindutiaoST: {
		name: "进度条速度",
		init: "200",
		intro: "设置玩家进度条的时间间隔",
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
		onblur() {
			const value = parseInputValue(this, 22, 0, 100);
			game.saveConfig("extension_十周年UI_jindutiaoSet", value);
			const progressBar = document.getElementById("jindutiaopl");
			if (progressBar) progressBar.style.bottom = `${value}%`;
		},
		update() {
			const height = lib.config.extension_十周年UI_jindutiaoSet ?? "22";
			const progressBar = document.getElementById("jindutiaopl");
			if (progressBar) progressBar.style.bottom = `${height}%`;
		},
	},

	JDTSYangshi: {
		name: "阶段提示",
		init: "0",
		intro: "切换阶段提示样式",
		item: { 0: "关闭", 1: "手杀阶段提示", 2: "十周年阶段提示", 3: "OL阶段提示", 4: "欢乐阶段提示" },
		update() {
			if (lib.config.extension_十周年UI_JDTSYangshi === "0") {
				game.as_removeImage?.();
				delete _status.as_showImage_phase;
			}
		},
	},

	GTBBYangshi: {
		name: "狗托播报",
		init: "0",
		intro: "开启后，顶部会出现滚动播报栏",
		item: { 0: "关闭", 1: "手杀", 2: "十周年" },
		onclick(item) {
			const oldValue = lib.config.extension_十周年UI_GTBBYangshi;
			game.saveConfig("extension_十周年UI_GTBBYangshi", item);

			if (window._gtbbCheckId) {
				clearInterval(window._gtbbCheckId);
				delete window._gtbbCheckId;
			}
			if (window._gtbbInterval) {
				clearInterval(window._gtbbInterval);
				delete window._gtbbInterval;
			}
			document.getElementById("gtbb-container")?.remove();

			if (item !== "0" && oldValue === "0") {
				import("./ui/gtbb.js").then(module => module.initGTBB());
			} else if (item !== "0") {
				import("./ui/gtbb.js").then(module => module.initGTBB());
			}
		},
	},

	GTBBFont: {
		name: "播报字体",
		init: "on",
		intro: "切换狗托播报字体（即时生效）",
		item: { on: '<font face="shousha">手杀', off: '<font face="yuanli">十周年' },
	},

	GTBBTime: {
		name: "时间间隔",
		init: "60000",
		intro: "更改狗托播报出现的时间间隔",
		item: { 30000: "0.5min/次", 60000: "1min/次", 120000: "2min/次", 300000: "5min/次" },
	},

	playerMarkStyle: {
		name: "标记样式",
		init: "decade",
		item: { red: "红灯笼", yellow: "黄灯笼", decade: "十周年" },
		update() {
			if (window.decadeUI) ui.arena.dataset.playerMarkStyle = lib.config.extension_十周年UI_playerMarkStyle;
		},
	},

	loadingStyle: {
		name: "更换光标+loading框",
		intro: "可以更换局内选项框以及光标",
		init: "off",
		item: {
			off: "关闭",
			on: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/image/ui/dialog/dialog2.png);background-size: 100% 100%;"></div>`,
			On: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/image/ui/dialog/dialog1.png);background-size: 100% 100%;"></div>`,
			othersOn: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/image/ui/dialog/dialog3.png);background-size: 100% 100%;"></div>`,
			othersOff: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/image/ui/dialog/dialog4.png);background-size: 100% 100%;"></div>`,
			onlineUI: `<div style="width:60px;height:40px;position:relative;background-image: url(${lib.assetURL}extension/十周年UI/image/ui/dialog/dialog5.png);background-size: 100% 100%;"></div>`,
		},
		update() {
			if (window.decadeUI) ui.arena.dataset.loadingStyle = lib.config.extension_十周年UI_loadingStyle;
		},
	},

	gainSkillsVisible: {
		name: "获得技能显示",
		init: "othersOn",
		item: { on: "显示", off: "不显示", othersOn: "显示他人" },
		update() {
			if (window.decadeUI) ui.arena.dataset.gainSkillsVisible = lib.config.extension_十周年UI_gainSkillsVisible;
		},
	},

	component_title_end: { clear: true, name: "<span id='component_title_end'></span>" },

	// 小小玩楞
	stuff_title: {
		clear: true,
		name: `<span style='color:orange'><font size='4'>小小玩楞（点击折叠）▽</font></span>`,
		onclick() {
			colMenu.call(this, "stuff_title", "小小玩楞", "orange");
		},
	},

	bettersound: {
		name: "更多音效",
		intro: "开启后，点击卡牌或按钮和出牌弃牌会有音效播放",
		init: true,
	},

	skillDieAudio: {
		name: "中二模式",
		intro: "众所周知，使用技能前需要吟唱。",
		init: true,
	},

	wujiangbeijing: {
		name: "武将背景",
		init: true,
		intro: "开启后，单双将和国战模式将用设置好的武将背景",
	},

	shiliyouhua: {
		name: "官方势力",
		init: true,
		intro: "开启后，非魏蜀吴群晋势力的角色将会重新选择势力",
	},

	mx_decade_characterDialog: {
		name: "自由选将筛选框",
		init: "extension-OL-system",
		intro: "更改自由选将筛选框",
		item: { default: "默认本体框", "extension-OL-system": "扩展内置框", offDialog: "关闭筛选框" },
	},

	stuff_title_end: { clear: true, name: "<span id='stuff_title_end'></span>" },
};

export { cardSkinPresets, cardSkinMeta };
