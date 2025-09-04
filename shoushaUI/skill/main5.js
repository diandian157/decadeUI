app.import(function (lib, game, ui, get, ai, _status, app) {
	var plugin = {
		name: "skill",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			this.initCreateMethods();
			this.initUpdateMethods();
			this.initRewrites();
			this.initVideoContent();
			ui.skillControlArea = ui.create.div();
		},
		initCreateMethods() {
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
						ui.skillControl = plugin.createSkillControl();
					}
					if (clear) {
						ui.skillControl.node.enable.innerHTML = "";
						ui.skillControl.node.trigger.innerHTML = "";
					}
					return ui.skillControl;
				},
			});
		},
		createSkillControl() {
			const isRightLayout = lib.config["extension_十周年UI_rightLayout"] == "on";
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
		initUpdateMethods() {
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
						if (gSkills) skillControl.add(gSkills);
						skillControl.update();
						game.addVideo("updateSkillControl", player, clear);
					}
					const { xiandingji, juexingji } = plugin.processSkillMarks(player);
					plugin.updateSkillMarks(player, xiandingji, juexingji);
				},
			});
		},
		processSkillMarks(player) {
			const xiandingji = {};
			const juexingji = {};
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
			return { xiandingji, juexingji };
		},
		initRewrites() {
			const playerMethods = ["addSkill", "removeSkill", "addSkillTrigger", "removeSkillTrigger", "awakenSkill", "restoreSkill"];
			playerMethods.forEach(method => {
				app.reWriteFunction(lib.element.player, {
					[method]: [
						null,
						function () {
							ui.updateSkillControl(this, method.includes("remove"));
						},
					],
				});
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
					skill.forEach(item => this.add(item, eSkills));
					return this;
				}
				const skills = game.expandSkills([skill]).map(item => app.get.skillInfo(item));
				const enableSkills = this.getEnableSkills(skills);
				const showSkills = enableSkills.length ? enableSkills : skills;
				showSkills.forEach(item => {
					if (this.hasExistingNode(item.id)) return;
					if (item.type === "enable") {
						this.createEnableSkillNode(item);
					} else {
						this.createTriggerSkillNode(item, eSkills);
					}
				});
				return this;
			},
			getEnableSkills(skills) {
				let hasSame = false;
				const enableSkills = skills.filter(item => {
					if (item.type !== "enable") return false;
					if (item.name === skills[0].name) hasSame = true;
					return true;
				});
				if (!hasSame) enableSkills.unshift(skills[0]);
				return enableSkills;
			},
			hasExistingNode(skillId) {
				return this.querySelector(`[data-id="${skillId}"]`);
			},
			createEnableSkillNode(item) {
				const skillName = get.translation(item.name).slice(0, 2);
				const className = lib.skill[item.id].limited ? ".xiandingji" : ".skillitem";
				const node = ui.create.div(className, this.node.enable, skillName);
				node.dataset.id = item.id;
				node.addEventListener("click", () => {
					game.playAudio("..", "extension", "十周年UI", "audio/SkillBtn");
				});
				app.listen(node, plugin.clickSkill);
			},
			createTriggerSkillNode(item, eSkills) {
				if (!item.info || !item.translation) return;
				if (eSkills && eSkills.includes(item.id)) return;
				const skillName = get.translation(item.name).slice(0, 2);
				const targetNode = lib.config.phonelayout ? this.node.trigger : this.node.enable;
				const node = ui.create.div(".skillitem", targetNode, skillName);
				node.dataset.id = item.id;
			},
			update() {
				const skills = this.getAllSkills();
				this.updateSkillNodes(skills);
				this.updateSkillLevel();
			},
			getAllSkills() {
				const skills = [];
				if (ui.skills) skills.addArray(ui.skills.skills);
				if (ui.skills2) skills.addArray(ui.skills2.skills);
				if (ui.skills3) skills.addArray(ui.skills3.skills);
				return skills;
			},
			updateSkillNodes(skills) {
				Array.from(this.node.enable.childNodes).forEach(item => {
					const isUsable = skills.includes(item.dataset.id);
					const isSelected = _status.event.skill === item.dataset.id;
					item.classList.toggle("usable", isUsable);
					item.classList.toggle("select", isSelected);
				});
			},
			updateSkillLevel() {
				const triggerCount = this.node.trigger.childNodes.length;
				const enableCount = this.node.enable.childNodes.length;
				const level1 = Math.min(4, triggerCount);
				const level2 = enableCount > 2 ? 4 : enableCount > 0 ? 2 : 0;
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
			if (this.isSameSkills(skills, node)) {
				return node;
			}
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
		isSameSkills(skills, node) {
			if (!node) return false;
			if (!skills || !skills.length) return true;
			for (let i = 0; i < node.skills.length; i++) {
				if (node.skills[i] !== skills[i]) {
					return false;
				}
			}
			return true;
		},
		updateSkillMarks(player, xiandingji, juexingji) {
			let node = player.node.xSkillMarks;
			if (!node) {
				node = player.node.xSkillMarks = ui.create.div(".skillMarks", player);
			}
			node.style.display = "";
			this.cleanupSkillMarks(node, xiandingji, juexingji);
			this.createSkillMarks(node, xiandingji, juexingji, player);
		},
		cleanupSkillMarks(node, xiandingji, juexingji) {
			Array.from(node.childNodes).forEach(item => {
				if (xiandingji.hasOwnProperty(item.dataset.id)) return;
				if (juexingji[item.dataset.id]) return;
				item.remove();
			});
			Array.from(node.querySelectorAll(".juexingji")).forEach(item => {
				if (!juexingji[item.dataset.id]) {
					item.remove();
				}
			});
		},
		createSkillMarks(node, xiandingji, juexingji, player) {
			for (const skillId in xiandingji) {
				if (player.hiddenSkills.includes(skillId) && player !== game.me) continue;
				const info = lib.skill[skillId];
				let item = node.querySelector(`[data-id="${skillId}"]`);
				if (!item) {
					const className = info.zhuanhuanji ? ".skillMarkItem.zhuanhuanji" : ".skillMarkItem.xiandingji";
					item = ui.create.div(className, node, "");
				}
				item.classList.toggle("used", xiandingji[skillId]);
				item.dataset.id = skillId;
			}
			for (const skillId in juexingji) {
				if (player.hiddenSkills.includes(skillId) && player !== game.me) continue;
				const info = lib.skill[skillId];
				if (node.querySelector(`[data-id="${skillId}"]`)) continue;
				const className = info.dutySkill ? ".skillMarkItem.duty" : ".skillMarkItem.juexingji";
				const item = ui.create.div(className, node, "");
				item.dataset.id = skillId;
			}
		},
		recontent() {
			this.initDialogRewrites();
			this.initPlayerRewrites();
			this.initConfigRewrites();
			this.initEventListeners();
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
					const hasCount = typeof count === "number";
					this.node.count.innerHTML = hasCount ? count : "";
					this.node.count.classList.toggle("unshow", !hasCount);
					return this;
				},
				setExtra(extra) {
					if (!Array.isArray(extra)) extra = [extra];
					const str = extra
						.filter(item => item && typeof item === "string")
						.map(item => {
							if (item.startsWith("#")) {
								return "<br><div>" + item.substr(1) + "</div>";
							}
							return "<div>" + item + "</div>";
						})
						.join("");
					this.node.extra.classList.toggle("unshow", !str);
					this.node.extra.innerHTML = str || "";
					return this;
				},
				setBackground(name, type) {
					const skill = lib.skill[this.name];
					if (skill && skill.intro && skill.intro.markExtra) return this;
					if (type === "character") {
						name = get.translation(name) || name;
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
							if (named) {
								uiintro.add(named);
							}
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
							if (!stint.startsWith('<div class="skill"')) {
								uiintro._place_text = placetext;
							}
						}
					} else {
						const stint = get.storageintro(info.content, player.storage[node.skill], player, uiintro, node.skill);
						if (stint) {
							if (stint.startsWith("@")) {
								uiintro.add(`<div class="caption">${stint.slice(1)}</div>`);
							} else {
								const placetext = uiintro.add(`<div class="text" style="display:inline">${stint}</div>`);
								if (!stint.startsWith('<div class="skill"')) {
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
		updateMark(player) {
			const equipHeight = player.node.equips.childNodes.length * 22;
			const bottomValue = Math.max(88, equipHeight) * 0.8 + 1.6;
			player.node.marks.style.bottom = bottomValue + "px";
		},
	};
	return plugin;
});
