import { lib, game, ui, get, ai, _status } from "noname";
import { ChildNodesWatcher } from "../../../noname/library/cache/childNodesWatcher.js";
import { cardSkinMeta, cardSkinPresets } from "./config.js";
import { registerLegacyModules } from "./ui/progress-bar.js";

import { CubicBezierEase, throttle, observeSize, lerp, TimeStep, APNode, AnimationPlayer, AnimationPlayerPool, DynamicPlayer, BUILT_ID, DynamicWorkers } from "./animation/index.js";
import { setupGameAnimation } from "./animation/gameIntegration.js";

// 特效模块
import { setupEffects } from "./effects/index.js";

// 功能模块
import { setupAutoSelect } from "./features/autoSelect.js";
import { setupCardDragSort } from "./features/cardDragSort.js";
import { setupEquipHand } from "./features/equipHand.js";

// 音频模块
import { setupSkillDieAudio, setupAudioHooks } from "./audio/index.js";

// 皮肤模块
import { setupDynamicSkin } from "./skins/index.js";

// 工具模块
import { isMobile, getRandom, getMapElementPos, delayRemoveCards } from "./utils/core.js";
import { getPlayerIdentity } from "./utils/identity.js";
import { BoundsCache, createBoundsCaches } from "./utils/bounds.js";
import { element } from "./utils/element.js";
import { layoutHandDraws, layoutDrawCards } from "./ui/layout-utils.js";
import { cardTempSuitNum, tryAddPlayerCardUseTag } from "./ui/card-utils.js";
import { showHandTip } from "./ui/handtip.js";
import { initCardPrompt } from "./ui/cardPrompt.js";
import { initComponent } from "./ui/component.js";

// 技能模块
import { initSkills } from "./skills/index.js";

// 覆写模块
import { controlAdd, controlOpen, controlClose, controlReplace, controlUpdateLayout } from "./overrides/control.js";
import { dialogOpen, dialogClose, setBaseDialogMethods } from "./overrides/dialog.js";
import { eventAddMessageHook, eventTriggerMessage } from "./overrides/event.js";
import { cardCopy, cardInit, cardUpdateTransform, cardMoveTo, cardMoveDelete, setBaseCardMethods } from "./overrides/card.js";
import { setBaseContentMethods, contentChangeHp, createContentGain, contentJudge, createContentLose, contentTurnOver } from "./overrides/content.js";
import {
	setBasePlayerMethods,
	playerAddSkill,
	playerRemoveSkill,
	playerAwakenSkill,
	playerSetIdentity,
	playerGetState,
	playerMarkSkill,
	playerUnmarkSkill,
	playerReinitCharacter,
	playerSetSeatNum,
	playerUninit,
	playerReinit,
	playerUpdate,
	playerUseCard,
	playerLose,
	playerUseCardAnimateBefore,
	playerRespondAnimateBefore,
	playerChangeZhuanhuanji,
	playerTrySkillAnimate,
	playerSetModeState,
	playerHandleEquipChange,
	playerMark,
	playerMarkCharacter,
	playerUpdateMark,
	playerMarkSkillCharacter,
	playerPlayDynamic,
	playerStopDynamic,
	playerApplyDynamicSkin,
	playerSay,
	playerDieAfter,
	playerSkill,
	playerSyncExpand,
	playerAddPrefixSeparator,
	playerYangSkill,
	player$YangSkill,
	playerYingSkill,
	player$YingSkill,
	playerFailSkill,
	player$FailSkill,
	playerShixiaoSkill,
	player$ShixiaoSkill,
	playerUnshixiaoSkill,
	player$UnshixiaoSkill,
	playerDamagepop,
	playerCompare,
	playerCompareMultiple,
	playerCheckAndAddExperienceSuffix,
	playerQueueCssAnimation,
	playerDamage,
	playerUpdateShowCards,
	playerCheckBoundsCache,
	playerLine,
	playerDirectgain,
	playerPhaseJudge,
	playerGain2,
	playerDraw,
	playerGive,
	playerThrow,
	playerThrowordered2,
	setBasePlayerDraw,
	playerAddVirtualJudge,
} from "./overrides/player.js";
import { setBaseGameMethods, gameSwapSeat, gameSwapPlayer, gameSwapControl, gameAddGlobalSkill, gameRemoveGlobalSkill, gameLogv } from "./overrides/game.js";
import { setBaseGetMethods, getSkillState, getObjtype } from "./overrides/get.js";
import { setBaseUiMethods, setBaseUiCreateMethods, uiUpdatec, uiUpdatehl, uiUpdatej, uiUpdatem, uiUpdatez, uiUpdate, uiUpdatejm, uiUpdatexr, uiCreatePrebutton, uiCreateRarity, uiCreateButton, uiCreateControl, uiCreateDialog, uiCreateSelectlist, uiCreateIdentityCard, uiCreateSpinningIdentityCard, uiCreateArena, uiCreatePause, uiCreateCharacterDialog, uiClickCard, uiClickIntro, uiClickIdentity, uiClickVolumn, uiClear, uiCreateMe } from "./overrides/ui.js";
import { setBaseLibMethods, libInitCssstyles } from "./overrides/lib.js";

// ==================== 常量定义 ====================
const SVG_NS = "http://www.w3.org/2000/svg";
const INCOMPATIBLE_MODES = new Set(["chess", "tafang", "hs_hearthstone"]);
const RECOMMENDED_LAYOUT = "nova";

const CLIP_PATHS = [
	{ id: "solo-clip", d: "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z" },
	{ id: "duol-clip", d: "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z" },
	{ id: "duor-clip", d: "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z" },
	{ id: "dskin-clip", d: "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z" },
];

// ==================== 启动与初始化 ====================

/** 初始化扩展，检查兼容性 */
export const bootstrapExtension = () => {
	const mode = typeof get.mode === "function" ? get.mode() : get.mode;
	if (INCOMPATIBLE_MODES.has(mode)) return false;

	if (game.hasExtension?.("皮肤切换")) game.menuZoom = 1;
	_status.nopopequip = lib.config.extension_十周年UI_aloneEquip;

	if (lib.config.layout !== RECOMMENDED_LAYOUT) {
		if (confirm("十周年UI提醒您，请使用<新版>布局以获得良好体验。\n点击确定自动切换，点击取消保持当前布局。")) {
			lib.config.layout = RECOMMENDED_LAYOUT;
			game.saveConfig("layout", RECOMMENDED_LAYOUT);
			alert("布局已切换，游戏将自动重启。");
			setTimeout(() => location.reload(), 100);
		}
	}

	console.time(decadeUIName);
	return true;
};

// ==================== SVG与全局方法 ====================

/** 初始化SVG裁剪路径 */
function initSvgClipPaths() {
	const svg = document.body.appendChild(document.createElementNS(SVG_NS, "svg"));
	const defs = svg.appendChild(document.createElementNS(SVG_NS, "defs"));
	CLIP_PATHS.forEach(({ id, d }) => {
		const clipPath = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
		clipPath.id = id;
		clipPath.setAttribute("clipPathUnits", "objectBoundingBox");
		clipPath.appendChild(document.createElementNS(SVG_NS, "path")).setAttribute("d", d);
	});
}

/** 修补全局方法 */
function patchGlobalMethods(ctx) {
	if (!window.get) return;
	if (typeof window.get.cardsetion === "function") {
		const original = window.get.cardsetion;
		window.get.cardsetion = (...args) => {
			try {
				return original.apply(ctx, args);
			} catch (e) {
				if (e?.message?.includes("indexOf")) return "";
				throw e;
			}
		};
	}
	if (typeof window.get.getPlayerIdentity === "function") {
		const original = window.get.getPlayerIdentity;
		window.get.getPlayerIdentity = (player, identity, chinese, isMark) => {
			identity = identity || player?.identity || "";
			if (typeof identity !== "string") identity = "";
			if (player?.special_identity != null && typeof player.special_identity !== "string") player.special_identity = "";
			return original.call(ctx, player, identity, chinese, isMark);
		};
	}
}

