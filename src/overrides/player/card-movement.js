/**
 * @fileoverview 卡牌移动覆写模块
 * @description 处理玩家摸牌、获得牌、给牌、弃牌等卡牌移动相关的覆写方法
 * @module overrides/player/card-movement
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { applyCardBorder } from "../../ui/cardStyles.js";

/** @type {Function|null} 基础摸牌方法引用 */
let basePlayerDraw = null;

/** @type {Object|null} decadeUI引用（延迟获取） */
let _decadeUI = null;

/**
 * 获取decadeUI引用
 * @returns {Object} decadeUI对象
 */
function getDui() {
	if (!_decadeUI) _decadeUI = window.decadeUI;
	return _decadeUI;
}

/**
 * 设置基础摸牌方法
 * @param {Function} fn - 基础方法
 */
export function setBasePlayerDraw(fn) {
	basePlayerDraw = fn;
}

/**
 * 摸牌动画覆写
 * @description 覆写玩家摸牌的视觉效果，支持卡牌数组或数量参数
 * @param {number|Array} num - 摸牌数量或卡牌数组
 * @param {boolean|string} [init] - 初始化参数，false或'nobroadcast'时不广播
 * @param {Object} [config] - 配置对象
 * @returns {void}
 */
export function playerDraw(num, init, config) {
	if (game.chess) return basePlayerDraw.call(this, num, init, config);

	if (init !== false && init !== "nobroadcast") {
		game.broadcast(
			function (player, num, init, config) {
				player.$draw(num, init, config);
			},
			this,
			num,
			init,
			config
		);
	}

	let cards;
	let isDrawCard;
	if (get.itemtype(num) == "cards") {
		cards = num.concat();
		isDrawCard = true;
	} else if (get.itemtype(num) == "card") {
		cards = [num];
		isDrawCard = true;
	} else if (typeof num == "number") {
		cards = new Array(num);
	} else {
		cards = new Array(1);
	}

	if (init !== false) {
		if (isDrawCard) {
			game.addVideo("drawCard", this, get.cardsInfo(cards));
		} else {
			game.addVideo("draw", this, num);
		}
	}

	if (_status.event && _status.event.name) {
		if (
			(function (event) {
				return event.name != "gain" && !event.name.includes("raw");
			})(_status.event)
		)
			isDrawCard = true;
	}

	if (game.me == this && !isDrawCard) return;

	const fragment = document.createDocumentFragment();
	let card;
	const _dui = getDui();
	const player = this;

	for (let i = 0; i < cards.length; i++) {
		card = cards[i];
		if (card == null) {
			card = _dui.element.create("card thrown drawingcard");
		} else {
			card = card.copy("thrown", "drawingcard", false);
		}
		card.fixed = true;

		if (player !== game.me) {
			applyCardBorder(card, player);
		}
		cards[i] = card;
		fragment.appendChild(card);
	}

	_dui.layoutDrawCards(cards, player, true);
	ui.arena.appendChild(fragment);

	_dui.queueNextFrameTick(function () {
		_dui.layoutDrawCards(cards, player);
		_dui.delayRemoveCards(cards, 460, 220);
	});
}

/**
 * 获得卡牌2覆写
 * @description 处理玩家获得卡牌的视觉效果，区分从场上获得和直接获得
 * @param {Array|Object} cards - 卡牌数组或单张卡牌
 * @param {boolean} [log] - 是否记录日志
 * @returns {void}
 */
export function playerGain2(cards, log) {
	let type = get.itemtype(cards);
	if (type != "cards") {
		if (type != "card") return;
		type = "cards";
		cards = [cards];
	}

	if (log === true) game.log(this, "获得了", cards);

	game.broadcast(
		function (player, cards) {
			player.$gain2(cards);
		},
		this,
		cards
	);

	const gains = [];
	const draws = [];
	let card;
	let clone;
	const player = this;

	for (let i = 0; i < cards.length; i++) {
		clone = cards[i].clone;
		card = cards[i].copy("thrown", "gainingcard");
		card.fixed = true;

		if (player !== game.me) {
			applyCardBorder(card, player);
		}

		if (clone && clone.parentNode == ui.arena) {
			card.scaled = true;
			card.style.transform = clone.style.transform;
			gains.push(card);
		} else {
			draws.push(card);
		}
	}

	if (gains.length) game.addVideo("gain2", this, get.cardsInfo(gains));
	if (draws.length) game.addVideo("drawCard", this, get.cardsInfo(draws));

	if (cards.duiMod && this == game.me) return;

	cards = gains.concat(draws);
	const _dui = getDui();

	_dui.layoutDrawCards(draws, this, true);

	const fragment = document.createDocumentFragment();
	for (let i = 0; i < cards.length; i++) fragment.appendChild(cards[i]);
	ui.arena.appendChild(fragment);

	_dui.queueNextFrameTick(function () {
		_dui.layoutDrawCards(cards, player);
		_dui.delayRemoveCards(cards, 460, 220);
	});
}

