/**
 * 控制按钮模块
 */

// 牌堆统计弹窗
export function showCardPileStatistics() {
	if (!_status.gameStarted) return;
	game.pause2();

	// 收集卡牌信息
	const cardsInfo = game.players
		.map(p => p.get("h"))
		.flat(Infinity)
		.concat(...ui.cardPile.childNodes)
		.concat(...ui.discardPile.childNodes)
		.map(card => ({
			name: card.name,
			suit: card.suit,
			number: card.number,
			nature: get.translation(card.nature),
			color: get.color(card),
			type: get.translation(get.type(card), "trick"),
			translate: lib.translate[card.name],
			link: card,
		}));

	// 统计数据
	const stats = {
		杀: { num: 0, type: "基本" },
		火杀: { num: 0, type: "基本" },
		雷杀: { num: 0, type: "基本" },
		红杀: { num: 0, type: "基本" },
		黑杀: { num: 0, type: "基本" },
		"黑桃2~9": { num: 0, type: "花色" },
	};

	const typeList = ["点数", "花色"];

	cardsInfo.forEach(card => {
		typeList.add(card.type);

		// 统计卡牌名
		if (!stats[card.translate]) {
			stats[card.translate] = { num: 0, type: card.type };
		}
		// 统计花色
		const suitName = get.translation(card.suit);
		if (!stats[suitName]) {
			stats[suitName] = { num: 0, type: "花色" };
		}
		// 统计点数
		if (!stats[card.number]) {
			stats[card.number] = { num: 0, type: "点数" };
		}

		if (ui.cardPile.contains(card.link)) {
			stats[card.translate].num++;
			stats[suitName].num++;
			stats[card.number].num++;

			if (card.name === "sha") {
				if (card.color === "black") {
					stats["黑杀"].num++;
					if (card.suit === "spade" && card.number >= 2 && card.number <= 9) {
						stats["黑桃2~9"].num++;
					}
				} else if (card.color === "red") {
					stats["红杀"].num++;
				}
			}
		}

		if (card.nature) {
			const natureName = card.nature + card.translate;
			if (!stats[natureName]) {
				stats[natureName] = { num: 0, type: card.type };
			}
			if (ui.cardPile.contains(card.link)) {
				stats[natureName].num++;
			}
		}
	});

	// 创建弹窗
	const container = ui.create.div(
		".popup-container",
		ui.window,
		{
			zIndex: 10,
			background: "rgb(0,0,0,.3)",
		},
		function () {
			this.delete(500);
			game.resume2();
		}
	);

	const panel = ui.create.div(".card-statistics", "卡牌计数器", container);
	const title = ui.create.div(".card-statistics-title", panel);
	const content = ui.create.div(".card-statistics-content", panel);

	typeList.forEach(type => {
		ui.create.div(title, "", type);
		content[type] = ui.create.div(content, "");
	});

	Object.entries(stats).forEach(([name, data]) => {
		const items = ui.create.div(".items");
		ui.create.div(".item", name, items);
		ui.create.div(".item-num", `X${data.num}`, items);
		content[data.type].appendChild(items);
	});
}

// 手牌排序
export function sortHandCards() {
	if (!game.me || game.me.hasSkillTag("noSortCard")) return;

	const cards = game.me.getCards("hs");
	if (cards.length <= 1) return;

	const sortFn = (a, b) => {
		const order = { basic: 0, trick: 1, delay: 1, equip: 2 };
		const ta = get.type(a);
		const tb = get.type(b);
		const ca = order[ta] ?? 99;
		const cb = order[tb] ?? 99;

		if (ca !== cb) return ca - cb;
		if (a.name !== b.name) return lib.sort.card(a.name, b.name);
		if (a.suit !== b.suit) return lib.suit.indexOf(a.suit) - lib.suit.indexOf(b.suit);
		return a.number - b.number;
	};

	cards.sort(sortFn);
	cards.forEach(card => {
		game.me.node.handcards1.insertBefore(card, game.me.node.handcards1.firstChild);
	});

	dui.queueNextFrameTick(dui.layoutHand, dui);
}