/** 初始化十周年UI环境 */
const initializeDecadeUIEnvironment = ctx => {
	const sensorNode = ctx.element.create("sensor", document.body);
	sensorNode.id = "decadeUI-body-sensor";
	const bodySensor = new ctx.ResizeSensor(sensorNode);

	initSvgClipPaths();
	document.addEventListener("click", e => dui.set.activeElement(e.target), true);

	const handTipHeight = lib.config["extension_十周年UI_handTipHeight"] || "20";
	document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${handTipHeight}% + 10px)`);

	patchGlobalMethods(ctx);
	return bodySensor;
};

// ==================== 对话框模块 ====================

/** 事件监听器管理器 */
const createListenerManager = dialog => ({
	_dialog: dialog,
	_list: [],
	add(element, event, handler, useCapture) {
		if (!(element instanceof HTMLElement) || !event || typeof handler !== "function") {
			return console.error("Invalid arguments for listener");
		}
		this._list.push([element, event, handler]);
		element.addEventListener(event, handler, useCapture);
	},
	remove(element, event, handler) {
		for (let i = this._list.length - 1; i >= 0; i--) {
			const [el, evt, fn] = this._list[i];
			const match = (!element || el === element) && (!event || evt === event) && (!handler || fn === handler);
			if (match) {
				el.removeEventListener(evt, fn);
				this._list.splice(i, 1);
			}
		}
	},
	clear() {
		this._list.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
		this._list.length = 0;
	},
});

/** 解析时间字符串为毫秒 */
function parseDuration(duration) {
	if (typeof duration === "number") return duration;
	if (duration.includes("ms")) return parseInt(duration);
	if (duration.includes("s")) return parseFloat(duration) * 1000;
	return parseInt(duration);
}

/** 创建对话框模块 */
const createDecadeUIDialogModule = () => ({
	create(className, parentNode, tagName = "div") {
		const element = document.createElement(tagName);
		Object.keys(decadeUI.dialog).forEach(key => {
			if (decadeUI.dialog[key] && key !== "listens") element[key] = decadeUI.dialog[key];
		});
		element.listens = createListenerManager(element);
		if (className) element.className = className;
		if (parentNode) parentNode.appendChild(element);
		return element;
	},
	show() {
		if (this === decadeUI.dialog) return;
		this.classList.remove("hidden");
	},
	hide() {
		if (this === decadeUI.dialog) return;
		this.classList.add("hidden");
	},
	animate(property, duration, toValues, fromValues) {
		if (this === decadeUI.dialog || !property || !duration || !toValues) return;
		const props = property.replace(/\s/g, "").split(",");
		const ms = parseDuration(duration);
		if (isNaN(ms)) return console.error("Invalid duration");
		if (fromValues) props.forEach((prop, i) => this.style.setProperty(prop, fromValues[i]));
		const { transitionDuration, transitionProperty } = this.style;
		this.style.transitionDuration = `${ms}ms`;
		this.style.transitionProperty = property;
		ui.refresh(this);
		props.forEach((prop, i) => this.style.setProperty(prop, toValues[i]));
		setTimeout(() => {
			this.style.transitionDuration = transitionDuration;
			this.style.transitionProperty = transitionProperty;
		}, ms);
	},
	close(delay, fadeOut) {
		if (this === decadeUI.dialog || !this.parentNode) return;
		this.listens.clear();
		if (fadeOut && delay) this.animate("opacity", delay, [0]);
		if (delay) {
			const ms = typeof delay === "number" ? delay : parseInt(delay);
			setTimeout(() => this.parentNode?.removeChild(this), ms);
		} else {
			this.parentNode.removeChild(this);
		}
	},
	listens: createListenerManager(null),
});

// ==================== 动画模块 ====================

/** 创建绘图上下文辅助对象 */
function createDrawContext(canvas, deltaTime) {
	const ctx = canvas.getContext("2d");
	return {
		canvas,
		context: ctx,
		deltaTime,
		save: () => (ctx.save(), ctx),
		restore: () => (ctx.restore(), ctx),
		drawLine(x1, y1, x2, y2, color, lineWidth) {
			ctx.beginPath();
			if (color) ctx.strokeStyle = color;
			if (lineWidth) ctx.lineWidth = lineWidth;
			if (x2 == null || y2 == null) ctx.lineTo(x1, y1);
			else {
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
			}
			ctx.stroke();
		},
		drawRect(x, y, width, height, color, lineWidth) {
			ctx.beginPath();
			if (color) ctx.strokeStyle = color;
			if (lineWidth) ctx.lineWidth = lineWidth;
			ctx.rect(x, y, width, height);
			ctx.stroke();
		},
		fillRect(x, y, width, height, color) {
			if (color) ctx.fillStyle = color;
			ctx.fillRect(x, y, width, height);
		},
		drawText(text, font, color, x, y, align, baseline, stroke = false) {
			if (!text || x == null || y == null) return;
			if (font) ctx.font = font;
			if (align) ctx.textAlign = align;
			if (baseline) ctx.textBaseline = baseline;
			if (color) ctx[stroke ? "strokeStyle" : "fillStyle"] = color;
			ctx[stroke ? "strokeText" : "fillText"](text, x, y);
		},
		drawStrokeText(text, font, color, x, y, align, baseline) {
			this.drawText(text, font, color, x, y, align, baseline, true);
		},
	};
}

/** 创建Canvas动画模块 */
const createDecadeUIAnimateModule = () => ({
	updates: [],
	canvas: null,
	frameId: null,
	frameTime: null,
	check() {
		if (!ui.arena) return false;
		if (!this.canvas) {
			this.canvas = ui.arena.appendChild(document.createElement("canvas"));
			this.canvas.id = "decadeUI-canvas-arena";
		}
		return true;
	},
	add(updateFn, ...initArgs) {
		if (typeof updateFn !== "function" || !this.check()) return;
		this.updates.push({ update: updateFn, inits: initArgs.slice(1), id: decadeUI.getRandom(0, 100) });
		if (!this.frameId) this.frameId = requestAnimationFrame(this.update.bind(this));
	},
	update() {
		const now = performance.now();
		const delta = now - (this.frameTime ?? now);
		this.frameTime = now;
		const drawCtx = createDrawContext(this.canvas, delta);
		if (!decadeUI.dataset.animSizeUpdated) {
			decadeUI.dataset.animSizeUpdated = true;
			this.canvas.width = this.canvas.parentNode.offsetWidth;
			this.canvas.height = this.canvas.parentNode.offsetHeight;
		}
		this.canvas.height = this.canvas.height;
		for (let i = this.updates.length - 1; i >= 0; i--) {
			const task = this.updates[i];
			drawCtx.save();
			const done = task.update.apply(task, [...task.inits, drawCtx]);
			drawCtx.restore();
			if (done) this.updates.splice(i, 1);
		}
		if (this.updates.length > 0) this.frameId = requestAnimationFrame(this.update.bind(this));
		else {
			this.frameId = null;
			this.frameTime = null;
		}
	},
});

// ==================== 尺寸监听器 ====================

/** 创建ResizeSensor类 */
const createResizeSensorClass = () => {
	class ResizeSensor {
		constructor(element) {
			this.element = element;
			this.width = element.clientWidth || 1;
			this.height = element.clientHeight || 1;
			this.maxSize = 10000;
			this.events = [];
			this.initScrollElements();
		}
		initScrollElements() {
			const containerStyle = "position:absolute;top:0;bottom:0;left:0;right:0;z-index:-10000;overflow:hidden;visibility:hidden;transition:all 0s;";
			const childStyle = "transition:all 0s!important;animation:none!important;";
			this.expand = this.createContainer(containerStyle);
			this.shrink = this.createContainer(containerStyle);
			const expandChild = document.createElement("div");
			expandChild.style.cssText = childStyle;
			expandChild.style.width = this.maxSize * this.width + "px";
			expandChild.style.height = this.maxSize * this.height + "px";
			const shrinkChild = document.createElement("div");
			shrinkChild.style.cssText = childStyle;
			shrinkChild.style.width = "250%";
			shrinkChild.style.height = "250%";
			this.expand.appendChild(expandChild);
			this.shrink.appendChild(shrinkChild);
			this.element.appendChild(this.expand);
			this.element.appendChild(this.shrink);
			if (this.expand.offsetParent !== this.element) this.element.style.position = "relative";
			this.resetScroll();
			this.onscroll = this.handleScroll.bind(this);
			this.expand.addEventListener("scroll", this.onscroll);
			this.shrink.addEventListener("scroll", this.onscroll);
		}
		createContainer(style) {
			const div = document.createElement("div");
			div.style.cssText = style;
			return div;
		}
		resetScroll() {
			const maxW = this.maxSize * this.width;
			const maxH = this.maxSize * this.height;
			this.expand.scrollTop = this.shrink.scrollTop = maxH;
			this.expand.scrollLeft = this.shrink.scrollLeft = maxW;
		}
		handleScroll() {
			const w = this.element.clientWidth || 1;
			const h = this.element.clientHeight || 1;
			if (w !== this.width || h !== this.height) {
				this.width = w;
				this.height = h;
				this.dispatchEvent();
			}
			this.resetScroll();
		}
		addListener(callback, capture = true) {
			this.events.push({ callback, capture });
		}
		dispatchEvent() {
			let hasDeferred = false;
			this.events.forEach(evt => {
				if (evt.capture) evt.callback();
				else hasDeferred = true;
			});
			if (hasDeferred) requestAnimationFrame(() => this.dispatchDeferredEvents());
		}
		dispatchDeferredEvents() {
			this.events.forEach(evt => {
				if (!evt.capture) evt.callback();
			});
		}
		close() {
			this.expand.removeEventListener("scroll", this.onscroll);
			this.shrink.removeEventListener("scroll", this.onscroll);
			if (this.element) {
				this.element.removeChild(this.expand);
				this.element.removeChild(this.shrink);
			}
			this.events = null;
		}
	}
	return ResizeSensor;
};

// ==================== 工具模块注册 ====================

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

/** 完成核心初始化 */
export const finalizeDecadeUICore = (decadeUI, config) => {
	registerDecadeUIUtilityModule(decadeUI);
	decadeUI.config = config;
	decadeUI.config.campIdentityImageMode ??= true;

	// 配置更新函数 - 同时添加到duicfg和decadeUI.config
	const updateFn = () => {
		const menu = lib.extensionMenu[`extension_${decadeUIName}`];
		for (const key in menu) {
			if (menu[key] && typeof menu[key].update === "function") menu[key].update();
		}
	};
	duicfg.update = updateFn;
	decadeUI.config.update = updateFn;

	decadeUI.init();

	// 初始化动画系统
	setupGameAnimation(lib, game, ui, get, ai, _status);

	// 初始化特效模块
	setupEffects();

	// 初始化UI组件模块
	initComponent(decadeUI);

	// 初始化技能模块
	initSkills();

	// 初始化卡牌提示模块
	initCardPrompt({ lib, game, ui, get });

	// 初始化自动选择
	setupAutoSelect();

	// 初始化手牌拖拽排序
	setupCardDragSort();

	// 初始化装备手牌化
	setupEquipHand();

	// 初始化音频模块
	setupSkillDieAudio();
	setupAudioHooks();

	// 初始化动态皮肤
	setupDynamicSkin();

	console.timeEnd(decadeUIName);
	return decadeUI;
};

// ==================== 核心对象 ====================

const createDecadeUIObject = () => ({
	init() {
		this.extensionName = decadeUIName;
		this.bodySensor = initializeDecadeUIEnvironment(this);
		this.initOverride();
		return this;
	},

	initOverride() {
		const override = (dest, src) => {
			let ok = true;
			for (const key in src) {
				if (dest[key]) {
					ok = override(dest[key], src[key]);
					if (ok) dest[key] = src[key];
				} else {
					dest[key] = src[key];
				}
				ok = false;
			}
			return ok;
		};

		// 保存原始方法引用
		const base = {
			ui: {
				create: {
					cards: ui.create.cards,
					button: ui.create.button,
					arena: ui.create.arena,
					pause: ui.create.pause,
					characterDialog: ui.create.characterDialog,
				},
				click: { intro: ui.click.intro },
				update: ui.update,
			},
			get: { skillState: get.skillState },
			game: {
				swapSeat: game.swapSeat,
				swapControl: game.swapControl,
				swapPlayer: game.swapPlayer,
				addGlobalSkill: game.addGlobalSkill,
				removeGlobalSkill: game.removeGlobalSkill,
			},
			lib: {
				element: {
					card: { $init: lib.element.card.$init, copy: lib.element.card.copy },
					player: {
						addSkill: lib.element.player.addSkill,
						removeSkill: lib.element.player.removeSkill,
						awakenSkill: lib.element.player.awakenSkill,
						getState: lib.element.player.getState,
						setModeState: lib.element.player.setModeState,
						$dieAfter: lib.element.player.$dieAfter,
						$skill: lib.element.player.$skill,
						markSkill: lib.element.player.markSkill,
						unmarkSkill: lib.element.player.unmarkSkill,
						reinitCharacter: lib.element.player.reinitCharacter,
						$init: lib.element.player.$init,
						$uninit: lib.element.player.$uninit,
						$reinit: lib.element.player.$reinit,
						setSeatNum: lib.element.player.setSeatNum,
						$update: lib.element.player.$update,
						useCard: lib.element.player.useCard,
						lose: lib.element.player.lose,
						$draw: lib.element.player.$draw,
						$handleEquipChange: lib.element.player.$handleEquipChange,
						useCardAnimateBefore: lib.element.player.useCardAnimateBefore,
						respondAnimateBefore: lib.element.player.respondAnimateBefore,
						$changeZhuanhuanji: lib.element.player.$changeZhuanhuanji,
						trySkillAnimate: lib.element.player.trySkillAnimate,
					},
					content: { lose: lib.element.content.lose, gain: lib.element.content.gain },
					dialog: { close: lib.element.dialog.close },
				},
				init: { cssstyles: lib.init.cssstyles },
			},
		};

		// 覆写配置
		const ride = {
			lib: {
				element: {
					dialog: { open: dialogOpen, close: dialogClose },
					event: { addMessageHook: eventAddMessageHook, triggerMessage: eventTriggerMessage },
					card: {
						copy: cardCopy,
						$init: cardInit,
						updateTransform: cardUpdateTransform,
						moveTo: cardMoveTo,
						moveDelete: cardMoveDelete,
					},
					control: {
						add: controlAdd,
						open: controlOpen,
						close: controlClose,
						replace: controlReplace,
						updateLayout: controlUpdateLayout,
					},
					player: {
						addSkill: playerAddSkill,
						removeSkill: playerRemoveSkill,
						awakenSkill: playerAwakenSkill,
						setIdentity: playerSetIdentity,
						getState: playerGetState,
						markSkill: playerMarkSkill,
						unmarkSkill: playerUnmarkSkill,
						reinitCharacter: playerReinitCharacter,
						setSeatNum: playerSetSeatNum,
						$uninit: playerUninit,
						$reinit: playerReinit,
						$update: playerUpdate,
						useCard: playerUseCard,
						lose: playerLose,
						useCardAnimateBefore: playerUseCardAnimateBefore,
						respondAnimateBefore: playerRespondAnimateBefore,
						$changeZhuanhuanji: playerChangeZhuanhuanji,
						trySkillAnimate: playerTrySkillAnimate,
						setModeState: playerSetModeState,
						$handleEquipChange: playerHandleEquipChange,
						mark: playerMark,
						markCharacter: playerMarkCharacter,
						updateMark: playerUpdateMark,
						markSkillCharacter: playerMarkSkillCharacter,
						playDynamic: playerPlayDynamic,
						stopDynamic: playerStopDynamic,
						_decadeUIApplyDynamicSkin: playerApplyDynamicSkin,
						say: playerSay,
						$dieAfter: playerDieAfter,
						$skill: playerSkill,
						$syncExpand: playerSyncExpand,
						_addPrefixSeparator: playerAddPrefixSeparator,
						$init: createPlayerInit(base),
						checkAndAddExperienceSuffix: playerCheckAndAddExperienceSuffix,
						directgain: playerDirectgain,
						$addVirtualJudge: playerAddVirtualJudge,
						line: playerLine,
						checkBoundsCache: playerCheckBoundsCache,
						queueCssAnimation: playerQueueCssAnimation,
						$draw: playerDraw,
						$give: playerGive,
						$gain2: playerGain2,
						$damage: playerDamage,
						$throw: playerThrow,
						$throwordered2: playerThrowordered2,
						$phaseJudge: playerPhaseJudge,
						decadeUI_updateShowCards: playerUpdateShowCards,
						yangSkill: playerYangSkill,
						$yangSkill: player$YangSkill,
						yingSkill: playerYingSkill,
						$yingSkill: player$YingSkill,
						failSkill: playerFailSkill,
						$failSkill: player$FailSkill,
						shixiaoSkill: playerShixiaoSkill,
						$shixiaoSkill: player$ShixiaoSkill,
						unshixiaoSkill: playerUnshixiaoSkill,
						$unshixiaoSkill: player$UnshixiaoSkill,
						$damagepop: playerDamagepop,
						$compare: playerCompare,
						$compareMultiple: playerCompareMultiple,
					},
					content: {
						changeHp: contentChangeHp,
						gain: createContentGain(base.lib.element.content.gain),
						judge: contentJudge,
						lose: createContentLose(base.lib.element.content.lose),
						turnOver: contentTurnOver,
					},
				},
				init: { cssstyles: libInitCssstyles },
			},
			ui: {
				updatec: uiUpdatec,
				updatehl: uiUpdatehl,
				updatej: uiUpdatej,
				updatem: uiUpdatem,
				updatez: uiUpdatez,
				update: uiUpdate,
				updatejm: uiUpdatejm,
				updatexr: uiUpdatexr,
				create: {
					prebutton: uiCreatePrebutton,
					rarity: uiCreateRarity,
					button: uiCreateButton,
					control: uiCreateControl,
					dialog: uiCreateDialog,
					selectlist: uiCreateSelectlist,
					identityCard: uiCreateIdentityCard,
					spinningIdentityCard: uiCreateSpinningIdentityCard,
					arena: uiCreateArena,
					pause: uiCreatePause,
					characterDialog: uiCreateCharacterDialog,
					buttonPresets: { character: createCharacterButtonPreset() },
				},
				click: { card: uiClickCard, intro: uiClickIntro },
			},
			game: {
				logv: gameLogv,
				swapSeat: gameSwapSeat,
				swapPlayer: gameSwapPlayer,
				swapControl: gameSwapControl,
				addGlobalSkill: gameAddGlobalSkill,
				removeGlobalSkill: gameRemoveGlobalSkill,
			},
			get: { skillState: getSkillState, objtype: getObjtype },
		};

		// 设置基础方法引用
		setBaseCardMethods(base.lib.element.card.$init, base.lib.element.card.copy);
		setBaseContentMethods(base.lib.element.content);
		setBasePlayerMethods(base.lib.element.player);
		setBasePlayerDraw(base.lib.element.player.$draw);
		setBaseGameMethods(base.game);
		setBaseGetMethods(base.get);
		setBaseUiMethods(base.ui);
		setBaseUiCreateMethods(base.ui.create);
		setBaseDialogMethods(base.lib.element.dialog);
		setBaseLibMethods(base.lib);

		// 应用覆写
		override(lib, ride.lib);
		override(ui, ride.ui);
		override(game, ride.game);
		override(get, ride.get);

		// 将动画模块挂载到 decadeUI
		Object.assign(decadeUI, {
			throttle,
			observeSize,
			lerp,
			CubicBezierEase,
			TimeStep,
			APNode,
			AnimationPlayer,
			AnimationPlayerPool,
			DynamicPlayer,
			BUILT_ID,
			DynamicWorkers,
		});

		if (decadeModule.modules) {
			for (let i = 0; i < decadeModule.modules.length; i++) {
				decadeModule.modules[i](lib, game, ui, get, ai, _status);
			}
		}

		document.body.onresize = ui.updatexr;
		this.initHooks();
		this.initUIExtensions();
	},

	// 初始化钩子
	initHooks() {
		// target可选状态显示
		lib.hooks["checkTarget"].push(function decadeUI_selectable(target) {
			const list = ["selected", "selectable"];
			target.classList[list.some(s => target.classList.contains(s)) ? "remove" : "add"]("un-selectable");
		});

		// 视为卡牌样式适配
		const updateTempname = lib.hooks["checkCard"].indexOf(lib.hooks["checkCard"].find(i => i.name === "updateTempname"));
		lib.hooks["checkCard"][updateTempname] = function updateTempname(card) {
			if (lib.config.cardtempname === "off") return;
			const skill = _status.event.skill;
			const goon = skill && get.info(skill)?.viewAs && !get.info(skill).ignoreMod && (ui.selected.cards || []).includes(card);
			let cardname, cardnature, cardskb;
			if (!goon) {
				cardname = get.name(card);
				cardnature = get.nature(card);
			} else {
				cardskb = typeof get.info(skill).viewAs === "function" ? get.info(skill).viewAs([card], _status.event.player || game.me) : get.info(skill).viewAs;
				cardname = get.name(cardskb);
				cardnature = get.nature(cardskb);
			}
			if (card.name !== cardname || !get.is.sameNature(card.nature, cardnature, true)) {
				if (lib.config.extension_十周年UI_showTemp) {
					if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);
					let tempname2 = get.translation(cardname);
					if (cardnature) {
						card._tempName.dataset.nature = cardnature;
						if (cardname === "sha") tempname2 = get.translation(cardnature) + tempname2;
					}
					card._tempName.innerHTML = tempname2;
					card._tempName.tempname = tempname2;
				} else {
					const node = goon ? ui.create.cardTempName(cardskb, card) : ui.create.cardTempName(card);
					if (lib.config.cardtempname !== "default") node.classList.remove("vertical");
				}
				card.dataset.low = 1;
			}
			const cardnumber = get.number(card),
				cardsuit = get.suit(card);
			if (card.dataset.views != 1 && (card.number != cardnumber || card.suit != cardsuit)) {
				dui.cardTempSuitNum(card, cardsuit, cardnumber);
			}
		};

		// 结束出牌按钮文本
		lib.hooks["checkEnd"].push(function decadeUI_UIconfirm() {
			if (_status.event?.name !== "chooseToUse" || _status.event.type !== "phase" || ui.confirm?.lastChild.link !== "cancel") return;
			const UIconfig = lib.config.extension_十周年UI_newDecadeStyle;
			let innerHTML = UIconfig !== "othersOff" || UIconfig === "on" ? "回合结束" : "结束出牌";
			if (UIconfig === "onlineUI") innerHTML = "取消";
			else if (_status.event.skill || (ui.selected?.cards ?? []).length > 0) {
				innerHTML = UIconfig === "off" ? `<img draggable='false' src=${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/QX.png>` : "取消";
			} else if (UIconfig === "off") {
				innerHTML = `<img draggable='false' src=${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/jscp.png>`;
			}
			ui.confirm.lastChild.innerHTML = innerHTML;
			const UIcustom = ui.confirm.custom;
			ui.confirm.custom = function (...args) {
				if (typeof UIcustom === "function") UIcustom(...args);
				if (ui.cardDialog) {
					ui.cardDialog.close();
					delete ui.cardDialog;
				}
			};
		});

		// 移除临时名称
		const removeTempname = lib.hooks["uncheckCard"].indexOf(lib.hooks["uncheckCard"].find(i => i.name === "removeTempname"));
		lib.hooks["uncheckCard"][removeTempname] = function removeTempname(card) {
			if (card._tempName) {
				card._tempName.delete();
				delete card._tempName;
				card.dataset.low = 0;
				card.dataset.view = 0;
			}
			if (card._tempSuitNum) {
				card._tempSuitNum.delete();
				delete card._tempSuitNum;
				card.dataset.views = 0;
			}
			if (decadeUI?.layout) decadeUI.layout.invalidateHand();
		};

		lib.hooks["uncheckTarget"].push(function decadeUI_unselectable(target) {
			target.classList.remove("un-selectable");
		});

		// 对话框溢出处理
		const updateDialog = lib.hooks["checkOverflow"].indexOf(lib.hooks["checkOverflow"].find(i => i.name === "updateDialog"));
		lib.hooks["checkOverflow"][updateDialog] = function updateDialog(itemOption, itemContainer, addedItems, game) {
			const gap = 5;
			const L = itemContainer.originWidth / game.documentZoom;
			const W = addedItems[0].getBoundingClientRect().width / game.documentZoom;
			const n = addedItems.length;
			if (n * W + (n + 1) * gap < L) {
				itemContainer.style.setProperty("--ml", gap + "px");
			} else {
				const ml = Math.min((n * W - L + 30 * n) / (n - 1), W + 20 / game.documentZoom);
				itemContainer.style.setProperty("--ml", "-" + ml + "px");
			}
		};
	},

	// 初始化UI扩展
	initUIExtensions() {
		ui.click.identity = uiClickIdentity;
		ui.click.volumn = uiClickVolumn;
		ui.clear = uiClear;
		ui.create.me = uiCreateMe;
		ui.create.player = createPlayerElement;
		ui.create.card = createCardElement;
		ui.create.cards = createCardsWrapper(this);
		lib.init.layout = createLayoutInit();
		definePlayerGroupProperty();
	},

	dialog: createDecadeUIDialogModule(),
	animate: createDecadeUIAnimateModule(),
	ResizeSensor: createResizeSensorClass(),
	sheet: createSheetModule(),
	layout: createLayoutModule(),
	handler: createHandlerModule(),
	zooms: { body: 1, card: 1 },
	create: createDecadeUICreateModule(),
	get: createDecadeUIGetModule(),
	set: createDecadeUISetModule(),
	statics: createStaticsModule(),
	dataset: { animSizeUpdated: false, bodySizeUpdated: false, bodySize: { height: 1, width: 1, updated: false } },
});

// ==================== 辅助工厂函数 ====================

/** 创建player.$init方法 */
function createPlayerInit(base) {
	return function (character, character2) {
		base.lib.element.player.$init.apply(this, arguments);
		this.doubleAvatar = (character2 && lib.character[character2]) !== undefined;

		// othersOff样式下检查武将原画
		if (lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
			this.checkAndAddExperienceSuffix(character);
			if (character2) this.checkAndAddExperienceSuffix(character2);
		}

		// 边框等级
		const borderLevel = lib.config.extension_十周年UI_borderLevel;
		if (borderLevel === "random") {
			const levels = ["one", "two", "three", "four", "five"];
			this.dataset.borderLevel = levels[Math.floor(Math.random() * levels.length)];
		} else {
			delete this.dataset.borderLevel;
		}

		// 动态皮肤
		let CUR_DYNAMIC = decadeUI.CUR_DYNAMIC ?? 0;
		let MAX_DYNAMIC = decadeUI.MAX_DYNAMIC ?? (decadeUI.isMobile() ? 2 : 10) + (window.OffscreenCanvas ? 8 : 0);
		decadeUI.CUR_DYNAMIC = CUR_DYNAMIC;
		decadeUI.MAX_DYNAMIC = MAX_DYNAMIC;

		if (this.dynamic) this.stopDynamic();
		const showDynamic = (this.dynamic || CUR_DYNAMIC < MAX_DYNAMIC) && duicfg.dynamicSkin;
		if (showDynamic && _status.mode !== null) {
			const dskins = decadeUI.dynamicSkin;
			const avatars = this.doubleAvatar ? [character, character2] : [character];
			let increased;
			for (let i = 0; i < avatars.length; i++) {
				const skins = dskins[avatars[i]];
				if (!skins) continue;
				const keys = Object.keys(skins);
				if (!keys.length) {
					console.error(`player.init: ${avatars[i]} 没有设置动皮参数`);
					continue;
				}
				const skin = skins[keys[0]];
				if (skin.speed === undefined) skin.speed = 1;
				this.playDynamic(
					{
						name: skin.name,
						action: skin.action,
						loop: true,
						loopCount: -1,
						speed: skin.speed,
						filpX: undefined,
						filpY: undefined,
						opacity: undefined,
						x: skin.x,
						y: skin.y,
						scale: skin.scale,
						angle: skin.angle,
						hideSlots: skin.hideSlots,
						clipSlots: skin.clipSlots,
					},
					i === 1
				);
				this.$dynamicWrap.style.backgroundImage = `url("${decadeUIPath}assets/dynamic/${skin.background}")`;
				if (!increased) {
					increased = true;
					decadeUI.CUR_DYNAMIC++;
				}
			}
		}

		// 手牌可见功能
		if (!this.node.showCards) {
			const player = this;
			player.node.showCards = decadeUI.element.create("handdisplays", player);
			player.node.showCards.hide();

			const rect = player.getBoundingClientRect();
			const winWidth = window.innerWidth || document.documentElement.clientWidth;
			const showCards = player.node.showCards;
			const offset = 10;
			const isBabysha = lib.config.extension_十周年UI_newDecadeStyle === "babysha";
			if ((isBabysha && rect.left < winWidth / 2) || (!isBabysha && rect.left >= winWidth / 2)) {
				showCards.style.left = "";
				showCards.style.right = player.offsetWidth + offset + "px";
			} else {
				showCards.style.left = player.offsetWidth + offset + "px";
				showCards.style.right = "";
			}
			showCards.style.top = "90px";

			player.node.showCards.onclick = function () {
				const cards = player.getCards("h", c => get.is.shownCard(c) || player.isUnderControl(true) || game.me?.hasSkillTag("viewHandcard", null, player, true));
				if (cards.length > 0) {
					const popup = ui.create.div(".popup-container", ui.window);
					const handdisplay = ui.create.dialog(get.translation(player) + "的手牌", cards);
					handdisplay.static = true;
					popup.addEventListener("click", () => {
						popup.delete();
						handdisplay.close();
						handdisplay.delete();
					});
				}
			};

			["handcards1", "handcards2"].forEach(zone => {
				const observer = new MutationObserver(mutations => {
					for (const m of mutations) {
						if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
							player.decadeUI_updateShowCards();
							break;
						}
					}
				});
				observer.observe(player.node[zone], { childList: true });
			});
		}

		// 十周年角标
		if (window.decadeModule?.prefixMark) {
			window.decadeModule.prefixMark.showPrefixMark(character, this);
			if (character2 && this.doubleAvatar) window.decadeModule.prefixMark.showPrefixMark(character2, this);
		}

		this._addPrefixSeparator(this.node.name);
		if (this.doubleAvatar && this.node.name2) this._addPrefixSeparator(this.node.name2);

		// 冰可乐彩蛋
		if (lib.config.extension_十周年UI_cardPrettify === "bingkele" && character === "bozai") {
			this.node.avatar.setBackgroundImage("extension/十周年UI/image/bingkele.png");
			if (this.node.name) this.node.name.innerHTML = "冰可乐喵";
		}

		this.decadeUI_updateShowCards();
		return this;
	};
}

/** 创建角色按钮预设 */
function createCharacterButtonPreset() {
	return function (item, type, position, noclick, node) {
		if (node) {
			node.classList.add("button", "character", "decadeUI");
			node.style.display = "";
		} else {
			node = ui.create.div(".button.character.decadeUI");
		}
		node._link = item;

		if (type === "characterx") {
			if (_status.noReplaceCharacter) type = "character";
			else if (lib.characterReplace[item]?.length) item = lib.characterReplace[item].randomGet();
		}
		if (type === "characterx" && lib.characterReplace[item]?.length) item = lib.characterReplace[item].randomGet();

		node.link = item;
		dui.element.create("character", node);

		const doubleCamp = get.is.double(node._link, true);
		if (doubleCamp) node._changeGroup = true;
		if (type === "characterx" && lib.characterReplace[node._link]?.length > 1) node._replaceButton = true;

		node.refresh = function (node, item, intersection) {
			if (intersection) {
				node.awaitItem = item;
				intersection.observe(node);
			} else node.setBackground(item, "character");

			if (node.node) {
				node.node.name.remove();
				node.node.hp.remove();
				node.node.group.remove();
				node.node.intro.remove();
				if (node.node.replaceButton) node.node.replaceButton.remove();
			}

			node.node = {
				name: decadeUI.element.create("name", node),
				hp: decadeUI.element.create("hp", node),
				group: decadeUI.element.create("identity", node),
				intro: decadeUI.element.create("intro", node),
				info: decadeUI.element.create("info", node),
			};

			const infoitem = get.character(item);
			node.node.name.innerHTML = get.slimName(item);

			if (lib.config.buttoncharacter_style === "default" || lib.config.buttoncharacter_style === "simple") {
				if (lib.config.buttoncharacter_style === "simple") node.node.group.style.display = "none";
				node.classList.add("newstyle");
				node.node.name.dataset.nature = get.groupnature(get.bordergroup(infoitem));
				node.node.group.dataset.nature = get.groupnature(get.bordergroup(infoitem), "raw");
				ui.create.div(node.node.hp);

				const hp = get.infoHp(infoitem[2]);
				const maxHp = get.infoMaxHp(infoitem[2]);
				const hujia = get.infoHujia(infoitem[2]);
				const check = (get.mode() === "single" && _status.mode === "changban") || ((get.mode() === "guozhan" || (cfg => (typeof cfg === "string" ? cfg === "double" : Boolean(cfg)))(_status.connectMode ? lib.configOL.double_character : get.config("double_character"))) && (_status.connectMode || (_status.connectMode ? lib.configOL.double_hp : get.config("double_hp")) === "pingjun"));

				let str = get.numStr(hp / (check ? 2 : 1));
				if (hp !== maxHp) str += "/" + get.numStr(maxHp / (check ? 2 : 1));
				ui.create.div(".text", str, node.node.hp);

				if (infoitem[2] === 0) node.node.hp.hide();
				else if (get.infoHp(infoitem[2]) <= 3) node.node.hp.dataset.condition = "mid";
				else node.node.hp.dataset.condition = "high";

				if (hujia > 0) {
					ui.create.div(node.node.hp, ".shield");
					ui.create.div(".text", get.numStr(hujia), node.node.hp);
				}
			} else {
				const hp = get.infoHp(infoitem[2]);
				const maxHp = get.infoMaxHp(infoitem[2]);
				const shield = get.infoHujia(infoitem[2]);
				if (maxHp > 14) {
					node.node.hp.innerHTML = typeof infoitem[2] === "string" ? infoitem[2] : get.numStr(infoitem[2]);
					node.node.hp.classList.add("text");
				} else {
					for (let i = 0; i < maxHp; i++) {
						const next = ui.create.div("", node.node.hp);
						if (i >= hp) next.classList.add("exclude");
					}
					for (let i = 0; i < shield; i++) ui.create.div(node.node.hp, ".shield");
				}
			}

			if (!node.node.hp.childNodes.length) node.node.name.style.top = "8px";
			if (node.node.name.querySelectorAll("br").length >= 4) {
				node.node.name.classList.add("long");
				if (lib.config.buttoncharacter_style === "old") {
					node.addEventListener("mouseenter", ui.click.buttonnameenter);
					node.addEventListener("mouseleave", ui.click.buttonnameleave);
				}
			}

			node.node.intro.innerText = lib.config.intro;
			if (!noclick) lib.setIntro(node);

			if (infoitem[1]) {
				const doubleCamp = get.is.double(item, true);
				if (doubleCamp) {
					node.node.group.innerHTML = doubleCamp.reduce((prev, cur) => `${prev}<div data-nature="${get.groupnature(cur)}">${get.translation(cur)}</div>`, "");
					if (doubleCamp.length > 4) {
						node.node.group.style.height = new Set([5, 6, 9]).has(doubleCamp.length) ? "48px" : "64px";
					}
				} else {
					node.node.group.innerHTML = `<div>${get.translation(infoitem[1])}</div>`;
				}
				node.node.group.style.backgroundColor = get.translation(`${get.bordergroup(infoitem)}Color`);
			} else {
				node.node.group.style.display = "none";
			}

			if (node._replaceButton) {
				const intro = ui.create.div(".button.replaceButton", node);
				node.node.replaceButton = intro;
				intro.innerText = "切换";
				intro._node = node;
				intro.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
					_status.tempNoButton = true;
					const n = this._node;
					const list = lib.characterReplace[n._link];
					let link = n.link;
					let index = list.indexOf(link);
					index = index === list.length - 1 ? 0 : index + 1;
					n.link = list[index];
					n.refresh(n, list[index]);
					setTimeout(() => {
						_status.tempNoButton = undefined;
					}, 200);
				});
			}
		};

		node.refresh(node, item, position?.intersection);
		if (position) position.appendChild(node);
		return node;
	};
}

/** 创建player元素 */
function createPlayerElement(position, noclick) {
	const player = ui.create.div(".player", position);
	const playerExtend = {
		node: {
			avatar: ui.create.div(".primary-avatar", player, ui.click.avatar).hide(),
			avatar2: ui.create.div(".deputy-avatar", player, ui.click.avatar2).hide(),
			turnedover: decadeUI.element.create("turned-over", player),
			framebg: ui.create.div(".framebg", player),
			intro: ui.create.div(".intro", player),
			identity: ui.create.div(".identity", player),
			hp: ui.create.div(".hp", player),
			long: ui.create.div(".long", player),
			wei: ui.create.div(".wei", player),
			name: ui.create.div(".name", player),
			name2: ui.create.div(".name.name2", player),
			nameol: ui.create.div(".nameol", player),
			count: ui.create.div(".card-count", player),
			equips: ui.create.div(".equips", player).hide(),
			judges: ui.create.div(".judges", player),
			marks: decadeUI.element.create("dui-marks", player),
			chain: decadeUI.element.create("chain", player),
			handcards1: ui.create.div(".handcards"),
			handcards2: ui.create.div(".handcards"),
			expansions: ui.create.div(".expansions"),
		},
		phaseNumber: 0,
		invisibleSkills: [],
		skipList: [],
		skills: [],
		initedSkills: [],
		additionalSkills: {},
		disabledSkills: {},
		hiddenSkills: [],
		awakenedSkills: [],
		forbiddenSkills: {},
		popups: [],
		damagepopups: [],
		judging: [],
		extraEquip: [],
		stat: [{ card: {}, skill: {}, triggerSkill: {} }],
		actionHistory: [{ useCard: [], respond: [], skipped: [], lose: [], gain: [], sourceDamage: [], damage: [], custom: [], useSkill: [] }],
		tempSkills: {},
		storage: {
			counttrigger: new Proxy(
				{},
				{
					get(_, prop) {
						return player.getStat("triggerSkill")[prop];
					},
					set(_, prop, value) {
						player.getStat("triggerSkill")[prop] = value;
						return true;
					},
					deleteProperty(_, prop) {
						delete player.getStat("triggerSkill")[prop];
						return true;
					},
					has(_, prop) {
						return prop in player.getStat("triggerSkill");
					},
					ownKeys() {
						return Reflect.ownKeys(player.getStat("triggerSkill"));
					},
					getOwnPropertyDescriptor(_, prop) {
						return Object.getOwnPropertyDescriptor(player.getStat("triggerSkill"), prop);
					},
				}
			),
		},
		marks: {},
		expandedSlots: {},
		disabledSlots: {},
		ai: { friend: [], enemy: [], neutral: [], handcards: { global: [], source: [], viewed: [] } },
		queueCount: 0,
		outCount: 0,
		vcardsMap: { handcards: [], equips: [], judges: [] },
	};

	// 锁链图片
	const chainImg = new Image();
	chainImg.onerror = function () {
		const node = decadeUI.element.create("chain-back", player.node.chain);
		for (let i = 0; i < 40; i++) decadeUI.element.create("cardbg", node).style.transform = `translateX(${i * 5 - 5}px)`;
		chainImg.onerror = undefined;
	};
	chainImg.src = decadeUIPath + "assets/image/tie_suo.png";

	const extend = {
		$cardCount: playerExtend.node.count,
		$dynamicWrap: decadeUI.element.create("dynamic-wrap"),
	};

	playerExtend.node.handcards1._childNodesWatcher = new ChildNodesWatcher(playerExtend.node.handcards1);
	playerExtend.node.handcards2._childNodesWatcher = new ChildNodesWatcher(playerExtend.node.handcards2);

	decadeUI.get.extend(player, extend);
	decadeUI.get.extend(player, playerExtend);
	Object.setPrototypeOf(player, lib.element.Player.prototype);

	player.node.action = ui.create.div(".action", player.node.avatar);

	// 身份显示
	const realIdentity = ui.create.div(player.node.identity);
	realIdentity.player = player;
	setupIdentityDisplay(realIdentity, player);

	// 手牌数显示
	Object.defineProperties(player.node.count, {
		innerHTML: {
			configurable: true,
			get() {
				return this.textContent;
			},
			set(value) {
				if (this.textContent !== value) {
					this.textContent = value;
					this.dataset.text = value;
				}
			},
		},
	});

	// 装备区监听
	const observer = new MutationObserver(mutations => {
		for (const m of mutations) {
			if (m.type === "childList") {
				const hasChange = Array.from(m.addedNodes).some(n => !n.classList?.contains("emptyequip")) || Array.from(m.removedNodes).some(n => !n.classList?.contains("emptyequip"));
				if (hasChange) player.$handleEquipChange();
			}
		}
	});
	observer.observe(playerExtend.node.equips, { childList: true });

	// 事件绑定
	if (!noclick) {
		player.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.target);
		player.node.identity.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity);
		if (lib.config.touchscreen) player.addEventListener("touchstart", ui.click.playertouchstart);
	} else {
		player.noclick = true;
	}

	// 势力包装
	const campWrap = decadeUI.element.create("camp-wrap");
	const hpWrap = decadeUI.element.create("hp-wrap");
	player.insertBefore(campWrap, player.node.name);
	player.insertBefore(hpWrap, player.node.hp);
	player.node.campWrap = campWrap;
	player.node.hpWrap = hpWrap;
	hpWrap.appendChild(player.node.hp);

	const campWrapExtend = {
		node: {
			back: decadeUI.element.create("camp-back", campWrap),
			border: decadeUI.element.create("camp-border", campWrap),
			campName: decadeUI.element.create("camp-name", campWrap),
			avatarName: player.node.name,
			avatarDefaultName: decadeUI.element.create("avatar-name-default", campWrap),
		},
	};
	decadeUI.get.extend(campWrap, campWrapExtend);
	campWrap.appendChild(player.node.name);
	campWrap.node.avatarName.className = "avatar-name";
	campWrap.node.avatarDefaultName.innerHTML = get.mode() === "guozhan" ? "主将" : "隐匿";

	const node = {
		mask: player.insertBefore(decadeUI.element.create("mask"), player.node.identity),
		gainSkill: decadeUI.element.create("gain-skill", player),
	};

	node.gainSkill.player = player;
	node.gainSkill.skills = [];
	node.gainSkill.gain = function (skill) {
		if (!this.skills.includes(skill) && lib.translate[skill]) {
			if (lib.config.extension_十周年UI_newDecadeStyle === "off" && lib.config.extension_十周年UI_gainSkillsVisible !== "off") {
				const info = lib.skill[skill];
				if (!info || info.charlotte || info.sub || (info.mark && !info.limited) || info.nopop || info.popup === false || info.equipSkill) return;
				if (info.onremove && game.me !== this.player.storage[skill]) return;
				if (lib.config.extension_十周年UI_gainSkillsVisible === "othersOn" && this.player === game.me) return;
				if (!info.intro) info.intro = { content: () => get.skillInfoTranslation(skill, this.player, false) };
				this.player.markSkill(skill);
			}
			this.skills.push(skill);
			this.innerHTML = this.skills.map(s => lib.translate[s]).join(" ");
		}
	};
	node.gainSkill.lose = function (skill) {
		const index = this.skills.indexOf(skill);
		if (index >= 0) {
			this.skills.splice(index, 1);
			this.innerHTML = this.skills.map(s => lib.translate[s]).join(" ");
		}
	};

	decadeUI.get.extend(player.node, node);
	return player;
}

/** 设置身份显示 */
function setupIdentityDisplay(realIdentity, player) {
	Object.defineProperties(realIdentity, {
		innerHTML: {
			configurable: true,
			get() {
				return this.innerText;
			},
			set(value) {
				if (get.mode() === "guozhan" || _status.mode === "jiange" || _status.mode === "siguo") {
					this.style.display = "none";
					this.innerText = value;
					this.parentNode.classList.add("guozhan-mode");
					return;
				}

				const currentStyle = lib.config.extension_十周年UI_newDecadeStyle;
				if (currentStyle === "codename" && value === "猜") {
					this.innerText = "";
					this.style.visibility = "";
					this.parentNode.style.backgroundImage = "";
					return;
				}

				const identity = this.parentNode.dataset.color;
				const handlerMap = {
					猜: () => {
						let f = "cai";
						if (_status.mode === "purple" && identity === "cai") f += "_blue";
						return f;
					},
					友: () => "friend",
					敌: () => "enemy",
					反: () => (get.mode() === "doudizhu" ? "nongmin" : "fan"),
					主: () => {
						let f = "zhu";
						if (get.mode() === "versus" && get.translation(player.side + "Color") === "wei") {
							f += "_blue";
							player.classList.add("opposite-camp");
						} else if (get.mode() === "doudizhu") f = "dizhu";
						return f;
					},
					忠: () => {
						if (get.mode() === "identity" && _status.mode === "purple") return "qianfeng";
						if (get.mode() === "versus" && get.translation(player.side + "Color") === "wei") {
							player.classList.add("opposite-camp");
							return "zhong_blue";
						}
						return "zhong";
					},
					内: () => (_status.mode === "purple" ? (identity === "rNei" ? "xizuo" : "xizuo_blue") : "nei"),
					野: () => "ye",
					首: () => "zeishou",
					帅: () => "zhushuai",
					将: () => (_status.mode === "three" || get.translation(player.side + "Color") === "wei" ? "zhushuai_blue" : "dajiang"),
					兵: () => (player.side === false ? "qianfeng_blue" : "qianfeng"),
					卒: () => (player.side === false ? "qianfeng_blue" : "qianfeng"),
					师: () => "junshi",
					盟: () => "mengjun",
					神: () => "boss",
					从: () => "suicong",
					先: () => "xianshou",
					后: () => "houshou",
					民: () => "commoner",
				};

				const handler = handlerMap[value];
				if (!handler) {
					this.innerText = value;
					this.style.visibility = "";
					this.parentNode.style.backgroundImage = "";
					return;
				}

				let filename = handler();
				const checked = ["cai_blue", "nongmin", "dizhu", "zhong_blue", "xizuo", "xizuo_blue", "zhushuai_blue", "qianfeng_blue", "qianfeng"].includes(filename);
				if (!checked && this.parentNode.dataset.color?.[0] === "b") {
					filename += "_blue";
					player.classList.add("opposite-camp");
				}

				this.innerText = value;
				this.style.visibility = "hidden";

				const style = lib.config.extension_十周年UI_newDecadeStyle;
				const srcMap = {
					onlineUI: "image/decorationo/identity2_",
					babysha: "image/decorationh/identity3_",
					on: "image/decoration/identity_",
					othersOff: "image/decoration/identity_",
					codename: "image/decoration_code/identity5_",
				};
				const srcPrefix = srcMap[style] || "image/decorations/identity2_";
				const src = decadeUIPath + srcPrefix + filename + ".png";

				const image = new Image();
				image.node = this;
				image.onerror = function () {
					this.node.style.visibility = "";
				};
				image.src = src;
				this.parentNode.style.backgroundImage = `url("${src}")`;
			},
		},
	});
}

/** 创建card元素 */
function createCardElement(position, info, noclick) {
	const card = ui.create.div(".card");
	card.node = {
		image: ui.create.div(".image", card),
		info: ui.create.div(".info"),
		suitnum: decadeUI.element.create("suit-num", card),
		name: ui.create.div(".name", card),
		name2: ui.create.div(".name2", card),
		background: ui.create.div(".background", card),
		intro: ui.create.div(".intro", card),
		range: ui.create.div(".range", card),
		gaintag: decadeUI.element.create("gaintag info", card),
		judgeMark: decadeUI.element.create("judge-mark", card),
		cardMask: decadeUI.element.create("card-mask", card),
	};

	const extend = {
		$name: decadeUI.element.create("top-name", card),
		$vertname: card.node.name,
		$equip: card.node.name2,
		$suitnum: card.node.suitnum,
		$range: card.node.range,
		$gaintag: card.node.gaintag,
	};
	for (const i in extend) card[i] = extend[i];

	Object.setPrototypeOf(card, lib.element.Card.prototype);
	card.node.intro.innerText = lib.config.intro;
	if (!noclick) lib.setIntro(card);

	card.storage = {};
	card.vanishtag = [];
	card.gaintag = [];
	card._uncheck = [];

	if (info !== "noclick") {
		card.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
		if (lib.config.touchscreen) {
			card.addEventListener("touchstart", ui.click.cardtouchstart);
			card.addEventListener("touchmove", ui.click.cardtouchmove);
		}
		if (lib.cardSelectObserver) lib.cardSelectObserver.observe(card, { attributes: true });
	}

	card.$suitnum.$num = decadeUI.element.create(null, card.$suitnum, "span");
	card.$suitnum.$num.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
	card.$suitnum.$br = decadeUI.element.create(null, card.$suitnum, "br");
	card.$suitnum.$suit = decadeUI.element.create("suit", card.$suitnum, "span");
	card.$suitnum.$suit.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
	card.$equip.$suitnum = decadeUI.element.create(null, card.$equip, "span");
	card.$equip.$name = decadeUI.element.create(null, card.$equip, "span");

	card.node.judgeMark.node = {
		back: decadeUI.element.create("back", card.node.judgeMark),
		mark: decadeUI.element.create("mark", card.node.judgeMark),
		judge: decadeUI.element.create("judge", card.node.judgeMark),
	};

	if (position) position.appendChild(card);
	return card;
}

/** 创建cards包装器 */
function createCardsWrapper(ctx) {
	const baseCreate = ui.create.cards;
	return function () {
		const result = baseCreate.apply(this, arguments);
		game.updateRoundNumber();
		return result;
	};
}

/** 创建布局初始化函数 */
function createLayoutInit() {
	return function (layout, nosave) {
		if (!nosave) game.saveConfig("layout", layout);
		game.layout = layout;

		const relayout = function () {
			ui.arena.dataset.layout = game.layout;
			if (lib.config.phonelayout) {
				ui.css.phone.href = lib.assetURL + "layout/default/phone.css";
				ui.arena.classList.add("phone");
				ui.arena.setAttribute("data-phonelayout", "on");
			} else {
				ui.css.phone.href = "";
				ui.arena.classList.remove("phone");
				ui.arena.setAttribute("data-phonelayout", "off");
			}

			for (const p of game.players) {
				if (get.is.linked2(p)) {
					if (p.classList.contains("linked")) {
						p.classList.remove("linked");
						p.classList.add("linked2");
					}
				} else {
					if (p.classList.contains("linked2")) {
						p.classList.remove("linked2");
						p.classList.add("linked");
					}
				}
			}

			ui.updatej();
			ui.updatem();
			setTimeout(() => {
				if (game.me) game.me.update();
				setTimeout(() => ui.updatex(), 500);
				setTimeout(() => ui.updatec(), 1000);
			}, 100);
		};
		setTimeout(relayout, 500);
	};
}

/** 定义player.group属性 */
function definePlayerGroupProperty() {
	Object.defineProperties(lib.element.player, {
		group: {
			configurable: true,
			get() {
				return this._group;
			},
			set(group) {
				if (!group) return;
				this._group = group;
				this.node.campWrap.dataset.camp = get.character(this.name)?.groupBorder || group;

				if (lib.config.extension_十周年UI_forcestyle === "2") {
					handleGroupStyleV2.call(this, group);
				} else {
					handleGroupStyleDefault.call(this, group);
				}
			},
		},
	});
}

/** 处理势力样式V2 */
function handleGroupStyleV2(group) {
	if (!decadeUI.config.campIdentityImageMode) {
		if (!this._finalGroup) {
			this.node.campWrap.node.campName.innerHTML = "";
		} else {
			const name = get.translation(this._finalGroup);
			const str = get.plainText(name);
			this.node.campWrap.node.campName.innerHTML = str.length <= 2 ? name : name.replaceAll(str, str[0]);
		}
	} else {
		this._lastCampTask = this._lastCampTask || Promise.resolve();
		this._lastCampTask = this._lastCampTask.then(async () => {
			this.node.campWrap.node.campName.innerHTML = "";
			this.node.campWrap.node.campName.style.backgroundImage = "";
			this._finalGroup = group;

			const create = () => {
				if (decadeUI.config.newDecadeStyle === "codename" || !this._finalGroup) {
					this.node.campWrap.node.campName.innerHTML = "";
				} else {
					const name = get.translation(this._finalGroup);
					const str = get.plainText(name);
					this.node.campWrap.node.campName.innerHTML = str.length <= 2 ? name : name.replaceAll(str, str[0]);
				}
			};

			const loadImage = url =>
				new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(url);
					img.onerror = () => reject(url);
					img.src = url;
				});

			if (decadeUI.config.newDecadeStyle === "onlineUI") {
				create();
				return;
			}

			try {
				const prefix = decadeUI.config.newDecadeStyle === "off" ? "image/decorations/name2_" : decadeUI.config.newDecadeStyle === "babysha" ? "image/decorationh/hs_" : "image/decoration/name_";
				const url = decadeUIPath + prefix + group + ".png";
				await loadImage(url);
				this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
				return;
			} catch {}

			try {
				const imageName = `group_${group}`;
				const info = lib.card[imageName];
				if (!info?.image) throw new Error();
				let src;
				if (info.image.startsWith("db:")) src = await game.getDB("image", info.image.slice(3));
				else if (info.image.startsWith("ext:")) src = `${lib.assetURL}${info.image.replace(/^ext:/, "extension/")}`;
				else src = `${lib.assetURL}${info.image}`;
				await loadImage(src);
				this.node.campWrap.node.campName.style.backgroundImage = `url("${src}")`;
				return;
			} catch {}

			create();
		});
	}
}

/** 处理势力样式默认 */
function handleGroupStyleDefault(group) {
	if (decadeUI.config.newDecadeStyle === "codename") {
		this.node.campWrap.node.campName.innerHTML = "";
	} else if (!this._finalGroup) {
		this.node.campWrap.node.campName.innerHTML = "";
	} else {
		const name = get.translation(this._finalGroup);
		const str = get.plainText(name);
		this.node.campWrap.node.campName.innerHTML = str.length <= 1 ? name : str[0];
	}

	if (decadeUI.config.newDecadeStyle === "off") {
		const prefix = "image/decorations/name2_";
		const url = decadeUIPath + prefix + group + ".png";
		this._finalGroup = group;

		const image = new Image();
		image.onerror = () => {
			if (decadeUI.config.newDecadeStyle === "codename" || !this._finalGroup) {
				this.node.campWrap.node.campName.innerHTML = "";
			} else {
				const name = get.translation(this._finalGroup);
				const str = get.plainText(name);
				this.node.campWrap.node.campName.innerHTML = str.length <= 1 ? name : str[0];
			}
		};
		this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
		image.src = url;
	} else {
		this._finalGroup = group;
		if (decadeUI.config.newDecadeStyle === "codename" || !this._finalGroup) {
			this.node.campWrap.node.campName.innerHTML = "";
		} else {
			const name = get.translation(this._finalGroup);
			const str = get.plainText(name);
			this.node.campWrap.node.campName.innerHTML = str.length <= 1 ? name : str[0];
		}
	}
}

// ==================== 模块工厂函数 ====================

/** 创建sheet模块 */
function createSheetModule() {
	return {
		init() {
			if (!this.sheetList) {
				this.sheetList = [];
				for (let i = 0; i < document.styleSheets.length; i++) {
					if (document.styleSheets[i].href?.indexOf("extension/" + encodeURI(decadeUIName)) !== -1) {
						this.sheetList.push(document.styleSheets[i]);
					}
				}
			}
			if (this.sheetList) delete this.init;
		},
		getStyle(selector, cssName) {
			if (!this.sheetList) this.init();
			if (!this.sheetList) throw "sheet not loaded";
			if (typeof selector !== "string" || !selector) throw 'parameter "selector" error';
			if (!this.cachedSheet) this.cachedSheet = {};
			if (this.cachedSheet[selector]) return this.cachedSheet[selector];

			const sheetList = this.sheetList;
			let sheet,
				shouldBreak = false;

			for (let j = sheetList.length - 1; j >= 0; j--) {
				if (typeof cssName === "string") {
					cssName = cssName.replace(/.css/, "") + ".css";
					for (let k = j; k >= 0; k--) {
						if (sheetList[k].href.indexOf(cssName) !== -1) sheet = sheetList[k];
					}
					shouldBreak = true;
					if (!sheet) throw "cssName not found";
				} else {
					sheet = sheetList[j];
				}

				try {
					for (let i = 0; i < sheet.cssRules.length; i++) {
						if (!(sheet.cssRules[i] instanceof CSSMediaRule)) {
							if (sheet.cssRules[i].selectorText === selector) {
								this.cachedSheet[selector] = sheet.cssRules[i].style;
								return sheet.cssRules[i].style;
							}
						} else {
							const rules = sheet.cssRules[i].cssRules;
							for (let k = 0; k < rules.length; k++) {
								if (rules[k].selectorText === selector) return rules[k].style;
							}
						}
					}
				} catch (e) {
					console.error(e, "error-sheet", sheet);
				}
				if (shouldBreak) break;
			}
			return null;
		},
		insertRule(rule, index, cssName) {
			if (!this.sheetList) this.init();
			if (!this.sheetList) throw "sheet not loaded";
			if (typeof rule !== "string" || !rule) throw 'parameter "rule" error';

			let sheet;
			if (typeof cssName === "string") {
				cssName = cssName.replace(/.css/, "") + ".css";
				for (let j = this.sheetList.length - 1; j >= 0; j--) {
					if (this.sheetList[j].href.indexOf(cssName) !== -1) sheet = this.sheetList[j];
				}
				if (!sheet) throw "cssName not found";
			}
			if (!sheet) sheet = this.sheetList[this.sheetList.length - 1];

			const inserted = typeof index === "number" ? sheet.insertRule(rule, index) : sheet.insertRule(rule, sheet.cssRules.length);
			return sheet.cssRules[inserted].style;
		},
	};
}

/** 创建layout模块 */
function createLayoutModule() {
	return {
		update() {
			this.updateHand();
			this.updateDiscard();
		},

		updateHand() {
			if (!game.me) return;
			const handNode = ui.handcards1;
			if (!handNode) return console.error("hand undefined");

			const cards = [];
			for (const card of handNode.childNodes) {
				if (!card.classList.contains("removing")) cards.push(card);
				else card.scaled = false;
			}
			if (!cards.length) return;

			const bounds = dui.boundsCaches.hand;
			bounds.check();
			const pw = bounds.width,
				cw = bounds.cardWidth,
				ch = bounds.cardHeight,
				cs = bounds.cardScale;
			const csw = cw * cs;
			const y = Math.round((ch * cs - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			let totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;
			let expand;

			if (totalW > limitW) {
				xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
				if (lib.config.fold_card) {
					const min = cs * 9;
					if (xMargin < min) {
						expand = true;
						xMargin = min;
					}
				}
			} else {
				const style = lib.config.extension_十周年UI_newDecadeStyle;
				if (style === "codename" || style === "on" || style === "othersOff") {
					if (!lib.config.phonelayout) {
						xStart = (ui.arena.offsetWidth - totalW) / 2 - bounds.x;
					}
				}
			}

			let selectedIndex = -1;
			for (let i = 0; i < cards.length; i++) {
				if (cards[i].classList.contains("selected")) {
					if (selectedIndex !== -1) {
						selectedIndex = -1;
						break;
					}
					selectedIndex = i;
				}
			}

			const folded = totalW > limitW && xMargin < csw - 0.5;
			let spreadOffsetLeft = 0,
				spreadOffsetRight = 0,
				baseShift = 0;
			if (folded && selectedIndex !== -1) {
				const spreadOffset = Math.max(0, csw - xMargin + 2);
				spreadOffsetLeft = Math.round(spreadOffset * 0.2);
				spreadOffsetRight = spreadOffset;
				const selX = xStart + selectedIndex * xMargin;
				const maxSelX = Math.max(0, limitW - csw);
				baseShift = Math.round(Math.max(0, Math.min(maxSelX, selX)) - selX);
			}

			for (let i = 0; i < cards.length; i++) {
				let fx = xStart + i * xMargin + baseShift;
				if (spreadOffsetLeft || spreadOffsetRight) {
					if (i < selectedIndex) fx -= spreadOffsetLeft;
					else if (i > selectedIndex) fx += spreadOffsetRight;
				}
				const x = Math.round(fx);
				const card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = `translate(${x}px,${y}px) scale(${cs})`;
				card._transform = card.style.transform;
				card.updateTransform(card.classList.contains("selected"));
			}

			if (expand) {
				ui.handcards1Container.classList.add("scrollh");
				ui.handcards1Container.style.overflowX = "scroll";
				ui.handcards1Container.style.overflowY = "hidden";
				handNode.style.width = Math.round(cards.length * xMargin + (csw - xMargin)) + "px";
			} else {
				ui.handcards1Container.classList.remove("scrollh");
				ui.handcards1Container.style.overflowX = "";
				ui.handcards1Container.style.overflowY = "";
				handNode.style.width = "100%";
			}
		},

		updateDiscard() {
			if (!ui.thrown) ui.thrown = [];
			for (let i = ui.thrown.length - 1; i >= 0; i--) {
				const t = ui.thrown[i];
				if (t.classList.contains("drawingcard") || t.classList.contains("removing") || t.parentNode !== ui.arena || t.fixed) {
					ui.thrown.splice(i, 1);
				} else {
					t.classList.remove("removing");
				}
			}
			if (!ui.thrown.length) return;

			const cards = ui.thrown;
			const bounds = dui.boundsCaches.arena;
			bounds.check();
			const pw = bounds.width,
				ph = bounds.height,
				cw = bounds.cardWidth,
				ch = bounds.cardHeight;
			const discardScale = lib?.config?.extension_十周年UI_discardScale || 0.14;
			const bodySize = decadeUI.get.bodySize();
			const cs = Math.min((bodySize.height * discardScale) / ch, 1);
			const csw = cw * cs;
			const y = Math.round((ph - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			const totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;

			if (totalW > limitW) xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
			else xStart += (limitW - totalW) / 2;

			for (let i = 0; i < cards.length; i++) {
				const x = Math.round(xStart + i * xMargin);
				const card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = `translate(${x}px,${y}px) scale(${cs})`;
			}
		},

		clearout(card) {
			if (!card || card.fixed || card.classList.contains("removing")) return;
			if (card.name?.startsWith("shengbei_left_") || card.name?.startsWith("shengbei_right_")) {
				card.delete();
				return;
			}
			if (ui.thrown.indexOf(card) === -1) {
				ui.thrown.splice(0, 0, card);
				dui.queueNextFrameTick(dui.layoutDiscard, dui);
			}
			card.classList.add("invalided");
			setTimeout(
				c => {
					c.remove();
					dui.queueNextFrameTick(dui.layoutDiscard, dui);
				},
				2333,
				card
			);
		},

		_debounce(config) {
			let timestamp = config.defaultDelay;
			const nowTime = Date.now();
			if (this[config.timeoutKey]) {
				clearTimeout(this[config.timeoutKey]);
				timestamp = nowTime - this[config.timeKey];
				if (timestamp > config.maxDelay) {
					this[config.timeoutKey] = null;
					this[config.timeKey] = null;
					config.immediateCallback();
					return;
				}
			} else {
				this[config.timeKey] = nowTime;
			}
			this[config.timeoutKey] = setTimeout(() => {
				decadeUI.layout[config.timeoutKey] = null;
				decadeUI.layout[config.timeKey] = null;
				config.callback();
			}, timestamp);
		},

		delayClear() {
			this._debounce({
				defaultDelay: 500,
				maxDelay: 1000,
				timeoutKey: "_delayClearTimeout",
				timeKey: "_delayClearTimeoutTime",
				immediateCallback: () => ui.clear(),
				callback: () => ui.clear(),
			});
		},

		invalidate() {
			this.invalidateHand();
			this.invalidateDiscard();
		},

		invalidateHand() {
			this._debounce({
				defaultDelay: 40,
				maxDelay: 180,
				timeoutKey: "_handcardTimeout",
				timeKey: "_handcardTimeoutTime",
				immediateCallback: () => decadeUI.layout.updateHand(),
				callback: () => decadeUI.layout.updateHand(),
			});
		},

		invalidateDiscard() {
			this._debounce({
				defaultDelay: ui.thrown?.length > 15 ? 80 : 40,
				maxDelay: 180,
				timeoutKey: "_discardTimeout",
				timeKey: "_discardTimeoutTime",
				immediateCallback: () => decadeUI.layout.updateDiscard(),
				callback: () => decadeUI.layout.updateDiscard(),
			});
		},

		resize() {
			if (decadeUI.isMobile()) ui.arena.classList.add("dui-mobile");
			else ui.arena.classList.remove("dui-mobile");

			decadeUI.dataset.animSizeUpdated = false;
			decadeUI.dataset.bodySize.updated = false;
			for (const key in decadeUI.boundsCaches) decadeUI.boundsCaches[key].updated = false;

			let buttonsWindow = decadeUI.sheet.getStyle("#window > .dialog.popped .buttons:not(.smallzoom)");
			if (!buttonsWindow) buttonsWindow = decadeUI.sheet.insertRule("#window > .dialog.popped .buttons:not(.smallzoom) { zoom: 1; }");

			let buttonsArena = decadeUI.sheet.getStyle("#arena:not(.choose-character) .buttons:not(.smallzoom)");
			if (!buttonsArena) buttonsArena = decadeUI.sheet.insertRule("#arena:not(.choose-character) .buttons:not(.smallzoom) { zoom: 1; }");

			decadeUI.zooms.card = decadeUI.getCardBestScale();
			if (ui.me) ui.me.style.height = Math.round(decadeUI.getHandCardSize().height * decadeUI.zooms.card + 30.4) + "px";
			if (buttonsArena) buttonsArena.zoom = decadeUI.zooms.card;
			if (buttonsWindow) buttonsWindow.zoom = decadeUI.zooms.card;
			decadeUI.layout.invalidate();
		},
	};
}

/** 创建handler模块 */
function createHandlerModule() {
	return {
		handMousewheel(e) {
			if (!ui.handcards1Container) return console.error("ui.handcards1Container");
			const hand = ui.handcards1Container;
			if (hand.scrollNum === undefined) hand.scrollNum = 0;
			if (hand.lastFrameTime === undefined) hand.lastFrameTime = performance.now();

			function handScroll() {
				const now = performance.now();
				const delta = now - hand.lastFrameTime;
				let num = Math.round((delta / 16) * 16);
				hand.lastFrameTime = now;

				if (hand.scrollNum > 0) {
					num = Math.min(hand.scrollNum, num);
					hand.scrollNum -= num;
				} else {
					num = Math.min(-hand.scrollNum, num);
					hand.scrollNum += num;
					num = -num;
				}

				if (hand.scrollNum === 0) {
					hand.frameId = undefined;
					hand.lastFrameTime = undefined;
				} else {
					hand.frameId = requestAnimationFrame(handScroll);
					ui.handcards1Container.scrollLeft += num;
				}
			}

			hand.scrollNum += e.wheelDelta > 0 ? -84 : 84;
			if (hand.frameId === undefined) hand.frameId = requestAnimationFrame(handScroll);
		},
	};
}

/** 创建decadeUI.create模块 */
function createDecadeUICreateModule() {
	return {
		skillDialog() {
			const dialog = document.createElement("div");
			dialog.className = "skill-dialog";

			const extend = {
				caption: undefined,
				tip: undefined,
				open(customParent) {
					if (!customParent) {
						const size = decadeUI.get.bodySize();
						this.style.minHeight = parseInt(size.height * 0.42) + "px";
						if (this.parentNode !== ui.arena) ui.arena.appendChild(this);
					}
					this.style.animation = "open-dialog 0.4s";
					return this;
				},
				show() {
					this.style.animation = "open-dialog 0.4s";
				},
				hide() {
					this.style.animation = "close-dialog 0.1s forwards";
				},
				close() {
					const func = function (e) {
						if (e.animationName !== "close-dialog") return;
						this.remove();
						this.removeEventListener("animationend", func);
					};
					if (this.style.animationName === "close-dialog") {
						setTimeout(d => d.remove(), 100, this);
					} else {
						this.style.animation = "close-dialog 0.1s forwards";
						this.addEventListener("animationend", func);
					}
				},
				appendControl(text, clickFunc) {
					const control = document.createElement("div");
					control.className = "control-button";
					control.textContent = text;
					if (clickFunc) control.addEventListener("click", clickFunc);
					return this.$controls.appendChild(control);
				},
				$caption: decadeUI.element.create("caption", dialog),
				$content: decadeUI.element.create("content", dialog),
				$tip: decadeUI.element.create("tip", dialog),
				$controls: decadeUI.element.create("controls", dialog),
			};

			decadeUI.get.extend(dialog, extend);
			Object.defineProperties(dialog, {
				caption: {
					configurable: true,
					get() {
						return this.$caption.innerHTML;
					},
					set(value) {
						if (this.$caption.innerHTML !== value) this.$caption.innerHTML = value;
					},
				},
				tip: {
					configurable: true,
					get() {
						return this.$tip.innerHTML;
					},
					set(value) {
						if (this.$tip.innerHTML !== value) this.$tip.innerHTML = value;
					},
				},
			});
			return dialog;
		},

		compareDialog(player, target) {
			const dialog = decadeUI.create.skillDialog();
			dialog.classList.add("compare");
			dialog.$content.classList.add("buttons");

			const extend = {
				player: undefined,
				target: undefined,
				playerCard: undefined,
				targetCard: undefined,
				$player: decadeUI.element.create("player-character player1", dialog.$content),
				$target: decadeUI.element.create("player-character player2", dialog.$content),
				$playerCard: decadeUI.element.create("player-card", dialog.$content),
				$targetCard: decadeUI.element.create("target-card", dialog.$content),
				$vs: decadeUI.element.create("vs", dialog.$content),
			};

			decadeUI.get.extend(dialog, extend);
			decadeUI.element.create("image", dialog.$player);
			decadeUI.element.create("image", dialog.$target);

			Object.defineProperties(dialog, {
				player: {
					configurable: true,
					get() {
						return this._player;
					},
					set(value) {
						if (this._player === value) return;
						this._player = value;
						this.$player.firstChild.style.backgroundImage = !value || value.isUnseen() ? "" : (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
						if (value) this.$playerCard.dataset.text = get.translation(value) + "发起";
					},
				},
				target: {
					configurable: true,
					get() {
						return this._target;
					},
					set(value) {
						if (this._target === value) return;
						this._target = value;
						this.$target.firstChild.style.backgroundImage = !value || value.isUnseen() ? "" : (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
						if (value) this.$targetCard.dataset.text = get.translation(value);
					},
				},
				playerCard: {
					configurable: true,
					get() {
						return this._playerCard;
					},
					set(value) {
						if (this._playerCard === value) return;
						if (this._playerCard) this._playerCard.remove();
						this._playerCard = value;
						if (value) this.$playerCard.appendChild(value);
					},
				},
				targetCard: {
					configurable: true,
					get() {
						return this._targetCard;
					},
					set(value) {
						if (this._targetCard === value) return;
						if (this._targetCard) this._targetCard.remove();
						this._targetCard = value;
						if (value) this.$targetCard.appendChild(value);
					},
				},
			});

			if (player) dialog.player = player;
			if (target) dialog.target = target;
			return dialog;
		},
	};
}

/** 创建decadeUI.get模块 */
function createDecadeUIGetModule() {
	return {
		judgeEffect(name, value) {
			const negativeGood = new Set(["caomu", "草木皆兵", "fulei", "浮雷", "shandian", "闪电", "bingliang", "兵粮寸断", "lebu", "乐不思蜀"]);
			return negativeGood.has(name) ? value < 0 : value;
		},
		isWebKit() {
			return document.body.style.WebkitBoxShadow !== undefined;
		},
		lerp(min, max, fraction) {
			return (max - min) * fraction + min;
		},
		ease(fraction) {
			if (!decadeUI.get._bezier3) decadeUI.get._bezier3 = new CubicBezierEase(0.25, 0.1, 0.25, 1);
			return decadeUI.get._bezier3.ease(fraction);
		},
		extend(target, source) {
			if (source === null || typeof source !== "object") return target;
			const keys = Object.keys(source);
			let i = keys.length;
			while (i--) target[keys[i]] = source[keys[i]];
			return target;
		},
		bodySize() {
			const size = decadeUI.dataset.bodySize;
			if (!size.updated) {
				size.updated = true;
				size.height = document.body.clientHeight;
				size.width = document.body.clientWidth;
			}
			return size;
		},
		bestValueCards(cards, player) {
			if (!player) player = _status.event.player;
			const matchs = [],
				basics = [],
				equips = [];
			const hasEquipSkill = player.hasSkill("xiaoji");

			cards.sort((a, b) => get.value(b, player) - get.value(a, player));

			for (let i = 0; i < cards.length; i++) {
				let limited = false;
				const type = get.type(cards[i]);
				if (type === "basic") {
					for (const b of basics) {
						if (!cards[i].toself && b.name === cards[i].name) {
							limited = true;
							break;
						}
					}
					if (!limited) basics.push(cards[i]);
				} else if (type === "equip" && !hasEquipSkill) {
					for (const e of equips) {
						if (get.subtype(e) === get.subtype(cards[i])) {
							limited = true;
							break;
						}
					}
					if (!limited) equips.push(cards[i]);
				}
				if (!limited) {
					matchs.push(cards[i]);
					cards.splice(i--, 1);
				}
			}

			cards.sort((a, b) => get.value(b, player) - get.value(a, player));
			return matchs.concat(cards);
		},
		cheatJudgeCards(cards, judges, friendly) {
			if (!cards || !judges) throw arguments;
			const cheats = [];
			for (const j of judges) {
				const judge = get.judge(j);
				cards.sort((a, b) => (friendly ? judge(b) - judge(a) : judge(a) - judge(b)));
				const cost = judge(cards[0]);
				if ((friendly && cost >= 0) || (!friendly && cost < 0)) cheats.push(cards.shift());
				else break;
			}
			return cheats;
		},
		elementLeftFromWindow(element) {
			let left = element.offsetLeft,
				current = element.offsetParent;
			while (current) {
				left += current.offsetLeft;
				current = current.offsetParent;
			}
			return left;
		},
		elementTopFromWindow(element) {
			let top = element.offsetTop,
				current = element.offsetParent;
			while (current) {
				top += current.offsetTop;
				current = current.offsetParent;
			}
			return top;
		},
		handcardInitPos() {
			const hand = dui.boundsCaches.hand;
			if (!hand.updated) hand.update();
			const cardW = hand.cardWidth,
				cardH = hand.cardHeight,
				scale = hand.cardScale;
			return { x: -Math.round((cardW - cardW * scale) / 2), y: (cardH * scale - cardH) / 2, scale };
		},
	};
}

/** 创建decadeUI.set模块 */
function createDecadeUISetModule() {
	return {
		activeElement(element) {
			const deactive = dui.$activeElement;
			dui.$activeElement = element;
			if (deactive && deactive !== element && typeof deactive.ondeactive === "function") deactive.ondeactive();
			if (element && element !== deactive && typeof element.onactive === "function") element.onactive();
		},
	};
}

/** 创建statics模块 */
function createStaticsModule() {
	const cards = {};
	const ensureSkinCache = skinKey => {
		if (!cards[skinKey]) cards[skinKey] = {};
		return cards[skinKey];
	};

	cards.READ_OK = {};

	const readFiles = (files, skinKey, folder, extension, entry) => {
		if (!folder) return;
		const skinCache = ensureSkinCache(skinKey);
		const prefix = decadeUIPath + "image/card/" + folder + "/";
		const ext = extension ? "." + extension.toLowerCase() : null;
		cards.READ_OK[skinKey] = true;

		for (const current of files) {
			let filename = entry ? current.name : current;
			if (!filename || (entry && current.isDirectory)) continue;
			const lower = filename.toLowerCase();
			let cardname = filename;
			if (ext) {
				if (!lower.endsWith(ext)) continue;
				cardname = filename.substring(0, filename.length - ext.length);
			} else {
				const dotIndex = filename.lastIndexOf(".");
				if (dotIndex === -1) continue;
				cardname = filename.substring(0, dotIndex);
			}
			skinCache[cardname] = { url: prefix + filename, name: cardname, loaded: true };
		}
	};

	if (window.fs) {
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			fs.readdir(__dirname + "/" + decadeUIPath + "image/card/" + folder + "/", (err, files) => {
				if (!err) readFiles(files, skin.key, folder, skin.extension);
			});
		});
	} else if (window.resolveLocalFileSystemURL) {
		cardSkinPresets.forEach(skin => {
			const folder = skin.dir || skin.key;
			resolveLocalFileSystemURL(decadeUIResolvePath + "image/card/" + folder + "/", entry => {
				entry.createReader().readEntries(entries => readFiles(entries, skin.key, folder, skin.extension, true));
			});
		});
	}

	return { cards, handTips: [] };
}

export { createDecadeUIObject };

// ==================== 扩展主入口 ====================

/**
 * 扩展content函数 - 无名杀扩展主入口
 */
export function content(config, pack) {
	if (!bootstrapExtension()) return;

	// 创建全局配置对象
	window.duicfg = {
		dynamicSkin: lib.config.extension_十周年UI_dynamicSkin,
		newDecadeStyle: lib.config.extension_十周年UI_newDecadeStyle,
	};

	// 创建decadeUI核心对象
	const decadeUI = createDecadeUIObject();
	window.decadeUI = decadeUI;
	window.dui = decadeUI;

	// 增强运行时功能
	enhanceDecadeUIRuntime(decadeUI);

	// 完成初始化
	finalizeDecadeUICore(decadeUI, config);

	// 注册进度条等遗留模块
	registerLegacyModules(config);
}
