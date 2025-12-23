"use strict";

decadeModule.import((lib, game, ui, get, ai, _status) => {
	if (!lib.config["extension_十周年UI_luckycard"]) return;

	const isChangeCardDisabled = () => {
		if (_status.connectMode) return true;
		if (lib.config.mode === "single" && _status.mode !== "wuxianhuoli") return true;
		if (lib.config.mode === "doudizhu" && _status.mode === "online") return true;
		return !["identity", "guozhan", "doudizhu", "single"].includes(lib.config.mode);
	};

	const clearTimers = () => {
		["timer", "timer2"].forEach(t => {
			if (window[t]) {
				clearInterval(window[t]);
				delete window[t];
			}
		});
	};

	const removeProgressBar = () => {
		document.getElementById("jindutiaopl")?.remove();
	};

	const showChangeCardTimer = () => {
		clearTimers();
		removeProgressBar();
		game.Jindutiaoplayer?.();
	};

	const hideChangeCardTimer = () => {
		clearTimers();
		removeProgressBar();
	};

	const closeCardDialog = () => {
		if (ui.cardDialog) {
			ui.cardDialog.close();
			delete ui.cardDialog;
		}
	};

	const closeConfirm = () => {
		ui.confirm?.close?.();
	};

	const stripTags = text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "");

	const setupConfirmButton = () => {
		if (!ui.confirm?.childNodes?.length) return;
		if (lib.config.extension_十周年UI_newDecadeStyle === "off") return;
		const okButton = ui.confirm.childNodes[0];
		if (okButton?.link === "ok") {
			okButton.innerHTML = "换牌";
		}
	};

	const createChangeCardPromise = (event, str, useCardPrompt) => {
		return new Promise(resolve => {
			const cleanup = () => {
				hideChangeCardTimer();
				closeCardDialog();
				closeConfirm();
				game.resume();
			};

			const handleResolve = bool => {
				cleanup();
				resolve({ bool });
			};

			event.custom.replace.confirm = handleResolve;
			event.switchToAuto = () => handleResolve(false);

			if (useCardPrompt && typeof dui?.showHandTip === "function") {
				closeCardDialog();
				const tip = (ui.cardDialog = dui.showHandTip());
				tip.appendText(stripTags(str));
				tip.strokeText();
				tip.show();
			} else {
				ui.create.dialog(str);
			}

			ui.create.confirm("oc");
			setupConfirmButton();
			game.pause();
		});
	};

	const processPlayerDraw = (currentPlayer, num, event) => {
		const numx = typeof num === "function" ? num(currentPlayer) : num;
		const cards = [];
		const otherGetCards = event.otherPile?.[currentPlayer.playerid]?.getCards;

		if (otherGetCards) {
			cards.addArray(otherGetCards(numx));
		} else if (currentPlayer.getTopCards) {
			cards.addArray(currentPlayer.getTopCards(numx));
		} else {
			cards.addArray(get.cards(numx));
		}

		const gaintag = event.gaintag?.[currentPlayer.playerid];
		if (gaintag) {
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

		if (currentPlayer.singleHp === true && get.mode() !== "guozhan" && !(lib.config.mode === "doudizhu" && _status.mode === "online")) {
			currentPlayer.doubleDraw();
		}

		currentPlayer._start_cards = currentPlayer.getCards("h");
	};

	const exchangeCards = event => {
		const hs = game.me.getCards("h");
		const count = hs.length;
		const { otherPile } = event;
		const playerId = game.me.playerid;

		game.addVideo("lose", game.me, [get.cardsInfo(hs), [], [], []]);

		hs.forEach(card => {
			card.removeGaintag(true);
			otherPile?.[playerId]?.discard?.(card) ?? card.discard(false);
		});

		const cards = [];
		const otherGetCards = otherPile?.[playerId]?.getCards;
		if (otherGetCards) cards.addArray(otherGetCards(count));
		if (cards.length < count) cards.addArray(get.cards(count - cards.length));

		const gaintag = event.gaintag?.[playerId];
		if (gaintag) {
			const list = typeof gaintag === "function" ? gaintag(count, cards) : [[cards, gaintag]];
			for (let i = list.length - 1; i >= 0; i--) {
				game.me.directgain(list[i][0], null, list[i][1]);
			}
		} else {
			game.me.directgain(cards);
		}

		game.me._start_cards = game.me.getCards("h");
	};

	lib.element.content.gameDraw = async function () {
		const event = get.event();
		const player = _status.event.player || event.player;
		const { num } = event;

		if (_status.brawl?.noGameDraw) return;

		let currentPlayer = player;
		do {
			processPlayerDraw(currentPlayer, num, event);
			currentPlayer = currentPlayer.next;
		} while (currentPlayer !== player);

		let changeCard = isChangeCardDisabled() ? "disabled" : get.config("change_card");

		if (changeCard !== "disabled" && !_status.auto && game.me.countCards("h")) {
			let remainingChanges = 5;
			let luckyCards = 10000 + Math.floor(Math.random() * 90000);
			const useCardPrompt = lib.config["extension_十周年UI_cardPrompt"];

			_status.imchoosing = true;

			while (remainingChanges > 0) {
				const str = `本场还可更换<span style="color:#00c853">${remainingChanges}次</span>手牌(剩余${luckyCards}张手气卡)`;
				showChangeCardTimer();

				const { bool } = await createChangeCardPromise(event, str, useCardPrompt);

				if (!bool) break;

				if (changeCard === "once") {
					changeCard = "disabled";
				} else if (changeCard === "twice") {
					changeCard = "once";
				}

				game.changeCoin?.(-3);
				exchangeCards(event);
				luckyCards--;
				remainingChanges--;

				if (changeCard === "disabled") break;
			}

			hideChangeCardTimer();
			_status.imchoosing = false;
		}

		game.me._start_cards = game.me.getCards("h");
		setTimeout(decadeUI.effect.gameStart, 51);
	};
});
