app.import(function (lib, game, ui, get, ai, _status, app) {
	game.ui_identityShow_update = function () {
		var identityShow = game.ui_identityShow; /*图层1*/
		var identityShowx = game.ui_identityShowx; /*图层2 在图层1下面*/
		var str = "";
		if (lib.config.mode == "guozhan" || (lib.config.mode == "versus" && get.config("versus_mode") == "siguo") || (lib.config.mode == "versus" && get.config("versus_mode") == "jiange")) {
			var unknown = game.countPlayer(function (current) {
				return current.identity == "unknown";
			});
			var wei = game.countPlayer(function (current) {
				return current.identity == "wei";
			});
			var shu = game.countPlayer(function (current) {
				return current.identity == "shu";
			});
			var wu = game.countPlayer(function (current) {
				return current.identity == "wu";
			});
			var qun = game.countPlayer(function (current) {
				return current.identity == "qun";
			});
			var jin = game.countPlayer(function (current) {
				return current.identity == "jin";
			});
			var ye = game.countPlayer(function (current) {
				return current.identity == "ye";
			});
			var key = game.countPlayer(function (current) {
				return current.identity == "key";
			});
			if (unknown > 0) str += '<font color="#FFFFDE">' + get.translation("unknown") + "</font> x " + unknown + "  ";
			if (wei > 0) str += '<font color="#0075FF">' + get.translation("wei") + "</font> x " + wei + "  ";
			if (shu > 0) str += '<font color="#ff0000">' + get.translation("shu") + "</font> x " + shu + "  ";
			if (wu > 0) str += '<font color="#00ff00">' + get.translation("wu") + "</font> x " + wu + "  ";
			if (qun > 0) str += '<font color="#ffff00">' + get.translation("qun") + "</font> x " + qun + "  ";
			if (jin > 0) str += '<font color="#9e00ff">' + get.translation("jin") + "</font> x " + jin + "  ";
			if (ye > 0) str += '<font color="#9e00ff">' + get.translation("ye") + "</font> x " + ye + "  ";
			if (key > 0) str += '<font color="#9e00ff">' + get.translation("key") + "</font> x " + key + "  ";
		} else if (lib.config.mode == "versus" && get.config("versus_mode") == "two") {
			var enemy = game.countPlayer(function (current) {
				return current.isEnemyOf(game.me);
			});
			var friend = game.countPlayer(function (current) {
				return current.isFriendOf(game.me);
			});
			if (enemy > 0) str += '<font color="#ff0000">' + "虎" + "</font> x " + enemy + "  ";
			if (friend > 0) str += '<font color="#00ff00">' + "龙" + "</font> x " + friend + "  ";
		} else {
			var zhu = game.countPlayer(function (current) {
				return current.identity == "zhu" || current.identity == "rZhu" || current.identity == "bZhu";
			});
			var zhong = game.countPlayer(function (current) {
				return current.identity == "zhong" || current.identity == "rZhong" || current.identity == "bZhong" || current.identity == "mingzhong";
			});
			var fan = game.countPlayer(function (current) {
				return current.identity == "fan" || current.identity == "rYe" || current.identity == "bYe";
			});
			var nei = game.countPlayer(function (current) {
				return current.identity == "nei" || current.identity == "rNei" || current.identity == "bNei";
			});
			if (zhu > 0) str += '<font color="#ae5f35">' + get.translation("zhu") + "</font> x " + zhu + "  ";
			if (zhong > 0) str += '<font color="#e9d765">' + get.translation("zhong") + "</font> x " + zhong + "  ";
			if (fan > 0) str += '<font color="#87a671">' + get.translation("fan") + "</font> x " + fan + "  ";
			if (nei > 0) str += '<font color="#9581c4">' + get.translation("nei") + "</font> x " + nei;
		}

		str += "<br>" + get.translation(game.me.identity + "_win_option");

		/*尽量保持字体大小，行高一致，不然会产生偏移*/
		identityShow.innerHTML = '<span style="font-family:shousha; font-size: 17.0px;font-weight:500;text-align: right; line-height: 20px; color: #C1AD92;text-shadow:none;">' + str + "</span>"; /*图层1*/
		identityShowx.innerHTML = '<span style="font-family:shousha; font-size: 17.0px;font-weight:500;text-align: right; line-height: 20px; color: #2D241B; -webkit-text-stroke: 2.7px #322B20;text-shadow:none;">' + str + "</span>"; /*图层2*/
	};

	game.ui_identityShow_init = function () {
		if (game.ui_identityShow == undefined) {
			game.ui_identityShow = ui.create.div("", "身份加载中......");
			game.ui_identityShow.style.top = "1.9px"; /*图层1 上下位置如果需要改动 两个图层都要改*/
			game.ui_identityShow.style.left = "63.5px"; /*图层2 左右位置如果需要改动 两个图层都要改*/
			game.ui_identityShow.style["z-index"] = 4;
			if (lib.config.mode != "doudizhu") {
				ui.arena.appendChild(game.ui_identityShow);
			}
		}
		if (game.ui_identityShowx == undefined) {
			game.ui_identityShowx = ui.create.div("", "身份加载中......");
			game.ui_identityShowx.style.top = "1.9px"; /*图层2*/
			game.ui_identityShowx.style.left = "63.5px"; /*图层2*/
			game.ui_identityShowx.style["z-index"] = 3;
			if (lib.config.mode != "doudizhu") {
				ui.arena.appendChild(game.ui_identityShowx);
			}
		}
	};
	//标记下，以后出问题改监听
	lib.skill._SPZLX = {
		trigger: { player: ["gainAfter", "loseAfter"] },
		fixed: true,
		popup: false,
		forced: true,
		charlotte: true,
		priority: Infinity,
		filter: function (event, player) {
			return window.paixuxx == false && player == game.me && !player.hasSkillTag("noSortCard");
		},
		content: function () {
			var cards = player.getCards("hs");
			if (cards.length <= 1) return;
			cards.sort((a, b) => {
				// 位置排序
				var p1 = get.position(a);
				var p2 = get.position(b);
				if (p1 != p2) return p1 == "h" ? 1 : -1;
				// 卡牌排序
				if (a.name != b.name) return lib.sort.card(b.name, a.name);
				if (a.suit != b.suit) return lib.suit.indexOf(b.suit) - lib.suit.indexOf(a.suit);
				if (a.number != b.number) return b.number - a.number;
				if (a.nature != b.nature) return b.nature - a.nature;
				return parseInt(b.cardid) - parseInt(a.cardid);
			});
			if (window.dui && dui.queueNextFrameTick) {
				cards.forEach(card => player.node.handcards1.insertBefore(card, player.node.handcards1.firstChild));
				dui.queueNextFrameTick(dui.layoutHand, dui);
			} else {
				game.addVideo("lose", player, [get.cardsInfo(cards), [], []]);
				cards.forEach(card => card.goto(ui.special));
				player.directgain(cards, false);
			}
		},
	};
	lib.arenaReady.push(function () {
		//更新轮次
		var originUpdateRoundNumber = game.updateRoundNumber;
		game.updateRoundNumber = function () {
			originUpdateRoundNumber.apply(this, arguments);
			if (ui.cardRoundTime) ui.cardRoundTime.updateRoundCard();
		};
		/*聊天按钮模块*/
		if (lib.config.extension_十周年UI_LTAN == false) {
			var liaotian = ui.create.node("img");
			liaotian.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/liaotian.png";
			if (lib.config["extension_十周年UI_rightLayout"] == "on") {
				liaotian.style.cssText = "display: block;--w: 135px;--h: calc(var(--w) * 1019/1400);width: var(--w);height: var(--h);position: absolute;top: calc(100% - 97px);right: calc(100% - 129px);background-color: transparent;z-index:3";
			} else {
				//左手模式聊天按钮参数
				liaotian.style.cssText = "display: block; --w: 135px; --h: calc(var(--w) * 1019/1400); width: var(--w); height: var(--h); position: absolute; top: calc(100% - 97px); left: calc(100% - 129px); background-color: transparent; z-index: 3; transform: scaleX(-1);";
			}
			liaotian.onclick = function () {
				if (lib.config["extension_说话_enable"]) {
					game.showChatWordBackground();
				} else {
					game.showChatWordBackgroundX();
				}
			};
			document.body.appendChild(liaotian);
		}
		/*---------------------*/
		/*斗地主*/
		if (lib.config.mode == "doudizhu") {
			var jiaojia = ui.create.node("div");
			jiaojia.innerText = "本场叫价";
			jiaojia.style.cssText = "display: line;position: absolute;top: 5px;color: white;left: 56px;font-size:16.5px;font-family:shousha;text-shadow:-1.7px 0px 2.5px #2b1f19, 0px -1.7px 2.5px #2b1f19, 1.7px 0px 2.5px #2b1f19 ,0px 1.7px 2.5px #2b1f19; z-index:7; ";
			document.body.appendChild(jiaojia);
			var douzi = ui.create.node("div");
			douzi.innerText = get.translation((innerText = (num = ["300", "600", "900"]).randomGet(1)));
			douzi.style.cssText = "display: block;position: absolute;top: -7px;color: gold;left: 150px;font-size:21px;font-family:shousha;font-weight: 900; ";
			ui.arena.appendChild(douzi);
		}
		if (lib.config.mode == "identity" || lib.config.mode == "guozhan" || lib.config.mode == "versus" || lib.config.mode == "single" || lib.config.mode == "boss") {
			var translate = {};
			switch (lib.config.mode) {
				case "single":
					translate = {
						zhu: "击败对手",
						fan: "击败对手",
						undefined: "未选择阵营",
					};
					break;
				case "boss":
					translate = {
						zhu: "击败盟军",
						cai: "击败神祇",
						undefined: "未选择阵营",
					};
					break;
				case "guozhan":
					translate = {
						undefined: "未选择势力",
						unknown: "保持隐蔽",
						ye: "&nbsp;&nbsp;&nbsp;击败场上<br>所有其他角色",
						key: "&nbsp;&nbsp;&nbsp;击败所有<br>非键势力角色",
					};
					for (var i = 0; i < lib.group.length; i++) {
						translate[lib.group[i]] = "&nbsp;&nbsp;&nbsp;击败所有<br>非" + get.translation(lib.group[i]) + "势力角色";
					}
					break;
				case "versus":
					if (get.config("versus_mode") == "standard") {
						return;
					}
					if (get.config("versus_mode") == "two") {
						translate = {
							undefined: get.config("replace_character_two") ? "抢先击败敌人<br>所有上场角色" : "&nbsp;&nbsp;&nbsp;协同队友<br>击败所有敌人",
						};
					}
					if (get.config("versus_mode") == "jiange") {
						translate = {
							wei: "&nbsp;&nbsp;击败所有<br>蜀势力角色",
							shu: "&nbsp;&nbsp;击败所有<br>魏势力角色",
						};
					}
					if (get.config("versus_mode") == "siguo") {
						for (var i = 0; i < lib.group.length; i++) {
							translate[lib.group[i]] = "获得龙船或击败<br>非" + get.translation(lib.group[i]) + "势力角色";
						}
					}
					break;
				default:
					translate = {
						rZhu: "击败冷方主公<br>与所有野心家",
						rZhong: "保护暖方主公<br>击败冷方主公<br>与所有野心家",
						rYe: "联合冷方野心家<br>击败其他角色",
						rNei: "协助冷方主公<br>击败暖方主公<br>与所有野心家",
						bZhu: "击败暖方主公<br>与所有野心家",
						bZhong: "保护冷方主公<br>击败暖方主公<br>与所有野心家",
						bYe: "联合暖方野心家<br>击败其他角色",
						bNei: "协助暖方主公<br>击败冷方主公<br>与所有野心家",
						zhu: "推测场上身份<br>击败反贼内奸",
						zhong: "&nbsp;&nbsp;&nbsp;保护主公<br>取得最后胜利",
						fan: "找出反贼队友<br>全力击败主公",
						nei: "找出反贼忠臣<br>最后击败主公",
						mingzhong: "&nbsp;&nbsp;&nbsp;保护主公<br>取得最后胜利",
						undefined: "胜利条件",
					};
					break;
			}
			for (var i in translate) {
				lib.translate[i + "_win_option"] = translate[i];
			}
			game.ui_identityShow_init();
			setInterval(function () {
				game.ui_identityShow_update();
			}, 1000);
		}
		//右上角菜单栏
		var head = ui.create.node("img");
		head.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/SSCD/button.png";
		head.style.cssText = "display: block;--w: 130px;--h: calc(var(--w) * 1080/1434);width: var(--w);height: var(--h);position: absolute;bottom: calc(100% - 98px);left: calc(100% - 126.2px);background-color: transparent;z-index:1";
		document.body.appendChild(head);

		var head = ui.create.node("div");
		head.style.cssText = "display: block;width: 134px;height: 103px;position: absolute;top: 0px;right: -8px;background-color: transparent;z-index:1";
		head.onclick = function () {
			game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
			var popuperContainer = ui.create.div(".popup-container", { background: "rgb(0,0,0,0)" }, ui.window);
			popuperContainer.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
				event.stopPropagation();
				popuperContainer.delete(200);
			});
			var yemian = ui.create.div(".yemian", popuperContainer);
			var shezhi = ui.create.div(".shezhi", popuperContainer);
			shezhi.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				if (!ui.click.configMenu) return;
				game.closePopped();
				game.pause2();
				ui.click.configMenu();
				ui.system1.classList.remove("shown");
				ui.system2.classList.remove("shown");
			});
			var tuichu = ui.create.div(".tuichu", popuperContainer);
			tuichu.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");
				window.location.reload();
			});
			var taopao = ui.create.div(".taopao", popuperContainer);
			taopao.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");

				game.reload();
			});
			var touxiang = ui.create.div(".touxiang", popuperContainer);
			touxiang.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");

				game.over();
			});
			var tuoguan = ui.create.div(".tuoguan", popuperContainer);
			tuoguan.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/xuanzhe.mp3");

				ui.click.auto();
			});
		};
		document.body.appendChild(head);

		if (lib.config.mode == "identity" || lib.config.mode == "doudizhu" || lib.config.mode == "versus" || lib.config.mode == "guozhan") {
			/*左上角问号框*/
			var tipshow = ui.create.node("img");
			if (lib.config.mode == "doudizhu") tipshow.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/doudizhu.png";
			else tipshow.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/shenfen.png";
			tipshow.style.cssText = "display: block;--w: 400px;--h: calc(var(--w) * 279/2139);width: var(--w);height: var(--h);position: absolute;top: -1px;left:-45px;background-color: transparent;z-index:1";
			tipshow.onclick = function () {
				var popuperContainer = ui.create.div(".popup-container", ui.window);
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
				if (lib.config.mode == "identity") {
					if (game.me.identity == "zhu") {
						ui.create.div(".sfrwzhugong", popuperContainer);
					} else if (game.me.identity == "zhong") {
						ui.create.div(".sfrwchongchen", popuperContainer);
					} else if (game.me.identity == "fan") {
						ui.create.div(".sfrwfanzei", popuperContainer);
					} else if (game.me.identity == "nei") {
						ui.create.div(".sfrwneijian", popuperContainer);
					}
				}
				if (lib.config.mode == "doudizhu") {
					if (game.me.identity == "zhu") {
						ui.create.div(".sfrwdizhu", popuperContainer);
					} else if (game.me.identity == "fan") {
						ui.create.div(".sfrwnongmin", popuperContainer);
					}
				}
				if (lib.config.mode == "versus") {
					ui.create.div(".sfrwhu", popuperContainer);
				}
				if (lib.config.mode == "guozhan") {
					if (game.me.group == "unknown" || game.me.group == "undefined") {
						ui.create.div(".sfrwundefined", popuperContainer);
					} else if (game.me.group == "wei") {
						ui.create.div(".sfrwweiguo", popuperContainer);
					} else if (game.me.group == "shu") {
						ui.create.div(".sfrwshuguo", popuperContainer);
					} else if (game.me.group == "wu") {
						ui.create.div(".sfrwwuguo", popuperContainer);
					} else if (game.me.group == "qun") {
						ui.create.div(".sfrwqunxiong", popuperContainer);
					} else if (game.me.group == "jin") {
						ui.create.div(".sfrwjinguo", popuperContainer);
					} else if (game.me.group == "ye") {
						ui.create.div(".sfrwyexinjia", popuperContainer);
					}
				}
				popuperContainer.addEventListener("click", event => {
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
					popuperContainer.delete(200);
				});
			};
			document.body.appendChild(tipshow);
		}
	});

	var plugin = {
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
					return player == game.me;
				},
				content() {
					if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
				},
			};
		},
		precontent() {
			Object.assign(game.videoContent, {
				createCardRoundTime() {
					ui.cardRoundTime = plugin.create.cardRoundTime();
				},
				createhandcardNumber() {
					ui.handcardNumber = plugin.create.handcardNumber();
				},
				updateCardRoundTime(opts) {
					if (!ui.cardRoundTime) return;
					ui.cardRoundTime.node.roundNumber.innerHTML = "<span>第" + game.roundNumber + "轮</span>";
					ui.cardRoundTime.setNumberAnimation(opts.cardNumber);
				},
				updateCardnumber(opts) {
					if (!ui.handcardNumber) return;
					// ui.handcardNumber.setNumberAnimation(opts.cardNumber);
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

			ui.create.confirm = function (str, func) {
				if ((_status.mode == "huanle" && _status.event.parent.name == "chooseCharacter" && _status.event.parent.step == "6" && _status.event.name == "chooseButton") || (lib.config["extension_无名补丁_xindjun"] && get.playerNumber() == "8" && get.mode() == "identity" && _status.mode == "normal" && _status.event.parent.name == "chooseCharacter" && _status.event.parent.step == "1" && _status.event.name == "chooseButton")) {
					var node = ui.dialog.querySelector(".selected");
					var head = ui.create.div(".ok23", node);
					head.ondblclick = function (e) {
						e.stopPropagation();
						ui.click.ok();
					};
					return;
				}
				var confirm = ui.confirm;
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
		},
		create: {
			control() {},
			confirm() {
				//确定文本
				var confirm = ui.create.control("<span></span>", "cancel");
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
				if (_status.event.name == "gameDraw") confirm.node.ok.classList.add("huan");
				else if (_status.event.name == "chooseToDiscard" && _status.event.parent.name == "phaseDiscard") confirm.node.ok.classList.add("qi");
				else if ((_status.mode == "huanle" && _status.event.parent.step == "7") || (get.mode() == "identity" && _status.mode == "normal" && _status.event.parent.name == "chooseCharacter" && _status.event.parent.step == "2")) confirm.node.ok.classList.add("group");
				else confirm.node.ok.classList.add("primary");
				if ((_status.mode == "huanle" && _status.event.parent.step == "7") || (get.mode() == "identity" && _status.mode == "normal" && _status.event.parent.name == "chooseCharacter" && _status.event.parent.step == "2")) confirm.node.cancel.remove();
				else confirm.node.cancel.classList.add("primary2");
				confirm.node.cancel.innerHTML = "<image style=width: 80px height 15px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/QX.png>";

				// confirm.node.cancel2.classList.add('primary2');

				confirm.custom = plugin.click.confirm;
				app.reWriteFunction(confirm, {
					close: [
						function () {
							this.classList.add("closing");
						},
					],
				});
				for (var k in confirm.node) {
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
					var skills = ui.skills2.skills;
					confirm.skills2 = [];
					for (var i = 0; i < skills.length; i++) {
						var item = document.createElement("div");
						item.link = skills[i];

						if (skills[i] == "_recasting") {
							item.innerHTML = "<img style=width:70px height:15px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/CZ.png>";
						} else {
							item.innerHTML = get.translation(skills[i]);
						}

						item.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
							e.stopPropagation();
							ui.click.skill(this.link);
						});

						item.dataset.type = "skill2"; /*
                         if(ui.updateSkillControl)   ui.updateSkillControl(game.me, true);*/
						confirm.insertBefore(item, confirm.firstChild);
					}
				}

				confirm.update = function () {
					if (confirm.skills2) {
						if (_status.event.skill && _status.event.skill !== confirm.dataset.skill) {
							confirm.dataset.skill = _status.event.skill;
							confirm.skills2.forEach(function (item) {
								item.remove();
							});
							ui.updatec();
						} else if (!_status.event.skill && confirm.dataset.skill) {
							delete confirm.dataset.skill;
							confirm.skills2.forEach(function (item) {
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
				var node3 = ui.create.div(".settingButton", ui.arena, plugin.click.setting);
				var node2 = ui.create.div(".lbtn-controls", ui.arena);
				ui.create.div(".lbtn-control", node2, "   ");
				ui.create.div(".lbtn-control", node2, "   ");
				/*ui.create.div('.lbtn-control1', node2, plugin.click.paixu);*/
				//左手模式记录和牌序按钮
				if (lib.config["extension_十周年UI_rightLayout"] == "on") {
					var paixuauto = ui.create.div(".lbtn-paixu", ui.arena);
					var jilu = ui.create.div(".latn-jilu", ui.arena, ui.click.pause);
				} else {
					var paixuauto = ui.create.div(".lbtn-paixu1", ui.arena);
					var jilu = ui.create.div(".latn-jilu1", ui.arena, ui.click.pause);
				}
				paixuauto.onclick = function () {
					if (window.paixuxx == false) {
						plugin.click.paixu();
						paixuauto.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/uibutton/btn-paixu.png");
						window.paixuxx = true;
					} else {
						plugin.click.paixu();
						paixuauto.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/uibutton/zidongpaixu.png");
						window.paixuxx = false;
					}
				};
			
				//左手模式同上继续加一个显示手牌牌量新的按钮css
				if (lib.config["extension_十周年UI_rightLayout"] == "on") {
					var node = ui.create.div(".handcardNumber", ui.arena).hide();
					node.node = {
						cardPicture: ui.create.div(".cardPicture", node),
						cardNumber: ui.create.div(".cardNumber", node),
					};
				} else {
					var node = ui.create.div(".handcardNumber1", ui.arena).hide();
					node.node = {
						cardPicture: ui.create.div(".cardPicture1", node),
						cardNumber: ui.create.div(".cardNumber1", node),
					};
				}
				//手牌显示·---//
				node.updateCardnumber = function () {
					if (!game.me) return;
					var cardNumber2 = game.me.countCards("h") || 0;
					var cardNumber = game.me.getHandcardLimit() || 0;
					var numbercolor = "white";
					if (cardNumber2 > cardNumber) numbercolor = "white";
					if (cardNumber == Infinity) cardNumber = "∞";
					if (cardNumber > game.me.hp) numbercolor = "#20c520";
					if (cardNumber < game.me.hp) numbercolor = "#ff1813";
					if (cardNumber == game.me.hp) numbercolor = "#ffe9cd";
					this.node.cardNumber.innerHTML = "<span>" + "<font size=5.5 >" + cardNumber2 + "</font>" + '<font size=5 face="xinwei">' + "/" + "<font color=" + numbercolor + ' size=4 face="shousha">' + cardNumber + "</font>" + "</span>";
					//      this.setNumberAnimation(cardNumber);
					this.show();

					game.addVideo("updateCardnumber", null, {
						cardNumber: cardNumber,
					});
				};
				node.node.cardNumber.interval = setInterval(function () {
					ui.handcardNumber.updateCardnumber();
				}, 1000);
				//    game.addVideo('createCardRoundTime');
				game.addVideo("createhandcardNumber");
				return node;
			},
			cardRoundTime: function () {
				var node = ui.create.div(".cardRoundNumber", ui.arena).hide();
				node.node = {
					/*cardPileNumber: ui.create.div('.cardPileNumber', node),*/
					//牌堆可点击
					cardPileNumber: ui.create.div(".cardPileNumber", node, plugin.click.paidui),
					roundNumber: ui.create.div(".roundNumber", node),
					time: ui.create.div(".time", node),
				};

				node.updateRoundCard = function () {
					var cardNumber = ui.cardPile.childNodes.length || 0;
					var roundNumber = game.roundNumber || 0;
					this.node.roundNumber.innerHTML = "<span>第" + game.roundNumber + "轮</span>";
					this.setNumberAnimation(cardNumber);
					this.show();
					game.addVideo("updateCardRoundTime", null, {
						cardNumber: cardNumber,
						roundNumber: roundNumber,
					});
				};

				node.setNumberAnimation = function (num, step) {
					var item = this.node.cardPileNumber;
					clearTimeout(item.interval);
					if (!item._num) {
						item.innerHTML = "<span>" + num + "</span>";
						item._num = num;
					} else {
						if (item._num !== num) {
							if (!step) step = 500 / Math.abs(item._num - num);
							if (item._num > num) item._num--;
							else item._num++;
							item.innerHTML = "<span>" + item._num + "</span>";
							if (item._num !== num) {
								item.interval = setTimeout(function () {
									node.setNumberAnimation(num, step);
								}, step);
							}
						}
					}
				};

				ui.time4 = node.node.time;
				ui.time4.starttime = get.utc();
				ui.time4.interval = setInterval(function () {
					var num = Math.round((get.utc() - ui.time4.starttime) / 1000);
					if (num >= 3600) {
						var num1 = Math.floor(num / 3600);
						var num2 = Math.floor((num - num1 * 3600) / 60);
						var num3 = num - num1 * 3600 - parseInt(num2) * 60;
						if (num1 < 10) {
							num1 = "0" + num1.toString();
						}
						if (num2 < 10) {
							num2 = "0" + num2.toString();
						}
						if (num3 < 10) {
							num3 = "0" + num3.toString();
						}
						ui.time4.innerHTML = "<span>" + num1 + ":" + num2 + ":" + num3 + "</span>";
					} else {
						var num1 = Math.floor(num / 60);
						var num2 = num - num1 * 60;
						if (num1 < 10) {
							num1 = "0" + num1.toString();
						}
						if (num2 < 10) {
							num2 = "0" + num2.toString();
						}
						ui.time4.innerHTML = "<span>" + num1 + ":" + num2 + "</span>";
					}
				}, 1000);
				game.addVideo("createCardRoundTime");
				return node;
			},
		},
		click: {
			setting: function () {
				if (lib.extensionMenu.extension_概念武将.zyile_skin_Menu) {
					lib.extensionMenu.extension_概念武将.zyile_skin_Menu.onclick();
				} else {
					// head.remove()
					game.closePopped();
					game.pause2();
					ui.click.configMenu();
					ui.system1.classList.remove("shown");
					ui.system2.classList.remove("shown");
				}
			},

			paixu: function () {
				if (!game.me || game.me.hasSkillTag("noSortCard")) return;
				var cards = game.me.getCards("hs");
				var sort2 = function (b, a) {
					if (a.name != b.name) return lib.sort.card(a.name, b.name);
					else if (a.suit != b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
					else return a.number - b.number;
				};
				if (cards.length > 1) {
					cards.sort(sort2);
					cards.forEach(function (i, j) {
						game.me.node.handcards1.insertBefore(cards[j], game.me.node.handcards1.firstChild);
					});
					dui.queueNextFrameTick(dui.layoutHand, dui);
				}
			},
			//可点击函数（牌堆）
			paidui: function () {
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

			confirm: function (link, target) {
				if (link === "ok") {
					ui.click.ok(target);
				} else if (link === "cancel") {
					ui.click.cancel(target);
				} else if (target.custom) {
					target.custom(link);
				}
			},
		},
		compare: {
			type: function (a, b) {
				if (a === b) return 0;
				var types = ["basic", "trick", "delay", "equip"].addArray([a, b]);
				return types.indexOf(a) - types.indexOf(b);
			},
			name: function (a, b) {
				if (a === b) return 0;
				return a > b ? 1 : -1;
			},
			nature: function (a, b) {
				if (a === b) return 0;
				var nature = [undefined, "fire", "thunder"].addArray([a, b]);
				return nature.indexOf(a) - nature.indexOf(b);
			},
			suit: function (a, b) {
				if (a === b) return 0;
				var suit = ["diamond", "heart", "club", "spade"].addArray([a, b]);
				return suit.indexOf(a) - suit.indexOf(b);
			},
			number: function (a, b) {
				return a - b;
			},
		},
	};
	return plugin;
});
