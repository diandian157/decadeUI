"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	if (!lib.config["extension_十周年UI_luckycard"]) return;
	lib.element.content.gameDraw = async function () {
		const event = get.event();
		const player = _status.event.player || event.player;
		const num = event.num;
		if (_status.brawl && _status.brawl.noGameDraw) return;
		const end = player;
		let currentPlayer = player;
		do {
			let numx = typeof num === "function" ? num(currentPlayer) : num;
			const cards = [];
			const otherGetCards = event.otherPile?.[currentPlayer.playerid]?.getCards;
			if (otherGetCards) {
				cards.addArray(otherGetCards(numx));
			} else if (currentPlayer.getTopCards) {
				cards.addArray(currentPlayer.getTopCards(numx));
			} else {
				cards.addArray(get.cards(numx));
			}
			if (event.gaintag?.[currentPlayer.playerid]) {
				const gaintag = event.gaintag[currentPlayer.playerid];
				const list = typeof gaintag === "function" ? gaintag(numx, cards) : [[cards, gaintag]];
				game.broadcastAll(
					(p, l) => {
						for (let i = l.length - 1; i >= 0; i--) {
							p.directgain(l[i][0], null, l[i][1]);
						}
					},
					currentPlayer,
					list
				);
			} else {
				currentPlayer.directgain(cards);
			}
			if (currentPlayer.singleHp === true && get.mode() !== "guozhan" && (lib.config.mode !== "doudizhu" || _status.mode !== "online")) {
				currentPlayer.doubleDraw();
			}
			currentPlayer._start_cards = currentPlayer.getCards("h");
			currentPlayer = currentPlayer.next;
		} while (currentPlayer !== end);
		let changeCard = get.config("change_card");
		const isDisabled = _status.connectMode || (lib.config.mode === "single" && _status.mode !== "wuxianhuoli") || (lib.config.mode === "doudizhu" && _status.mode === "online") || !["identity", "guozhan", "doudizhu", "single"].includes(lib.config.mode);
		if (isDisabled) {
			changeCard = "disabled";
		}
		if (changeCard !== "disabled" && !_status.auto && game.me.countCards("h")) {
			let numsy = 5;
			let numsl = 10000 + Math.floor(Math.random() * 90000);
			let changing = true;
			_status.imchoosing = true;
			const useCardPrompt = lib.config["extension_十周年UI_cardPrompt"];
			const showChangeCardTimer = () => {
				if (window.timer) {
					clearInterval(window.timer);
					delete window.timer;
				}
				if (window.timer2) {
					clearInterval(window.timer2);
					delete window.timer2;
				}
				const existingBar = document.getElementById("jindutiaopl");
				if (existingBar) {
					existingBar.remove();
				}
				if (typeof game.Jindutiaoplayer === "function") {
					game.Jindutiaoplayer();
				}
			};
			const hideChangeCardTimer = () => {
				if (window.timer) {
					clearInterval(window.timer);
					delete window.timer;
				}
				if (window.timer2) {
					clearInterval(window.timer2);
					delete window.timer2;
				}
				const bar = document.getElementById("jindutiaopl");
				if (bar) bar.remove();
			};
			while (changing && numsy > 0) {
				const str = `本场还可更换<span style="color:#00c853">${numsy}次</span>手牌(剩余${numsl}张手气卡)`;
				const stripTags = text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "");
				const tipText = stripTags(str);
				showChangeCardTimer();
				const { bool } = await new Promise(resolve => {
					if (useCardPrompt && typeof dui?.showHandTip === "function") {
						if (ui.cardDialog) {
							ui.cardDialog.close();
							delete ui.cardDialog;
						}
						const tip = (ui.cardDialog = dui.showHandTip());
						tip.appendText(tipText);
						tip.strokeText();
						tip.show();
						ui.create.confirm("oc");
						if (ui.confirm && ui.confirm.childNodes.length > 0 && lib.config.extension_十周年UI_newDecadeStyle !== "off") {
							const okButton = ui.confirm.childNodes[0];
							if (okButton && okButton.link === "ok") {
								okButton.innerHTML = "换牌";
							}
						}
						event.custom.replace.confirm = ok => {
							hideChangeCardTimer();
							if (ui.cardDialog) {
								ui.cardDialog.close();
								delete ui.cardDialog;
							}
							if (ui.confirm?.close) ui.confirm.close();
							game.resume();
							resolve({ bool: ok });
						};
						event.switchToAuto = () => {
							hideChangeCardTimer();
							if (ui.cardDialog) {
								ui.cardDialog.close();
								delete ui.cardDialog;
							}
							if (ui.confirm?.close) ui.confirm.close();
							game.resume();
							resolve({ bool: false });
						};
					} else {
						const dialog = ui.create.dialog(str);
						ui.create.confirm("oc");
						if (ui.confirm && ui.confirm.childNodes.length > 0 && lib.config.extension_十周年UI_newDecadeStyle !== "off") {
							const okButton = ui.confirm.childNodes[0];
							if (okButton && okButton.link === "ok") {
								okButton.innerHTML = "换牌";
							}
						}
						event.custom.replace.confirm = ok => {
							hideChangeCardTimer();
							dialog.close();
							if (ui.confirm?.close) ui.confirm.close();
							game.resume();
							resolve({ bool: ok });
						};
						event.switchToAuto = () => {
							hideChangeCardTimer();
							dialog.close();
							if (ui.confirm?.close) ui.confirm.close();
							game.resume();
							resolve({ bool: false });
						};
					}
					game.pause();
				});
				if (bool) {
					if (changeCard === "once") {
						changeCard = "disabled";
						changing = false;
					} else if (changeCard === "twice") {
						changeCard = "once";
					}
					if (game.changeCoin) game.changeCoin(-3);
					const hs = game.me.getCards("h");
					const count = hs.length;
					const otherDiscard = event.otherPile?.[game.me.playerid]?.discard;
					game.addVideo("lose", game.me, [get.cardsInfo(hs), [], [], []]);
					hs.forEach(card => {
						card.removeGaintag(true);
						if (otherDiscard) otherDiscard(card);
						else card.discard(false);
					});
					const cards = [];
					const otherGetCards = event.otherPile?.[game.me.playerid]?.getCards;
					if (otherGetCards) cards.addArray(otherGetCards(count));
					if (cards.length < count) cards.addArray(get.cards(count - cards.length));
					if (event.gaintag?.[game.me.playerid]) {
						const gaintag = event.gaintag[game.me.playerid];
						const list = typeof gaintag === "function" ? gaintag(count, cards) : [[cards, gaintag]];
						for (let i = list.length - 1; i >= 0; i--) {
							game.me.directgain(list[i][0], null, list[i][1]);
						}
					} else {
						game.me.directgain(cards);
					}
					game.me._start_cards = game.me.getCards("h");
					numsl--;
					numsy--;
				} else {
					changing = false;
				}
			}
			hideChangeCardTimer();
			_status.imchoosing = false;
		}
		game.me._start_cards = game.me.getCards("h");
		setTimeout(decadeUI.effect.gameStart, 51);
	};
});
