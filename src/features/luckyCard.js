/**
 * 手气卡换牌模块
 * 功能：游戏开局时允许玩家消耗手气卡更换手牌
 */
import { lib, game, ui, get, _status } from "noname";

// ==================== 工具函数 ====================

/** 检查换牌功能是否禁用 */
const isChangeCardDisabled = () => {
	if (_status.connectMode) return true;
	if (lib.config.mode === "single" && _status.mode !== "wuxianhuoli") return true;
	if (lib.config.mode === "doudizhu" && _status.mode === "online") return true;
	return !["identity", "guozhan", "doudizhu", "single"].includes(lib.config.mode);
};

/** 清除计时器 */
const clearTimers = () => {
	["timer", "timer2"].forEach(t => {
		if (window[t]) {
			clearInterval(window[t]);
			delete window[t];
		}
	});
};

/** 移除进度条 */
const removeProgressBar = () => {
	document.getElementById("jindutiaopl")?.remove();
};

/** 显示换牌计时器 */
const showChangeCardTimer = () => {
	clearTimers();
	removeProgressBar();
	game.Jindutiaoplayer?.();
};

/** 隐藏换牌计时器 */
const hideChangeCardTimer = () => {
	clearTimers();
	removeProgressBar();
};

/** 关闭卡牌对话框 */
const closeCardDialog = () => {
	if (ui.cardDialog) {
		ui.cardDialog.close();
		delete ui.cardDialog;
	}
};

/** 去除HTML标签 */
const stripTags = text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "");

// ==================== UI 相关 ====================

/** 设置确认按钮文本 */
const setupConfirmButton = () => {
	if (!ui.confirm?.childNodes?.length) return;
	if (lib.config.extension_十周年UI_newDecadeStyle === "off") return;

	const okButton = ui.confirm.childNodes[0];
	if (okButton?.link === "ok") {
		okButton.innerHTML = "换牌";
	}
};

/** 创建换牌确认对话框，返回 Promise */
const createChangeCardPromise = (event, str, useCardPrompt) => {
	return new Promise(resolve => {
		const cleanup = () => {
			hideChangeCardTimer();
			closeCardDialog();
			ui.confirm?.close?.();
			game.resume();
		};

		const handleResolve = bool => {
			cleanup();
			resolve({ bool });
		};

		event.custom.replace.confirm = handleResolve;
		event.switchToAuto = () => handleResolve(false);

		// 根据配置选择提示方式
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

// ==================== 核心逻辑 ====================

/**
 * 处理单个玩家的摸牌
 */
const processPlayerDraw = (player, num, event) => {
	const drawCount = typeof num === "function" ? num(player) : num;
	const cards = [];
	const otherGetCards = event.otherPile?.[player.playerid]?.getCards;

	// 获取卡牌
	if (otherGetCards) {
		cards.addArray(otherGetCards(drawCount));
	} else if (player.getTopCards) {
		cards.addArray(player.getTopCards(drawCount));
	} else {
		cards.addArray(get.cards(drawCount));
	}

	// 处理卡牌标签
	const gaintag = event.gaintag?.[player.playerid];
	if (gaintag) {
		const list = typeof gaintag === "function" ? gaintag(drawCount, cards) : [[cards, gaintag]];
		game.broadcastAll(
			(p, l) => {
				for (let i = l.length - 1; i >= 0; i--) {
					p.directgain(l[i][0], null, l[i][1]);
				}
			},
			player,
			list
		);
	} else {
		player.directgain(cards);
	}

	// 双将模式额外摸牌
	const isGuozhan = get.mode() === "guozhan";
	const isDoudizhuOnline = lib.config.mode === "doudizhu" && _status.mode === "online";
	if (player.singleHp === true && !isGuozhan && !isDoudizhuOnline) {
		player.doubleDraw();
	}

	player._start_cards = player.getCards("h");
};

/**
 * 执行换牌操作
 */
const exchangeCards = event => {
	const handCards = game.me.getCards("h");
	const count = handCards.length;
	const { otherPile } = event;
	const playerId = game.me.playerid;

	// 记录弃牌
	game.addVideo("lose", game.me, [get.cardsInfo(handCards), [], [], []]);

	// 弃置当前手牌
	handCards.forEach(card => {
		card.removeGaintag(true);
		otherPile?.[playerId]?.discard?.(card) ?? card.discard(false);
	});

	// 获取新手牌
	const newCards = [];
	const otherGetCards = otherPile?.[playerId]?.getCards;
	if (otherGetCards) newCards.addArray(otherGetCards(count));
	if (newCards.length < count) newCards.addArray(get.cards(count - newCards.length));

	// 分配新手牌
	const gaintag = event.gaintag?.[playerId];
	if (gaintag) {
		const list = typeof gaintag === "function" ? gaintag(count, newCards) : [[newCards, gaintag]];
		for (let i = list.length - 1; i >= 0; i--) {
			game.me.directgain(list[i][0], null, list[i][1]);
		}
	} else {
		game.me.directgain(newCards);
	}

	game.me._start_cards = game.me.getCards("h");
};

// ==================== 初始化入口 ====================

/** 初始化手气卡换牌功能 */
export function setupLuckyCard() {
	if (!lib.config["extension_十周年UI_luckycard"]) return;

	/** 游戏开局摸牌主逻辑 */
	lib.element.content.gameDraw = async function () {
		const event = get.event();
		const player = _status.event.player || event.player;
		const { num } = event;

		if (_status.brawl?.noGameDraw) return;

		// 所有玩家依次摸牌
		let currentPlayer = player;
		do {
			processPlayerDraw(currentPlayer, num, event);
			currentPlayer = currentPlayer.next;
		} while (currentPlayer !== player);

		// 处理换牌逻辑
		let changeCard = isChangeCardDisabled() ? "disabled" : get.config("change_card");
		const canChange = changeCard !== "disabled" && !_status.auto && game.me.countCards("h");

		if (canChange) {
			const useCardPrompt = lib.config["extension_十周年UI_cardPrompt"];
			let remainingChanges = 5;
			let luckyCards = 10000 + Math.floor(Math.random() * 90000);

			_status.imchoosing = true;

			while (remainingChanges > 0) {
				const str = `本场还可更换<span style="color:#00c853">${remainingChanges}次</span>手牌(剩余${luckyCards}张手气卡)`;
				showChangeCardTimer();

				const { bool } = await createChangeCardPromise(event, str, useCardPrompt);
				if (!bool) break;

				// 更新换牌次数限制
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
}
