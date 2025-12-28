/**
 * Card 覆写模块
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { cardSkinMeta } from "../config.js";
import { applyCardBorder } from "../ui/cardStyles.js";

let baseCardInit = null;
let baseCardCopy = null;

/** 处理皮肤回退 */
function handleSkinFallback(card, asset, fallbackKey, filename) {
	const res = window.dui?.statics?.cards;
	const rawBg = card._decadeRawBg || "";
	if (!res || !fallbackKey) {
		card.style.background = rawBg;
		card.classList.remove("decade-card");
		return;
	}

	const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
	const fallbackAsset = fallbackCache[filename];

	if (fallbackAsset?.loaded) {
		card.style.background = `url("${fallbackAsset.url}")`;
	} else {
		card.style.background = rawBg;
		card.classList.remove("decade-card");
	}
}

/** 卡牌复制覆写 */
export function cardCopy() {
	const clone = baseCardCopy.apply(this, arguments);
	clone.nature = this.nature;

	const skinKey = lib.config.extension_十周年UI_cardPrettify;
	if (!skinKey || skinKey === "off") return clone;

	const res = window.dui?.statics?.cards;
	const readOk = !!res?.READ_OK?.[skinKey];
	if (!readOk) return clone;

	const skinCache = res[skinKey];
	let asset = skinCache?.[clone.name];

	const fallbackMap = { bingkele: "decade", gold: "caise" };
	const fallbackKey = fallbackMap[skinKey];
	const hasFallback = fallbackKey && cardSkinMeta[fallbackKey];

	if (asset && !asset.loaded && clone.classList.contains("decade-card")) {
		if (asset.loaded === undefined) {
			const image = asset.image;
			image?.addEventListener("error", () => {
				handleSkinFallback(clone, asset, hasFallback ? fallbackKey : null, clone.name);
			});
		} else {
			handleSkinFallback(clone, asset, hasFallback ? fallbackKey : null, clone.name);
		}
	} else if (!asset && hasFallback) {
		const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
		const fallbackAsset = fallbackCache[clone.name];
		if (fallbackAsset?.loaded) {
			clone.style.background = `url("${fallbackAsset.url}")`;
			clone.classList.add("decade-card");
		}
	}

	return clone;
}

/** 卡牌初始化覆写 */
export function cardInit(card) {
	baseCardInit.apply(this, arguments);

	this.node.range.innerHTML = "";

	// 处理卡牌标签
	const tags = Array.isArray(card[4]) ? [...card[4]] : [];
	if (this.cardid) {
		_status.cardtag = _status.cardtag || {};
		for (const i in _status.cardtag) {
			if (_status.cardtag[i].includes(this.cardid)) tags.push(i);
		}
		const uniqueTags = [...new Set(tags)];
		if (uniqueTags.length) {
			let tagstr = ' <span class="cardtag">';
			uniqueTags.forEach(tag => {
				_status.cardtag[tag] = _status.cardtag[tag] || [];
				if (!_status.cardtag[tag].includes(this.cardid)) _status.cardtag[tag].push(this.cardid);
				tagstr += lib.translate[tag + "_tag"];
			});
			this.node.range.innerHTML += tagstr + "</span>";
		}
	}

	const verticalName = this.$vertname;
	this.$name.innerHTML = verticalName.innerHTML;
	this.$suitnum.$num.innerHTML = (this.number !== 0 ? get.strNumber(this.number) : false) || this.number || "";
	this.$suitnum.$suit.innerHTML = get.translation((this.dataset.suit = this.suit));

	const equip = this.$equip;
	const innerHTML = equip.innerHTML;
	const spaceIdx = innerHTML.indexOf(" ");
	equip.$suitnum.innerHTML = innerHTML.slice(0, spaceIdx);
	equip.$name.innerHTML = innerHTML.slice(spaceIdx);

	const node = this.node;
	const background = node.background;
	node.judgeMark.node.judge.innerHTML = background.innerHTML;
	if (background.classList.contains("tight")) background.classList.remove("tight");

	// 清理样式
	if (this.style.color) this.style.removeProperty("color");
	if (this.style.textShadow) this.style.removeProperty("text-shadow");
	if (node.info.style.opacity) node.info.style.removeProperty("opacity");
	if (verticalName.style.opacity) verticalName.style.removeProperty("opacity");

	while (node.info.firstChild) node.info.removeChild(node.info.lastChild);

	applyCardSkin(this, card);
	return this;
}

