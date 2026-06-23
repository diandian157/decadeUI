"use strict";

/**
 * @fileoverview 动画系统初始化模块，注册技能动画和卡牌触发器
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { skillDefines, cardDefines, chupaiAnimations } from "./configs/skillAnimations.js";
import { cardTriggers } from "./configs/cardTriggers.js";

function stopChupaiAnimation(animation, player) {
	if (!player) return;
	player.ChupaizhishiXSelectable = false;
	if (player.ChupaizhishiXTimer) {
		clearTimeout(player.ChupaizhishiXTimer);
		delete player.ChupaizhishiXTimer;
	}
	if (player.ChupaizhishiXid) {
		animation.stopSpine(player.ChupaizhishiXid);
		delete player.ChupaizhishiXid;
	}
	// handle 可能被外部扩展覆盖或提前删除，按父玩家再兜底清理一次。
	animation.stopDomLoopSpine?.(player);
}

/**
 * 初始化技能动画定义和绑定
 * @param {AnimationPlayer} animation - 动画播放器实例
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
		animation.playSpine(
			{ name: "globaltexiao/xunishuzi/SS_PaiJu_xunishanghai", action: "play" + num },
			{ speed: 0.6, scale: 0.5, parent: player, y: 20 }
		);
	};

	animation.playDamageNumber = (player, num) => {
		if (!player || !num || num <= 1 || num > 9 || !lib.config.extension_十周年UI_newDecadeStyle) return;
		const isNewStyle = lib.config.extension_十周年UI_newDecadeStyle !== "off";
		const animName = isNewStyle ? "globaltexiao/shanghaishuzi/SZN_shuzi" : "globaltexiao/shanghaishuzi/shuzi";
		const options = { speed: 0.6, scale: 0.4, parent: player };
		if (isNewStyle) options.y = 20;
		animation.playSpine({ name: animName, action: String(num) }, options);
	};

	// MutationObserver 可能合并同一轮 uncheck/check 的 class 变化；本体钩子
	// 是目标选择结束时更可靠的停止点，手机低帧率下也不会漏掉。
	if (!animation._chupaiUncheckHookInstalled) {
		lib.hooks.uncheckTarget.push(player => stopChupaiAnimation(animation, player));
		animation._chupaiUncheckHookInstalled = true;
	}

	// 玩家初始化钩子 - 添加出牌指示观察器
	lib.element.player.inits = [].concat(lib.element.player.inits || []).concat(async player => {
		if (player.ChupaizhishiXObserver) return;

		const DELAY = 300;
		player.ChupaizhishiXSelectable = player.classList.contains("selectable");

		const startAnimation = element => {
			if (element.ChupaizhishiXid || element.ChupaizhishiXTimer) return;
			window.chupaiload = true;
			element.ChupaizhishiXTimer = setTimeout(() => {
				delete element.ChupaizhishiXTimer;
				if (!element.isConnected || !element.classList.contains("selectable")) return;
				const config = decadeUI.config.chupaizhishi;
				const animConfig = chupaiAnimations[config];
				if (config !== "off" && animConfig) {
					element.ChupaizhishiXid = animation.playSpine(
						{ name: animConfig.name, loop: true },
						{ parent: element, scale: animConfig.scale }
					);
				}
			}, DELAY);
		};

		const observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				if (mutation.attributeName !== "class") continue;
				const target = mutation.target;
				const selectable = target.classList.contains("selectable");
				if (selectable === target.ChupaizhishiXSelectable) continue;
				if (selectable) {
					// 同一目标进入下一次选牌周期前，先清掉上一次可能遗留的
					// record/node，禁止通过容器重新显示旧循环动画。
					animation.stopDomLoopSpine?.(target);
					delete target.ChupaizhishiXid;
					target.ChupaizhishiXSelectable = true;
					startAnimation(target);
				} else {
					stopChupaiAnimation(animation, target);
				}
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
