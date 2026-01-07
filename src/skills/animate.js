/**
 * @fileoverview 动画技能模块
 * @description 包含游戏开始动画、边框等级、击杀特效等动画相关技能
 * @module skills/animate
 */

import { lib, game, ui } from "noname";

/**
 * @type {Object.<string, Object>}
 * @description 动画技能集合
 */
export const animateSkill = {
	/**
	 * 游戏开始动画
	 * @description 在游戏开始时播放开场动画和音效
	 */
	mx_start: {
		trigger: { global: "gameDrawAfter" },
		direct: true,
		priority: Infinity + 114514 + 1919810,
		firstDo: true,
		async content(event, trigger, player) {
			game.removeGlobalSkill("mx_start");

			const style = lib.config.extension_十周年UI_newDecadeStyle;
			const isShousha = style === "off";
			const effectName = isShousha ? "effect_youxikaishi_shousha" : "effect_youxikaishi";
			const audio = isShousha ? "audio/game_start_shousha.mp3" : "audio/game_start.mp3";
			const scaleFactor = isShousha ? 1.5 : 0.76;

			game.playAudio("../extension", decadeUI.extensionName, audio);

			const animation = decadeUI.animation;
			const bounds = animation.getSpineBounds(effectName);
			if (!bounds) return;

			const { size } = bounds;
			const scale = Math.min(animation.canvas.width / size.x, animation.canvas.height / size.y) * scaleFactor;
			animation.playSpine({ name: effectName, scale });
		},
	},

	/**
	 * 边框等级随机化
	 * @description 在手杀风格下随机分配玩家边框等级
	 */
	mx_borderLevel: {
		trigger: { global: "gameStart" },
		silent: true,
		forced: true,
		filter(event, player) {
			return lib.config.extension_十周年UI_newDecadeStyle === "off" && lib.config.extension_十周年UI_borderLevel === "random";
		},
		async content(event, trigger, player) {
			game.removeGlobalSkill("mx_borderLevel");
			const levels = ["two", "three", "four", "five"];
			game.players.forEach(p => {
				// 主玩家永远five，其他玩家随机
				p.dataset.longLevel = p === game.me ? "five" : levels[Math.floor(Math.random() * levels.length)];
			});
		},
	},

	/**
	 * 用牌开始时设置延迟标记
	 * @description 防止用牌动画被过早清理
	 */
	decadeUI_usecardBegin: {
		trigger: { global: "useCardBegin" },
		forced: true,
		popup: false,
		priority: -100,
		silent: true,
		filter(event) {
			return !ui.clear.delay && event.card.name !== "wuxie";
		},
		async content() {
			ui.clear.delay = "usecard";
		},
	},

	/**
	 * 击杀特效
	 * @description 在击杀时播放特效动画
	 */
	decadeUI_dieKillEffect: {
		trigger: { source: ["dieBegin"] },
		forced: true,
		popup: false,
		priority: -100,
		lastDo: true,
		silent: true,
		filter() {
			return lib.config.extension_十周年UI_killEffect;
		},
		async content(event, trigger) {
			if (!trigger.source || !trigger.player) return;
			game.broadcastAll(
				(source, player) => {
					if (window.decadeUI) decadeUI.effect.kill(source, player);
				},
				trigger.source,
				trigger.player
			);
		},
	},
};
