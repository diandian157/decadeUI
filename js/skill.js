"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	decadeUI.animateSkill = {
		mx_start: {
			trigger: {
				global: "gameDrawAfter",
			},
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
				animation.playSpine({
					name: effectName,
					scale,
				});
			},
		},
		mx_borderLevel: {
			trigger: {
				global: "gameStart",
			},
			silent: true,
			forced: true,
			filter(event, player) {
				return lib.config.extension_十周年UI_newDecadeStyle === "off" && lib.config.extension_十周年UI_borderLevel === "random";
			},
			async content(event, trigger, player) {
				game.removeGlobalSkill("mx_borderLevel");
				const levels = ["two", "three", "four", "five"];
				game.players.forEach(p => {
					const level = levels[Math.floor(Math.random() * levels.length)];
					p.dataset.longLevel = level;
				});
			},
		},
		decadeUI_usecardBegin: {
			trigger: {
				global: "useCardBegin",
			},
			forced: true,
			popup: false,
			priority: -100,
			silent: true,
			filter(event) {
				return !ui.clear.delay && event.card.name !== "wuxie";
			},
			async content(event, trigger, player) {
				ui.clear.delay = "usecard";
			},
		},
		decadeUI_dieKillEffect: {
			trigger: {
				source: ["dieBegin"],
			},
			forced: true,
			popup: false,
			priority: -100,
			lastDo: true,
			silent: true,
			filter(event) {
				return lib.config.extension_十周年UI_killEffect;
			},
			async content(event, trigger, player) {
				if (!(trigger.source && trigger.player)) return;
				game.broadcastAll(
					(source, player) => {
						if (!window.decadeUI) return;
						decadeUI.effect.kill(source, player);
					},
					trigger.source,
					trigger.player
				);
			},
		},
		_decadeUI_recastable_recast: {
			trigger: { player: "useCardBefore" },
			forced: true,
			popup: false,
			silent: true,
			filter(event, player) {
				if (lib.config.extension_十周年UI_newDecadeStyle === "off") return false;
				const recastableCards = ["tiesuo", "lulitongxin", "zhibi"];
				const cardName = get.name(event.card);
				return recastableCards.includes(cardName) && (!event.targets || event.targets.length === 0);
			},
			async content(event, trigger, player) {
				trigger.cancel();
				const cards = trigger.cards?.slice() || [];
				if (cards.length > 0) {
					await player.recast(cards);
				}
			},
		},
	};
	decadeUI.skill = {
		ghujia: {
			mark: false,
		},
		_hpLossAnimation: {
			trigger: { player: "loseHpBefore" },
			forced: true,
			popup: false,
			charlotte: true,
			filter(event) {
				return !!event.num;
			},
			async content(event, trigger, player) {
				if (window.dcdAnim && typeof window.dcdAnim.playLoseHp === "function") {
					window.dcdAnim.playLoseHp(player);
				}
			},
		},
		_wjmh_huifushuzi_: {
			priority: 10,
			forced: true,
			trigger: { player: "recoverBegin" },
			filter(event) {
				return event.num && event.num > 0 && event.num <= 9 && lib.config.extension_十周年UI_newDecadeStyle !== "off";
			},
			async content(event, trigger, player) {
				if (decadeUI.animation && typeof decadeUI.animation.playRecoverNumber === "function") {
					decadeUI.animation.playRecoverNumber(player, trigger.num);
				}
			},
		},
		_wjmh_xunishuzi_: {
			priority: 10,
			forced: true,
			trigger: { player: "damage" },
			filter(event) {
				return event.num >= 0 && event.num <= 9 && event.unreal;
			},
			async content(event, trigger, player) {
				if (decadeUI.animation && typeof decadeUI.animation.playVirtualDamageNumber === "function") {
					decadeUI.animation.playVirtualDamageNumber(player, trigger.num);
				}
			},
		},
		_wjmh_shanghaishuzi_: {
			priority: 210,
			forced: true,
			trigger: { player: "damageBegin4" },
			filter(event) {
				return event.num && event.num > 1 && event.num <= 9 && lib.config.extension_十周年UI_newDecadeStyle;
			},
			async content(event, trigger, player) {
				if (decadeUI.animation && typeof decadeUI.animation.playDamageNumber === "function") {
					decadeUI.animation.playDamageNumber(player, trigger.num);
				}
			},
		},
		_usecard: {
			trigger: {
				global: "useCardAfter",
			},
			forced: true,
			popup: false,
			silent: true,
			priority: -100,
			filter(event) {
				return ui.clear.delay === "usecard" && event.card.name !== "wuxie";
			},
			async content(event, trigger, player) {
				ui.clear.delay = false;
				game.broadcastAll(() => {
					ui.clear();
				});
			},
		},
		_discard: {
			trigger: {
				global: ["discardAfter", "loseToDiscardpileAfter", "loseAsyncAfter"],
			},
			filter(event) {
				return !!ui.todiscard[event.discardid];
			},
			forced: true,
			silent: true,
			popup: false,
			priority: -100,
			async content(event, trigger, player) {
				game.broadcastAll(id => {
					if (window.decadeUI) {
						ui.todiscard = [];
						ui.clear();
						return;
					}
					const todiscard = ui.todiscard[id];
					delete ui.todiscard[id];
					if (todiscard) {
						let time = 1000;
						if (typeof todiscard._discardtime === "number") {
							time += todiscard._discardtime - get.time();
						}
						time = Math.max(0, time);
						setTimeout(() => {
							for (const card of todiscard) {
								card.delete();
							}
						}, time);
					}
				}, trigger.discardid);
			},
		},
		olddanshou: {
			audio: "danshou",
			trigger: { source: "damageSource" },
			check(event, player) {
				return get.attitude(player, event.player) <= 0;
			},
			async content(event, trigger, player) {
				await player.draw();
				const cards = Array.from(ui.ordering.childNodes);
				while (cards.length) {
					cards.shift().discard();
				}
				const evt = _status.event.getParent("phase", true);
				if (evt) {
					if (window.decadeUI?.eventDialog) {
						decadeUI.eventDialog.finished = true;
						decadeUI.eventDialog.finishing = false;
						decadeUI.eventDialog = undefined;
					}
					game.resetSkills();
					_status.event = evt;
					_status.event.finish();
					_status.event.untrigger(true);
				}
			},
			ai: {
				jueqing: true,
			},
		},
	};
	decadeUI.inheritSkill = {
		xinfu_pingcai: {
			contentx: [
				async (event, trigger, player) => {
					event.pingcai_delayed = true;
					const name = lib.skill.xinfu_pingcai_backup.takara;
					event.cardname = name;
					event.videoId = lib.status.videoId++;
					if (player.isUnderControl()) {
						game.swapPlayerAuto(player);
					}
					const switchToAuto = () => {
						game.pause();
						game.countChoose();
						event.timeout = setTimeout(() => {
							_status.imchoosing = false;
							event._result = {
								bool: true,
							};
							game.resume();
						}, 9000);
					};
					const createDialog = (player, id, name) => {
						if (player === game.me) return;
						const dialog = ui.create.dialog("forcebutton", "hidden");
						const canSkip = !_status.connectMode;
						let str = `${get.translation(player)}正在擦拭宝物上的灰尘…`;
						if (canSkip) str += "<br>（点击宝物可以跳过等待AI操作）";
						dialog.textPrompt = dialog.add(`<div class="text center">${str}</div>`);
						dialog.classList.add("fixed", "scroll1", "scroll2", "fullwidth", "fullheight", "noupdate");
						dialog.videoId = id;
						const canvas2 = document.createElement("canvas");
						dialog.canvas_viewer = canvas2;
						dialog.appendChild(canvas2);
						canvas2.classList.add("grayscale");
						Object.assign(canvas2.style, {
							position: "absolute",
							width: "249px",
							height: "249px",
							borderRadius: "6px",
							left: "calc(50% - 125px)",
							top: "calc(50% - 125px)",
							border: "3px solid",
						});
						canvas2.width = 249;
						canvas2.height = 249;
						const ctx2 = canvas2.getContext("2d");
						const img = new Image();
						img.src = `${lib.assetURL}image/card/${name}.png`;
						img.onload = () => {
							ctx2.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas2.width, canvas2.height);
						};
						if (canSkip) {
							const skip = () => {
								if (event.pingcai_delayed) {
									delete event.pingcai_delayed;
									clearTimeout(event.timeout);
									event._result = {
										bool: true,
									};
									game.resume();
									canvas2.removeEventListener(lib.config.touchscreen ? "touchend" : "click", skip);
								}
							};
							canvas2.addEventListener(lib.config.touchscreen ? "touchend" : "click", skip);
						}
						dialog.open();
					};
					const chooseButton = (id, name) => {
						const event = _status.event;
						_status.xinfu_pingcai_finished = false;
						const dialog = ui.create.dialog("forcebutton", "hidden");
						dialog.textPrompt = dialog.add('<div class="text center">擦拭掉宝物上的灰尘吧！</div>');
						event.switchToAuto = () => {
							event._result = {
								bool: _status.xinfu_pingcai_finished,
							};
							game.resume();
							_status.imchoosing = false;
							_status.xinfu_pingcai_finished = true;
						};
						dialog.classList.add("fixed", "scroll1", "scroll2", "fullwidth", "fullheight", "noupdate");
						dialog.videoId = id;
						const canvas = document.createElement("canvas");
						const canvas2 = document.createElement("canvas");
						dialog.appendChild(canvas2);
						dialog.appendChild(canvas);
						const canvasStyle = {
							position: "absolute",
							width: "249px",
							height: "249px",
							borderRadius: "6px",
							left: "calc(50% - 125px)",
							top: "calc(50% - 125px)",
							border: "3px solid",
						};
						Object.assign(canvas.style, canvasStyle);
						Object.assign(canvas2.style, canvasStyle);
						canvas.width = 249;
						canvas.height = 249;
						canvas2.width = 249;
						canvas2.height = 249;
						const ctx = canvas.getContext("2d");
						const ctx2 = canvas2.getContext("2d");
						const img = new Image();
						img.src = `${lib.assetURL}image/card/${name}.png`;
						img.onload = () => {
							ctx2.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas2.width, canvas2.height);
						};
						ctx.fillStyle = "lightgray";
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						const checkCompletion = () => {
							const data = ctx.getImageData(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8).data;
							let sum = 0;
							for (let i = 3; i < data.length; i += 4) {
								if (data[i] === 0) {
									sum++;
								}
							}
							if (sum >= canvas.width * canvas.height * 0.6 && !_status.xinfu_pingcai_finished) {
								_status.xinfu_pingcai_finished = true;
								event.switchToAuto();
							}
						};
						canvas.onmousedown = () => {
							canvas.onmousemove = e => {
								if (_status.xinfu_pingcai_finished) return;
								ctx.beginPath();
								ctx.clearRect(e.offsetX / game.documentZoom - 16, e.offsetY / game.documentZoom - 16, 32, 32);
								checkCompletion();
							};
						};
						canvas.ontouchstart = () => {
							canvas.ontouchmove = e => {
								if (_status.xinfu_pingcai_finished) return;
								ctx.beginPath();
								const rect = canvas.getBoundingClientRect();
								const X = ((e.touches[0].clientX / game.documentZoom - rect.left) / rect.width) * canvas.width;
								const Y = ((e.touches[0].clientY / game.documentZoom - rect.top) / rect.height) * canvas.height;
								ctx.clearRect(X - 16, Y - 16, 32, 32);
								checkCompletion();
							};
						};
						canvas.onmouseup = () => {
							canvas.onmousemove = null;
						};
						canvas.ontouchend = () => {
							canvas.ontouchmove = null;
						};
						dialog.open();
						game.pause();
						game.countChoose();
					};
					game.broadcastAll(createDialog, player, event.videoId, name);
					if (event.isMine()) {
						chooseButton(event.videoId, name);
					} else if (event.isOnline()) {
						event.player.send(chooseButton, event.videoId, name);
						event.player.wait();
						game.pause();
					} else {
						switchToAuto();
					}
				},
				async (event, trigger, player) => {
					const result = event._result || event.result || { bool: false };
					event._result = result;
					game.broadcastAll(
						(id, result, player) => {
							_status.xinfu_pingcai_finished = true;
							const dialog = get.idDialog(id);
							if (dialog) {
								dialog.textPrompt.innerHTML = `<div class="text center">${get.translation(player)}擦拭宝物${result.bool ? "成功！" : "失败…"}</div>`;
								if (result.bool && dialog.canvas_viewer) dialog.canvas_viewer.classList.remove("grayscale");
							}
							if (!_status.connectMode) delete event.pingcai_delayed;
						},
						event.videoId,
						result,
						player
					);
					await game.delay(2.5);
				},
				async (event, trigger, player) => {
					game.broadcastAll("closeDialog", event.videoId);
					if (event._result?.bool) {
						player.logSkill(`pcaudio_${event.cardname}`);
						event.insert(lib.skill.xinfu_pingcai[event.cardname], {
							player,
						});
					}
				},
			],
			ai: {
				order: 7,
				fireAttack: true,
				threaten: 1.7,
				result: {
					player: 1,
				},
			},
		},
		xz_xunxun: {
			inherit: "xunxun",
			filter(event, player) {
				return game.hasPlayer(current => current.isDamaged()) && !player.hasSkill("xunxun");
			},
		},
		dddfenye: {
			$compareFenye(players, cards1, targets, cards2) {
				game.broadcast(
					(players, cards1, targets, cards2) => {
						lib.skill.dddfenye.$compareFenye(players, cards1, targets, cards2);
					},
					players,
					cards1,
					targets,
					cards2
				);
				game.addVideo("compareFenye", [get.targetsInfo(players), get.cardsInfo(cards1), get.targetsInfo(targets), get.cardsInfo(cards2)]);
				for (let i = players.length - 1; i >= 0; i--) {
					players[i].$throwordered2(cards1[i].copy(false));
				}
				for (let i = targets.length - 1; i >= 0; i--) {
					targets[i].$throwordered2(cards2[i].copy(false));
				}
			},
		},
		dcqixin: {
			mark: undefined,
			init(player, skill) {
				if (_status.gameStarted && !player.storage.dcqixin_hp) {
					player.storage.dcqixin_hp = [player.maxHp, player.maxHp];
				}
				const mark = player.marks[skill];
				if (!mark) player.markSkill(skill);
				game.broadcastAll(
					(player, skill) => {
						lib.skill.dcqixin.$zhuanhuanji(skill, player);
					},
					player,
					skill
				);
			},
			$zhuanhuanji(skill, player) {
				const character = player.storage[skill] ? "caojie" : "liuxie";
				const mark = player.marks[skill];
				if (mark) {
					mark.setBackground(character, "character");
					mark._name = character;
					mark.style.setProperty("background-size", "cover", "important");
					mark.text.style.setProperty("font-size", "0px", "important");
				}
				player.changeSkin(
					{
						characterName: "liuxiecaojie",
					},
					`liuxiecaojie${player.storage[skill] ? "_shadow" : ""}`
				);
			},
		},
		olyicheng: {
			async content(event, trigger, player) {
				let num = player.maxHp,
					cards = get.cards(num, true);
				await player.showCards(cards, `${get.translation(player)}发动了【易城】`);
				if (player.countCards("h")) {
					const sum = cards.reduce((num, card) => num + get.number(card), 0);
					const {
						result: { bool, moved },
					} = await player
						.chooseToMove("易城：请选择你要交换的牌")
						.set("filterMove", (from, to) => {
							return typeof to !== "number";
						})
						.set("list", [
							[
								"牌堆顶",
								cards,
								list => {
									const sum2 = list.reduce((num, card) => num + get.number(card, false), 0);
									const sign = { 0: "=", "-1": "<", 1: ">" }[get.sgn(sum2 - sum).toString()];
									return `牌堆顶（现${sum2}${sign}原${sum}）`;
								},
							],
							["手牌", player.getCards("h")],
						])
						.set("filterOk", moved => moved[1].some(i => !get.owner(i)))
						.set("processAI", list => {
							const player = get.event("player"),
								limit = Math.min(get.event("num"), player.countCards("h"));
							let cards = list[0][1].slice(),
								hs = player.getCards("h");
							if (cards.reduce((num, card) => num + get.value(card), 0) > player.getCards("h").reduce((num, card) => num + get.value(card), 0)) {
								cards.sort((a, b) => get.number(a) - get.number(b));
								hs.sort((a, b) => get.number(b) - get.number(a));
								let cards2 = cards.slice(0, limit),
									hs2 = hs.slice(0, limit);
								if (hs2.reduce((num, card) => num + get.number(card), 0) > cards2.reduce((num, card) => num + get.number(card), 0)) {
									cards.removeArray(cards2);
									hs.removeArray(hs2);
									return [cards.concat(hs2), hs.concat(cards2)];
								}
								return [cards, hs];
							} else {
								cards.sort((a, b) => get.value(b) - get.value(a));
								hs.sort((a, b) => get.value(a) - get.value(b));
								let cards2 = cards.slice(0, limit),
									hs2 = hs.slice(0, limit),
									list = [cards, hs];
								for (let i = 0; i < limit; i++) {
									if (get.value(cards2[i]) > get.value(hs2[i])) {
										const change = [cards2[i], hs2[i]];
										cards[i] = change[1];
										hs[i] = change[0];
									} else break;
								}
								return list;
							}
						})
						.set("num", num);
					if (bool) {
						const puts = player.getCards("h", i => moved[0].includes(i));
						const gains = cards.filter(i => moved[1].includes(i));
						if (puts.length && gains.length) {
							player.$throw(puts, 1000);
							await player.lose(puts, ui.special);
							await player.gain(gains, "gain2");
							const hs = moved[1].reverse();
							hs.forEach(card => {
								player.node.handcards1.insertBefore(card, player.node.handcards1.firstChild);
							});
							dui.queueNextFrameTick(dui.layoutHand, dui);
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
							if (cards.reduce((num, card) => num + get.number(card), 0) > sum && player.countCards("h")) {
								const {
									result: { bool },
								} = await player.chooseBool(`易城：是否使用全部手牌交换${get.translation(cards)}？`).set("choice", cards.reduce((num, card) => num + get.value(card), 0) > player.getCards("h").reduce((num, card) => num + get.value(card), 0));
								if (bool) {
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
								}
							}
						}
					}
				}
			},
		},
		twtanfeng: {
			async content(event, trigger, player) {
				const choose = player
					.chooseTarget(get.prompt2("twtanfeng"), (card, player, target) => {
						return target !== player && target.countDiscardableCards(player, "hej") > 0;
					})
					.set("ai", target => {
						const player = _status.event.player;
						let num = 1;
						if (get.attitude(player, target) > 0) num = 3;
						else if (!target.countCards("he") || !target.canUse("sha", player)) {
							if (
								target.hp +
									target.countCards("hs", {
										name: ["tao", "jiu"],
									}) <=
								1
							)
								num = 2;
							else num = 1.2;
						}
						return (
							get.effect(
								target,
								{
									name: "guohe",
								},
								player,
								player
							) *
							num *
							(player.hp <= 1 && get.attitude(player, target) <= 0 ? 0 : 1)
						);
					})
					.setHiddenSkill("twtanfeng");
				const { result } = await choose;
				if (!result?.bool) return;
				const target = result.targets[0];
				event.target = target;
				player.logSkill("twtanfeng", target);
				await player.discardPlayerCard(target, "hej", true);
				const next = target.chooseToUse();
				next.set("openskilldialog", `###探锋：选择一张牌当作【杀】对${get.translation(player)}使用###或点击"取消"，受到其造成的1点火焰伤害，并令其跳过本回合的一个阶段（准备阶段和结束阶段除外）`);
				next.set("norestore", true);
				next.set("_backupevent", "twtanfeng_backup");
				next.set("custom", {
					add: {},
					replace: {
						window() {},
					},
				});
				next.backup("twtanfeng_backup");
				next.set("targetRequired", true);
				next.set("complexSelect", true);
				next.set("filterTarget", (card, player, target) => {
					if (target !== _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) return false;
					if (!card) return false;
					return lib.filter.targetEnabled(card, player, target);
				});
				next.set("sourcex", player);
				next.set("addCount", false);
				const useRes = await next;
				if (!useRes?.bool) {
					player.line(target, "fire");
					await target.damage(1, "fire");
				} else {
					return;
				}
				if (!target.isIn()) return;
				const list = [];
				const list2 = [];
				event.map = {
					phaseJudge: "判定阶段",
					phaseDraw: "摸牌阶段",
					phaseUse: "出牌阶段",
					phaseDiscard: "弃牌阶段",
				};
				for (const phase of ["phaseJudge", "phaseDraw", "phaseUse", "phaseDiscard"]) {
					if (!player.skipList.includes(phase)) {
						const phaseName = event.map[phase];
						list.push(phaseName);
						if (phaseName !== "判定阶段" && phaseName !== "弃牌阶段") list2.push(phaseName);
					}
				}
				const ctrl = target
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
							if ((list.includes("出牌阶段") && player.hasJudge("bingliang")) || player.needsToDiscard() > 0) return "出牌阶段";
							return list2.randomGet();
						})()
					);
				const { result: cResult } = await ctrl;
				for (const phase in event.map) {
					if (event.map[phase] === cResult.control) player.skip(phase);
				}
				target.popup(cResult.control);
				target.line(player);
				game.log(player, "跳过了", `#y${cResult.control}`);
			},
			subSkill: {
				backup: {
					viewAs: {
						name: "sha",
					},
					filterCard: true,
					position: "hes",
					check(card) {
						const player = _status.event.player;
						const target = _status.event.getParent().player;
						const eff = get.effect(
							target,
							get.autoViewAs(
								{
									name: "sha",
								},
								[card]
							),
							player,
							player
						);
						const eff2 = get.damageEffect(player, target, player, "fire");
						if (eff < 0 || eff2 > 0 || eff2 > eff || get.tag(card, "recover")) return 0;
						return (player.hp === 1 ? 10 : 6) - get.value(card);
					},
				},
			},
		},
		olhedao: {
			tianshuClear(skill, player, num = 1) {
				if (num > 0 && get.info(skill)?.nopop) {
					game.broadcastAll(
						(player, skill) => {
							delete lib.skill[skill].nopop;
							lib.skill[skill].markimage = "image/card/tianshu1.png";
							if (player.marks[skill]) player.marks[skill].text.setBackgroundImage(lib.skill[skill].markimage);
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
		guhuo_guess: {
			async content(event, trigger, player) {
				player.addTempSkill("guhuo_phase");
				event.fake = false;
				event.betrayer = null;
				const [card] = trigger.cards;
				if (card.name != trigger.card.name || (card.name == "sha" && !get.is.sameNature(trigger.card, card))) {
					event.fake = true;
				}
				player.popup(trigger.card.name, "metal");
				const next = player.lose(card, ui.ordering);
				next.relatedEvent = trigger;
				await next;
				trigger.throw = false;
				trigger.skill = "xinfu_guhuo_backup";
				game.log(player, "声明", trigger.targets && trigger.targets.length ? "对" : "", trigger.targets || "", trigger.name == "useCard" ? "使用" : "打出", trigger.card);
				event.prompt = get.translation(player) + "声明" + (trigger.targets && trigger.targets.length ? "对" + get.translation(trigger.targets) : "") + (trigger.name == "useCard" ? "使用" : "打出") + (get.translation(trigger.card.nature) || "") + get.translation(trigger.card.name) + "，是否质疑？";
				event.targets = game
					.filterPlayer(function (current) {
						return current != player && !current.hasSkill("chanyuan");
					})
					.sortBySeat(_status.currentPhase);
				game.broadcastAll(
					function (card, player) {
						const bounds = dui.boundsCaches.arena;
						if (!bounds.updated) bounds.update();
						const scale = bounds.cardScale;
						const centerX = (bounds.width - bounds.cardWidth) / 2;
						const centerY = bounds.height * 0.45 - bounds.cardHeight / 2;
						const x = Math.round(centerX);
						const y = Math.round(centerY);
						const node = _status.event.guhuoNode = card.copy("thrown");
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
				for (const target of event.targets) {
					const links = await target
						.chooseButton([event.prompt, [["reguhuo_ally", "reguhuo_betray"], "vcard"]], true)
						.set("ai", function (button) {
							const player = _status.event.player;
							const evt = _status.event.getParent("guhuo_guess"),
								evtx = evt.getTrigger();
							if (!evt) {
								return Math.random();
							}
							const card = { name: evtx.card.name, nature: evtx.card.nature, isCard: true };
							const ally = button.link[2] == "reguhuo_ally";
							if (ally && (player.hp <= 1 || get.attitude(player, evt.player) >= 0)) {
								return 1.1;
							}
							if (!ally && get.attitude(player, evt.player) < 0 && evtx.name == "useCard") {
								let eff = 0;
								const targetsx = evtx.targets || [];
								for (const target of targetsx) {
									const isMe = target == evt.player;
									eff += get.effect(target, card, evt.player, player) / (isMe ? 1.5 : 1);
								}
								eff /= 1.5 * targetsx.length || 1;
								if (eff > 0) {
									return 0;
								}
								if (eff < -7) {
									return Math.random() + Math.pow(-(eff + 7) / 8, 2);
								}
								return Math.pow((get.value(card, evt.player, "raw") - 4) / (eff == 0 ? 5 : 10), 2);
							}
							return Math.random();
						})
						.forResultLinks();
					if (links[0][2] == "reguhuo_betray") {
						target.addExpose(0.2);
						game.log(target, "#y质疑");
						target.popup("质疑！", "fire");
						event.betrayer = target;
						break;
					} else {
						game.log(target, "#g不质疑");
						target.popup("不质疑", "wood");
					}
					await game.delayx();
				}
				game.broadcastAll(function (node) {
					const bounds = dui.boundsCaches.arena;
					if (!bounds.updated) bounds.update();
					const scale = bounds.cardScale;
					const centerX = (bounds.width - bounds.cardWidth) / 2;
					const centerY = bounds.height * 0.45 - bounds.cardHeight / 2;
					const x = Math.round(centerX);
					const y = Math.round(centerY);
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
	decadeUI.inheritSubSkill = {
		olziruo: {
			sort: {
				async content(event, trigger, player) {
					event.getParent(2).goto(0);
					if (_status.connectMode || !event.isMine()) {
						player.tempBanSkill("olziruo_sort", {
							player: ["useCard1", "useSkillBegin", "chooseToUseEnd"],
						});
					}
					const next = player.chooseToMove("自若：请整理手牌顺序", true);
					next.set("list", [["手牌", player.getCards("h")]]);
					next.set("processAI", list => {
						let player = get.player(),
							cards = list[0][1].slice(0);
						cards.sort((a, b) => get.useful(b, player) - get.useful(a, player));
						if (player.storage.olziruo) cards.reverse();
						return [cards];
					});
					const result = await next.forResult();
					if (!result?.bool) return;
					const hs = result.moved[0].reverse();
					hs.forEach(card => {
						player.node.handcards1.insertBefore(card, player.node.handcards1.firstChild);
					});
					dui.queueNextFrameTick(dui.layoutHand, dui);
				},
			},
		},
		jsrgzhasi: {
			undist: {
				init(player, skill) {
					if (player._distanceDisplay) {
						player._distanceDisplay.style.display = "none";
					}
				},
				onremove(player, skill) {
					if (player._distanceDisplay) {
						player._distanceDisplay.style.display = "";
					}
				},
			},
		},
	};
	if (lib.config["extension_十周年UI_shiliyouhua"]) {
		Object.defineProperty(lib, "group", {
			get: () => ["wei", "shu", "wu", "qun", "jin"],
			set: () => {},
		});
		decadeUI.skill._slyh = {
			trigger: { global: "gameStart", player: "enterGame" },
			forced: true,
			popup: false,
			silent: true,
			priority: Infinity,
			filter(_, player) {
				return get.mode() !== "guozhan" && player.group && !lib.group.includes(player.group);
			},
			async content() {
				const player = _status.event.player;
				const result = await player
					.chooseControl(lib.group.slice(0, 5))
					.set("ai", () => get.event().controls.randomGet())
					.set("prompt", "请选择你的势力")
					.forResult();
				if (result?.control) {
					player.group = result.control;
					player.node.name.dataset.nature = get.groupnature(result.control);
				}
			},
		};
	}
	if (!_status.connectMode) {
		for (const key of Object.keys(decadeUI.animateSkill)) {
			lib.skill[key] = decadeUI.animateSkill[key];
			game.addGlobalSkill(key);
		}
		Object.assign(lib.skill, decadeUI.skill);
		for (const key of Object.keys(decadeUI.inheritSkill)) {
			if (lib.skill[key]) {
				Object.assign(lib.skill[key], decadeUI.inheritSkill[key]);
			}
		}
		for (const key of Object.keys(decadeUI.inheritSubSkill)) {
			if (!lib.skill[key]?.subSkill) continue;
			for (const j of Object.keys(decadeUI.inheritSubSkill[key])) {
				if (!lib.skill[key].subSkill[j]) continue;
				Object.assign(lib.skill[key].subSkill[j], decadeUI.inheritSubSkill[key][j]);
			}
		}
		if (lib.config.extension_十周年UI_newDecadeStyle !== "off") {
			const recastableCards = ["tiesuo", "lulitongxin", "zhibi"];
			recastableCards.forEach(cardName => {
				const card = lib.card[cardName];
				if (!card || !card.recastable) return;
				const originalSelectTarget = card.selectTarget;
				const minTarget = Array.isArray(originalSelectTarget) ? originalSelectTarget[0] : originalSelectTarget || 1;
				const maxTarget = Array.isArray(originalSelectTarget) ? originalSelectTarget[1] : originalSelectTarget || 1;
				Object.assign(card, {
					selectTarget: [0, maxTarget],
					filterOk() {
						const player = _status.event.player;
						const cardObj = get.card();
						if (ui.selected.targets.length === 0) {
							return cardObj && player.canRecast(cardObj);
						}
						return ui.selected.targets.length >= minTarget;
					},
				});
			});
			if (lib.skill._recasting) {
				const originalFilterCard = lib.skill._recasting.filterCard;
				lib.skill._recasting.filterCard = function (card, player) {
					if (recastableCards.includes(get.name(card))) return false;
					return originalFilterCard.call(this, card, player);
				};
			}
			if (lib.hooks?.checkEnd) {
				lib.hooks.checkEnd.add("_decadeUI_recastable_confirm", (event, { ok }) => {
					if (!ui.confirm) return;
					const card = get.card();
					if (!card) return;
					const cardName = get.name(card);
					const okBtn = ui.confirm.firstChild;
					if (!okBtn || okBtn.link !== "ok") return;
					if (recastableCards.includes(cardName) && ui.selected.targets.length === 0) {
						okBtn.innerHTML = "重铸";
					} else if (okBtn.innerHTML === "重铸") {
						okBtn.innerHTML = "确定";
					}
				});
			}
			if (lib.hooks?.uncheckEnd) {
				lib.hooks.uncheckEnd.add("_decadeUI_recastable_confirm_reset", () => {
					if (!ui.confirm) return;
					const okBtn = ui.confirm.firstChild;
					if (okBtn && okBtn.innerHTML === "重铸") {
						okBtn.innerHTML = "确定";
					}
				});
			}
		}
	}
});
