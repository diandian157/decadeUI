app.import(function (lib, game, ui, get, ai, _status, app) {
	const plugin = {
		name: "skill",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			this.initCreateFunctions();
			this.initUpdateFunctions();
			this.initRewrites();
			this.initVideoContent();
			this.initTimer();
			ui.skillControlArea = ui.create.div();
		},
		initCreateFunctions() {
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
				gskills(skills) {
					ui.gskills = plugin.createGSkills(skills, ui.gskills);
					if (lib.config.phonelayout) {
						if (ui.skillControl) {
							ui.skillControl.update();
						}
					} else {
						if (ui.gskillControl) {
							ui.gskillControl.update();
						}
					}
					return ui.gskills;
				},
				skillControl(clear) {
					if (!ui.skillControl) {
						ui.skillControl = plugin.createSkillControl();
					}
					if (clear) {
						ui.skillControl.node.enable.innerHTML = "";
						ui.skillControl.node.trigger.innerHTML = "";
					}
					return ui.skillControl;
				},
				gskillControl(clear) {
					if (lib.config.phonelayout) {
						return null;
					}
					if (!ui.gskillControl) {
						const node = ui.create.div(".gskill-control", ui.arena);
						node.node = {
							enable: ui.create.div(".enable", node),
							trigger: ui.create.div(".trigger", node),
						};
						for (const key in plugin.controlElement) {
							node[key] = plugin.controlElement[key];
						}
						node.update = function () {
							const skills = [];
							if (ui.skills2) skills.addArray(ui.skills2.skills);
							Array.from(this.node.enable.childNodes).forEach(function (item) {
								const skillId = item.dataset.id;
								let isUsable = skills.includes(skillId);
								if (isUsable && game.me && get.is.locked(skillId, game.me)) {
									isUsable = false;
								}
								item.classList[isUsable ? "add" : "remove"]("usable");
								item.classList[_status.event.skill === skillId ? "add" : "remove"]("select");
							});
						};
						ui.gskillControl = node;
					}
					if (clear) {
						ui.gskillControl.node.enable.innerHTML = "";
						ui.gskillControl.node.trigger.innerHTML = "";
					}
					return ui.gskillControl;
				},
			});
		},
		createSkillControl() {
			const isRightLayout = lib.config["extension_十周年UI_rightLayout"] === "on";
			const className = isRightLayout ? ".skill-control" : ".skill-controlzuoshou";
			const node = ui.create.div(className, ui.arena);
			node.node = {
				enable: ui.create.div(".enable", node),
				trigger: ui.create.div(".trigger", node),
			};
			for (const key in plugin.controlElement) {
				node[key] = plugin.controlElement[key];
			}
			return node;
		},
		initUpdateFunctions() {
			Object.assign(ui, {
				updateSkillControl(player, clear) {
					const eSkills = player.getSkills("e", true, false).slice(0);
					let skills = player.getSkills("invisible", null, false);
					let gSkills = null;
					if (ui.skills2 && ui.skills2.skills.length) {
						gSkills = ui.skills2.skills;
					}
					skills = skills.filter(skill => {
						const info = get.info(skill);
						return !info || !info.nopop || skill.startsWith("olhedao_tianshu_");
					});
					const iSkills = player.invisibleSkills.slice(0);
					game.expandSkills(iSkills);
					skills.addArray(
						iSkills.filter(skill => {
							const info = get.info(skill);
							return info && info.enable;
						})
					);
					if (player === game.me) {
						const skillControl = ui.create.skillControl(clear);
						skillControl.add(skills, eSkills);
						if (lib.config.phonelayout && gSkills && gSkills.length) {
							skillControl.add(gSkills, eSkills);
						}
						skillControl.update();
						if (!lib.config.phonelayout) {
							const gskillControl = ui.create.gskillControl(clear);
							if (gskillControl) {
								if (gSkills && gSkills.length) {
									gskillControl.add(gSkills, eSkills);
								}
								gskillControl.update();
							}
						}

						game.addVideo("updateSkillControl", player, clear);
					}
					plugin.updateSkillMarksForPlayer(player);
				},
			});
		},
		updateSkillMarksForPlayer(player) {
			const juexingji = {};
			const xiandingji = {};
			player.getSkills("invisible", null, false).forEach(function (skill) {
				const info = get.info(skill);
				if (!info) return;
				if (get.is.zhuanhuanji(skill, player) || info.limited || (info.intro && info.intro.content === "limited")) {
					xiandingji[skill] = player.awakenedSkills.includes(skill);
				}
				if (info.juexingji) {
					if (player.awakenedSkills.includes(skill)) {
						juexingji[skill] = true;
					}
				}
				if (info.dutySkill) {
					if (player.awakenedSkills.includes(skill)) {
						juexingji[skill] = true;
					}
				}
			});
			plugin.updateSkillMarks(player, xiandingji, juexingji);
		},
		initRewrites() {
			app.reWriteFunction(lib.element.player, {
				addSkill: [
					null,
					function () {
						ui.updateSkillControl(this);
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
						ui.updateSkillControl(this);
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
						if (!lib.config.phonelayout && ui.gskillControl) {
							ui.gskillControl.update();
						}
						if (!lib.config.phonelayout && game.me && !ui.gskillControl && ui.skills2 && ui.skills2.skills.length) {
							ui.updateSkillControl(game.me);
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
		},
		initVideoContent() {
			Object.assign(game.videoContent, {
				updateSkillControl(player, clear) {
					ui.updateSkillControl(player, clear);
				},
			});
		},
		controlElement: {
			add(skill, eSkills) {
				if (Array.isArray(skill)) {
					const node = this;
					skill.forEach(function (item) {
						node.add(item, eSkills);
					});
					return this;
				}
				if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
					const expandedESkills = game.expandSkills(eSkills.slice());
					const expandedSkill = game.expandSkills([skill]);
					if (expandedSkill.some(s => expandedESkills.includes(s))) return this;
				}
				const self = this;
				const skills = game.expandSkills([skill]).map(function (item) {
					return app.get.skillInfo(item);
				});
				let hasSame = false;
				const enableSkills = skills.filter(function (item) {
					if (item.type !== "enable") return false;
					if (item.name === skills[0].name) hasSame = true;
					return true;
				});
				if (!hasSame) enableSkills.unshift(skills[0]);
				const showSkills = enableSkills.length ? enableSkills : skills;
				showSkills.forEach(function (item) {
					let node = self.querySelector(`[data-id="${item.id}"]`);
					if (node) return;
					if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
						const expandedESkills = game.expandSkills(eSkills.slice());
						if (expandedESkills.includes(item.id)) return;
					}
					if (item.type === "enable") {
						const skillName = get.translation(item.name).slice(0, 2);
						const className = lib.skill[item.id].limited ? ".xiandingji" : ".skillitem";
						node = ui.create.div(className, self.node.enable, skillName);
						node.dataset.id = item.id;
						if (lib.skill[item.id]?.zhuanhuanji) node.classList.add("zhuanhuanji");
						if (get.is.locked(item.id, game.me)) node.classList.add("locked");
						node.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
							if (lib.config["extension_十周年UI_bettersound"]) game.playAudio("..", "extension", "十周年UI", "audio/SkillBtn");
						});
						app.listen(node, plugin.clickSkill);
						return;
					}
					if (!item.info || !item.translation) return;
					if (eSkills?.includes(item.id)) return;
					const targetNode = lib.config.phonelayout ? "trigger" : "enable";
					node = ui.create.div(".skillitem", self.node[targetNode], get.translation(item.name).slice(0, 2));
					node.dataset.id = item.id;
					if (lib.skill[item.id]?.zhuanhuanji) node.classList.add("zhuanhuanji");
					if (get.is.locked(item.id, game.me)) node.classList.add("locked");
				});
				return this;
			},
			update() {
				const skills = [];
				if (ui.skills) skills.addArray(ui.skills.skills);
				if (ui.skills2) skills.addArray(ui.skills2.skills);
				if (ui.skills3) skills.addArray(ui.skills3.skills);
				if (lib.config.phonelayout && ui.gskills) {
					skills.addArray(ui.gskills.skills);
				}
				Array.from(this.node.enable.childNodes).forEach(function (item) {
					item.classList[skills.includes(item.dataset.id) ? "add" : "remove"]("usable");
					item.classList[_status.event.skill === item.dataset.id ? "add" : "remove"]("select");
				});
				const level1 = Math.min(4, this.node.trigger.childNodes.length);
				const level2 = this.node.enable.childNodes.length > 2 ? 4 : this.node.enable.childNodes.length > 0 ? 2 : 0;
				const level = Math.max(level1, level2);
				ui.arena.dataset.sclevel = level;
			},
		},
		checkSkill(skill) {
			const info = lib.skill[skill];
			if (!info) return -1;
			return info.enable ? 1 : 0;
		},
		clickSkill(e) {
			if (this.classList.contains("usable")) {
				const skill = this.dataset.id;
				const item = ui.skillControlArea.querySelector(`[data-id="${skill}"]`);
				item && app.mockTouch(item);
			}
		},
		createSkills(skills, node) {
			if (this.isSameSkills(skills, node)) return node;
			if (node) {
				node.close();
				node.delete();
			}
			if (!skills || !skills.length) return;
			const newNode = ui.create.div(".control.skillControl", ui.skillControlArea);
			Object.assign(newNode, lib.element.control);
			skills.forEach(skill => {
				const item = ui.create.div(newNode);
				item.link = skill;
				item.dataset.id = skill;
				item.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
			});
			newNode.skills = skills;
			newNode.custom = ui.click.skill;
			return newNode;
		},
		createGSkills(skills, node) {
			if (lib.config.phonelayout) {
				return null;
			}
			if (this.isSameSkills(skills, node)) return node;
			if (node) {
				node.close();
				node.delete();
			}
			if (!skills || !skills.length) return;
			const newNode = ui.create.div(".gskill-control", ui.skillControlArea);
			Object.assign(newNode, lib.element.control);
			skills.forEach(skill => {
				const item = ui.create.div(newNode);
				item.link = skill;
				item.dataset.id = skill;
				item.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
			});
			newNode.skills = skills;
			newNode.custom = ui.click.skill;
			return newNode;
		},
		isSameSkills(skills, node) {
			if (!node) return false;
			if (!skills || !skills.length) return true;
			for (let i = 0; i < node.skills.length; i++) {
				if (node.skills[i] !== skills[i]) return false;
			}
			return true;
		},
		updateSkillMarks(player, skills1, skills2) {
			let node = player.node.xSkillMarks;
			if (!node) {
				node = player.node.xSkillMarks = ui.create.div(".skillMarks", player);
			}
			const playerMarkStyle = lib.config["extension_十周年UI_playerMarkStyle"];
			if (playerMarkStyle !== "decade") {
				node.style.display = "none";
				return;
			}
			node.style.display = "";
			Array.from(node.childNodes).forEach(item => {
				if (skills1.hasOwnProperty(item.dataset.id)) return;
				if (skills2[item.dataset.id]) return;
				item.remove();
			});
			for (const skillId in skills1) {
				if (player.hiddenSkills.includes(skillId) && player !== game.me) continue;
				const info = lib.skill[skillId];
				let item = node.querySelector(`[data-id="${skillId}"]`);
				if (!item) {
					const className = info.zhuanhuanji ? ".skillMarkItem.zhuanhuanji" : ".skillMarkItem.xiandingji";
					item = ui.create.div(className, node, "");
				}
				item.classList.toggle("used", skills1[skillId]);
				item.dataset.id = skillId;
			}
			Array.from(node.querySelectorAll(".juexingji")).forEach(item => {
				if (!skills2[item.dataset.id]) {
					item.remove();
				}
			});
			for (const skillId in skills2) {
				if (player.hiddenSkills.includes(skillId) && player !== game.me) continue;
				const info = lib.skill[skillId];
				if (node.querySelector(`[data-id="${skillId}"]`)) continue;
				const className = info.dutySkill ? ".skillMarkItem.duty" : ".skillMarkItem.juexingji";
				const item = ui.create.div(className, node, "");
				item.dataset.id = skillId;
			}
			plugin.updateXinfuFaluMarks(player);
			plugin.updateStarcanxiMarks(player);
		},
		updateXinfuFaluMarks(player) {
			if (!player.hasSkill("xinfu_falu")) return;
			let skillMarksNode = player.node.xSkillMarks;
			if (!skillMarksNode) return;
			const suitMap = {
				spade: "spade",
				heart: "heart",
				club: "club",
				diamond: "diamond",
			};
			const faluMarks = {};
			lib.suit.forEach(suit => {
				const markName = `xinfu_falu_${suit}`;
				if (player.hasMark(markName)) {
					faluMarks[markName] = true;
				}
			});
			// 清除现有的xinfu_falu标记
			const existingMarks = skillMarksNode.querySelectorAll('[data-id^="xinfu_falu_"]');
			existingMarks.forEach(mark => mark.remove());
			// 创建新的标记
			for (const markName in faluMarks) {
				const suit = markName.slice("xinfu_falu_".length);
				if (suitMap[suit]) {
					const item = ui.create.div(".skillMarkItem", skillMarksNode, "");
					item.dataset.id = markName;
					item.classList.add(`xinfu-falu-${suit}`);
				}
			}
		},
		updateStarcanxiMarks(player) {
			if (!player.hasSkill("starcanxi")) return;
			let skillMarksNode = player.node.xSkillMarks;
			if (!skillMarksNode) return;
			const factions = ["qun", "shu", "wei", "wu", "jin", "shen"];
			const factionMap = {
				qun: "qun",
				shu: "shu",
				wei: "wei",
				wu: "wu",
				jin: "jin",
				shen: "shen",
			};
			const canxiSkills = {};
			factions.forEach(faction => {
				const skillName = `starcanxi_${faction}`;
				if (player.hasSkill(skillName)) {
					canxiSkills[skillName] = true;
				}
			});
			// 清除现有的starcanxi标记
			const existingMarks = skillMarksNode.querySelectorAll('[data-id^="starcanxi_"]');
			existingMarks.forEach(mark => mark.remove());
			// 创建新的标记
			for (const skillName in canxiSkills) {
				const faction = skillName.slice("starcanxi_".length);
				if (factionMap[faction]) {
					const item = ui.create.div(".skillMarkItem", skillMarksNode, "");
					item.dataset.id = skillName;
					item.classList.add(`starcanxi-${faction}`);
				}
			}
		},
		recontent() {
			this.initDialogRewrites();
			this.initPlayerRewrites();
			this.initConfigRewrites();
			this.initEventListeners();
			this.initTimer();
		},
		initDialogRewrites() {
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
		},
		initPlayerRewrites() {
			app.reWriteFunction(lib.element.player, {
				markSkill: [
					function (args, name) {
						const info = lib.skill[name];
						if (!info) return;
						if (info.limited) return this;
						if (info.intro && info.intro.content === "limited") return this;
					},
				],
			});
		},
		initConfigRewrites() {
			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					function (res, config, map) {
						map.button_press.hide();
					},
				],
			});
		},
		initEventListeners() {
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
					const hasName = name && name.trim();
					this.classList.toggle("unshow", !hasName);
					this.node.name.innerHTML = hasName || "";
					return this;
				},
				setCount(count) {
					const isNumber = typeof count === "number";
					this.node.count.innerHTML = isNumber ? count : "";
					this.node.count.classList.toggle("unshow", !isNumber);
					return this;
				},
				setExtra(extra) {
					if (!Array.isArray(extra)) extra = [extra];
					const str = extra
						.filter(item => item && typeof item === "string")
						.map(item => {
							if (item.indexOf("#") === 0) {
								return `<br><div>${item.substr(1)}</div>`;
							}
							return `<div>${item}</div>`;
						})
						.join("");
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
					const skill = lib.skill[this.name];
					if (skill && skill.intro && skill.intro.markExtra) return this;
					if (type === "character") {
						name = get.slimNameHorizontal(name) || name;
						this._characterMark = true;
						return this.setExtra(name);
					}
					return this;
				},
				_customintro(uiintro) {
					const node = this;
					const info = node.info;
					const player = node.parentNode.parentNode;
					if (info.name) {
						if (typeof info.name === "function") {
							const named = info.name(player.storage[node.skill], player);
							if (named) uiintro.add(named);
						} else {
							uiintro.add(info.name);
						}
					} else if (info.name !== false) {
						uiintro.add(get.translation(node.skill));
					}
					if (typeof info.mark === "function") {
						const stint = info.mark(uiintro, player.storage[node.skill], player);
						if (stint) {
							const placetext = uiintro.add(`<div class="text" style="display:inline">${stint}</div>`);
							if (stint.indexOf('<div class="skill"') !== 0) {
								uiintro._place_text = placetext;
							}
						}
					} else {
						const stint = get.storageintro(info.content, player.storage[node.skill], player, uiintro, node.skill);
						if (stint) {
							if (stint[0] === "@") {
								uiintro.add(`<div class="caption">${stint.slice(1)}</div>`);
							} else {
								const placetext = uiintro.add(`<div class="text" style="display:inline">${stint}</div>`);
								if (stint.indexOf('<div class="skill"') !== 0) {
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
				if (_status.dragged || _status.clicked || ui.intro) return;
				const rect = this.getBoundingClientRect();
				ui.click.touchpop();
				ui.click.intro.call(this, {
					clientX: rect.left + 18,
					clientY: rect.top + 12,
				});
				_status.clicked = false;
			},
		},
		initTimer() {
			if (plugin.refreshTimer) {
				clearInterval(plugin.refreshTimer);
			}
			plugin.refreshTimer = setInterval(() => {
				plugin.refreshAllMarks();
				plugin.refreshSkillControls();
			}, 1000);
		},
		refreshAllMarks() {
			if (game.players) {
				game.players.forEach(player => {
					if (player && player.node) {
						plugin.updateXinfuFaluMarks(player);
						plugin.updateStarcanxiMarks(player);
					}
				});
			}
		},
		refreshSkillControls() {
			if (!game.me) return;
			ui.updateSkillControl(game.me, true);
		},
		updateMark(player) {
			const eh = player.node.equips.childNodes.length * 22;
			const bv = Math.max(88, eh) * 0.8 + 1.6;
			player.node.marks.style.bottom = `${bv}px`;
		},
	};
	return plugin;
});
