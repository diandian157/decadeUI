import { AnimationPlayer } from "./AnimationPlayer.js";
import { AnimationPlayerPool } from "./AnimationPlayerPool.js";
import { SharedAnimationPlayer } from "./SharedAnimationPlayer.js";
import { assetList } from "./configs/assetList.js";
import { initSkillAnimations } from "./initAnimations.js";
import { APNode } from "./APNode.js";
import { TimeStep } from "./TimeStep.js";
import { CubicBezierEase } from "./easing.js";
import { lerp, observeSize, throttle } from "./utils.js";
import { BUILT_ID, DynamicPlayer, DynamicWorkers } from "./DynamicPlayer.js";
import { applyDynamicBackgroundConfig, createDynamicBackgroundController } from "./backgroundAnimation.js";

const LOAD_NOW = 0;
const LOAD_ARENA_READY = 1;
const LOAD_IDLE = 2;
const LOAD_IDLE_WITH_CAP = 3;

const assetLoadStage = {
	effect_youxikaishi: LOAD_NOW,
	effect_youxikaishi_shousha: LOAD_NOW,
	effect_loseHp: LOAD_NOW,
	aar_chupaizhishiX: LOAD_ARENA_READY,
	aar_chupaizhishi: LOAD_ARENA_READY,
	SF_xuanzhong_eff_jiangjun: LOAD_ARENA_READY,
	SF_xuanzhong_eff_weijiangjun: LOAD_ARENA_READY,
	SF_xuanzhong_eff_cheqijiangjun: LOAD_ARENA_READY,
	SF_xuanzhong_eff_biaoqijiangjun: LOAD_ARENA_READY,
	SF_xuanzhong_eff_dajiangjun: LOAD_ARENA_READY,
	SF_xuanzhong_eff_dasima: LOAD_ARENA_READY,
	"globaltexiao/huifushuzi/shuzi2": LOAD_ARENA_READY,
	"globaltexiao/shanghaishuzi/shuzi": LOAD_ARENA_READY,
	"globaltexiao/shanghaishuzi/SZN_shuzi": LOAD_ARENA_READY,
};

const loadingState = new Map();

function isAnimationDebugEnabled(...keys) {
	const flag = globalThis.window?.decadeUIAnimationDebug ?? globalThis.window?.dcdAnimDebug;
	if (flag === true) return true;
	const list = Array.isArray(flag) ? flag : [flag];
	return keys.flat().some(key => key && list.includes(key));
}

function getDebugZoomSnapshot() {
	const bodyZoom = typeof window != "undefined" ? parseFloat(window.getComputedStyle(document.body).zoom) : NaN;
	return {
		gameZoom: globalThis.game?.documentZoom,
		windowZoom: globalThis.window?.documentZoom,
		bodyZoom: Number.isFinite(bodyZoom) && bodyZoom > 0 ? bodyZoom : 1,
		devicePixelRatio: globalThis.window?.devicePixelRatio,
	};
}

function safeDebugString(payload) {
	try {
		return JSON.stringify(payload);
	} catch (error) {
		return String(error?.message || error);
	}
}

function pushAnimationDebug(type, payload) {
	const history = (globalThis.window.dcdAnimDebugHistory ||= []);
	history.push({ type, time: Date.now(), payload });
	if (history.length > 80) history.splice(0, history.length - 80);
}

function exposeNewDuilibCompat() {
	if (typeof globalThis == "undefined") return;
	const compat = globalThis.newDuilib || {};
	Object.assign(compat, {
		throttle,
		observeSize,
		lerp,
		CubicBezierEase,
		TimeStep,
		APNode,
		AnimationPlayer,
		AnimationPlayerPool,
		DynamicPlayer,
		DynamicWorkers,
	});
	if (!Number.isFinite(compat.BUILT_ID)) compat.BUILT_ID = BUILT_ID;
	globalThis.newDuilib = compat;
	if (!globalThis.duilib) globalThis.duilib = compat;
}

