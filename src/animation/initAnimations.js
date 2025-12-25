"use strict";

/**
 * 动画系统初始化模块
 */

import { lib } from "noname";
import { skillDefines, cardDefines, chupaiAnimations } from "./configs/skillAnimations.js";
import { cardTriggers } from "./configs/cardTriggers.js";

/**
 * 初始化技能动画定义和绑定
 */
export function initSkillAnimations(animation) {
	// 数字特效播放函数
	animation.playLoseHp = player => {
		if (!player) return;
		animation.playSpine("effect_loseHp", { scale: 0.6, speed: 0.8, parent: player });
	};

	animation.playRecoverNumber = (player, num) => {
		if (!player || !num || num < 1 || num > 9 || lib.config.extension_十周年UI_newDecadeStyle === "off") return;
		animation.playSpine({ name: "globaltexiao/huifushuzi/shuzi2", action: String(num) }, { speed: 0.6, scale: 0.5, parent: player, y: 20 });
	};

	animation.playVirtualDamageNumber = (player, num) => {
		if (!player || num < 0 || num > 9) return;
		animation.playSpine({ name: "globaltexiao/xunishuzi/SS_PaiJu_xunishanghai", action: "play" + num }, { speed: 0.6, scale: 0.5, parent: player, y: 20 });
	};

	animation.playDamageNumber = (player, num) => {
		if (!player || !num || num <= 1 || num > 9 || !lib.config.extension_十周年UI_newDecadeStyle) return;
		const isNewStyle = lib.config.extension_十周年UI_newDecadeStyle !== "off";
		const animName = isNewStyle ? "globaltexiao/shanghaishuzi/SZN_shuzi" : "globaltexiao/shanghaishuzi/shuzi";
		const options = { speed: 0.6, scale: 0.4, parent: player };
		if (isNewStyle) options.y = 20;
		animation.playSpine({ name: animName, action: String(num) }, options);
	};

	// 玩家初始化钩子 - 添加出牌指示观察器
	lib.element.player.inits = [].concat(lib.element.player.inits || []).concat(async player => {
		if (player.ChupaizhishiXObserver) return;

		let timer = null;
		const DELAY = 300;

		const startAnimation = element => {
			if (element.ChupaizhishiXid || timer) return;
			window.chupaiload = true;
			timer = setTimeout(() => {
				const config = decadeUI.config.chupaizhishi;
				const animConfig = chupaiAnimations[config];
				if (config !== "off" && animConfig) {
					element.ChupaizhishiXid = animation.playSpine({ name: animConfig.name, loop: true }, { parent: element, scale: animConfig.scale });
				}
				timer = null;
			}, DELAY);
		};

		const stopAnimation = element => {
			if (element.ChupaizhishiXid) {
				animation.stopSpine(element.ChupaizhishiXid);
				delete element.ChupaizhishiXid;
			}
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		};

		const observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				if (mutation.attributeName !== "class") continue;
				const target = mutation.target;
				if (target.classList.contains("selectable")) startAnimation(target);
				else stopAnimation(target);
			}
		});

		observer.observe(player, { attributes: true, attributeFilter: ["class"] });
		player.ChupaizhishiXObserver = observer;
	});

	// 注册卡牌动画
	for (const [cardName, config] of Object.entries(cardDefines)) {
		lib.animate.card[cardName] = card => {
			animation.playSpine(config.name, { x: config.x, y: config.y, scale: config.scale });
		};
	}

	// 注册技能动画
	for (const [skillName, config] of Object.entries(skillDefines)) {
		lib.animate.skill[skillName] = function (name) {
			animation.playSpine(config.name, {
				x: config.x,
				y: config.y,
				scale: config.scale,
				parent: this,
			});
		};
	}

	// 应用卡牌触发器
	for (const [cardName, triggers] of Object.entries(cardTriggers)) {
		if (!lib.card[cardName]) continue;
		Object.assign(lib.card[cardName], triggers);
	}
}
