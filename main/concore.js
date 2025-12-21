import { lib, game, ui, get, _status } from "noname";

export const bootstrapExtension = () => {
	const mode = typeof get.mode === "function" ? get.mode() : get.mode;
	if (new Set(["chess", "tafang", "hs_hearthstone"]).has(mode)) return false;
	if (game.hasExtension?.("皮肤切换")) {
		game.menuZoom = 1;
	}
	_status.nopopequip = lib.config.extension_十周年UI_aloneEquip;
	const recommendedLayouts = ["nova"];
	const currentLayout = lib.config.layout;
	if (!recommendedLayouts.includes(currentLayout)) {
		const prompt = "十周年UI提醒您，请使用<新版>布局以获得良好体验。\n点击确定自动切换到<新版>布局，点击取消保持当前布局。";
		if (confirm(prompt)) {
			lib.config.layout = "nova";
			game.saveConfig("layout", "nova");
			alert("布局已切换为<新版>布局，游戏将自动重启以应用新布局。");
			setTimeout(() => location.reload(), 100);
		}
	}
	console.time(decadeUIName);
	return true;
};

export const registerDecadeUIUtilityModule = decadeUI => {
	decadeUI.isMobile = function () {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|OperaMini/i.test(navigator.userAgent);
	};
	decadeUI.delay = function (milliseconds) {
		if (typeof milliseconds != "number") throw "milliseconds is not number";
		if (_status.paused) return;
		game.pause();
		_status.timeout = setTimeout(game.resume, milliseconds);
	};
	decadeUI.queueNextTick = function (callback, ctx) {
		if (!dui._tickEntries) dui._tickEntries = [];
		dui._tickEntries.push({
			ctx: ctx,
			callback: callback,
		});
		if (dui._queueTick) return;
		dui._queueTick = Promise.resolve().then(function () {
			dui._queueTick = null;
			const entries = dui._tickEntries;
			dui._tickEntries = [];
			for (let i = 0; i < entries.length; i++) entries[i].callback.call(entries[i].ctx);
		});
	};
	decadeUI.queueNextFrameTick = function (callback, ctx) {
		if (!dui._frameTickEntries) dui._frameTickEntries = [];
		dui._frameTickEntries.push({
			ctx: ctx,
			callback: callback,
		});
		if (dui._queueFrameTick) return;
		dui._queueFrameTick = requestAnimationFrame(function () {
			dui._queueFrameTick = null;
			setTimeout(
				entries => {
					for (let i = 0; i < entries.length; i++) entries[i].callback.call(entries[i].ctx);
				},
				0,
				dui._frameTickEntries
			);
			dui._frameTickEntries = [];
		});
	};
	decadeUI.layoutHand = function () {
		dui.layout.updateHand();
	};
	decadeUI.layoutHandDraws = function (cards) {
		const bounds = dui.boundsCaches.hand;
		bounds.check();
		let x, y;
		const pw = bounds.width;
		const ph = bounds.height;
		const cw = bounds.cardWidth;
		const ch = bounds.cardHeight;
		const cs = bounds.cardScale;
		const csw = cw * cs;
		let xStart, xMargin;
		const draws = [];
		let card;
		let clone;
		const source = cards.duiMod;
		if (source && source != game.me) {
			source.checkBoundsCache();
			xMargin = 27;
			xStart = source.cacheLeft - bounds.x - csw / 2 - (cw - csw) / 2;
			let totalW = xMargin * cards.length + (csw - xMargin);
			const limitW = source.cacheWidth + csw;
			if (totalW > limitW) {
				xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
			} else {
				xStart += (limitW - totalW) / 2;
			}
			y = Math.round(source.cacheTop - bounds.y - 30 + (source.cacheHeight - ch) / 2);
			for (let i = 0; i < cards.length; i++) {
				x = Math.round(xStart + i * xMargin);
				card = cards[i];
				card.tx = x;
				card.ty = y;
				card.fixed = true;
				card.scaled = true;
				card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
			}
			return;
		} else {
			for (let i = 0; i < cards.length; i++) {
				card = cards[i];
				clone = card.clone;
				if (clone && !clone.fixed && clone.parentNode == ui.arena) {
					x = Math.round(clone.tx - bounds.x);
					y = Math.round(clone.ty - (bounds.y + 30));
					card.tx = x;
					card.ty = y;
					card.scaled = true;
					card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
				} else {
					draws.push(card);
				}
			}
		}
		y = Math.round(-ch * cs * 2);
		xMargin = csw * 0.5;
		xStart = (pw - xMargin * (draws.length + 1)) / 2 - (cw - csw) / 2;
		for (let i = 0; i < draws.length; i++) {
			x = Math.round(xStart + i * xMargin);
			card = draws[i];
			card.tx = x;
			card.ty = y;
			card.scaled = true;
			card.style.transition = "transform 400ms ease-out";
			card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
		}
	};
	decadeUI.layoutDrawCards = function (cards, player, center) {
		const bounds = dui.boundsCaches.arena;
		if (!bounds.updated) bounds.update();
		player.checkBoundsCache();
		const playerX = player.cacheLeft;
		const playerY = player.cacheTop;
		const playerW = player.cacheWidth;
		const playerH = player.cacheHeight;
		const pw = bounds.width;
		const ph = bounds.height;
		const cw = bounds.cardWidth;
		const ch = bounds.cardHeight;
		const cs = bounds.cardScale;
		const csw = cw * cs;
		let xMargin = 27;
		let xStart = (center ? (pw - playerW) / 2 : playerX) - csw / 2 - (cw - csw) / 2;
		let totalW = xMargin * cards.length + (csw - xMargin);
		const limitW = playerW + csw;
		if (totalW > limitW) {
			xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
		} else {
			xStart += (limitW - totalW) / 2;
		}
		let x;
		let y;
		if (center) y = Math.round((ph - ch) / 2);
		else y = Math.round(playerY + (playerH - ch) / 2);
		for (let i = 0; i < cards.length; i++) {
			x = Math.round(xStart + i * xMargin);
			let card = cards[i];
			card.tx = x;
			card.ty = y;
			card.scaled = true;
			card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
		}
	};
	decadeUI.layoutDiscard = function () {
		dui.layout.updateDiscard();
	};
	decadeUI.delayRemoveCards = function (cards, delay, delay2) {
		if (!Array.isArray(cards)) cards = [cards];
		setTimeout(
			(cards, delay2) => {
				const remove = cards => {
					for (let i = 0; i < cards.length; i++) cards[i].remove();
				};
				if (delay2 == null) {
					remove(cards);
					return;
				}
				for (let i = 0; i < cards.length; i++) {
					cards[i].classList.add("removing");
				}
				setTimeout(remove, delay2, cards);
			},
			delay,
			cards,
			delay2
		);
	};
	decadeUI.cardTempSuitNum = function (card, cardsuit, cardnumber) {
		let remain = false;
		if (card._tempSuitNum) remain = true;
		let snnode = card._tempSuitNum || ui.create.div(".tempsuitnum", card);
		card._tempSuitNum = snnode;
		if (!remain) {
			snnode.$num = decadeUI.element.create("num", snnode, "span");
			snnode.$num.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
			snnode.$br = decadeUI.element.create(null, snnode, "br");
			snnode.$suit = decadeUI.element.create("suit", snnode, "span");
			snnode.$suit.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
		}
		if (cardnumber) snnode.$num.innerHTML = get.strNumber(cardnumber);
		else snnode.$num.innerHTML = "▣";
		if (cardsuit) snnode.$suit.innerHTML = get.translation(cardsuit);
		else snnode.$suit.innerHTML = "◈";
		card.dataset.tempsn = cardsuit;
	};
	decadeUI.tryAddPlayerCardUseTag = function (card, player, event) {
		if (!card || !player || !event) return;
		let tagNode = card.querySelector(".used-info");
		if (tagNode == null) tagNode = card.appendChild(dui.element.create("used-info"));
		card.$usedtag = tagNode;
		if (event.blameEvent) event = event.blameEvent;
		let tagText;
		const tagHandlerMap = {
			judge: event => {
				const initialText = event.judgestr + "的判定牌";
				event.addMessageHook("judgeResult", function () {
					const event = this;
					const card = event.result.card.clone;
					const apcard = event.apcard;
					let tagText = "";
					let tagNode = card.querySelector(".used-info");
					if (tagNode == null) tagNode = card.appendChild(dui.element.create("used-info"));
					if (event.result.suit != get.suit(card) || event.result.number != get.number(card)) {
						dui.cardTempSuitNum(card, event.result.suit, event.result.number);
					}
					let action;
					let judgeValue;
					const getEffect = event.judge2;
					if (getEffect) {
						judgeValue = getEffect(event.result);
					} else {
						judgeValue = decadeUI.get.judgeEffect(event.judgestr, event.result.judge);
					}
					if (typeof judgeValue == "boolean") {
						judgeValue = judgeValue ? 1 : -1;
					} else {
						judgeValue = event.result.judge;
					}
					if (judgeValue >= 0) {
						action = "play4";
						tagText = "判定生效";
					} else {
						action = "play5";
						tagText = "判定失效";
					}
					if (apcard && apcard._ap) apcard._ap.stopSpineAll();
					if (apcard && apcard._ap && apcard == card) {
						apcard._ap.playSpine({
							name: "effect_panding",
							action: action,
						});
					} else {
						decadeUI.animation.cap.playSpineTo(card, {
							name: "effect_panding",
							action: action,
						});
					}
					event.apcard = undefined;
					tagNode.innerHTML = get.translation(event.judgestr) + tagText;
				});
				decadeUI.animation.cap.playSpineTo(card, {
					name: "effect_panding",
					action: "play",
					loop: true,
				});
				event.apcard = card;
				return initialText;
			},
			__default: event => {
				let evt = _status.event;
				_status.event = event;
				let text = get.cardsetion(player);
				_status.event = evt;
				if (["useCard", "respond"].includes(event.name)) {
					const cardname = event.card.name,
						cardnature = get.nature(event.card);
					if (lib.config.cardtempname != "off" && (card.name != cardname || !get.is.sameNature(cardnature, card.nature, true))) {
						if (lib.config.extension_十周年UI_showTemp) {
							if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);
							let tempname = "";
							let tempname2 = get.translation(cardname);
							if (cardnature) {
								card._tempName.dataset.nature = cardnature;
								if (cardname == "sha") {
									tempname2 = get.translation(cardnature) + tempname2;
								}
							}
							tempname += tempname2;
							card._tempName.innerHTML = tempname;
							card._tempName.tempname = tempname;
						} else {
							const node = ui.create.cardTempName(event.card, card);
							const cardtempnameConfig = lib.config.cardtempname;
							if (cardtempnameConfig !== "default") node.classList.remove("vertical");
						}
					}
					const cardnumber = get.number(event.card),
						cardsuit = get.suit(event.card);
					if (card.dataset.views != 1 && event.card.cards && event.card.cards.length == 1 && (card.number != cardnumber || card.suit != cardsuit)) {
						dui.cardTempSuitNum(card, cardsuit, cardnumber);
					}
					if (event.card && (!event.card.cards || !event.card.cards.length || event.card.cards.length == 1)) {
						const name = event.card.name,
							nature = event.card.nature;
						const effectMap = {
							effect_caochuanjiejian: { key: "effect_caochuanjiejian" },
							shan: { key: "effect_shan" },
							tao: { key: "effect_tao", opts: { scale: 0.9 } },
							tiesuo: { key: "effect_tiesuolianhuan", opts: { scale: 0.9 } },
							jiu: { key: "effect_jiu", opts: { y: [-30, 0.5] } },
							kaihua: { key: "effect_shushangkaihua" },
							wuzhong: { key: "effect_wuzhongshengyou" },
							wuxie: { key: "effect_wuxiekeji", opts: { y: [10, 0.5], scale: 0.9 } },
							juedou: { key: "SF_eff_jiangling_juedou", opts: { x: [10, 0.4], scale: 1 } },
							nanman: { key: "effect_nanmanruqin", opts: { scale: 0.45 } },
							wanjian: { key: "effect_wanjianqifa", opts: { scale: 0.78 } },
							wugu: { key: "effect_wugufengdeng", opts: { y: [10, 0.5] } },
							taoyuan: { key: "SF_kapai_eff_taoyuanjieyi", opts: { y: [10, 0.5] } },
							shunshou: { key: "effect_shunshouqianyang" },
							huogong: { key: "effect_huogong", opts: { x: [8, 0.5], scale: 0.5 } },
							guohe: { key: "effect_guohechaiqiao", opts: { y: [10, 0.5] } },
							yuanjiao: { key: "effect_yuanjiaojingong" },
							zhibi: { key: "effect_zhijizhibi" },
							zhulu_card: { key: "effect_zhulutianxia" },
						};
						if (name === "sha") {
							const natureKeyMap = { thunder: "effect_leisha", fire: "effect_huosha" };
							const key = natureKeyMap[nature] || (get.color(card) == "red" ? "effect_hongsha" : "effect_heisha");
							decadeUI.animation.cap.playSpineTo(card, key);
						} else {
							const entry = effectMap[name];
							if (entry) decadeUI.animation.cap.playSpineTo(card, entry.key, entry.opts);
						}
					}
				}
				return text;
			},
		};
		tagText = (tagHandlerMap[event.name] || tagHandlerMap.__default)(event);
		tagNode.innerHTML = tagText;
	};
	decadeUI.getRandom = function (min, max) {
		if (min == null) {
			min = -2147483648;
		}
		if (max == null) {
			max = 2147483648;
		}
		if (min > max) {
			min = min + max;
			max = min - max;
			min = min - max;
		}
		let diff = 0;
		if (min < 0) {
			diff = min;
			min = 0;
			max -= diff;
		}
		return Math.floor(Math.random() * (max + 1 - min)) + min + diff;
	};
	decadeUI.getCardBestScale = function (size) {
		if (!(size && size.height)) size = decadeUI.getHandCardSize();
		const bodySize = decadeUI.get.bodySize();
		const cfg = (lib && lib.config && lib.config.extension_十周年UI_cardScale) || 0.18;
		const base = cfg;
		return Math.min((bodySize.height * base) / size.height, 1);
	};
	decadeUI.getHandCardSize = function (canUseDefault) {
		let style = decadeUI.sheet.getStyle(".media_defined > .card");
		if (style == null) style = decadeUI.sheet.getStyle(".hand-cards > .handcards > .card");
		if (style == null)
			return canUseDefault
				? {
						width: 108,
						height: 150,
					}
				: {
						width: 0,
						height: 0,
					};
		const size = {
			width: parseFloat(style.width),
			height: parseFloat(style.height),
		};
		return size;
	};
	decadeUI.getMapElementPos = function (elementFrom, elementTo) {
		if (!(elementFrom instanceof HTMLElement) || !(elementTo instanceof HTMLElement)) return console.error("arguments");
		const rectFrom = elementFrom.getBoundingClientRect();
		const rectTo = elementTo.getBoundingClientRect();
		const pos = {
			x: rectFrom.left - rectTo.left,
			y: rectFrom.top - rectTo.top,
		};
		pos.left = pos.x;
		pos.top = pos.y;
		return pos;
	};
	decadeUI.getPlayerIdentity = function (player, identity, chinese, isMark) {
		if (!(player instanceof HTMLElement && get.itemtype(player) == "player")) throw "player";
		if (!identity) identity = player.identity;
		let mode = get.mode();
		let translated = false;
		if (!chinese) {
			const modeHandlers = {
				identity: () => {
					if (!player.isAlive() || player.identityShown || player == game.me) {
						identity = ((player.special_identity ? player.special_identity : identity) || "").replace(/identity_/, "");
					}
				},
				guozhan: () => {
					if (identity == "unknown") {
						identity = player.wontYe() ? lib.character[player.name1][1] : "ye";
					}
					if (get.is.jun(player)) identity += "jun";
				},
				versus: () => {
					if (!game.me) return;
					const versusHandlers = {
						standard: () => {
							const standardMap = { trueZhu: "shuai", trueZhong: "bing", falseZhu: "jiang", falseZhong: "zu" };
							if (standardMap[identity]) return standardMap[identity];
						},
						three: () => {
							if (get.translation(player.side + "Color") == "wei") identity += "_blue";
						},
						four: () => {
							if (get.translation(player.side + "Color") == "wei") identity += "_blue";
						},
						guandu: () => {
							if (get.translation(player.side + "Color") == "wei") identity += "_blue";
						},
						two: () => {
							const side = player.finalSide ? player.finalSide : player.side;
							identity = game.me.side == side ? "friend" : "enemy";
						},
					};
					const h = versusHandlers[_status.mode];
					return h && h();
				},
				doudizhu: () => {
					identity = identity == "zhu" ? "dizhu" : "nongmin";
				},
				boss: () => {
					const bossMap = { zhu: "boss", zhong: "cong", cai: "meng" };
					if (bossMap[identity]) identity = bossMap[identity];
				},
			};
			const handler = modeHandlers[mode];
			const ret = handler && handler();
			if (ret !== undefined) return ret;
		} else {
			const modeHandlersZh = {
				identity: () => {
					if ((identity || "").indexOf("cai") < 0) {
						if (isMark) {
							if (player.special_identity) identity = player.special_identity + "_bg";
						} else {
							identity = player.special_identity ? player.special_identity : identity + "2";
						}
					}
				},
				guozhan: () => {
					if (identity == "unknown") {
						identity = player.wontYe() ? player.trueIdentity || lib.character[player.name1][1] : "ye";
					}
					if (get.is.jun(player)) {
						identity = isMark ? "君" : get.translation(identity) + "君";
					} else {
						identity = identity == "ye" ? "野心家" : identity == "qun" ? "群雄" : get.translation(identity) + "将";
					}
					translated = true;
				},
				versus: () => {
					translated = true;
					if (!game.me) return;
					const zhVersusHandlers = {
						three: () => {
							const zhMap = { zhu: "主公", zhong: "忠臣", fan: "反贼" };
							if (zhMap[identity]) identity = zhMap[identity];
							else translated = false;
						},
						standard: () => {
							const zhMap = { zhu: "主公", zhong: "忠臣", fan: "反贼" };
							if (zhMap[identity]) identity = zhMap[identity];
							else translated = false;
						},
						four: () => {
							const zhMap = { zhu: "主公", zhong: "忠臣", fan: "反贼" };
							if (zhMap[identity]) identity = zhMap[identity];
							else translated = false;
						},
						guandu: () => {
							const zhMap = { zhu: "主公", zhong: "忠臣", fan: "反贼" };
							if (zhMap[identity]) identity = zhMap[identity];
							else translated = false;
						},
						two: () => {
							const side = player.finalSide ? player.finalSide : player.side;
							identity = game.me.side == side ? "友方" : "敌方";
						},
						siguo: () => {
							identity = get.translation(identity) + "将";
						},
						jiange: () => {
							identity = get.translation(identity) + "将";
						},
						default: () => {
							translated = false;
						},
					};
					(zhVersusHandlers[_status.mode] || zhVersusHandlers.default)();
				},
				doudizhu: () => {
					identity += "2";
				},
				boss: () => {
					translated = true;
					const bossZhMap = { zhu: "BOSS", zhong: "仆从", cai: "盟军" };
					if (bossZhMap[identity]) identity = bossZhMap[identity];
					else translated = false;
				},
			};
			const handlerZh = modeHandlersZh[mode];
			handlerZh && handlerZh();
			if (!translated) identity = get.translation(identity);
			if (isMark) identity = identity[0];
		}
		return identity;
	};
};

