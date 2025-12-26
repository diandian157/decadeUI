"use strict";

/**
 * 装备牌手牌化模式
 * 将装备区的牌复制到手牌区显示，参与选择
 */

import { lib, game, ui, get, ai, _status } from "noname";

const GAINTAG = "equipHand";

/** 创建装备牌副本 */
function createCopy(original) {
	const card = ui.create.card(ui.special);
	card.init([original.suit, original.number, original.name, original.nature]);
	card.cardid = original.cardid;
	card.wunature = original.wunature;
	card.storage = original.storage;
	card.relatedCard = original;
	card.owner = get.owner(original);

	// 同步选中状态到原卡
	new MutationObserver(mutations => {
		if (get.position(card) !== "s" || !card.hasGaintag(GAINTAG)) return;
		for (const m of mutations) {
			if (m.attributeName !== "class") continue;
			ui.selected.cards.remove(card);
			const selected = card.classList.contains("selected");
			card.updateTransform(selected, 0);
			card.relatedCard.classList.toggle("selected", selected);
			if (selected) {
				ui.selected.cards.add(card.relatedCard);
			} else {
				ui.selected.cards.remove(card.relatedCard);
			}
		}
	}).observe(card, { attributes: true, attributeFilter: ["class"] });

	return card;
}

/** 创建过滤器，排除装备区和无效特殊区卡牌 */
function wrapFilter(filter, includeS) {
	return (card, player, target) => {
		const real = card.relatedCard || card;
		if (get.position(card) === "e") return false;
		if (includeS && get.position(card) === "s" && get.itemtype(card) === "card" && !card.hasGaintag(GAINTAG)) {
			return false;
		}
		return filter(real, player, target);
	};
}

/** 处理多选时的卡牌筛选 */
function processMultiSelect(event, player, copies, filtered, result) {
	if (!event.filterCard || !(typeof event.selectCard === "object" || event.selectCard > 1)) {
		return event.filterCard ? filtered : copies;
	}

	result.addArray(filtered);
	const valid = player.getCards("he", j => {
		const real = j.relatedCard || j;
		return event.position.includes(get.position(real)) && event.filterCard(real, player, event.target);
	});

	for (const c of valid) {
		ui.selected.cards = ui.selected.cards || [];
		ui.selected.cards.add(c);
		result.addArray(
			copies.filter(j => {
				if (result.includes(j)) return false;
				const real = j.relatedCard || j;
				return event.position.includes(get.position(real)) && event.filterCard(real, player, event.target);
			})
		);
		ui.selected.cards.remove(c);
	}
	return result;
}

/** 设置卡牌样式 */
function styleCards(cards) {
	for (const card of cards) {
		card.node.gaintag.classList.remove("gaintag", "info");
		card.node.gaintag.innerHTML = '<div class="epclick"></div>';
	}
}

/** 卡牌排序 */
function sortCards(cards) {
	cards.sort((b, a) => {
		if (a.name !== b.name) return lib.sort.card(a.name, b.name);
		if (a.suit !== b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
		return a.number - b.number;
	});
}

/** 清理副本卡牌 */
function cleanup(event, player) {
	const cards = event.result?.cards;
	if (cards) {
		cards.forEach((card, i) => {
			if (card.hasGaintag(GAINTAG)) {
				const original = player.getCards("e", c => c.cardid === card.cardid)[0];
				if (original) cards[i] = original;
			}
		});
	}

	player
		?.getCards("s", c => c.hasGaintag(GAINTAG))
		.forEach(c => {
			c.discard();
			c.delete();
		});

	event.copyCards = false;
	if (player === game.me) ui.updatehl();
}

/** 初始化手牌化模式 */
export function setupEquipCopy() {
	const VALID_EVENTS = ["chooseCard", "chooseToUse", "chooseToRespond", "chooseToDiscard", "chooseCardTarget", "chooseToGive"];

	// 选择开始：创建副本
	lib.hooks.checkBegin.add(async event => {
		if (lib.config["extension_十周年UI_aloneEquip"]) return;

		const player = event.player;
		const valid = event.position?.includes("e") && player.countCards("e") && !event.copyCards && VALID_EVENTS.includes(event.name);
		if (!valid) return;

		event.copyCards = true;
		const includeS = !event.position.includes("s");
		if (includeS) event.position += "s";

		const copies = player.getCards("e").map(createCopy);
		let filtered = [];
		let result = [];

		if (event.filterCard) {
			filtered = copies.filter(c => event.filterCard(c.relatedCard || c, player, event.target));
			event.filterCard = wrapFilter(event.filterCard, includeS);
		}

		const toGive = processMultiSelect(event, player, copies, filtered, result);
		if (toGive.length) player.directgains(toGive, null, GAINTAG);

		styleCards([...copies, ...filtered, ...result]);
		sortCards(copies);
	});

	// 检查卡牌：同步选中状态
	lib.hooks.checkCard.add((card, event) => {
		if (lib.config["extension_十周年UI_aloneEquip"] || !event.copyCards) return;

		if (get.position(card) === "e" && card.classList.contains("selected")) {
			const copy = event.player.getCards("s", c => c.hasGaintag(GAINTAG) && c.relatedCard === card)[0];
			if (copy && !copy.classList.contains("selected")) {
				card.classList.remove("selected");
				ui.selected.cards.remove(card);
			}
		}
	});

	// 检查结束：同步装备区状态
	lib.hooks.checkEnd.add(event => {
		if (lib.config["extension_十周年UI_aloneEquip"] || !event.copyCards) return;

		for (const equip of event.player.getCards("e")) {
			if (equip.classList.contains("selected")) {
				const copy = event.player.getCards("s", c => c.hasGaintag(GAINTAG) && c.relatedCard === equip)[0];
				if (copy && !copy.classList.contains("selected")) {
					equip.classList.remove("selected");
					ui.selected.cards.remove(equip);
				}
			}
		}
	});

	// 取消选择：清理资源
	lib.hooks.uncheckBegin.add(async (event, args) => {
		if (lib.config["extension_十周年UI_aloneEquip"]) return;

		const shouldCleanup = args.includes("card") && event.copyCards && (event.result || (["chooseToUse", "chooseToRespond"].includes(event.name) && !event.skill && !event.result));
		if (shouldCleanup) cleanup(event, event.player);
	});
}
