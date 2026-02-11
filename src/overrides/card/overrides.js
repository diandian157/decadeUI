/**
 * @fileoverview 卡牌覆写方法
 * @description 卡牌DOM元素的覆写方法
 * @module overrides/card/overrides
 */
import { lib, game, ui, get, _status } from "noname";
import { applyCardBorder } from "../../ui/cardStyles.js";
import { applyCardSkin, handleSkinFallback } from "./skin-applier.js";
import { getSkinCache, isSkinPreloaded, getFallbackKey, getFallbackSkinUrl, generateSkinFilename } from "./skin-loader.js";
import { CARD_ANIMATION, LAYOUT } from "../../constants.js";

/** @type {Function|null} 基础卡牌初始化方法 */
let baseCardInit = null;

/** @type {Function|null} 基础卡牌复制方法 */
let baseCardCopy = null;

/**
 * 设置基础卡牌方法
 * @param {Function} init - 初始化方法
 * @param {Function} copy - 复制方法
 */
export function setBaseCardMethods(init, copy) {
	baseCardInit = init;
	baseCardCopy = copy;
}

/**
 * 应用卡牌覆写
 */
export function applyCardOverrides() {
	if (!lib.element?.card) return;
	baseCardInit = lib.element.card.$init;
	baseCardCopy = lib.element.card.copy;
}

/**
 * 卡牌复制覆写
 * @returns {HTMLElement} 复制的卡牌元素
 */
export function cardCopy() {
	const clone = baseCardCopy.apply(this, arguments);
	clone.nature = this.nature;

	const skinKey = lib.config.extension_十周年UI_cardPrettify;
	if (!skinKey || skinKey === "off") return clone;

	if (!isSkinPreloaded(skinKey)) return clone;

	const cache = getSkinCache(skinKey);
	const filename = generateSkinFilename(clone.name, clone.nature);
	const asset = cache[filename];

	const fallbackKey = getFallbackKey(skinKey);

	// 处理加载失败的情况
	if (asset && !asset.loaded && clone.classList.contains("decade-card")) {
		if (asset.loaded === undefined && asset.image) {
			// 正在加载中，监听错误事件
			asset.image.addEventListener("error", () => {
				handleSkinFallback(clone, asset, fallbackKey, filename);
			});
		} else if (asset.loaded === false) {
			// 已确认加载失败
			handleSkinFallback(clone, asset, fallbackKey, filename);
		}
	} else if (!asset && fallbackKey) {
		// 主皮肤不存在，尝试回退
		const fallbackUrl = getFallbackSkinUrl(fallbackKey, filename);
		if (fallbackUrl) {
			clone.style.background = `url("${fallbackUrl}")`;
			clone.classList.add("decade-card");
		}
	}

	return clone;
}

/**
 * 卡牌初始化覆写
 * @param {Array|Object} card - 卡牌信息
 * @returns {HTMLElement} 初始化后的卡牌元素
 */
export function cardInit(card) {
	baseCardInit.apply(this, arguments);

	this.node.range.innerHTML = "";

	const info = lib.card[card[2]];
	if (info) {
		this.dataset.cardName = card[2];
		this.dataset.cardType = info.type || "";
		this.dataset.cardSubtype = info.subtype || "";
		this.dataset.cardMultitarget = info.multitarget ? "1" : "0";
	}

	// 处理卡牌标签
	processCardTags(this, card);

	// 更新卡牌显示元素
	updateCardDisplay(this, card);

	// 清理样式
	cleanupCardStyles(this);

	// 应用皮肤
	applyCardSkin(this, card);

	return this;
}

/**
 * 处理卡牌标签
 * @param {HTMLElement} cardElement - 卡牌元素
 * @param {Array|Object} card - 卡牌信息
 */
function processCardTags(cardElement, card) {
	const tags = Array.isArray(card[4]) ? [...card[4]] : [];

	if (!cardElement.cardid) return;

	_status.cardtag = _status.cardtag || {};

	// 收集所有标签
	for (const i in _status.cardtag) {
		if (_status.cardtag[i].includes(cardElement.cardid)) {
			tags.push(i);
		}
	}

	const uniqueTags = [...new Set(tags)];
	if (uniqueTags.length === 0) return;

	let tagstr = ' <span class="cardtag">';
	uniqueTags.forEach(tag => {
		_status.cardtag[tag] = _status.cardtag[tag] || [];
		if (!_status.cardtag[tag].includes(cardElement.cardid)) {
			_status.cardtag[tag].push(cardElement.cardid);
		}
		tagstr += lib.translate[tag + "_tag"];
	});
	cardElement.node.range.innerHTML += tagstr + "</span>";
}

