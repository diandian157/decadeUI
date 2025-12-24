"use strict";

/**
 * 装备牌手牌化模块
 * 功能：将装备区的牌复制到手牌区显示，支持两种模式：
 * 1. 手牌化模式：装备牌复制到手牌区参与选择
 * 2. 独立装备模式：装备牌保持在装备区，可直接点击发动技能
 */

import { lib, game, ui, get, _status } from "noname";

// ==================== 工具函数 ====================

/** 创建装备牌的副本卡牌 */
function createEquipCardCopy(originalCard) {
	const card = ui.create.card(ui.special);
	card.init([originalCard.suit, originalCard.number, originalCard.name, originalCard.nature]);
	card.cardid = originalCard.cardid;
	card.wunature = originalCard.wunature;
	card.storage = originalCard.storage;
	card.relatedCard = originalCard;
	card.owner = get.owner(originalCard);

	// 监听选中状态变化，同步到原始卡牌
	const observer = new MutationObserver(mutations => {
		if (get.position(card) !== "s" || !card.hasGaintag("equipHand")) return;
		for (const m of mutations) {
			if (m.attributeName !== "class") continue;
			ui.selected.cards.remove(card);
			const isSelected = card.classList.contains("selected");
			card.updateTransform(isSelected, 0);
			card.relatedCard.classList.toggle("selected", isSelected);
			if (isSelected) {
				ui.selected.cards.add(card.relatedCard);
			} else {
				ui.selected.cards.remove(card.relatedCard);
			}
		}
	});
	observer.observe(card, { attributes: true, attributeFilter: ["class"] });
	return card;
}

/** 创建过滤器函数，排除装备区和无效的特殊区卡牌 */
function createFilterCard(originalFilter, includeS) {
	return (card, player, target) => {
		const relatedCard = card.relatedCard || card;
		if (get.position(card) === "e") return false;
		if (includeS && get.position(card) === "s" && get.itemtype(card) === "card" && !card.hasGaintag("equipHand")) {
			return false;
		}
		return originalFilter(relatedCard, player, target);
	};
}

/** 处理卡牌选择逻辑 */
function processCardSelection(event, player, cardx, cardxF, cardxF2) {
	const hasFilter = !!event.filterCard;
	const isMultiSelect = typeof event.selectCard === "object" || event.selectCard > 1;

	if (hasFilter && isMultiSelect) {
		cardxF2.addArray(cardxF);
		const validCards = player.getCards("he", j => {
			const relatedCard = j.relatedCard || j;
			return event.position.includes(get.position(relatedCard)) && event.filterCard(relatedCard, player, event.target);
		});

		for (const cardF of validCards) {
			ui.selected.cards = ui.selected.cards || [];
			ui.selected.cards.add(cardF);
			cardxF2.addArray(
				cardx.filter(j => {
					if (cardxF2.includes(j)) return false;
					const relatedCard = j.relatedCard || j;
					return event.position.includes(get.position(relatedCard)) && event.filterCard(relatedCard, player, event.target);
				})
			);
			ui.selected.cards.remove(cardF);
		}
	}

	const cardsToGive = isMultiSelect ? cardxF2 : hasFilter ? cardxF : cardx;
	if (cardsToGive.length) {
		player.directgains(cardsToGive, null, "equipHand");
	}
}

/** 设置卡牌样式，添加装备标识 */
function setupCardStyles(cards) {
	cards.forEach(card => {
		card.node.gaintag.classList.remove("gaintag", "info");
		card.node.gaintag.innerHTML = '<div class="epclick"></div>';
	});
}

