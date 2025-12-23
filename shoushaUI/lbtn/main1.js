app.import((lib, game, ui, get, ai, _status, app) => {
	const LBTN_CONST = {
		guozhanIdentities: [
			{ key: "unknown", color: "#FFFFDE" },
			{ key: "wei", color: "#0075FF" },
			{ key: "shu", color: "#ff0000" },
			{ key: "wu", color: "#00ff00" },
			{ key: "qun", color: "#ffff00" },
			{ key: "jin", color: "#9e00ff" },
			{ key: "ye", color: "#9e00ff" },
			{ key: "key", color: "#9e00ff" },
		],
		identityColors: {
			zhu: "#ae5f35",
			zhong: "#e9d765",
			fan: "#87a671",
			nei: "#9581c4",
		},
	};
	function buildModeWinTranslations(mode, versusMode) {
		const baseIdentityMap = {
			rZhu: "击败冷方主公<br>与所有野心家",
			rZhong: "保护暖方主公<br>击败冷方主公<br>与所有野心家",
			rYe: "联合冷方野心家<br>击败其他角色",
			rNei: "协助冷方主公<br>击败暖方主公<br>与所有野心家",
			bZhu: "击败暖方主公<br>与所有野心家",
			bZhong: "保护冷方主公<br>击败暖方主公<br>与所有野心家",
			bYe: "联合暖方野心家<br>击败其他角色",
			bNei: "协助暖方主公<br>击败冷方主公<br>与所有野心家",
			zhu: "推测场上身份<br>击败反贼内奸",
			zhong: "保护主公<br>取得最后胜利",
			fan: "找出反贼队友<br>全力击败主公",
			nei: "找出反贼忠臣<br>最后击败主公",
			mingzhong: "保护主公<br>取得最后胜利",
			undefined: "胜利条件",
		};
		const handlers = {
			doudizhu: () => ({ zhu: "击败所有农民", fan: "击败地主", undefined: "未选择阵营" }),
			single: () => ({ zhu: "击败对手", fan: "击败对手", undefined: "未选择阵营" }),
			boss: () => ({ zhu: "击败盟军", cai: "击败神祇", undefined: "未选择阵营" }),
			guozhan: () => {
				const map = { undefined: "未选择势力", unknown: "保持隐蔽", ye: "   击败场上<br>所有其他角色", key: "   击败所有<br>非键势力角色" };
				for (let i = 0; i < lib.group.length; i++) {
					map[lib.group[i]] = `击败所有<br>非${get.translation(lib.group[i])}势力角色`;
				}
				return map;
			},
			versus: () => {
				const vmHandlers = {
					standard: () => null,
					two: () => ({ undefined: get.config("replace_character_two") ? "抢先击败敌人<br>所有上场角色" : "   协同队友<br>击败所有敌人" }),
					three: () => ({ undefined: get.config("replace_character_two") ? "抢先击败敌人<br>所有上场角色" : "   协同队友<br>击败所有敌人" }),
					jiange: () => ({ wei: "击败所有<br>蜀势力角色", shu: "击败所有<br>魏势力角色" }),
					siguo: () => {
						const map = {};
						for (let i = 0; i < lib.group.length; i++) {
							map[lib.group[i]] = `获得龙船或击败<br>非${get.translation(lib.group[i])}势力角色`;
						}
						return map;
					},
				};
				const run = vmHandlers[versusMode];
				return run ? run() : {};
			},
		};
		return (handlers[mode] && handlers[mode]()) || baseIdentityMap;
	}
	game.ui_identityShow_update = () => {
		const identityShow = game.ui_identityShow; /*图层1*/
		const identityShowx = game.ui_identityShowx; /*图层2 在图层1下面*/
		let str = "";
		if (lib.config.mode === "guozhan" || (lib.config.mode === "versus" && get.config("versus_mode") === "siguo") || (lib.config.mode === "versus" && get.config("versus_mode") === "jiange")) {
			LBTN_CONST.guozhanIdentities.forEach(({ key, color }) => {
				const count = game.countPlayer(current => current.identity === key);
				if (count > 0) str += `<font color="${color}">${get.translation(key)}</font> x ${count}  `;
			});
		} else if (lib.config.mode === "versus" && get.config("versus_mode") === "two") {
			const enemy = game.countPlayer(current => current.isEnemyOf(game.me));
			const friend = game.countPlayer(current => current.isFriendOf(game.me));
			if (enemy > 0) str += `<font color="#ff0000">虎</font> x ${enemy}  `;
			if (friend > 0) str += `<font color="#00ff00">龙</font> x ${friend}  `;
		} else {
			const zhu = game.countPlayer(current => current.identity === "zhu" || current.identity === "rZhu" || current.identity === "bZhu");
			const zhong = game.countPlayer(current => current.identity === "zhong" || current.identity === "rZhong" || current.identity === "bZhong" || current.identity === "mingzhong");
			const fan = game.countPlayer(current => current.identity === "fan" || current.identity === "rYe" || current.identity === "bYe");
			const nei = game.countPlayer(current => current.identity === "nei" || current.identity === "rNei" || current.identity === "bNei");
			if (zhu > 0) str += `<font color="${LBTN_CONST.identityColors.zhu}">${get.translation("zhu")}</font> x ${zhu}  `;
			if (zhong > 0) str += `<font color="${LBTN_CONST.identityColors.zhong}">${get.translation("zhong")}</font> x ${zhong}  `;
			if (fan > 0) str += `<font color="${LBTN_CONST.identityColors.fan}">${get.translation("fan")}</font> x ${fan}  `;
			if (nei > 0) str += `<font color="${LBTN_CONST.identityColors.nei}">${get.translation("nei")}</font> x ${nei}`;
		}
		str += `<br>${game.me?.identity ? (lib.translate[game.me.identity + "_win_option"] ?? "") : ""}`;
		/*尽量保持字体大小，行高一致，不然会产生偏移*/
		identityShow.innerHTML = `<span style="font-family:shousha; font-size: 17.0px;font-weight:500;text-align: right; line-height: 20px; color: #C1AD92;text-shadow:none;">${str}</span>`; /*图层1*/
		identityShowx.innerHTML = `<span style="font-family:shousha; font-size: 17.0px;font-weight:500;text-align: right; line-height: 20px; color: #2D241B; -webkit-text-stroke: 2.7px #322B20;text-shadow:none;">${str}</span>`; /*图层2*/
	};
	game.ui_identityShow_init = () => {
		if (game.ui_identityShow === undefined) {
			game.ui_identityShow = ui.create.div("", "身份加载中......");
			game.ui_identityShow.style.top = "1.9px"; /*图层1 上下位置如果需要改动 两个图层都要改*/
			game.ui_identityShow.style.left = "63.5px"; /*图层2 左右位置如果需要改动 两个图层都要改*/
			game.ui_identityShow.style["z-index"] = 4;
			ui.arena.appendChild(game.ui_identityShow);
		}
		if (game.ui_identityShowx === undefined) {
			game.ui_identityShowx = ui.create.div("", "身份加载中......");
			game.ui_identityShowx.style.top = "1.9px"; /*图层2*/
			game.ui_identityShowx.style.left = "63.5px"; /*图层2*/
			game.ui_identityShowx.style["z-index"] = 3;
			ui.arena.appendChild(game.ui_identityShowx);
		}
	};
	lib.arenaReady.push(() => {
		//更新轮次
		const originUpdateRoundNumber = game.updateRoundNumber;
		game.updateRoundNumber = function () {
			originUpdateRoundNumber.apply(this, arguments);
			if (ui.cardRoundTime) ui.cardRoundTime.updateRoundCard();
		};
		/*聊天按钮模块*/
		if (lib.config.extension_十周年UI_LTAN === false) {
			const liaotian = ui.create.node("img");
			liaotian.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/liaotian.png";
			if (lib.config["extension_十周年UI_rightLayout"] === "on") {
				liaotian.style.cssText = "display: block;--w: 135px;--h: calc(var(--w) * 1019/1400);width: var(--w);height: var(--h);position: absolute;top: calc(100% - 97px);right: calc(100% - 129px);background-color: transparent;z-index:3";
			} else {
				//左手模式聊天按钮参数
				liaotian.style.cssText = "display: block; --w: 135px; --h: calc(var(--w) * 1019/1400); width: var(--w); height: var(--h); position: absolute; top: calc(100% - 97px); left: calc(100% - 129px); background-color: transparent; z-index: 3; transform: scaleX(-1);";
			}
			liaotian.onclick = () => {
				if (lib.config["extension_说话_enable"]) {
					game.showChatWordBackground();
				} else {
					game.showChatWordBackgroundX();
				}
			};
			document.body.appendChild(liaotian);
		}
		/*---------------------*/
		if (lib.config.mode === "identity" || lib.config.mode === "guozhan" || lib.config.mode === "versus" || lib.config.mode === "single" || lib.config.mode === "boss" || lib.config.mode === "doudizhu") {
			const map = buildModeWinTranslations(lib.config.mode, get.config("versus_mode"));
			if (map === null) return;
			for (const i in map) {
				lib.translate[`${i}_win_option`] = map[i];
			}
			game.ui_identityShow_init();
			setInterval(() => {
				game.ui_identityShow_update();
			}, 1000);
		}
		//右上角菜单栏
		const headImg = ui.create.node("img");
		headImg.src = `${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/SSCD/button.png`;
		headImg.style.cssText = "display: block;--w: 130px;--h: calc(var(--w) * 1080/1434);width: var(--w);height: var(--h);position: absolute;bottom: calc(100% - 98px);left: calc(100% - 126.2px);background-color: transparent;z-index:1";
		document.body.appendChild(headImg);
		const head = ui.create.node("div");
		head.style.cssText = "display: block;width: 134px;height: 103px;position: absolute;top: 0px;right: -8px;background-color: transparent;z-index:1";
		head.onclick = () => {
			game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
			const popuperContainer = ui.create.div(".popup-container", { background: "rgb(0,0,0,0)" }, ui.window);
			popuperContainer.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
				event.stopPropagation();
				popuperContainer.delete(200);
			});
			const yemian = ui.create.div(".yemian", popuperContainer);
			const shezhi = ui.create.div(".shezhi", popuperContainer);
			shezhi.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				if (!ui.click.configMenu) return;
				game.closePopped();
				game.pause2();
				ui.click.configMenu();
				ui.system1.classList.remove("shown");
				ui.system2.classList.remove("shown");
			});
			const tuichu = ui.create.div(".tuichu", popuperContainer);
			tuichu.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				window.location.reload();
			});
			const taopao = ui.create.div(".taopao", popuperContainer);
			taopao.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				game.reload();
			});
			const touxiang = ui.create.div(".touxiang", popuperContainer);
			touxiang.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				game.over();
			});
			const tuoguan = ui.create.div(".tuoguan", popuperContainer);
			tuoguan.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				ui.click.auto();
			});
		};
		document.body.appendChild(head);
		if (lib.config.mode === "identity" || lib.config.mode === "doudizhu" || lib.config.mode === "versus" || lib.config.mode === "guozhan") {
			/*左上角问号框*/
			const tipshow = ui.create.node("img");
			tipshow.src = `${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/shenfen.png`;
			tipshow.style.cssText = "display: block;--w: 400px;--h: calc(var(--w) * 279/2139);width: var(--w);height: var(--h);position: absolute;top: -1px;left:-45px;background-color: transparent;z-index:1";
			tipshow.onclick = () => {
				const popuperContainer = ui.create.div(".popup-container", ui.window);
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
				const modeHandlers = {
					identity: () => {
						const idMap = { zhu: ".sfrwzhugong", zhong: ".sfrwchongchen", fan: ".sfrwfanzei", nei: ".sfrwneijian" };
						const cls = idMap[game.me.identity];
						if (cls) ui.create.div(cls, popuperContainer);
					},
					doudizhu: () => {
						const idMap = { zhu: ".sfrwdizhu", fan: ".sfrwnongmin" };
						const cls = idMap[game.me.identity];
						if (cls) ui.create.div(cls, popuperContainer);
					},
					versus: () => ui.create.div(".sfrwhu", popuperContainer),
					guozhan: () => {
						const groupMap = {
							unknown: ".sfrwundefined",
							undefined: ".sfrwundefined",
							wei: ".sfrwweiguo",
							shu: ".sfrwshuguo",
							wu: ".sfrwwuguo",
							qun: ".sfrwqunxiong",
							jin: ".sfrwjinguo",
							ye: ".sfrwyexinjia",
						};
						const cls = groupMap[game.me.group] || ".sfrwundefined";
						ui.create.div(cls, popuperContainer);
					},
				};
				const handler = modeHandlers[lib.config.mode];
				if (handler) handler();
				popuperContainer.addEventListener("click", event => {
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
					popuperContainer.delete(200);
				});
			};
			document.body.appendChild(tipshow);
		}
	});
	const plugin = {
		name: "lbtn",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {
			lib.skill._uicardupdate = {
				trigger: { player: "phaseJieshuBegin" },
				forced: true,
				unique: true,
				popup: false,
				silent: true,
				noLose: true,
				noGain: true,
				noDeprive: true,
				priority: -Infinity,
				filter(event, player) {
					return !!player;
				},
				async content(event, trigger, player) {
					const me = player || (_status.event && _status.event.player) || game.me;
					if (ui.updateSkillControl) ui.updateSkillControl(me, true);
				},
			};
		},
		precontent() {
			(function initPrecontentChat() {
				if (!window.chatRecord) window.chatRecord = [];

				const MAX_CHAT_RECORDS = 50;
				const DIALOG_HIDE_DELAY = 1000;
				const DIALOG_LIFESAY_HIDE_DELAY = 100;
				const DIALOG_ANIMATION_DELAY = 100;
				const EMOTION_SIZE = lib.config.extension_星之梦_emotionsize || 50;
				const XUWU_COUNT = 10;
				const XUWU_DELAY = 100;
				const THROW_ITEM_NAMES = ["jidan", "tuoxie", "xianhua", "meijiu", "cailan", "qicai", "xiaojiu", "xueqiu", "xuwu"];

				const getCurrentPlayer = () => {
					if (game.me) return game.me;
					if (game.connectPlayers) {
						return game.online ? game.connectPlayers.find(p => p.playerid === game.onlineID) : game.connectPlayers[0];
					}
					return null;
				};

				const sendChatMessage = message => {
					const player = getCurrentPlayer();
					if (!player) return;
					if (game.online) {
						game.send("chat", game.onlineID, message);
					} else {
						player.chat(message);
					}
				};

				const throwEmotion = (target, emotionType) => {
					if (game.online) {
						game.send("throwEmotion", target, emotionType);
					} else {
						game.me.throwEmotion(target, emotionType);
					}
					if (window.shuliang) {
						window.shuliang.innerText = parseInt(window.shuliang.innerText) - 1;
					}
				};

				const hideDialog = (dialog, styleProp, styleValue, delay = DIALOG_HIDE_DELAY) => {
					if (!dialog?.show) return;
					dialog.style[styleProp] = styleValue;
					setTimeout(() => {
						dialog.hide();
						dialog.show = false;
					}, delay);
				};

				const hideOtherDialogs = (excludeDialog, dialogConfigs) => {
					dialogConfigs.forEach(({ name, prop, value, delay }) => {
						if (name !== excludeDialog && window[name]) {
							hideDialog(window[name], prop, value, delay);
						}
					});
				};

				const createDialogBase = (name, config) => {
					const dialog = ui.create.div("hidden");
					dialog.classList.add("popped", "static");
					dialog.show = true;
					Object.assign(dialog.style, config.styles);
					if (config.backgroundImage) {
						dialog.setBackgroundImage(config.backgroundImage);
					}
					if (config.zIndex) {
						dialog.style.zIndex = config.zIndex;
					}
					if (config.boxShadow !== undefined) {
						dialog.style.boxShadow = config.boxShadow;
					}
					if (config.animation) {
						setTimeout(() => {
							Object.assign(dialog.style, config.animation);
						}, DIALOG_ANIMATION_DELAY);
					}
					ui.window.appendChild(dialog);
					return dialog;
				};

				const createDialogBackground = (parent, config) => {
					const bgPict = ui.create.div("hidden");
					Object.assign(bgPict.style, config.pictStyles);
					bgPict.setBackgroundImage(config.pictImage);
					if (config.pictBoxShadow !== undefined) {
						bgPict.style.boxShadow = config.pictBoxShadow;
					}
					parent.appendChild(bgPict);

					const bgColor = ui.create.div("hidden");
					Object.assign(bgColor.style, config.colorStyles);
					bgColor.setBackgroundImage(config.colorImage);
					lib.setScroll(bgColor);
					parent.appendChild(bgColor);

					return { bgPict, bgColor };
				};

				const clickFK = div => {
					div.style.transition = "opacity 0.5s";
					const eventType = lib.config.touchscreen ? "touchstart" : "mousedown";
					const endEventType = lib.config.touchscreen ? "touchend" : "mouseup";

					div.addEventListener(eventType, () => {
						div.style.transform = "scale(0.95)";
					});

					div.addEventListener(endEventType, () => {
						div.style.transform = "";
					});

					div.onmouseout = () => {
						div.style.transform = "";
					};
				};

				const processAudioPath = path => {
					const target = "ext:";
					const isMatch = path.startsWith(target);
					const actualPath = isMatch ? `../extension/${path.slice(target.length)}` : path;
					const pathParts = actualPath.split("/");
					const directory = pathParts[pathParts.length - 2];
					const filename = pathParts[pathParts.length - 1].split(".")[0];
					return { directory, filename };
				};

				const createVoiceItem = (container, index, content, audioPath, onClick) => {
					const item = ui.create.div("hidden", "", onClick);
					item.style.cssText = "height: 10%; width: 100%; left: 0%; top: 0%; position: relative;";
					item.pos = index;
					item.content = content;
					if (audioPath) {
						item.audioPath = audioPath;
					}
					item.innerHTML = `<font color=white>${content}</font>`;
					container.appendChild(item);
					clickFK(item);
					return item;
				};

				const closeLifesayDialog = () => {
					if (window.dialog_lifesay) {
						window.dialog_lifesay.delete();
						delete window.dialog_lifesay;
						window.dialog_lifesay = undefined;
					}
				};

				const closeEmojiDialog = () => {
					if (window.dialog_emoji) {
						window.dialog_emoji.delete();
						delete window.dialog_emoji;
						window.dialog_emoji = undefined;
					}
				};

				game.addChatWord = strx => {
					if (window.chatRecord.length > MAX_CHAT_RECORDS) {
						window.chatRecord.shift();
					}
					if (strx) {
						window.chatRecord.push(strx);
					}
					const str = window.chatRecord.map(record => `<br>${record}<br>`).join("");
					if (window.chatBackground2) {
						game.updateChatWord(str);
					}
				};

				game.updateChatWord = str => {
					if (window.chatBackground2) {
						window.chatBackground2.innerHTML = str;
					}
				};

				game.showChatWordBackgroundX = () => {
					if (window.chatBg?.show) {
						window.chatBg.hide();
						THROW_ITEM_NAMES.forEach(item => {
							if (window[item]?.thrownn) {
								window[item].thrownn = false;
							}
						});
						window.chatBg.show = false;

						const dialogConfigs = [
							{ name: "dialog_lifesay", prop: "left", value: `-${window.dialog_lifesay?.style.width}`, delay: DIALOG_LIFESAY_HIDE_DELAY },
							{ name: "dialog_emoji", prop: "top", value: "100%", delay: DIALOG_HIDE_DELAY },
							{ name: "chatBackground", prop: "left", value: "100%", delay: DIALOG_HIDE_DELAY },
							{ name: "dialog_emotion", prop: "bottom", value: "100%", delay: DIALOG_HIDE_DELAY },
						];

						dialogConfigs.forEach(({ name, prop, value, delay }) => {
							hideDialog(window[name], prop, value, delay);
						});
						return;
					}

					window.chatBg = ui.create.div("hidden");
					window.chatBg.classList.add("popped", "static");
					window.chatBg.show = true;
					window.chatBg.style.cssText = "display: block;--w: 450px;--h: calc(var(--w) * 300/900);width: var(--w);height: var(--h);position: fixed;left:30%;bottom:10%;opacity: 1;background-size: 100% 100%;background-color: transparent;z-index:99;";
					window.chatBg.style.transition = "all 0.5s";
					window.chatBg.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/chat.png");
					ui.window.appendChild(window.chatBg);

					game.open_hudong = () => {
						if (window.dialog_hudong?.show) {
							window.dialog_hudong.hide();
							window.dialog_hudong.show = false;
						}
					};

					window.hudongkuang = ui.create.div("hidden", "", game.open_hudong);
					window.hudongkuang.style.cssText = "display: block;--w: 315px;--h: calc(var(--w) * 135/142);width: var(--w);height: var(--h);left:-280px;bottom:-55px;transition:none;background-size:100% 100%;pointer-events:none;";
					window.hudongkuang.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/hudong.png");
					window.chatBg.appendChild(window.hudongkuang);

					game.open_lifesay = () => {
						const dialogConfigs = [
							{ name: "dialog_emoji", prop: "top", value: "100%" },
							{ name: "chatBackground", prop: "left", value: "100%" },
							{ name: "dialog_emotion", prop: "bottom", value: "100%" },
						];
						hideOtherDialogs("dialog_lifesay", dialogConfigs);

						if (window.dialog_lifesay?.show) {
							window.dialog_lifesay.hide();
							window.dialog_lifesay.show = false;
							return;
						}

						window.dialog_lifesay = createDialogBase("dialog_lifesay", {
							styles: {
								height: "300px",
								width: "600px",
								left: "-600px",
								top: "calc(20% - 100px)",
								transition: "all 1s",
								opacity: "1",
								borderRadius: "8px",
								backgroundSize: "100% 100%",
							},
							backgroundImage: "extension/十周年UI/shoushaUI/sayplay/nobg.png",
							zIndex: 999999999,
							boxShadow: "none",
							animation: { left: "calc(50% - 300px)" },
						});

						const { bgColor } = createDialogBackground(window.dialog_lifesay, {
							pictStyles: {
								height: "100%",
								width: "100%",
								left: "0%",
								top: "0%",
								borderRadius: "8px",
								backgroundSize: "100% 100%",
							},
							pictImage: "extension/十周年UI/shoushaUI/sayplay/saydiv.png",
							pictBoxShadow: "none",
							colorStyles: {
								height: "70%",
								width: "80%",
								left: "10%",
								top: "10%",
								borderRadius: "8px",
								overflowY: "scroll",
							},
							colorImage: "extension/十周年UI/shoushaUI/sayplay/nobg.png",
						});

						let skills = [];
						if (game.me?.getSkills) {
							skills = game.me.getSkills(null, false, false).filter(skill => {
								const info = get.info(skill);
								return !info || !info.charlotte;
							});
						}

						let skillsx = [...skills];
						skills.forEach(skill => {
							const info = get.info(skill);
							if (info?.derivation) {
								const derivations = Array.isArray(info.derivation) ? info.derivation : [info.derivation];
								skillsx.push(...derivations);
							}
						});
						skillsx = [...new Set(skillsx)];

						let skillIndex = 0;

						skillsx.forEach(name => {
							if (!get.info(name)) return;
							const skillAudioData = get.Audio.skill({ skill: name, player: game.me.name });
							const { textList, fileList: audioList } = skillAudioData;
							textList.forEach((text, i) => {
								const content = `「${get.skillTranslation(name)}」${text.replace(/~/g, " ")}`;
								const onClick = function () {
									const player = getCurrentPlayer();
									if (!player) return;
									const { directory, filename } = processAudioPath(this.audioPath);
									const combinedMessage = `/playAudio ${directory} ${filename} ${this.content}`;
									sendChatMessage(combinedMessage);
									closeLifesayDialog();
								};
								createVoiceItem(bgColor, skillIndex, content, audioList[i], onClick);
								skillIndex++;
							});
						});

						if (game.me?.name) {
							const dieAudioData = get.Audio.die({ player: game.me.name });
							const { textList: dieTextList, fileList: dieAudioList } = dieAudioData;
							dieTextList.forEach((text, i) => {
								const content = `「阵亡」${text.replace(/~/g, " ")}`;
								const onClick = function () {
									const player = getCurrentPlayer();
									if (!player) return;
									const { directory, filename } = processAudioPath(this.audioPath);
									const combinedMessage = `/playAudio ${directory} ${filename} ${this.content}`;
									sendChatMessage(combinedMessage);
									closeLifesayDialog();
								};
								createVoiceItem(bgColor, skillIndex, content, dieAudioList[i], onClick);
								skillIndex++;
							});
						}

						lib.quickVoice?.forEach((voice, i) => {
							const onClick = function () {
								sendChatMessage(this.content);
								closeLifesayDialog();
							};
							createVoiceItem(bgColor, skillIndex + i, voice, null, onClick);
						});
					};

					window.chatButton1 = ui.create.div("hidden", "", game.open_lifesay);
					window.chatButton1.style.cssText = "display: block;--w: 75px;--h: calc(var(--w) * 82/98);width: var(--w);height: var(--h);left:30px;bottom:15px;transition:none;background-size:100% 100%";
					window.chatButton1.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/lifesay.png");
					lib.setScroll(window.chatButton1);
					window.chatBg.appendChild(window.chatButton1);
					clickFK(window.chatButton1);

					const createThrowItem = (name, config) => {
						const { left, bottom, image, label, emotionType } = config;
						game[`open_${name}`] = () => {
							game.players.forEach(player => {
								player.onclick = function () {
									if (window[name].thrownn) {
										throwEmotion(this, emotionType);
									}
								};
							});
						};

						window[name] = ui.create.div("hidden", "", game[`open_${name}`]);
						window[name].style.cssText = `display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:${left};bottom:${bottom};transition:none;background-size:100% 100%`;
						window[name].setBackgroundImage(`extension/十周年UI/shoushaUI/sayplay/${image}.png`);

						const labelDiv = document.createElement("div");
						labelDiv.textContent = label;
						labelDiv.style.cssText = `position: absolute;bottom: 1px; left: 0;right: 0;text-align: center; color:rgba(255, 220, 0, 0.7); font-size: 12px; font-family: "shousha";`;
						window[name].appendChild(labelDiv);

						window[name].onclick = () => {
							window[name].thrownn = true;
						};

						window.chatBg.appendChild(window[name]);
						lib.setScroll(window[name]);
						clickFK(window[name]);
					};

					const throwItems = [
						{ name: "meijiu", left: "-155px", bottom: "150px", image: "meijiu", label: "酒杯", emotionType: "wine" },
						{ name: "xianhua", left: "-230px", bottom: "150px", image: "xianhua", label: "鲜花", emotionType: "flower" },
						{ name: "tuoxie", left: "-155px", bottom: "82px", image: "tuoxie", label: "拖鞋", emotionType: "shoe" },
						{ name: "jidan", left: "-230px", bottom: "82px", image: "jidan", label: "鸡蛋", emotionType: "egg" },
						{ name: "cailan", left: "-80px", bottom: "150px", image: "cailan", label: "荷花", emotionType: "flower" },
						{ name: "qicai", left: "-155px", bottom: "13px", image: "qicai", label: "烟花", emotionType: "flower" },
						{ name: "xiaojiu", left: "-230px", bottom: "13px", image: "xiaojiu", label: "灯笼", emotionType: "wine" },
						{ name: "xueqiu", left: "-80px", bottom: "82px", image: "xueqiu", label: "雪球", emotionType: "wine" },
					];
					throwItems.forEach(item => createThrowItem(item.name, item));

					game.open_xuwu = () => {
						game.players.forEach(player => {
							player.onclick = function () {
								if (window.xuwu.thrownn) {
									for (let i = 0; i < XUWU_COUNT; i++) {
										setTimeout(() => {
											const emotionType = i <= 8 ? "egg" : "shoe";
											throwEmotion(this, emotionType);
										}, XUWU_DELAY * i);
									}
								}
							};
						});
					};

					window.xuwu = ui.create.div("hidden", "", game.open_xuwu);
					window.xuwu.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-80px;bottom:13px;transition:none;background-size:100% 100%";
					window.xuwu.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/xuwu.png");
					const xuwuLabel = document.createElement("div");
					xuwuLabel.textContent = "鸡蛋风暴";
					xuwuLabel.style.cssText = "position: absolute;bottom: 1px; left: 0;right: 0;text-align: center; color:rgba(255, 220, 0, 0.7); font-size: 12px; font-family: 'shousha';";
					window.xuwu.appendChild(xuwuLabel);
					window.xuwu.onclick = () => {
						window.xuwu.thrownn = true;
					};
					window.chatBg.appendChild(window.xuwu);
					lib.setScroll(window.xuwu);
					clickFK(window.xuwu);

					window.cailanzi = ui.create.div("hidden", "");
					window.cailanzi.style.cssText = "display: block;--w: 100px;--h: calc(var(--w) * 59/150);width: var(--w);height: var(--h);left:-230px;bottom:225px;transition:none;background-size:100% 100%";
					window.cailanzi.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/cailanzi.png");
					window.chatBg.appendChild(window.cailanzi);

					window.shuliang = ui.create.node("div");
					window.shuliang.innerText = Math.floor(Math.random() * (999 - 100 + 1) + 100);
					window.shuliang.style.cssText = "display: block;left:-180px;bottom:235px;font-family:'shousha';color:#97856a;font-weight: 900; text-shadow:none;transition:none;background-size:100% 100%";
					window.chatBg.appendChild(window.shuliang);

					game.open_emoji = () => {
						const dialogConfigs = [
							{ name: "dialog_lifesay", prop: "left", value: `-${window.dialog_lifesay?.style.width}` },
							{ name: "chatBackground", prop: "left", value: "100%" },
							{ name: "dialog_emotion", prop: "bottom", value: "100%" },
						];
						hideOtherDialogs("dialog_emoji", dialogConfigs);

						if (window.dialog_emoji?.show) {
							window.dialog_emoji.hide();
							window.dialog_emoji.show = false;
							return;
						}

						window.dialog_emoji = createDialogBase("dialog_emoji", {
							styles: {
								height: "330px",
								width: "600px",
								left: "calc(50% - 300px)",
								top: "100%",
								transition: "all 1s",
								opacity: "1",
								borderRadius: "8px",
								backgroundSize: "100% 100%",
							},
							backgroundImage: "extension/十周年UI/shoushaUI/sayplay/nobg.png",
							zIndex: 999999999,
							boxShadow: "none",
							animation: { top: "calc(25% - 125px)" },
						});

						const { bgColor } = createDialogBackground(window.dialog_emoji, {
							pictStyles: {
								height: "100%",
								width: "100%",
								left: "0%",
								top: "0%",
								borderRadius: "8px",
								backgroundSize: "100% 100%",
							},
							pictImage: "extension/十周年UI/shoushaUI/sayplay/saydiv.png",
							pictBoxShadow: "none",
							colorStyles: {
								height: "70%",
								width: "80%",
								left: "10%",
								top: "10%",
								borderRadius: "8px",
								overflowY: "scroll",
							},
							colorImage: "extension/十周年UI/shoushaUI/sayplay/nobg.png",
						});

						let emotionIndex = 0;

						Object.keys(lib.emotionList || {}).forEach(pack => {
							const packDiv = ui.create.div("hidden", "", function () {
								Object.keys(lib.emotionList || {}).forEach(p => {
									if (window[`dialog_emojiPack_${p}`]) {
										window[`dialog_emojiPack_${p}`].style.display = "none";
									}
								});
								for (let i = 0; i < emotionIndex; i++) {
									const content = window[`dialog_emojiContent_${i}`];
									if (content?.packName === this.packName) {
										content.style.display = "";
									} else {
										content.style.display = "none";
									}
								}
							});

							packDiv.style.cssText = "height: 70px; width: 70px; margin: 0 5px 5px 0; display: inline-block; left: 15px; top: 0px; position: relative; background-size: 100% 100%;";
							packDiv.packName = pack;
							packDiv.setBackgroundImage(`image/emotion/${pack}/1.gif`);
							window[`dialog_emojiPack_${pack}`] = packDiv;
							bgColor.appendChild(packDiv);
							clickFK(packDiv);
						});

						Object.keys(lib.emotionList || {}).forEach(pack => {
							const count = lib.emotionList[pack];
							for (let i = 1; i <= count; i++) {
								const emotionDiv = ui.create.div("hidden", "", function () {
									Object.keys(lib.emotionList || {}).forEach(p => {
										if (window[`dialog_emojiPack_${p}`]) {
											window[`dialog_emojiPack_${p}`].style.display = "";
										}
									});
									for (let j = 0; j < emotionIndex; j++) {
										if (window[`dialog_emojiContent_${j}`]) {
											window[`dialog_emojiContent_${j}`].style.display = "none";
										}
									}
									const player = getCurrentPlayer();
									if (!player) return;
									const str = `<img src="${lib.assetURL}image/emotion/${this.packName}/${this.emotionNum}.gif" width="${parseInt(EMOTION_SIZE)}" height="${parseInt(EMOTION_SIZE)}">`;
									sendChatMessage(str);
									closeEmojiDialog();
								});

								emotionDiv.style.cssText = "height: 70px; width: 70px; margin: 0 5px 5px 0; display: inline-block; left: 15px; top: 0px; position: relative; background-size: 100% 100%; display: none;";
								emotionDiv.packName = pack;
								emotionDiv.emotionNum = i;
								emotionDiv.setBackgroundImage(`image/emotion/${pack}/${i}.gif`);
								window[`dialog_emojiContent_${emotionIndex}`] = emotionDiv;
								bgColor.appendChild(emotionDiv);
								clickFK(emotionDiv);
								emotionIndex++;
							}
						});
					};

					window.chatButton2 = ui.create.div("hidden", "", game.open_emoji);
					window.chatButton2.style.cssText = "display: block;--w: 75px;--h: calc(var(--w) * 82/98);width: var(--w);height: var(--h);left:120px;bottom:15px;transition:none;background-size:100% 100%";
					window.chatButton2.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/emoji.png");
					lib.setScroll(window.chatButton2);
					window.chatBg.appendChild(window.chatButton2);
					clickFK(window.chatButton2);

					game.open_jilu = () => {
						game.showChatWord();
					};

					window.chatButton3 = ui.create.div("hidden", "", game.open_jilu);
					window.chatButton3.style.cssText = "display: block;--w: 75px;--h: calc(var(--w) * 82/98);width: var(--w);height: var(--h);left:210px;bottom:15px;transition:none;background-size:100% 100%";
					window.chatButton3.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/jilu.png");
					lib.setScroll(window.chatButton3);
					window.chatBg.appendChild(window.chatButton3);
					clickFK(window.chatButton3);

					window.chatSendBottom = ui.create.div("", "", () => {
						if (!window.input?.value) return;
						window.sendInfo(window.input.value);
					});
					window.chatSendBottom.style.cssText = "display: block;--w: 100px;--h: calc(var(--w) * 62/160);width: var(--w);height: var(--h);left:72%;top:16%;transition:none;background-size:100% 100%;text-align:center;border-randius:8px;";
					window.chatSendBottom.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/buttonsend.png");
					window.chatSendBottom.innerHTML = '<span style="color:#e6e6e6;font-size:23px;line-height:38px;font-weight:400;font-family:shousha">发送</span>';
					window.chatBg.appendChild(window.chatSendBottom);
					clickFK(window.chatSendBottom);

					game.addChatWord();

					window.sendInfo = content => {
						sendChatMessage(content);
						if (window.input) {
							window.input.value = "";
						}
					};

					window.chatInputOut = ui.create.div("hidden");
					window.chatInputOut.style.cssText = "display: block;--w: 275px;--h: calc(var(--w) * 50/320);width: var(--w);height: var(--h);left:8%;top:14%;transition:none;background-size:100% 100%;pointer-events:none;z-index:6;";
					window.chatInputOut.style.backgroundImage = `url('${lib.assetURL}extension/十周年UI/shoushaUI/sayplay/sayX.png')`;
					window.chatBg.appendChild(window.chatInputOut);

					window.chatInput = ui.create.dialog("hidden");
					window.chatInput.style.cssText = "height: 24px; width: 44%; left: 24.2%; top: 31px; transition: none;";
					window.chatBg.appendChild(window.chatInput);

					window.ipt = ui.create.div();
					window.ipt.style.cssText = "height: 24px; width: 100%; top: 0px; left: 0px; margin: 0px; border-radius: 0px; background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4));";
					if (window.input?.value) {
						window.input_value = window.input.value;
					}
					window.ipt.innerHTML = `<input type="text" value="${window.input_value || "请输入文字"}" style="color:white;font-family:shousha;width:calc(100% - 10px);text-align:left;"></input>`;
					window.input = window.ipt.querySelector("input");
					window.input.style.backgroundImage = `url('${lib.assetURL}extension/十周年UI/shoushaUI/sayplay/say.png')`;
					window.input.style.backgroundSize = "120% 120%";
					window.input.style.boxShadow = "none";
					window.input.onclick = e => {
						e.stopPropagation();
					};
					window.input.onfocus = function () {
						if (this.value === "请输入文字") {
							this.value = "";
						}
					};
					window.input.onkeydown = e => {
						e.stopPropagation();
						if (e.keyCode === 13 || e.key === "Enter") {
							const value = String(e.target.value ?? "");
							if (!value) return;
							window.sendInfo(value);
						}
					};
					window.chatInput.add(window.ipt);
				};

				game.showChatWord = () => {
					const dialogConfigs = [
						{ name: "dialog_lifesay", prop: "left", value: `-${window.dialog_lifesay?.style.width}` },
						{ name: "dialog_emoji", prop: "top", value: "100%" },
						{ name: "dialog_emotion", prop: "bottom", value: "100%" },
					];
					hideOtherDialogs("chatBackground", dialogConfigs);

					if (window.chatBackground?.show) {
						window.chatBackground.hide();
						window.chatBackground.show = false;
						return;
					}

					window.chatBackground = ui.create.div("hidden");
					window.chatBackground.classList.add("static");
					window.chatBackground.show = true;
					window.chatBackground.style.cssText = `transition: all 1s; height: 330px; width: 600px; top: calc(20% - 100px); left: 100%; bottom: calc(${window.chatBg?.style.height || "0"} + 5px); opacity: 1; border-radius: 10px; background-size: 100% 100%;`;
					window.chatBackground.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png");
					window.chatBackground.style.zIndex = 999999999;
					window.chatBackground.style.boxShadow = "none";
					setTimeout(() => {
						window.chatBackground.style.left = "calc(50% - 300px)";
					}, DIALOG_ANIMATION_DELAY);

					game.mouseChatDiv = div => {
						if (lib.device === undefined) {
							div.onmouseover = function () {
								this.style.opacity = "1.0";
							};
							div.onmouseout = function () {
								this.style.opacity = "0.25";
							};
						} else {
							div.onclick = function () {
								this.style.opacity = this.style.opacity === "0.25" ? "0.75" : "0.25";
							};
						}
					};
					game.mouseChatDiv(window.chatBackground);
					ui.window.appendChild(window.chatBackground);

					const { bgColor } = createDialogBackground(window.chatBackground, {
						pictStyles: {
							height: "100%",
							width: "100%",
							left: "0%",
							bottom: "0%",
							transition: "none",
							borderRadius: "8px",
							backgroundSize: "100% 100%",
						},
						pictImage: "extension/十周年UI/shoushaUI/sayplay/saydiv.png",
						pictBoxShadow: "none",
						colorStyles: {
							height: "70%",
							width: "80%",
							left: "10%",
							top: "10%",
							transition: "none",
							borderRadius: "8px",
							backgroundSize: "100% 100%",
						},
						colorImage: "extension/十周年UI/shoushaUI/sayplay/nobg.png",
					});

					window.chatBackground2 = ui.create.div("hidden");
					window.chatBackground2.style.cssText = "height: 100%; width: 100%; left: 0%; bottom: 0%; transition: none; text-align: left; overflow-y: scroll;";
					window.chatBackground2.innerHTML = "";
					lib.setScroll(window.chatBackground2);
					bgColor.appendChild(window.chatBackground2);
					game.addChatWord();
				};

				lib.skill._wmkzSayChange = {
					trigger: {
						global: ["gameStart", "phaseBegin", "phaseAfter", "useCardAfter"],
					},
					forced: true,
					silent: true,
					filter(event, player) {
						return player.change_sayFunction !== true;
					},
					content() {
						player.change_sayFunction = true;
						player.sayTextWord = player.say;
						player.say = str => {
							game.broadcastAll(
								(player, str) => {
									if (typeof game.addChatWord !== "function") {
										if (!window.chatRecord) window.chatRecord = [];
										game.addChatWord = strx => {
											if (window.chatRecord.length > MAX_CHAT_RECORDS) {
												window.chatRecord.shift();
											}
											if (strx) {
												window.chatRecord.push(strx);
											}
											const str = window.chatRecord.map(record => `<br>${record}<br>`).join("");
											if (window.chatBackground2) {
												game.updateChatWord(str);
											}
										};
									}
									const processedStr = str.replace(/##assetURL##/g, lib.assetURL);
									const playerName = get.slimNameHorizontal(String(player.name));
									const displayName = player.nickname ? `${playerName}[${player.nickname}]` : playerName;
									game.addChatWord(`<font color=green>${displayName}</font><font color=white>：${processedStr}</font>`);
								},
								player,
								str
							);
							player.sayTextWord(str);
						};
					},
				};

				lib.element.player.chat = function (str) {
					if (get.is.banWords(str)) return;

					if (str.startsWith("/")) {
						const chat = str.slice(1);
						if (chat.includes(" ")) {
							const parts = chat.split(" ");
							const func = parts.shift();
							if (func === "playAudio" && parts.length) {
								const directory = parts.shift();
								if ((directory === "die" || directory === "skill") && parts.length) {
									const filename = parts.shift();
									game.broadcastAll(
										(dir, file) => {
											game.playAudio(dir, file);
										},
										directory,
										filename
									);
									if (parts.length) {
										str = parts.join(" ");
									} else {
										let translation = filename;
										while (translation === get.translation(translation) && translation.length) {
											translation = translation.slice(0, -1);
										}
										str = translation.length ? get.translation(translation) : filename;
									}
								}
							}
						}
					}

					this.say(str);
					game.broadcast(
						(id, message) => {
							if (lib.playerOL[id]) {
								lib.playerOL[id].say(message);
							} else if (game.connectPlayers) {
								const player = game.connectPlayers.find(p => p.playerid === id);
								if (player) {
									player.say(message);
								}
							}
						},
						this.playerid,
						str
					);
				};
			})();

			Object.assign(game.videoContent, {
				createCardRoundTime() {
					ui.cardRoundTime = plugin.create.cardRoundTime();
				},
				createhandcardNumber() {
					ui.handcardNumber = plugin.create.handcardNumber();
				},
				updateCardRoundTime(opts) {
					if (!ui.cardRoundTime) return;
					const roundNumber = Math.max(1, game.roundNumber || 1);
					ui.cardRoundTime.node.roundNumber.innerHTML = `<span>第${roundNumber}轮</span>`;
					ui.cardRoundTime.setNumberAnimation(opts.cardNumber);
				},
				updateCardnumber(opts) {
					if (!ui.handcardNumber) return;
				},
			});
			app.reWriteFunction(ui.create, {
				me: [
					function () {
						plugin.create.control();
					},
					null,
				],
				arena: [
					null,
					function () {
						if (ui.time3) {
							clearInterval(ui.time3.interval);
							ui.time3.delete();
						}
						if (ui.cardPileNumber) ui.cardPileNumber.delete();
						ui.cardRoundTime = plugin.create.cardRoundTime();
						ui.handcardNumber = plugin.create.handcardNumber();
					},
				],
				cards: [
					null,
					function () {
						if (ui.cardRoundTime) {
							ui.cardRoundTime.updateRoundCard();
						}
					},
				],
			});
			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					function (res, config, map) {
						map.control_style.hide();
						map.custom_button.hide();
						map.custom_button_system_top.hide();
						map.custom_button_system_bottom.hide();
						map.custom_button_control_top.hide();
						map.custom_button_control_bottom.hide();
						map.radius_size.hide();
					},
				],
			});
			ui.create.confirm = (str, func) => {
				if ((_status.mode === "huanle" && _status.event.parent.name === "chooseCharacter" && _status.event.parent.step === "6" && _status.event.name === "chooseButton") || (lib.config["extension_无名补丁_xindjun"] && get.playerNumber() === "8" && get.mode() === "identity" && _status.mode === "normal" && _status.event.parent.name === "chooseCharacter" && _status.event.parent.step === "1" && _status.event.name === "chooseButton")) {
					const node = ui.dialog.querySelector(".selected");
					const head = ui.create.div(".ok23", node);
					head.ondblclick = e => {
						e.stopPropagation();
						ui.click.ok();
					};
					return;
				}
				let confirm = ui.confirm;
				if (!confirm) {
					confirm = ui.confirm = plugin.create.confirm();
				}
				confirm.node.ok.classList.add("disabled");
				confirm.node.cancel.classList.add("disabled");
				if (_status.event.endButton) {
					ui.confirm.node.cancel.classList.remove("disabled");
				}
				if (str) {
					if (str.indexOf("o") !== -1) {
						confirm.node.ok.classList.remove("disabled");
					}
					if (str.indexOf("c") !== -1) {
						confirm.node.cancel.classList.remove("disabled");
					}
					confirm.str = str;
				}
				if (func) {
					confirm.custom = func;
				}
				ui.updatec();
				confirm.update();
			};
			// 拦截出牌阶段的取消：有选中时仅恢复选择而不结束回合
			(() => {
				const originalCancel = ui.click.cancel;
				ui.click.cancel = function (node) {
					const event = _status.event;
					if (event && _status.event.type === "phase" && ui.confirm && !event.skill && (ui.selected.cards.length !== 0 || ui.selected.targets.length !== 0)) {
						ui.confirm.classList.add("removing");
						event.restore();
						const cards = event.player.getCards("hej");
						for (let i = 0; i < cards.length; i++) {
							cards[i].recheck("useSkill");
						}
						game.uncheck();
						game.check();
						return;
					}
					return originalCancel.call(this, node);
				};
			})();
		},
		create: {
			control() {},
			confirm() {
				//确定文本
				const confirm = ui.create.control("<span></span>", "cancel");
				confirm.classList.add("lbtn-confirm");
				confirm.node = {
					ok: confirm.firstChild,
					cancel: confirm.lastChild,
					//小改动
					//cancel2: confirm.lastChild,
				};
				if (_status.event.endButton) {
					_status.event.endButton.close();
					//	delete event.endButton;
				}
				confirm.node.ok.link = "ok";
				//这里重要修改2开始
				//目的是在使用手气卡时，将按钮替换为免费换牌（3次后替换为换牌的函数在gamedraw函数里），将弃牌阶段按钮替换为弃牌，所以css的样式一定要搬。（再次修改，用以适配神将选势力）
				if (_status.event.name === "gameDraw") confirm.node.ok.classList.add("huan");
				else if (_status.event.name === "chooseToDiscard" && _status.event.parent.name === "phaseDiscard") confirm.node.ok.classList.add("qi");
				else if ((_status.mode === "huanle" && _status.event.parent.step === "7") || (get.mode() === "identity" && _status.mode === "normal" && _status.event.parent.name === "chooseCharacter" && _status.event.parent.step === "2")) confirm.node.ok.classList.add("group");
				else confirm.node.ok.classList.add("primary");
				if ((_status.mode === "huanle" && _status.event.parent.step === "7") || (get.mode() === "identity" && _status.mode === "normal" && _status.event.parent.name === "chooseCharacter" && _status.event.parent.step === "2")) confirm.node.cancel.remove();
				else confirm.node.cancel.classList.add("primary2");
				confirm.node.cancel.innerHTML = `<image style=width: 80px height 15px src=${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/QX.png>`;
				// confirm.node.cancel2.classList.add('primary2');
				confirm.custom = plugin.click.confirm;
				app.reWriteFunction(confirm, {
					close: [
						function () {
							this.classList.add("closing");
						},
					],
				});
				for (const k in confirm.node) {
					confirm.node[k].classList.add("disabled");
					confirm.node[k].removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
					confirm.node[k].addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
						e.stopPropagation();
						if (this.classList.contains("disabled")) {
							if (this.link === "cancel" && this.dataset.type === "endButton" && _status.event.endButton) {
								_status.event.endButton.custom();
								ui.confirm.close();
								//  ui.updatec();
							}
							return;
						}
						if (this.parentNode.custom) {
							this.parentNode.custom(this.link, this);
						}
					});
				}
				//添加重铸按钮素材
				if (ui.skills2 && ui.skills2.skills.length) {
					const skills = ui.skills2.skills;
					confirm.skills2 = [];
					for (let i = 0; i < skills.length; i++) {
						const item = document.createElement("div");
						item.link = skills[i];
						if (skills[i] === "_recasting") {
							item.innerHTML = `<img draggable='false' src=${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/CZ.png>`;
							// 为重铸按钮设置单独的背景图
							item.style.backgroundImage = `url(${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/game_btn_bg2.png)`;
							item.style.transform = "scale(0.75,0.75)";
							item.style.setProperty("padding", "25px 10px", "important");
						} else {
							item.innerHTML = get.translation(skills[i]);
						}
						item.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
							if (_status.event?.skill === "_recasting") return;
							e.stopPropagation();
							ui.click.skill(this.link);
							if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
						});
						item.dataset.type = "skill2";
						confirm.skills2.push(item);
						confirm.insertBefore(item, confirm.firstChild);
					}
				}
				confirm.update = () => {
					//鹿鹿修改 限定技专属按钮开始
					const skisxdj = () => {
						if (_status.event?.skill && get.info(_status.event.skill)?.limited && _status.event.player === game.me) {
							return true;
						}
						if (_status.event?.getParent(2)?.skill && get.info(_status.event.getParent(2).skill)?.limited && _status.event.getParent(2).player === game.me) {
							return true;
						}
						if (_status.event?.getParent()?.skill && get.info(_status.event.getParent().skill)?.limited && _status.event.getParent().player === game.me) {
							return true;
						}
						return false;
					};
					if (skisxdj() === true && !confirm.node.ok.classList.contains("xiandingji")) {
						confirm.node.ok.classList.add("xiandingji");
					}
					if (skisxdj() !== true && confirm.node.ok.classList.contains("xiandingji")) {
						confirm.node.ok.classList.remove("xiandingji");
					}
					//鹿鹿修改 限定技专属按钮结束
					if (confirm.skills2) {
						if (_status.event.skill && _status.event.skill !== confirm.dataset.skill) {
							confirm.dataset.skill = _status.event.skill;
							confirm.skills2.forEach(item => {
								item.remove();
							});
							ui.updatec();
						} else if (!_status.event.skill && confirm.dataset.skill) {
							delete confirm.dataset.skill;
							confirm.skills2.forEach(item => {
								confirm.insertBefore(item, confirm.firstChild);
							});
							ui.updatec();
						}
					}
					if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
				};
				return confirm;
			},
			handcardNumber() {
				const node3 = ui.create.div(".settingButton", ui.arena, plugin.click.setting);
				const node2 = ui.create.div(".lbtn-controls", ui.arena);
				ui.create.div(".lbtn-control", node2, "   ");
				ui.create.div(".lbtn-control", node2, "   ");
				/*ui.create.div('.lbtn-control1', node2, plugin.click.paixu);*/
				//左手模式记录和牌序按钮
				let paixuauto, jilu;
				if (lib.config["extension_十周年UI_rightLayout"] === "on") {
					paixuauto = ui.create.div(".lbtn-paixu", ui.arena);
					jilu = ui.create.div(".latn-jilu", ui.arena, ui.click.pause);
				} else {
					paixuauto = ui.create.div(".lbtn-paixu1", ui.arena);
					jilu = ui.create.div(".latn-jilu1", ui.arena, ui.click.pause);
				}
				paixuauto.onclick = () => {
					if (window.paixuxx === undefined || window.paixuxx === false) {
						plugin.click.startAutoPaixu();
						paixuauto.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/uibutton/zidongpaixu.png");
						window.paixuxx = true;
					} else {
						plugin.click.stopAutoPaixu();
						paixuauto.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/uibutton/btn-paixu.png");
						window.paixuxx = false;
					}
				};
				//-----------------//
				//左手模式同上继续加一个显示手牌牌量新的按钮css
				let node;
				if (lib.config["extension_十周年UI_rightLayout"] === "on") {
					node = ui.create.div(".handcardNumber", ui.arena).hide();
					node.node = {
						cardPicture: ui.create.div(".cardPicture", node),
						cardNumber: ui.create.div(".cardNumber", node),
					};
				} else {
					node = ui.create.div(".handcardNumber1", ui.arena).hide();
					node.node = {
						cardPicture: ui.create.div(".cardPicture1", node),
						cardNumber: ui.create.div(".cardNumber1", node),
					};
				}
				//手牌显示·---//
				node.updateCardnumber = function () {
					if (!game.me) return;
					const cardNumber2 = game.me.countCards("h") || 0;
					let cardNumber = game.me.getHandcardLimit() || 0;
					let numbercolor = "white";
					if (cardNumber2 > cardNumber) numbercolor = "white";
					if (cardNumber === Infinity) cardNumber = "∞";
					if (cardNumber > game.me.hp) numbercolor = "#20c520";
					if (cardNumber < game.me.hp) numbercolor = "#ff1813";
					if (cardNumber === game.me.hp) numbercolor = "#ffe9cd";
					this.node.cardNumber.innerHTML = `</span><font size=5.5 >${cardNumber2}</font><font size=5 face="xinwei">/<font color=${numbercolor} size=4 face="shousha">${cardNumber}</font></span>`;
					//      this.setNumberAnimation(cardNumber);
					this.show();
					game.addVideo("updateCardnumber", null, {
						cardNumber: cardNumber,
					});
				};
				node.node.cardNumber.interval = setInterval(() => {
					ui.handcardNumber.updateCardnumber();
				}, 1000);
				game.addVideo("createhandcardNumber");
				return node;
			},
			cardRoundTime() {
				const node = ui.create.div(".cardRoundNumber", ui.arena).hide();
				node.node = {
					cardPileNumber: ui.create.div(".cardPileNumber", node, plugin.click.paidui),
					roundNumber: ui.create.div(".roundNumber", node),
					time: ui.create.div(".time", node),
				};
				node.updateRoundCard = function () {
					const cardNumber = ui.cardPile.childNodes.length || 0;
					const roundNumber = Math.max(1, game.roundNumber || 1);
					this.node.roundNumber.innerHTML = `<span>第${roundNumber}轮</span>`;
					this.setNumberAnimation(cardNumber);
					this.show();
					game.addVideo("updateCardRoundTime", null, {
						cardNumber: cardNumber,
						roundNumber: roundNumber,
					});
				};
				node.setNumberAnimation = function (num, step) {
					const item = this.node.cardPileNumber;
					clearTimeout(item.interval);
					if (!item._num) {
						item.innerHTML = `<span>${num}</span>`;
						item._num = num;
					} else {
						if (item._num !== num) {
							if (!step) step = 500 / Math.abs(item._num - num);
							if (item._num > num) item._num--;
							else item._num++;
							item.innerHTML = `<span>${item._num}</span>`;
							if (item._num !== num) {
								const self = this;
								item.interval = setTimeout(() => {
									self.setNumberAnimation(num, step);
								}, step);
							}
						}
					}
				};
				ui.time4 = node.node.time;
				ui.time4.starttime = get.utc();
				ui.time4.interval = setInterval(() => {
					const num = Math.round((get.utc() - ui.time4.starttime) / 1000);
					if (num >= 3600) {
						let num1 = Math.floor(num / 3600);
						let num2 = Math.floor((num - num1 * 3600) / 60);
						let num3 = num - num1 * 3600 - parseInt(num2) * 60;
						if (num1 < 10) {
							num1 = `0${num1.toString()}`;
						}
						if (num2 < 10) {
							num2 = `0${num2.toString()}`;
						}
						if (num3 < 10) {
							num3 = `0${num3.toString()}`;
						}
						ui.time4.innerHTML = `<span>${num1}:${num2}:${num3}</span>`;
					} else {
						let num1 = Math.floor(num / 60);
						let num2 = num - num1 * 60;
						if (num1 < 10) {
							num1 = `0${num1.toString()}`;
						}
						if (num2 < 10) {
							num2 = `0${num2.toString()}`;
						}
						ui.time4.innerHTML = `<span>${num1}:${num2}</span>`;
					}
				}, 1000);
				game.addVideo("createCardRoundTime");
				return node;
			},
		},
		click: {
			paixu() {
				if (!game.me || game.me.hasSkillTag("noSortCard")) return;
				const cards = game.me.getCards("hs");
				const sort2 = (a, b) => {
					const order = { basic: 0, trick: 1, delay: 1, equip: 2 };
					const ta = get.type(a);
					const tb = get.type(b);
					const ca = order[ta] === undefined ? 99 : order[ta];
					const cb = order[tb] === undefined ? 99 : order[tb];
					if (ca !== cb) return ca - cb;
					if (a.name !== b.name) return lib.sort.card(a.name, b.name);
					if (a.suit !== b.suit) return lib.suit.indexOf(a.suit) - lib.suit.indexOf(b.suit);
					return a.number - b.number;
				};
				if (cards.length > 1) {
					cards.sort(sort2);
					cards.forEach((i, j) => {
						game.me.node.handcards1.insertBefore(cards[j], game.me.node.handcards1.firstChild);
					});
					dui.queueNextFrameTick(dui.layoutHand, dui);
				}
			},
			// 开启自动牌序（监听手牌变化自动整理）
			startAutoPaixu() {
				if (!game.me || game.me.hasSkillTag("noSortCard")) return;
				const container = game.me.node && game.me.node.handcards1;
				if (!container) return;
				if (ui._autoPaixuObserver) {
					try {
						ui._autoPaixuObserver.disconnect();
					} catch (e) {}
				}
				ui._autoPaixuDebounce = null;
				ui._autoPaixuSorting = false;
				ui._autoPaixuEnabled = true;
				ui._autoPaixuContainer = container;
				ui._autoPaixuLastCount = container.childNodes.length || 0;
				ui._autoPaixuObserver = new MutationObserver(() => {
					if (ui._autoPaixuSorting) return;
					if (ui._autoPaixuDebounce) clearTimeout(ui._autoPaixuDebounce);
					ui._autoPaixuDebounce = setTimeout(() => {
						if (!game.me || !game.me.node || !game.me.node.handcards1) return;
						const curCount = game.me.node.handcards1.childNodes.length || 0;
						if (ui._autoPaixuLastCount !== null && curCount < ui._autoPaixuLastCount) {
							ui._autoPaixuLastCount = curCount;
							return;
						}
						const cards = game.me.getCards("hs");
						const sort2 = (a, b) => {
							const order = { basic: 0, trick: 1, delay: 1, equip: 2 };
							const ta = get.type(a);
							const tb = get.type(b);
							const ca = order[ta] === undefined ? 99 : order[ta];
							const cb = order[tb] === undefined ? 99 : order[tb];
							if (ca !== cb) return ca - cb;
							if (a.name !== b.name) return lib.sort.card(a.name, b.name);
							if (a.suit !== b.suit) return lib.suit.indexOf(a.suit) - lib.suit.indexOf(b.suit);
							return a.number - b.number;
						};
						if (cards.length > 1) {
							ui._autoPaixuSorting = true;
							const sorted = cards.slice().sort(sort2);
							const container = game.me.node.handcards1;
							let unchanged = true;
							for (let idx = 0; idx < sorted.length; idx++) {
								if (container.childNodes[idx] !== sorted[idx]) {
									unchanged = false;
									break;
								}
							}
							if (!unchanged) {
								for (let k = 0; k < sorted.length; k++) {
									const nodeExpect = sorted[k];
									if (container.childNodes[k] !== nodeExpect) {
										container.insertBefore(nodeExpect, container.childNodes[k] || null);
									}
								}
							}
							dui.queueNextFrameTick(() => {
								dui.layoutHand();
								setTimeout(() => {
									ui._autoPaixuSorting = false;
								}, 0);
							}, dui);
							ui._autoPaixuLastCount = game.me.node.handcards1.childNodes.length || 0;
							ui._autoPaixuSuppressOnce = true;
						}
					}, 180);
				});
				ui._autoPaixuObserver.observe(container, { childList: true, subtree: true });
				if (ui._autoPaixuKeeper)
					try {
						clearInterval(ui._autoPaixuKeeper);
					} catch (e) {}
				ui._autoPaixuKeeper = setInterval(() => {
					if (!ui._autoPaixuEnabled) return;
					if (!game.me || !game.me.node) return;
					const cur = game.me.node.handcards1;
					if (!cur) return;
					if (cur !== ui._autoPaixuContainer) {
						ui._autoPaixuContainer = cur;
						ui._autoPaixuLastCount = cur.childNodes.length || 0;
						try {
							ui._autoPaixuObserver.disconnect();
						} catch (e) {}
						ui._autoPaixuObserver.observe(cur, { childList: true, subtree: true });
					}
					const nowCount = cur.childNodes.length || 0;
					if (nowCount !== ui._autoPaixuLastCount) {
						const prev = ui._autoPaixuLastCount;
						ui._autoPaixuLastCount = nowCount;
						if (nowCount > prev && !ui._autoPaixuSorting) {
							if (ui._autoPaixuSuppressOnce) {
								ui._autoPaixuSuppressOnce = false;
							} else
								setTimeout(() => {
									plugin.click.paixu();
								}, 120);
						}
					}
				}, 600);
				plugin.click.paixu();
			},
			stopAutoPaixu() {
				if (ui._autoPaixuObserver) {
					try {
						ui._autoPaixuObserver.disconnect();
					} catch (e) {}
					ui._autoPaixuObserver = null;
				}
				if (ui._autoPaixuDebounce) {
					clearTimeout(ui._autoPaixuDebounce);
					ui._autoPaixuDebounce = null;
				}
				if (ui._autoPaixuKeeper) {
					try {
						clearInterval(ui._autoPaixuKeeper);
					} catch (e) {}
					ui._autoPaixuKeeper = null;
				}
				ui._autoPaixuSorting = false;
				ui._autoPaixuEnabled = false;
			},
			//可点击函数（牌堆）
			paidui() {
				if (!_status.gameStarted) return;
				game.pause2();
				const cardsInfo = game.players
					.map(item => item.get("h"))
					.flat(window.Infinity)
					.concat(...ui.cardPile.childNodes)
					.concat(...ui.discardPile.childNodes)
					.map(item => ({
						name: item.name,
						suit: item.suit,
						number: item.number,
						nature: get.translation(item.nature),
						color: get.color(item),
						type: get.translation(get.type(item), "trick"),
						translate: lib.translate[item.name],
						link: item,
					}));
				let cardStatistics = {
					杀: {
						num: 0,
						type: "基本",
					},
					火杀: {
						num: 0,
						type: "基本",
					},
					雷杀: {
						num: 0,
						type: "基本",
					},
					红杀: {
						num: 0,
						type: "基本",
					},
					黑杀: {
						num: 0,
						type: "基本",
					},
					"黑桃2~9": {
						num: 0,
						type: "花色",
					},
				};
				let typeList = ["点数", "花色"];
				for (let card of cardsInfo) {
					typeList.add(card.type);
					// 统计卡牌名
					if (!cardStatistics[card.translate])
						cardStatistics[card.translate] = {
							num: 0,
							type: card.type,
						};
					// 统计花色
					if (!cardStatistics[get.translation(card.suit)])
						cardStatistics[get.translation(card.suit)] = {
							num: 0,
							type: "花色",
						};
					// 统计点数
					if (!cardStatistics[card.number])
						cardStatistics[card.number] = {
							num: 0,
							type: "点数",
						};
					if (ui.cardPile.contains(card.link)) {
						cardStatistics[card.translate].num++;
						cardStatistics[get.translation(card.suit)].num++;
						cardStatistics[card.number].num++;
						if (card.name === "sha") {
							if (card.color === "black") {
								cardStatistics["黑杀"].num++;
								if (card.suit === "spade" && card.number <= 9 && card.number >= 2) cardStatistics["黑桃2~9"].num++;
							} else if (card.color === "red") {
								cardStatistics["红杀"].num++;
							}
						}
					}
					if (card.nature) {
						if (!cardStatistics[card.nature + card.translate])
							cardStatistics[card.nature + card.translate] = {
								num: 0,
								type: card.type,
							};
						if (ui.cardPile.contains(card.link)) {
							cardStatistics[card.nature + card.translate].num++;
						}
					}
				}
				let popupContainer = ui.create.div(
					".popup-container",
					ui.window,
					{
						zIndex: 10,
						background: "rgb(0,0,0,.3)",
					},
					function () {
						this.delete(500);
						game.resume2();
					}
				);
				let statistics = ui.create.div(".card-statistics", "卡牌计数器", popupContainer);
				let statisticsTitle = ui.create.div(".card-statistics-title", statistics);
				let statisticsContent = ui.create.div(".card-statistics-content", statistics);
				typeList.forEach(item => {
					ui.create.div(statisticsTitle, "", item);
					statisticsContent[item] = ui.create.div(statisticsContent, "");
				});
				for (let i in cardStatistics) {
					let items = ui.create.div(".items");
					let item = ui.create.div(".item", i, items);
					let num = ui.create.div(".item-num", `X${cardStatistics[i].num}`, items);
					statisticsContent[cardStatistics[i].type].appendChild(items);
				}
			},
			confirm(link, target) {
				if (link === "ok") {
					ui.click.ok(target);
				} else if (link === "cancel") {
					ui.click.cancel(target);
				} else if (target.custom) {
					target.custom(link);
				}
			},
		},
		showDistanceDisplay() {
			plugin.closeDistanceDisplay();
			plugin._lastMe = game.me;
			if (game.players && game.players.length > 0) {
				game.players.forEach(player => {
					if (player !== game.me) {
						const distance = get.distance(game.me, player);
						const distanceText = distance === Infinity ? "∞" : distance.toString();
						const distanceDisplay = ui.create.div(".distance-display", `(距离:${distanceText})`, player);
						player._distanceDisplay = distanceDisplay;
					}
				});
			}
			if (plugin._distanceUpdateInterval) {
				clearInterval(plugin._distanceUpdateInterval);
			}
			plugin._distanceUpdateInterval = setInterval(() => {
				plugin.updateDistanceDisplay();
			}, 1000);
		},
		updateDistanceDisplay() {
			if (plugin._lastMe !== game.me) {
				plugin._lastMe = game.me;
				plugin.closeDistanceDisplay();
				plugin.showDistanceDisplay();
				return;
			}
			game.players.forEach(player => {
				if (player !== game.me && player._distanceDisplay) {
					const distance = get.distance(game.me, player);
					const distanceText = distance === Infinity ? "∞" : distance.toString();
					player._distanceDisplay.innerHTML = `(距离:${distanceText})`;
				}
			});
		},
		closeDistanceDisplay() {
			game.players.forEach(player => {
				if (player._distanceDisplay) {
					player._distanceDisplay.remove();
					player._distanceDisplay = null;
				}
			});
			if (plugin._distanceUpdateInterval) {
				clearInterval(plugin._distanceUpdateInterval);
				plugin._distanceUpdateInterval = null;
			}
		},
		compare: {
			type(a, b) {
				if (a === b) return 0;
				const types = ["basic", "trick", "delay", "equip"].addArray([a, b]);
				return types.indexOf(a) - types.indexOf(b);
			},
			name(a, b) {
				if (a === b) return 0;
				return a > b ? 1 : -1;
			},
			nature(a, b) {
				if (a === b) return 0;
				const nature = [undefined, "fire", "thunder"].addArray([a, b]);
				return nature.indexOf(a) - nature.indexOf(b);
			},
			suit(a, b) {
				if (a === b) return 0;
				const suit = ["diamond", "heart", "club", "spade"].addArray([a, b]);
				return suit.indexOf(a) - suit.indexOf(b);
			},
			number(a, b) {
				return a - b;
			},
		},
	};
	lib.announce.subscribe("gameStart", () => setTimeout(() => plugin.showDistanceDisplay(), 100));
	return plugin;
});
