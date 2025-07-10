app.import(function (lib, game, ui, get, ai, _status, app) {
	var plugin = {
		name: "skill",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			Object.assign(ui.create, {
				skills(skills) {
					ui.skills = plugin.createSkills(skills, ui.skills);
					ui.skillControl.update();
					return ui.skills;
				},
				skills2(skills) {
					ui.skills2 = plugin.createSkills(skills, ui.skills2);
					ui.skillControl.update();
					return ui.skills2;
				},
				skills3(skills) {
					ui.skills3 = plugin.createSkills(skills, ui.skills3);
					ui.skillControl.update();
					return ui.skills3;
				},
				skillControl(clear) {
					if (!ui.skillControl) {
						const isRightLayout = lib.config["extension_十周年UI_rightLayout"] == "on";
						const className = isRightLayout ? ".skill-control" : ".skill-controlzuoshou";

						var node = ui.create.div(className, ui.arena);
						node.node = {
							enable: ui.create.div(".enable", node),
							trigger: ui.create.div(".trigger", node),
						};

						for (var i in plugin.controlElement) {
							node[i] = plugin.controlElement[i];
						}
						ui.skillControl = node;
					}

					if (clear) {
						ui.skillControl.node.enable.innerHTML = "";
						ui.skillControl.node.trigger.innerHTML = "";
					}
					return ui.skillControl;
				},
			});

			Object.assign(ui, {
				updateSkillControl(player, clear) {
					var eSkills = player.getSkills("e", true, false).slice(0);
					var skills = player.getSkills("invisible", null, false);

					for (var i = 0; i < skills.length; i++) {
						var info = get.info(skills[i]);
						if (info && info.nopop && !skills[i].startsWith("olhedao_tianshu_")) skills.splice(i--, 1);
					}

					var iSkills = player.invisibleSkills.slice(0);
					game.expandSkills(iSkills);

					skills.addArray(
						iSkills.filter(function (skill) {
							var info = get.info(skill);
							return info && info.enable;
						})
					);

					if (player === game.me) {
						var skillControl = ui.create.skillControl(clear);
						skillControl.add(skills, eSkills);
						skillControl.update();
						game.addVideo("updateSkillControl", player, clear);
					}

					var juexingji = {};
					var xiandingji = {};
					player.getSkills("invisible", null, false).forEach(function (skill) {
						var info = get.info(skill);
						if (!info) return;
						if (get.is.zhuanhuanji(skill, player) || info.limited || (info.intro && info.intro.content === "limited")) {
							xiandingji[skill] = player.awakenedSkills.includes(skill);
						}
						if (info.juexingji || info.dutySkill) juexingji[skill] = player.awakenedSkills.includes(skill);
					});
					plugin.updateSkillMarks(player, xiandingji, juexingji);
				},
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
				swapControl: [
					null,
					function () {
						ui.updateSkillControl(game.me, true);
					},
				],
				swapPlayer: [
					null,
					function () {
						ui.updateSkillControl(game.me, true);
					},
				],
			});

			Object.assign(game.videoContent, {
				updateSkillControl(player, clear) {
					ui.updateSkillControl(player, clear);
				},
			});
			ui.skillControlArea = ui.create.div();
		},
		controlElement: {
			addSkillNumber(node, num) {
				var numArray = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];
				var text = document.createElement("span");
				text.classList.add("numText");
				var numTextChild = document.createElement("span");
				numTextChild.classList.add("numText-child");
				numTextChild.innerText = numArray[num] || "(" + num + ")";
				node.appendChild(numTextChild);
				node.appendChild(text);
				text.innerText = numArray[num] || "(" + num + ")";
			},
			getSkillRemainingCount(skillId, player) {
				if (!player.hasSkill(skillId)) return null;

				let skills = [skillId];
				if (get.info(skillId).group) {
					skills.add(...get.info(skillId).group);
				}

				skills = skills.filter(skill => (get.info(skill) || {}).usable !== undefined);
				if (!skills.length) return null;

				for (const skill of skills) {
					let num = get.info(skill).usable;
					if (typeof num === "function") num = num(skill, player);
					if (typeof num === "number" && (skill === "dbquedi" || num > 1)) {
						let used = 0;
						used += get.skillCount(skill, player);
						used += player?.storage?.counttrigger?.[skill] || 0;
						return num - used;
					}
				}
				return null;
			},
			checkGroupFilter(skillInfo) {
				if (!skillInfo.filter) return true;

				const filterStr = skillInfo.filter + "";
				if (filterStr.indexOf("player.group") === -1) return true;

				let str = filterStr.substr(filterStr.indexOf("player.group"));
				let group = null;

				if (str.indexOf("'") !== -1) {
					str = str.substr(str.indexOf("'") + 1);
					if (str.indexOf("'") !== -1) {
						group = str.substr(0, str.indexOf("'"));
					}
				} else if (str.indexOf('"') !== -1) {
					str = str.substr(str.indexOf('"') + 1);
					if (str.indexOf('"') !== -1) {
						group = str.substr(0, str.indexOf('"'));
					}
				}

				return !group || group === game.me.group;
			},
			addSkillLocksAndButtons(node, skillId) {
				const player = game.me;

				//鹿鹿修改 失效锁开始
				if (this.skshixiaoSkillBlocker.includes(skillId)) {
					node.classList.add("shixiao");
					var img = ui.create.div(".suo1.fengyinsuo", node, "");
					img.style.position = "absolute";
					node.style["-webkit-text-fill-color"] = "silver";
					node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
				}
				//失效锁修改结束

				const skillInfo = get.info(skillId);
				if (skillInfo && skillInfo.zhuanhuanji) {
					if (!player.yangedSkills?.includes(skillId)) {
						var img = ui.create.div(".yang", node, "");
						img.style.position = "absolute";
					} else {
						var img = ui.create.div(".ying", node, "");
						img.style.position = "absolute";
					}
				}
			},
			add(skill, eSkills) {
				//鹿鹿修改 显示失效技能
				var self = this;
				self.skshixiaoSkillBlocker = game.me.getSkills(null, false, false).filter(skillx => {
					if (game.me.getStorage("skill_blocker")) {
						for (var i of game.me.getStorage("skill_blocker")) {
							if (lib.skill[i] && lib.skill[i].skillBlocker && lib.skill[i].skillBlocker(skillx, game.me)) {
								return true;
							}
						}
					}
					if (game.me.disabledSkills) {
						if (game.me.disabledSkills[skillx] && game.me.disabledSkills[skillx].length > 0 && game.me.disabledSkills[skillx].some(sbawk => sbawk != skillx + "_awake")) {
							return true;
						}
					}
					if (game.me.shixiaoedSkills) {
						if (game.me.shixiaoedSkills?.includes(skillx)) {
							return true;
						}
					}
					if (game.me.isTempBanned(skillx)) {
						return true;
					}
					return false;
				});
				for (var i of self.skshixiaoSkillBlocker) {
					if (lib.skill[i] && lib.skill[i].group) {
						var shabizjn = lib.skill[i].group;
						if (Array.isArray(shabizjn)) {
							self.skshixiaoSkillBlocker.add(...shabizjn);
						} else if (typeof shabizjn == "string") {
							self.skshixiaoSkillBlocker.add(shabizjn);
						}
					}
				}
				self.skshixiaoSkillBlocker.forEach(function (item) {
					if (Array.isArray(skill) && !skill.includes(item)) {
						skill.add(item);
					}
				});
				if (Array.isArray(skill)) {
					var sortlist = game.me.getSkills(null, false, false);
					skill.sort((a, b) => sortlist.indexOf(a) - sortlist.indexOf(b));
				}
				//修改结束
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
					if (!self.checkGroupFilter(lib.skill[item.id])) return;
					if (lib.skill[item.id].viewAsFilter && !self.checkGroupFilter({ filter: lib.skill[item.id].viewAsFilter })) return;

					var node = self.querySelector('[data-id="' + item.id + '"]');
					if (node) return;

					if (item.type === "enable") {
						let name = get.translation(item.name).slice(0, 2);

						if (item.id.indexOf("jianjie_huoji") !== -1) {
							node = ui.create.div(".skillitem_smh_huoji", self.node.enable, name);
						} else if (item.id.indexOf("jianjie_lianhuan") !== -1) {
							node = ui.create.div(".skillitem_smh_lianhuan", self.node.enable, name);
						} else if (item.id.indexOf("jianjie_yeyan") !== -1) {
							node = ui.create.div(".skillitem_smh_yeyan", self.node.enable, name);
						} else {
							node = ui.create.div(".skillitem", self.node.enable, name);
						}

						const remainingCount = self.getSkillRemainingCount(item.id, game.me);
						if (remainingCount !== null) {
							self.addSkillNumber(node, remainingCount);
						}

						self.addSkillLocksAndButtons(node, item.id);

						ui.create.div(".skillitem-child", node, name);
						node.dataset.id = item.id;
						app.listen(node, plugin.clickSkill);
						return;
					}

					if (!item.info || !item.translation || item.id === "jiu") return;
					if (eSkills && eSkills.includes(item.id)) return;

					var skillName = get.translation(item.name).slice(0, 2);
					node = ui.create.div(".skillitem", self.node.trigger, skillName);

					self.addSkillLocksAndButtons(node, item.id);

					const remainingCount = self.getSkillRemainingCount(item.id, game.me);
					if (remainingCount !== null) {
						self.addSkillNumber(node, remainingCount);
					}

					ui.create.div(".skillitem-child", node, skillName);
					node.dataset.id = item.id;
				});

				return this;
			},
			update() {
				var skills = [];
				if (ui.skills) skills.addArray(ui.skills.skills);
				if (ui.skills2) skills.addArray(ui.skills2.skills);
				if (ui.skills3) skills.addArray(ui.skills3.skills);

				Array.from(this.node.enable.childNodes).forEach(function (item) {
					if (skills.includes(item.dataset.id)) {
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

				const enableCount = this.node.enable.childNodes.length;
				const enableWidth = enableCount > 2 ? "200px" : enableCount > 0 ? "114px" : "0px";
				ui.skillControl.node.enable.style.width = enableWidth;

				var level1 = Math.min(4, this.node.trigger.childNodes.length);
				var level2 = enableCount > 2 ? 4 : enableCount > 0 ? 2 : 0;
				var level = Math.max(level1, level2);
				ui.arena.dataset.sclevel = level;
			},
		},
		checkSkill(skill) {
			var info = lib.skill[skill];
			if (!info) return -1;
			if (info.enable) return 1;
			return 0;
		},
		clickSkill(e) {
			if (this.classList.contains("usable")) {
				var skill = this.dataset.id;
				var item = ui.skillControlArea.querySelector('[data-id="' + skill + '"]');
				item && app.mockTouch(item);
			}
		},
		createSkills(skills, node) {
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
		checkImageExists(url) {
			let xmlHttp = new XMLHttpRequest();
			xmlHttp.open("Get", url, false);
			xmlHttp.send();
			return xmlHttp.status !== 404;
		},
		updateSkillMarks(player, skills1, skills2) {
			var node = player.node.xSkillMarks;
			if (!node) {
				node = player.node.xSkillMarks = ui.create.div(".skillMarks", player);
			}

			Array.from(node.childNodes).forEach(function (item) {
				if (skills1.hasOwnProperty(item.dataset.id)) return;
				if (skills2[item.dataset.id]) return;
				item.remove();
			});
			for (var k in skills1) {
				var info = lib.skill[k];
				var item = node.querySelector('[data-id="' + k + '"]');

				if (!item) {
					if (!info.zhuanhuanji) {
						item = ui.create.div(".skillMarkItem.xiandingji", node, get.skillTranslation(k, player).slice(0, 2));
					} else {
						const url = lib.assetURL + "extension/十周年UI/shoushaUI/skill/shousha/" + k + "_yang.png";

						try {
							if (this.checkImageExists(url)) {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, "");
								item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/shousha/" + k + "_yang.png");
							} else {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(k, player).slice(0, 2));
								item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/shousha/ditu_yang.png");
								item.style.setProperty("--w", "42px");
							}
						} catch (err) {
							item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(k, player).slice(0, 2));
							item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/shousha/ditu_yang.png");
							item.style.setProperty("--w", "42px");
						}
					}
				}
				if (skills1[k]) {
					item.classList.add("used");
				} else {
					item.classList.remove("used");
				}
				item.dataset.id = k;
			}
			Array.from(node.querySelectorAll(".juexingji")).forEach(function (item) {
				if (!skills2[item.dataset.id]) {
					item.remove();
				}
			});
			for (var k in skills2) {
				if (!skills2[k]) continue;
				var info = lib.skill[k];
				if (node.querySelector('[data-id="' + k + '"]')) continue;

				var item;
				if (info.dutySkill) {
					item = ui.create.div(".skillMarkItem.duty", node, get.skillTranslation(k, player).slice(0, 2));
				} else {
					item = ui.create.div(".skillMarkItem.juexingji", node, get.skillTranslation(k, player).slice(0, 2));
				}
				item.dataset.id = k;
			}
		},
		recontent() {
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
				delete() {
					this.remove();
				},
				setName(name) {
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
				setCount(count) {
					if (typeof count === "number") {
						this.node.count.innerHTML = count;
						this.node.count.classList.remove("unshow");
					} else {
						this.node.count.innerHTML = "";
						this.node.count.classList.add("unshow");
					}
					return this;
				},
				setExtra(extra) {
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
				setBackground(name, type) {
					var skill = lib.skill[this.name];
					if (skill && skill.intro && skill.intro.markExtra) return this;
					if (type === "character") {
						name = get.translation(name) || name;
						this._characterMark = true;
						return this.setExtra(name);
					}
					return this;
				},
				_customintro(uiintro) {
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
			mark(e) {
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
		updateMark(player) {
			var eh = player.node.equips.childNodes.length * 22;
			var bv = Math.max(88, eh) * 0.8 + 1.6;
			player.node.marks.style.bottom = bv + "px";
		},
	};
	return plugin;
});
