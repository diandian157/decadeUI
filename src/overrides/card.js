/**
 * Card 覆写模块
 * @description 卡牌相关的覆写方法
 */

import { lib, game, ui, get, _status } from "noname";
import { cardSkinMeta } from "../config.js";

// 基础方法引用（在应用覆写时设置）
let baseCardInit = null;
let baseCardCopy = null;

/**
 * 处理卡牌皮肤回退
 * @param {HTMLElement} card - 卡牌元素
 * @param {Object} asset - 皮肤资源
 * @param {string} fallbackKey - 回退皮肤键
 * @param {string} filename - 文件名
 */
function handleSkinFallback(card, asset, fallbackKey, filename) {
	const res = window.dui?.statics?.cards;
	if (!res || !fallbackKey) {
		card.style.background = asset?.rawUrl || "";
		card.classList.remove("decade-card");
		return;
	}

	const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
	const fallbackAsset = fallbackCache[filename];

	if (fallbackAsset?.loaded) {
		card.style.background = `url("${fallbackAsset.url}")`;
	} else {
		card.style.background = asset?.rawUrl || "";
		card.classList.remove("decade-card");
	}
}

/**
 * 卡牌复制覆写
 */
export function cardCopy() {
	const clone = baseCardCopy.apply(this, arguments);
	clone.nature = this.nature;

	const skinKey = window.decadeUI?.config?.cardPrettify;
	if (!skinKey || skinKey === "off") return clone;

	const res = window.dui?.statics?.cards;
	const readOk = !!res?.READ_OK?.[skinKey];
	if (!readOk) return clone;

	const skinCache = res[skinKey];
	let asset = skinCache?.[clone.name];

	const fallbackMap = { bingkele: "decade", GoldCard: "caise" };
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

/**
 * 卡牌初始化覆写
 */
export function cardInit(card) {
	baseCardInit.apply(this, arguments);

	// 清空range节点
	this.node.range.innerHTML = "";

	// 处理卡牌标签
	const tags = Array.isArray(card[4]) ? [...card[4]] : [];
	if (this.cardid) {
		_status.cardtag = _status.cardtag || {};
		for (const i in _status.cardtag) {
			if (_status.cardtag[i].includes(this.cardid)) {
				tags.push(i);
			}
		}
		const uniqueTags = [...new Set(tags)];
		if (uniqueTags.length) {
			let tagstr = ' <span class="cardtag">';
			uniqueTags.forEach(tag => {
				_status.cardtag[tag] = _status.cardtag[tag] || [];
				if (!_status.cardtag[tag].includes(this.cardid)) {
					_status.cardtag[tag].push(this.cardid);
				}
				tagstr += lib.translate[tag + "_tag"];
			});
			tagstr += "</span>";
			this.node.range.innerHTML += tagstr;
		}
	}

	// 更新卡牌显示
	const verticalName = this.$vertname;
	this.$name.innerHTML = verticalName.innerHTML;

	const cardNumber = this.number;
	this.$suitnum.$num.innerHTML = (cardNumber !== 0 ? get.strNumber(cardNumber) : false) || cardNumber || "";
	this.$suitnum.$suit.innerHTML = get.translation((this.dataset.suit = this.suit));

	// 更新装备显示
	const equip = this.$equip;
	const innerHTML = equip.innerHTML;
	const spaceIdx = innerHTML.indexOf(" ");
	equip.$suitnum.innerHTML = innerHTML.slice(0, spaceIdx);
	equip.$name.innerHTML = innerHTML.slice(spaceIdx);

	// 更新判定标记
	const node = this.node;
	const background = node.background;
	node.judgeMark.node.judge.innerHTML = background.innerHTML;

	const classList = background.classList;
	if (classList.contains("tight")) classList.remove("tight");

	// 清理样式
	const cardStyle = this.style;
	if (cardStyle.color) cardStyle.removeProperty("color");
	if (cardStyle.textShadow) cardStyle.removeProperty("text-shadow");

	const info = node.info;
	const infoStyle = info.style;
	if (infoStyle.opacity) infoStyle.removeProperty("opacity");

	const verticalNameStyle = verticalName.style;
	if (verticalNameStyle.opacity) verticalNameStyle.removeProperty("opacity");

	// 清空子元素
	if (info.childElementCount) {
		while (info.firstChild) info.removeChild(info.lastChild);
	}
	if (equip.childElementCount) {
		while (equip.firstChild) equip.removeChild(equip.lastChild);
	}

	// 应用卡牌皮肤
	applyCardSkin(this, card);

	return this;
}

/**
 * 应用卡牌皮肤
 */
function applyCardSkin(cardElement, card) {
	const decadeUI = window.decadeUI;
	const skinKey = decadeUI?.config?.cardPrettify;

	if (skinKey === "off") {
		cardElement.classList.remove("decade-card");
		return;
	}

	const skin = cardSkinMeta[skinKey];
	if (!skin) {
		cardElement.classList.remove("decade-card");
		return;
	}

	let filename = card[2];
	cardElement.classList.add("decade-card");

	if (cardElement.classList.contains("infohidden")) return;

	// 处理杀的属性
	if (Array.isArray(card) && card[2] === "sha" && card[3] && !Array.isArray(card[3])) {
		filename += "_" + get.natureList(card[3]).sort(lib.sort.nature).join("_");
	}

	const res = window.dui?.statics?.cards;
	const skinCache = res?.[skinKey] || (res[skinKey] = {});
	let asset = skinCache[filename];
	const readOk = !!res?.READ_OK?.[skinKey];

	const fallbackMap = { bingkele: "decade", GoldCard: "caise" };
	const fallbackKey = fallbackMap[skinKey];
	const hasFallback = fallbackKey && cardSkinMeta[fallbackKey];
	const decadeUIName = decadeUI?.extensionName || "十周年UI";

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
		const url = lib.assetURL + `extension/${decadeUIName}/image/card/${folder}/${filename}.${extension}`;

		if (!asset) {
			skinCache[filename] = asset = {
				name: filename,
				url: undefined,
				loaded: undefined,
				rawUrl: undefined,
			};
		}

		if (asset.loaded !== false) {
			if (asset.loaded === undefined) {
				const image = new Image();
				image.onload = () => {
					asset.loaded = true;
				};

				const cardElem = cardElement;
				image.onerror = () => {
					if (hasFallback) {
						loadFallbackSkin(cardElem, asset, fallbackKey, filename, decadeUIName);
					} else {
						asset.loaded = false;
						cardElem.style.background = asset.rawUrl;
						cardElem.classList.remove("decade-card");
					}
				};

				asset.url = url;
				asset.rawUrl = cardElement.style.background || cardElement.style.backgroundImage;
				asset.image = image;
				image.src = url;
			}
			cardElement.style.background = `url("${url}")`;
		} else {
			cardElement.classList.remove("decade-card");
		}
	}
}

