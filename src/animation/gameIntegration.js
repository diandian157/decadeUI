"use strict";

/**
 * 动画系统集成 - 懒加载
 */

import { AnimationPlayer } from "./AnimationPlayer.js";
import { AnimationPlayerPool } from "./AnimationPlayerPool.js";
import { assetList } from "./configs/assetList.js";
import { initSkillAnimations } from "./initAnimations.js";

const Priority = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

const priorityMap = {
	effect_youxikaishi: Priority.CRITICAL,
	effect_youxikaishi_shousha: Priority.CRITICAL,
	effect_loseHp: Priority.CRITICAL,
	aar_chupaizhishiX: Priority.HIGH,
	aar_chupaizhishi: Priority.HIGH,
	SF_xuanzhong_eff_jiangjun: Priority.HIGH,
	SF_xuanzhong_eff_weijiangjun: Priority.HIGH,
	SF_xuanzhong_eff_cheqijiangjun: Priority.HIGH,
	SF_xuanzhong_eff_biaoqijiangjun: Priority.HIGH,
	SF_xuanzhong_eff_dajiangjun: Priority.HIGH,
	SF_xuanzhong_eff_dasima: Priority.HIGH,
	"globaltexiao/huifushuzi/shuzi2": Priority.HIGH,
	"globaltexiao/shanghaishuzi/shuzi": Priority.HIGH,
	"globaltexiao/shanghaishuzi/SZN_shuzi": Priority.HIGH,
};

const loadingState = new Map();

export function setupGameAnimation(lib, game, ui, get, ai, _status) {
	decadeUI.animation = (() => {
		const animation = new AnimationPlayer(decadeUIPath + "assets/animation/", document.body, "decadeUI-canvas");
		decadeUI.bodySensor.addListener(() => (animation.resized = false), true);
		animation.cap = new AnimationPlayerPool(4, decadeUIPath + "assets/animation/", "decadeUI.animation");

		// WebGL不可用时跳过懒加载包装
		if (!animation.gl) {
			initSkillAnimations(animation);
			return animation;
		}

		const originalPlaySpine = animation.playSpine;
		const originalCapPlaySpineTo = animation.cap.playSpineTo;

		const getFileType = name => assetList.find(a => a.name === name)?.fileType || "skel";
		const capHasSpine = name => animation.cap.animations?.[0]?.hasSpine?.(name);

		// 确保资源已加载
		const ensureLoaded = (name, player, isCap, callback) => {
			const hasIt = isCap ? capHasSpine(name) : player?.hasSpine?.(name);
			if (hasIt) {
				callback();
				return;
			}

			const key = (isCap ? "cap:" : "") + name;
			if (loadingState.get(key) === "loading") {
				const cbKey = key + "_cb";
				loadingState.set(cbKey, [...(loadingState.get(cbKey) || []), callback]);
				return;
			}

			loadingState.set(key, "loading");
			const onLoad = () => {
				loadingState.set(key, "loaded");
				callback();
				const cbKey = key + "_cb";
				(loadingState.get(cbKey) || []).forEach(cb => cb());
				loadingState.delete(cbKey);
			};
			const onError = () => loadingState.set(key, "error");

			if (isCap) {
				animation.cap.loadSpine(name, getFileType(name), onLoad, onError);
			} else {
				player.loadSpine(
					name,
					getFileType(name),
					() => {
						player.prepSpine(name);
						onLoad();
					},
					onError
				);
			}
		};

		// 包装播放方法
		animation.playSpine = function (sprite, position) {
			if (!sprite) return;
			const name = typeof sprite === "string" ? sprite : sprite.name;
			if (!name) return originalPlaySpine.call(this, sprite, position);
			if (this.hasSpine(name)) return originalPlaySpine.call(this, sprite, position);
			ensureLoaded(name, this, false, () => originalPlaySpine.call(this, sprite, position));
		};

		animation.loopSpine = function (sprite, position) {
			if (typeof sprite === "string") sprite = { name: sprite, loop: true };
			else if (sprite) sprite.loop = true;
			return this.playSpine(sprite, position);
		};

		animation.cap.playSpineTo = function (element, anim, position) {
			if (!anim) return;
			const name = typeof anim === "string" ? anim : anim.name;
			if (!name) return originalCapPlaySpineTo.call(this, element, anim, position);
			if (capHasSpine(name)) return originalCapPlaySpineTo.call(this, element, anim, position);
			ensureLoaded(name, null, true, () => originalCapPlaySpineTo.call(this, element, anim, position));
		};

		// 按优先级分组预加载
		const groups = [[], [], [], []];
		assetList.forEach(f => groups[priorityMap[f.name] ?? Priority.NORMAL].push(f));

		const preload = (files, concurrency, onDone) => {
			if (!files.length) return onDone?.();
			const queue = [...files];
			let active = 0,
				done = 0;
			const next = () => {
				while (active < concurrency && queue.length) {
					const f = queue.shift();
					const isCap = f.follow;
					if (isCap ? capHasSpine(f.name) : animation.hasSpine(f.name)) {
						if (++done === files.length) onDone?.();
						continue;
					}
					active++;
					ensureLoaded(f.name, animation, isCap, () => {
						active--;
						if (++done === files.length) onDone?.();
						else next();
					});
				}
			};
			next();
		};

		// 关键资源立即加载
		preload(groups[Priority.CRITICAL], 2);

		// 高优先级延迟加载，其余空闲加载
		lib.arenaReady.push(() => {
			setTimeout(() => preload(groups[Priority.HIGH], 2), 500);
			const loadRest = () => preload([...groups[Priority.NORMAL], ...groups[Priority.LOW]], 2);
			window.requestIdleCallback ? requestIdleCallback(loadRest, { timeout: 8000 }) : setTimeout(loadRest, 3000);
		});

		initSkillAnimations(animation);
		return animation;
	})();

	window.dcdAnim = decadeUI.animation;
	window.dcdBackAnim = decadeUI.backgroundAnimation;
	window.game = game;
	window.get = get;
	window.ui = ui;
	window._status = _status;
}

if (typeof window !== "undefined" && window.decadeModule) {
	window.decadeModule.import((lib, game, ui, get, ai, _status) => {
		setupGameAnimation(lib, game, ui, get, ai, _status);
	});
}
