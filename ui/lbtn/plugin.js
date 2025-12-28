/**
 * 左侧按钮插件
 * 根据样式自动加载对应的lbtn逻辑
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { buildModeWinTranslations, initIdentityShow, updateIdentityShow } from "./identityShow.js";
import { showCardPileStatistics, sortHandCards, AutoSort, DistanceDisplay, handleConfirm } from "./controls.js";
import { addChatWord } from "./chatSystem.js";
import { getCurrentSkin, createLbtnPluginForSkin } from "./skins/index.js";

// 创建左侧按钮插件
export function createLbtnPlugin(lib, game, ui, get, ai, _status, app) {
	// 获取当前样式并创建对应插件
	const skinName = getCurrentSkin(lib);
	const skinPlugin = createLbtnPluginForSkin(skinName, lib, game, ui, get, ai, _status, app);

	// 如果样式插件存在，直接返回
	if (skinPlugin) {
		return skinPlugin;
	}

	// 以下为默认实现（兼容旧代码）
	// 注册全局函数
	game.ui_identityShow_init = initIdentityShow;
	game.ui_identityShow_update = updateIdentityShow;
	game.addChatWord = addChatWord;

	const plugin = {
		name: "lbtn",

		filter: () => !["chess", "tafang"].includes(get.mode()),

		content(next) {
			// 技能更新触发器
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
				filter: (event, player) => !!player,
				async content(event, trigger, player) {
					const me = player || _status.event?.player || game.me;
					if (ui.updateSkillControl) ui.updateSkillControl(me, true);
				},
			};
		},

		precontent() {
			this._initChatSystem();
			this._initArenaReady();
			this._initVideoContent();
			this._rewriteUICreate();
			this._rewriteConfigMenu();
			this._initConfirm();
		},

		// 初始化聊天系统
		_initChatSystem() {
			// 聊天系统在chatSystem.js中实现
			// 这里只做基础初始化
			if (!window.chatRecord) window.chatRecord = [];
		},

		// Arena准备完成后的初始化
		_initArenaReady() {
			lib.arenaReady.push(() => {
				// 更新轮次
				const originUpdateRoundNumber = game.updateRoundNumber;
				game.updateRoundNumber = function () {
					originUpdateRoundNumber.apply(this, arguments);
					if (ui.cardRoundTime) ui.cardRoundTime.updateRoundCard();
				};

				// 聊天按钮
				if (lib.config.extension_十周年UI_LTAN === false) {
					this._createChatButton();
				}

				// 身份显示
				const validModes = ["identity", "guozhan", "versus", "single", "boss", "doudizhu"];
				if (validModes.includes(lib.config.mode)) {
					const map = buildModeWinTranslations(lib.config.mode, get.config("versus_mode"));
					if (map) {
						Object.entries(map).forEach(([k, v]) => {
							lib.translate[`${k}_win_option`] = v;
						});
						initIdentityShow();
						setInterval(updateIdentityShow, 1000);
					}
				}

				// 右上角菜单
				this._createMenuButton();

				// 左上角身份提示
				if (["identity", "doudizhu", "versus", "guozhan"].includes(lib.config.mode)) {
					this._createIdentityTip();
				}
			});
		},

		// 创建聊天按钮
		_createChatButton() {
			const btn = ui.create.node("img");
			btn.src = `${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/liaotian.png`;

			const isRight = lib.config["extension_十周年UI_rightLayout"] === "on";
			btn.style.cssText = `display:block;--w:135px;--h:calc(var(--w)*1019/1400);width:var(--w);height:var(--h);position:absolute;top:calc(100% - 97px);${isRight ? "right" : "left"}:calc(100% - 129px);background-color:transparent;z-index:3;${isRight ? "" : "transform:scaleX(-1);"}`;

			btn.onclick = () => {
				if (lib.config["extension_说话_enable"]) {
					game.showChatWordBackground?.();
				} else {
					game.showChatWordBackgroundX?.();
				}
			};

			document.body.appendChild(btn);
		},

		// 创建菜单按钮
		_createMenuButton() {
			const headImg = ui.create.node("img");
			headImg.src = `${lib.assetURL}extension/十周年UI/ui/assets/lbtn/shousha/button.png`;
			headImg.style.cssText = "display:block;--w:130px;--h:calc(var(--w)*1080/1434);width:var(--w);height:var(--h);position:absolute;bottom:calc(100% - 98px);left:calc(100% - 126.2px);background-color:transparent;z-index:1;";
			document.body.appendChild(headImg);

			const head = ui.create.node("div");
			head.style.cssText = "display:block;width:134px;height:103px;position:absolute;top:0px;right:-8px;background-color:transparent;z-index:1;";
			head.onclick = () => this._showMenu();
			document.body.appendChild(head);
		},

		// 显示菜单
		_showMenu() {
			game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/label.mp3");

			const container = ui.create.div(".popup-container", { background: "rgb(0,0,0,0)" }, ui.window);
			container.addEventListener("click", e => {
				game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/caidan.mp3");
				e.stopPropagation();
				container.delete(200);
			});

			ui.create.div(".yemian", container);

			const buttons = [
				{
					cls: ".shezhi",
					action: () => {
						ui.click.configMenu?.();
						ui.system1.classList.remove("shown");
						ui.system2.classList.remove("shown");
					},
				},
				{ cls: ".tuichu", action: () => window.location.reload() },
				{ cls: ".taopao", action: () => game.reload() },
				{ cls: ".touxiang", action: () => game.over() },
				{ cls: ".tuoguan", action: () => ui.click.auto() },
			];

			buttons.forEach(({ cls, action }) => {
				const btn = ui.create.div(cls, container);
				btn.addEventListener("click", () => {
					game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/xuanzhe.mp3");
					action();
				});
			});
		},

		// 创建身份提示
		_createIdentityTip() {
			const tip = ui.create.node("img");
			tip.src = `${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/shenfen.png`;
			tip.style.cssText = "display:block;--w:400px;--h:calc(var(--w)*279/2139);width:var(--w);height:var(--h);position:absolute;top:-1px;left:-45px;background-color:transparent;z-index:1;";

			tip.onclick = () => {
				game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/label.mp3");

				const container = ui.create.div(".popup-container", ui.window);

				const modeMap = {
					identity: { zhu: ".sfrwzhugong", zhong: ".sfrwchongchen", fan: ".sfrwfanzei", nei: ".sfrwneijian" },
					doudizhu: { zhu: ".sfrwdizhu", fan: ".sfrwnongmin" },
					versus: ".sfrwhu",
					guozhan: { unknown: ".sfrwundefined", undefined: ".sfrwundefined", wei: ".sfrwweiguo", shu: ".sfrwshuguo", wu: ".sfrwwuguo", qun: ".sfrwqunxiong", jin: ".sfrwjinguo", ye: ".sfrwyexinjia" },
				};

				const mode = lib.config.mode;
				if (mode === "versus") {
					ui.create.div(modeMap.versus, container);
				} else if (modeMap[mode]) {
					const cls = modeMap[mode][game.me?.identity || game.me?.group] || ".sfrwundefined";
					ui.create.div(cls, container);
				}

				container.addEventListener("click", () => {
					game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/caidan.mp3");
					container.delete(200);
				});
			};

			document.body.appendChild(tip);
		},

		// 初始化内容
		_initVideoContent() {
			Object.assign(game.videoContent, {
				createCardRoundTime: () => (ui.cardRoundTime = plugin.create.cardRoundTime()),
				createhandcardNumber: () => (ui.handcardNumber = plugin.create.handcardNumber()),
				updateCardRoundTime: opts => {
					if (!ui.cardRoundTime) return;
					const round = Math.max(1, game.roundNumber || 1);
					ui.cardRoundTime.node.roundNumber.innerHTML = `<span>第${round}轮</span>`;
					ui.cardRoundTime.setNumberAnimation(opts.cardNumber);
				},
				updateCardnumber: () => {},
			});
		},

		// 重写UI创建方法
		_rewriteUICreate() {
			app.reWriteFunction(ui.create, {
				me: [() => plugin.create.control(), null],
				arena: [
					null,
					() => {
						if (ui.time3) {
							clearInterval(ui.time3.interval);
							ui.time3.delete();
						}
						if (ui.cardPileNumber) ui.cardPileNumber.delete();
						ui.cardRoundTime = plugin.create.cardRoundTime();
						ui.handcardNumber = plugin.create.handcardNumber();
					},
				],
				cards: [null, () => ui.cardRoundTime?.updateRoundCard()],
			});
		},

		// 重写配置菜单
		_rewriteConfigMenu() {
			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					(res, config, map) => {
						["control_style", "custom_button", "custom_button_system_top", "custom_button_system_bottom", "custom_button_control_top", "custom_button_control_bottom", "radius_size"].forEach(k => map[k]?.hide());
					},
				],
			});
		},

		// 初始化确认按钮
		_initConfirm() {
			ui.create.confirm = (str, func) => {
				// 特殊模式处理
				const isSpecialMode = (_status.mode === "huanle" && _status.event.parent.name === "chooseCharacter" && _status.event.parent.step === "6" && _status.event.name === "chooseButton") || (lib.config["extension_无名补丁_xindjun"] && get.playerNumber() === "8" && get.mode() === "identity" && _status.mode === "normal" && _status.event.parent.name === "chooseCharacter" && _status.event.parent.step === "1" && _status.event.name === "chooseButton");

				if (isSpecialMode) {
					const node = ui.dialog.querySelector(".selected");
					const head = ui.create.div(".ok23", node);
					head.ondblclick = e => {
						e.stopPropagation();
						ui.click.ok();
					};
					return;
				}

				if (!ui.confirm) {
					ui.confirm = plugin.create.confirm();
				}

				ui.confirm.node.ok.classList.add("disabled");
				ui.confirm.node.cancel.classList.add("disabled");

				if (_status.event.endButton) {
					ui.confirm.node.cancel.classList.remove("disabled");
				}

				if (str) {
					if (str.includes("o")) ui.confirm.node.ok.classList.remove("disabled");
					if (str.includes("c")) ui.confirm.node.cancel.classList.remove("disabled");
					ui.confirm.str = str;
				}

				if (func) ui.confirm.custom = func;
				ui.updatec();
				ui.confirm.update();
			};

			// 拦截出牌阶段取消
			const originalCancel = ui.click.cancel;
			ui.click.cancel = function (node) {
				const event = _status.event;
				if (event?.type === "phase" && ui.confirm && !event.skill && (ui.selected.cards.length || ui.selected.targets.length)) {
					ui.confirm.classList.add("removing");
					event.restore();
					game.me.getCards("hej").forEach(c => c.recheck("useSkill"));
					game.uncheck();
					game.check();
					return;
				}
				return originalCancel.call(this, node);
			};
		},

		create: {
			control() {},

			confirm() {
				const confirm = ui.create.control("<span></span>", "cancel");
				confirm.classList.add("lbtn-confirm");
				confirm.node = {
					ok: confirm.firstChild,
					cancel: confirm.lastChild,
				};

				if (_status.event.endButton) {
					_status.event.endButton.close();
				}

				confirm.node.ok.link = "ok";

				// 按钮样式
				const eventName = _status.event.name;
				const parentStep = _status.event.parent?.step;

				if (eventName === "gameDraw") {
					confirm.node.ok.classList.add("huan");
				} else if (eventName === "chooseToDiscard" && _status.event.parent?.name === "phaseDiscard") {
					confirm.node.ok.classList.add("qi");
				} else if ((_status.mode === "huanle" && parentStep === "7") || (get.mode() === "identity" && _status.mode === "normal" && _status.event.parent?.name === "chooseCharacter" && parentStep === "2")) {
					confirm.node.ok.classList.add("group");
				} else {
					confirm.node.ok.classList.add("primary");
				}

				if ((_status.mode === "huanle" && parentStep === "7") || (get.mode() === "identity" && _status.mode === "normal" && _status.event.parent?.name === "chooseCharacter" && parentStep === "2")) {
					confirm.node.cancel.remove();
				} else {
					confirm.node.cancel.classList.add("primary2");
				}

				confirm.node.cancel.innerHTML = `<image style="width:80px;height:15px;" src="${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/QX.png">`;
				confirm.custom = handleConfirm;

				app.reWriteFunction(confirm, {
					close: [
						function () {
							this.classList.add("closing");
						},
					],
				});

				// 按钮事件
				Object.values(confirm.node).forEach(node => {
					node.classList.add("disabled");
					node.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
					node.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
						e.stopPropagation();
						if (this.classList.contains("disabled")) {
							if (this.link === "cancel" && this.dataset.type === "endButton" && _status.event.endButton) {
								_status.event.endButton.custom();
								ui.confirm.close();
							}
							return;
						}
						this.parentNode.custom?.(this.link, this);
					});
				});

				// 重铸按钮 - 仅shousha样式在确认按钮旁显示gskills
				const isShousha = lib.config.extension_十周年UI_newDecadeStyle === "off";
				if (lib.config.phonelayout && ui.skills2?.skills?.length && isShousha) {
					confirm.skills2 = ui.skills2.skills.map(skill => {
						const item = document.createElement("div");
						item.link = skill;

						if (skill === "_recasting") {
							item.innerHTML = `<img draggable='false' src='${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/CZ.png'>`;
							item.style.backgroundImage = `url(${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/game_btn_bg2.png)`;
							item.style.transform = "scale(0.75)";
							item.style.setProperty("padding", "25px 10px", "important");
						} else {
							item.innerHTML = get.translation(skill);
						}

						item.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
							if (_status.event?.skill === "_recasting") return;
							e.stopPropagation();
							ui.click.skill(this.link);
							ui.updateSkillControl?.(game.me, true);
						});

						item.dataset.type = "skill2";
						confirm.insertBefore(item, confirm.firstChild);
						return item;
					});
				}

				confirm.update = () => {
					// 限定技按钮
					const isLimited = () => {
						const checkSkill = (skill, player) => skill && get.info(skill)?.limited && player === game.me;
						return checkSkill(_status.event?.skill, _status.event?.player) || checkSkill(_status.event?.getParent(2)?.skill, _status.event?.getParent(2)?.player) || checkSkill(_status.event?.getParent()?.skill, _status.event?.getParent()?.player);
					};

					confirm.node.ok.classList.toggle("xiandingji", isLimited());

					// 技能按钮更新 - 仅shousha样式处理
					if (lib.config.phonelayout && confirm.skills2 && isShousha) {
						if (_status.event.skill && _status.event.skill !== confirm.dataset.skill) {
							confirm.dataset.skill = _status.event.skill;
							confirm.skills2.forEach(item => item.remove());
							ui.updatec();
						} else if (!_status.event.skill && confirm.dataset.skill) {
							delete confirm.dataset.skill;
							confirm.skills2.forEach(item => confirm.insertBefore(item, confirm.firstChild));
							ui.updatec();
						}
					}

					ui.updateSkillControl?.(game.me, true);
				};

				return confirm;
			},

			handcardNumber() {
				ui.create.div(".settingButton", ui.arena, plugin.click.setting);
				const controls = ui.create.div(".lbtn-controls", ui.arena);
				ui.create.div(".lbtn-control", controls, "   ");
				ui.create.div(".lbtn-control", controls, "   ");

				const isRight = lib.config["extension_十周年UI_rightLayout"] === "on";
				const paixu = ui.create.div(isRight ? ".lbtn-paixu" : ".lbtn-paixu1", ui.arena);
				const jilu = ui.create.div(isRight ? ".latn-jilu" : ".latn-jilu1", ui.arena, ui.click.pause);

				paixu.onclick = () => {
					if (!window.paixuxx) {
						AutoSort.start();
						paixu.setBackgroundImage("extension/十周年UI/ui/assets/lbtn/uibutton/zidongpaixu.png");
						window.paixuxx = true;
					} else {
						AutoSort.stop();
						paixu.setBackgroundImage("extension/十周年UI/ui/assets/lbtn/uibutton/btn-paixu.png");
						window.paixuxx = false;
					}
				};

				const node = ui.create.div(isRight ? ".handcardNumber" : ".handcardNumber1", ui.arena).hide();
				node.node = {
					cardPicture: ui.create.div(isRight ? ".cardPicture" : ".cardPicture1", node),
					cardNumber: ui.create.div(isRight ? ".cardNumber" : ".cardNumber1", node),
				};

				node.updateCardnumber = function () {
					if (!game.me) return;

					const current = game.me.countCards("h") || 0;
					let limit = game.me.getHandcardLimit() || 0;

					let color = "#ffe9cd";
					if (limit > game.me.hp) color = "#20c520";
					if (limit < game.me.hp) color = "#ff1813";
					if (limit === Infinity) limit = "∞";

					this.node.cardNumber.innerHTML = `<font size="5.5">${current}</font><font size="5" face="xinwei">/<font color="${color}" size="4" face="shousha">${limit}</font>`;
					this.show();
					game.addVideo("updateCardnumber", null, { cardNumber: limit });
				};

				node.node.cardNumber.interval = setInterval(() => ui.handcardNumber?.updateCardnumber(), 1000);
				game.addVideo("createhandcardNumber");
				return node;
			},

			cardRoundTime() {
				const node = ui.create.div(".cardRoundNumber", ui.arena).hide();
				node.node = {
					cardPileNumber: ui.create.div(".cardPileNumber", node, showCardPileStatistics),
					roundNumber: ui.create.div(".roundNumber", node),
					time: ui.create.div(".time", node),
				};

				node.updateRoundCard = function () {
					const cardNum = ui.cardPile.childNodes.length || 0;
					const round = Math.max(1, game.roundNumber || 1);
					this.node.roundNumber.innerHTML = `<span>第${round}轮</span>`;
					this.setNumberAnimation(cardNum);
					this.show();
					game.addVideo("updateCardRoundTime", null, { cardNumber: cardNum, roundNumber: round });
				};

				node.setNumberAnimation = function (num, step) {
					const item = this.node.cardPileNumber;
					clearTimeout(item.interval);

					if (!item._num) {
						item.innerHTML = `<span>${num}</span>`;
						item._num = num;
					} else if (item._num !== num) {
						if (!step) step = 500 / Math.abs(item._num - num);
						item._num += item._num > num ? -1 : 1;
						item.innerHTML = `<span>${item._num}</span>`;
						if (item._num !== num) {
							item.interval = setTimeout(() => this.setNumberAnimation(num, step), step);
						}
					}
				};

				// 计时器
				ui.time4 = node.node.time;
				ui.time4.starttime = get.utc();
				ui.time4.interval = setInterval(() => {
					const num = Math.round((get.utc() - ui.time4.starttime) / 1000);
					const pad = n => (n < 10 ? `0${n}` : n);

					if (num >= 3600) {
						const h = Math.floor(num / 3600);
						const m = Math.floor((num - h * 3600) / 60);
						const s = num - h * 3600 - m * 60;
						ui.time4.innerHTML = `<span>${pad(h)}:${pad(m)}:${pad(s)}</span>`;
					} else {
						const m = Math.floor(num / 60);
						const s = num - m * 60;
						ui.time4.innerHTML = `<span>${pad(m)}:${pad(s)}</span>`;
					}
				}, 1000);

				game.addVideo("createCardRoundTime");
				return node;
			},
		},

		click: {
			paixu: sortHandCards,
			startAutoPaixu: () => AutoSort.start(),
			stopAutoPaixu: () => AutoSort.stop(),
			paidui: showCardPileStatistics,
			confirm: handleConfirm,
			setting() {},
		},

		showDistanceDisplay: () => DistanceDisplay.show(),
		updateDistanceDisplay: () => DistanceDisplay.update(),
		closeDistanceDisplay: () => DistanceDisplay.close(),
	};

	// 游戏开始时显示距离
	lib.announce.subscribe("gameStart", () => setTimeout(() => plugin.showDistanceDisplay(), 100));

	return plugin;
}