/** 卡牌排序 */
function sortCards(cards) {
	cards.sort((b, a) => {
		if (a.name !== b.name) return lib.sort.card(a.name, b.name);
		if (a.suit !== b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
		return a.number - b.number;
	});
}

/** 清理装备副本卡牌 */
function cleanupEquipCards(event, player) {
	const cards = event.result?.cards;
	if (cards) {
		cards.forEach((card, index) => {
			if (card.hasGaintag("equipHand")) {
				const originalCard = player.getCards("e", c => c.cardid === card.cardid)[0];
				if (originalCard) cards[index] = originalCard;
			}
		});
	}

	if (player) {
		player
			.getCards("s", card => card.hasGaintag("equipHand"))
			.forEach(card => {
				card.discard();
				card.delete();
			});
	}

	event.copyCards = false;
	if (player === game.me) ui.updatehl();
}

// ==================== 独立装备模式 ====================

/** 获取装备牌可用的技能列表 */
function getEquipUsableSkills(event, player) {
	if (!event._skillChoice) return [];
	const ownedlist = game.expandSkills(player.getSkills("invisible", false));
	return event._skillChoice.filter(skill => !ownedlist.includes(skill) && !lib.skill.global.includes(skill));
}

/** 获取卡牌附带的技能 */
function getCardSkills(card) {
	const info = get.info(card);
	return info?.skills ? game.expandSkills(info.skills.slice()) : [];
}

/** 处理装备技能点击 */
function handleEquipClick(skill) {
	clearEquipSelectable();
	ui.click.skill(skill);
	if (lib.skill[skill]?.chooseButton && game.check()) {
		ui.click.ok();
	}
}

/** 显示技能选择弹窗 */
function showSkillSelector(skills) {
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
			handleEquipClick(this.link);
		});
	}

	dialog.forcebutton = true;
	dialog.classList.add("forcebutton");
	dialog.open();
}

/** 清除装备牌的可选状态 */
function clearEquipSelectable() {
	if (!game.me) return;
	for (const card of game.me.getCards("e")) {
		if (!card.classList.contains("selected")) {
			card.classList.remove("selectable");
		}
		card.classList.remove("equip-card-selectable");
		delete card._equipSkills;
	}
}

/** 设置装备牌的可选状态（用于弃牌等操作） */
function setupEquipCardSelection(event, player) {
	if (!event.position || typeof event.position !== "string" || !event.position.includes("e")) return;
	if (event.filterCard && ui.selected.cards.length >= get.select(event.selectCard)[1]) return;
	const equipCards = player.getCards("e");
	for (const card of equipCards) {
		if (event.filterCard?.(card, player, event.target)) {
			if (!card.classList.contains("selected")) card.classList.add("selectable");
			card.classList.add("equip-card-selectable");
		}
	}
}

// ==================== 初始化 ====================

