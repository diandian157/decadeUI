"use strict";

/**
 * 独立装备模式
 * 装备牌保持在装备区，可直接点击发动技能
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** 获取装备牌可用技能 */
function getUsableSkills(event, player) {
	if (!event._skillChoice) return [];
	const owned = game.expandSkills(player.getSkills("invisible", false));
	return event._skillChoice.filter(s => !owned.includes(s) && !lib.skill.global.includes(s));
}

/** 获取卡牌附带技能 */
function getCardSkills(card) {
	const info = get.info(card);
	return info?.skills ? game.expandSkills(info.skills.slice()) : [];
}

/** 处理装备技能点击 */
function handleClick(skill) {
	clearSelectable();
	ui.click.skill(skill);
	// chooseButton类技能由ui.click.skill内部处理，不需要额外调用ok
}

/** 显示技能选择弹窗 */
function showSelector(skills) {
	if (ui._equipSkillDialog) {
		ui._equipSkillDialog.close();
		delete ui._equipSkillDialog;
	}

	const dialog = ui.create.dialog("选择要发动的技能", "hidden");
	ui._equipSkillDialog = dialog;

	for (const skill of skills) {
		const item = dialog.add('<div class="popup text pointerdiv" style="width:calc(100% - 10px);display:inline-block">' + get.skillTranslation(skill, game.me, true) + "</div>");
		item.firstChild.link = skill;
		item.firstChild.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (ev) {
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

/** 清除装备牌可选状态 */
function clearSelectable() {
	if (!game.me) return;
	for (const card of game.me.getCards("e")) {
		if (!card.classList.contains("selected")) {
			card.classList.remove("selectable");
		}
		card.classList.remove("equip-card-selectable");
		delete card._equipSkills;
	}
}

/** 设置装备牌可选状态（弃牌等操作） */
function setupSelection(event, player) {
	if (typeof event?.position !== "string" || !event.position.includes("e") || ui.selected.cards.length >= get.select(event.selectCard)[1]) return;

	for (const card of player.getCards("e")) {
		if (event.filterCard?.(card, player, event)) {
			if (!card.classList.contains("selected")) card.classList.add("selectable");
			card.classList.add("equip-card-selectable");
		}
	}
}

/** 初始化独立装备模式 */
export function setupEquipAlone() {
	// 重写卡牌点击事件
	const originalClick = ui.click.card;
	ui.click.card = function () {
		if (lib.config["extension_十周年UI_aloneEquip"] && this._equipSkills?.length && this.classList.contains("selectable") && get.position(this) === "e") {
			_status.clicked = true;
			if (this._equipSkills.length === 1) {
				handleClick(this._equipSkills[0]);
			} else {
				showSelector(this._equipSkills);
			}
			return;
		}
		return originalClick.apply(this, arguments);
	};

	// 检查结束：设置装备牌状态
	lib.hooks.checkEnd.add(event => {
		if (!lib.config["extension_十周年UI_aloneEquip"]) return;

		const player = event.player;
		// 必须是自己的事件，且不是 AI 自动操作
		if (player !== game.me || !event.isMine?.() || _status.auto) return;

		const equips = player.getCards("e");
		if (!equips.length) return;

		clearSelectable();
		setupSelection(event, player);

		const usable = getUsableSkills(event, player);
		if (!usable.length) return;

		for (const card of equips) {
			const matched = getCardSkills(card).filter(s => usable.includes(s));
			if (matched.length) {
				card.classList.add("selectable");
				card._equipSkills = matched;
			}
		}
	});

	// 取消选择：清理弹窗和状态
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
