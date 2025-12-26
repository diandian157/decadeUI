/**
 * 工具模块注册
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { isMobile, getRandom, getMapElementPos, delayRemoveCards } from "../utils/core.js";
import { getPlayerIdentity } from "../utils/identity.js";
import { BoundsCache, createBoundsCaches } from "../utils/bounds.js";
import { element } from "../utils/element.js";
import { layoutHandDraws, layoutDrawCards } from "../ui/layout-utils.js";
import { cardTempSuitNum, tryAddPlayerCardUseTag } from "../ui/card-utils.js";
import { showHandTip } from "../ui/handtip.js";

/** 注册工具模块到 decadeUI */
export const registerDecadeUIUtilityModule = decadeUI => {
	Object.assign(decadeUI, { isMobile, getRandom, getMapElementPos, delayRemoveCards, getPlayerIdentity });

	decadeUI.delay = ms => {
		if (typeof ms !== "number") throw new Error("milliseconds must be a number");
		if (_status.paused) return;
		game.pause();
		_status.timeout = setTimeout(game.resume, ms);
	};

	decadeUI.queueNextTick = (callback, ctx) => {
		dui._tickEntries = dui._tickEntries || [];
		dui._tickEntries.push({ ctx, callback });
		if (dui._queueTick) return;
		dui._queueTick = Promise.resolve().then(() => {
			dui._queueTick = null;
			const entries = dui._tickEntries;
			dui._tickEntries = [];
			entries.forEach(e => e.callback.call(e.ctx));
		});
	};

	decadeUI.queueNextFrameTick = (callback, ctx) => {
		dui._frameTickEntries = dui._frameTickEntries || [];
		dui._frameTickEntries.push({ ctx, callback });
		if (dui._queueFrameTick) return;
		dui._queueFrameTick = requestAnimationFrame(() => {
			dui._queueFrameTick = null;
			const entries = dui._frameTickEntries;
			dui._frameTickEntries = [];
			setTimeout(() => entries.forEach(e => e.callback.call(e.ctx)), 0);
		});
	};

	decadeUI.layoutHand = () => dui.layout.updateHand();
	decadeUI.layoutHandDraws = cards => layoutHandDraws(cards, dui.boundsCaches);
	decadeUI.layoutDrawCards = (cards, player, center) => layoutDrawCards(cards, player, center, dui.boundsCaches);
	decadeUI.layoutDiscard = () => dui.layout.updateDiscard();
	decadeUI.cardTempSuitNum = (card, suit, number) => cardTempSuitNum(card, suit, number, decadeUI.element);
	decadeUI.tryAddPlayerCardUseTag = (card, player, event) => tryAddPlayerCardUseTag(card, player, event, decadeUI);

	decadeUI.getCardBestScale = size => {
		size = size?.height ? size : decadeUI.getHandCardSize();
		const bodyHeight = decadeUI.get.bodySize().height;
		const scale = lib?.config?.extension_十周年UI_cardScale || 0.18;
		return Math.min((bodyHeight * scale) / size.height, 1);
	};

	decadeUI.getHandCardSize = (useDefault = false) => {
		const defaultSize = { width: 108, height: 150 };
		const style = decadeUI.sheet.getStyle(".media_defined > .card") || decadeUI.sheet.getStyle(".hand-cards > .handcards > .card");
		if (!style) return useDefault ? defaultSize : { width: 0, height: 0 };
		return { width: parseFloat(style.width), height: parseFloat(style.height) };
	};
};

/** 增强运行时功能 */
export const enhanceDecadeUIRuntime = decadeUI => {
	decadeUI.BoundsCache = BoundsCache;
	decadeUI.boundsCaches = createBoundsCaches(decadeUI);
	decadeUI.element = element;
	dui.showHandTip = text => showHandTip(text, decadeUI);

	decadeUI.game = {
		wait: () => game.pause(),
		resume: () => {
			if (!game.loopLocked) {
				const dialog = decadeUI.eventDialog;
				if (dialog && !dialog.finished && !dialog.finishing) {
					dialog.finish();
					decadeUI.eventDialog = undefined;
				} else {
					game.resume();
				}
			} else {
				_status.paused = false;
			}
		},
	};
};
