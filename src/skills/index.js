/**
 * 十周年UI - 技能模块
 * 包含：动画技能、基础技能、继承技能、子技能
 */
import { lib, game, ui, get, ai, _status } from "noname";

// ==================== 常量 ====================
const RECASTABLE_CARDS = ["tiesuo", "lulitongxin", "zhibi"];

// ==================== 工具函数 ====================

/** 创建画布样式配置 */
const createCanvasStyle = () => ({
	position: "absolute",
	width: "249px",
	height: "249px",
	borderRadius: "6px",
	left: "calc(50% - 125px)",
	top: "calc(50% - 125px)",
	border: "3px solid",
});

/** 初始化画布 */
const initCanvas = (canvas, size = 249) => {
	canvas.width = size;
	canvas.height = size;
	Object.assign(canvas.style, createCanvasStyle());
	return canvas.getContext("2d");
};

/** 加载图片到画布 */
const loadImageToCanvas = (ctx, canvas, name) => {
	const img = new Image();
	img.src = `${lib.assetURL}image/card/${name}.png`;
	img.onload = () => ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
};

// ==================== 动画技能 ====================

const animateSkill = {
	/** 游戏开始动画 */
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

	/** 边框等级随机化 */
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

	/** 用牌开始时设置延迟标记 */
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

	/** 击杀特效 */
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

	/** 可重铸卡牌无目标时转为重铸 */
	_decadeUI_recastable_recast: {
		trigger: { player: "useCardBefore" },
		forced: true,
		popup: false,
		silent: true,
		filter(event, player) {
			if (lib.config.extension_十周年UI_newDecadeStyle === "off") return false;
			return RECASTABLE_CARDS.includes(get.name(event.card)) && (!event.targets || event.targets.length === 0);
		},
		async content(event, trigger, player) {
			trigger.cancel();
			const cards = trigger.cards?.slice() || [];
			if (cards.length > 0) await player.recast(cards);
		},
	},
};

// ==================== 基础技能 ====================

