"use strict";

/**
 * 装备牌处理模块入口
 * 整合手牌化模式和独立装备模式
 */

import { lib, game, ui, get, _status } from "noname";
import { setupEquipCopy } from "./equipCopy.js";
import { setupEquipAlone, clearEquipSelectable } from "./equipAlone.js";

/** 初始化装备处理模块 */
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

			// 获取已选卡牌（转换副本为原卡）
			const selecteds = [...ui.selected.cards].map(card => player.getCards("s", i => i.relatedCard === card)[0] || card);
			ui.selected.cards.length = 0;
			game.check();

			// 获取可选卡牌
			let selectables = get.selectableCards();
			if (lib.config["extension_十周年UI_aloneEquip"]) {
				const equipSelectables = player.getCards("e").filter(card => card.classList.contains("selectable") && card.classList.contains("equip-card-selectable"));
				selectables = selectables.concat(equipSelectables);
			}

			// 选择卡牌
			const cards = selecteds.length ? [...new Set(selectables).difference(selecteds)] : selectables;
			if (cards.length <= range[1]) {
				ui.selected.cards.push(...cards);
			} else {
				ui.selected.cards.push(...cards.randomGets(range[1]));
			}

			// 更新选中状态
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

	// 初始化两种模式
	setupEquipCopy();
	setupEquipAlone();
}