// 自动排序控制
export const AutoSort = {
	start() {
		if (!game.me || game.me.hasSkillTag("noSortCard")) return;

		const container = game.me.node?.handcards1;
		if (!container) return;

		this.stop();

		ui._autoPaixuEnabled = true;
		ui._autoPaixuContainer = container;
		ui._autoPaixuLastCount = container.childNodes.length || 0;
		ui._autoPaixuSorting = false;

		// 监听手牌变化
		ui._autoPaixuObserver = new MutationObserver(() => {
			if (ui._autoPaixuSorting) return;

			clearTimeout(ui._autoPaixuDebounce);
			ui._autoPaixuDebounce = setTimeout(() => {
				if (!game.me?.node?.handcards1) return;

				const curCount = game.me.node.handcards1.childNodes.length || 0;
				if (ui._autoPaixuLastCount !== null && curCount < ui._autoPaixuLastCount) {
					ui._autoPaixuLastCount = curCount;
					return;
				}

				const cards = game.me.getCards("hs");
				if (cards.length > 1) {
					ui._autoPaixuSorting = true;
					sortHandCards();
					ui._autoPaixuLastCount = game.me.node.handcards1.childNodes.length || 0;
					setTimeout(() => (ui._autoPaixuSorting = false), 0);
				}
			}, 180);
		});

		ui._autoPaixuObserver.observe(container, { childList: true, subtree: true });

		// 定期检查
		ui._autoPaixuKeeper = setInterval(() => {
			if (!ui._autoPaixuEnabled || !game.me?.node) return;

			const cur = game.me.node.handcards1;
			if (!cur) return;

			if (cur !== ui._autoPaixuContainer) {
				ui._autoPaixuContainer = cur;
				ui._autoPaixuLastCount = cur.childNodes.length || 0;
				ui._autoPaixuObserver?.disconnect();
				ui._autoPaixuObserver.observe(cur, { childList: true, subtree: true });
			}

			const nowCount = cur.childNodes.length || 0;
			if (nowCount !== ui._autoPaixuLastCount) {
				const prev = ui._autoPaixuLastCount;
				ui._autoPaixuLastCount = nowCount;
				if (nowCount > prev && !ui._autoPaixuSorting) {
					setTimeout(sortHandCards, 120);
				}
			}
		}, 600);

		sortHandCards();
	},

	stop() {
		ui._autoPaixuObserver?.disconnect();
		ui._autoPaixuObserver = null;
		clearTimeout(ui._autoPaixuDebounce);
		ui._autoPaixuDebounce = null;
		clearInterval(ui._autoPaixuKeeper);
		ui._autoPaixuKeeper = null;
		ui._autoPaixuSorting = false;
		ui._autoPaixuEnabled = false;
	},
};

// 距离显示
export const DistanceDisplay = {
	show() {
		this.close();
		this._lastMe = game.me;

		game.players?.forEach(player => {
			if (player !== game.me) {
				const distance = get.distance(game.me, player);
				const text = distance === Infinity ? "∞" : distance.toString();
				player._distanceDisplay = ui.create.div(".distance-display", `(距离:${text})`, player);
			}
		});

		this._interval = setInterval(() => this.update(), 1000);
	},

	update() {
		if (this._lastMe !== game.me) {
			this._lastMe = game.me;
			this.close();
			this.show();
			return;
		}

		game.players?.forEach(player => {
			if (player !== game.me && player._distanceDisplay) {
				const distance = get.distance(game.me, player);
				const text = distance === Infinity ? "∞" : distance.toString();
				player._distanceDisplay.innerHTML = `(距离:${text})`;
			}
		});
	},

	close() {
		game.players?.forEach(player => {
			if (player._distanceDisplay) {
				player._distanceDisplay.remove();
				player._distanceDisplay = null;
			}
		});
		clearInterval(this._interval);
		this._interval = null;
	},
};

// 确认按钮点击
export function handleConfirm(link, target) {
	if (link === "ok") {
		ui.click.ok(target);
	} else if (link === "cancel") {
		ui.click.cancel(target);
	} else if (target.custom) {
		target.custom(link);
	}
}
