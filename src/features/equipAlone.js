/**
 * 独立装备模式 - 装备牌可直接点击发动技能
 */

import { lib, game, ui, get, _status } from "noname";
import { wrapAround } from "../utils/safeOverride.js";

const isEquipSkill = skill => lib.skill[skill]?.equipSkill === true;
const getSourceSkill = skill => lib.skill[skill]?.sourceSkill;
const getEquipNodes = player => (player?.node?.equips ? Array.from(player.node.equips.childNodes) : []);

const equipSkillDialogs = new WeakMap();

/**
 * 获取卡牌技能列表
 * @param {string} cardName
 * @returns {string[]}
 */
function getCardSkills(cardName) {
	const info = lib.card[cardName];
	return info?.skills ? game.expandSkills(info.skills.slice()) : [];
}

/**
 * 获取所有装备区卡牌的技能集合
 * @param {Player} player
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
 * @param {GameEvent} event
 * @param {Player} player
 * @returns {string[]}
 */
function getUsableEquipSkills(event, player) {
	if (!event._skillChoice) return [];
	const equipCardSkills = getAllEquipCardSkills(player);
	return event._skillChoice.filter(s => isEquipSkill(s) || equipCardSkills.has(s));
}

/**
 * 匹配装备的可用技能
 * @param {Card} card
 * @param {string[]} usableSkills
 * @returns {string[]}
 */
function matchEquipSkills(card, usableSkills) {
	if (card.extraEquip && Array.isArray(card.extraEquip)) {
		const [sourceSkill, equipName] = card.extraEquip;

		if (sourceSkill) {
			const bySource = usableSkills.filter(s => getSourceSkill(s) === sourceSkill);
			if (bySource.length) return bySource;
		}

		if (equipName) {
			return getCardSkills(equipName).filter(s => usableSkills.includes(s));
		}
		return [];
	}

	if (get.position(card) === "e") {
		return getCardSkills(card.name).filter(s => usableSkills.includes(s));
	}

	return [];
}

/**
 * 处理技能点击
 * @param {string} skill
 */
function handleClick(skill) {
	clearSelectable();
	ui.click.skill(skill);
}

/**
 * 多技能选择弹窗
 * @param {string[]} skills
 * @param {Player} player
 */
function showSelector(skills, player) {
	const existingDialog = equipSkillDialogs.get(player);
	if (existingDialog) {
		existingDialog.close();
		equipSkillDialogs.delete(player);
	}

	const dialog = ui.create.dialog("选择要发动的技能", "hidden");
	equipSkillDialogs.set(player, dialog);

	const eventType = lib.config.touchscreen ? "touchend" : "click";
	for (const skill of skills) {
		const item = dialog.add(
			`<div class="popup text pointerdiv" style="width:calc(100% - 10px);display:inline-block">${get.skillTranslation(skill, player, true)}</div>`
		);
		item.firstChild.link = skill;
		item.firstChild.addEventListener(eventType, function (ev) {
			ev.stopPropagation();
			dialog.close();
			equipSkillDialogs.delete(player);
			handleClick(this.link);
		});
	}

	dialog.forcebutton = true;
	dialog.classList.add("forcebutton");
	dialog.open();
}

/**
 * 清除装备可选状态
 */
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
 * @param {GameEvent} event
 * @param {Player} player
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
 * @param {Player} player
 * @param {string[]} usableSkills
 */
function bindEquipSkills(player, usableSkills) {
	for (const node of getEquipNodes(player)) {
		const matched = matchEquipSkills(node, usableSkills);
		if (matched.length) {
			node.classList.add("selectable");
			node._equipSkills = matched;
		}
	}
}

/**
 * 初始化独立装备模式
 */
export function setupEquipAlone() {
	wrapAround(ui.click, "card", function (original, ...args) {
		const card = this;
		const enabled = lib.config["extension_十周年UI_aloneEquip"];
		const hasSkills = card._equipSkills?.length;
		const isSelectable = card.classList.contains("selectable");
		const isEquip = get.position(card) === "e" || card.extraEquip;

		if (enabled && hasSkills && isSelectable && isEquip) {
			_status.clicked = true;
			_status.touchnocheck = false;
			_status.mousedown = false;

			if (card._equipSkills.length === 1) {
				handleClick(card._equipSkills[0]);
			} else {
				showSelector(card._equipSkills, game.me);
			}
			return;
		}

		return original.apply(this, args);
	});

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

		if (game.me) {
			const dialog = equipSkillDialogs.get(game.me);
			if (dialog) {
				dialog.close();
				equipSkillDialogs.delete(game.me);
			}
		}
		clearSelectable();
	});
}

export { clearSelectable as clearEquipSelectable };
