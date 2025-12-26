/**
 * 手气卡换牌模块 - 使用原生 step 机制，兼容控制台操作
 */
import { lib, game, ui, get, _status } from "noname";

export function setupLuckyCard() {
	if (!lib.config["extension_十周年UI_luckycard"]) return;

	// 工具函数挂到 lib 上，供 step 编译器访问
	lib._luckyCard = {
		clearTimers() {
			["timer", "timer2"].forEach(t => {
				if (window[t]) {
					clearInterval(window[t]);
					delete window[t];
				}
			});
		},
		removeProgressBar() {
			document.getElementById("jindutiaopl")?.remove();
		},
		showTimer() {
			this.clearTimers();
			this.removeProgressBar();
			game.Jindutiaoplayer?.();
		},
		hideTimer() {
			this.clearTimers();
			this.removeProgressBar();
		},
		closeCardDialog() {
			if (ui.cardDialog) {
				ui.cardDialog.close();
				delete ui.cardDialog;
			}
		},
		stripTags: text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : ""),
		setupConfirmButton() {
			if (!ui.confirm?.childNodes?.length) return;
			if (lib.config.extension_十周年UI_newDecadeStyle === "off") return;
			var btn = ui.confirm.childNodes[0];
			if (btn?.link === "ok") btn.innerHTML = "换牌";
		},
	};

	lib.element.content.gameDraw = function () {
		"step 0";
		if (_status.brawl?.noGameDraw) {
			event.finish();
			return;
		}

		var end = player,
			numx = num;
		do {
			if (typeof num === "function") numx = num(player);

			var cards = [];
			var otherGetCards = event.otherPile?.[player.playerid]?.getCards;

			if (otherGetCards) cards.addArray(otherGetCards(numx));
			else if (player.getTopCards) cards.addArray(player.getTopCards(numx));
			else cards.addArray(get.cards(numx));

			if (event.gaintag?.[player.playerid]) {
				var gaintag = event.gaintag[player.playerid];
				var list = typeof gaintag === "function" ? gaintag(numx, cards) : [[cards, gaintag]];
				game.broadcastAll(
					(p, l) => {
						for (var i = l.length - 1; i >= 0; i--) p.directgain(l[i][0], null, l[i][1]);
					},
					player,
					list
				);
			} else {
				player.directgain(cards);
			}

			if (player.singleHp === true && get.mode() !== "guozhan" && (lib.config.mode !== "doudizhu" || _status.mode !== "online")) {
				player.doubleDraw();
			}

			player._start_cards = player.getCards("h");
			player = player.next;
		} while (player !== end);

		event.changeCard = get.config("change_card");
		if (_status.connectMode || (lib.config.mode === "single" && _status.mode !== "wuxianhuoli") || (lib.config.mode === "doudizhu" && _status.mode === "online") || !["identity", "guozhan", "doudizhu", "single"].includes(lib.config.mode)) {
			event.changeCard = "disabled";
		}
		event.remainingChanges = 5;
		event.luckyCards = 10000 + Math.floor(Math.random() * 90000);

		("step 1");
		if (event.changeCard !== "disabled" && !_status.auto && game.me.countCards("h")) {
			var lc = lib._luckyCard;
			var str = "本场还可更换<span style='color:#00c853'>" + event.remainingChanges + "次</span>手牌(剩余" + event.luckyCards + "张手气卡)";

			lc.showTimer();

			if (lib.config["extension_十周年UI_cardPrompt"] && typeof dui?.showHandTip === "function") {
				lc.closeCardDialog();
				var tip = (ui.cardDialog = dui.showHandTip());
				tip.appendText(lc.stripTags(str));
				tip.strokeText();
				tip.show();
			} else {
				event.dialog = ui.create.dialog(str);
			}

			ui.create.confirm("oc");
			lc.setupConfirmButton();
			event.custom.replace.confirm = function (bool) {
				_status.event.bool = bool;
				game.resume();
			};
		} else {
			event.finish();
			setTimeout(decadeUI.effect.gameStart, 51);
		}

		("step 2");
		if (event.changeCard === "once") event.changeCard = "disabled";
		else if (event.changeCard === "twice") event.changeCard = "once";
		else if (event.changeCard === "disabled") {
			event.bool = false;
			return;
		}

		_status.imchoosing = true;
		event.switchToAuto = function () {
			_status.event.bool = false;
			game.resume();
		};
		game.pause();

		("step 3");
		_status.imchoosing = false;
		var lc = lib._luckyCard;

		if (event.bool) {
			game.changeCoin?.(-3);

			var hs = game.me.getCards("h"),
				cards = [];
			var otherGetCards = event.otherPile?.[game.me.playerid]?.getCards;
			var otherDiscard = event.otherPile?.[game.me.playerid]?.discard;

			game.addVideo("lose", game.me, [get.cardsInfo(hs), [], [], []]);
			for (var i = 0; i < hs.length; i++) {
				hs[i].removeGaintag(true);
				otherDiscard ? otherDiscard(hs[i]) : hs[i].discard(false);
			}

			if (otherGetCards) cards.addArray(otherGetCards(hs.length));
			else cards.addArray(get.cards(hs.length));

			if (event.gaintag?.[game.me.playerid]) {
				var gaintag = event.gaintag[game.me.playerid];
				var list = typeof gaintag === "function" ? gaintag(hs.length, cards) : [[cards, gaintag]];
				for (var i = list.length - 1; i >= 0; i--) game.me.directgain(list[i][0], null, list[i][1]);
			} else {
				game.me.directgain(cards);
			}

			game.me._start_cards = game.me.getCards("h");
			event.luckyCards--;
			event.remainingChanges--;

			lc.hideTimer();
			lc.closeCardDialog();
			event.dialog?.close();
			delete event.dialog;
			ui.confirm?.close();

			if (event.changeCard !== "disabled" && event.remainingChanges > 0) event.goto(1);
			else setTimeout(decadeUI.effect.gameStart, 51);
		} else {
			lc.hideTimer();
			lc.closeCardDialog();
			event.dialog?.close();
			ui.confirm?.close();
			game.me._start_cards = game.me.getCards("h");
			setTimeout(decadeUI.effect.gameStart, 51);
			event.finish();
		}
	};
}
