app.import(function(lib, game, ui, get, ai, _status, app) {
	lib.arenaReady.push(function() {
		//更新轮次
		var originUpdateRoundNumber = game.updateRoundNumber;
		game.updateRoundNumber = function() {
			originUpdateRoundNumber.apply(this, arguments);
			if (ui.cardRoundTime) ui.cardRoundTime.updateRoundCard();
		};

		var head = ui.create.node("ismg");
		head.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/yinying.png";
		head.style.cssText =
			"display: block;width: 100%;height: 30%;position: absolute;bottom: 0px;background-color: transparent;z-index:-1";
		document.body.appendChild(head);

		var head = ui.create.node("img");
		head.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/CD/new_buttonhs3.png";
		head.style.cssText =
			"display: block;--w: 56px;--h: calc(var(--w) * 74/71);width: var(--w);height: var(--h);position: absolute;bottom: 13%;left: 53px;right: auto;background-color: transparent;z-index:1";
		head.onclick = function() {
			head.style.transform = "scale(0.95)";
		};
		document.body.appendChild(head);

		var head = ui.create.node("div");
		head.style.cssText =
			"display: block;--w: 56px;--h: calc(var(--w) * 74/71);width: var(--w);height: var(--h);position: absolute;bottom: 13%;left: 53px;right: auto;background-color: transparent;z-index:1";
		head.onclick = function() {
			game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/click.mp3");
			var popuperContainer = ui.create.div(".popup-container", {
				background: "rgb(0,0,0,0)"
			}, ui.window);
			popuperContainer.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/back.mp3");

				event.stopPropagation();
				popuperContainer.delete(200);
			});
			var HOME = ui.create.div(".buttonyjcm", popuperContainer);
			/*for(let i in ui.system1){
			    let control=ui.create.div(".controls", HOME);
			    let Control=ui.system1[i];
			    console.log(Control.name)
			    control.setBackgroundImage('extension/十周年UI/shoushaUI/lbtn/images/button/'+Control.name+'.png');
			    control.addEventListener("click", event=>Control.click);
			};*/
			var SZ = ui.create.div(".controls", HOME);
			SZ.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/button/button_sz.png");
			SZ.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");

				if (!ui.click.configMenu) return;
				game.closePopped();
				game.pause2();
				ui.click.configMenu();
				ui.system1.classList.remove("shown");
				ui.system2.classList.remove("shown");
			});
			var BJ = ui.create.div(".controls", HOME);
			BJ.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/button/button_bj.png");
			BJ.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				var Backgrounds = ["一将成名"];
				ui.background.setBackgroundImage(
					"extension/十周年UI/shoushaUI/lbtn/images/background/" + Backgrounds
					.randomGet() + ".jpg");
			});
			var TG = ui.create.div(".controls", HOME);
			TG.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/button/button_tg.png");
			TG.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");

				ui.click.auto();
			});
			var TC = ui.create.div(".controls", HOME);
			TC.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/button/button_tc.png");
			TC.addEventListener("click", event => {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				window.location.reload();
			});
		};
		document.body.appendChild(head);

		var head = ui.create.node("img");
		head.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/zhenglihs.png";
		//左手整理手牌按钮位置
		if (lib.config["extension_十周年UI_rightLayout"] == "on") {
			head.style.cssText =
				"display: block;--w: 100px;--h: calc(var(--w) * 81/347);width: var(--w);height: var(--h);position: absolute;top: calc(100% - 31px);left: calc(100% - 350px);background-color: transparent;z-index:2";
		} else {
			head.style.cssText =
				"display: block;--w: 88px;--h: calc(var(--w) * 81/247);width: var(--w);height: var(--h);position: absolute;top: calc(100% - 33px);right: calc(100% - 367.2px);background-color: transparent;z-index:2;";
		}
		head.onclick = function() {
			//head.onclick=ui.click.sortCard;
			if (!game.me || game.me.hasSkillTag("noSortCard")) return;
			var cards = game.me.getCards("hs");
			var sort2 = function(b, a) {
				if (a.name != b.name) return lib.sort.card(a.name, b.name);
				else if (a.suit != b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
				else return a.number - b.number;
			};
			if (cards.length > 1) {
				cards.sort(sort2);
				cards.forEach(function(i, j) {
					game.me.node.handcards1.insertBefore(cards[j], game.me.node.handcards1
						.firstChild);
				});
				dui.queueNextFrameTick(dui.layoutHand, dui);
			}
		};
		document.body.appendChild(head);
	});
	var plugin = {
		name: "lbtn",
		filter() {
			return !["chess", "tafang"].contains(get.mode());
		},
		content(next) {
			lib.skill._uicardupdate = {
				trigger: {
					player: "phaseJieshuBegin"
				},
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
					ui.cardRoundTime.node.roundNumber.innerHTML = "<span>第" + game.roundNumber +
						"轮</span>";
					ui.cardRoundTime.setNumberAnimation(opts.cardNumber);
				},
				updateCardnumber(opts) {
					if (!ui.handcardNumber) return;
					// ui.handcardNumber.setNumberAnimation(opts.cardNumber);
				},
			});
			app.reWriteFunction(ui.create, {
				me: [
					function() {
						plugin.create.control();
					},
					null,
				],
				arena: [
					null,
					function() {
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
					function() {
						if (ui.cardRoundTime) {
							ui.cardRoundTime.updateRoundCard();
						}
					},
				],
			});
			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					function(res, config, map) {
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

			ui.create.confirm = function(str, func) {
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
				var confirm = ui.create.control("<span>确定</span>", "cancel");
				confirm.classList.add("lbtn-confirm");
				confirm.node = {
					ok: confirm.firstChild,
					cancel: confirm.lastChild,
				};
				if (_status.event.endButton) {
					_status.event.endButton.close();
					//	delete event.endButton;
				}
				confirm.node.ok.link = "ok";
				confirm.node.ok.classList.add("primary");
				confirm.node.cancel.classList.add("primary2");
				confirm.custom = plugin.click.confirm;
				app.reWriteFunction(confirm, {
					close: [
						function() {
							this.classList.add("closing");
						},
					],
				});
				for (var k in confirm.node) {
					confirm.node[k].classList.add("disabled");
					confirm.node[k].removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui
						.click.control);
					confirm.node[k].addEventListener(lib.config.touchscreen ? "touchend" : "click",
						function(e) {
							e.stopPropagation();
							if (this.classList.contains("disabled")) {
								if (this.link === "cancel" && this.dataset.type === "endButton" &&
									_status.event.endButton) {
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

				if (ui.skills2 && ui.skills2.skills.length) {
					var skills = ui.skills2.skills;
					confirm.skills2 = [];
					for (var i = 0; i < skills.length; i++) {
						var item = document.createElement("div");
						item.link = skills[i];
						item.innerHTML = get.translation(skills[i]);
						item.addEventListener(lib.config.touchscreen ? "touchend" : "click", function(e) {
							e.stopPropagation();
							ui.click.skill(this.link);
						});

						item.dataset.type = "skill2";
						if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
						/*
						           confirm.insertBefore(item, confirm.firstChild);*/
					}
				}

				confirm.update = function() {
					if (confirm.skills2) {
						if (_status.event.skill && _status.event.skill !== confirm.dataset.skill) {
							confirm.dataset.skill = _status.event.skill;
							confirm.skills2.forEach(function(item) {
								item.remove();
							});
							ui.updatec();
						} else if (!_status.event.skill && confirm.dataset.skill) {
							delete confirm.dataset.skill;
							confirm.skills2.forEach(function(item) {
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

				/*ui.create.div('.lbtn-controls', ui.arena);*/
				//-------原版---------//
				//左手模式加开关
				if (lib.config["extension_十周年UI_rightLayout"] == "on") {
					if (lib.config.extension_十周年UI_XPJ == "on") {
						var node5 = ui.create.div(".huanfuButton", ui.arena, plugin.click.huanfu);
						var node2 = ui.create.div(".jiluButton", ui.arena, ui.click.pause);
						//-------------------//
					} else {
						//-------新版----------//
						var node6 = ui.create.div(".huanfuButton_new", ui.arena, plugin.click.huanfu);
						var node7 = ui.create.div(".jiluButton_new", ui.arena, ui.click.pause);
						var node8 = ui.create.div(".meiguiButton_new", ui.arena);
						var node9 = ui.create.div(".xiaolianButton_new", ui.arena);
						//---------------------//
					}
				} else {
					//-------新版----------//
					var node6 = ui.create.div(".huanfuButton_new1", ui.arena, plugin.click.huanfu);
					var node7 = ui.create.div(".jiluButton_new1", ui.arena, ui.click.pause);
					var node8 = ui.create.div(".meiguiButton_new1", ui.arena, plugin.click.meigui);
					var node9 = ui.create.div(".xiaolianButton_new1", ui.arena, plugin.click.xiaolian);
					//---------------------//
				}
				var node4 = ui.create.div(".tuoguanButton", ui.arena, ui.click.auto);
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
				//结束
				node.updateCardnumber = function() {
					if (!game.me) return;

					var cardNumber2 = game.me.countCards("h") || 0;
					var cardNumber = game.me.getHandcardLimit() || 0;
					var numbercolor = "white";
					if (cardNumber2 > cardNumber) numbercolor = "red";
					if (cardNumber == Infinity) cardNumber = "∞";
					this.node.cardNumber.innerHTML = "<span>" + "<font color=" + numbercolor + " > " +
						cardNumber2 + "</font>" +
						'<sp style="font-size:20px; font-family:yuanli; color:#FFFCF5;">' + " / " +
						"</sp>" + cardNumber + "</span>"; /*手牌数参数*/
					//      this.setNumberAnimation(cardNumber);
					this.show();

					game.addVideo("updateCardnumber", null, {
						cardNumber: cardNumber,
					});
				};
				node.node.cardNumber.interval = setInterval(function() {
					ui.handcardNumber.updateCardnumber();
				}, 1000);
				//    game.addVideo('createCardRoundTime');
				game.addVideo("createhandcardNumber");
				return node;
			},
			cardRoundTime() {
				var node = ui.create.div(".cardRoundNumber", ui.arena).hide();
				node.node = {
					cardPileNumber: ui.create.div(".cardPileNumber", node),
					roundNumber: ui.create.div(".roundNumber", node),
					time: ui.create.div(".time", node),
				};

				node.updateRoundCard = function() {
					var cardNumber = ui.cardPile.childNodes.length || 0;
					var roundNumber = game.roundNumber || 0;
					this.node.roundNumber.innerHTML = "<span>" + game.roundNumber + "轮</span>";
					this.setNumberAnimation(cardNumber);
					this.show();
					game.addVideo("updateCardRoundTime", null, {
						cardNumber: cardNumber,
						roundNumber: roundNumber,
					});
				};

				node.setNumberAnimation = function(num, step) {
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
								item.interval = setTimeout(function() {
									node.setNumberAnimation(num, step);
								}, step);
							}
						}
					}
				};


				ui.time4 = node.node.time;
				ui.time4.starttime = get.utc();
				ui.time4.interval = setInterval(function() {
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
			huanfu() {
				game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/huanfu.mp3");
				window.zyile_charactercard ? window.zyile_charactercard(player, false) : ui.click
					.charactercard(game.me.name, game.zhu, lib.config.mode == "mode_guozhan" ? "guozhan" :
						true);
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
		compare: {
			type(a, b) {
				if (a === b) return 0;
				var types = ["basic", "trick", "delay", "equip"].addArray([a, b]);
				return types.indexOf(a) - types.indexOf(b);
			},
			name(a, b) {
				if (a === b) return 0;
				return a > b ? 1 : -1;
			},
			nature(a, b) {
				if (a === b) return 0;
				var nature = [undefined, "fire", "thunder"].addArray([a, b]);
				return nature.indexOf(a) - nature.indexOf(b);
			},
			suit(a, b) {
				if (a === b) return 0;
				var suit = ["diamond", "heart", "club", "spade"].addArray([a, b]);
				return suit.indexOf(a) - suit.indexOf(b);
			},
			number(a, b) {
				return a - b;
			},
		},
	};
	return plugin;
});