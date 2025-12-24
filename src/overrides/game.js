/**
 * Game 覆写模块
 * @description 游戏相关的覆写方法
 */

import { lib, game, ui, get, _status } from "noname";

// 基础方法引用
let baseGameMethods = null;

/**
 * 设置基础方法引用
 */
export function setBaseGameMethods(methods) {
	baseGameMethods = methods;
}

/**
 * 交换座位覆写
 */
export function gameSwapSeat(player1, player2, prompt, behind, noanimate) {
	baseGameMethods.swapSeat.apply(this, arguments);
	player1.seat = player1.getSeatNum();
	if (player1.node.seat) player1.node.seat.innerHTML = get.cnNumber(player1.seat, true);
	player2.seat = player2.getSeatNum();
	if (player2.node.seat) player2.node.seat.innerHTML = get.cnNumber(player2.seat, true);
}

/**
 * 交换玩家覆写
 */
export function gameSwapPlayer(player, player2) {
	const list = [game.me, player];
	const result = baseGameMethods.swapPlayer.call(this, player, player2);

	// 单独装备栏
	if (lib.config.extension_十周年UI_aloneEquip && game.me && game.me !== ui.equipSolts?.me) {
		ui.equipSolts.me.appendChild(ui.equipSolts.equips);
		ui.equipSolts.me = game.me;
		ui.equipSolts.equips = game.me.node.equips;
		ui.equipSolts.appendChild(game.me.node.equips);
		game.me.$syncExpand();
	}

	// 可见手牌显示
	list.forEach(i => i.decadeUI_updateShowCards());
	if (lib.refreshPlayerSkills) {
		list.forEach(i => lib.refreshPlayerSkills(i));
	}
	if (lib.clearAllSkillDisplay) lib.clearAllSkillDisplay();
	if (lib.refreshPlayerSkills) {
		game.players.concat(game.dead || []).forEach(i => lib.refreshPlayerSkills(i));
	}
	return result;
}

/**
 * 交换控制覆写
 */
export function gameSwapControl(player) {
	const result = baseGameMethods.swapControl.call(this, player);

	// 单独装备栏
	if (lib.config.extension_十周年UI_aloneEquip && game.me && game.me !== ui.equipSolts?.me) {
		ui.equipSolts.me.appendChild(ui.equipSolts.equips);
		ui.equipSolts.me = game.me;
		ui.equipSolts.equips = game.me.node.equips;
		ui.equipSolts.appendChild(game.me.node.equips);
		game.me.$syncExpand();
	}

	if (ui.equipSolts) {
		if (game.me && typeof game.me.$handleEquipChange === "function") {
			game.me.$handleEquipChange();
		}
		if (player && typeof player.$handleEquipChange === "function") {
			player.$handleEquipChange();
		}
	}

	// 可见手牌显示
	player.decadeUI_updateShowCards();
	if (lib.refreshPlayerSkills) {
		lib.refreshPlayerSkills(player);
		if (game.me) lib.refreshPlayerSkills(game.me);
	}
	if (lib.clearAllSkillDisplay) lib.clearAllSkillDisplay();
	if (lib.refreshPlayerSkills) {
		game.players.concat(game.dead || []).forEach(i => lib.refreshPlayerSkills(i));
	}
	return result;
}

/**
 * 添加全局技能覆写
 */
export function gameAddGlobalSkill() {
	const result = baseGameMethods.addGlobalSkill.apply(this, arguments);
	[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
	return result;
}

/**
 * 移除全局技能覆写
 */
export function gameRemoveGlobalSkill() {
	const result = baseGameMethods.removeGlobalSkill.apply(this, arguments);
	[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
	return result;
}

/**
 * 应用game覆写
 */
export function applyGameOverrides() {
	// 基础方法在外部设置
}
