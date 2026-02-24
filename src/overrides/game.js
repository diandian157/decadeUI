/**
 * Game覆写模块
 */
import { lib, game, ui, get } from "noname";
import { wrapAfter } from "../utils/safeOverride.js";

export function applyGameOverrides() {
	const restoreFns = [];

	// 交换座位后更新座位号显示
	restoreFns.push(
		wrapAfter(game, "swapSeat", function (result, player1, player2) {
			if (player1) {
				player1.seat = player1.getSeatNum();
				if (player1.node.seat) {
					player1.node.seat.innerHTML = get.cnNumber(player1.seat, true);
				}
			}
			if (player2) {
				player2.seat = player2.getSeatNum();
				if (player2.node.seat) {
					player2.node.seat.innerHTML = get.cnNumber(player2.seat, true);
				}
			}
		})
	);

	// 交换玩家后同步装备栏和手牌显示
	restoreFns.push(
		wrapAfter(game, "swapPlayer", function (result, player) {
			const list = [game.me, player].filter(Boolean);

			if (lib.config.extension_十周年UI_aloneEquip && game.me && ui.equipSolts && game.me !== ui.equipSolts.me) {
				ui.equipSolts.me.appendChild(ui.equipSolts.equips);
				ui.equipSolts.me = game.me;
				ui.equipSolts.equips = game.me.node.equips;
				ui.equipSolts.appendChild(game.me.node.equips);
				if (typeof game.me.$syncExpand === "function") {
					game.me.$syncExpand();
				}
			}

			list.forEach(p => {
				if (typeof p.decadeUI_updateShowCards === "function") {
					p.decadeUI_updateShowCards();
				}
			});

			if (lib.refreshPlayerSkills) {
				list.forEach(p => lib.refreshPlayerSkills(p));
			}
			if (lib.clearAllSkillDisplay) {
				lib.clearAllSkillDisplay();
			}
			if (lib.refreshPlayerSkills) {
				const allPlayers = game.players.concat(game.dead || []);
				allPlayers.forEach(p => lib.refreshPlayerSkills(p));
			}
		})
	);

	// 交换控制后同步装备栏和手牌显示
	restoreFns.push(
		wrapAfter(game, "swapControl", function (result, player) {
			if (lib.config.extension_十周年UI_aloneEquip && game.me && ui.equipSolts && game.me !== ui.equipSolts.me) {
				ui.equipSolts.me.appendChild(ui.equipSolts.equips);
				ui.equipSolts.me = game.me;
				ui.equipSolts.equips = game.me.node.equips;
				ui.equipSolts.appendChild(game.me.node.equips);
				if (typeof game.me.$syncExpand === "function") {
					game.me.$syncExpand();
				}
			}

			if (ui.equipSolts) {
				if (game.me && typeof game.me.$handleEquipChange === "function") {
					game.me.$handleEquipChange();
				}
				if (player && typeof player.$handleEquipChange === "function") {
					player.$handleEquipChange();
				}
			}

			if (player && typeof player.decadeUI_updateShowCards === "function") {
				player.decadeUI_updateShowCards();
			}

			if (lib.refreshPlayerSkills) {
				if (player) lib.refreshPlayerSkills(player);
				if (game.me) lib.refreshPlayerSkills(game.me);
			}
			if (lib.clearAllSkillDisplay) {
				lib.clearAllSkillDisplay();
			}
			if (lib.refreshPlayerSkills) {
				const allPlayers = game.players.concat(game.dead || []);
				allPlayers.forEach(p => lib.refreshPlayerSkills(p));
			}
		})
	);

	// 添加全局技能后更新手牌显示
	restoreFns.push(
		wrapAfter(game, "addGlobalSkill", function () {
			const allPlayers = [...game.players, ...(game.dead || [])];
			allPlayers.forEach(p => {
				if (typeof p.decadeUI_updateShowCards === "function") {
					p.decadeUI_updateShowCards();
				}
			});
		})
	);

	// 移除全局技能后更新手牌显示
	restoreFns.push(
		wrapAfter(game, "removeGlobalSkill", function () {
			const allPlayers = [...game.players, ...(game.dead || [])];
			allPlayers.forEach(p => {
				if (typeof p.decadeUI_updateShowCards === "function") {
					p.decadeUI_updateShowCards();
				}
			});
		})
	);

	return restoreFns;
}

/**
 * 日志记录完全替换（类型A覆写，保持不变）
 * 此函数需要在外部手动应用到 game.logv
 * @param {Object} player - 玩家
 * @param {*} card - 卡牌
 * @param {Array} targets - 目标
 * @param {Object} event - 事件
 * @param {boolean} forced - 是否强制
 * @param {string} logvid - 日志ID
 * @returns {HTMLElement|undefined} 日志节点
 */
