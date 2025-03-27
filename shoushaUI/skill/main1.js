app.import(function (lib, game, ui, get, ai, _status, app) {
	//console.log('kk')
	var plugin = {
		name: "skill",
		filter: function () {
			return !["chess", "tafang", "stone", "connect"].contains(get.mode());
		},
		content: function (next) {
			app.waitAllFunction(
				[
					function (next) {
						lib.translate.zhangba_skill = "丈八";
						lib.translate.txhj_dinglanyemingzhu = "夜明珠";
						lib.translate.jlsgqs_muniu = "木牛";

						if (lib.device == "ios" || lib.device == "android") {
							lib.init.css(lib.assetURL + "extension/" + app.name + "/" + plugin.name, "main1", next);
						} else {
							lib.init.css(lib.assetURL + "extension/" + app.name + "/" + plugin.name, "main1_window", next);
						}
					},
				],
				next
			);
		},
		precontent: function () {
			Object.assign(ui.create, {
				skills: function (skills) {
					ui.skills = plugin.createSkills(skills, ui.skills);
					ui.skillControl.update();
					return ui.skills;
				},
				skills2: function (skills) {
					ui.skills2 = plugin.createSkills(skills, ui.skills2);
					ui.skillControl.update();
					return ui.skills2;
				},
				skills3: function (skills) {
					ui.skills3 = plugin.createSkills(skills, ui.skills3);
					ui.skillControl.update();
					return ui.skills3;
				},

				skillControl(clear) {
					if (!ui.skillControl) {
						//左手模式添加新的技能css布局
						if (lib.config["extension_十周年UI_rightLayout"] == "on") {
							var node = ui.create.div(".skill-control", ui.arena);
							node.node = {
								enable: ui.create.div(".enable", node),
								trigger: ui.create.div(".trigger", node),
							};
							for (var i in plugin.controlElement) {
								node[i] = plugin.controlElement[i];
							}
							ui.skillControl = node;
							//复制一遍
						} else {
							var node = ui.create.div(".skill-controlzuoshou", ui.arena);
							node.node = {
								enable: ui.create.div(".enable", node),
								trigger: ui.create.div(".trigger", node),
							};
							for (var i in plugin.controlElement) {
								node[i] = plugin.controlElement[i];
							}
							ui.skillControl = node;
						}
						//美化结束
					}
					if (clear) {
						ui.skillControl.node.enable.innerHTML = "";
						ui.skillControl.node.trigger.innerHTML = "";
					}
					return ui.skillControl;
				},
			});
			Object.assign(ui, {
				updateSkillControl: function (player, clear) {
					var eSkills = player.getSkills("e", true, false).slice(0);
					var skills = app.get.playerSkills(player, true);
					if (ui.skills2 && ui.skills2.skills.length) {
						var gSkills = ui.skills2.skills;
						try {
							gSkills.remove("_chongzhu");
						} catch (e) {}
					}
					skills.addArray(
						player.invisibleSkills.slice(0).filter(function (skill) {
							var info = get.info(skill);
							return info.enable;
						})
					);
					for (var i = 0; i < skills.length; i++) {
						var info = lib.skill[skills[i]];
						if (!info || (info.zhuSkill && !player.hasZhuSkill(skills[i]))) {
							skills.splice(i--, 1);
						}
					}

					if (player === game.me) {
						var skillControl = ui.create.skillControl(clear);
						skillControl.add(skills, eSkills);
						if (gSkills) skillControl.add(gSkills);
						skillControl.update();
						game.addVideo("updateSkillControl", player, clear);
					}

					var juexingji = {};
					var xiandingji = {};
					app.get.playerSkills(player).forEach(function (skill) {
						var info = lib.skill[skill];
						if (!info) return;
						if (info.zhuSkill && !player.hasZhuSkill(skill)) return;
						//这里修改1{这里是分离转换技，限定技，觉醒技，使命技
						if (info.zhuanhuanji || info.limited || (info.intro && info.intro.content === "limited")) {
							xiandingji[skill] = player.awakenedSkills.contains(skill);
						}
						if (info.juexingji || info.dutySkill) juexingji[skill] = player.awakenedSkills.contains(skill);
						//这里结束1}
					});
					plugin.updateSkillMarks(player, xiandingji, juexingji);
				},
			});

			lib.element.player.inits = [].concat(lib.element.player.inits || []).concat(player => {
				var juexingji = {};
				var xiandingji = {};
				app.get.playerSkills(player).forEach(function (skill) {
					var info = lib.skill[skill];
					if (!info) return;
					if (info.zhuSkill && !player.hasZhuSkill(skill)) return;
					//这里修改1{这里是分离转换技，限定技，觉醒技，使命技
					if (info.zhuanhuanji || info.limited || (info.intro && info.intro.content === "limited")) {
						xiandingji[skill] = player.awakenedSkills.contains(skill);
					}
					if (info.juexingji || info.dutySkill) juexingji[skill] = player.awakenedSkills.contains(skill);
					//这里结束1}
				});
				plugin.updateSkillMarks(player, xiandingji, juexingji);
			});

			app.reWriteFunction(lib.element.player, {
				addSkill: [
					null,
					function () {
						ui.updateSkillControl(this, true);
					},
				],
				removeSkill: [
					null,
					function () {
						ui.updateSkillControl(this, true);
					},
				],
				addSkillTrigger: [
					null,
					function () {
						ui.updateSkillControl(this, true);
					},
				],
				removeSkillTrigger: [
					null,
					function () {
						ui.updateSkillControl(this, true);
					},
				],
				awakenSkill: [
					null,
					function () {
						ui.updateSkillControl(this);
					},
				],
				restoreSkill: [
					null,
					function () {
						ui.updateSkillControl(this);
					},
				],
			});
			app.reWriteFunction(lib.element.control, {
				close: [
					null,
					function () {
						if (this.classList.contains("skillControl")) {
							ui.skillControl.update();
						}
					},
				],
			});

			app.reWriteFunction(game, {
				loop: [
					function () {
						if (game.boss && !ui.skillControl) {
							ui.updateSkillControl(game.me);
						}
						if (ui.skillControl) {
							ui.skillControl.update();
						}
					},
					null,
				],
				/*   swapControl: [null, function () {
                     ui.updateSkillControl(game.me, true);
                   }],
                   swapPlayer: [null, function () {
                     ui.updateSkillControl(game.me, true);
                   }],*/
			});

			Object.assign(game.videoContent, {
				updateSkillControl: function (player, clear) {
					ui.updateSkillControl(player, clear);
				},
			});
			ui.skillControlArea = ui.create.div();
		},
		controlElement: {
			add: function (skill, eSkills) {
				//-----------//
				var addSpan = function (node, num) {
					var numArray = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳", "㉑", "㉒", "㉓"];

					var text = document.createElement("span");
					text.classList.add("numText");
					var numTextChild = document.createElement("span");
					//数字阴影
					numTextChild.classList.add("numText-child");
					numTextChild.innerText = numArray[num];
					node.appendChild(numTextChild);
					node.appendChild(text);
					text.innerText = numArray[num];
				};
				//--------------//
				//白板锁
				var baibanSkillBlocker = [];
				var fengyinSkillBlocker = [];
				if (game.me.hasSkill("baiban")) {
					baibanSkillBlocker = game.me.getSkills(null, false, false).filter(skill => lib.skill.baiban.skillBlocker(skill, game.me));
					baibanSkillBlocker.sort();

					baibanSkillBlocker.forEach(function (item) {
						if (Array.isArray(skill) && !skill.contains(item)) {
							skill.unshift(item);
						}
					});
				}
				//封印锁
				if (game.me.hasSkill("fengyin")) {
					fengyinSkillBlocker = game.me.getSkills(null, false, false).filter(skill => lib.skill.fengyin.skillBlocker(skill, game.me));
					fengyinSkillBlocker.sort();
					fengyinSkillBlocker.forEach(function (item) {
						if (Array.isArray(skill) && !skill.contains(item)) {
							skill.unshift(item);
						}
					});
				}

				if (Array.isArray(skill)) {
					var node = this;
					skill.forEach(function (item) {
						node.add(item, eSkills);
					});
					return this;
				}

				var self = this;
				var skills = game.expandSkills([skill]).map(function (item) {
					return app.get.skillInfo(item);
				});

				var hasSame = false;
				var enableSkills = skills.filter(function (item) {
					if (item.type !== "enable") return false;
					if (item.name === skills[0].name) hasSame = true;
					return true;
				});

				if (!hasSame) enableSkills.unshift(skills[0]);
				var showSkills = enableSkills.length ? enableSkills : skills;

				showSkills.forEach(function (item) {
					//技能锁，不需要加数字
					var showAddSpan = true;
					if (game.me.hasSkill("baiban") && baibanSkillBlocker && baibanSkillBlocker.contains(item.id)) {
						showAddSpan = false;
					}
					if (game.me.hasSkill("fengyin") && fengyinSkillBlocker && fengyinSkillBlocker.contains(item.id)) {
						showAddSpan = false;
					}
					if (game.me.shixiaoedSkills.contains(item.id)) {
						showAddSpan = false;
					}

					//势力技能筛选
					if (lib.skill[item.id].filter) {
						if ((lib.skill[item.id].filter + "").indexOf("player.group") != -1) {
							var str = (lib.skill[item.id].filter + "").substr((lib.skill[item.id].filter + "").indexOf("player.group"));
							if (str.indexOf("'") != -1) {
								str = str.substr(str.indexOf("'") + 1);

								if (str.indexOf("'") != -1) {
									var group = str.substr(0, str.indexOf("'"));
									if (group != game.me.group) {
										return;
									}
								}
							}
							if (str.indexOf('"') != -1) {
								str = str.substr(str.indexOf('"') + 1);

								if (str.indexOf('"') != -1) {
									var group = str.substr(0, str.indexOf('"'));
									if (group != game.me.group) {
										return;
									}
								}
							}
						}
					}

					if (lib.skill[item.id].viewAsFilter) {
						if ((lib.skill[item.id].viewAsFilter + "").indexOf("player.group") != -1) {
							var str = (lib.skill[item.id].viewAsFilter + "").substr((lib.skill[item.id].viewAsFilter + "").indexOf("player.group"));
							if (str.indexOf("'") != -1) {
								str = str.substr(str.indexOf("'") + 1);

								if (str.indexOf("'") != -1) {
									var group = str.substr(0, str.indexOf("'"));
									if (group != game.me.group) {
										return;
									}
								}
							}
							if (str.indexOf('"') != -1) {
								str = str.substr(str.indexOf('"') + 1);

								if (str.indexOf('"') != -1) {
									var group = str.substr(0, str.indexOf('"'));
									if (group != game.me.group) {
										return;
									}
								}
							}
						}
					}
					//势力技能筛选

					var node = self.querySelector('[data-id="' + item.id + '"]');
					if (node) return;
					if (item.type === "enable") {
						if (lib.noskillControl && lib.noskillControl.contains(item.id)) return;
						// if(item.id=='lianhuan5' || item.id=='ollianhuan5' || item.id=='lianhuan2' || item.id=='twjichou_give' )return;
						let name = get.translation(item.name).slice(0, 4);
						//修改司马徽技能单独分离
						if (item.id == "smh_huoji") {
							node = ui.create.div(".skillitem_smh_huoji", self.node.enable, name);
						} else if (item.id == "smh_lianhuan") {
							node = ui.create.div(".skillitem_smh_lianhuan", self.node.enable, name);
						} else if (item.id == "smh_yeyan") {
							node = ui.create.div(".skillitem_smh_yeyan", self.node.enable, name);
						} else {
							//    if (item.info && item.info.limited) {
							//    node = ui.create.div('.skillitemxianding.skillitem', self.node.enable, get.translation(item.name).slice(0, 4));
							//    } else {
							node = ui.create.div(".skillitem", self.node.enable, get.translation(item.name).slice(0, 4));
							//}
						}
						//--------0---------//
						//技能剩余次数 showAddSpan==false 技能失效不需要加数字
						if (showAddSpan) {
							var boolRename = false;

							if (item.info && typeof item.info.usable == "number" && item.info.usable > 1) {
								if (game.me.getStat()) {
									if (game.me.getStat().skill) {
										if (game.me.getStat().skill[item.id]) {
											if (game.me.getStat().skill[item.id] < item.info.usable) {
												addSpan(node, item.info.usable - game.me.getStat().skill[item.id]);
												boolRename = true;
											} else if (game.me.getStat().skill[item.id] == item.info.usable) {
												boolRename = true;
											}
										}
									}
								}

								if (game.me.hasSkill("counttrigger") && game.me.storage.counttrigger) {
									if (item.id && game.me.storage.counttrigger[item.id] < item.info.usable) {
										addSpan(node, item.info.usable - game.me.storage.counttrigger[item.id]);
										boolRename = true;
									} else if (item.info.group && game.me.storage.counttrigger[item.id] == item.info.usable) {
										boolRename = true;
									}
								}

								if (game.me.hasSkill("counttrigger") && game.me.storage.counttrigger && item.info.subSkill && item.info.subSkill.add && item.info.subSkill.add.usable) {
									if (item.info.group && game.me.storage.counttrigger[item.info.group] < item.info.subSkill.add.usable) {
										addSpan(node, item.info.usable - game.me.storage.counttrigger[item.id]);
										boolRename = true;
									} else if (item.info.group && game.me.storage.counttrigger[item.info.group] == item.info.subSkill.add.usable) {
										boolRename = true;
									}
								}
								if (!boolRename) {
									addSpan(node, item.info.usable);
								}
							} else if (item.info && item.info.subSkill && item.info.subSkill.add && item.info.subSkill.add.usable > 1) {
								if (game.me.getStat()) {
									if (game.me.getStat().skill) {
										if (game.me.getStat().skill[item.info.group]) {
											if (item.info.group && game.me.getStat().skill[item.info.group] < item.info.subSkill.add.usable) {
												addSpan(node, item.info.subSkill.add.usable - game.me.getStat().skill[item.info.group]);
												boolRename = true;
											} else if (item.info.group && game.me.getStat().skill[item.info.group] == item.info.subSkill.add.usable) {
												boolRename = true;
											}
										}
									}
								}

								if (game.me.hasSkill("counttrigger") && game.me.storage.counttrigger && item.info.subSkill && item.info.subSkill.add && item.info.subSkill.add.usable) {
									if (item.info.group && game.me.storage.counttrigger[item.info.group] < item.info.subSkill.add.usable) {
										addSpan(node, item.info.subSkill.add.usable - game.me.storage.counttrigger[item.info.group]);
										boolRename = true;
									} else if (item.info.group && game.me.storage.counttrigger[item.info.group] == item.info.subSkill.add.usable) {
										boolRename = true;
									}
								}
								if (!boolRename) {
									addSpan(node, item.info.subSkill.add.usable);
								}
							} else if (item.id == "dbquedi") {
								//却敌特殊机制，每回合限一次usable=1，能重置次数,单独判断

								if (!game.me.storage.counttrigger) game.me.storage.counttrigger = {};
								if (!game.me.storage.counttrigger.dbquedi) game.me.storage.counttrigger.dbquedi = 0;

								if (game.me.storage.counttrigger) {
									if (game.me.storage.counttrigger[item.id] < item.info.usable) {
										addSpan(node, item.info.usable - game.me.storage.counttrigger[item.id]);
									}
								}
							}
						}
						//---------0--------//

						//这里修改2{//这里是主动技失效上锁和转换技阴阳按钮
						if (item.id) {
							if (game.me.hasSkill("baiban") && baibanSkillBlocker && baibanSkillBlocker.contains(item.id)) {
								//白板锁
								var img = ui.create.div(".suo1.baibansuo", node, "");
								img.style.position = "absolute";
								node.style["-webkit-text-fill-color"] = "silver"; //失效变灰
								node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
							} else if (game.me.hasSkill("fengyin") && fengyinSkillBlocker && fengyinSkillBlocker.contains(item.id)) {
								//封印锁
								var img = ui.create.div(".suo1.fengyinsuo", node, "");
								img.style.position = "absolute";
								node.style["-webkit-text-fill-color"] = "silver"; //失效变灰
								node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
							} else if (game.me.shixiaoedSkills.contains(item.id)) {
								//技能锁
								var img = ui.create.div(".suo1.jinengsuo", node, "");
								img.style.position = "absolute";
								node.style["-webkit-text-fill-color"] = "silver"; //失效变灰
								node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
							}
							//这是定义的失效函数，在使命技成功或者失败，芳踪，滔乱，竣攻等技能的函数里补上一个shixiao，按钮就会检测到自动上锁
							if (item.info.zhuanhuanji && !game.me.yangedSkills.contains(item.id)) {
								var img = ui.create.div(".yang", node, "");
								//	console.log(node);
								img.style.position = "absolute";
							}
							//这是定义的阳按钮函数，如果一个技能是转换技，并且不在阴按钮函数里就给他创建一个阳按钮，这种检测是为了开局能正常显示
							if (game.me.yangedSkills.contains(item.id)) {
								var img = ui.create.div(".ying", node, "");
								img.style.position = "absolute";
							}
							//如果一个技能在阴按钮函数集合里就创建一个阴按钮
						}
						//这里结束2}

						//--------------------------//
						ui.create.div(".skillitem-child", node, name);
						//--------------------------//
						node.dataset.id = item.id;
						app.listen(node, plugin.clickSkill);
						return;
					}
					if (!item.info) return;
					if (!item.translation) return;
					if (item.id == "jiu") return false; //--------改酒
					if (eSkills && eSkills.contains(item.id)) return;
					node = ui.create.div(".skillitem", self.node.trigger, item.name.slice(0, 4));

					if (item.id) {
						//这里修改5{//这是被动技能的上锁和按钮切换

						if (game.me.hasSkill("baiban") && baibanSkillBlocker && baibanSkillBlocker.contains(item.id)) {
							//白板锁
							var img = ui.create.div(".suo1.baibansuo", node, "");
							img.style.position = "absolute";
							node.style["-webkit-text-fill-color"] = "silver"; //失效变灰
							node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
						} else if (game.me.hasSkill("fengyin") && fengyinSkillBlocker && fengyinSkillBlocker.contains(item.id)) {
							//封印锁
							var img = ui.create.div(".suo1.fengyinsuo", node, "");
							img.style.position = "absolute";
							node.style["-webkit-text-fill-color"] = "silver"; //失效变灰
							node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
						} else if (game.me.shixiaoedSkills.contains(item.id)) {
							//技能锁
							var img = ui.create.div(".suo1.jinengsuo", node, "");
							img.style.position = "absolute";
							node.style["-webkit-text-fill-color"] = "silver"; //失效变灰
							node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
						}
						if (item.info.zhuanhuanji && !game.me.yangedSkills.contains(item.id)) {
							var img = ui.create.div(".yang", node, "");
							img.style.position = "absolute";
							//	console.log(node);
						}
						if (game.me.yangedSkills.contains(item.id)) {
							var img = ui.create.div(".ying", node, "");
							img.style.position = "absolute";
						}
						//--------0---------//
						//技能剩余次数 showAddSpan==false 技能失效不需要加数字
						if (showAddSpan) {
							var boolRename = false;
							if (item.info && typeof item.info.usable == "number" && item.info.usable > 1) {
								if (game.me.getStat()) {
									if (game.me.getStat().skill) {
										if (game.me.getStat().skill[item.id]) {
											if (game.me.getStat().skill[item.id] < item.info.usable) {
												addSpan(node, item.info.usable - game.me.getStat().skill[item.id]);

												boolRename = true;
											} else if (game.me.getStat().skill[item.id] == item.info.usable) {
												boolRename = true;
											}
										}
									}
								}
								if (game.me.hasSkill("counttrigger") && game.me.storage.counttrigger) {
									if (item.id && game.me.storage.counttrigger[item.id] < item.info.usable) {
										addSpan(node, item.info.usable - game.me.storage.counttrigger[item.id]);
										boolRename = true;
									} else if (item.id && game.me.storage.counttrigger[item.id] == item.info.usable) {
										boolRename = true;
									}
								}

								if (game.me.hasSkill("counttrigger") && game.me.storage.counttrigger && item.info.subSkill && item.info.subSkill.add && item.info.subSkill.add.usable) {
									if (item.info.group && game.me.storage.counttrigger[item.info.group] < item.info.subSkill.add.usable) {
										addSpan(node, item.info.usable - game.me.storage.counttrigger[item.id]);
										boolRename = true;
									} else if (item.info.group && game.me.storage.counttrigger[item.info.group] == item.info.subSkill.add.usable) {
										boolRename = true;
									}
								}
								if (!boolRename) {
									addSpan(node, item.info.usable);
								}
							} else if (item.info && item.info.subSkill && item.info.subSkill.add && item.info.subSkill.add.usable > 1) {
								if (game.me.getStat()) {
									if (game.me.getStat().skill) {
										if (game.me.getStat().skill[item.info.group]) {
											if (item.info.group && game.me.getStat().skill[item.info.group] < item.info.subSkill.add.usable) {
												addSpan(node, item.info.subSkill.add.usable - game.me.getStat().skill[item.info.group]);
												boolRename = true;
											} else if (item.info.group && game.me.getStat().skill[item.info.group] == item.info.subSkill.add.usable) {
												boolRename = true;
											}
										}
									}
								}

								if (game.me.hasSkill("counttrigger") && game.me.storage.counttrigger && item.info.subSkill && item.info.subSkill.add && item.info.subSkill.add.usable) {
									if (item.info.group && game.me.storage.counttrigger[item.info.group] < item.info.subSkill.add.usable) {
										addSpan(node, item.info.subSkill.add.usable - game.me.storage.counttrigger[item.info.group]);

										boolRename = true;
									} else if (item.info.group && game.me.storage.counttrigger[item.info.group] == item.info.subSkill.add.usable) {
										boolRename = true;
									}
								}
								if (!boolRename) {
									addSpan(node, item.info.subSkill.add.usable);
								}
							} else if (item.id == "dbquedi") {
								//却敌特殊机制，每回合限一次usable=1，能重置次数,单独判断

								if (!game.me.storage.counttrigger) game.me.storage.counttrigger = {};
								if (!game.me.storage.counttrigger.dbquedi) game.me.storage.counttrigger.dbquedi = 0;

								if (game.me.storage.counttrigger) {
									if (game.me.storage.counttrigger[item.id] < item.info.usable) {
										addSpan(node, item.info.usable - game.me.storage.counttrigger[item.id]);
									}
								}
							}
						}
						//---------0--------//
					} //这里修改5}
					//------skill的main1.js----需要添加-----------------//
					ui.create.div(".skillitem-child", node, item.name);
					node.dataset.id = item.id;
				});
				return this;
			},
			update: function () {
				var skills = [];
				if (ui.skills) skills.addArray(ui.skills.skills);
				if (ui.skills2) skills.addArray(ui.skills2.skills);
				if (ui.skills3) skills.addArray(ui.skills3.skills);
				try {
					skills.remove("lianhuan5");
					skills.remove("lianhuan2");
					skills.remove("ollianhuan5");
				} catch (e) {}
				Array.from(this.node.enable.childNodes).forEach(function (item) {
					if (skills.contains(item.dataset.id)) {
						item.classList.add("usable");
					} else {
						item.classList.remove("usable");
					}

					if (_status.event.skill === item.dataset.id) {
						item.classList.add("select");
					} else {
						item.classList.remove("select");
					}
				});

				ui.skillControl.node.enable.style.width = ui.skillControl.node.enable.childNodes.length > 2 ? "200px" : ui.skillControl.node.enable.childNodes.length > 0 ? "120px" : "0px";
				ui.skillControl.node.trigger.style.width = ui.skillControl.node.enable.childNodes.length > 2 ? "200px" : "120px";
				// ui.skillControl.style.width = ui.skillControl.node.enable.childNodes.length > 2
				//      ? '200px' :'120px';

				var level1 = Math.min(4, this.node.trigger.childNodes.length);
				var level2 = this.node.enable.childNodes.length > 2 ? 4 : this.node.enable.childNodes.length > 0 ? 2 : 0;
				var level = Math.max(level1, level2);
				ui.arena.dataset.sclevel = level;
			},
		},
		checkSkill: function (skill) {
			var info = lib.skill[skill];
			if (!info) return -1;
			if (info.enable) return 1;
			return 0;
		},
		clickSkill: function (e) {
			if (this.classList.contains("usable")) {
				var skill = this.dataset.id;
				var item = ui.skillControlArea.querySelector('[data-id="' + skill + '"]');
				item && app.mockTouch(item);
			}
		},
		createSkills: function (skills, node) {
			var same = true;
			if (node) {
				if (skills && skills.length) {
					for (var i = 0; i < node.skills.length; i++) {
						if (node.skills[i] !== skills[i]) {
							same = false;
							break;
						}
					}
				}
				if (same) return node;
				node.close();
				node.delete();
			}
			if (!skills && !skills.length) return;

			node = ui.create.div(".control.skillControl", ui.skillControlArea);
			Object.assign(node, lib.element.control);
			skills.forEach(function (skill) {
				var item = ui.create.div(node);
				item.link = skill;
				item.dataset.id = skill;
				item.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
			});
			node.skills = skills;
			node.custom = ui.click.skill;
			return node;
		},
		updateSkillMarks: function (player, skills1, skills2) {
			var node = player.node.xSkillMarks;
			if (!node) {
				node = player.node.xSkillMarks = ui.create.div(".skillMarks", player);
			}

			function abb() {
				alert("k");
			}

			Array.from(node.childNodes).forEach(function (item) {
				if (skills1.hasOwnProperty(item.dataset.id)) return;
				if (skills2[item.dataset.id]) return;
				item.remove();
			});
			//这里修改3{这里是使限定技和转换技显示不同的样式
			for (var k in skills1) {
				var info = lib.skill[k];
				var item = node.querySelector('[data-id="' + k + '"]');
				if (!item) {
					if (!info.zhuanhuanji && !info.yunlvSkill) {
						item = ui.create.div(".skillMarkItem.xiandingji", node, "");
						item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/xiandingji/" + k + ".png");
					}
					//如果不是转换技就调用限定技的标记
					else {
						//判断图片存在，不存在就用底图
						var url = lib.assetURL + "extension/十周年UI/shoushaUI/skill/images/" + k + "_yang.png";

						function ImageIsExist(url) {
							let xmlHttp = new XMLHttpRequest();
							xmlHttp.open("Get", url, false);
							xmlHttp.send();
							if (xmlHttp.status === 404) return false;
							else return true;
						}

						try {
							//容错函数，优先执行try的内容，try报错时自动执行catch内容
							var a = ImageIsExist(url);
							if (a) {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, "");
								item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/" + k + "_yang.png");
							}
						} catch (err) {
							item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(k, player));
							item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/ditu_yang.png");
							item.style.setProperty("--w", "42px");
						}
						//如果是转换技就调用转换技标记并设置背景图
					}
				}
				if (skills1[k]) item.classList.add("used");
				else item.classList.remove("used");
				item.dataset.id = k;
			}
			//这里结束3}
			Array.from(node.querySelectorAll(".juexingji")).forEach(function (item) {
				if (!skills2[item.dataset.id]) {
					item.remove();
				}
			});
			//这里修改4{这里是使觉醒技和使命技不同
			for (var k in skills2) {
				if (!skills2[k]) continue;
				var info = lib.skill[k];
				if (node.querySelector('[data-id="' + k + '"]')) continue;
				var item;
				if (info.dutySkill) {
					item = ui.create.div(".skillMarkItem.duty", node, "");
					item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/shimingji/" + k + ".png");
				} else {
					item = ui.create.div(".skillMarkItem.juexingji", node, "");
					item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/juexingji/" + k + ".png");
				}
				item.dataset.id = k;
			}
			//这里结束4}
		},
		recontent: function () {
			app.reWriteFunction(ui.create, {
				dialog: [
					null,
					function (dialog) {
						dialog.classList.add("xdialog");
						app.reWriteFunction(dialog, {
							hide: [
								null,
								function () {
									app.emit("dialog:change", dialog);
								},
							],
						});
					},
				],
			});

			app.reWriteFunction(lib.element.dialog, {
				open: [
					null,
					function () {
						app.emit("dialog:change", this);
					},
				],
				close: [
					null,
					function () {
						app.emit("dialog:change", this);
					},
				],
			});

			app.reWriteFunction(lib.element.player, {
				markSkill: [
					function (args, name) {
						var info = lib.skill[name];
						if (!info) return;
						if (info.limited) return this;
						if (info.intro && info.intro.content === "limited") return this;
					},
				],
			});

			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					function (res, config, map) {
						map.button_press.hide();
					},
				],
			});

			app.on("playerUpdateE", function (player) {
				plugin.updateMark(player);
			});
		},
		element: {
			mark: {
				delete: function () {
					this.remove();
				},
				click: function () {
					alert("k");
				},
				setName: function (name) {
					name = get.translation(name) || name;
					if (!name || !name.trim()) {
						this.classList.add("unshow");
						this.node.name.innerHTML = "";
					} else {
						this.classList.remove("unshow");
						this.node.name.innerHTML = get.translation(name) || name;
					}
					return this;
				},
				setCount: function (count) {
					if (typeof count === "number") {
						this.node.count.innerHTML = count;
						this.node.count.classList.remove("unshow");
					} else {
						this.node.count.innerHTML = "";
						this.node.count.classList.add("unshow");
					}
					return this;
				},
				setExtra: function (extra) {
					var str = "";

					if (!Array.isArray(extra)) extra = [extra];
					extra.forEach(function (item) {
						if (!item || typeof item !== "string") return this;
						if (item.indexOf("#") === 0) {
							item = item.substr(1);
							str += "<br>";
						}
						str += "<div>" + item + "</div>";
					});

					if (str) {
						this.node.extra.classList.remove("unshow");
						this.node.extra.innerHTML = str;
					} else if (!this._characterMark) {
						this.node.extra.innerHTML = "";
						this.node.extra.classList.add("unshow");
					}
					return this;
				},
				setBackground: function (name, type) {
					var skill = lib.skill[this.name];
					if (skill && skill.intro && skill.intro.markExtra) return this;
					if (type === "character") {
						name = get.translation(name) || name;
						this._characterMark = true;
						return this.setExtra(name);
					}
					return this;
				},
				_customintro: function (uiintro) {
					var node = this;
					var info = node.info;
					var player = node.parentNode.parentNode;
					if (info.name) {
						if (typeof info.name == "function") {
							var named = info.name(player.storage[node.skill], player);
							if (named) {
								uiintro.add(named);
							}
						} else {
							uiintro.add(info.name);
						}
					} else if (info.name !== false) {
						uiintro.add(get.translation(node.skill));
					}

					if (typeof info.mark == "function") {
						var stint = info.mark(uiintro, player.storage[node.skill], player);
						if (stint) {
							var placetext = uiintro.add('<div class="text" style="display:inline">' + stint + "</div>");
							if (stint.indexOf('<div class="skill"') != 0) {
								uiintro._place_text = placetext;
							}
						}
					} else {
						var stint = get.storageintro(info.content, player.storage[node.skill], player, uiintro, node.skill);
						if (stint) {
							if (stint[0] == "@") {
								uiintro.add('<div class="caption">' + stint.slice(1) + "</div>");
							} else {
								var placetext = uiintro.add('<div class="text" style="display:inline">' + stint + "</div>");
								if (stint.indexOf('<div class="skill"') != 0) {
									uiintro._place_text = placetext;
								}
							}
						}
					}
					uiintro.add(ui.create.div(".placeholder.slim"));
				},
			},
		},
		click: {
			mark: function (e) {
				e.stopPropagation();
				delete this._waitingfordrag;
				if (_status.dragged) return;
				if (_status.clicked) return;
				if (ui.intro) return;
				var rect = this.getBoundingClientRect();
				ui.click.touchpop();
				ui.click.intro.call(this, {
					clientX: rect.left + 18,
					clientY: rect.top + 12,
				});
				_status.clicked = false;
			},
		},
		updateMark: function (player) {
			var eh = player.node.equips.childNodes.length * 22;
			var bv = Math.max(88, eh) * 0.8 + 1.6;
			player.node.marks.style.bottom = bv + "px";
		},
	};

	return plugin;
});