export const enhanceDecadeUIRuntime = decadeUI => {
	dui.showHandTip = function (text) {
		let tip;
		const tips = this.statics.handTips;
		for (let i = 0; i < tips.length; i++) {
			if (tip == undefined && tips[i].closed) {
				tip = tips[i];
				tip.closed = false;
			} else {
				tips[i].hide();
			}
		}
		if (tip == undefined) {
			tip = dui.element.create("hand-tip", ui.arena);
			tips.unshift(tip);
			tip.clear = function () {
				const nodes = this.childNodes;
				for (let i = 0; i < nodes.length; i++) nodes[i].textContent = "";
				this.dataset.text = "";
			};
			tip.setText = function (text, type) {
				this.clear();
				this.appendText(text, type);
			};
			tip.setInfomation = function (text) {
				if (this.$info == null) this.$info = dui.element.create("hand-tip-info", ui.arena);
				this.$info.innerHTML = text;
			};
			tip.appendText = function (text, type) {
				if (text == undefined || text === "") return;
				if (type == undefined) type = "";
				const nodes = this.childNodes;
				for (let i = 0; i < nodes.length; i++) {
					if (nodes[i].textContent == "") {
						nodes[i].textContent = text;
						nodes[i].dataset.type = type;
						return nodes[i];
					}
				}
				const span = document.createElement("span");
				span.textContent = text;
				span.dataset.type = type;
				return this.appendChild(span);
			};
			tip.strokeText = function () {
				this.dataset.text = this.innerText;
			};
			tip.show = function () {
				this.classList.remove("hidden");
				if (this.$info && this.$info.innerHTML) this.$info.show();
			};
			tip.hide = function () {
				this.classList.add("hidden");
				if (this.$info) this.$info.hide();
			};
			tip.close = function () {
				this.closed = true;
				this.hide();
				if (tip.$info) tip.$info.innerHTML = "";
				const tips = dui.statics.handTips;
				for (let i = 0; i < tips.length; i++) {
					if (tips[i].closed) continue;
					tips[i].show();
					return;
				}
			};
			tip.isEmpty = function () {
				const nodes = this.childNodes;
				for (let i = 0; i < nodes.length; i++) {
					if (nodes[i].textContent != "") return false;
				}
				return true;
			};
		}
		tip.setText(text);
		tip.show();
		return tip;
	};
	decadeUI.BoundsCache = (function () {
		function BoundsCache(element, updateBefore) {
			this.element = element;
			this.updateBefore = updateBefore;
			this.updated = false;
			Object.defineProperties(this, {
				x: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._x;
					},
					set(value) {
						this._x == value;
					},
				},
				y: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._y;
					},
					set(value) {
						this._y == value;
					},
				},
				width: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._width;
					},
					set(value) {
						this._width == value;
					},
				},
				height: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._height;
					},
					set(value) {
						this._height == value;
					},
				},
			});
		}
		BoundsCache.prototype.check = function () {
			if (!this.updated) this.update();
		};
		BoundsCache.prototype.update = function () {
			if (this.updateBefore) this.updateBefore();
			const element = this.element;
			this.updated = true;
			if (element == undefined) return;
			this._x = element.offsetLeft;
			this._y = element.offsetTop;
			this._width = element.offsetWidth;
			this._height = element.offsetHeight;
		};
		return BoundsCache;
	})();
	decadeUI.boundsCaches = (function (boundsCaches) {
		boundsCaches.window = new decadeUI.BoundsCache(null, function () {
			this.element = ui.window;
		});
		boundsCaches.arena = new decadeUI.BoundsCache(null, function () {
			this.element = ui.arena;
			if (ui.arena == null) return;
			this.cardScale = dui.getCardBestScale();
			if (this.cardWidth != null) return;
			const childs = ui.arena.childNodes;
			for (let i = 0; i < childs.length; i++) {
				if (childs[i].classList.contains("card")) {
					this.cardWidth = childs[i].offsetWidth;
					this.cardHeight = childs[i].offsetHeight;
					return;
				}
			}
			const card = dui.element.create("card");
			card.style.opacity = 0;
			ui.arena.appendChild(card);
			this.cardWidth = card.offsetWidth;
			this.cardHeight = card.offsetHeight;
			card.remove();
		});
		boundsCaches.hand = new decadeUI.BoundsCache(null, function () {
			this.element = ui.me;
			if (ui.handcards1 == null) return;
			this.cardScale = dui.getCardBestScale();
			if (this.cardWidth != null) return;
			const childs = ui.handcards1.childNodes;
			for (let i = 0; i < childs.length; i++) {
				if (childs[i].classList.contains("card")) {
					this.cardWidth = childs[i].offsetWidth;
					this.cardHeight = childs[i].offsetHeight;
					return;
				}
			}
			const card = dui.element.create("card");
			card.style.opacity = 0;
			ui.handcards1.appendChild(card);
			this.cardWidth = card.offsetWidth;
			this.cardHeight = card.offsetHeight;
			card.remove();
		});
		return boundsCaches;
	})({});
	decadeUI.element = {
		base: {
			removeSelf(milliseconds) {
				const remove = this;
				if (milliseconds) {
					milliseconds = typeof milliseconds == "number" ? milliseconds : parseInt(milliseconds);
					setTimeout(() => {
						if (remove.parentNode) remove.parentNode.removeChild(remove);
					}, milliseconds);
					return;
				}
				if (remove.parentNode) remove.parentNode.removeChild(remove);
				return;
			},
		},
		create(className, parentNode, tagName) {
			const tag = tagName == void 0 ? "div" : tagName;
			const element = document.createElement(tag);
			element.view = {};
			for (const key in this.base) {
				element[key] = this.base[key];
			}
			if (className) element.className = className;
			if (parentNode) parentNode.appendChild(element);
			return element;
		},
		clone(element) {},
	};
	decadeUI.game = {
		wait() {
			game.pause();
		},
		resume() {
			if (!game.loopLocked) {
				let ok = false;
				try {
					if (decadeUI.eventDialog && !decadeUI.eventDialog.finished && !decadeUI.eventDialog.finishing) {
						decadeUI.eventDialog.finish();
						decadeUI.eventDialog = undefined;
						ok = true;
					}
				} finally {
					if (!ok) game.resume();
				}
			} else {
				_status.paused = false;
			}
		},
	};
};

export const finalizeDecadeUICore = (decadeUI, config, pack) => {
	registerDecadeUIUtilityModule(decadeUI);
	decadeUI.config = config;
	if (decadeUI.config.campIdentityImageMode === undefined) {
		decadeUI.config.campIdentityImageMode = true;
	}
	duicfg.update = function () {
		const menu = lib.extensionMenu["extension_" + decadeUIName];
		for (const key in menu) {
			if (menu[key] && typeof menu[key] == "object") {
				if (typeof menu[key].update == "function") {
					menu[key].update();
				}
			}
		}
	};
	decadeUI.init();
	console.timeEnd(decadeUIName);
	return decadeUI;
};
