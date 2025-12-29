/**
 * @fileoverview 钩子初始化模块，注册各种UI钩子函数
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 初始化钩子
 */
export function initHooks() {
	// target可选状态显示
	lib.hooks["checkTarget"].push(function decadeUI_selectable(target) {
		const list = ["selected", "selectable"];
		target.classList[list.some(s => target.classList.contains(s)) ? "remove" : "add"]("un-selectable");
	});

	// 视为卡牌样式适配
	const updateTempname = lib.hooks["checkCard"].indexOf(lib.hooks["checkCard"].find(i => i.name === "updateTempname"));
	lib.hooks["checkCard"][updateTempname] = function updateTempname(card) {
		if (lib.config.cardtempname === "off") return;
		const skill = _status.event.skill;
		const goon = skill && get.info(skill)?.viewAs && !get.info(skill).ignoreMod && (ui.selected.cards || []).includes(card);
		let cardname, cardnature, cardskb;
		if (!goon) {
			cardname = get.name(card);
			cardnature = get.nature(card);
		} else {
			cardskb = typeof get.info(skill).viewAs === "function" ? get.info(skill).viewAs([card], _status.event.player || game.me) : get.info(skill).viewAs;
			cardname = get.name(cardskb);
			cardnature = get.nature(cardskb);
		}
		if (card.name !== cardname || !get.is.sameNature(card.nature, cardnature, true)) {
			if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);
			let tempname2 = get.translation(cardname);
			if (cardnature) {
				card._tempName.dataset.nature = cardnature;
				if (cardname === "sha") tempname2 = get.translation(cardnature) + tempname2;
			}
			card._tempName.innerHTML = tempname2;
			card._tempName.tempname = tempname2;
			card.dataset.low = 1;
		}
		const cardnumber = get.number(card),
			cardsuit = get.suit(card);
		if (card.dataset.views != 1 && (card.number != cardnumber || card.suit != cardsuit)) {
			decadeUI.cardTempSuitNum(card, cardsuit, cardnumber);
		}
	};

	// 结束出牌按钮文本
	lib.hooks["checkEnd"].push(function decadeUI_UIconfirm() {
		if (_status.event?.name !== "chooseToUse" || _status.event.type !== "phase" || ui.confirm?.lastChild.link !== "cancel") return;
		const UIconfig = lib.config.extension_十周年UI_newDecadeStyle;
		let innerHTML = UIconfig !== "othersOff" || UIconfig === "on" ? "回合结束" : "结束出牌";
		if (UIconfig === "onlineUI") innerHTML = "取消";
		else if (_status.event.skill || (ui.selected?.cards ?? []).length > 0) {
			innerHTML = UIconfig === "off" ? `<img draggable='false' src=${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/QX.png>` : "取消";
		} else if (UIconfig === "off") {
			innerHTML = `<img draggable='false' src=${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/jscp.png>`;
		}
		ui.confirm.lastChild.innerHTML = innerHTML;
		const UIcustom = ui.confirm.custom;
		ui.confirm.custom = function (...args) {
			if (typeof UIcustom === "function") UIcustom(...args);
			if (ui.cardDialog) {
				ui.cardDialog.close();
				delete ui.cardDialog;
			}
		};
	});

	// 移除临时名称
	const removeTempname = lib.hooks["uncheckCard"].indexOf(lib.hooks["uncheckCard"].find(i => i.name === "removeTempname"));
	lib.hooks["uncheckCard"][removeTempname] = function removeTempname(card) {
		if (card._tempName) {
			card._tempName.delete();
			delete card._tempName;
			card.dataset.low = 0;
			card.dataset.view = 0;
		}
		if (card._tempSuitNum) {
			card._tempSuitNum.delete();
			delete card._tempSuitNum;
			card.dataset.views = 0;
		}
		if (decadeUI?.layout) decadeUI.layout.invalidateHand();
	};

	lib.hooks["uncheckTarget"].push(function decadeUI_unselectable(target) {
		target.classList.remove("un-selectable");
	});

	// 对话框溢出处理
	const updateDialog = lib.hooks["checkOverflow"].indexOf(lib.hooks["checkOverflow"].find(i => i.name === "updateDialog"));
	lib.hooks["checkOverflow"][updateDialog] = function updateDialog(itemOption, itemContainer, addedItems, game) {
		const gap = 5;
		const L = itemContainer.originWidth / game.documentZoom;
		const W = addedItems[0].getBoundingClientRect().width / game.documentZoom;
		const n = addedItems.length;
		if (n * W + (n + 1) * gap < L) {
			itemContainer.style.setProperty("--ml", gap + "px");
		} else {
			const ml = Math.min((n * W - L + 30 * n) / (n - 1), W + 20 / game.documentZoom);
			itemContainer.style.setProperty("--ml", "-" + ml + "px");
		}
	};
}
