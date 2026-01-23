"use strict";

/**
 * @fileoverview 独立装备模式
 * 装备牌可直接点击发动技能
 * 适配虚拟装备和武将牌装备
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @param {string} skill */
const isEquipSkill = skill => lib.skill[skill]?.equipSkill === true;

/** @param {string} skill */
const getSourceSkill = skill => lib.skill[skill]?.sourceSkill;

/** @param {import("noname").Player} player */
const getEquipNodes = player => (player?.node?.equips ? Array.from(player.node.equips.childNodes) : []);

/**
 * @param {string} cardName
 * @returns {string[]}
 */
function getCardSkills(cardName) {
	const info = lib.card[cardName];
	return info?.skills ? game.expandSkills(info.skills.slice()) : [];
}

/**
 * 获取所有装备区卡牌的技能集合
 * @param {import("noname").Player} player
 * @returns {Set<string>}
 */
function getAllEquipCardSkills(player) {
	const skills = new Set();
	for (const card of player.getCards("e")) {
		for (const s of getCardSkills(card.name)) {
			skills.add(s);
		}
	}
	return skills;
}

/**
 * 获取可用的装备相关技能
 * @param {import("noname").GameEvent} event
 * @param {import("noname").Player} player
 * @returns {string[]}
 */
function getUsableEquipSkills(event, player) {
	if (!event._skillChoice) return [];
	const equipCardSkills = getAllEquipCardSkills(player);
	return event._skillChoice.filter(s => isEquipSkill(s) || equipCardSkills.has(s));
}

/**
 * 匹配虚拟装备的可用技能
 * @param {[string, string, Function?]} extraEquipInfo - [sourceSkill, equipName, preserve]
 * @param {string[]} usableSkills
 * @returns {string[]}
 */
function matchExtraEquipSkills(extraEquipInfo, usableSkills) {
	if (!extraEquipInfo || !Array.isArray(extraEquipInfo) || extraEquipInfo.length === 0) return [];
	const [sourceSkill, equipName] = extraEquipInfo;

	// 优先通过 sourceSkill 匹配
	if (sourceSkill) {
		const bySource = usableSkills.filter(s => getSourceSkill(s) === sourceSkill);
		if (bySource.length) return bySource;
	}

	// 如果 sourceSkill 不存在或没匹配到，尝试通过 equipName 匹配
	return equipName ? getCardSkills(equipName).filter(s => usableSkills.includes(s)) : [];
}

/**
 * 匹配真实装备的可用技能
 * @param {import("noname").Card} card
 * @param {string[]} usableSkills
 * @returns {string[]}
 */
function matchRealEquipSkills(card, usableSkills) {
	return getCardSkills(card.name).filter(s => usableSkills.includes(s));
}

/** @param {string} skill */
function handleClick(skill) {
	clearSelectable();
	ui.click.skill(skill);
}

/**
 * 多技能选择弹窗
 * @param {string[]} skills
 */
function showSelector(skills) {
	if (ui._equipSkillDialog) {
		ui._equipSkillDialog.close();
		delete ui._equipSkillDialog;
	}

	const dialog = ui.create.dialog("选择要发动的技能", "hidden");
	ui._equipSkillDialog = dialog;

	const eventType = lib.config.touchscreen ? "touchend" : "click";
	for (const skill of skills) {
		const item = dialog.add(`<div class="popup text pointerdiv" style="width:calc(100% - 10px);display:inline-block">${get.skillTranslation(skill, game.me, true)}</div>`);
		item.firstChild.link = skill;
		item.firstChild.addEventListener(eventType, function (ev) {
			ev.stopPropagation();
			dialog.close();
			delete ui._equipSkillDialog;
			handleClick(this.link);
		});
	}

	dialog.forcebutton = true;
	dialog.classList.add("forcebutton");
	dialog.open();
}

/** 清除装备可选状态 */
function clearSelectable() {
	if (!game.me) return;
	for (const node of getEquipNodes(game.me)) {
		if (!node.classList.contains("selected")) {
			node.classList.remove("selectable");
		}
		node.classList.remove("equip-card-selectable");
		delete node._equipSkills;
	}
}

/**
 * 设置弃牌时的装备可选状态
 * @param {import("noname").GameEvent} event
 * @param {import("noname").Player} player
 */
function setupDiscardSelection(event, player) {
	const pos = event?.position;
	if (typeof pos !== "string" || !pos.includes("e")) return;
	if (ui.selected.cards.length >= get.select(event.selectCard)[1]) return;

	for (const card of player.getCards("e")) {
		if (event.filterCard?.(card, player, event)) {
			if (!card.classList.contains("selected")) card.classList.add("selectable");
			card.classList.add("equip-card-selectable");
		}
	}
}

/**
 * 为装备区绑定技能
 * @param {import("noname").Player} player
 * @param {string[]} usableSkills
 */
function bindEquipSkills(player, usableSkills) {
	for (const node of getEquipNodes(player)) {
		let matched = [];

		if (node.extraEquip) {
			matched = matchExtraEquipSkills(node.extraEquip, usableSkills);
		} else if (get.position(node) === "e") {
			matched = matchRealEquipSkills(node, usableSkills);
		}

		if (matched.length) {
			node.classList.add("selectable");
			node._equipSkills = matched;
		}
	}
}

/** 初始化独立装备模式 */
export function setupEquipAlone() {
	const originalClick = ui.click.card;

	ui.click.card = function () {
		const enabled = lib.config["extension_十周年UI_aloneEquip"];
		const hasSkills = this._equipSkills?.length;
		const isSelectable = this.classList.contains("selectable");
		const isEquip = get.position(this) === "e" || this.extraEquip;

		if (enabled && hasSkills && isSelectable && isEquip) {
			_status.clicked = true;
			_status.touchnocheck = false;
			_status.mousedown = false;

			if (this._equipSkills.length === 1) {
				handleClick(this._equipSkills[0]);
			} else {
				showSelector(this._equipSkills);
			}
			return;
		}
		return originalClick.apply(this, arguments);
	};

	lib.hooks.checkEnd.add(event => {
		if (!lib.config["extension_十周年UI_aloneEquip"]) return;

		const player = event.player;
		if (player !== game.me || !event.isMine?.() || _status.auto) return;

		clearSelectable();
		setupDiscardSelection(event, player);

		const usable = getUsableEquipSkills(event, player);
		if (!usable.length) return;

		bindEquipSkills(player, usable);
	});

	lib.hooks.uncheckBegin.add(() => {
		if (!lib.config["extension_十周年UI_aloneEquip"]) return;

		if (ui._equipSkillDialog) {
			ui._equipSkillDialog.close();
			delete ui._equipSkillDialog;
		}
		clearSelectable();
	});
}

export { clearSelectable as clearEquipSelectable };
