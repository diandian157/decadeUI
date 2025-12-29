/**
 * @fileoverview 卡牌元素创建模块，提供卡牌DOM元素的创建和包装功能
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { element } from "../utils/element.js";

/**
 * 创建卡牌DOM元素
 * @param {HTMLElement} [position] - 父容器元素
 * @param {string} [info] - 信息标识，传入"noclick"禁用点击事件
 * @param {boolean} [noclick] - 是否禁用点击事件
 * @returns {HTMLElement} 创建的卡牌元素
 */
export function createCardElement(position, info, noclick) {
	const card = ui.create.div(".card");
	card.node = {
		image: ui.create.div(".image", card),
		info: ui.create.div(".info"),
		suitnum: element.create("suit-num", card),
		name: ui.create.div(".name", card),
		name2: ui.create.div(".name2", card),
		background: ui.create.div(".background", card),
		intro: ui.create.div(".intro", card),
		range: ui.create.div(".range", card),
		gaintag: element.create("gaintag info", card),
		judgeMark: element.create("judge-mark", card),
		cardMask: element.create("card-mask", card),
	};

	const extend = {
		$name: element.create("top-name", card),
		$vertname: card.node.name,
		$equip: card.node.name2,
		$suitnum: card.node.suitnum,
		$range: card.node.range,
		$gaintag: card.node.gaintag,
	};
	for (const i in extend) card[i] = extend[i];

	Object.setPrototypeOf(card, lib.element.Card.prototype);
	card.node.intro.innerText = lib.config.intro;
	if (!noclick) lib.setIntro(card);

	card.storage = {};
	card.vanishtag = [];
	card.gaintag = [];
	card._uncheck = [];

	if (info !== "noclick") {
		card.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
		if (lib.config.touchscreen) {
			card.addEventListener("touchstart", ui.click.cardtouchstart);
			card.addEventListener("touchmove", ui.click.cardtouchmove);
		} else {
			card.addEventListener("mouseenter", ui.click.cardmouseenter);
			card.addEventListener("mouseleave", ui.click.cardmouseleave);
		}
		if (lib.cardSelectObserver) lib.cardSelectObserver.observe(card, { attributes: true });
	}

	card.$suitnum.$num = element.create(null, card.$suitnum, "span");
	card.$suitnum.$num.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
	card.$suitnum.$br = element.create(null, card.$suitnum, "br");
	card.$suitnum.$suit = element.create("suit", card.$suitnum, "span");
	card.$suitnum.$suit.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
	card.$equip.$suitnum = element.create(null, card.$equip, "span");
	card.$equip.$name = element.create(null, card.$equip, "span");

	card.node.judgeMark.node = {
		back: element.create("back", card.node.judgeMark),
		mark: element.create("mark", card.node.judgeMark),
		judge: element.create("judge", card.node.judgeMark),
	};

	if (position) position.appendChild(card);
	return card;
}

/**
 * 创建cards包装器，在基础创建函数后更新回合数
 * @param {Function} baseCreate - 基础创建函数
 * @returns {Function} 包装后的创建函数
 */
export function createCardsWrapper(baseCreate) {
	return function () {
		const result = baseCreate.apply(this, arguments);
		game.updateRoundNumber();
		return result;
	};
}
