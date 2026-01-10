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
	 * 易城技能
	 * @description 展示牌堆顶的牌并可与手牌交换
	 */
	olyicheng: {
		async content(event, trigger, player) {
			let num = player.maxHp;
			let cards = get.cards(num, true);

			await player.showCards(cards, `${get.translation(player)}发动了【易城】`);

			if (!player.countCards("h")) return;

			const sum = cards.reduce((n, card) => n + get.number(card), 0);

			const {
				result: { bool, moved },
			} = await player
				.chooseToMove("易城：请选择你要交换的牌")
				.set("filterMove", (from, to) => typeof to !== "number")
				.set("list", [
					[
						"牌堆顶",
						cards,
						list => {
							const sum2 = list.reduce((n, card) => n + get.number(card, false), 0);
							const sign = { 0: "=", "-1": "<", 1: ">" }[get.sgn(sum2 - sum).toString()];
							return `牌堆顶（现${sum2}${sign}原${sum}）`;
						},
					],
					["手牌", player.getCards("h")],
				])
				.set("filterOk", moved => moved[1].some(i => !get.owner(i)))
				.set("processAI", list => {
					const player = get.event().player;
					const limit = Math.min(get.event().num, player.countCards("h"));
					let cards = list[0][1].slice();
					let hs = player.getCards("h");

					if (cards.reduce((n, c) => n + get.value(c), 0) > hs.reduce((n, c) => n + get.value(c), 0)) {
						cards.sort((a, b) => get.number(a) - get.number(b));
						hs.sort((a, b) => get.number(b) - get.number(a));
						const cards2 = cards.slice(0, limit);
						const hs2 = hs.slice(0, limit);

						if (hs2.reduce((n, c) => n + get.number(c), 0) > cards2.reduce((n, c) => n + get.number(c), 0)) {
							cards.removeArray(cards2);
							hs.removeArray(hs2);
							return [cards.concat(hs2), hs.concat(cards2)];
						}
						return [cards, hs];
					}

					cards.sort((a, b) => get.value(b) - get.value(a));
					hs.sort((a, b) => get.value(a) - get.value(b));
					const cards2 = cards.slice(0, limit);
					const hs2 = hs.slice(0, limit);

					for (let i = 0; i < limit; i++) {
						if (get.value(cards2[i]) > get.value(hs2[i])) {
							[cards[i], hs[i]] = [hs2[i], cards2[i]];
						} else break;
					}
					return [cards, hs];
				})
				.set("num", num);

			if (!bool) return;

			const puts = player.getCards("h", i => moved[0].includes(i));
			const gains = cards.filter(i => moved[1].includes(i));

			if (!puts.length || !gains.length) return;

			player.$throw(puts, 1000);
			await player.lose(puts, ui.special);
			await player.gain(gains, "gain2");

			moved[1].reverse().forEach(card => {
				player.node.handcards1.insertBefore(card, player.node.handcards1.firstChild);
			});
			decadeUI.queueNextFrameTick(decadeUI.layoutHand, decadeUI);

			cards = moved[0].slice();
			if (cards.length) {
				await game.cardsGotoOrdering(cards);
				for (let i = cards.length - 1; i >= 0; i--) {
					ui.cardPile.insertBefore(cards[i], ui.cardPile.firstChild);
				}
				game.log(cards, "被放回了牌堆顶");
				game.updateRoundNumber();
			}

			await player.showCards(cards, `${get.translation(player)}【易城】第一次交换后`);

			const newSum = cards.reduce((n, card) => n + get.number(card), 0);
			if (newSum <= sum || !player.countCards("h")) return;

			const {
				result: { bool: bool2 },
			} = await player
				.chooseBool(`易城：是否使用全部手牌交换${get.translation(cards)}？`)
				.set("choice", cards.reduce((n, c) => n + get.value(c), 0) > player.getCards("h").reduce((n, c) => n + get.value(c), 0))
				.forResult();

			if (!bool2) return;

			const hs = player.getCards("h");
			player.$throw(hs, 1000);
			await player.lose(hs, ui.special);
			await player.gain(cards, "gain2");

			cards = hs.slice();
			if (cards.length) {
				await game.cardsGotoOrdering(cards);
				for (let i = cards.length - 1; i >= 0; i--) {
					ui.cardPile.insertBefore(cards[i], ui.cardPile.firstChild);
				}
				game.log(cards, "被放回了牌堆顶");
				game.updateRoundNumber();
			}

			await player.showCards(cards, `${get.translation(player)}【易城】第二次交换后`);
		},
	},

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

					return get.effect(target, { name: "guohe" }, player, player) * num * (player.hp <= 1 && get.attitude(player, target) <= 0 ? 0 : 1);
				})
				.setHiddenSkill("twtanfeng")
				.forResult();

			if (!result?.bool) return;

			const target = result.targets[0];
			event.target = target;
			player.logSkill("twtanfeng", target);

			await player.discardPlayerCard(target, "hej", true);

			const next = target.chooseToUse();
			next.set("openskilldialog", `###探锋：选择一张牌当作【杀】对${get.translation(player)}使用###或点击"取消"，受到其造成的1点火焰伤害，并令其跳过本回合的一个阶段（准备阶段和结束阶段除外）`);
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
