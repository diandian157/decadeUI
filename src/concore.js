import { lib, game, ui, get, _status } from "noname";
import { isMobile, getRandom, getMapElementPos, delayRemoveCards } from "./utils/core.js";
import { getPlayerIdentity } from "./utils/identity.js";
import { BoundsCache, createBoundsCaches } from "./utils/bounds.js";
import { element } from "./utils/element.js";
import { layoutHandDraws, layoutDrawCards } from "./ui/layout-utils.js";
import { cardTempSuitNum, tryAddPlayerCardUseTag } from "./ui/card-utils.js";
import { showHandTip } from "./ui/handtip.js";

// 不兼容的游戏模式
const INCOMPATIBLE_MODES = new Set(["chess", "tafang", "hs_hearthstone"]);
const RECOMMENDED_LAYOUT = "nova";

/**
 * 初始化扩展，检查兼容性并提示布局切换
 * @returns {boolean} 是否成功初始化
 */
export const bootstrapExtension = () => {
	const mode = typeof get.mode === "function" ? get.mode() : get.mode;
	if (INCOMPATIBLE_MODES.has(mode)) return false;

	// 兼容皮肤切换扩展
	if (game.hasExtension?.("皮肤切换")) {
		game.menuZoom = 1;
	}

	_status.nopopequip = lib.config.extension_十周年UI_aloneEquip;

	// 布局检查与切换提示
	if (lib.config.layout !== RECOMMENDED_LAYOUT) {
		const prompt = "十周年UI提醒您，请使用<新版>布局以获得良好体验。\n点击确定自动切换，点击取消保持当前布局。";
		if (confirm(prompt)) {
			lib.config.layout = RECOMMENDED_LAYOUT;
			game.saveConfig("layout", RECOMMENDED_LAYOUT);
			alert("布局已切换，游戏将自动重启。");
			setTimeout(() => location.reload(), 100);
		}
	}

	console.time(decadeUIName);
	return true;
};

/**
 * 注册工具模块到 decadeUI
 */
export const registerDecadeUIUtilityModule = decadeUI => {
	// 基础工具函数
	Object.assign(decadeUI, {
		isMobile,
		getRandom,
		getMapElementPos,
		delayRemoveCards,
		getPlayerIdentity,
	});

	// 延迟执行
	decadeUI.delay = ms => {
		if (typeof ms !== "number") throw new Error("milliseconds must be a number");
		if (_status.paused) return;
		game.pause();
		_status.timeout = setTimeout(game.resume, ms);
	};

	// 微任务队列
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

	// 帧任务队列
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

	// 布局相关
	decadeUI.layoutHand = () => dui.layout.updateHand();
	decadeUI.layoutHandDraws = cards => layoutHandDraws(cards, dui.boundsCaches);
	decadeUI.layoutDrawCards = (cards, player, center) => layoutDrawCards(cards, player, center, dui.boundsCaches);
	decadeUI.layoutDiscard = () => dui.layout.updateDiscard();

	// 卡牌工具
	decadeUI.cardTempSuitNum = (card, suit, number) => cardTempSuitNum(card, suit, number, decadeUI.element);
	decadeUI.tryAddPlayerCardUseTag = (card, player, event) => tryAddPlayerCardUseTag(card, player, event, decadeUI);

	// 获取卡牌最佳缩放比例
	decadeUI.getCardBestScale = size => {
		size = size?.height ? size : decadeUI.getHandCardSize();
		const bodyHeight = decadeUI.get.bodySize().height;
		const scale = lib?.config?.extension_十周年UI_cardScale || 0.18;
		return Math.min((bodyHeight * scale) / size.height, 1);
	};

	// 获取手牌尺寸
	decadeUI.getHandCardSize = (useDefault = false) => {
		const defaultSize = { width: 108, height: 150 };
		const zeroSize = { width: 0, height: 0 };

		const style = decadeUI.sheet.getStyle(".media_defined > .card") || decadeUI.sheet.getStyle(".hand-cards > .handcards > .card");

		if (!style) return useDefault ? defaultSize : zeroSize;
		return { width: parseFloat(style.width), height: parseFloat(style.height) };
	};
};

/**
 * 增强运行时功能
 */
export const enhanceDecadeUIRuntime = decadeUI => {
	decadeUI.BoundsCache = BoundsCache;
	decadeUI.boundsCaches = createBoundsCaches(decadeUI);
	decadeUI.element = element;

	dui.showHandTip = text => showHandTip(text, decadeUI);

	// 游戏控制
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

/**
 * 完成核心初始化
 */
export const finalizeDecadeUICore = (decadeUI, config, pack) => {
	registerDecadeUIUtilityModule(decadeUI);

	decadeUI.config = config;
	decadeUI.config.campIdentityImageMode ??= true;

	// 配置更新函数
	duicfg.update = () => {
		const menu = lib.extensionMenu[`extension_${decadeUIName}`];
		for (const key in menu) {
			if (menu[key] && typeof menu[key].update === "function") {
				menu[key].update();
			}
		}
	};

	decadeUI.init();
	console.timeEnd(decadeUIName);
	return decadeUI;
};
