/**
 * @fileoverview decadeUI核心对象模块，整合所有子模块并提供统一的API接口
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { initializeDecadeUIEnvironment } from "./environment.js";
import { createDecadeUIDialogModule } from "./dialog.js";
import { createDecadeUIAnimateModule } from "./animate.js";
import { createResizeSensorClass } from "./resize-sensor.js";
import { createLayoutModule } from "./layout.js";
import { createSheetModule } from "./sheet.js";
import { createDecadeUIGetModule } from "./getters.js";
import { createDecadeUISetModule } from "./setters.js";
import { createDecadeUICreateModule } from "./create.js";
import { createStaticsModule } from "./statics.js";
import { createHandlerModule } from "./handler.js";
import { initHooks } from "./hooks.js";
import {
	CubicBezierEase,
	throttle,
	observeSize,
	lerp,
	TimeStep,
	APNode,
	AnimationPlayer,
	AnimationPlayerPool,
	DynamicPlayer,
	BUILT_ID,
	DynamicWorkers,
} from "../animation/index.js";
import { createPlayerElement } from "../ui/player-element.js";
import { createCardElement, createCardsWrapper } from "../ui/card-element.js";
import { createCharacterButtonPreset } from "../ui/character-button.js";
import { createPlayerInit } from "../ui/player-init.js";
import { definePlayerGroupProperty } from "../ui/player-group.js";
import { createLayoutInit } from "../ui/layout-init.js";
import { uiClickIdentity, uiClickVolumn, uiClear, uiCreateMe } from "../overrides/ui.js";

import {
	setBaseCardMethods,
	setBaseContentMethods,
	setBasePlayerMethods,
	setBasePlayerDraw,
	setBaseGameMethods,
	setBaseGetMethods,
	setBaseUiMethods,
	setBaseUiCreateMethods,
	setBaseDialogMethods,
	setBaseLibMethods,
} from "../overrides/index.js";

import { controlAdd, controlOpen, controlClose, controlReplace, controlUpdateLayout } from "../overrides/control.js";
import { dialogOpen, dialogClose } from "../overrides/dialog.js";
import { eventAddMessageHook, eventTriggerMessage } from "../overrides/event.js";
import { cardCopy, cardInit, cardUpdateTransform, cardMoveTo, cardMoveDelete } from "../overrides/card.js";
import { createContentGain, contentJudge, createContentLose } from "../overrides/content.js";
import { libInitCssstyles } from "../overrides/lib.js";
import { getSkillState, getObjtype } from "../overrides/get.js";
import { gameSwapSeat, gameSwapPlayer, gameSwapControl, gameAddGlobalSkill, gameRemoveGlobalSkill, gameLogv } from "../overrides/game.js";

import {
	registerDecadeUIHooks,
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
	playerRespond,
	playerLose,
	playerUseCardAnimateBefore,
	playerRespondAnimateBefore,
	playerChangeZhuanhuanji,
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
	playerSetSkillYinYang,
	player$SetSkillYinYang,
	playerSetSkillState,
	player$SetSkillState,
	playerDamagepop,
	playerCompare,
	playerCompareMultiple,
	playerCheckAndAddExperienceSuffix,
	playerQueueCssAnimation,
	playerDamage,
	playerUpdateShowCards,
	playerCheckBoundsCache,
	playerLine,
	playerPhaseJudge,
	playerGain2,
	playerDraw,
	playerGive,
	playerThrow,
	playerThrowordered2,
	playerAddVirtualJudge,
} from "../overrides/player.js";

import {
	uiUpdatec,
	uiUpdatehl,
	uiUpdatej,
	uiUpdatem,
	uiUpdatez,
	uiUpdate,
	uiUpdatejm,
	uiUpdatexr,
	uiCreatePrebutton,
	uiCreateRarity,
	uiCreateButton,
	uiCreateControl,
	uiCreateDialog,
	uiCreateSelectlist,
	uiCreateIdentityCard,
	uiCreateSpinningIdentityCard,
	uiCreateArena,
	uiCreatePause,
	uiCreateCharacterDialog,
	uiClickCard,
	uiClickIntro,
} from "../overrides/ui.js";

/**
 * 创建decadeUI核心对象
 * @returns {Object} decadeUI对象
 */
