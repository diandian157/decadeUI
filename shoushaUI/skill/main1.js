app.import(function (lib, game, ui, get, ai, _status, app) {
	const plugin = {
		name: "skill",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			this.initTimer();
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
						const isRightLayout = lib.config["extension_十周年UI_rightLayout"] === "on";
						const className = isRightLayout ? ".skill-control" : ".skill-controlzuoshou";
						const node = ui.create.div(className, ui.arena);
						node.node = {
							enable: ui.create.div(".enable", node),
							trigger: ui.create.div(".trigger", node),
						};
						for (const i in plugin.controlElement) {
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
					const eSkills = player.getSkills("e", true, false).slice(0);
					let skills = player.getSkills("invisible", null, false);
					for (let i = 0; i < skills.length; i++) {
						const info = get.info(skills[i]);
						if (info && info.nopop && !skills[i].startsWith("olhedao_tianshu_")) skills.splice(i--, 1);
					}
					const iSkills = player.invisibleSkills.slice(0);
					game.expandSkills(iSkills);
					skills.addArray(
						iSkills.filter(function (skill) {
							const info = get.info(skill);
							return info && info.enable;
						})
					);
					if (player === game.me) {
						const skillControl = ui.create.skillControl(clear);
						skillControl.add(skills, eSkills);
						skillControl.update();
						game.addVideo("updateSkillControl", player, clear);
					}
					const juexingji = {};
					const xiandingji = {};
					player.getSkills("invisible", null, false).forEach(function (skill) {
						const info = get.info(skill);
						if (!info) return;
						if (get.is.zhuanhuanji(skill, player) || info.limited || (info.intro && info.intro.content === "limited")) {
							xiandingji[skill] = player.awakenedSkills.includes(skill);
						}
						// 修改觉醒技显示逻辑：只在觉醒后才显示
						if ((info.juexingji || info.dutySkill) && player.awakenedSkills.includes(skill)) {
							juexingji[skill] = true;
						}
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
				const numArray = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];
				const text = document.createElement("span");
				text.classList.add("numText");
				const numTextChild = document.createElement("span");
				numTextChild.classList.add("numText-child");
				numTextChild.innerText = numArray[num] || `(${num})`;
				node.appendChild(numTextChild);
				node.appendChild(text);
				text.innerText = numArray[num] || `(${num})`;
			},
			getSkillRemainingCount(skillId, player) {
				if (!player.hasSkill(skillId)) return null;
				let skills = [skillId];
				if (get.info(skillId).group) {
					const group = get.info(skillId).group;
					skills.add(...(typeof group === "string" ? [group] : group));
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
					const img = ui.create.div(".suo1.fengyinsuo", node, "");
					img.style.position = "absolute";
					node.style["-webkit-text-fill-color"] = "silver";
					node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
				}
				//失效锁修改结束
				const skillInfo = get.info(skillId);
				if (skillInfo && skillInfo.zhuanhuanji) {
					if (!player.yangedSkills?.includes(skillId)) {
						const img = ui.create.div(".yang", node, "");
						img.style.position = "absolute";
					} else {
						const img = ui.create.div(".ying", node, "");
						img.style.position = "absolute";
					}
				}
			},
			add(skill, eSkills) {
				//鹿鹿修改 显示失效技能
				const self = this;
				self.skshixiaoSkillBlocker = game.me.getSkills(null, false, false).filter(skillx => {
					if (game.me.getStorage("skill_blocker")) {
						for (const i of game.me.getStorage("skill_blocker")) {
							if (lib.skill[i] && lib.skill[i].skillBlocker && lib.skill[i].skillBlocker(skillx, game.me)) {
								return true;
							}
						}
					}
					if (game.me.disabledSkills) {
						if (game.me.disabledSkills[skillx] && game.me.disabledSkills[skillx].length > 0 && game.me.disabledSkills[skillx].some(sbawk => sbawk !== `${skillx}_awake`)) {
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
				for (const i of self.skshixiaoSkillBlocker) {
					if (lib.skill[i] && lib.skill[i].group) {
						const shabizjn = lib.skill[i].group;
						if (Array.isArray(shabizjn)) {
							self.skshixiaoSkillBlocker.add(...shabizjn);
						} else if (typeof shabizjn === "string") {
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
					const sortlist = game.expandSkills(game.me.getSkills(null, false, false));
					skill.sort((a, b) => sortlist.indexOf(a) - sortlist.indexOf(b));
				}
				//修改结束
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
				const self2 = this;
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
					if (!self2.checkGroupFilter(lib.skill[item.id])) return;
					if (lib.skill[item.id].viewAsFilter && !self2.checkGroupFilter({ filter: lib.skill[item.id].viewAsFilter })) return;
					let node = self2.querySelector(`[data-id="${item.id}"]`);
					if (node) return;
					if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
						const expandedESkills = game.expandSkills(eSkills.slice());
						if (expandedESkills.includes(item.id)) return;
					}
					if (item.type === "enable") {
						const name = get.translation(item.name).slice(0, 2);
						const classRules = [
							{ key: "jianjie_huoji", cls: ".skillitem_smh_huoji" },
							{ key: "jianjie_lianhuan", cls: ".skillitem_smh_lianhuan" },
							{ key: "jianjie_yeyan", cls: ".skillitem_smh_yeyan" },
						];
						const matched = classRules.find(r => item.id.indexOf(r.key) !== -1);
						const finalClass = matched ? matched.cls : ".skillitem";
						node = ui.create.div(finalClass, self2.node.enable, name);
						const remainingCount = self2.getSkillRemainingCount(item.id, game.me);
						if (remainingCount !== null) {
							self2.addSkillNumber(node, remainingCount);
						}
						self2.addSkillLocksAndButtons(node, item.id);
						ui.create.div(".skillitem-child", node, name);
						node.dataset.id = item.id;
						node.addEventListener("click", function () {
							if (lib.config["extension_十周年UI_bettersound"]) game.playAudio("..", "extension", "十周年UI", "audio/SkillBtn");
						});
						app.listen(node, plugin.clickSkill);
						return;
					}
					if (!item.info || !item.translation || item.id === "jiu") return;
					if (eSkills && eSkills.includes(item.id)) return;
					const skillName = get.translation(item.name).slice(0, 2);
					node = ui.create.div(".skillitem", self2.node.trigger, skillName);
					self2.addSkillLocksAndButtons(node, item.id);
					const remainingCount = self2.getSkillRemainingCount(item.id, game.me);
					if (remainingCount !== null) {
						self2.addSkillNumber(node, remainingCount);
					}
					ui.create.div(".skillitem-child", node, skillName);
					node.dataset.id = item.id;
				});
				return this;
			},
			update() {
				const skills = [];
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
				//技能超过2个按钮左移
				ui.skillControl.node.enable.style.setProperty("transform", `translateX(-${ui.skillControl.node.enable.childNodes.length > 2 ? "20" : "0"}px)`, "important");
				//自动调整判断图标位置，代码源自子琪
				let num = this.node.enable.childNodes.length;
				const num2 = this.node.trigger.childNodes.length;
				const playerx = game.players.concat(game.dead);
				for (const i of playerx) {
					let numx = 75;
					if (game.me && game.me === i) {
						if (num === 2) num = 4;
						numx = numx - (Math.ceil(num / 2) * 44 + (Math.ceil(num2 / 3) - 1) * 28);
					} else numx = -17;
					for (const j of i.getCards("j")) {
						j.node.judgeMark.node.judge.style.setProperty("top", `${numx}px`, "important");
					}
				}
				const level1 = Math.min(4, this.node.trigger.childNodes.length);
				const level2 = enableCount > 2 ? 4 : enableCount > 0 ? 2 : 0;
				const level = Math.max(level1, level2);
				ui.arena.dataset.sclevel = level;
			},
		},
		checkSkill(skill) {
			const info = lib.skill[skill];
			if (!info) return -1;
			if (info.enable) return 1;
			return 0;
		},
		clickSkill(e) {
			if (this.classList.contains("usable")) {
				const skill = this.dataset.id;
				const item = ui.skillControlArea.querySelector(`[data-id="${skill}"]`);
				item && app.mockTouch(item);
			}
		},
		createSkills(skills, node) {
			let same = true;
			if (node) {
				if (skills && skills.length) {
					for (let i = 0; i < node.skills.length; i++) {
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
				const item = ui.create.div(node);
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
			let node = player.node.xSkillMarks;
			if (!node) {
				node = player.node.xSkillMarks = ui.create.div(".skillMarks", player);
			}
			node.style.display = "";
			Array.from(node.childNodes).forEach(function (item) {
				if (skills1.hasOwnProperty(item.dataset.id)) return;
				if (skills2[item.dataset.id]) return;
				item.remove();
			});
			for (const k in skills1) {
				if (player.hiddenSkills.includes(k) && player !== game.me) continue;
				const info = lib.skill[k];
				let item = node.querySelector(`[data-id="${k}"]`);
				if (!item) {
					if (!info.zhuanhuanji && !info.zhuanhuanji2) {
						item = ui.create.div(".skillMarkItem.xiandingji", node, get.skillTranslation(k, player).slice(0, 2));
					} else {
						const url = `${lib.assetURL}extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${k}_yang.png`;
						try {
							if (this.checkImageExists(url)) {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, "");
								item.setBackgroundImage(`extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${k}_yang.png`);
							} else {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(k, player).slice(0, 2));
								item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_yang.png");
								item.style.setProperty("--w", "42px");
							}
						} catch (err) {
							item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(k, player).slice(0, 2));
							item.setBackgroundImage("extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_yang.png");
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
			for (const k in skills2) {
				if (player.hiddenSkills.includes(k) && player !== game.me) continue;
				const info = lib.skill[k];
				if (node.querySelector(`[data-id="${k}"]`)) continue;
				let item;
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
						const info = lib.skill[name];
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
					let str = "";
					if (!Array.isArray(extra)) extra = [extra];
					extra.forEach(function (item) {
						if (!item || typeof item !== "string") return this;
						if (item.indexOf("#") === 0) {
							item = item.substr(1);
							str += "<br>";
						}
						str += `<div>${item}</div>`;
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
				if (_status.dragged) return;
				if (_status.clicked) return;
				if (ui.intro) return;
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
				plugin.refreshSkillControls();
			}, 1000);
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
