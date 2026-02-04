/**
 * @fileoverview 复杂继承技能模块
 * @description 包含易城、探锋等复杂游戏逻辑的继承技能
 * @module skills/inherit-complex
 */

import { lib, game, ui, get, _status } from "noname";

/**
 * @type {Object.<string, Object>}
 * @description 复杂继承技能集合
 */
export const inheritComplexSkill = {
	/**
	 * 探锋技能
	 * @description 弃置目标牌，目标可选择用杀反击或受到火焰伤害
	 */
	twtanfeng: {
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget(get.prompt2("twtanfeng"), (card, player, target) => {
					return target !== player && target.countDiscardableCards(player, "hej") > 0;
				})
				.set("ai", target => {
					const player = _status.event.player;
					let num = 1;

					if (get.attitude(player, target) > 0) {
						num = 3;
					} else if (!target.countCards("he") || !target.canUse("sha", player)) {
						num = target.hp + target.countCards("hs", { name: ["tao", "jiu"] }) <= 1 ? 2 : 1.2;
					}

					return (
						get.effect(target, { name: "guohe" }, player, player) * num * (player.hp <= 1 && get.attitude(player, target) <= 0 ? 0 : 1)
					);
				})
				.setHiddenSkill("twtanfeng")
				.forResult();

			if (!result?.bool) return;

			const target = result.targets[0];
			event.target = target;
			player.logSkill("twtanfeng", target);

			await player.discardPlayerCard(target, "hej", true);

			const next = target.chooseToUse();
			next.set(
				"openskilldialog",
				`###探锋：选择一张牌当作【杀】对${get.translation(player)}使用###或点击"取消"，受到其造成的1点火焰伤害，并令其跳过本回合的一个阶段（准备阶段和结束阶段除外）`
			);
			next.set("norestore", true);
			next.set("_backupevent", "twtanfeng_backup");
			next.set("custom", { add: {}, replace: { window() {} } });
			next.backup("twtanfeng_backup");
			next.set("targetRequired", true);
			next.set("complexSelect", true);
			next.set("filterTarget", (card, player, target) => {
				if (target !== _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) return false;
				return card && lib.filter.targetEnabled(card, player, target);
			});
			next.set("sourcex", player);
			next.set("addCount", false);

			const useRes = await next;
			if (useRes?.bool) return;

			player.line(target, "fire");
			await target.damage(1, "fire");

			if (!target.isIn()) return;

			const phaseMap = {
				phaseJudge: "判定阶段",
				phaseDraw: "摸牌阶段",
				phaseUse: "出牌阶段",
				phaseDiscard: "弃牌阶段",
			};

			const list = Object.entries(phaseMap)
				.filter(([phase]) => !player.skipList.includes(phase))
				.map(([, name]) => name);

			const list2 = list.filter(name => name !== "判定阶段" && name !== "弃牌阶段");

			const cResult = await target
				.chooseControl(list)
				.set("prompt", `探锋：令${get.translation(player)}跳过一个阶段`)
				.set("ai", () => _status.event.choice)
				.set(
					"choice",
					(() => {
						const att = get.attitude(target, player);
						const num = player.countCards("j");

						if (att > 0) {
							if (list.includes("判定阶段") && num > 0) return "判定阶段";
							return "弃牌阶段";
						}
						if (list.includes("摸牌阶段") && player.hasJudge("lebu")) return "摸牌阶段";
						if ((list.includes("出牌阶段") && player.hasJudge("bingliang")) || player.needsToDiscard() > 0) {
							return "出牌阶段";
						}
						return list2.randomGet();
					})()
				)
				.forResult();

			for (const [phase, name] of Object.entries(phaseMap)) {
				if (name === cResult.control) player.skip(phase);
			}

			target.popup(cResult.control);
			target.line(player);
			game.log(player, "跳过了", `#y${cResult.control}`);
		},
		subSkill: {
			backup: {
				viewAs: { name: "sha" },
				filterCard: true,
				position: "hes",
				check(card) {
					const player = _status.event.player;
					const target = _status.event.getParent().player;
					const eff = get.effect(target, get.autoViewAs({ name: "sha" }, [card]), player, player);
					const eff2 = get.damageEffect(player, target, player, "fire");

					if (eff < 0 || eff2 > 0 || eff2 > eff || get.tag(card, "recover")) return 0;
					return (player.hp === 1 ? 10 : 6) - get.value(card);
				},
			},
		},
	},

	/**
	 * 华南老仙 - 天书清理
	 * @description 处理天书技能的标记清理
	 */
	olhedao: {
		tianshuClear(skill, player, num = 1) {
			if (num > 0 && get.info(skill)?.nopop) {
				game.broadcastAll(
					(player, skill) => {
						delete lib.skill[skill].nopop;
						lib.skill[skill].markimage = "image/card/tianshu1.png";
						if (player.marks[skill]) {
							player.marks[skill].text.setBackgroundImage(lib.skill[skill].markimage);
						}
					},
					player,
					skill
				);
				player.update();
			}

			player.storage[skill][0] -= num;
			player[player.storage[skill][0] <= 0 ? "removeSkill" : "markSkill"](skill);
		},
	},
};