const baseSkill = {
	ghujia: { mark: false },

	/** 被禁用的可重铸卡牌仍可选中（用于重铸） */
	_decadeUI_recastable_enable: {
		mod: {
			cardEnabled(card, player) {
				if (!player?.isPhaseUsing?.()) return;
				if (!RECASTABLE_CARDS.includes(get.name(card))) return;
				if (player.canRecast(card)) return true;
			},
		},
	},

	/** 失去体力动画 */
	_hpLossAnimation: {
		trigger: { player: "loseHpBefore" },
		forced: true,
		popup: false,
		charlotte: true,
		filter(event) {
			return !!event.num;
		},
		async content(event, trigger, player) {
			if (window.dcdAnim?.playLoseHp) {
				window.dcdAnim.playLoseHp(player);
			}
		},
	},

	/** 回复数字显示 */
	_wjmh_huifushuzi_: {
		priority: 10,
		forced: true,
		trigger: { player: "recoverBegin" },
		filter(event) {
			return event.num > 0 && event.num <= 9 && lib.config.extension_十周年UI_newDecadeStyle !== "off";
		},
		async content(event, trigger, player) {
			decadeUI.animation?.playRecoverNumber?.(player, trigger.num);
		},
	},

	/** 虚拟伤害数字显示 */
	_wjmh_xunishuzi_: {
		priority: 10,
		forced: true,
		trigger: { player: "damage" },
		filter(event) {
			return event.num >= 0 && event.num <= 9 && event.unreal;
		},
		async content(event, trigger, player) {
			decadeUI.animation?.playVirtualDamageNumber?.(player, trigger.num);
		},
	},

	/** 伤害数字显示 */
	_wjmh_shanghaishuzi_: {
		priority: 210,
		forced: true,
		trigger: { player: "damageBegin4" },
		filter(event) {
			return event.num > 1 && event.num <= 9 && lib.config.extension_十周年UI_newDecadeStyle;
		},
		async content(event, trigger, player) {
			decadeUI.animation?.playDamageNumber?.(player, trigger.num);
		},
	},

	/** 用牌后清理 */
	_usecard: {
		trigger: { global: "useCardAfter" },
		forced: true,
		popup: false,
		silent: true,
		priority: -100,
		filter(event) {
			return ui.clear.delay === "usecard" && event.card.name !== "wuxie";
		},
		async content() {
			ui.clear.delay = false;
			game.broadcastAll(() => ui.clear());
		},
	},

	/** 弃牌清理 */
	_discard: {
		trigger: { global: ["discardAfter", "loseToDiscardpileAfter", "loseAsyncAfter"] },
		filter(event) {
			return !!ui.todiscard[event.discardid];
		},
		forced: true,
		silent: true,
		popup: false,
		priority: -100,
		async content(event, trigger) {
			game.broadcastAll(id => {
				if (window.decadeUI) {
					ui.todiscard = [];
					ui.clear();
					return;
				}
				const todiscard = ui.todiscard[id];
				delete ui.todiscard[id];
				if (!todiscard) return;

				let time = 1000;
				if (typeof todiscard._discardtime === "number") {
					time += todiscard._discardtime - get.time();
				}
				setTimeout(() => todiscard.forEach(card => card.delete()), Math.max(0, time));
			}, trigger.discardid);
		},
	},

	/** 旧版胆守 */
	olddanshou: {
		audio: "danshou",
		trigger: { source: "damageSource" },
		check(event, player) {
			return get.attitude(player, event.player) <= 0;
		},
		async content(event, trigger, player) {
			await player.draw();

			while (ui.ordering.childNodes.length) {
				ui.ordering.firstChild.discard();
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
		ai: { jueqing: true },
	},
};

// ==================== 继承技能 ====================

const inheritSkill = {
	/** 评才技能 - 擦拭宝物小游戏 */
	xinfu_pingcai: {
		contentx: [
			// 第一阶段：创建擦拭界面
			async (event, trigger, player) => {
				event.pingcai_delayed = true;
				const name = lib.skill.xinfu_pingcai_backup.takara;
				event.cardname = name;
				event.videoId = lib.status.videoId++;

				if (player.isUnderControl()) game.swapPlayerAuto(player);

				const switchToAuto = () => {
					game.pause();
					game.countChoose();
					event.timeout = setTimeout(() => {
						_status.imchoosing = false;
						event._result = { bool: true };
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

					const ctx2 = initCanvas(canvas2);
					loadImageToCanvas(ctx2, canvas2, name);

					if (canSkip) {
						const skip = () => {
							if (!event.pingcai_delayed) return;
							delete event.pingcai_delayed;
							clearTimeout(event.timeout);
							event._result = { bool: true };
							game.resume();
							canvas2.removeEventListener(lib.config.touchscreen ? "touchend" : "click", skip);
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
					dialog.classList.add("fixed", "scroll1", "scroll2", "fullwidth", "fullheight", "noupdate");
					dialog.videoId = id;

					event.switchToAuto = () => {
						event._result = { bool: _status.xinfu_pingcai_finished };
						game.resume();
						_status.imchoosing = false;
						_status.xinfu_pingcai_finished = true;
					};

					const canvas = document.createElement("canvas");
					const canvas2 = document.createElement("canvas");
					dialog.appendChild(canvas2);
					dialog.appendChild(canvas);

					const ctx = initCanvas(canvas);
					const ctx2 = initCanvas(canvas2);
					loadImageToCanvas(ctx2, canvas2, name);

					ctx.fillStyle = "lightgray";
					ctx.fillRect(0, 0, canvas.width, canvas.height);

					const checkCompletion = () => {
						const data = ctx.getImageData(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8).data;
						let cleared = 0;
						for (let i = 3; i < data.length; i += 4) {
							if (data[i] === 0) cleared++;
						}
						if (cleared >= canvas.width * canvas.height * 0.6 && !_status.xinfu_pingcai_finished) {
							_status.xinfu_pingcai_finished = true;
							event.switchToAuto();
						}
					};

					const erase = (x, y) => {
						if (_status.xinfu_pingcai_finished) return;
						ctx.beginPath();
						ctx.clearRect(x - 16, y - 16, 32, 32);
						checkCompletion();
					};

					canvas.onmousedown = () => {
						canvas.onmousemove = e => erase(e.offsetX / game.documentZoom, e.offsetY / game.documentZoom);
					};
					canvas.onmouseup = () => (canvas.onmousemove = null);

					canvas.ontouchstart = () => {
						canvas.ontouchmove = e => {
							const rect = canvas.getBoundingClientRect();
							const x = ((e.touches[0].clientX / game.documentZoom - rect.left) / rect.width) * canvas.width;
							const y = ((e.touches[0].clientY / game.documentZoom - rect.top) / rect.height) * canvas.height;
							erase(x, y);
						};
					};
					canvas.ontouchend = () => (canvas.ontouchmove = null);

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

			// 第二阶段：显示结果
			async (event, trigger, player) => {
				const result = event._result || event.result || { bool: false };
				event._result = result;

				game.broadcastAll(
					(id, result, player) => {
						_status.xinfu_pingcai_finished = true;
						const dialog = get.idDialog(id);
						if (dialog) {
							dialog.textPrompt.innerHTML = `<div class="text center">${get.translation(player)}擦拭宝物${result.bool ? "成功！" : "失败…"}</div>`;
							if (result.bool && dialog.canvas_viewer) {
								dialog.canvas_viewer.classList.remove("grayscale");
							}
						}
						if (!_status.connectMode) delete event.pingcai_delayed;
					},
					event.videoId,
					result,
					player
				);

				await game.delay(2.5);
			},

			// 第三阶段：执行效果
			async (event, trigger, player) => {
				game.broadcastAll("closeDialog", event.videoId);
				if (event._result?.bool) {
					player.logSkill(`pcaudio_${event.cardname}`);
					event.insert(lib.skill.xinfu_pingcai[event.cardname], { player });
				}
			},
		],
		ai: {
			order: 7,
			fireAttack: true,
			threaten: 1.7,
			result: { player: 1 },
		},
	},

	/** 恂恂（继承） */
	xz_xunxun: {
		inherit: "xunxun",
		filter(event, player) {
			return game.hasPlayer(current => current.isDamaged()) && !player.hasSkill("xunxun");
		},
	},

	/** 分野比较动画 */
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

	/** 齐心技能 - 角色切换 */
	dcqixin: {
		mark: undefined,
		init(player, skill) {
			if (_status.gameStarted && !player.storage.dcqixin_hp) {
				player.storage.dcqixin_hp = [player.maxHp, player.maxHp];
			}
			if (!player.marks[skill]) player.markSkill(skill);
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

			player.changeSkin({ characterName: "liuxiecaojie" }, `liuxiecaojie${player.storage[skill] ? "_shadow" : ""}`);
		},
	},

	/** 易城技能 */
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
					const player = get.event("player");
					const limit = Math.min(get.event("num"), player.countCards("h"));
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

			const newSum = cards.reduce((n, card) => n + get.number(card), 0);
			if (newSum <= sum || !player.countCards("h")) return;

			const {
				result: { bool: bool2 },
			} = await player.chooseBool(`易城：是否使用全部手牌交换${get.translation(cards)}？`).set("choice", cards.reduce((n, c) => n + get.value(c), 0) > player.getCards("h").reduce((n, c) => n + get.value(c), 0));

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

	/** 探锋技能 */
	twtanfeng: {
		async content(event, trigger, player) {
			const { result } = await player
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
				.setHiddenSkill("twtanfeng");

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

			const { result: cResult } = await target
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
				);

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

	/** 华南老仙 */
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

	/** 蛊惑技能 */
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

			game.broadcastAll(
				(card, player) => {
					const bounds = dui.boundsCaches.arena;
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

			for (const target of event.targets) {
				const links = await target
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
					.forResultLinks();

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

			game.broadcastAll(node => {
				const bounds = dui.boundsCaches.arena;
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

// ==================== 继承子技能 ====================

const inheritSubSkill = {
	/** 自若排序 */
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
					const player = get.player();
					const cards = list[0][1].slice();
					cards.sort((a, b) => get.useful(b, player) - get.useful(a, player));
					if (player.storage.olziruo) cards.reverse();
					return [cards];
				});

				const result = await next.forResult();
				if (!result?.bool) return;

				result.moved[0].reverse().forEach(card => {
					player.node.handcards1.insertBefore(card, player.node.handcards1.firstChild);
				});
				dui.queueNextFrameTick(dui.layoutHand, dui);
			},
		},
	},

	/** 诈死距离显示控制 */
	jsrgzhasi: {
		undist: {
			init(player) {
				if (player._distanceDisplay) {
					player._distanceDisplay.style.display = "none";
				}
			},
			onremove(player) {
				if (player._distanceDisplay) {
					player._distanceDisplay.style.display = "";
				}
			},
		},
	},
};

// ==================== 势力优化技能 ====================

const factionOptimizeSkill = {
	_slyh: {
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
	},
};

// ==================== 初始化入口 ====================

/** 初始化技能模块 */
export function initSkills() {
	if (_status.connectMode) return;

	// 挂载到decadeUI
	decadeUI.animateSkill = animateSkill;
	decadeUI.skill = baseSkill;
	decadeUI.inheritSkill = inheritSkill;
	decadeUI.inheritSubSkill = inheritSubSkill;

	// 注册动画技能
	for (const key of Object.keys(animateSkill)) {
		lib.skill[key] = animateSkill[key];
		game.addGlobalSkill(key);
	}

	// 注册基础技能
	Object.assign(lib.skill, baseSkill);

	// 注册可重铸卡牌启用检查为全局技能
	if (lib.config.extension_十周年UI_newDecadeStyle !== "off") {
		game.addGlobalSkill("_decadeUI_recastable_enable");
	}

	// 合并继承技能
	for (const key of Object.keys(inheritSkill)) {
		if (lib.skill[key]) {
			Object.assign(lib.skill[key], inheritSkill[key]);
		}
	}

	// 合并继承子技能
	for (const key of Object.keys(inheritSubSkill)) {
		if (!lib.skill[key]?.subSkill) continue;
		for (const j of Object.keys(inheritSubSkill[key])) {
			if (lib.skill[key].subSkill[j]) {
				Object.assign(lib.skill[key].subSkill[j], inheritSubSkill[key][j]);
			}
		}
	}

	// 势力优化
	if (lib.config["extension_十周年UI_shiliyouhua"]) {
		Object.defineProperty(lib, "group", {
			get: () => ["wei", "shu", "wu", "qun", "jin"],
			set: () => {},
		});
		lib.skill._slyh = factionOptimizeSkill._slyh;
	}

	// 处理可重铸卡牌
	if (lib.config.extension_十周年UI_newDecadeStyle !== "off") {
		setupRecastableCards();
	}
}

/** 检查卡牌是否被其他技能禁用 */
function isCardDisabledForUse(card, player) {
	if (!player) return false;

	// 临时移除重铸启用mod，检查原始cardEnabled状态
	const skill = lib.skill._decadeUI_recastable_enable;
	const originalMod = skill?.mod?.cardEnabled;
	if (skill?.mod) delete skill.mod.cardEnabled;

	let disabled = false;
	if (game.checkMod(card, player, _status.event, "unchanged", "cardEnabled", player) === false) {
		disabled = true;
	}
	if (!disabled && get.itemtype(card) === "card") {
		if (game.checkMod(card, player, _status.event, "unchanged", "cardEnabled2", player) === false) {
			disabled = true;
		}
	}

	// 恢复mod
	if (skill?.mod && originalMod) skill.mod.cardEnabled = originalMod;

	return disabled;
}

/** 设置可重铸卡牌 */
function setupRecastableCards() {
	RECASTABLE_CARDS.forEach(cardName => {
		const card = lib.card[cardName];
		if (!card?.recastable) return;

		const originalSelectTarget = card.selectTarget;
		const minTarget = Array.isArray(originalSelectTarget) ? originalSelectTarget[0] : originalSelectTarget || 1;
		const maxTarget = Array.isArray(originalSelectTarget) ? originalSelectTarget[1] : originalSelectTarget || 1;
		const originalFilterTarget = card.filterTarget;

		Object.assign(card, {
			selectTarget: [0, maxTarget],
			filterTarget(cardObj, player, target) {
				const selectedCard = ui.selected.cards?.[0];
				// 被禁用时只能重铸，不能选目标
				if (selectedCard && isCardDisabledForUse(selectedCard, player)) return false;
				return typeof originalFilterTarget === "function" ? originalFilterTarget(cardObj, player, target) : true;
			},
			filterOk() {
				const player = _status.event.player;
				const cardObj = get.card();
				if (ui.selected.targets.length === 0) return cardObj && player.canRecast(cardObj);
				return ui.selected.targets.length >= minTarget;
			},
		});
	});

	// 从通用重铸中排除这些卡牌
	if (lib.skill._recasting) {
		const originalFilterCard = lib.skill._recasting.filterCard;
		lib.skill._recasting.filterCard = function (card, player) {
			if (RECASTABLE_CARDS.includes(get.name(card))) return false;
			return originalFilterCard.call(this, card, player);
		};
	}

	// 确认按钮文字切换为"重铸"
	if (lib.hooks?.checkEnd) {
		lib.hooks.checkEnd.add("_decadeUI_recastable_confirm", () => {
			if (!ui.confirm) return;
			const card = get.card();
			if (!card) return;

			const okBtn = ui.confirm.firstChild;
			if (!okBtn || okBtn.link !== "ok") return;

			if (RECASTABLE_CARDS.includes(get.name(card)) && ui.selected.targets.length === 0) {
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
			if (okBtn?.innerHTML === "重铸") okBtn.innerHTML = "确定";
		});
	}
}
