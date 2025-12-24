"use strict";

/**
 * 特效对话框模块
 */

import { create, removeChild, isPlayer, getAvatar, getName } from "./utils.js";

/** 创建特效对话框 */
function createDialog() {
	return decadeUI.dialog.create("effect-dialog dui-dialog");
}

/** 创建拼点对话框 */
export function createCompareDialog(source, target) {
	const dialog = createDialog();

	// 创建角色区域
	dialog.characters = [create("player1 character", dialog), create("player2 character", dialog)];
	dialog.characters.forEach(c => create("back", c));

	// 创建内容区域
	dialog.content = create("content", dialog);
	dialog.buttons = create("buttons", dialog.content);
	dialog.cards = [create("player1 card", dialog.buttons), create("player2 card", dialog.buttons)];
	dialog.names = [create("player1 name", dialog.buttons), create("player2 name", dialog.buttons)];
	dialog.buttons.vs = create("vs", dialog.buttons);

	// 初始化名称
	dialog.names[0].innerHTML = `${getName(source)}发起`;
	dialog.names[1].innerHTML = getName(target);

	// 属性映射
	const playerMap = { player1: 0, source: 0, player2: 1, target: 1 };
	const cardMap = { card1: 0, sourceCard: 0, card2: 1, targetCard: 1 };

	// 设置方法
	dialog.set = (attr, value) => {
		// 设置玩家
		if (attr in playerMap) {
			const idx = playerMap[attr];
			const suffix = idx === 0 ? "发起" : "";

			if (!isPlayer(value) || value.isUnseen()) {
				dialog.characters[idx].firstChild.style.backgroundImage = "";
				dialog.names[idx].innerHTML = `${getName(value)}${suffix}`;
				return false;
			}

			const avatar = getAvatar(value, value.isUnseen(0));
			dialog.characters[idx].firstChild.style.backgroundImage = avatar.style.backgroundImage;
			dialog.names[idx].innerHTML = `${getName(value)}${suffix}`;
			return true;
		}

		// 设置卡牌
		if (attr in cardMap) {
			const idx = cardMap[attr];
			removeChild(dialog.cards[idx], dialog.cards[idx].firstChild);
			dialog.cards[idx].appendChild(value);
			return true;
		}

		return false;
	};

	dialog.set("source", source);
	dialog.set("target", target);
	return dialog;
}