/**
 * 给牌动画覆写
 * @description 处理玩家给予其他玩家卡牌的视觉效果
 * @param {Array|number} cards - 卡牌数组或数量
 * @param {Object} target - 目标玩家
 * @param {boolean} [log] - 是否记录日志
 * @param {boolean} [record] - 是否记录到视频
 * @returns {void}
 */
export function playerGive(cards, target, log, record) {
	let itemtype;
	const duiMod = cards.duiMod && game.me == target;

	if (typeof cards == "number") {
		itemtype = "number";
		cards = new Array(cards);
	} else {
		itemtype = get.itemtype(cards);
		if (itemtype == "cards") {
			cards = cards.concat();
		} else if (itemtype == "card") {
			cards = [cards];
		} else {
			return;
		}
	}

	if (record !== false) {
		let cards2 = cards;
		if (itemtype == "number") {
			cards2 = cards.length;
			game.addVideo("give", this, [cards2, target.dataset.position]);
		} else {
			game.addVideo("giveCard", this, [get.cardsInfo(cards2), target.dataset.position]);
		}
		game.broadcast(
			function (source, cards2, target, record) {
				source.$give(cards2, target, false, record);
			},
			this,
			cards2,
			target,
			record
		);
	}

	if (log != false) {
		if (itemtype == "number") {
			game.log(target, "从", this, "获得了" + get.cnNumber(cards.length) + "张牌");
		} else {
			game.log(target, "从", this, "获得了", cards);
		}
	}

	if (this.$givemod) {
		this.$givemod(cards, target);
		return;
	}

	if (duiMod) return;

	let card;
	const _dui = getDui();
	const hand = _dui.boundsCaches.hand;
	hand.check();
	const draws = [];
	const player = this;
	const fragment = document.createDocumentFragment();

	for (let i = 0; i < cards.length; i++) {
		card = cards[i];
		if (card) {
			const cp = card.copy("card", "thrown", "gainingcard", false);
			let hs = player == game.me;

			if (hs) {
				if (card.throwWith) {
					hs = card.throwWith == "h" || card.throwWith == "s";
				} else {
					hs = card.parentNode == player.node.handcards1;
				}
			}

			if (hs) {
				cp.tx = Math.round(hand.x + card.tx);
				cp.ty = Math.round(hand.y + 30 + card.ty);
				cp.scaled = true;
				cp.style.transform = "translate(" + cp.tx + "px," + cp.ty + "px) scale(" + hand.cardScale + ")";
			} else {
				draws.push(cp);
			}
			card = cp;
		} else {
			card = _dui.element.create("card thrown gainingcard");
			draws.push(card);
		}
		cards[i] = card;
		cards[i].fixed = true;
		fragment.appendChild(cards[i]);
	}

	if (draws.length) _dui.layoutDrawCards(draws, player);
	ui.arena.appendChild(fragment);

	_dui.queueNextFrameTick(function () {
		_dui.layoutDrawCards(cards, target);
		_dui.delayRemoveCards(cards, 460, 220);
	});
}

/**
 * 弃牌动画覆写
 * @description 处理玩家弃牌的视觉效果
 * @param {Array|number} cards - 卡牌数组或数量
 * @param {number} [time] - 动画时间（未使用）
 * @param {boolean} [record] - 是否记录到视频
 * @param {boolean} [nosource] - 是否无来源（影响卡牌初始位置）
 * @returns {HTMLElement} 最后一张卡牌元素
 */
