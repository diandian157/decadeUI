/**
 * @fileoverview Player卡牌操作覆写模块
 * @description 处理玩家使用、打出、失去卡牌等操作的覆写
 * @module overrides/player/card-actions
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { getBasePlayerMethods, playShowCardAudio } from "./base.js";

/**
 * 使用卡牌覆写
 * @description 在原有逻辑基础上添加出牌音效和目标高亮效果
 * @returns {Object} 事件对象
 * @this {Object} 玩家对象
 */
export function playerUseCard() {
	const base = getBasePlayerMethods();
	const event = base.useCard.apply(this, arguments);

	// 播放出牌音效
	playShowCardAudio();

	// 添加目标高亮处理器
	event.pushHandler("decadeUI_TargetHighlight", (event, option) => {
		if (option.state === "begin" && event.step === 1 && !event.hideTargets) {
			event.targets?.forEach(target => target.classList.add("target"));
		}
	});

	const originalFinish = event.finish;
	event.finish = function () {
		originalFinish?.apply(this, arguments);
		this.targets?.forEach(target => target.classList.remove("target"));
	};

	return event;
}

/**
 * 打出卡牌覆写
 * @description 仅添加出牌音效
 * @returns {*} 原方法返回值
 * @this {Object} 玩家对象
 */
export function playerRespond() {
	playShowCardAudio();
	const base = getBasePlayerMethods();
	return base.respond.apply(this, arguments);
}

/**
 * 失去卡牌覆写
 * @description 为使用/打出卡牌事件设置动画标记
 * @returns {Object} 事件对象
 * @this {Object} 玩家对象
 */
export function playerLose() {
	const base = getBasePlayerMethods();
	const next = base.lose.apply(this, arguments);

	// 获取关联事件
	const event = _status.event?.name === "loseAsync" ? _status.event.getParent() : _status.event;

	// 为使用/打出卡牌设置动画标记
	if (event?.name === "useCard" || event?.name === "respond") {
		next.animate = true;
		next.blameEvent = event;
	}

	return next;
}

/**
 * 使用卡牌动画前覆写
 * @description 处理lose_map以控制是否显示弃牌动画
 * @param {Object} event - 事件对象
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerUseCardAnimateBefore(event) {
	const base = getBasePlayerMethods();
	base.useCardAnimateBefore?.apply(this, arguments);

	if (hasActualLostCards(event)) {
		event.throw = false;
	}
}

/**
 * 响应动画前覆写
 * @description 处理lose_map以控制是否显示弃牌动画
 * @param {Object} event - 事件对象
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerRespondAnimateBefore(event) {
	const base = getBasePlayerMethods();
	base.respondAnimateBefore?.apply(this, arguments);

	if (hasActualLostCards(event)) {
		event.throw = false;
	}
}

/**
 * 装备变化处理覆写
 * @description 同步更新装备栏UI显示
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerHandleEquipChange() {
	const base = getBasePlayerMethods();
	base.$handleEquipChange.apply(this, arguments);

	const player = this;

	if (player !== game.me || !ui.equipSolts) return;

	const extraEquipCount = Array.from(player.node.equips.childNodes).filter(card => ![1, 2, 3, 4, 5].includes(get.equipNum(card))).length;

	const currentExtraSlots = Array.from(ui.equipSolts.back.children).filter(el => el.dataset.type === "5").length;

	let delta = extraEquipCount - currentExtraSlots;

	if (delta > 0) {
		while (delta > 0) {
			delta--;
			const ediv = window.decadeUI.element.create(null, ui.equipSolts.back);
			ediv.dataset.type = 5;
		}
	} else if (delta < 0) {
		for (let i = 0; i > extraEquipCount; i--) {
			const element = Array.from(ui.equipSolts.back.children).find(el => el.dataset.type === "5");
			if (element?.dataset.type === "5") {
				element.remove();
			}
		}
	}
}

/**
 * 检查事件是否有实际失去的卡牌
 * @param {Object} event - 事件对象
 * @returns {boolean} 是否有实际失去的卡牌
 * @private
 */
function hasActualLostCards(event) {
	if (!event.lose_map) return false;

	return Object.keys(event.lose_map).some(item => {
		return item !== "noowner" && event.lose_map[item].length > 0;
	});
}
