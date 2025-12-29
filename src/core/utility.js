/**
 * @fileoverview 工具模块注册，将各种工具函数挂载到decadeUI对象
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { isMobile, getRandom, getMapElementPos, delayRemoveCards } from "../utils/core.js";
import { getPlayerIdentity } from "../utils/identity.js";
import { BoundsCache, createBoundsCaches } from "../utils/bounds.js";
import { element } from "../utils/element.js";
import { layoutHandDraws, layoutDrawCards } from "../ui/layout-utils.js";
import { cardTempSuitNum, tryAddPlayerCardUseTag } from "../ui/card-utils.js";
import { showHandTip } from "../ui/handtip.js";

/**
 * 注册工具模块到decadeUI
 * @param {Object} decadeUI - decadeUI对象
 */
export const registerDecadeUIUtilityModule = decadeUI => {
	Object.assign(decadeUI, { isMobile, getRandom, getMapElementPos, delayRemoveCards, getPlayerIdentity });

	/**
	 * 延迟指定毫秒
	 * @param {number} ms - 毫秒数
	 */
	decadeUI.delay = ms => {
		if (typeof ms !== "number") throw new Error("milliseconds must be a number");
		if (_status.paused) return;
		game.pause();
		_status.timeout = setTimeout(game.resume, ms);
	};

	/**
	 * 队列下一个微任务
	 * @param {Function} callback - 回调函数
	 * @param {Object} ctx - 上下文
	 */
	decadeUI.queueNextTick = (callback, ctx) => {
		decadeUI._tickEntries ??= [];
		decadeUI._tickEntries.push({ ctx, callback });
		if (decadeUI._queueTick) return;
		decadeUI._queueTick = Promise.resolve().then(() => {
			decadeUI._queueTick = null;
			const entries = decadeUI._tickEntries;
			decadeUI._tickEntries = [];
			entries.forEach(e => e.callback.call(e.ctx));
		});
	};

	/**
	 * 队列下一帧任务
	 * @param {Function} callback - 回调函数
	 * @param {Object} ctx - 上下文
	 */
	decadeUI.queueNextFrameTick = (callback, ctx) => {
		decadeUI._frameTickEntries ??= [];
		decadeUI._frameTickEntries.push({ ctx, callback });
		if (decadeUI._queueFrameTick) return;
		decadeUI._queueFrameTick = requestAnimationFrame(() => {
			decadeUI._queueFrameTick = null;
			const entries = decadeUI._frameTickEntries;
			decadeUI._frameTickEntries = [];
			setTimeout(() => entries.forEach(e => e.callback.call(e.ctx)), 0);
		});
	};

	decadeUI.layoutHand = () => decadeUI.layout.updateHand();
	decadeUI.layoutHandDraws = cards => layoutHandDraws(cards, decadeUI.boundsCaches);
	decadeUI.layoutDrawCards = (cards, player, center) => layoutDrawCards(cards, player, center, decadeUI.boundsCaches);
	decadeUI.layoutDiscard = () => decadeUI.layout.updateDiscard();
	decadeUI.cardTempSuitNum = (card, suit, number) => cardTempSuitNum(card, suit, number, decadeUI.element);
	decadeUI.tryAddPlayerCardUseTag = (card, player, event) => tryAddPlayerCardUseTag(card, player, event, decadeUI);

	/**
	 * 获取卡牌缩放配置
	 * @returns {number} 缩放比例
	 */
	const getCardScale = () => lib.config?.extension_十周年UI_cardScale ?? 0.18;

	/**
	 * 获取卡牌最佳缩放比例
	 * @param {Object} size - 尺寸对象
	 * @returns {number} 缩放比例
	 */
	decadeUI.getCardBestScale = size => {
		size = size?.height ? size : decadeUI.getHandCardSize();
		return Math.min((decadeUI.get.bodySize().height * getCardScale()) / size.height, 1);
	};

	/**
	 * 获取手牌尺寸
	 * @param {boolean} useDefault - 是否使用默认值
	 * @returns {Object} 包含width和height的尺寸对象
	 */
	decadeUI.getHandCardSize = (useDefault = false) => {
		const defaultSize = { width: 108, height: 150 };
		const style = decadeUI.sheet.getStyle(".media_defined > .card") || decadeUI.sheet.getStyle(".hand-cards > .handcards > .card");
		if (!style) return useDefault ? defaultSize : { width: 0, height: 0 };
		return { width: parseFloat(style.width), height: parseFloat(style.height) };
	};
};

/**
 * 增强运行时功能
 * @param {Object} decadeUI - decadeUI对象
 */
export const enhanceDecadeUIRuntime = decadeUI => {
	decadeUI.BoundsCache = BoundsCache;
	decadeUI.boundsCaches = createBoundsCaches(decadeUI);
	decadeUI.element = element;
	decadeUI.showHandTip = text => showHandTip(text, decadeUI);

	/** @type {Object} 游戏控制对象 */
	decadeUI.game = {
		wait: game.pause,
		/**
		 * 恢复游戏
		 */
		resume() {
			if (game.loopLocked) {
				_status.paused = false;
				return;
			}
			const dialog = decadeUI.eventDialog;
			if (dialog?.finished === false && !dialog.finishing) {
				dialog.finish();
				decadeUI.eventDialog = undefined;
			} else {
				game.resume();
			}
		},
	};
};
