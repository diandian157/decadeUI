/**
 * @fileoverview 手气卡换牌模块 - 现代异步版本
 * @description 游戏开局时允许玩家更换手牌，前3次免费，之后消耗手气卡
 */

import { lib, game, ui, get, _status } from "noname";

/**
 * UI工具类 - 管理换牌界面的显示和交互
 */
class LuckyCardUI {
	/** @type {number} 免费换牌次数 */
	static FREE_CHANGES = 3;

	/** 清除所有计时器 */
	static clearTimers() {
		["timer", "timer2"].forEach(timerName => {
			if (window[timerName]) {
				clearInterval(window[timerName]);
				delete window[timerName];
			}
		});
	}

	/** 移除进度条 */
	static removeProgressBar() {
		document.getElementById("jindutiaopl")?.remove();
	}

	/** 显示计时器 */
	static showTimer() {
		this.clearTimers();
		this.removeProgressBar();
		if (lib.config.extension_十周年UI_jindutiaoYangshi !== "0") {
			game.Jindutiaoplayer?.();
		}
	}

	/** 隐藏计时器 */
	static hideTimer() {
		this.clearTimers();
		this.removeProgressBar();
	}

	/** 关闭卡牌对话框 */
	static closeCardDialog() {
		if (ui.cardDialog) {
			delete ui.cardDialog._isLuckyCardTip;
			ui.cardDialog.close();
			delete ui.cardDialog;
		}
	}

	/**
	 * 移除HTML标签
	 * @param {string} text - 原始文本
	 * @returns {string} 纯文本
	 */
	static stripTags(text) {
		return typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "";
	}

	/** 设置确认按钮文案为"换牌" */
	static setupConfirmButton() {
		if (!ui.confirm?.childNodes?.length) return;
		if (lib.config.extension_十周年UI_newDecadeStyle === "off") return;

		const btn = ui.confirm.childNodes[0];
		if (btn?.link === "ok") {
			btn.innerHTML = "换牌";
		}
	}

	/**
	 * 生成提示文案
	 * @param {number} freeChanges - 剩余免费次数
	 * @param {number} luckyCards - 剩余手气卡数量
	 * @returns {string} HTML格式的提示文本
	 */
	static getPromptText(freeChanges, luckyCards) {
		if (freeChanges > 0) {
			return `本场还可免费更换<span style='color:#00c853'>${freeChanges}次</span>手牌(剩余${luckyCards}张手气卡)`;
		}
		return `每次更换消耗一张手气卡(剩余<span style='color:#00c853'>${luckyCards}</span>张手气卡)`;
	}

	/**
	 * 判断是否还能换牌
	 * @param {number} freeChanges - 剩余免费次数
	 * @param {number} luckyCards - 剩余手气卡数量
	 * @returns {boolean}
	 */
	static canChange(freeChanges, luckyCards) {
		return freeChanges > 0 || luckyCards > 0;
	}

	/**
	 * 显示换牌对话框
	 * @param {string} promptText - 提示文本
	 * @returns {Object|null} 对话框对象
	 */
	static showDialog(promptText) {
		this.showTimer();

		// 优先使用十周年UI的手牌提示
		if (typeof decadeUI?.showHandTip === "function") {
			this.closeCardDialog();
			const tip = (ui.cardDialog = decadeUI.showHandTip());
			tip._isLuckyCardTip = true; // 标记避免被其他钩子清理
			tip.appendText(this.stripTags(promptText));
			tip.strokeText();
			tip.show();
			return null;
		}

		// 降级方案：使用标准对话框
		return ui.create.dialog(promptText);
	}

	/** 清理所有UI元素 */
	static cleanup(dialog) {
		this.hideTimer();
		this.closeCardDialog();
		dialog?.close();
		ui.confirm?.close();
	}
}

/**
 * 游戏逻辑类 - 处理发牌和换牌逻辑
 */
