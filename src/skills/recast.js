/**
 * @fileoverview 重铸交互模块
 * 实现可重铸卡牌的"使用/重铸"合并交互逻辑
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 检查卡牌是否为可重铸卡牌
 * 优先使用本体的 cardRecastable mod，确保与其他扩展兼容
 * @param {Object} card - 卡牌对象
 * @param {Object} [player] - 玩家对象，默认为卡牌拥有者
 * @returns {boolean} 是否为可重铸卡牌
 */
export function isRecastableCard(card, player) {
	player = player || get.owner(card);
	if (player?.canRecast) {
		return player.canRecast(card, null, true);
	}
	const info = get.info(card);
	if (!info) return false;
	const recastable = info.recastable || info.chongzhu;
	return typeof recastable === "function" ? !!recastable(_status.event, player) : !!recastable;
}

/**
 * 检查卡牌是否为玩家的真实手牌（排除"视为手牌"的情况）
 * @param {Object} card - 卡牌对象
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否为真实手牌
 */
export function isRealHandCard(card, player) {
	if (!card || !player) return false;
	if (get.position(card) !== "h") return false;
	if (card.classList?.contains("glows")) return false;
	if (card.isCard === false || get.itemtype(card) === "cards") return false;
	return true;
}

/**
 * 检查玩家是否可以重铸指定卡牌
 * @param {Object} card - 卡牌对象
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否可以重铸
 */
export function canRecastCard(card, player) {
	if (!isRecastableCard(card, player)) return false;
	if (!isRealHandCard(card, player)) return false;
	return true;
}

/**
 * 检查卡牌是否被其他技能禁用（排除重铸启用mod的影响）
 * @param {Object} card - 卡牌对象
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否被禁用
 */
export function isCardDisabledForUse(card, player) {
	if (!player) return false;

	// 检查卡牌本身的 enable 条件
	const info = get.info(card);
	if (info?.enable) {
		const enableResult = typeof info.enable === "function" ? info.enable(card, player) : info.enable;
		if (enableResult === false) return true;
	}

	// 临时移除重铸启用mod，检查原始cardEnabled状态
	const skill = lib.skill._decadeUI_recastable_enable;
	const originalMod = skill?.mod;
	if (skill) skill.mod = {};

	let disabled = false;
	try {
		if (game.checkMod(card, player, _status.event, "unchanged", "cardEnabled", player) === false) {
			disabled = true;
		}
		if (!disabled && get.itemtype(card) === "card") {
			if (game.checkMod(card, player, _status.event, "unchanged", "cardEnabled2", player) === false) {
				disabled = true;
			}
		}
	} finally {
		// 恢复mod
		if (skill && originalMod) skill.mod = originalMod;
	}

	return disabled;
}

/**
 * 获取卡牌的原始最小目标数
 * @param {Object|string} card - 卡牌对象或卡牌名
 * @returns {number} 最小目标数
 */
export function getCardMinTarget(card) {
	const info = get.info(card);
	if (!info) return 1;
	// 装备牌默认目标是自己，最小目标数为1
	if (info.type === "equip") return 1;

	const select = info.selectTarget;
	// -1 表示自动选择所有符合条件的目标，视为需要至少1个目标
	if (select === -1) return 1;
	if (Array.isArray(select)) return select[0];
	if (typeof select === "number") return select;
	if (typeof select === "function") {
		try {
			const result = select(card, _status.event?.player);
			if (result === -1) return 1;
			if (Array.isArray(result)) return result[0];
			if (typeof result === "number") return result;
		} catch (e) {}
	}
	return 1;
}

/**
 * 可重铸卡牌无目标时转为重铸
 */
export const recastAnimateSkill = {
	_decadeUI_recastable_recast: {
		trigger: { player: "useCardBefore" },
		forced: true,
		popup: false,
		silent: true,
		priority: Infinity + 1,
		filter(event, player) {
			if (lib.config.extension_十周年UI_newDecadeStyle === "off") return false;
			if (event.targets && event.targets.length > 0) return false;
			const cards = event.cards?.slice() || [];
			if (cards.length === 0) return false;

			const cardOwner = get.owner(cards[0]);
			if (!cardOwner) return false;

			if (player !== cardOwner) return false;

			for (const card of cards) {
				if (!canRecastCard(card, cardOwner)) return false;
			}
			return true;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			trigger.untrigger();
			const cards = trigger.cards.slice();
			await player.recast(cards);
		},
	},
};