/**
 * 更新卡牌显示元素
 * @param {HTMLElement} cardElement - 卡牌元素
 * @param {Array|Object} card - 卡牌信息
 */
function updateCardDisplay(cardElement, card) {
	const verticalName = cardElement.$vertname;
	cardElement.$name.innerHTML = verticalName.innerHTML;

	// 处理卡牌点数
	let cardnum = card[1] || "";
	if (parseInt(cardnum) == cardnum) cardnum = parseInt(cardnum);
	cardnum = get.strNumber(cardnum, true) || cardnum;

	cardElement.$suitnum.$num.innerHTML =
		typeof cardnum == "string" ? cardnum : (cardElement.number !== 0 ? get.strNumber(cardElement.number) : false) || cardElement.number || "";
	cardElement.$suitnum.$suit.innerHTML = get.translation((cardElement.dataset.suit = cardElement.suit));

	// 处理装备显示
	const equip = cardElement.$equip;
	const innerHTML = equip.innerHTML;
	const spaceIdx = innerHTML.indexOf(" ");
	equip.$suitnum.innerHTML = innerHTML.slice(0, spaceIdx);
	equip.$name.innerHTML = innerHTML.slice(spaceIdx);

	// 处理判定标记
	const node = cardElement.node;
	const background = node.background;
	node.judgeMark.node.judge.innerHTML = background.innerHTML;
	if (background.classList.contains("tight")) {
		background.classList.remove("tight");
	}

	// 清空info节点
	while (node.info.firstChild) {
		node.info.removeChild(node.info.lastChild);
	}
}

/**
 * 清理卡牌样式
 * @param {HTMLElement} cardElement - 卡牌元素
 */
function cleanupCardStyles(cardElement) {
	if (cardElement.style.color) {
		cardElement.style.removeProperty("color");
	}
	if (cardElement.style.textShadow) {
		cardElement.style.removeProperty("text-shadow");
	}
	if (cardElement.node.info.style.opacity) {
		cardElement.node.info.style.removeProperty("opacity");
	}
	if (cardElement.$vertname.style.opacity) {
		cardElement.$vertname.style.removeProperty("opacity");
	}
}

/**
 * 卡牌变换更新
 * @param {boolean} bool - 是否选中
 * @param {number} [delay] - 延迟时间
 */
export function cardUpdateTransform(bool, delay) {
	if (delay) {
		setTimeout(() => {
			this.updateTransform(this.classList.contains("selected"));
		}, delay);
		return;
	}

	if (_status.event.player != game.me) return;

	const isInHandArea = this._transform && this.parentNode?.parentNode?.parentNode == ui.me && (!_status.mousedown || _status.mouseleft);

	if (isInHandArea) {
		if (bool) {
			const offset = window.decadeUI?.isMobile?.() ? LAYOUT.CARD_SELECT_OFFSET_MOBILE : LAYOUT.CARD_SELECT_OFFSET_DESKTOP;
			this.style.transform = `${this._transform} translateY(-${offset}px)`;
		} else {
			this.style.transform = this._transform || "";
		}
	}
}

/**
 * 卡牌移动到玩家
 * @param {Object} player - 目标玩家
 * @returns {HTMLElement} 卡牌元素
 */
export function cardMoveTo(player) {
	if (!player) return;

	// 跳过圣杯碎片
	if (this.name?.startsWith("shengbei_left_") || this.name?.startsWith("shengbei_right_")) {
		return this;
	}

	const _decadeUI = window.decadeUI;
	const arena = _decadeUI?.boundsCaches?.arena;
	if (!arena?.updated) arena?.update();

	player.checkBoundsCache?.();
	this.fixed = true;

	const x = Math.round((player.cacheWidth - arena.cardWidth) / 2 + player.cacheLeft);
	const y = Math.round((player.cacheHeight - arena.cardHeight) / 2 + player.cacheTop);
	const scale = arena.cardScale;

	this.tx = x;
	this.ty = y;
	this.scaled = true;
	this.style.transform = `translate(${x}px,${y}px) scale(${scale})`;

	if (player !== game.me) {
		applyCardBorder(this, player);
	}

	return this;
}

/**
 * 卡牌移动删除
 * @param {Object} player - 目标玩家
 */
export function cardMoveDelete(player) {
	this.fixed = true;

	// 圣杯碎片特殊处理
	if (this.name?.startsWith("shengbei_left_") || this.name?.startsWith("shengbei_right_")) {
		setTimeout(() => this.delete(), CARD_ANIMATION.MOVE_DELETE_DELAY);
	} else {
		this.moveTo(player);
		setTimeout(() => this.delete(), CARD_ANIMATION.MOVE_DELETE_DELAY);
	}
}