export function playerThrow(cards, time, record, nosource) {
	let itemtype;
	const duiMod = cards.duiMod && game.me == this && !nosource;

	if (typeof cards == "number") {
		itemtype = "number";
		cards = new Array(cards);
	} else {
		itemtype = get.itemtype(cards);
		if (itemtype == "cards") {
			cards = cards.concat();
		} else if (itemtype == "card") {
			cards = [cards];
		} else {
			const evt = _status.event;
			if (evt && evt.card && evt.cards === cards) {
				const card = ui.create.card().init([evt.card.suit, evt.card.number, evt.card.name, evt.card.nature]);
				if (evt.card.suit == "none") card.node.suitnum.style.display = "none";
				card.dataset.virtual = 1;
				cards = [card];
			}
		}
	}

	let card;
	let clone;
	const player = this;
	const _dui = getDui();
	const hand = _dui.boundsCaches.hand;
	hand.check();

	for (let i = 0; i < cards.length; i++) {
		card = cards[i];
		if (card) {
			clone = card.copy("thrown");
			if (duiMod && (card.throwWith == "h" || card.throwWith == "s")) {
				clone.tx = Math.round(hand.x + card.tx);
				clone.ty = Math.round(hand.y + 30 + card.ty);
				clone.scaled = true;
				clone.throwordered = true;
				clone.style.transform = "translate(" + clone.tx + "px," + clone.ty + "px) scale(" + hand.cardScale + ")";
			}
			card = clone;
		} else {
			card = _dui.element.create("card infohidden infoflip");
			card.moveTo = lib.element.card.moveTo;
			card.moveDelete = lib.element.card.moveDelete;
		}
		cards[i] = card;
	}

	if (record !== false) {
		if (record !== "nobroadcast") {
			game.broadcast(
				function (player, cards, time, record, nosource) {
					player.$throw(cards, time, record, nosource);
				},
				this,
				cards,
				0,
				record,
				nosource
			);
		}
		game.addVideo("throw", this, [get.cardsInfo(cards), 0, nosource]);
	}

	cards.sort((a, b) => {
		if (a.tx === undefined && b.tx === undefined) return 0;
		if (a.tx === undefined) return decadeUI.config.rightLayout ? -1 : 1;
		if (b.tx === undefined) return decadeUI.config.rightLayout ? 1 : -1;
		return a.tx - b.tx;
	});

	for (let i = 0; i < cards.length; i++) {
		(card => {
			player.$throwordered2(card, nosource);
		})(cards[i]);
	}

	if (game.chess) this.chessFocus();
	return cards[cards.length - 1];
}

/**
 * 弃牌动画2覆写
 * @description 处理单张卡牌的弃牌视觉效果
 * @param {HTMLElement} card - 卡牌元素
 * @param {boolean} [nosource] - 是否无来源
 * @returns {HTMLElement} 卡牌元素
 */
