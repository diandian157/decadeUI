/**
 * @fileoverview Player装备显示覆写模块
 * @description 处理装备栏美化显示，包括不同风格的装备背景和名称显示
 * @module overrides/player/equipment
 */

import { lib, game, get, _status } from "noname";
import { getBasePlayerMethods } from "./base.js";

/**
 * 动态加载装备栏样式文件
 * 根据 aloneEquip 配置决定加载 equipment.css 或 equip.css
 */
function loadEquipmentStyles() {
	if (typeof window.decadeUIPath === "undefined") {
		console.warn("[十周年UI] decadeUIPath 尚未定义，延迟加载样式");
		setTimeout(loadEquipmentStyles, 100);
		return;
	}

	const isAloneEquip = lib.config["extension_十周年UI_aloneEquip"];
	const version = lib.extensionPack?.十周年UI?.version || Date.now();

	const cssPath = isAloneEquip ? `${window.decadeUIPath}src/overrides/player/equipment.css` : `${window.decadeUIPath}src/styles/equip.css`;

	const basePath = cssPath.split("?")[0];
	if (document.querySelector(`link[href*="${basePath}"]`)) return;

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `${cssPath}?v=${version}&t=${Date.now()}`;
	document.head.appendChild(link);
}

loadEquipmentStyles();