/**
 * 被禁用的可重铸卡牌仍可选中
 * 被禁用时不能选目标，只能重铸
 */
export const recastBaseSkill = {
	_decadeUI_recastable_enable: {
		mod: {
			cardEnabled(card, player) {
				if (!player?.isPhaseUsing?.()) return;
				if (!canRecastCard(card, player)) return;
				return true;
			},
			selectTarget(card, player, range) {
				if (!player?.isPhaseUsing?.()) return;
				const selectedCard = ui.selected.cards?.[0];
				if (!selectedCard || !canRecastCard(selectedCard, player)) return;

				// 直接修改 range 数组，允许选择0个目标
				if (Array.isArray(range) && range.length >= 2) {
					range[0] = 0;
					if (range[1] <= -1) {
						const info = get.info(selectedCard);
						if (info?.type === "equip") {
							range[1] = 1;
						} else {
							range[1] = game.players?.length || 8;
						}
					}
				}
			},
			playerEnabled(card, player, target) {
				const selectedCard = ui.selected.cards?.[0];
				if (!selectedCard || !canRecastCard(selectedCard, player)) return;
				if (isCardDisabledForUse(selectedCard, player)) {
					return false;
				}
			},
		},
	},
};

/**
 * 设置可重铸卡牌的交互逻辑
 * @returns {void}
 */
export function setupRecastableCards() {
	if (lib.skill._recasting) {
		const originalFilterCard = lib.skill._recasting.filterCard;
		lib.skill._recasting.filterCard = function (card, player) {
			if (isRecastableCard(card, player)) return false;
			return originalFilterCard.call(this, card, player);
		};
	}

	// 在 checkEnd hook 里控制确认按钮
	if (lib.hooks?.checkEnd) {
		lib.hooks.checkEnd.add("_decadeUI_recastable_check", event => {
			if (!ui.confirm) return;
			const card = get.card();
			if (!card) return;

			const okBtn = ui.confirm.firstChild;
			if (!okBtn || okBtn.link !== "ok") return;

			const selectedCard = ui.selected.cards?.[0];
			const player = event?.player;

			if (!selectedCard || !player || !canRecastCard(selectedCard, player)) return;
			if (event?.name !== "chooseToUse") return;

			if (ui.selected.targets.length === 0) {
				okBtn.innerHTML = "重铸";
				okBtn.classList.remove("disabled");
			} else {
				const minTarget = getCardMinTarget(card);
				okBtn.innerHTML = "确定";
				if (ui.selected.targets.length >= minTarget) {
					okBtn.classList.remove("disabled");
				} else {
					okBtn.classList.add("disabled");
				}
			}
		});
	}

	if (lib.hooks?.uncheckEnd) {
		lib.hooks.uncheckEnd.add("_decadeUI_recastable_confirm_reset", () => {
			if (!ui.confirm) return;
			const okBtn = ui.confirm.firstChild;
			if (okBtn?.innerHTML === "重铸") okBtn.innerHTML = "确定";
		});
	}
}

/**
 * 初始化重铸模块
 * @returns {void}
 */
export function initRecast() {
	if (lib.config.extension_十周年UI_newDecadeStyle === "off") return;

	// 注册动画技能
	for (const key of Object.keys(recastAnimateSkill)) {
		lib.skill[key] = recastAnimateSkill[key];
		game.addGlobalSkill(key);
	}

	// 注册基础技能
	Object.assign(lib.skill, recastBaseSkill);
	game.addGlobalSkill("_decadeUI_recastable_enable");

	// 设置交互逻辑
	setupRecastableCards();

	// 修复有 changeTarget 的可重铸卡牌在 targets 为空时报错的问题
	patchChangeTargetCards();
}

/**
 * 修复有 changeTarget 的可重铸卡牌
 * 当 targets[0] 为 undefined 时，changeTarget 会报错
 */
function patchChangeTargetCards() {
	const cardsToFix = ["lulitongxin"];

	for (const cardName of cardsToFix) {
		const cardInfo = lib.card[cardName];
		if (!cardInfo?.changeTarget) continue;

		const originalChangeTarget = cardInfo.changeTarget;
		cardInfo.changeTarget = function (player, targets) {
			if (!targets[0]) return;
			return originalChangeTarget.call(this, player, targets);
		};
	}
}