export function playerThrowordered2(card, nosource) {
	if (_status.connectMode) ui.todiscard = [];

	const _dui = getDui();

	if (card.throwordered === undefined) {
		const bounds = _dui.boundsCaches.arena;
		if (!bounds.updated) bounds.update();
		this.checkBoundsCache();

		let x, y;
		if (nosource) {
			x = (bounds.width - bounds.cardWidth) / 2 - bounds.width * 0.08;
			y = (bounds.height - bounds.cardHeight) / 2;
		} else {
			x = (this.cacheWidth - bounds.cardWidth) / 2 + this.cacheLeft;
			y = (this.cacheHeight - bounds.cardHeight) / 2 + this.cacheTop;
		}
		card.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px) scale(${bounds.cardScale})`;
	} else {
		card.throwordered = undefined;
	}

	card.classList.add("thrown");
	if (card.fixed) return ui.arena.appendChild(card);

	let tagNode = card.querySelector(".used-info");
	if (tagNode == null) tagNode = card.appendChild(_dui.element.create("used-info"));
	card.$usedtag = tagNode;

	applyCardBorder(card, this, this === game.me);

	ui.thrown.push(card);
	ui.arena.appendChild(card);

	_dui.tryAddPlayerCardUseTag(card, this, _status.event);

	_dui.queueNextFrameTick(_dui.layoutDiscard, _dui);

	return card;
}

/**
 * 阶段判定覆写
 * @description 处理判定阶段的卡牌展示效果
 * @param {Object} card - 判定卡牌
 * @returns {void}
 */
export function playerPhaseJudge(card) {
	game.addVideo("phaseJudge", this, get.cardInfo(card));

	if (card[card.cardSymbol]?.cards?.length) {
		const cards = card[card.cardSymbol].cards;
		this.$throw(cards);
	} else {
		const VCard = game.createCard(card.name, "虚拟", "");
		this.$throw(VCard);
	}

	getDui().delay(451);
}

/**
 * 添加虚拟判定覆写
 * @description 处理虚拟判定牌的添加和显示
 * @param {Object} VCard - 虚拟卡牌对象
 * @param {Array} cards - 实际卡牌数组
 * @returns {void}
 */
export function playerAddVirtualJudge(VCard, cards) {
	if (game.online) return;

	const player = this;
	const card = VCard;
	const isViewAsCard = cards.length !== 1 || cards[0].name !== VCard.name || !card.isCard;

	let cardx;
	if (get.itemtype(card) == "card" && card.isViewAsCard) {
		cardx = card;
	} else {
		cardx = isViewAsCard
			? game.createCard(card.name, cards.length == 1 ? get.suit(cards[0]) : "none", cards.length == 1 ? get.number(cards[0]) : 0)
			: cards[0];
	}

	game.broadcastAll(
		(player, cardx, isViewAsCard, VCard, cards) => {
			cardx.fix();

			if (!cardx.isViewAsCard) {
				const cardSymbol = Symbol("card");
				cardx.cardSymbol = cardSymbol;
				cardx[cardSymbol] = VCard;
			}

			cardx.style.transform = "";
			cardx.classList.remove("drawinghidden");
			delete cardx._transform;

			if (isViewAsCard && !cardx.isViewAsCard) {
				cardx.isViewAsCard = true;
				cardx.destroyLog = false;

				for (let i of cards) {
					i.goto(ui.special);
					i.destiny = player.node.judges;
				}

				if (cardx.destroyed) cardx._destroyed_Virtua = cardx.destroyed;
				cardx.destroyed = function (card, id, player, event) {
					if (card._destroyed_Virtua) {
						if (typeof card._destroyed_Virtua == "function") {
							let bool = card._destroyed_Virtua(card, id, player, event);
							if (bool === true) return true;
						} else if (lib.skill[card._destroyed_Virtua]) {
							if (player) {
								if (player.hasSkill(card._destroyed_Virtua)) {
									delete card._destroyed_Virtua;
									return false;
								}
							}
							return true;
						} else if (typeof card._destroyed_Virtua == "string") {
							return card._destroyed_Virtua == id;
						} else if (card._destroyed_Virtua === true) return true;
					}
					if (id == "ordering" && ["phaseJudge", "executeDelayCardEffect"].includes(event.getParent().name)) return false;
					if (id != "judge") {
						return true;
					}
				};
			}

			cardx.classList.add("drawinghidden");

			if (isViewAsCard) {
				cardx.cards = cards || [];
				cardx.viewAs = VCard.name;
				const bgMark = lib.translate[cardx.viewAs + "_bg"] || get.translation(cardx.viewAs)[0];
				if (cardx.classList.contains("fullskin") || cardx.classList.contains("fullborder")) {
					if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = bgMark;
					else cardx.node.background.innerHTML = bgMark;
				}
				cardx.classList.add("fakejudge");
			} else {
				delete cardx.viewAs;
				cardx.classList.remove("fakejudge");
				if (window.decadeUI) {
					cardx.node.judgeMark.node.judge.innerHTML = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name)[0];
				}
			}

			player.node.judges.insertBefore(cardx, player.node.judges.firstChild);

			// 判定标记美化
			const judgeMarkMap = [
				"bingliang",
				"lebu",
				"shandian",
				"fulei",
				"hongshui",
				"huoshan",
				"caomu",
				"jlsgqs_shuiyanqijun",
				"jydiy_zouhuorumo",
				"jydiy_yungongliaoshang",
				"xwjh_biguanqingxiu",
				"xwjh_wushisanke",
				"xumou_jsrg",
				"dczixi_bingliang",
				"dczixi_lebu",
				"dczixi_shandian",
			];

			if (judgeMarkMap.includes(cardx.name)) {
				let imageName = cardx.name;
				const judgeText = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name) || "";
				cardx.node.judgeMark.node.judge.innerText = "";
				cardx.node.judgeMark.node.judge.style.fontSize = "";

				const isDecadeStyle =
					lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff";
				const ext = isDecadeStyle && ["bingliang", "lebu", "shandian"].includes(imageName) ? "1.png" : ".png";
				const basePath = `${lib.assetURL}extension/十周年UI/image/ui/judge-mark/`;

				const tryImg = new Image();
				tryImg.onload = function () {
					cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${tryImg.src}")`;
					cardx.node.judgeMark.node.judge.innerText = "";
					cardx.node.judgeMark.node.judge.style.fontSize = "0px";
				};
				tryImg.onerror = function () {
					cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${basePath}tongyong.png")`;
					cardx.node.judgeMark.node.judge.innerText = judgeText ? judgeText[0] : "";
				};
				tryImg.src = `${basePath}${imageName}${ext}`;

				cardx.node.judgeMark.node.judge.style.zIndex = "99";
				cardx.node.judgeMark.node.judge.parentElement.children[0].style.background = "none";
				cardx.node.judgeMark.node.judge.parentElement.children[0].style.display = "none";
			} else {
				cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${lib.assetURL}extension/十周年UI/image/ui/judge-mark/tongyong.png")`;
			}

			ui.updatej(player);
		},
		player,
		cardx,
		isViewAsCard,
		VCard,
		cards
	);
}