/**
 * @description 美化装备栏显示，支持多种UI风格。当开启单独装备栏时不生效
 * @param {Object} card - 卡牌对象
 * @param {Array} cards - 原始卡牌数组
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerAddVirtualEquip(card, cards) {
	if (lib.config["extension_十周年UI_aloneEquip"]) {
		const base = getBasePlayerMethods();
		if (base?.$addVirtualEquip) {
			return base.$addVirtualEquip.apply(this, arguments);
		}
		return;
	}

	const player = this;
	const isViewAsCard = cards.length !== 1 || cards[0].name !== card.name;
	const info = get.info(card, false);
	let cardShownName = get.translation(card.name);
	const type = info.type;
	const subtype = get.subtypes(card)[0];

	const styleEquip = lib.config["extension_十周年UI_newDecadeStyle"];

	/**
	 * 获取装备图片名称
	 * @param {Object} card - 卡牌对象
	 * @param {string} type - 卡牌类型
	 * @param {string} subtype - 卡牌子类型
	 * @returns {string} 图片名称
	 */
	function getEquipImageName(card, type, subtype) {
		if (type !== "equip") return "equip5";
		if (card.name === "liulongcanjia") return "liulongcanjia";
		return subtype;
	}

	let backgroundURL;
	const basePath = decadeUIPath + "/image/ui/equip/";

	if (styleEquip === "onlineUI") {
		backgroundURL = basePath + "online/" + getEquipImageName(card, type, subtype) + ".png";
	} else if (styleEquip === "off") {
		backgroundURL = basePath + "mobile/" + getEquipImageName(card, type, subtype) + ".png";
	} else {
		backgroundURL = basePath + "decade/" + getEquipImageName(card, type, subtype) + ".png";
	}

	const SSEquip =
		lib.config["extension_十周年UI_newDecadeStyle"] === "onlineUI"
			? {
					爪黄飞电: "爪黄&nbsp;&nbsp;+1",
					大宛: "大宛&nbsp;&nbsp;-1",
					绝影: "绝影&nbsp;&nbsp;+1",
					赤兔: "赤兔&nbsp;&nbsp;-1",
					骅骝: "骅骝&nbsp;&nbsp;+1",
					紫骍: "紫骍&nbsp;&nbsp;-1",
					的卢: "的卢&nbsp;&nbsp;+1",
					吴六剑: "吴六剑&nbsp;2",
					机关弩: "机关弩&nbsp;1",
					雌雄双股剑: "雌雄剑&nbsp;2",
					方天画戟: "方天戟&nbsp;4",
					贯石斧: "贯石斧&nbsp;3",
					寒冰剑: "寒冰剑&nbsp;2",
					麒麟弓: "麒麟弓&nbsp;5",
					青釭剑: "青釭剑&nbsp;2",
					青龙偃月刀: "青龙刀&nbsp;3",
					丈八蛇矛: "丈八矛&nbsp;3",
					古锭刀: "古锭刀&nbsp;2",
					朱雀羽扇: "朱雀扇&nbsp;4",
					七宝刀: "七宝刀&nbsp;2",
					银月枪: "银月枪&nbsp;3",
					衠钢槊: "衠钢槊&nbsp;3",
					飞龙夺凤: "飞龙刀&nbsp;2",
					三尖两刃刀: "三尖刀&nbsp;3",
					诸葛连弩: "諸葛弩&nbsp;1",
					倚天剑: "倚天剑&nbsp;2",
					七星宝刀: "七星刀&nbsp;2",
					折戟: "折戟&nbsp;&nbsp;0",
					无锋剑: "无锋剑&nbsp;1",
					涯角枪: "涯角枪&nbsp;3",
					五行鹤翎扇: "五行扇&nbsp;4",
					断剑: "断剑&nbsp;&nbsp;0",
					霹雳车: "霹雳车&nbsp;9",
					水波剑: "水波剑&nbsp;2",
					红缎枪: "红缎枪&nbsp;3",
					天雷刃: "天雷刃&nbsp;4",
					混毒弯匕: "混毒匕&nbsp;1",
					元戎精械弩: "精械弩&nbsp;3",
					乌铁锁链: "铁锁链&nbsp;3",
					太极拂尘: "太极拂&nbsp;5",
					灵宝仙壶: "灵宝壶&nbsp;3",
					冲应神符: "冲应符",
					先天八卦阵: "先天八卦",
					照月狮子盔: "狮子盔",
					白银狮子: "银狮子",
					仁王金刚盾: "金剛盾",
					桐油百韧甲: "百韧甲",
					定澜夜明珠: "夜明珠",
					霹雳投石车: "霹雳车∞",
				}
			: {};

	if (SSEquip[cardShownName]) cardShownName = SSEquip[cardShownName];

	const cardx = isViewAsCard ? game.createCard(card) : cards[0];
	cardx.fix();
	const cardSymbol = Symbol("card");
	cardx.cardSymbol = cardSymbol;
	cardx[cardSymbol] = card;
	if (card.subtypes) cardx.subtypes = card.subtypes;
	cardx.style.transform = "";
	cardx.classList.remove("drawinghidden");
	delete cardx._transform;

	const suitfont = get.translation(cardx.suit);
	const number = get.strNumber(cardx.number);

	const imgStyle = `opacity:1;height:90%;margin-left:${styleEquip === "on" ? "1" : "2"}px;margin-top:0px;position:absolute;`;

	if (styleEquip === "onlineUI" || styleEquip === "off") {
		const styleEquipColor = styleEquip === "onlineUI" ? "white" : "black";
		const styleEquipSuitNumber = styleEquip === "onlineUI" ? "0.5" : "2";
		const styleEquipNumber = styleEquip === "onlineUI" ? "1" : "2";
		const styleEquipName = styleEquip === "onlineUI" ? "0" : "2";

		cardx.node.name2.innerHTML = `
			<img src="${backgroundURL}" style="${imgStyle}">
			<span style="font-size:14px;margin-left:18px;margin-top:1px;-webkit-text-stroke: ${styleEquipSuitNumber}px ${styleEquipColor};paint-order: stroke fill;">${suitfont}</span>
			<span style="font-size:15px;font-weight:700;-webkit-text-stroke: ${styleEquipNumber}px ${styleEquipColor};paint-order: stroke fill;margin-left:0px;">${number}</span>
			<span style="color:white;-webkit-text-stroke: ${styleEquipName}px ${styleEquipColor};paint-order: stroke fill;margin-top:1px;">${cardShownName}</span>`;
	} else {
		cardx.node.name2.innerHTML = `
			<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
				<img src="${backgroundURL}" style="${imgStyle}">
				<span style="flex:0.8;min-width:0;color:#392418;text-align:center;transform:translateX(16px);">${cardShownName}</span>
				<span style="display:flex;align-items:center;white-space:nowrap;">
					<span style="font-size:14px;font-weight:500;-webkit-text-stroke:0.5px white;paint-order: stroke fill;margin-bottom:-2px;margin-right:-2px;">${number}</span>
					<span style="font-size:14px;-webkit-text-stroke:0.5px white;paint-order: stroke fill;margin-bottom:-2px;margin-right:2px;">${suitfont}</span>
				</span>
			</div>`;
	}

	if (isViewAsCard) {
		cardx.cards = cards || [];
		cardx.viewAs = card.name;
		cardx.classList.add("fakeequip");
	} else {
		delete cardx.viewAs;
		cardx.classList.remove("fakeequip");
	}

	let equipped = false;
	const equipNum = get.equipNum(cardx);

	if (player.node.equips.childNodes.length) {
		for (let i = 0; i < player.node.equips.childNodes.length; i++) {
			if (get.equipNum(player.node.equips.childNodes[i]) >= equipNum) {
				equipped = true;
				player.node.equips.insertBefore(cardx, player.node.equips.childNodes[i]);
				break;
			}
		}
	}

	if (equipped === false) {
		player.node.equips.appendChild(cardx);
		if (cards?.length && _status.discarded) _status.discarded.removeArray(cards);
	}
}
