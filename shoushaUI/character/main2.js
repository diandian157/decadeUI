app.import((lib, game, ui, get, ai, _status, app) => {
	// 工具函数区
	const extensionPath = `${lib.assetURL}extension/十周年UI/shoushaUI/`;
	// 获取武将分包
	function getPack(name) {
		const pack = Object.keys(lib.characterPack).find(pack => lib.characterPack[pack][name]);
		if (pack) {
			if (lib.characterSort[pack]) {
				const sort = Object.keys(lib.characterSort[pack]).find(sort => lib.characterSort[pack][sort].includes(name));
				if (sort) return lib.translate[sort];
			}
			return lib.translate[pack + "_character_config"] || lib.translate[pack];
		}
		return "暂无分包";
	}
	// 获取立绘图片路径
	function getLihuiPath(originalPath) {
		return originalPath.replace(/image\/character/, "image/lihui");
	}
	// 提取图片原始路径
	function extractImagePath(bg) {
		if (!bg) return "";
		if (bg.indexOf('url("') === 0) {
			return bg.slice(5, bg.indexOf('")'));
		} else if (bg.indexOf("url('") === 0) {
			return bg.slice(5, bg.indexOf("')"));
		}
		return bg;
	}
	// 获取等阶图片路径
	function getRarityIcon(rarity) {
		return `${extensionPath}character/images/shizhounian/rarity_${rarity}.png`;
	}
	function getPeIcon(rarity) {
		return `${extensionPath}character/images/shizhounian/pe_${rarity}.png`;
	}
	// 获取千幻等阶
	function getQhlyLevel(name) {
		let temp = "junk";
		if (lib.config["extension_千幻聆音_enable"] && typeof game.qhly_getSkinLevel === "function" && typeof game.qhly_getSkin === "function") {
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
			temp = levelToRarity[level] || "junk";
		}
		return temp;
	}
	// 获取千幻皮肤名安全函数
	function getQhlySkinTranslation(name) {
		if (lib.config["extension_千幻聆音_enable"] && typeof game.qhly_getSkinInfo === "function" && typeof game.qhly_getSkin === "function") {
			return game.qhly_getSkinInfo(name, game.qhly_getSkin(name), null).translation || "经典形象";
		}
		return "经典形象";
	}
	// 创建立绘div
	function setLihuiDiv(skinDiv, playerSkin, fallbackUrl) {
		const originalPath = extractImagePath(playerSkin);
		const testImg = new Image();
		testImg.onerror = () => {
			skinDiv.style.backgroundImage = playerSkin;
		};
		testImg.onload = function () {
			skinDiv.style.backgroundImage = `url("${this.src}")`;
		};
		testImg.src = getLihuiPath(originalPath);
	}
	// 获取势力背景图片路径接口
	function getGroupBackgroundImage(group) {
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `${extensionPath}character/images/shizhounian/skt_${group}.png`;
	}

	// 主体插件
	const plugin = {
		name: "character",
		// 势力背景接口，外部可通过覆盖此方法自定义背景逻辑
		getGroupBackgroundImage(group) {
			return getGroupBackgroundImage(group);
		},
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {},
		precontent() {
			app.reWriteFunction(lib, {
				setIntro: [
					function (args, node) {
						if (get.itemtype(node) === "player") {
							if (lib.config.touchscreen) {
								lib.setLongPress(node, plugin.click.playerIntro);
							} else {
								if (lib.config.right_info) {
									node.oncontextmenu = function (e) {
										if (e && e.preventDefault) e.preventDefault();
										if (e && e.stopPropagation) e.stopPropagation();
										plugin.click.playerIntro.call(this, e);
										return false;
									};
								}
							}
							return node;
						}
					},
				],
			});
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
				const container = ui.create.div(".popup-container.hidden", ui.window, e => {
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});
				const dialog = ui.create.div(".character-dialog.popped", container);
				const leftPane = ui.create.div(".left", dialog);
				const rightPane = ui.create.div(".right", dialog);
				// 势力背景
				const group = this.group;
				const bgImagePath = plugin.getGroupBackgroundImage(group);
				dialog.style.backgroundImage = `url("${bgImagePath}")`;
				// 立绘
				const skin1 = ui.create.div(".skin1", dialog);
				const skin2 = ui.create.div(".skin2", dialog);
				// 姓名处理
				let name = this.name1 || this.name;
				let name2 = this.name2;
				if (this.classList.contains("unseen") && this !== game.me) name = "unknown";
				if (this.classList.contains("unseen2") && this !== game.me) name2 = "unknown";
				// 主将立绘
				if (name !== "unknown") {
					let playerSkin = this.style.backgroundImage || this.childNodes[0]?.style.backgroundImage;
					setLihuiDiv(skin1, playerSkin, `${extensionPath}character/images/unknown.png`);
				} else {
					skin1.style.backgroundImage = `url("${extensionPath}character/images/unknown.png")`;
				}
				// 副将立绘
				if (name2) {
					if (name2 !== "unknown") {
						let playerSkin2 = this.childNodes[1]?.style.backgroundImage;
						setLihuiDiv(skin2, playerSkin2, `${extensionPath}character/images/unknown.png`);
					} else {
						skin2.style.backgroundImage = `url("${extensionPath}character/images/unknown.png")`;
					}
				}
				// 等阶
				let rarity = game.getRarity(name) || "junk";
				const pe = ui.create.div(".pe1", dialog);
				let peUrl = lib.config["extension_千幻聆音_enable"] ? getPeIcon(getQhlyLevel(name)) : getPeIcon(rarity);
				pe.style.backgroundImage = `url("${peUrl}")`;
				// 皮肤名
				let value = "";
				let value2 = getQhlySkinTranslation(name);
				value += `${value2}*${get.translation(name)}`;
				if (name2) {
					let value3 = getQhlySkinTranslation(name2);
					value += `<br>${value3}*${get.translation(name2)}`;
				}
				const pn = ui.create.div(".pn1", value);
				pe.appendChild(pn);
				// 武将姓名
				let nametext = "";
				if (name && name2) {
					nametext += name === "unknown" ? "未知" : lib.translate[name + "_ab"] || get.translation(name);
					nametext += " / ";
					nametext += name2 === "unknown" ? "未知" : lib.translate[name2 + "_ab"] || get.translation(name2);
				} else {
					nametext += name === "unknown" ? "未知" : lib.translate[name + "_ab"] || get.translation(name);
				}
				const namestyle = ui.create.div(".name", nametext, dialog);
				namestyle.dataset.camp = group;
				if (name && name2) {
					namestyle.style.fontSize = "18px";
					namestyle.style.letterSpacing = "1px";
				}
				// 等阶图标
				const head = ui.create.node("img");
				head.src = getRarityIcon(rarity);
				head.style.cssText = "display:inline-block;width:61.6px;height:53.2px;top:-13px; position:absolute;background-color: transparent;z-index:1;margin-left:5px;";
				namestyle.appendChild(head);
				// 分包
				ui.create.div(".pack", getPack(name), dialog);
				leftPane.innerHTML = "<div></div>";
				rightPane.innerHTML = "<div></div>";
				lib.setScroll(rightPane.firstChild);
				// 技能区
				let oSkills = this.getSkills(null, false, false).slice(0);
				if (this === game.me) oSkills = oSkills.concat(this.hiddenSkills);
				if (oSkills.length) {
					oSkills.forEach(skillName => {
						const translation = lib.translate[skillName];
						if (translation && lib.translate[skillName + "_info"] && translation !== "" && lib.translate[skillName + "_info"] !== "") {
							const isAwakened = !this.getSkills().includes(skillName) || this.awakenedSkills.includes(skillName);
							let skillContent = `<div data-color>${isAwakened ? '<span style="opacity:0.5">' + translation + "： </span>" : translation + "： "}</div><div>${isAwakened ? '<span style="opacity:0.5;text-indent:10px">' + get.skillInfoTranslation(skillName, this, false) + "</span>" : '<span style="text-indent:10px">' + get.skillInfoTranslation(skillName, this, false) + "</span>"}`;
							if (lib.skill[skillName].clickable && this === game.me) {
								skillContent += '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>';
							}
							skillContent += "</div>";
							const skillDiv = ui.create.div(".xskill", skillContent, rightPane.firstChild);
							if (lib.skill[skillName].clickable && this === game.me) {
								const skillButton = skillDiv.querySelector(".skillbutton");
								if (skillButton) {
									if (!_status.gameStarted || (lib.skill[skillName].clickableFilter && !lib.skill[skillName].clickableFilter(this))) {
										skillButton.classList.add("disabled");
										skillButton.style.opacity = 0.5;
									} else {
										skillButton.link = this;
										skillButton.func = lib.skill[skillName].clickable;
										skillButton.classList.add("pointerdiv");
										skillButton.listen(() => {
											container.hide();
											game.resume2();
										});
										skillButton.listen(ui.click.skillbutton);
									}
								}
							}
							// 自动发动
							if (lib.skill[skillName].frequent || lib.skill[skillName].subfrequent) {
								const underlinenode = ui.create.div(".underlinenode on gray", `【${translation}】自动发动`, rightPane.firstChild);
								underlinenode.style.position = "relative";
								underlinenode.style.paddingLeft = "0";
								underlinenode.style.paddingBottom = "3px";
								if (lib.skill[skillName].frequent && lib.config.autoskilllist.includes(skillName)) {
									underlinenode.classList.remove("on");
								}
								if (lib.skill[skillName].subfrequent) {
									lib.skill[skillName].subfrequent.forEach(sub => {
										if (lib.config.autoskilllist.includes(`${skillName}_${sub}`)) {
											underlinenode.classList.remove("on");
										}
									});
								}
								if (lib.config.autoskilllist.includes(skillName)) {
									underlinenode.classList.remove("on");
								}
								underlinenode.link = skillName;
								underlinenode.listen(ui.click.autoskill2);
							}
						}
					});
				}
				// 手牌区
				const hSkills = this.getCards("h");
				if (hSkills.length) {
					const allShown = this.isUnderControl() || (!game.observe && game.me?.hasSkillTag("viewHandcard", null, this, true));
					const shownHs = this.getShownCards();
					if (shownHs.length) {
						ui.create.div(".xcaption", this.hasCard(card => !shownHs.includes(card), "h") ? "明置的手牌" : "手牌区域", rightPane.firstChild);
						shownHs.forEach(item => {
							const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
							card.style.zoom = "0.6";
							rightPane.firstChild.appendChild(card);
						});
						if (allShown) {
							const hs = hSkills.slice();
							hs.removeArray(shownHs);
							if (hs.length) {
								ui.create.div(".xcaption", "其他手牌", rightPane.firstChild);
								hs.forEach(item => {
									const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
									card.style.zoom = "0.6";
									rightPane.firstChild.appendChild(card);
								});
							}
						}
					} else if (allShown) {
						ui.create.div(".xcaption", "手牌区域", rightPane.firstChild);
						hSkills.forEach(item => {
							const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
							card.style.zoom = "0.6";
							rightPane.firstChild.appendChild(card);
						});
					}
				}
				// 装备区
				const eSkills = this.getCards("e");
				if (eSkills.length) {
					ui.create.div(".xcaption", "装备区域", rightPane.firstChild);
					eSkills.forEach(card => {
						const cards = card.cards;
						let str = [get.translation(card), get.translation(card.name + "_info")];
						if (Array.isArray(cards) && cards.length) {
							str[0] += `（${get.translation(card.cards)}）`;
						}
						if (lib.card[card.name]?.cardPrompt) str[1] = lib.card[card.name].cardPrompt(card, this);
						ui.create.div(".xskill", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, rightPane.firstChild);
					});
				}
				// 判定区
				const judges = this.getCards("j");
				if (judges.length) {
					ui.create.div(".xcaption", "判定区域", rightPane.firstChild);
					judges.forEach(card => {
						const cards = card.cards;
						let str = [get.translation(card), get.translation(card.name + "_info")];
						if ((Array.isArray(cards) && cards.length && !lib.card[card]?.blankCard) || this.isUnderControl(true)) str[0] += `（${get.translation(cards)}）`;
						ui.create.div(".xskill", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, rightPane.firstChild);
					});
				}
				container.classList.remove("hidden");
				game.pause2();
				plugin.characterDialog = container;
			},
		},
	};
	return plugin;
});