/** 应用卡牌皮肤 */
function applyCardSkin(cardElement, card) {
	const skinKey = lib.config.extension_十周年UI_cardPrettify;
	const isOff = !skinKey || skinKey === "off";

	// 清除旧皮肤样式
	cardElement.classList.remove("decade-card");

	if (isOff) {
		// 关闭时清除内联样式，让本体CSS生效
		cardElement.style.removeProperty("background");
		return;
	}

	const skin = cardSkinMeta[skinKey];
	if (!skin) return;

	// 保存原始背景（仅首次启用皮肤时）
	if (!cardElement._decadeRawBg) cardElement._decadeRawBg = cardElement.style.background || "";

	const cardName = Array.isArray(card) ? card[2] : card.name;
	const cardNature = Array.isArray(card) ? card[3] : card.nature;
	let filename = cardName;

	cardElement.classList.add("decade-card");
	if (cardElement.classList.contains("infohidden")) return;

	// 处理杀的属性
	if (cardName === "sha" && cardNature && !Array.isArray(cardNature)) {
		filename += "_" + get.natureList(cardNature).sort(lib.sort.nature).join("_");
	}

	const res = window.dui?.statics?.cards;
	const skinCache = res?.[skinKey] || (res[skinKey] = {});
	let asset = skinCache[filename];
	const readOk = !!res?.READ_OK?.[skinKey];

	const fallbackMap = { bingkele: "decade", gold: "caise" };
	const fallbackKey = fallbackMap[skinKey];
	const hasFallback = fallbackKey && cardSkinMeta[fallbackKey];
	const decadeUIName = window.decadeUI?.extensionName || "十周年UI";

	if (readOk) {
		if (asset === undefined) {
			if (hasFallback) {
				const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
				const fallbackAsset = fallbackCache[filename];
				if (fallbackAsset?.loaded) {
					cardElement.style.background = `url("${fallbackAsset.url}")`;
				} else {
					cardElement.classList.remove("decade-card");
				}
			} else {
				cardElement.classList.remove("decade-card");
			}
		} else {
			cardElement.style.background = `url("${asset.url}")`;
		}
	} else {
		const folder = skin.dir || skinKey;
		const extension = skin.extension || "png";
		const url = lib.assetURL + `extension/${decadeUIName}/image/card-skins/${folder}/${filename}.${extension}`;

		if (!asset) {
			skinCache[filename] = asset = {
				name: filename,
				url: undefined,
				loaded: undefined,
			};
		}

		if (asset.loaded !== false) {
			if (asset.loaded === undefined) {
				const image = new Image();
				image.onload = () => {
					asset.loaded = true;
				};

				const cardElem = cardElement;
				const rawBg = cardElement._decadeRawBg || "";
				image.onerror = () => {
					if (hasFallback) {
						loadFallbackSkin(cardElem, asset, fallbackKey, filename, decadeUIName, rawBg);
					} else {
						asset.loaded = false;
						cardElem.style.background = rawBg;
						cardElem.classList.remove("decade-card");
					}
				};

				asset.url = url;
				asset.image = image;
				image.src = url;
			}
			cardElement.style.background = `url("${url}")`;
		} else {
			cardElement.classList.remove("decade-card");
		}
	}
}

/** 加载回退皮肤 */
function loadFallbackSkin(cardElem, asset, fallbackKey, filename, decadeUIName, rawBg) {
	const fallbackSkin = cardSkinMeta[fallbackKey];
	const fallbackFolder = fallbackSkin?.dir || fallbackKey;
	const fallbackExtension = fallbackSkin?.extension || "png";
	const fallbackUrl = lib.assetURL + `extension/${decadeUIName}/image/card-skins/${fallbackFolder}/${filename}.${fallbackExtension}`;

	const fallbackImage = new Image();
	fallbackImage.onload = () => {
		asset.loaded = true;
		asset.url = fallbackUrl;
		cardElem.style.background = `url("${fallbackUrl}")`;
	};
	fallbackImage.onerror = () => {
		asset.loaded = false;
		cardElem.style.background = rawBg;
		cardElem.classList.remove("decade-card");
	};
	fallbackImage.src = fallbackUrl;
}

/** 卡牌变换更新 */
export function cardUpdateTransform(bool, delay) {
	if (delay) {
		setTimeout(() => {
			this.updateTransform(this.classList.contains("selected"));
		}, delay);
		return;
	}

	if (_status.event.player != game.me) return;

	if (this._transform && this.parentNode?.parentNode?.parentNode == ui.me && (!_status.mousedown || _status.mouseleft)) {
		if (bool) {
			const offset = window.decadeUI?.isMobile?.() ? 10 : 12;
			this.style.transform = `${this._transform} translateY(-${offset}px)`;
		} else {
			this.style.transform = this._transform || "";
		}
	}
}

/** 卡牌移动到玩家 */
export function cardMoveTo(player) {
	if (!player) return;
	if (this.name?.startsWith("shengbei_left_") || this.name?.startsWith("shengbei_right_")) return this;

	const dui = window.dui;
	const arena = dui?.boundsCaches?.arena;
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

	if (player !== game.me) applyCardBorder(this, player);
	return this;
}

/** 卡牌移动删除 */
export function cardMoveDelete(player) {
	this.fixed = true;

	if (this.name?.startsWith("shengbei_left_") || this.name?.startsWith("shengbei_right_")) {
		setTimeout(() => this.delete(), 460);
	} else {
		this.moveTo(player);
		setTimeout(() => this.delete(), 460);
	}
}

export function setBaseCardMethods(init, copy) {
	baseCardInit = init;
	baseCardCopy = copy;
}

/** 刷新卡牌皮肤（轻量级） */
export function refreshCardSkin(card) {
	if (card) applyCardSkin(card, card);
}

export function applyCardOverrides() {
	if (!lib.element?.card) return;

	baseCardInit = lib.element.card.$init;
	baseCardCopy = lib.element.card.copy;
}