class GameDrawLogic {
	/**
	 * 为单个玩家发牌
	 * @param {Object} player - 玩家对象
	 * @param {number|Function} num - 发牌数量或计算函数
	 * @param {Object} context - 上下文对象
	 */
	static dealCardsToPlayer(player, num, context) {
		const numx = typeof num === "function" ? num(player) : num;
		const cards = [];
		const otherGetCards = context.otherPile?.[player.playerid]?.getCards;

		// 获取卡牌
		if (otherGetCards) {
			cards.addArray(otherGetCards(numx));
		} else if (player.getTopCards) {
			cards.addArray(player.getTopCards(numx));
		} else {
			cards.addArray(get.cards(numx));
		}

		// 处理卡牌标签
		if (context.gaintag?.[player.playerid]) {
			const gaintag = context.gaintag[player.playerid];
			const list = typeof gaintag === "function" ? gaintag(numx, cards) : [[cards, gaintag]];

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

		// 单体力武将双倍摸牌
		if (player.singleHp === true && get.mode() !== "guozhan" && (lib.config.mode !== "doudizhu" || _status.mode !== "online")) {
			player.doubleDraw();
		}

		player._start_cards = player.getCards("h");
	}

	/**
	 * 为所有玩家发牌
	 * @param {Object} player - 起始玩家
	 * @param {number|Function} num - 发牌数量
	 * @param {Object} context - 上下文对象
	 */
	static dealCardsToAll(player, num, context) {
		const end = player;
		do {
			this.dealCardsToPlayer(player, num, context);
			player = player.next;
		} while (player !== end);
	}

	/**
	 * 检查是否允许换牌
	 * @param {Object} context - 上下文对象
	 * @returns {boolean}
	 */
	static canShowChangeDialog(context) {
		return (
			context.changeCard !== "disabled" &&
			!_status.auto &&
			game.me.countCards("h") > 0 &&
			LuckyCardUI.canChange(context.freeChanges, context.luckyCards)
		);
	}

	/**
	 * 执行换牌操作
	 * @param {Object} context - 上下文对象
	 */
	static performCardChange(context) {
		game.changeCoin?.(-3);

		const hs = game.me.getCards("h");
		const cards = [];
		const otherGetCards = context.otherPile?.[game.me.playerid]?.getCards;
		const otherDiscard = context.otherPile?.[game.me.playerid]?.discard;

		// 弃置旧手牌
		game.addVideo("lose", game.me, [get.cardsInfo(hs), [], [], []]);
		for (const card of hs) {
			card.removeGaintag(true);
			otherDiscard ? otherDiscard(card) : card.discard(false);
		}

		// 获取新手牌
		if (otherGetCards) {
			cards.addArray(otherGetCards(hs.length));
		} else {
			cards.addArray(get.cards(hs.length));
		}

		// 处理卡牌标签
		if (context.gaintag?.[game.me.playerid]) {
			const gaintag = context.gaintag[game.me.playerid];
			const list = typeof gaintag === "function" ? gaintag(hs.length, cards) : [[cards, gaintag]];

			for (let i = list.length - 1; i >= 0; i--) {
				game.me.directgain(list[i][0], null, list[i][1]);
			}
		} else {
			game.me.directgain(cards);
		}

		game.me._start_cards = game.me.getCards("h");

		// 消耗资源
		if (context.freeChanges > 0) {
			context.freeChanges--;
		} else {
			context.luckyCards--;
		}
	}
}

/**
 * 等待玩家确认
 * @returns {Promise<boolean>} 玩家是否选择换牌
 */
function waitForPlayerConfirm() {
	return new Promise(resolve => {
		_status.imchoosing = true;

		// 设置自动跳过回调
		const context = _status.event;
		context.switchToAuto = () => {
			_status.imchoosing = false;
			resolve(false);
		};

		// 设置确认按钮回调
		context.custom.replace.confirm = bool => {
			_status.imchoosing = false;
			_status.event.bool = bool;
			resolve(bool);
			game.resume();
		};

		game.pause();
	});
}

/**
 * 换牌流程主循环
 * @param {Object} context - 上下文对象
 */
async function cardChangeLoop(context) {
	while (GameDrawLogic.canShowChangeDialog(context)) {
		// 显示换牌对话框
		const promptText = LuckyCardUI.getPromptText(context.freeChanges, context.luckyCards);
		const dialog = LuckyCardUI.showDialog(promptText);

		ui.create.confirm("oc");
		LuckyCardUI.setupConfirmButton();

		// 等待玩家选择
		const wantsChange = await waitForPlayerConfirm();

		// 更新换牌次数限制
		if (context.changeCard === "once") {
			context.changeCard = "disabled";
		} else if (context.changeCard === "twice") {
			context.changeCard = "once";
		}

		if (wantsChange) {
			// 执行换牌
			GameDrawLogic.performCardChange(context);
			LuckyCardUI.cleanup(dialog);

			// 检查是否还能继续换牌
			if (context.changeCard === "disabled" || !LuckyCardUI.canChange(context.freeChanges, context.luckyCards)) {
				break;
			}
		} else {
			// 玩家取消换牌
			LuckyCardUI.cleanup(dialog);
			game.me._start_cards = game.me.getCards("h");
			break;
		}
	}

	// 触发游戏开始特效
	setTimeout(() => decadeUI.effect?.gameStart?.(), 51);
}

/**
 * 初始化手气卡换牌功能
 */
export function setupLuckyCard() {
	// 挂载工具类到 lib，保持向后兼容
	lib._luckyCard = LuckyCardUI;

	/**
	 * 重写游戏发牌逻辑
	 * 使用现代 async/await 替代 step 编译器
	 */
	lib.element.content.gameDraw = async function () {
		// 检查是否禁用发牌
		if (_status.brawl?.noGameDraw) {
			return;
		}

		// 上下文对象，包含所有状态
		const context = {
			player: this.player,
			num: this.num,
			otherPile: this.otherPile,
			gaintag: this.gaintag,
			changeCard: get.config("change_card"),
			freeChanges: LuckyCardUI.FREE_CHANGES,
			luckyCards: 10000 + Math.floor(Math.random() * 90000), // 虚拟手气卡数量
		};

		// 为所有玩家发牌
		GameDrawLogic.dealCardsToAll(context.player, context.num, context);

		// 检查是否禁用换牌功能
		if (
			_status.connectMode ||
			(lib.config.mode === "single" && _status.mode !== "wuxianhuoli") ||
			(lib.config.mode === "doudizhu" && _status.mode === "online") ||
			!["identity", "guozhan", "doudizhu", "single"].includes(lib.config.mode)
		) {
			context.changeCard = "disabled";
		}

		// 执行换牌流程
		if (GameDrawLogic.canShowChangeDialog(context)) {
			await cardChangeLoop(context);
		} else {
			setTimeout(() => decadeUI.effect?.gameStart?.(), 51);
		}
	};
}
