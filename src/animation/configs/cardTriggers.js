"use strict";

/**
 * @fileoverview 卡牌触发器配置，定义装备和延时锦囊的特效触发逻辑
 */

import { game as gameImport, _status } from "noname";

/**
 * 卡牌触发器配置对象
 * @type {Object.<string, {onEquip?: Function, onLose?: Function, effect?: Function}>}
 */
export const cardTriggers = {
	taipingyaoshu: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.taipingyaoshu) {
					lib.animate.skill.taipingyaoshu.call(player, "taipingyaoshu");
				}
			}, player);
		},
		onLose() {
			player.addTempSkill("taipingyaoshu_lose");
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.taipingyaoshu_lose) {
					lib.animate.skill.taipingyaoshu_lose.call(player, "taipingyaoshu_lose");
				}
			}, player);
		},
	},

	nvzhuang: {
		onEquip() {
			if (player.sex === "male" && player.countCards("he", c => c !== card)) {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.nvzhuang) {
					lib.animate.skill.nvzhuang.call(player, "nvzhuang");
				}
				player.chooseToDiscard(true, c => c !== _status.event.card, "he").set("card", card);
			}
		},
		onLose() {
			if (player.sex !== "male") return;
			const next = gameImport.createEvent("nvzhuang_lose");
			event.next.remove(next);
			let evt = event.getParent();
			if (evt.getlx === false) evt = evt.getParent();
			evt.after.push(next);
			next.player = player;
			next.setContent(() => {
				if (player.countCards("he")) {
					gameImport.broadcastAll(player => {
						const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
						if (lib && lib.animate && lib.animate.skill && lib.animate.skill.nvzhuang) {
							lib.animate.skill.nvzhuang.call(player, "nvzhuang");
						}
					}, player);
					player.chooseToDiscard(true, "he");
				}
			});
		},
	},

	zheji: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.zheji) {
					lib.animate.skill.zheji.call(player, "zheji");
				}
			}, player);
		},
	},

	numa: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.numa) {
					lib.animate.skill.numa.call(player, "numa");
				}
			}, player);
		},
	},

	wuliu: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.wuliu) {
					lib.animate.skill.wuliu.call(player, "wuliu");
				}
			}, player);
		},
	},

	duanjian: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.duanjian) {
					lib.animate.skill.duanjian.call(player, "duanjian");
				}
			}, player);
		},
	},

	yonglv: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.yonglv) {
					lib.animate.skill.yonglv.call(player, "yonglv");
				}
			}, player);
		},
	},

	qixingbaodao: {
		onEquip() {
			gameImport.broadcastAll(player => {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.qixingbaodao) {
					lib.animate.skill.qixingbaodao.call(player, "qixingbaodao");
				}
			}, player);
		},
	},

	lebu: {
		effect() {
			if (result.bool === false) {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.lebu) {
					lib.animate.skill.lebu.call(player, "lebu");
				}
				player.skip("phaseUse");
			}
		},
	},

	bingliang: {
		effect() {
			if (result.bool === false) {
				const get = (typeof window !== "undefined" && window["get"]) || (typeof globalThis !== "undefined" && globalThis["get"]);
				if (get && get.is && get.is.changban && get.is.changban()) {
					player.addTempSkill("bingliang_changban");
				} else {
					const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
					if (lib && lib.animate && lib.animate.skill && lib.animate.skill.bingliang) {
						lib.animate.skill.bingliang.call(player, "bingliang");
					}
					player.skip("phaseDraw");
				}
			}
		},
	},

	shandian: {
		effect() {
			if (result.bool === false) {
				const lib = (typeof window !== "undefined" && window["lib"]) || (typeof globalThis !== "undefined" && globalThis["lib"]);
				if (lib && lib.animate && lib.animate.skill && lib.animate.skill.shandian) {
					lib.animate.skill.shandian.call(player, "shandian");
				}
				player.damage(3, "thunder", "nosource");
			} else {
				player.addJudgeNext(card);
			}
		},
	},
};
