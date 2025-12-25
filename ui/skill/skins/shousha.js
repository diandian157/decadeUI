/**
 * 手杀风格技能插件
 * 特点：失效技能显示、转换技图标、技能次数显示、判定图标位置调整
 */

import { createBaseSkillPlugin } from "./base.js";

const ASSETS_PATH = "extension/十周年UI/ui/assets/skill/shousha";

export function createShoushaSkillPlugin(lib, game, ui, get, ai, _status, app) {
	const base = createBaseSkillPlugin(lib, game, ui, get, ai, _status, app);

	const plugin = {
		...base,

		precontent() {
			this.initTimer();
			this._extendUICreate();
			this._extendUI();
			base.initBaseRewrites.call(this);
			ui.skillControlArea = ui.create.div();
		},

		recontent() {
			base.initRecontentRewrites.call(this);
		},

		// 扩展ui.create
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
						const isRight = lib.config["extension_十周年UI_rightLayout"] === "on";
						const cls = isRight ? ".skill-control" : ".skill-controlzuoshou";
						const node = ui.create.div(cls, ui.arena);
						node.node = {
							enable: ui.create.div(".enable", node),
							trigger: ui.create.div(".trigger", node),
						};
						Object.assign(node, plugin.controlElement);
						ui.skillControl = node;
					}
					if (clear) {
						ui.skillControl.node.enable.innerHTML = "";
						ui.skillControl.node.trigger.innerHTML = "";
					}
					return ui.skillControl;
				},
			});
		},

		// 扩展ui
		_extendUI() {
			ui.updateSkillControl = (player, clear) => {
				const eSkills = player.getSkills("e", true, false).slice(0);
				let skills = player.getSkills("invisible", null, false);

				// 过滤nopop技能
				skills = skills.filter(s => {
					const info = get.info(s);
					return !info?.nopop || s.startsWith("olhedao_tianshu_");
				});

				// 添加隐藏技能中的enable技能
				const iSkills = player.invisibleSkills.slice(0);
				game.expandSkills(iSkills);
				skills.addArray(iSkills.filter(s => get.info(s)?.enable));

				if (player === game.me) {
					const control = ui.create.skillControl(clear);
					control.add(skills, eSkills);
					control.update();
					game.addVideo("updateSkillControl", player, clear);
				}

				// 更新技能标记
				const xiandingji = {};
				const juexingji = {};

				player.getSkills("invisible", null, false).forEach(skill => {
					const info = get.info(skill);
					if (!info) return;

					if (get.is.zhuanhuanji(skill, player) || info.limited || info.intro?.content === "limited") {
						xiandingji[skill] = player.awakenedSkills.includes(skill);
					}

					// 觉醒技（只在觉醒后显示）
					if ((info.juexingji || info.dutySkill) && player.awakenedSkills.includes(skill)) {
						juexingji[skill] = true;
					}
				});

				plugin.updateSkillMarks(player, xiandingji, juexingji);
			};
		},

		// 控制元素方法
		controlElement: {
			// 技能次数显示
			addSkillNumber(node, num) {
				const nums = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳"];
				const text = document.createElement("span");
				text.classList.add("numText");
				const child = document.createElement("span");
				child.classList.add("numText-child");
				child.innerText = nums[num] || `(${num})`;
				node.appendChild(child);
				node.appendChild(text);
				text.innerText = nums[num] || `(${num})`;
			},

			// 获取技能剩余次数
			getSkillRemainingCount(skillId, player) {
				if (!player.hasSkill(skillId)) return null;

				let skills = [skillId];
				const group = get.info(skillId)?.group;
				if (group) skills.add(...(typeof group === "string" ? [group] : group));

				skills = skills.filter(s => get.info(s)?.usable !== undefined);
				if (!skills.length) return null;

				for (const skill of skills) {
					let num = get.info(skill).usable;
					if (typeof num === "function") num = num(skill, player);
					if (typeof num === "number" && (skill === "dbquedi" || num > 1)) {
						let used = get.skillCount(skill, player);
						used += player?.storage?.counttrigger?.[skill] || 0;
						return num - used;
					}
				}
				return null;
			},

			// 检查势力过滤
			checkGroupFilter(skillInfo) {
				if (!skillInfo.filter) return true;
				const str = skillInfo.filter.toString();
				if (!str.includes("player.group")) return true;

				let sub = str.substr(str.indexOf("player.group"));
				for (const quote of ["'", '"']) {
					if (sub.includes(quote)) {
						sub = sub.substr(sub.indexOf(quote) + 1);
						if (sub.includes(quote)) {
							const group = sub.substr(0, sub.indexOf(quote));
							return !group || group === game.me.group;
						}
					}
				}
				return true;
			},

			// 添加技能锁和按钮
			addSkillLocksAndButtons(node, skillId) {
				const player = game.me;

				// 失效锁
				if (this.skshixiaoSkillBlocker?.includes(skillId)) {
					node.classList.add("shixiao");
					ui.create.div(".suo1.fengyinsuo", node, "");
					node.style["-webkit-text-fill-color"] = "silver";
					node.style["-webkit-text-stroke"] = "0.8px rgba(0,0,0,0.55)";
				}

				// 转换技
				const info = get.info(skillId);
				if (info?.zhuanhuanji) {
					const isYang = !player.yangedSkills?.includes(skillId);
					ui.create.div(isYang ? ".yang" : ".ying", node, "");
				}
			},

			// 添加技能
			add(skill, eSkills) {
				// 获取失效技能
				this.skshixiaoSkillBlocker = game.me.getSkills(null, false, false).filter(s => {
					if (game.me.getStorage("skill_blocker")?.some(i => lib.skill[i]?.skillBlocker?.(s, game.me))) return true;
					if (game.me.disabledSkills?.[s]?.length > 0 && game.me.disabledSkills[s].some(x => x !== `${s}_awake`)) return true;
					if (game.me.shixiaoedSkills?.includes(s)) return true;
					if (game.me.isTempBanned(s)) return true;
					return false;
				});

				// 添加子技能
				this.skshixiaoSkillBlocker.forEach(s => {
					const group = lib.skill[s]?.group;
					if (Array.isArray(group)) this.skshixiaoSkillBlocker.add(...group);
					else if (typeof group === "string") this.skshixiaoSkillBlocker.add(group);
				});

				// 添加失效技能到显示列表
				if (Array.isArray(skill)) {
					this.skshixiaoSkillBlocker.forEach(s => {
						if (!skill.includes(s)) skill.add(s);
					});
					const sortlist = game.expandSkills(game.me.getSkills(null, false, false));
					skill.sort((a, b) => sortlist.indexOf(a) - sortlist.indexOf(b));
				}

				if (Array.isArray(skill)) {
					skill.forEach(s => this.add(s, eSkills));
					return this;
				}

				// 过滤装备技能
				if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
					const expandedE = game.expandSkills(eSkills.slice());
					const expandedS = game.expandSkills([skill]);
					if (expandedS.some(s => expandedE.includes(s))) return this;
				}

				const skills = game.expandSkills([skill]).map(s => app.get.skillInfo(s));
				let hasSame = false;
				const enableSkills = skills.filter(s => {
					if (s.type !== "enable") return false;
					if (s.name === skills[0].name) hasSame = true;
					return true;
				});

				if (!hasSame) enableSkills.unshift(skills[0]);
				const showSkills = enableSkills.length ? enableSkills : skills;

				showSkills.forEach(item => {
					if (!this.checkGroupFilter(lib.skill[item.id])) return;
					if (lib.skill[item.id].viewAsFilter && !this.checkGroupFilter({ filter: lib.skill[item.id].viewAsFilter })) return;

					let node = this.querySelector(`[data-id="${item.id}"]`);
					if (node) return;

					if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
						if (game.expandSkills(eSkills.slice()).includes(item.id)) return;
					}

					if (item.type === "enable") {
						const name = get.translation(item.name).slice(0, 2);
						const classRules = [
							{ key: "jianjie_huoji", cls: ".skillitem_smh_huoji" },
							{ key: "jianjie_lianhuan", cls: ".skillitem_smh_lianhuan" },
							{ key: "jianjie_yeyan", cls: ".skillitem_smh_yeyan" },
						];
						const matched = classRules.find(r => item.id.includes(r.key));
						const cls = matched?.cls || ".skillitem";

						node = ui.create.div(cls, this.node.enable, name);
						const remaining = this.getSkillRemainingCount(item.id, game.me);
						if (remaining !== null) this.addSkillNumber(node, remaining);

						this.addSkillLocksAndButtons(node, item.id);
						ui.create.div(".skillitem-child", node, name);
						node.dataset.id = item.id;

						node.addEventListener("click", () => {
							if (lib.config["extension_十周年UI_bettersound"]) {
								game.playAudio("..", "extension", "十周年UI", "audio/SkillBtn");
							}
						});
						app.listen(node, plugin.clickSkill);
						return;
					}

					if (!item.info || !item.translation || item.id === "jiu") return;
					if (eSkills?.includes(item.id)) return;

					const skillName = get.translation(item.name).slice(0, 2);
					node = ui.create.div(".skillitem", this.node.trigger, skillName);
					this.addSkillLocksAndButtons(node, item.id);

					const remaining = this.getSkillRemainingCount(item.id, game.me);
					if (remaining !== null) this.addSkillNumber(node, remaining);

					ui.create.div(".skillitem-child", node, skillName);
					node.dataset.id = item.id;
				});

				return this;
			},

			// 更新显示
			update() {
				const skills = [];
				// shousha 样式的 gskills (skills2) 显示在 confirm 按钮区域，不在 skillControl 中显示
				[ui.skills, ui.skills3].forEach(s => {
					if (s) skills.addArray(s.skills);
				});

				Array.from(this.node.enable.childNodes).forEach(item => {
					item.classList.toggle("usable", skills.includes(item.dataset.id));
					item.classList.toggle("select", _status.event.skill === item.dataset.id);
				});

				const count = this.node.enable.childNodes.length;
				const width = count > 2 ? "200px" : count > 0 ? "114px" : "0px";
				this.node.enable.style.width = width;
				this.node.enable.style.setProperty("transform", `translateX(-${count > 2 ? 20 : 0}px)`, "important");

				// 调整判定图标位置
				const num = this.node.enable.childNodes.length;
				const num2 = this.node.trigger.childNodes.length;

				game.players.concat(game.dead).forEach(player => {
					let offset = 75;
					if (game.me === player) {
						const adjustedNum = num === 2 ? 4 : num;
						offset -= Math.ceil(adjustedNum / 2) * 44 + (Math.ceil(num2 / 3) - 1) * 28;
					} else {
						offset = -17;
					}
					player.getCards("j").forEach(card => {
						card.node.judgeMark?.node?.judge?.style.setProperty("top", `${offset}px`, "important");
					});
				});

				const level1 = Math.min(4, this.node.trigger.childNodes.length);
				const level2 = count > 2 ? 4 : count > 0 ? 2 : 0;
				ui.arena.dataset.sclevel = Math.max(level1, level2);
			},
		},

		// 检查图片是否存在
		checkImageExists(url) {
			const xhr = new XMLHttpRequest();
			xhr.open("Get", url, false);
			xhr.send();
			return xhr.status !== 404;
		},

		// 更新技能标记
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
					if (!info.zhuanhuanji && !info.zhuanhuanji2) {
						item = ui.create.div(".skillMarkItem.xiandingji", node, get.skillTranslation(skill, player).slice(0, 2));
					} else {
						const url = `${lib.assetURL}${ASSETS_PATH}/zhuanhuanji/${skill}_yang.png`;
						try {
							if (this.checkImageExists(url)) {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, "");
								item.setBackgroundImage(`${ASSETS_PATH}/zhuanhuanji/${skill}_yang.png`);
							} else {
								item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(skill, player).slice(0, 2));
								item.setBackgroundImage(`${ASSETS_PATH}/zhuanhuanji/ditu_yang.png`);
								item.style.setProperty("--w", "42px");
							}
						} catch (e) {
							item = ui.create.div(".skillMarkItem.zhuanhuanji", node, get.skillTranslation(skill, player).slice(0, 2));
							item.setBackgroundImage(`${ASSETS_PATH}/zhuanhuanji/ditu_yang.png`);
							item.style.setProperty("--w", "42px");
						}
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
				const item = ui.create.div(cls, node, get.skillTranslation(skill, player).slice(0, 2));
				item.dataset.id = skill;
			});
		},
	};

	return plugin;
}
