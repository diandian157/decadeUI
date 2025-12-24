"use strict";

/**
 * 游戏模块集成
 * 将动画系统与游戏核心模块对接
 */

import { AnimationPlayer } from "./AnimationPlayer.js";
import { AnimationPlayerPool } from "./AnimationPlayerPool.js";
import { assetList } from "./configs/assetList.js";
import { initSkillAnimations } from "./initAnimations.js";

/**
 * 初始化动画系统并集成到游戏
 */
export function setupGameAnimation(lib, game, ui, get, ai, _status) {
	decadeUI.animation = (() => {
		const animation = new AnimationPlayer(decadeUIPath + "assets/animation/", document.body, "decadeUI-canvas");

		decadeUI.bodySensor.addListener(() => {
			animation.resized = false;
		}, true);

		animation.cap = new AnimationPlayerPool(4, decadeUIPath + "assets/animation/", "decadeUI.animation");

		// 并行加载资源
		const loadQueue = [...assetList];
		const loadNext = () => {
			if (!loadQueue.length) return;
			const file = loadQueue.shift();
			if (file.follow) {
				animation.cap.loadSpine(file.name, file.fileType, loadNext);
			} else {
				animation.loadSpine(file.name, file.fileType, () => {
					loadNext();
					animation.prepSpine(file.name);
				});
			}
		};
		// 启动两个并行加载
		loadNext();
		loadNext();

		// 初始化技能动画系统
		initSkillAnimations(animation);

		return animation;
	})();

	// 暴露全局变量（调试用）
	window.dcdAnim = decadeUI.animation;
	window.dcdBackAnim = decadeUI.backgroundAnimation;
	window.game = game;
	window.get = get;
	window.ui = ui;
	window._status = _status;
}

// 自动注册到 decadeModule（如果存在）
if (typeof window !== "undefined" && window.decadeModule) {
	window.decadeModule.import((lib, game, ui, get, ai, _status) => {
		setupGameAnimation(lib, game, ui, get, ai, _status);
	});
}
