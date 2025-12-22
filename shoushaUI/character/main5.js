app.import((lib, game, ui, get, ai, _status, app) => {
	// 获取势力背景图片路径接口
	function getBabyBackgroundImage(group) {
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key", "Han", "qin"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `extension/十周年UI/shoushaUI/character/images/baby/baby_${group}.png`;
	}

	function getBabysBackgroundImage(group) {
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key", "Han", "qin"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `extension/十周年UI/shoushaUI/character/images/baby/babys_${group}.png`;
	}

	// 第一页
	const plugin = {
		name: "character",
		// 边框背景接口，外部可通过覆盖此方法自定义背景逻辑
		getBabyBackgroundImage(group) {
			return getBabyBackgroundImage(group);
		},
		// 势力背景接口，外部可通过覆盖此方法自定义背景逻辑
		getBabysBackgroundImage(group) {
			return getBabysBackgroundImage(group);
		},
		filter() {
			return !["chess", "tafang", "stone"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			app.reWriteFunction(lib, {
				setIntro: [
					function (args, node) {
						if (get.itemtype(node) === "player") {
							if (lib.config.touchscreen) {
								lib.setLongPress(node, plugin.click.playerIntro);
							} else if (lib.config.right_info) {
								node.oncontextmenu = function (e) {
									if (e && e.preventDefault) e.preventDefault();
									if (e && e.stopPropagation) e.stopPropagation();
									plugin.click.playerIntro.call(this, e);
									return false;
								};
							}
							return node;
						}
					},
				],
			});
		},

		// 工具函数
		utils: {
			// 获取分包信息
			getPack(name) {
				const pack = Object.keys(lib.characterPack).find(pack => lib.characterPack[pack][name]);
				if (pack) {
					if (lib.characterSort[pack]) {
						const sort = Object.keys(lib.characterSort[pack]).find(sort => lib.characterSort[pack][sort].includes(name));
						if (sort) return lib.translate[sort];
					}
					return lib.translate[pack + "_character_config"] || lib.translate[pack];
				}
				return "暂无分包";
			},

			// 获取武将名文本
			getCharacterNameText(name, name2) {
				let nametext = "";

				if (name && name2) {
					nametext += this.getSingleName(name);
					nametext += " / ";
					nametext += this.getSingleName(name2);
				} else {
					nametext += this.getSingleName(name);
				}

				return nametext;
			},

			// 获取单个武将名
			getSingleName(name) {
				if (name === "unknown") return "未知";
				if (lib.translate[name + "_ab"]) return lib.translate[name + "_ab"];
				return get.translation(name);
			},

			// 获取稀有度图片URL
			getRarityImageUrl(name, extensionPath) {
				let rarity = game.getRarity(name);
				if (!rarity) rarity = "junk";

				if (lib.config["extension_千幻聆音_enable"] && game.qhly_getSkin && game.qhly_getSkinLevel) {
					const level = game.qhly_getSkinLevel(name, game.qhly_getSkin(name), true, false);
					const levelToRarity = {
						xiyou: "rare",
						shishi: "epic",
						chuanshuo: "legend",
						putong: "common",
						dongtai: "legend",
						jueban: "unique",
						xianding: "restrictive",
					};
					const temp = levelToRarity[level] || "junk";
					return `${extensionPath}character/images/pe_${temp}.png`;
				}
				return `${extensionPath}character/images/pe_${rarity}.png`;
			},

			// 创建武将按钮
			createCharacterButton(name, parent) {
				if (!name || !lib.character[name]) return;
				const button = ui.create.button(name, "character", parent, true);
				if (button) {
					button.style.pointerEvents = "auto";
					button.style.zIndex = "100";
				}
				return button;
			},

			// 初始化玩家属性
			initPlayerProperties(player) {
				if (!player.guanjiejibie) {
					player.guanjiejibie = Math.floor(Math.random() * 9 + 1);
				}
				if (!player.dengji) {
					const tempDengji = [Math.floor(Math.random() * (200 - 180 + 1)) + 180, 200, 200].randomGet();
					player.dengji = tempDengji;
				}
				if (!player.xvipjibie) {
					player.xvipjibie = Math.floor(Math.random() * 8 + 1);
				}
				if (!player.xingxiangIndex) {
					player.xingxiangIndex = Math.floor(Math.random() * 6);
				}
			},
		},

		// 官阶翻译表
		guanjieTranslation: {
			1: ["骁卒", ["步卒", "伍长", "什长", "队率", "屯长", "部曲"]],
			2: ["校尉", ["县尉", "都尉", "步兵校尉", "典军校尉"]],
			3: ["郎将", ["骑郎将", "车郎将", "羽林中郎将", "虎贲中郎将"]],
			4: ["偏将军", ["折冲将军", "虎威将军", "征虏将军", "荡寇将军"]],
			5: ["将军", ["监军将军", "抚军将军", "典军将军", "领军将军"]],
			6: ["上将军", ["后将军", "左将军", "右将军", "前将军"]],
			7: ["国护军", ["护军", "左护军", "右护军", "中护军"]],
			8: ["国都护", ["都护", "左都护", "右都护", "中都护"]],
			9: ["大将军", ["大将军"]],
		},

		// 创建UI组件
		ui: {
			// 创建基础对话框
			createBaseDialog() {
				const container = ui.create.div(".popup-container.hidden", ui.window, e => {
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});
				container.style.backgroundColor = "RGBA(0, 0, 0, 0.85)";

				const dialog = ui.create.div(".character-dialog.popped", container);
				const blackBg1 = ui.create.div(".blackBg.one", dialog);
				const blackBg2 = ui.create.div(".blackBg.two", dialog);
				const basicInfo = ui.create.div(".basicInfo", blackBg1);
				const rightPane = ui.create.div(".right", blackBg2);

				return { container, dialog, blackBg1, blackBg2, basicInfo, rightPane };
			},

			// 创建武将边框
			createCharacterFrame(blackBg1, player) {
				const biankuang = lib.config.extension_十周年UI_ZLLT === true ? ui.create.div(".biankuang", blackBg1) : ui.create.div(".biankuang2", blackBg1);

				const leftPane = lib.config.extension_十周年UI_ZLLT === true ? ui.create.div(".left", biankuang) : ui.create.div(".left2", biankuang);
				leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;

				return { biankuang, leftPane };
			},

			// 创建装饰元素
			createDecorations(blackBg1, player) {
				// 边框
				const biankuang3 = ui.create.div(".biankuang3", blackBg1);
				biankuang3.setBackgroundImage(plugin.getBabyBackgroundImage(player.group));

				// 势力
				const biankuang4 = ui.create.div(".biankuang4", blackBg1);
				biankuang4.setBackgroundImage(plugin.getBabysBackgroundImage(player.group));

				return { biankuang3, biankuang4 };
			},

			// 创建玩家信息区域
			createPlayerInfo(biankuang4, player) {
				// 玩家信息框
				const wjxin = ui.create.div(".wjxin", biankuang4);
				wjxin.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/baby/geren.png");

				// 三国秀及名称
				const minixingxiang = ui.create.div(".minixingxiang", wjxin);

				// 玩家头像vip框
				const xvip = ui.create.div(".minikuang", minixingxiang);
				xvip.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/vip${player.xvipjibie}.png`);

				const xvipName = ui.create.div(".viptp", xvip);
				xvipName.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/level${player.xvipjibie}.png`);

				const nameX = ui.create.div(".nameX", player.nickname, minixingxiang);
				const dengjiX = ui.create.div(".dengjiX", String(player.dengji), minixingxiang);

				// 头像框
				minixingxiang.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/xingxiang${player.xingxiangIndex}.png`);

				return { wjxin, minixingxiang, xvip, xvipName, nameX, dengjiX };
			},

			// 创建官阶信息
			createGuanjieInfo(biankuang4, player) {
				const guanjie = ui.create.div(".guanjie", biankuang4);
				guanjie.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/vip_icon_${player.guanjiejibie}.png`);

				const guanjieName = ui.create.div(".guanjiewenzi", `<center>${plugin.guanjieTranslation[player.guanjiejibie][0]}`, biankuang4);
				const guanjieNameX = ui.create.div(".guanjiewenziX", `<center>${plugin.guanjieTranslation[player.guanjiejibie][1][0]}`, biankuang4);

				return { guanjie, guanjieName, guanjieNameX };
			},

			// 创建其他装饰元素
			createOtherDecorations(biankuang4, player, name) {
				// 星星
				const rarity = game.getRarity(name) || "junk";
				const xingxing = ui.create.div(".xingxing", biankuang4);
				xingxing.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/${rarity}.png`);

				// 性别
				const sex = lib.character[player.name].sex;
				const xingbie = ui.create.div(".xingbie", biankuang4);
				xingbie.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/${sex}.png`);

				// 官阶气泡框
				const duihuak = ui.create.div(".duihuak", biankuang4);
				duihuak.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/baby/seatinfo.png`);

				// 分包
				ui.create.div(".pack", plugin.utils.getPack(name), biankuang4);

				return { xingxing, xingbie, duihuak };
			},

			// 创建关闭按钮
			createCloseButton(biankuang4, container) {
				const diaozhui = ui.create.div(".diaozhui", biankuang4);
				diaozhui.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/baby/basebtn.png");
				diaozhui.style.cursor = "pointer";
				diaozhui.style.pointerEvents = "auto";
				diaozhui.style.zIndex = "1000";
				diaozhui.addEventListener("click", event => {
					event.stopPropagation();
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
					container.hide();
					game.resume2();
				});
				return diaozhui;
			},
		},

		// 创建技能信息
		createSkillInfo(rightPane, player, dialogContainer) {
			rightPane.innerHTML = "<div></div>";
			lib.setScroll(rightPane.firstChild);

			let oSkills = player.getSkills(null, false, false).slice(0);
			oSkills = oSkills.filter(skill => {
				if (!lib.skill[skill] || skill === "jiu") return false;
				if (lib.skill[skill].nopop || lib.skill[skill].equipSkill) return false;
				return lib.translate[skill + "_info"] && lib.translate[skill + "_info"] !== "";
			});

			if (player === game.me && player.hiddenSkills.length) {
				oSkills.addArray(player.hiddenSkills);
			}

			// 显示手牌信息
			this.showHandCards(rightPane.firstChild, player);

			// 显示技能信息
			if (oSkills.length) {
				ui.create.div(".xcaption", "武将技能", rightPane.firstChild);
				oSkills.forEach(skill => this.createSkillElement(skill, player, rightPane.firstChild, dialogContainer));
			}

			// 显示装备区域
			this.showEquipmentArea(rightPane.firstChild, player);

			// 显示判定区域
			this.showJudgeArea(rightPane.firstChild, player);
		},

		// 显示手牌信息
		showHandCards(container, player) {
			const allShown = player.isUnderControl() || (!game.observe && game.me && game.me.hasSkillTag("viewHandcard", null, player, true));
			const shownHs = player.getShownCards();

			if (shownHs.length) {
				ui.create.div(".xcaption", player.getCards("h").some(card => !shownHs.includes(card)) ? "明置的手牌" : "手牌区域", container);
				shownHs.forEach(item => {
					const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
					card.style.zoom = "0.6";
					container.appendChild(card);
				});

				if (allShown) {
					const hs = player.getCards("h");
					hs.removeArray(shownHs);
					if (hs.length) {
						ui.create.div(".xcaption", "其他手牌", container);
						hs.forEach(item => {
							const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
							card.style.zoom = "0.6";
							container.appendChild(card);
						});
					}
				}
			} else if (allShown) {
				const hs = player.getCards("h");
				if (hs.length) {
					ui.create.div(".xcaption", "手牌区域", container);
					hs.forEach(item => {
						const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
						card.style.zoom = "0.6";
						container.appendChild(card);
					});
				}
			}
		},

		// 创建技能元素
		createSkillElement(skillName, player, container, dialogContainer) {
			if (player.forbiddenSkills[skillName]) {
				if (player.forbiddenSkills[skillName].length) {
					ui.create.div(".xskill", `<div data-color><span style="opacity:1">${lib.translate[skillName]}</span></div><div><span style="opacity:1">（与${get.translation(player.forbiddenSkills[skillName])}冲突）${get.skillInfoTranslation(skillName, player, false)}</span></div>`, container);
				} else {
					ui.create.div(".xskill", `<div data-color><span style="opacity:1">${lib.translate[skillName]}</span></div><div><span style="opacity:1">（双将禁用）${get.skillInfoTranslation(skillName, player, false)}</span></div>`, container);
				}
			} else if (player.hiddenSkills.includes(skillName)) {
				this.createHiddenSkillElement(skillName, player, container);
			} else if (!player.getSkills().includes(skillName) || player.awakenedSkills.includes(skillName)) {
				ui.create.div(".xskill", `<div data-color><span style="opacity:1">${lib.translate[skillName]}</span></div><div><span style="opacity:1">${get.skillInfoTranslation(skillName, player, false)}</span></div>`, container);
			} else if (lib.skill[skillName].frequent || lib.skill[skillName].subfrequent) {
				this.createFrequentSkillElement(skillName, player, container);
			} else if (lib.skill[skillName].clickable && player.isIn() && player.isUnderControl(true) && player === game.me) {
				this.createClickableSkillElement(skillName, player, container, dialogContainer);
			} else {
				ui.create.div(".xskill", `<div data-color>${lib.translate[skillName]}</div><div>${get.skillInfoTranslation(skillName, player, false)}</div>`, container);
			}
		},

		// 创建隐藏技能元素
		createHiddenSkillElement(skillName, player, container) {
			if (lib.skill[skillName].preHidden && get.mode() === "guozhan") {
				const id = ui.create.div(".xskill", `<div data-color><span style="opacity:1">${lib.translate[skillName]}</span></div><div><span style="opacity:1">${get.skillInfoTranslation(skillName, player, false)}</span><br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px;cursor:pointer;pointer-events:auto;z-index:1000">预亮技能</div></div>`, container);
				const underlinenode = id.querySelector(".underlinenode");
				if (_status.prehidden_skills.includes(skillName)) underlinenode.classList.remove("on");
				underlinenode.link = skillName;
				underlinenode.style.pointerEvents = "auto";
				underlinenode.style.cursor = "pointer";
				underlinenode.listen(ui.click.hiddenskill);
			} else {
				ui.create.div(".xskill", `<div data-color><span style="opacity:1">${lib.translate[skillName]}</span></div><div><span style="opacity:1">${get.skillInfoTranslation(skillName, player, false)}</span></div>`, container);
			}
		},

		// 创建频繁技能元素
		createFrequentSkillElement(skillName, player, container) {
			const id = ui.create.div(".xskill", `<div data-color>${lib.translate[skillName]}</div><div>${get.skillInfoTranslation(skillName, player, false)}<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px;cursor:pointer;pointer-events:auto;z-index:1000">自动发动</div></div>`, container);
			const underlinenode = id.querySelector(".underlinenode");

			if (lib.skill[skillName].frequent) {
				if (lib.config.autoskilllist.includes(skillName)) {
					underlinenode.classList.remove("on");
				}
			}
			if (lib.skill[skillName].subfrequent) {
				for (let j = 0; j < lib.skill[skillName].subfrequent.length; j++) {
					if (lib.config.autoskilllist.includes(skillName + "_" + lib.skill[skillName].subfrequent[j])) {
						underlinenode.classList.remove("on");
					}
				}
			}
			if (lib.config.autoskilllist.includes(skillName)) underlinenode.classList.remove("on");
			underlinenode.link = skillName;
			underlinenode.style.pointerEvents = "auto";
			underlinenode.style.cursor = "pointer";
			underlinenode.listen(ui.click.autoskill2);
		},

		// 创建可点击技能元素
		createClickableSkillElement(skillName, player, container, dialogContainer) {
			const id = ui.create.div(".xskill", `<div data-color>${lib.translate[skillName]}</div><div>${get.skillInfoTranslation(skillName, player, false)}<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px;cursor:pointer;pointer-events:auto;z-index:1000">点击发动</div></div>`, container);
			const intronode = id.querySelector(".skillbutton");

			if (!_status.gameStarted || (lib.skill[skillName].clickableFilter && !lib.skill[skillName].clickableFilter(player))) {
				intronode.classList.add("disabled");
				intronode.style.opacity = 0.5;
				intronode.style.pointerEvents = "none";
			} else {
				intronode.link = player;
				intronode.func = lib.skill[skillName].clickable;
				intronode.classList.add("pointerdiv");
				intronode.style.pointerEvents = "auto";
				intronode.style.cursor = "pointer";
				intronode.addEventListener("click", () => {
					dialogContainer.hide();
					game.resume2();
				});
				intronode.listen(ui.click.skillbutton);
			}
		},

		// 显示装备区域
		showEquipmentArea(container, player) {
			const eSkills = player.getVCards("e");
			if (eSkills.length) {
				ui.create.div(".xcaption", "装备区域", container);
				eSkills.forEach(card => {
					const str = [get.translation(card), get.translation(card.name + "_info")];
					const cards = card.cards;
					if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) {
						str[0] += `（${get.translation(card.cards)}）`;
					}
					const special = card.cards?.find(item => item.name === card.name && lib.card[item.name]?.cardPrompt);
					if (special) str[1] = lib.card[special.name].cardPrompt(special, player);
					ui.create.div(".xskill.equip-skill", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, container);
				});
			}
		},

		// 显示判定区域
		showJudgeArea(container, player) {
			const judges = player.getVCards("j");
			if (judges.length) {
				ui.create.div(".xcaption", "判定区域", container);
				judges.forEach(card => {
					const cards = card.cards;
					let str = get.translation(card);
					if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) {
						if (!lib.card[card]?.blankCard || player.isUnderControl(true)) {
							str += `（${get.translation(cards)}）`;
						}
					}
					ui.create.div(".xskill", `<div data-color>${str}</div><div>${get.translation(card.name + "_info")}</div>`, container);
				});
			}
		},

		click: {
			identity(e) {
				e.stopPropagation();
				const player = this.parentNode;
				if (!game.getIdentityList) return;

				if (player.node.guessDialog) {
					player.node.guessDialog.classList.toggle("hidden");
				} else {
					const list = game.getIdentityList(player);
					if (!list) return;
					const guessDialog = ui.create.div(".guessDialog", player);
					const container = ui.create.div(guessDialog);
					lib.setScroll(guessDialog);
					player.node.guessDialog = guessDialog;
				}
			},

			playerIntro(e) {
				if (e && e.preventDefault) e.preventDefault();
				if (e && e.stopPropagation) e.stopPropagation();

				if (plugin.playerDialog) {
					return plugin.playerDialog.show(this);
				}

				// 创建基础对话框
				const { container, dialog, blackBg1, blackBg2, basicInfo, rightPane } = plugin.ui.createBaseDialog();

				container.show = player => {
					let name = player.name1 || player.name;
					let name2 = player.name2;

					if (player.classList.contains("unseen") && player !== game.me) {
						name = "unknown";
					}
					if (player.classList.contains("unseen2") && player !== game.me) {
						name2 = "unknown";
					}

					// 初始化玩家属性
					plugin.utils.initPlayerProperties(player);

					// 创建武将边框
					const { biankuang, leftPane } = plugin.ui.createCharacterFrame(blackBg1, player);

					// 创建装饰元素
					const { biankuang3, biankuang4 } = plugin.ui.createDecorations(blackBg1, player);

					// 通过势力判断技能框的背景颜色
					const extensionPath = `${lib.assetURL}extension/十周年UI/shoushaUI/`;
					let group = player.group;
					if (!["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key", "Han", "qin"].includes(group)) {
						group = "default";
					}

					// 创建武将名
					const nametext = plugin.utils.getCharacterNameText(name, name2);
					const namestyle = ui.create.div(".name", nametext, dialog);
					namestyle.dataset.camp = group;
					if (name && name2) {
						namestyle.style.fontSize = "20px";
						namestyle.style.letterSpacing = "1px";
					}

					// 创建等阶
					const pe = ui.create.div(".pe1", dialog);
					const url = plugin.utils.getRarityImageUrl(name, extensionPath);
					pe.style.backgroundImage = `url("${url}")`;

					// 创建玩家信息
					plugin.ui.createPlayerInfo(biankuang4, player);

					// 创建官阶信息
					plugin.ui.createGuanjieInfo(biankuang4, player);

					// 创建其他装饰元素
					plugin.ui.createOtherDecorations(biankuang4, player, name);

					// 创建关闭按钮
					plugin.ui.createCloseButton(biankuang4, container);

					// 创建技能信息
					dialog.classList.add("single");
					plugin.createSkillInfo(rightPane, player, container);

					container.classList.remove("hidden");
					game.pause2();
				};

				plugin.characterDialog = container;
				container.show(this);
			},
		},
	};

	return plugin;
});