function setupGameAnimation(lib, game, ui, get, ai, _status) {
	exposeNewDuilibCompat();
	decadeUI.animation = (() => {
		const animation = new SharedAnimationPlayer(decadeUIPath + "assets/animation/");
		decadeUI.bodySensor.addListener(() => animation.renderer.resized = false, true);
		if (!animation.gl) {
			initSkillAnimations(animation);
			return animation;
		}

		const basePlaySpine = animation.playSpine;
		const baseCapPlaySpineTo = animation.cap.playSpineTo;
		const getFileType = name => assetList.find(asset => asset.name === name)?.fileType || "skel";
		const capHasSpine = name => animation.cap.animations?.[0]?.hasSpine?.(name);
		const ensureLoaded = (name, player, useCap, callback) => {
			if (useCap ? capHasSpine(name) : player?.hasSpine?.(name)) {
				callback();
				return;
			}
			const key = (useCap ? "cap:" : "") + name;
			if (loadingState.get(key) === "loading") {
				const callbackKey = key + "_cb";
				loadingState.set(callbackKey, [...loadingState.get(callbackKey) || [], callback]);
				return;
			}
			loadingState.set(key, "loading");
			const done = () => {
				loadingState.set(key, "loaded");
				callback();
				const callbackKey = key + "_cb";
				(loadingState.get(callbackKey) || []).forEach(fn => fn());
				loadingState.delete(callbackKey);
			};
			const fail = () => loadingState.set(key, "error");
			if (useCap) {
				animation.cap.loadSpine(name, getFileType(name), done, fail);
			} else {
				player.loadSpine(name, getFileType(name), () => {
					player.prepSpine(name);
					done();
				}, fail);
			}
		};

		animation.playSpine = function (sprite, position) {
			if (!sprite) return;
			const name = typeof sprite == "string" ? sprite : sprite.name;
			if (!name) return basePlaySpine.call(this, sprite, position);
			if (isAnimationDebugEnabled("play", name)) {
				const payload = {
					stage: "gameIntegration.playSpine",
					name,
					spriteScale: typeof sprite == "string" ? undefined : sprite.scale,
					positionScale: position?.scale,
					hasSpine: this.hasSpine(name),
					canvas: this.canvas
						? {
								width: this.canvas.width,
								height: this.canvas.height,
								clientWidth: this.canvas.clientWidth,
								clientHeight: this.canvas.clientHeight,
								rect: this.canvas.getBoundingClientRect
									? {
											width: this.canvas.getBoundingClientRect().width,
											height: this.canvas.getBoundingClientRect().height,
									  }
									: null,
						  }
						: null,
					zoom: getDebugZoomSnapshot(),
				};
				pushAnimationDebug("play-entry", payload);
				console.warn("[DCD-ANIM play-entry]", safeDebugString(payload));
			}
			if (this.hasSpine(name)) return basePlaySpine.call(this, sprite, position);
			ensureLoaded(name, this, false, () => basePlaySpine.call(this, sprite, position));
		};
		animation.loopSpine = function (sprite, position) {
			if (typeof sprite == "string") sprite = { name: sprite, loop: true };
			else if (sprite) sprite.loop = true;
			return this.playSpine(sprite, position);
		};
		animation.cap.playSpineTo = function (node, sprite, position) {
			if (!sprite) return;
			const name = typeof sprite == "string" ? sprite : sprite.name;
			if (!name) return baseCapPlaySpineTo.call(this, node, sprite, position);
			if (isAnimationDebugEnabled("play", name, "cap")) {
				const payload = {
					stage: "gameIntegration.cap.playSpineTo",
					name,
					spriteScale: typeof sprite == "string" ? undefined : sprite.scale,
					positionScale: position?.scale,
					hasSpine: capHasSpine(name),
					targetClass: String(node?.className || ""),
					zoom: getDebugZoomSnapshot(),
				};
				pushAnimationDebug("cap-play-entry", payload);
				console.warn("[DCD-ANIM cap-play-entry]", safeDebugString(payload));
			}
			if (capHasSpine(name)) return baseCapPlaySpineTo.call(this, node, sprite, position);
			ensureLoaded(name, null, true, () => baseCapPlaySpineTo.call(this, node, sprite, position));
		};

		const groupedAssets = [[], [], [], []];
		assetList.forEach(asset => groupedAssets[assetLoadStage[asset.name] ?? LOAD_IDLE].push(asset));
		const preload = (assets, limit, callback) => {
			if (!assets.length) return callback?.();
			const queue = [...assets];
			let running = 0;
			let doneCount = 0;
			const next = () => {
				while (running < limit && queue.length) {
					const asset = queue.shift();
					const useCap = asset.follow;
					if (useCap ? capHasSpine(asset.name) : animation.hasSpine(asset.name)) {
						doneCount++;
						continue;
					}
					running++;
					ensureLoaded(asset.name, animation, useCap, () => {
						running--;
						if (++doneCount === assets.length) callback?.();
						else next();
					});
				}
			};
			next();
		};

		preload(groupedAssets[LOAD_NOW], 2);
		lib.arenaReady.push(() => {
			setTimeout(() => preload(groupedAssets[LOAD_ARENA_READY], 2), 500);
			const loadIdle = () => preload([...groupedAssets[LOAD_IDLE], ...groupedAssets[LOAD_IDLE_WITH_CAP]], 2);
			window.requestIdleCallback ? requestIdleCallback(loadIdle, { timeout: 8000 }) : setTimeout(loadIdle, 3000);
		});
		initSkillAnimations(animation);
		return animation;
	})();
	// 对外统一播放入口：普通 Spine 始终进入全屏特效层 decadeUI-canvas；
	// 动态皮肤则由 decadeUI.playDynamic/player.playDynamic 进入独立动皮层。
	decadeUI.playSpine = (sprite, position) => decadeUI.animation.playSpine(sprite, position);
	decadeUI.loopSpine = (sprite, position) => decadeUI.animation.loopSpine(sprite, position);
	decadeUI.stopSpine = handle => decadeUI.animation.stopSpine(handle);
	decadeUI.stopSpineAll = () => decadeUI.animation.stopSpineAll();
	decadeUI.backgroundAnimation = createDynamicBackgroundController();
	applyDynamicBackgroundConfig(lib.config.extension_十周年UI_dynamicBackground);
	exposeNewDuilibCompat();
	window.dcdAnim = decadeUI.animation;
	window.dcdBackAnim = decadeUI.backgroundAnimation;
	window.game = game;
	window.get = get;
	window.ui = ui;
	window._status = _status;
}

if (typeof window != "undefined" && window.decadeModule) {
	window.decadeModule.import((lib, game, ui, get, ai, _status) => {
		setupGameAnimation(lib, game, ui, get, 0, _status);
	});
}

export { setupGameAnimation };