export function gameLogv(player, card, targets, event, forced, logvid) {
	const { _status, ui } = window;

	if (!player) {
		player = _status.event.getParent().logvid;
		if (!player) return;
	}
	const node = ui.create.div(".hidden");
	node.node = {};
	logvid = logvid || get.id();
	game.broadcast(
		(player, card, targets, event, forced, logvid) => game.logv(player, card, targets, event, forced, logvid),
		player,
		card,
		targets,
		event,
		forced,
		logvid
	);
	if (typeof player == "string") {
		const childNode = Array.from(ui.historybar.childNodes).find(value => value.logvid == player);
		if (childNode) childNode.added.push(card);
		return;
	}
	if (typeof card == "string") {
		if (card != "die") {
			if (lib.skill[card] && lib.skill[card].logv === false && !forced) return;
			if (!lib.translate[card]) return;
		}
		let avatar;
		if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
		else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
		else return;
		node.node.avatar = avatar;
		avatar.style.transform = "";
		avatar.className = "avatar";
		if (card == "die") {
			node.dead = true;
			node.player = player;
			const avatar2 = avatar.cloneNode();
			avatar2.className = "avatarbg grayscale1";
			avatar.appendChild(avatar2);
			avatar.style.opacity = 0.6;
		} else {
			node.node.text = ui.create.div("", get.translation(card, "skill"), avatar);
			node.node.text.dataset.nature = "water";
			node.skill = card;
		}
		node.appendChild(avatar);
		if (card == "die" && targets && targets != player) {
			node.source = targets;
			player = targets;
			if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
			else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
			else if (get.mode() == "guozhan" && player.node && player.node.name_seat) {
				avatar = ui.create.div(".avatar.cardbg");
				avatar.innerHTML = player.node.name_seat.innerHTML[0];
			} else return;
			avatar.style.transform = "";
			node.node.avatar2 = avatar;
			avatar.classList.add("avatar2");
			node.appendChild(avatar);
		}
	} else if (Array.isArray(card)) {
		node.cards = card[1].slice(0);
		card = card[0];
		const info = [card.suit || "", card.number || "", card.name || "", card.nature || ""];
		if (!Array.isArray(node.cards) || !node.cards.length) {
			node.cards = [ui.create.card(node, "noclick", true).init(info)];
		}
		if (card.name == "wuxie") {
			if (ui.historybar.firstChild && ui.historybar.firstChild.type == "wuxie") {
				ui.historybar.firstChild.players.push(player);
				ui.historybar.firstChild.cards.addArray(node.cards);
				return;
			}
			node.type = "wuxie";
			node.players = [player];
		}
		if (card.copy) card.copy(node, false);
		else {
			card = ui.create.card(node, "noclick", true);
			card.init(info);
		}
		let avatar;
		if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
		else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
		else if (get.mode() == "guozhan" && player.node && player.node.name_seat) {
			avatar = ui.create.div(".avatar.cardbg");
			avatar.innerHTML = player.node.name_seat.innerHTML[0];
		} else return;
		node.node.avatar = avatar;
		avatar.style.transform = "";
		avatar.classList.add("avatar2");
		node.appendChild(avatar);
		if (targets && targets.length == 1 && targets[0] != player && get.itemtype(targets[0]) == "player")
			(() => {
				let avatar2;
				const target = targets[0];
				if (!target.isUnseen(0)) {
					avatar2 = target.node.avatar.cloneNode();
				} else if (!player.isUnseen(1)) {
					avatar2 = target.node.avatar2.cloneNode();
				} else if (get.mode() == "guozhan" && target.node && target.node.name_seat) {
					avatar2 = ui.create.div(".avatar.cardbg");
					avatar2.innerHTML = target.node.name_seat.innerHTML[0];
				} else {
					return;
				}
				node.node.avatar2 = avatar2;
				avatar2.style.transform = "";
				avatar2.classList.add("avatar2");
				avatar2.classList.add("avatar3");
				node.insertBefore(avatar2, avatar);
			})();
	}
	if (targets && targets.length) {
		if (targets.length == 1 && targets[0] == player) {
			node.targets = [];
		} else {
			node.targets = targets;
		}
	}
	const bounds = window.decadeUI.boundsCaches.window;
	bounds.check();
	const fullheight = bounds.height,
		num = Math.round((fullheight - 8) / 50),
		margin = (fullheight - 42 * num) / (num + 1);
	node.style.transform = "scale(0.8)";
	ui.historybar.insertBefore(node, ui.historybar.firstChild);
	ui.refresh(node);
	node.classList.remove("hidden");
	Array.from(ui.historybar.childNodes).forEach((value, index) => {
		if (index < num) {
			value.style.transform = `scale(1) translateY(${margin + index * (42 + margin) - 4}px)`;
			return;
		}
		if (value.removetimeout) return;
		value.style.opacity = 0;
		value.style.transform = `scale(1) translateY(${fullheight}px)`;
		value.removetimeout = setTimeout(
			(
				current => () =>
					current.remove()
			)(value),
			500
		);
	});
	if (lib.config.touchscreen) node.addEventListener("touchstart", ui.click.intro);
	else {
		node.addEventListener(lib.config.pop_logv ? "mousemove" : "click", ui.click.logv);
		node.addEventListener("mouseleave", ui.click.logvleave);
	}
	node.logvid = logvid;
	node.added = [];
	if (!game.online) {
		event = event || _status.event;
		event.logvid = node.logvid;
	}
	return node;
}
