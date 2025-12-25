/**
 * OL风格技能插件
 * 特点：合并区域布局、技能排序（主动技优先）、转换技阴阳图标、额外技能黄点
 */

import { createBaseSkillPlugin } from "./base.js";

const ASSETS_PATH = "extension/十周年UI/ui/assets/skill/online";

export function createOnlineSkillPlugin(lib, game, ui, get, ai, _status, app) {
	const base = createBaseSkillPlugin(lib, game, ui, get, ai, _status, app);

	const plugin = {
		...base,

		precontent() {
			this.initTimer();
			this._extendUICreate();
			this._extendUI();
			base.initBaseRewrites.call(this);
			game.videoContent.updateSkillControl = (player, clear) => ui.updateSkillControl(player, clear);
			ui.skillControlArea = ui.create.div();
		},

		recontent() {
			base.initRecontentRewrites.call(this);
			// 覆写dialog相关
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
						if (info.intro?.content === "limited") return this;
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
			app.on("playerUpdateE", player => plugin.updateMark(player));
		},

		initTimer() {
			if (plugin.refreshTimer) clearInterval(plugin.refreshTimer);
			plugin.refreshTimer = setInterval(() => plugin.refreshSkillControls(), 1000);
		},

		refreshSkillControls() {
			if (!game.me) return;
			ui.updateSkillControl(game.me, true);
		},

		_extendUICreate() {
			Object.assign(ui.create, {
				skills: skills => {
					ui.skills = plugin.createSkills(skills, ui.skills);
					ui.skillControl?.update();
					return ui.skills;
				},
				skills2: skills => {
					ui.skills2 = plugin.createSkills(skills, ui.skills2);
					ui.skillControl?.update();
					return ui.skills2;
				},
				skills3: skills => {
					ui.skills3 = plugin.createSkills(skills, ui.skills3);
					ui.skillControl?.update();
					return ui.skills3;
				},
				skillControl: clear => {
					if (!ui.skillControl) {
						const node = ui.create.div(".skill-control", ui.arena);
						node.node = { combined: ui.create.div(".combined", node) };
						Object.assign(node, plugin.controlElement);
						ui.skillControl = node;
					}
					if (clear) ui.skillControl.node.combined.innerHTML = "";
					return ui.skillControl;
				},
			});
		},

		_extendUI() {
			ui.updateSkillControl = (player, clear) => {
				const eSkills = player.getSkills("e", true, false).slice(0);
				let skills = player.getSkills("invisible", null, false);
				let gSkills = ui.skills2?.skills.length ? ui.skills2.skills : null;

				skills = skills.filter(s => {
					const info = get.info(s);
					return !info?.nopop || s.startsWith("olhedao_tianshu_");
				});

				const iSkills = player.invisibleSkills.slice(0);
				game.expandSkills(iSkills);
				skills.addArray(iSkills.filter(s => get.info(s)?.enable));

				if (player === game.me) {
					const skillControl = ui.create.skillControl(clear);
					skillControl.add(skills, eSkills);
					if (gSkills) skillControl.add(gSkills);
					skillControl.update();
					game.addVideo("updateSkillControl", player, clear);
				}

				const xiandingji = {};
				const juexingji = {};
				player.getSkills("invisible", null, false).forEach(skill => {
					const info = get.info(skill);
					if (!info) return;
					if (get.is.zhuanhuanji(skill, player) || info.limited || info.intro?.content === "limited") {
						xiandingji[skill] = player.awakenedSkills.includes(skill);
					}
					if ((info.juexingji || info.dutySkill) && player.awakenedSkills.includes(skill)) {
						juexingji[skill] = true;
					}
				});
				plugin.updateSkillMarks(player, xiandingji, juexingji);
			};
		},

		// 获取角色原生技能集合
		getNativeSkillSet() {
			const nativeSkillSet = new Set();
			if (!game.me) return nativeSkillSet;
			let nativeSkillsRaw = [];
			const info1 = game.me.name && lib.character[game.me.name];
			const info2 = game.me.name2 && lib.character[game.me.name2];
			if (info1?.[3]) nativeSkillsRaw = nativeSkillsRaw.concat(info1[3]);
			if (info2?.[3]) nativeSkillsRaw = nativeSkillsRaw.concat(info2[3]);
			if (nativeSkillsRaw.length === 0 && get.mode() === "guozhan") {
				try {
					const tmp = game.me.getSkills("invisible", null, false) || [];
					nativeSkillsRaw = nativeSkillsRaw.concat(tmp);
				} catch (e) {}
			}
			nativeSkillsRaw.forEach(s => {
				const expanded = game.expandSkills([s]) || [];
				expanded.forEach(es => nativeSkillSet.add(es));
				nativeSkillSet.add(s);
			});
			return nativeSkillSet;
		},

		controlElement: {
			add(skill, eSkills) {
				if (Array.isArray(skill)) {
					skill.forEach(s => this.add(s, eSkills));
					return this;
				}
				if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
					const expandedE = game.expandSkills(eSkills.slice());
					const expandedS = game.expandSkills([skill]);
					if (expandedS.some(s => expandedE.includes(s))) return this;
				}

				const nativeSkillSet = plugin.getNativeSkillSet();
				const skills = game.expandSkills([skill]).map(s => app.get.skillInfo(s));
				let hasSame = false;
				const enableSkills = skills.filter(s => {
					if (s.type !== "enable") return false;
					if (s.name === skills[0].name) hasSame = true;
					return true;
				});
				if (!hasSame) enableSkills.unshift(skills[0]);
				const showSkills = enableSkills.length ? enableSkills : skills;

				// 排序：主动技 > 被动技
				showSkills.sort((a, b) => {
					const aIsEnable = a.type === "enable";
					const bIsEnable = b.type === "enable";
					if (aIsEnable && !bIsEnable) return -1;
					if (!aIsEnable && bIsEnable) return 1;
					return 0;
				});

				showSkills.forEach(item => {
					let node = this.querySelector(`[data-id="${item.id}"]`);
					if (node) return;
					if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
						if (game.expandSkills(eSkills.slice()).includes(item.id)) return;
					}

					const skillName = get.translation(item.name);
					let finalName = skillName.slice(0, 2);

					// 转换技图标
					if (lib.skill[item.id]?.zhuanhuanji) {
						let imgType = "yang";
						const markNode = game.me?.node?.xSkillMarks?.querySelector(`.skillMarkItem.zhuanhuanji[data-id="${item.id}"]`);
						if (markNode?.classList.contains("yin")) imgType = "ying";
						const imgPath = `${ASSETS_PATH}/skillitem_yinyang_${imgType === "yang" ? "1" : "2"}.png`;
						finalName = `<img src="${imgPath}" class="skill-zhuanhuanji-img">${skillName}`;
					}

					if (item.type === "enable") {
						const cls = lib.skill[item.id].limited ? ".xiandingji.enable-skill" : ".skillitem.enable-skill";
						node = ui.create.div(cls, this.node.combined);
						node.innerHTML = finalName;
						node.dataset.id = item.id;

						// 限定技pass图标
						if (lib.skill[item.id].limited) {
							const passImg = document.createElement("img");
							passImg.className = "skill-xianding-pass";
							passImg.src = `${ASSETS_PATH}/skillitem_xianding_active.png`;
							node.style.position = "relative";
							node.appendChild(passImg);
						}

						// 额外技能黄点
						if (!nativeSkillSet.has(item.id)) {
							const dot = document.createElement("img");
							dot.className = "skill-yellow-dot";
							dot.src = `${ASSETS_PATH}/skillitem_extra_active.png`;
							node.style.position = "relative";
							node.appendChild(dot);
						}

						node.addEventListener("click", () => {
							if (lib.config["extension_十周年UI_bettersound"]) {
								game.playAudio("..", "extension", "十周年UI", "audio/SkillBtn");
							}
						});
						app.listen(node, plugin.clickSkill);
						return;
					}

					if (!item.info || !item.translation) return;
					if (eSkills?.includes(item.id)) return;

					node = ui.create.div(".skillitem.trigger-skill", this.node.combined, finalName);
					node.dataset.id = item.id;

					// 限定技pass图标
					if (lib.skill[item.id].limited) {
						const passImg = document.createElement("img");
						passImg.className = "skill-xianding-pass";
						passImg.src = `${ASSETS_PATH}/skillitem_xianding_active.png`;
						node.style.position = "relative";
						node.appendChild(passImg);
					}

					// 额外技能黄点
					if (!nativeSkillSet.has(item.id)) {
						const dot = document.createElement("img");
						dot.className = "skill-yellow-dot";
						dot.src = `${ASSETS_PATH}/skillitem_extra_active.png`;
						node.style.position = "relative";
						node.appendChild(dot);
					}
				});
				return this;
			},

			update() {
				const skills = [];
				[ui.skills, ui.skills2, ui.skills3].forEach(s => {
					if (s) skills.addArray(s.skills);
				});

				// 重新排序
				const combinedNodes = Array.from(this.node.combined.childNodes);
				if (combinedNodes.length > 1) {
					combinedNodes.sort((a, b) => {
						const aIsEnable = a.classList.contains("enable-skill");
						const bIsEnable = b.classList.contains("enable-skill");
						if (aIsEnable && !bIsEnable) return -1;
						if (!aIsEnable && bIsEnable) return 1;
						return 0;
					});
					combinedNodes.forEach(node => this.node.combined.appendChild(node));
				}

				Array.from(this.node.combined.childNodes).forEach(item => {
					item.classList.toggle("usable", skills.includes(item.dataset.id));
					item.classList.toggle("select", _status.event.skill === item.dataset.id);
				});

				const count = this.node.combined.childNodes.length;
				const level = count > 2 ? 4 : count > 0 ? 2 : 0;
				ui.arena.dataset.sclevel = level;

				// 超过6个启用滚动
				this.node.combined.classList.toggle("scroll-enabled", count > 6);
				this.classList.toggle("scroll-enabled", count > 6);
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
				if (skills?.length) {
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
			if (!skills?.length) return;
			node = ui.create.div(".control.skillControl", ui.skillControlArea);
			Object.assign(node, lib.element.control);
			skills.forEach(skill => {
				const item = ui.create.div(node);
				item.link = skill;
				item.dataset.id = skill;
				item.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
			});
			node.skills = skills;
			node.custom = ui.click.skill;
			return node;
		},

		updateSkillMarks(player, xiandingji, juexingji) {
			let node = player.node.xSkillMarks;
			if (!node) {
				node = player.node.xSkillMarks = ui.create.div(".skillMarks", player);
			}
			node.style.display = "";

			Array.from(node.childNodes).forEach(item => {
				if (!xiandingji.hasOwnProperty(item.dataset.id) && !juexingji[item.dataset.id]) {
					item.remove();
				}
			});

			Object.entries(xiandingji).forEach(([skill, used]) => {
				if (player.hiddenSkills.includes(skill) && player !== game.me) return;
				const info = lib.skill[skill];
				let item = node.querySelector(`[data-id="${skill}"]`);
				if (!item) {
					if (info.zhuanhuanji) {
						item = ui.create.div(".skillMarkItem.zhuanhuanji", node, "");
					} else {
						item = ui.create.div(".skillMarkItem.xiandingji", node, get.translation(skill).slice(0, 2));
					}
				}
				item.classList.toggle("used", used);
				item.dataset.id = skill;
			});

			Array.from(node.querySelectorAll(".juexingji")).forEach(item => {
				if (!juexingji[item.dataset.id]) item.remove();
			});

			Object.keys(juexingji).forEach(skill => {
				if (player.hiddenSkills.includes(skill) && player !== game.me) return;
				if (node.querySelector(`[data-id="${skill}"]`)) return;
				const info = lib.skill[skill];
				const cls = info.dutySkill ? ".skillMarkItem.duty" : ".skillMarkItem.juexingji";
				const item = ui.create.div(cls, node, get.translation(skill).charAt(0));
				item.dataset.id = skill;
			});
		},

		updateMark(player) {
			const eh = player.node.equips.childNodes.length * 22;
			const bv = Math.max(88, eh) * 0.8 + 1.6;
			player.node.marks.style.bottom = `${bv}px`;
		},
	};

	return plugin;
}
