/**
 * @fileoverview 蛊惑技能模块
 * @description 蛊惑技能的质疑动画和逻辑
 * @module skills/guhuo
 */

import { lib, game, ui, get, _status } from "noname";

/**
 * @type {Object.<string, Object>}
 * @description 蛊惑相关技能
 */
export const guhuoSkill = {
	/**
	 * 蛊惑猜测
	 * @description 处理蛊惑技能的质疑流程和翻牌动画
	 */
	guhuo_guess: {
		async content(event, trigger, player) {
			player.addTempSkill("guhuo_phase");
			event.fake = false;
			event.betrayer = null;

			const [card] = trigger.cards;
			const isFake = card.name !== trigger.card.name || (card.name === "sha" && !get.is.sameNature(trigger.card, card));
			event.fake = isFake;

			player.popup(trigger.card.name, "metal");

			const next = player.lose(card, ui.ordering);
			next.relatedEvent = trigger;
			await next;

			trigger.throw = false;
			trigger.skill = "xinfu_guhuo_backup";

			const actionText = trigger.name === "useCard" ? "使用" : "打出";
			const targetText = trigger.targets?.length ? `对${get.translation(trigger.targets)}` : "";
			const cardText = (get.translation(trigger.card.nature) || "") + get.translation(trigger.card.name);

			game.log(player, "声明", targetText, actionText, trigger.card);
			event.prompt = `${get.translation(player)}声明${targetText}${actionText}${cardText}，是否质疑？`;

			event.targets = game.filterPlayer(current => current !== player && !current.hasSkill("chanyuan")).sortBySeat(_status.currentPhase);

			// 创建翻牌动画节点
			game.broadcastAll(
				(card, player) => {
					const bounds = decadeUI.boundsCaches.arena;
					if (!bounds.updated) bounds.update();

					const scale = bounds.cardScale;
					const x = Math.round((bounds.width - bounds.cardWidth) / 2);
					const y = Math.round(bounds.height * 0.45 - bounds.cardHeight / 2);

					const node = (_status.event.guhuoNode = card.copy("thrown"));
					node.classList.add("infohidden");
					node.classList.remove("decade-card");
					node.style.background = "";
					node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(180deg)`;

					ui.arena.appendChild(node);
					ui.thrown.push(node);

					const setion = ui.create.div(".cardsetion", get.cardsetion(player), node);
					setion.style.setProperty("display", "block", "important");
				},
				card,
				player
			);

			// 逐个询问是否质疑
			for (const target of event.targets) {
				const result = await target
					.chooseButton([event.prompt, [["reguhuo_ally", "reguhuo_betray"], "vcard"]], true)
					.set("ai", button => {
						const player = _status.event.player;
						const evt = _status.event.getParent("guhuo_guess");
						const evtx = evt?.getTrigger();
						if (!evt) return Math.random();

						const card = { name: evtx.card.name, nature: evtx.card.nature, isCard: true };
						const ally = button.link[2] === "reguhuo_ally";

						if (ally && (player.hp <= 1 || get.attitude(player, evt.player) >= 0)) return 1.1;

						if (!ally && get.attitude(player, evt.player) < 0 && evtx.name === "useCard") {
							const targetsx = evtx.targets || [];
							let eff = 0;

							for (const t of targetsx) {
								const isMe = t === evt.player;
								eff += get.effect(t, card, evt.player, player) / (isMe ? 1.5 : 1);
							}
							eff /= 1.5 * targetsx.length || 1;

							if (eff > 0) return 0;
							if (eff < -7) return Math.random() + Math.pow(-(eff + 7) / 8, 2);
							return Math.pow((get.value(card, evt.player, "raw") - 4) / (eff === 0 ? 5 : 10), 2);
						}
						return Math.random();
					})
					.forResult();
				const links = result.links;

				if (links[0][2] === "reguhuo_betray") {
					target.addExpose(0.2);
					game.log(target, "#y质疑");
					target.popup("质疑！", "fire");
					event.betrayer = target;
					break;
				}

				game.log(target, "#g不质疑");
				target.popup("不质疑", "wood");
				await game.delayx();
			}

			// 翻牌动画
			game.broadcastAll(node => {
				const bounds = decadeUI.boundsCaches.arena;
				if (!bounds.updated) bounds.update();

				const scale = bounds.cardScale;
				const x = Math.round((bounds.width - bounds.cardWidth) / 2);
				const y = Math.round(bounds.height * 0.45 - bounds.cardHeight / 2);

				node.style.transition = "all ease-in 0.3s";
				node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(270deg) translateX(52px)`;

				node.listenTransition(() => {
					node.classList.remove("infohidden");
					if (card.classList.contains("decade-card")) {
						node.classList.add("decade-card");
						node.style.background = card.style.background;
					}
					node.style.transition = "all 0s";
					ui.refresh(node);
					node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(-90deg) translateX(52px)`;
					ui.refresh(node);
					node.style.transition = "";
					ui.refresh(node);
					node.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
				});
			}, event.guhuoNode);

			await game.delay(2);

			if (!event.betrayer) return;

			// 处理质疑结果
			if (event.fake) {
				event.betrayer.popup("质疑正确", "wood");
				game.log(player, "声明的", trigger.card, "作废了");
				trigger.cancel();
				trigger.getParent().goto(0);
				trigger.line = false;
			} else {
				event.betrayer.popup("质疑错误", "fire");
				await event.betrayer.addSkills("chanyuan");
			}

			await game.delay(2);

			if (event.fake) {
				game.broadcastAll(() => ui.clear());
			}
		},
	},
};