/**
 * 加载回退皮肤
 */
function loadFallbackSkin(cardElem, asset, fallbackKey, filename, decadeUIName) {
	const fallbackSkin = cardSkinMeta[fallbackKey];
	const fallbackFolder = fallbackSkin?.dir || fallbackKey;
	const fallbackExtension = fallbackSkin?.extension || "png";
	const fallbackUrl = lib.assetURL + `extension/${decadeUIName}/image/card/${fallbackFolder}/${filename}.${fallbackExtension}`;

	const fallbackImage = new Image();
	fallbackImage.onload = () => {
		asset.loaded = true;
		asset.url = fallbackUrl;
		cardElem.style.background = `url("${fallbackUrl}")`;
	};
	fallbackImage.onerror = () => {
		asset.loaded = false;
		cardElem.style.background = asset.rawUrl;
		cardElem.classList.remove("decade-card");
	};
	fallbackImage.src = fallbackUrl;
}

/**
 * 卡牌变换更新
 */
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

/**
 * 卡牌移动到玩家
 */
export function cardMoveTo(player) {
	if (!player) return;

	// 跳过圣杯卡牌
	if (this.name?.startsWith("shengbei_left_") || this.name?.startsWith("shengbei_right_")) {
		return this;
	}

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

	return this;
}

/**
 * 卡牌移动删除
 */
export function cardMoveDelete(player) {
	this.fixed = true;

	if (this.name?.startsWith("shengbei_left_") || this.name?.startsWith("shengbei_right_")) {
		setTimeout(() => this.delete(), 460);
	} else {
		this.moveTo(player);
		setTimeout(() => this.delete(), 460);
	}
}

/**
 * 设置基础方法引用
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