export const createDecadeUIObject = () => ({
	/**
	 * 初始化decadeUI
	 * @returns {Object} this
	 */
	init() {
		this.extensionName = decadeUIName;
		this.bodySensor = initializeDecadeUIEnvironment(this);
		this.initOverride();
		return this;
	},

	/**
	 * 初始化方法覆写
	 */
	initOverride() {
		/**
		 * 递归覆写对象属性
		 * @param {Object} dest - 目标对象
		 * @param {Object} src - 源对象
		 * @returns {boolean} 是否完全覆写
		 */
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
						respond: lib.element.player.respond,
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
						respond: playerRespond,
						lose: playerLose,
						useCardAnimateBefore: playerUseCardAnimateBefore,
						respondAnimateBefore: playerRespondAnimateBefore,
						$changeZhuanhuanji: playerChangeZhuanhuanji,
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
						$init: createPlayerInit(base),
						checkAndAddExperienceSuffix: playerCheckAndAddExperienceSuffix,
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
						setSkillYinYang: playerSetSkillYinYang,
						$setSkillYinYang: player$SetSkillYinYang,
						setSkillState: playerSetSkillState,
						$setSkillState: player$SetSkillState,
						$damagepop: playerDamagepop,
						$compare: playerCompare,
						$compareMultiple: playerCompareMultiple,
					},
					content: {
						gain: createContentGain(base.lib.element.content.gain),
						judge: contentJudge,
						lose: createContentLose(base.lib.element.content.lose),
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

		// 注册hooks
		registerDecadeUIHooks();

		// 应用覆写
		override(lib, ride.lib);
		override(ui, ride.ui);
		override(game, ride.game);
		override(get, ride.get);

		// 挂载动画模块
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

		// 窗口大小变化时更新布局
		window.addEventListener("resize", () => {
			ui.updatexr?.();
			decadeUI.layout?.resize();
		});

		initHooks();
		this.initUIExtensions();

		// 卡牌皮肤注册API到顶层
		this.registerCardSkin = this.statics.registerCardSkin;
	},

	/**
	 * 初始化UI扩展
	 */
	initUIExtensions() {
		ui.click.identity = uiClickIdentity;
		ui.click.volumn = uiClickVolumn;
		ui.clear = uiClear;
		ui.create.me = uiCreateMe;
		ui.create.player = createPlayerElement;
		ui.create.card = createCardElement;
		ui.create.cards = createCardsWrapper(ui.create.cards);
		lib.init.layout = createLayoutInit();
		definePlayerGroupProperty();
	},

	/** @type {Object} 对话框模块 */
	dialog: createDecadeUIDialogModule(),
	/** @type {Object} 动画模块 */
	animate: createDecadeUIAnimateModule(),
	/** @type {Function} 尺寸监听器类 */
	ResizeSensor: createResizeSensorClass(),
	/** @type {Object} 样式表模块 */
	sheet: createSheetModule(),
	/** @type {Object} 布局模块 */
	layout: createLayoutModule(),
	/** @type {Object} 事件处理模块 */
	handler: createHandlerModule(),
	/** @type {Object} 缩放配置 */
	zooms: { body: 1, card: 1 },
	/** @type {Object} 创建模块 */
	create: createDecadeUICreateModule(),
	/** @type {Object} 获取器模块 */
	get: createDecadeUIGetModule(),
	/** @type {Object} 设置器模块 */
	set: createDecadeUISetModule(),
	/** @type {Object} 静态资源模块 */
	statics: createStaticsModule(),
	/** @type {Object} 数据集 */
	dataset: { animSizeUpdated: false, bodySizeUpdated: false, bodySize: { height: 1, width: 1, updated: false } },
});