/** 初始化装备手牌化模块 */
export function setupEquipHand() {
	// 修改"全选"按钮
	ui.create.cardChooseAll = function () {
		const event = get.event();
		if (!event.isMine() || !event.allowChooseAll || event.complexCard || event.complexSelect || !lib.config.choose_all_button) {
			return null;
		}

		const range = get.select(event.selectCard);
		if (range[1] <= 1) return null;

		return (event.cardChooseAll = ui.create.control("全选", () => {
			const event2 = get.event();
			const player = event2.player;

			const selecteds = [...ui.selected.cards].map(card => player.getCards("s", i => i.relatedCard === card)[0] || card);
			ui.selected.cards.length = 0;
			game.check();

			let selectables = get.selectableCards();
			if (lib.config["extension_十周年UI_aloneEquip"]) {
				const equipSelectables = player.getCards("e").filter(card => card.classList.contains("selectable") && card.classList.contains("equip-card-selectable"));
				selectables = selectables.concat(equipSelectables);
			}

			const cards = selecteds.length ? [...new Set(selectables).difference(selecteds)] : selectables;
			if (cards.length <= range[1]) {
				ui.selected.cards.push(...cards);
			} else {
				ui.selected.cards.push(...cards.randomGets(range[1]));
			}

			for (const card of ui.selected.cards) {
				card.classList.add("selected");
				card.updateTransform(true, 0);
			}
			for (const card of selecteds) {
				card.classList.remove("selected");
				card.updateTransform(false, 0);
			}

			game.check();
			if (typeof event2.custom?.add?.card === "function") {
				_status.event.custom.add.card();
			}
		}));
	};

	// 重写卡牌点击事件
	const _originalClickCard = ui.click.card;
	ui.click.card = function () {
		if (lib.config["extension_十周年UI_aloneEquip"] && this._equipSkills?.length && this.classList.contains("selectable") && get.position(this) === "e") {
			_status.clicked = true;
			if (this._equipSkills.length === 1) {
				handleEquipClick(this._equipSkills[0]);
			} else {
				showSkillSelector(this._equipSkills);
			}
			return;
		}
		return _originalClickCard.apply(this, arguments);
	};

	// 选择开始时：创建装备副本
	lib.hooks.checkBegin.add(async event => {
		if (lib.config["extension_十周年UI_aloneEquip"]) return;

		const player = event.player;
		const validEvents = ["chooseCard", "chooseToUse", "chooseToRespond", "chooseToDiscard", "chooseCardTarget", "chooseToGive"];
		const isValidEvent = event.position?.includes("e") && player.countCards("e") && !event.copyCards && validEvents.includes(event.name);

		if (!isValidEvent) return;

		event.copyCards = true;
		const includeS = !event.position.includes("s");
		if (includeS) event.position += "s";

		let eventFilterCard;
		if (event.filterCard) {
			eventFilterCard = createFilterCard(event.filterCard, includeS);
		}

		const originalCards = player.getCards("e");
		const cardx = originalCards.map(createEquipCardCopy);

		let cardxF = [];
		let cardxF2 = [];
		if (event.filterCard) {
			cardxF = cardx.filter(card => {
				const relatedCard = card.relatedCard || card;
				return event.filterCard(relatedCard, player, event.target);
			});
		}

		processCardSelection(event, player, cardx, cardxF, cardxF2);
		if (eventFilterCard) event.filterCard = eventFilterCard;

		const allCards = [...cardx, ...cardxF, ...cardxF2];
		setupCardStyles(allCards);
		sortCards(cardx);
	});

	// 检查卡牌时：同步选中状态
	lib.hooks.checkCard.add((card, event) => {
		if (lib.config["extension_十周年UI_aloneEquip"] || !event.copyCards) return;

		if (get.position(card) === "e" && card.classList.contains("selected")) {
			const equipHandCopy = event.player.getCards("s", c => c.hasGaintag("equipHand") && c.relatedCard === card)[0];
			if (equipHandCopy && !equipHandCopy.classList.contains("selected")) {
				card.classList.remove("selected");
				ui.selected.cards.remove(card);
			}
		}
	});

	// 检查结束时：处理装备牌状态
	lib.hooks.checkEnd.add(function (event) {
		if (!lib.config["extension_十周年UI_aloneEquip"] && event.copyCards) {
			const player = event.player;
			for (const equipCard of player.getCards("e")) {
				if (equipCard.classList.contains("selected")) {
					const equipHandCopy = player.getCards("s", c => c.hasGaintag("equipHand") && c.relatedCard === equipCard)[0];
					if (equipHandCopy && !equipHandCopy.classList.contains("selected")) {
						equipCard.classList.remove("selected");
						ui.selected.cards.remove(equipCard);
					}
				}
			}
			return;
		}

		if (!lib.config["extension_十周年UI_aloneEquip"]) return;

		const player = event.player;
		if (player !== game.me || !event.isMine?.()) return;

		const equipCards = player.getCards("e");
		if (!equipCards.length) return;

		if (event.skill) {
			clearEquipSelectable();
			setupEquipCardSelection(event, player);
			return;
		}

		if (!get.noSelected()) {
			clearEquipSelectable();
			setupEquipCardSelection(event, player);
			return;
		}

		clearEquipSelectable();
		setupEquipCardSelection(event, player);

		const usableSkills = getEquipUsableSkills(event, player);
		if (!usableSkills.length) {
			clearEquipSelectable();
			return;
		}

		if (!usableSkills.length) return;
		for (const card of equipCards) {
			const cardSkills = getCardSkills(card);
			const matchedSkills = cardSkills.filter(s => usableSkills.includes(s));

			if (matchedSkills.length) {
				card.classList.add("selectable");
				card._equipSkills = matchedSkills;
			}
		}
	});

	// 取消选择时：清理资源
	lib.hooks.uncheckBegin.add(async (event, args) => {
		const player = event.player;
		const validEvents = ["chooseToUse", "chooseToRespond"];
		const shouldCleanup = args.includes("card") && event.copyCards && (event.result || (validEvents.includes(event.name) && !event.skill && !event.result));

		if (lib.config["extension_十周年UI_aloneEquip"] || shouldCleanup) {
			cleanupEquipCards(event, player);
		}
	});

	// 独立装备模式：清理弹窗和状态
	lib.hooks.uncheckBegin.add(function () {
		if (!lib.config["extension_十周年UI_aloneEquip"]) return;

		if (ui._equipSkillDialog) {
			ui._equipSkillDialog.close();
			delete ui._equipSkillDialog;
		}
		clearEquipSelectable();
	});
}
