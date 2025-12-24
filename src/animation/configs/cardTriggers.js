"use strict";

/**
 * 卡牌触发器配置
 */

export const cardTriggers = {
	taipingyaoshu: {
		onEquip() {
			game.broadcastAll(player => {
				lib.animate.skill.taipingyaoshu.call(player, "taipingyaoshu");
			}, player);
		},
		onLose() {
			player.addTempSkill("taipingyaoshu_lose");
			game.broadcastAll(player => {
				lib.animate.skill.taipingyaoshu_lose.call(player, "taipingyaoshu_lose");
			}, player);
		},
	},

	nvzhuang: {
		onEquip() {
			if (player.sex === "male" && player.countCards("he", c => c !== card)) {
				lib.animate.skill.nvzhuang.call(player, "nvzhuang");
				player.chooseToDiscard(true, c => c !== _status.event.card, "he").set("card", card);
			}
		},
		onLose() {
			if (player.sex !== "male") return;
			const next = game.createEvent("nvzhuang_lose");
			event.next.remove(next);
			let evt = event.getParent();
			if (evt.getlx === false) evt = evt.getParent();
			evt.after.push(next);
			next.player = player;
			next.setContent(() => {
				if (player.countCards("he")) {
					game.broadcastAll(player => {
						lib.animate.skill.nvzhuang.call(player, "nvzhuang");
					}, player);
					player.chooseToDiscard(true, "he");
				}
			});
		},
	},

	zheji: {
		onEquip() {
			game.broadcastAll(player => lib.animate.skill.zheji.call(player, "zheji"), player);
		},
	},

	numa: {
		onEquip() {
			game.broadcastAll(player => lib.animate.skill.numa.call(player, "numa"), player);
		},
	},

	wuliu: {
		onEquip() {
			game.broadcastAll(player => lib.animate.skill.wuliu.call(player, "wuliu"), player);
		},
	},

	duanjian: {
		onEquip() {
			game.broadcastAll(player => lib.animate.skill.duanjian.call(player, "duanjian"), player);
		},
	},

	yonglv: {
		onEquip() {
			game.broadcastAll(player => lib.animate.skill.yonglv.call(player, "yonglv"), player);
		},
	},

	qixingbaodao: {
		onEquip() {
			game.broadcastAll(player => lib.animate.skill.qixingbaodao.call(player, "qixingbaodao"), player);
		},
	},

	lebu: {
		effect() {
			if (result.bool === false) {
				lib.animate.skill.lebu.call(player, "lebu");
				player.skip("phaseUse");
			}
		},
	},

	bingliang: {
		effect() {
			if (result.bool === false) {
				if (get.is.changban()) {
					player.addTempSkill("bingliang_changban");
				} else {
					lib.animate.skill.bingliang.call(player, "bingliang");
					player.skip("phaseDraw");
				}
			}
		},
	},

	shandian: {
		effect() {
			if (result.bool === false) {
				lib.animate.skill.shandian.call(player, "shandian");
				player.damage(3, "thunder", "nosource");
			} else {
				player.addJudgeNext(card);
			}
		},
	},
};
