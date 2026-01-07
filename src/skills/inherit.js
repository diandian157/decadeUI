/**
 * @fileoverview 继承技能模块
 * @description 用于扩展已有技能的覆写定义
 * @module skills/inherit
 */

import { lib, game, ui, get, _status } from "noname";
import { initCanvas, loadImageToCanvas } from "./utils.js";

/**
 * @type {Object.<string, Object>}
 * @description 继承技能集合，用于扩展已有技能
 */
export const inheritSkill = {
	/**
	 * 评才技能 - 擦拭宝物小游戏
	 * @description 通过擦拭画布来触发宝物效果
	 */
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

	/**
	 * 恂恂（继承）
	 * @description 继承恂恂技能，添加额外过滤条件
	 */
	xz_xunxun: {
		inherit: "xunxun",
		filter(event, player) {
			return game.hasPlayer(current => current.isDamaged()) && !player.hasSkill("xunxun");
		},
	},

	/**
	 * 分野比较动画
	 * @description 自定义分野技能的比较动画
	 */
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

	/**
	 * 齐心技能 - 角色切换
	 * @description 刘协曹节的角色切换动画
	 */
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
};
