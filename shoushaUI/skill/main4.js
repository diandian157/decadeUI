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
						const node = ui.create.div(".skill-control", ui.arena);
						node.node = {
							combined: ui.create.div(".combined", node), // 合并区域
						};
						for (const i in plugin.controlElement) {
							node[i] = plugin.controlElement[i];
						}
						ui.skillControl = node;
					}
					if (clear) {
						ui.skillControl.node.combined.innerHTML = "";
					}
					return ui.skillControl;
				},
			});
			Object.assign(ui, {
				updateSkillControl(player, clear) {
					const eSkills = player.getSkills("e", true, false).slice(0);
					let skills = player.getSkills("invisible", null, false); /*国战隐匿技能*/
					let gSkills;
					if (ui.skills2 && ui.skills2.skills.length) {
						gSkills = ui.skills2.skills;
					}
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
						if (gSkills) skillControl.add(gSkills);
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
			});
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
				const nativeSkillSet = new Set();
				if (game.me) {
					let nativeSkillsRaw = [];
					const info1 = game.me.name && lib.character[game.me.name];
					const info2 = game.me.name2 && lib.character[game.me.name2];
					if (info1 && Array.isArray(info1[3])) nativeSkillsRaw = nativeSkillsRaw.concat(info1[3]);
					if (info2 && Array.isArray(info2[3])) nativeSkillsRaw = nativeSkillsRaw.concat(info2[3]);
					if (nativeSkillsRaw.length === 0 && get.mode() === "guozhan") {
						try {
							const tmp = game.me.getSkills("invisible", null, false) || [];
							nativeSkillsRaw = nativeSkillsRaw.concat(tmp);
						} catch (e) {}
					}
					nativeSkillsRaw.forEach(function (s) {
						const expanded = game.expandSkills([s]) || [];
						expanded.forEach(function (es) {
							nativeSkillSet.add(es);
						});
						nativeSkillSet.add(s);
					});
				}
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
				// 对技能进行排序：主动技 > 限定技 > 被动技
				showSkills.sort(function (a, b) {
					const aIsEnable = a.type === "enable";
					const bIsEnable = b.type === "enable";
					// 主动技优先
					if (aIsEnable && !bIsEnable) return -1;
					if (!aIsEnable && bIsEnable) return 1;
					return 0;
				});
				showSkills.forEach(function (item) {
					let node = self.querySelector(`[data-id="${item.id}"]`);
					if (node) return;
					if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
						const expandedESkills = game.expandSkills(eSkills.slice());
						if (expandedESkills.includes(item.id)) return;
					}
					const skillName = get.translation(item.name);
					let finalName = skillName.slice(0, 2);
					if (lib.skill[item.id] && lib.skill[item.id].zhuanhuanji) {
						let imgType = "yang";
						const player = game.me;
						const markNode = player && player.node && player.node.xSkillMarks && player.node.xSkillMarks.querySelector(`.skillMarkItem.zhuanhuanji[data-id="${item.id}"]`);
						if (markNode && markNode.classList.contains("yin")) {
							imgType = "ying";
						}
						const imgPath = `extension/十周年UI/shoushaUI/skill/online/skillitem_yinyang_${imgType === "yang" ? "1" : "2"}.png`;
						finalName = `<img src="${imgPath}" class="skill-zhuanhuanji-img">${skillName}`;
					}
					if (item.type === "enable") {
						// 主动技添加到合并区域，但保持enable样式类
						node = ui.create.div(lib.skill[item.id].limited ? ".xiandingji.enable-skill" : ".skillitem.enable-skill", self.node.combined);
						node.innerHTML = finalName;
						node.dataset.id = item.id;

						// 如果是限定机，添加左上角的pass图片
						if (lib.skill[item.id].limited) {
							const passImg = document.createElement("img");
							passImg.className = "skill-xianding-pass";
							passImg.src = "extension/十周年UI/shoushaUI/skill/online/skillitem_xianding_active.png";
							node.style.position = "relative";
							node.appendChild(passImg);
						}

						if (lib.skill[item.id] && !nativeSkillSet.has(item.id) && node) {
							const dot = document.createElement("img");
							dot.className = "skill-yellow-dot";
							dot.src = "extension/十周年UI/shoushaUI/skill/online/skillitem_extra_active.png";
							node.style.position = "relative";
							node.appendChild(dot);
						}
						node.addEventListener("click", function () {
							if (lib.config["extension_十周年UI_bettersound"]) game.playAudio("..", "extension", "十周年UI", "audio/SkillBtn");
						});
						app.listen(node, plugin.clickSkill);
						return;
					}
					if (!item.info) return;
					if (!item.translation) return;
					if (eSkills && eSkills.includes(item.id)) return;
					// 被动技添加到合并区域，但保持trigger样式类
					node = ui.create.div(".skillitem.trigger-skill", self.node.combined, finalName);
					node.dataset.id = item.id;
					// 如果是限定机，添加左上角的pass图片
					if (lib.skill[item.id].limited) {
						const passImg = document.createElement("img");
						passImg.className = "skill-xianding-pass";
						passImg.src = "extension/十周年UI/shoushaUI/skill/online/skillitem_xianding_active.png";
						node.style.position = "relative";
						node.appendChild(passImg);
					}
					if (lib.skill[item.id] && !nativeSkillSet.has(item.id) && node) {
						const dot = document.createElement("img");
						dot.className = "skill-yellow-dot";
						dot.src = "extension/十周年UI/shoushaUI/skill/online/skillitem_extra_active.png";
						node.style.position = "relative";
						node.appendChild(dot);
					}
				});
				return this;
			},
			update() {
				const skills = [];
				if (ui.skills) skills.addArray(ui.skills.skills);
				if (ui.skills2) skills.addArray(ui.skills2.skills);
				if (ui.skills3) skills.addArray(ui.skills3.skills);
				// 重新排序合并区域中的技能
				const combinedNodes = Array.from(this.node.combined.childNodes);
				if (combinedNodes.length > 1) {
					// 对技能节点进行排序：主动技 > 限定技 > 被动技
					combinedNodes.sort(function (a, b) {
						const aId = a.dataset.id;
						const bId = b.dataset.id;
						const aIsEnable = a.classList.contains("enable-skill");
						const bIsEnable = b.classList.contains("enable-skill");
						// 主动技优先
						if (aIsEnable && !bIsEnable) return -1;
						if (!aIsEnable && bIsEnable) return 1;
						return 0;
					});
					// 重新排列DOM节点
					combinedNodes.forEach(
						function (node) {
							this.node.combined.appendChild(node);
						}.bind(this)
					);
				}
				// 处理合并区域中的技能
				Array.from(this.node.combined.childNodes).forEach(function (item) {
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
				// 计算技能区域级别
				const combinedCount = this.node.combined.childNodes.length;
				const level = combinedCount > 2 ? 4 : combinedCount > 0 ? 2 : 0;
				ui.arena.dataset.sclevel = level;
				// 检查技能数量，超过6个时启用滚动
				if (combinedCount > 6) {
					this.node.combined.classList.add("scroll-enabled");
					this.classList.add("scroll-enabled");
				} else {
					this.node.combined.classList.remove("scroll-enabled");
					this.classList.remove("scroll-enabled");
				}
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
			//使限定技和转换技显示不同的样式
			for (const k in skills1) {
				if (player.hiddenSkills.includes(k) && player !== game.me) continue;
				const info = lib.skill[k];
				let item = node.querySelector(`[data-id="${k}"]`);
				if (!item) {
					if (!info.zhuanhuanji) {
						item = ui.create.div(".skillMarkItem.xiandingji", node, get.translation(k).slice(0, 2));
					} else item = ui.create.div(".skillMarkItem.zhuanhuanji", node, "");
					//如果不是转换技就调用限定技的标记
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
			//使觉醒技和使命技不同
			for (const k in skills2) {
				if (player.hiddenSkills.includes(k) && player !== game.me) continue;
				const info = lib.skill[k];
				if (node.querySelector(`[data-id="${k}"]`)) continue;
				let item;
				if (info.dutySkill) {
					item = ui.create.div(".skillMarkItem.duty", node, get.translation(k).charAt(0));
				} else {
					item = ui.create.div(".skillMarkItem.juexingji", node, get.translation(k).charAt(0));
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
