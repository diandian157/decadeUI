"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	//武将背景
	if (lib.config["extension_十周年UI_wujiangbeijing"]) {
		lib.skill._wjBackground = {
			charlotte: true,
			forced: true,
			popup: false,
			trigger: {
				global: ["gameStart", "modeSwitch"],
				player: ["enterGame", "showCharacterEnd"],
			},
			priority: 100,
			async content() {
				const setBackground = player => {
					if (!player) return;
					const mode = get.mode();
					const isDoubleCharacter = lib.config.mode_config[mode]?.double_character;
					if (mode === "guozhan" || isDoubleCharacter) {
						player.setAttribute("data-mode", "guozhan");
					} else {
						player.setAttribute("data-mode", "normal");
					}
				};
				game.players.forEach(setBackground);
				game.dead.forEach(setBackground);
			},
		};
		lib.arenaReady.push(() => {
			const mode = get.mode();
			const isDoubleCharacter = lib.config.mode_config[mode]?.double_character;
			if (mode === "guozhan" || isDoubleCharacter) {
				document.body.setAttribute("data-mode", "guozhan");
			} else {
				document.body.setAttribute("data-mode", "normal");
			}
		});
	}
	// 局内交互优化
	if (lib.config["extension_十周年UI_bettersound"]) {
		// 拦截本体音效
		game._decadeUI_blockedEquipAudios = game._decadeUI_blockedEquipAudios || new Set(["loseHp"]);
		if (!game._decadeUI_playAudioWrapped) {
			const originalPlayAudio = game.playAudio;
			game.playAudio = function (...args) {
				if (args[0] === "effect" && game._decadeUI_blockedEquipAudios?.has(args[1])) return;
				return originalPlayAudio.apply(this, args);
			};
			game._decadeUI_playAudioWrapped = true;
		}
		if (!game._decadeUI_uiClickAudioHandler) {
			const uiClickAudioHandler = e => {
				if (e.button !== 0) return;
				const target = e.target;
				let audioToPlay = null;
				const rules = [
					{
						test: t => t.closest("#dui-controls") && (t.classList?.contains("control") || t.parentElement?.classList?.contains("control")),
						sound: "BtnSure",
					},
					{
						test: t => t.closest(".menubutton, .button, .card"),
						sound: "card_click",
					},
				];
				for (const rule of rules) {
					if (rule.test(target)) {
						audioToPlay = rule.sound;
						break;
					}
				}
				if (audioToPlay) {
					const now = Date.now();
					const last = game._decadeUI_lastUIAudioAt || 0;
					if (now - last < 60) return;
					game._decadeUI_lastUIAudioAt = now;
					game.playAudio("..", "extension", "十周年UI", `audio/${audioToPlay}`);
				}
			};
			document.body.addEventListener("pointerdown", uiClickAudioHandler, { capture: true, passive: true });
			game._decadeUI_uiClickAudioHandler = uiClickAudioHandler;
		}
		// 自己准备阶段音效
		lib.skill._preparePhaseAudio = {
			trigger: { player: ["phaseZhunbeiBefore"] },
			forced: true,
			popup: false,
			charlotte: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			async content() {
				game.playAudio("..", "extension", "十周年UI", `audio/seatRoundState_start`);
			},
		};
		// 失去体力音效
		lib.skill._hpLossAudio = {
			trigger: { player: "loseHpBefore" },
			forced: true,
			popup: false,
			charlotte: true,
			filter(event) {
				return !!event.num;
			},
			async content(event, trigger, player) {
				// 播放音效
				game.playAudio("..", "extension", "十周年UI", "audio/hpLossSund.mp3");
			},
		};
	}
	window._effect = {
		effect_loseHp: {
			name: "../../../十周年UI/assets/animation/effect_loseHp",
		},
	};
	lib.skill._hpLossAnimation = {
		trigger: { player: "loseHpBefore" },
		forced: true,
		popup: false,
		charlotte: true,
		filter(event) {
			return !!event.num;
		},
		async content(event, trigger, player) {
			// 播放动画
			dcdAnim.loadSpine(window._effect.effect_loseHp.name, "skel", () => {
				window._effect.effect_loseHp.action = "play";
				dcdAnim.playSpine(window._effect.effect_loseHp, {
					speed: 0.8,
					scale: 0.6,
					parent: player,
				});
			});
		},
	};
	//手气卡美化
	if (lib.config["extension_十周年UI_luckycard"]) {
		lib.element.content.gameDraw = async function () {
			const event = get.event();
			const player = _status.event.player || event.player;
			const num = event.num;
			if (_status.brawl && _status.brawl.noGameDraw) return;
			const end = player;
			let currentPlayer = player;
			do {
				let numx = typeof num === "function" ? num(currentPlayer) : num;
				const cards = [];
				const otherGetCards = event.otherPile?.[currentPlayer.playerid]?.getCards;
				if (otherGetCards) {
					cards.addArray(otherGetCards(numx));
				} else if (currentPlayer.getTopCards) {
					cards.addArray(currentPlayer.getTopCards(numx));
				} else {
					cards.addArray(get.cards(numx));
				}
				if (event.gaintag?.[currentPlayer.playerid]) {
					const gaintag = event.gaintag[currentPlayer.playerid];
					const list = typeof gaintag === "function" ? gaintag(numx, cards) : [[cards, gaintag]];
					game.broadcastAll(
						(p, l) => {
							for (let i = l.length - 1; i >= 0; i--) {
								p.directgain(l[i][0], null, l[i][1]);
							}
						},
						currentPlayer,
						list
					);
				} else {
					currentPlayer.directgain(cards);
				}
				if (currentPlayer.singleHp === true && get.mode() !== "guozhan" && (lib.config.mode !== "doudizhu" || _status.mode !== "online")) {
					currentPlayer.doubleDraw();
				}
				currentPlayer._start_cards = currentPlayer.getCards("h");
				currentPlayer = currentPlayer.next;
			} while (currentPlayer !== end);
			let changeCard = get.config("change_card");
			const isDisabled = _status.connectMode || (lib.config.mode === "single" && _status.mode !== "wuxianhuoli") || (lib.config.mode === "doudizhu" && _status.mode === "online") || !["identity", "guozhan", "doudizhu", "single"].includes(lib.config.mode);
			if (isDisabled) {
				changeCard = "disabled";
			}
			if (changeCard !== "disabled" && !_status.auto && game.me.countCards("h")) {
				let numsy = 5;
				let numsl = 10000 + Math.floor(Math.random() * 90000);
				let changing = true;
				_status.imchoosing = true;
				const useCardPrompt = lib.config["extension_十周年UI_cardPrompt"];
				const showChangeCardTimer = () => {
					if (window.timer) {
						clearInterval(window.timer);
						delete window.timer;
					}
					if (window.timer2) {
						clearInterval(window.timer2);
						delete window.timer2;
					}
					const existingBar = document.getElementById("jindutiaopl");
					if (existingBar) {
						existingBar.remove();
					}
					if (typeof game.Jindutiaoplayer === "function") {
						game.Jindutiaoplayer();
					}
				};
				const hideChangeCardTimer = () => {
					if (window.timer) {
						clearInterval(window.timer);
						delete window.timer;
					}
					if (window.timer2) {
						clearInterval(window.timer2);
						delete window.timer2;
					}
					const bar = document.getElementById("jindutiaopl");
					if (bar) bar.remove();
				};
				while (changing && numsy > 0) {
					const str = `本场还可更换<span style="color:#00c853">${numsy}次</span>手牌(剩余${numsl}张手气卡)`;
					const stripTags = text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "");
					const tipText = stripTags(str);
					showChangeCardTimer();
					const { bool } = await new Promise(resolve => {
						if (useCardPrompt && typeof dui?.showHandTip === "function") {
							if (ui.cardDialog) {
								ui.cardDialog.close();
								delete ui.cardDialog;
							}
							const tip = (ui.cardDialog = dui.showHandTip());
							tip.appendText(tipText);
							tip.strokeText();
							tip.show();
							ui.create.confirm("oc");
							if (ui.confirm && ui.confirm.childNodes.length > 0 && lib.config.extension_十周年UI_newDecadeStyle !== "off") {
								const okButton = ui.confirm.childNodes[0];
								if (okButton && okButton.link === "ok") {
									okButton.innerHTML = "换牌";
								}
							}
							event.custom.replace.confirm = ok => {
								hideChangeCardTimer();
								if (ui.cardDialog) {
									ui.cardDialog.close();
									delete ui.cardDialog;
								}
								if (ui.confirm?.close) ui.confirm.close();
								game.resume();
								resolve({ bool: ok });
							};
							event.switchToAuto = () => {
								hideChangeCardTimer();
								if (ui.cardDialog) {
									ui.cardDialog.close();
									delete ui.cardDialog;
								}
								if (ui.confirm?.close) ui.confirm.close();
								game.resume();
								resolve({ bool: false });
							};
						} else {
							const dialog = ui.create.dialog(str);
							ui.create.confirm("oc");
							if (ui.confirm && ui.confirm.childNodes.length > 0 && lib.config.extension_十周年UI_newDecadeStyle !== "off") {
								const okButton = ui.confirm.childNodes[0];
								if (okButton && okButton.link === "ok") {
									okButton.innerHTML = "换牌";
								}
							}
							event.custom.replace.confirm = ok => {
								hideChangeCardTimer();
								dialog.close();
								if (ui.confirm?.close) ui.confirm.close();
								game.resume();
								resolve({ bool: ok });
							};
							event.switchToAuto = () => {
								hideChangeCardTimer();
								dialog.close();
								if (ui.confirm?.close) ui.confirm.close();
								game.resume();
								resolve({ bool: false });
							};
						}
						game.pause();
					});
					if (bool) {
						if (changeCard === "once") {
							changeCard = "disabled";
							changing = false;
						} else if (changeCard === "twice") {
							changeCard = "once";
						}
						if (game.changeCoin) game.changeCoin(-3);
						const hs = game.me.getCards("h");
						const count = hs.length;
						const otherDiscard = event.otherPile?.[game.me.playerid]?.discard;
						game.addVideo("lose", game.me, [get.cardsInfo(hs), [], [], []]);
						hs.forEach(card => {
							card.removeGaintag(true);
							if (otherDiscard) otherDiscard(card);
							else card.discard(false);
						});
						const cards = [];
						const otherGetCards = event.otherPile?.[game.me.playerid]?.getCards;
						if (otherGetCards) cards.addArray(otherGetCards(count));
						if (cards.length < count) cards.addArray(get.cards(count - cards.length));
						if (event.gaintag?.[game.me.playerid]) {
							const gaintag = event.gaintag[game.me.playerid];
							const list = typeof gaintag === "function" ? gaintag(count, cards) : [[cards, gaintag]];
							for (let i = list.length - 1; i >= 0; i--) {
								game.me.directgain(list[i][0], null, list[i][1]);
							}
						} else {
							game.me.directgain(cards);
						}
						game.me._start_cards = game.me.getCards("h");
						numsl--;
						numsy--;
					} else {
						changing = false;
					}
				}
				hideChangeCardTimer();
				_status.imchoosing = false;
			}
			game.me._start_cards = game.me.getCards("h");
			setTimeout(decadeUI.effect.gameStart, 51);
		};
	}
	// 卡牌边框
	const borderImageName = lib.config.extension_十周年UI_cardkmh;
	if (borderImageName && borderImageName !== "off") {
		const style = document.createElement("style");
		const borderImageUrl = `${lib.assetURL}extension/十周年UI/assets/image/${borderImageName}.png`;
		const commonBorderStyles = `
				border: 1px solid;
				border-radius: 10px;
				border-image-source: url('${borderImageUrl}');
				border-image-slice: 17 17 17 17;
			`;
		const handCardStyles = `
				.hand-cards > .handcards > .card {
					margin: 0px;
					width: 108px;
					height: 150px;
					position: absolute;
					transition-property: transform, opacity, left, top;
					${commonBorderStyles}
					border-image-width: 20px 20px 20px 20px;
					z-index: 51;
				}
			`;
		const playedCardStyles = `
				#arena > .card,
				#arena.oblongcard:not(.chess) > .card,
				#arena.oblongcard:not(.chess) .handcards > .card {
					width: 108px;
					height: 150px;
					${commonBorderStyles}
					border-image-width: 16px 16px 16px 16px;
				}
			`;
		style.innerHTML = `${handCardStyles}${playedCardStyles}`;
		document.head.appendChild(style);
	}
	//卡牌背景
	if (lib.config.extension_十周年UI_cardbj && lib.config.extension_十周年UI_cardbj !== "kb1") {
		const style = document.createElement("style");
		style.innerHTML = `.card:empty,.card.infohidden{background:url('${lib.assetURL}extension/十周年UI/assets/image/${lib.config.extension_十周年UI_cardbj}.png');background-size:100% 100% !important;}`;
		document.head.appendChild(style);
	}
	// 数字特效
	window._WJMHHUIFUSHUZITEXIAO = { shuzi2: { name: "../../../十周年UI/assets/animation/globaltexiao/huifushuzi/shuzi2" } };
	window._WJMHXUNISHUZITEXIAO = { SS_PaiJu_xunishanghai: { name: "../../../十周年UI/assets/animation/globaltexiao/xunishuzi/SS_PaiJu_xunishanghai" } };
	window._WJMHSHANGHAISHUZITEXIAO = {
		shuzi: { name: "../../../十周年UI/assets/animation/globaltexiao/shanghaishuzi/shuzi" },
		SZN_shuzi: { name: "../../../十周年UI/assets/animation/globaltexiao/shanghaishuzi/SZN_shuzi" },
	};
	lib.skill._wjmh_huifushuzi_ = {
		priority: 10,
		forced: true,
		trigger: { player: "recoverBegin" },
		filter(event) {
			return event.num && event.num > 0 && event.num <= 9 && lib.config.extension_十周年UI_newDecadeStyle !== "off";
		},
		async content(event, trigger, player) {
			const action = trigger.num.toString();
			if (action) {
				dcdAnim.loadSpine(window._WJMHHUIFUSHUZITEXIAO.shuzi2.name, "skel", () => {
					window._WJMHHUIFUSHUZITEXIAO.shuzi2.action = action;
					dcdAnim.playSpine(window._WJMHHUIFUSHUZITEXIAO.shuzi2, { speed: 0.6, scale: 0.5, parent: player, y: 20 });
				});
			}
		},
	};
	lib.skill._wjmh_xunishuzi_ = {
		priority: 10,
		forced: true,
		trigger: { player: "damage" },
		filter(event) {
			return event.num >= 0 && event.num <= 9 && event.unreal;
		},
		async content(event, trigger, player) {
			const action = "play" + trigger.num.toString();
			if (action) {
				dcdAnim.loadSpine(window._WJMHXUNISHUZITEXIAO.SS_PaiJu_xunishanghai.name, "skel", () => {
					window._WJMHXUNISHUZITEXIAO.SS_PaiJu_xunishanghai.action = action;
					dcdAnim.playSpine(window._WJMHXUNISHUZITEXIAO.SS_PaiJu_xunishanghai, { speed: 0.6, scale: 0.5, parent: player, y: 20 });
				});
			}
		},
	};
	lib.skill._wjmh_shanghaishuzi_ = {
		priority: 210,
		forced: true,
		trigger: { player: "damageBegin4" },
		filter(event) {
			return event.num && event.num > 1 && event.num <= 9 && lib.config.extension_十周年UI_newDecadeStyle;
		},
		async content(event, trigger, player) {
			const action = trigger.num.toString();
			if (action) {
				const anim = lib.config.extension_十周年UI_newDecadeStyle === "off" ? "shuzi" : "SZN_shuzi";
				dcdAnim.loadSpine(window._WJMHSHANGHAISHUZITEXIAO[anim].name, "skel", () => {
					window._WJMHSHANGHAISHUZITEXIAO[anim].action = action;
					const playOptions = { speed: 0.6, scale: 0.4, parent: player };
					if (lib.config.extension_十周年UI_newDecadeStyle !== "off") {
						playOptions.y = 20;
					}
					dcdAnim.playSpine(window._WJMHSHANGHAISHUZITEXIAO[anim], playOptions);
				});
			}
		},
	};
	//目标指示特效
	lib.element.player.inits = [].concat(lib.element.player.inits || []).concat(async player => {
		if (player.ChupaizhishiXObserver) return;
		const ANIMATION_CONFIG = {
			jiangjun: { name: "SF_xuanzhong_eff_jiangjun", scale: 0.6 },
			weijiangjun: { name: "SF_xuanzhong_eff_weijiangjun", scale: 0.6 },
			cheqijiangjun: { name: "SF_xuanzhong_eff_cheqijiangjun", scale: 0.6 },
			biaoqijiangjun: { name: "SF_xuanzhong_eff_biaoqijiangjun", scale: 0.5 },
			dajiangjun: { name: "SF_xuanzhong_eff_dajiangjun", scale: 0.6 },
			dasima: { name: "SF_xuanzhong_eff_dasima", scale: 0.6 },
			shoushaX: { name: "aar_chupaizhishiX", scale: 0.55 },
			shousha: { name: "aar_chupaizhishi", scale: 0.55 },
		};
		const DELAY_TIME = 300;
		let timer = null;
		const startAnimation = element => {
			if (element.ChupaizhishiXid || timer) return;
			if (!window.chupaiload) {
				window.chupaiload = true;
			}
			timer = setTimeout(() => {
				const config = decadeUI.config.chupaizhishi;
				const animationConfig = ANIMATION_CONFIG[config];
				if (config !== "off" && animationConfig) {
					element.ChupaizhishiXid = dcdAnim.playSpine(
						{
							name: animationConfig.name,
							loop: true,
						},
						{
							parent: element,
							scale: animationConfig.scale,
						}
					);
				}
				timer = null;
			}, DELAY_TIME);
		};
		const stopAnimation = element => {
			if (element.ChupaizhishiXid) {
				dcdAnim.stopSpine(element.ChupaizhishiXid);
				delete element.ChupaizhishiXid;
			}
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		};
		const observer = new globalThis.MutationObserver(mutations => {
			for (const mutation of mutations) {
				if (mutation.attributeName !== "class") continue;
				const target = mutation.target;
				const isSelectable = target.classList.contains("selectable");
				if (isSelectable) {
					startAnimation(target);
				} else {
					stopAnimation(target);
				}
			}
		});
		observer.observe(player, {
			attributes: true,
			attributeFilter: ["class"],
		});
		player.ChupaizhishiXObserver = observer;
	});
	// 技能外显-仅在babysha样式下且场上人物小于等于5人时生效
	if (lib.config.extension_十周年UI_newDecadeStyle === "babysha" && game.players.length <= 5) {
		const getAllPlayersCount = () => game.players.length + (game.dead ? game.dead.length : 0);
		const skillDisplayManager = (() => {
			const playerSkillArrays = new WeakMap();
			const isOtherSkill = (skill, player) => {
				if (!player || player === game.me) return false;
				if (!lib.translate?.[skill]) return false;
				const info = get.info(skill);
				if (info && info.charlotte) return false;
				if (info && info.zhuSkill && !player.isZhu) return true;
				return !info || !info.nopop || skill.startsWith("olhedao_tianshu_");
			};
			const getSkillName = skill => lib.translate?.[skill] || skill;
			// 获取技能图标
			const getSkillIcon = (skill, player) => {
				const info = get.info(skill);
				if (!info) return null;
				// 限定技图标
				if (info.limited) {
					return "xiandingjihs.png";
				}
				// 觉醒技图标
				if (info.juexingji) {
					return "juexingjihs.png";
				}
				// 转换技图标
				if (get.is.zhuanhuanji(skill, player)) {
					const markNode = player?.node?.xSkillMarks?.querySelector(`.skillMarkItem.zhuanhuanji[data-id="${skill}"]`);
					const imgType = markNode?.classList.contains("yin") ? "ying" : "yang";
					return imgType === "yang" ? "mark_yanghs.png" : "mark_yinghs.png";
				}
				return null;
			};
			const showSkillDescription = (skill, targetElement) => {
				// 移除已存在的技能描述弹窗
				const existingPopup = document.querySelector(".baby_skill_popup");
				if (existingPopup) existingPopup.remove();
				const skillName = getSkillName(skill);
				const skillInfo = lib.skill[skill];
				if (!skillInfo) return;
				const popup = document.createElement("div");
				popup.className = "baby_skill_popup";
				const title = document.createElement("div");
				title.className = "skill_title";
				title.textContent = skillName;
				popup.appendChild(title);
				const description = document.createElement("div");
				description.className = "skill_description";
				// 使用本体相同的技能描述获取方法
				const skillDesc = get.translation(skill, "info") || "暂无描述";
				// 支持HTML标签渲染
				description.innerHTML = skillDesc;
				popup.appendChild(description);
				// 先添加到DOM中获取实际尺寸
				document.body.appendChild(popup);
				// 强制重新计算尺寸，确保完全包裹内容
				const titleHeight = title.scrollHeight;
				const descHeight = description.scrollHeight;
				const marginBetween = 8; // 标题和描述之间的间距
				const padding = 24; // 上下padding
				const totalContentHeight = titleHeight + descHeight + marginBetween + padding;
				// 设置精确的高度
				popup.style.height = `${totalContentHeight}px`;
				// 计算弹窗位置
				const rect = targetElement.getBoundingClientRect();
				const popupRect = popup.getBoundingClientRect();
				let left = rect.left + rect.width / 2 - popupRect.width / 2; // 居中显示
				let top = rect.top - popupRect.height - 10;
				// 边界检查
				if (left < 10) left = 10;
				if (left + popupRect.width > window.innerWidth - 10) left = window.innerWidth - popupRect.width - 10;
				if (top < 10) top = rect.bottom + 10;
				popup.style.left = `${left}px`;
				popup.style.top = `${top}px`;
				// 点击其他地方关闭弹窗
				const closePopup = e => {
					if (!popup.contains(e.target)) {
						popup.remove();
						document.removeEventListener("click", closePopup);
					}
				};
				setTimeout(() => document.addEventListener("click", closePopup), 100);
			};
			const updateSkillDisplay = player => {
				if (getAllPlayersCount() > 5) return;
				const avatar = player.node.avatar;
				if (!avatar) return;
				avatar.parentNode.querySelectorAll(".baby_skill").forEach(list => list.remove());
				const skillArray = playerSkillArrays.get(player) || [];
				const uniqueSkills = [];
				const seen = new Set();
				for (const skill of skillArray) {
					const name = getSkillName(skill);
					if (!seen.has(name)) {
						seen.add(name);
						uniqueSkills.push(skill);
					}
				}
				const rect = avatar.getBoundingClientRect();
				const isLeft = rect.left < window.innerWidth / 2;
				const mode = get.mode();
				const isDoubleCharacter = lib.config.mode_config[mode] && lib.config.mode_config[mode].double_character;
				const baseOffset = isDoubleCharacter ? 135 : 75;
				const frag = document.createDocumentFragment();
				uniqueSkills.forEach((skill, idx) => {
					const skillList = document.createElement("div");
					Object.assign(skillList.style, {
						position: "absolute",
						bottom: `${idx * 35 + 30}px`,
						zIndex: "102",
					});
					skillList.className = "baby_skill";
					Object.assign(skillList.style, {
						left: isLeft ? `${avatar.offsetWidth + (isDoubleCharacter ? 65 : 10)}px` : "",
						right: isLeft ? "" : `${avatar.offsetWidth + baseOffset}px`,
					});
					const skillBox = document.createElement("div");
					skillBox.className = "baby_skill_box";
					skillBox.setAttribute("data-skill", skill);
					skillBox.textContent = getSkillName(skill).slice(0, 2);
					skillBox.style.cursor = "pointer";
					// 添加技能图标
					const skillIcon = getSkillIcon(skill, player);
					if (skillIcon) {
						const iconImg = document.createElement("img");
						iconImg.src = `extension/十周年UI/shoushaUI/skill/babysha/${skillIcon}`;
						iconImg.style.position = "absolute";
						iconImg.style.top = "3px";
						iconImg.style.right = "-15px";
						iconImg.style.width = "16px";
						iconImg.style.height = "16px";
						iconImg.style.zIndex = "103";
						skillList.appendChild(iconImg);
					}
					skillBox.addEventListener("click", e => {
						e.stopPropagation();
						game.playAudio("..", "extension", "十周年UI", "audio/BtnSure");
						showSkillDescription(skill, e.target);
					});
					skillList.appendChild(skillBox);
					frag.appendChild(skillList);
				});
				avatar.parentNode.appendChild(frag);
			};
			const updateSkillArray = (player, skill, add = true) => {
				if (getAllPlayersCount() > 5) return;
				if (!isOtherSkill(skill, player)) return;
				if (!playerSkillArrays.has(player)) playerSkillArrays.set(player, []);
				const arr = playerSkillArrays.get(player);
				const idx = arr.indexOf(skill);
				if (add && idx === -1) arr.push(skill);
				if (!add && idx > -1) arr.splice(idx, 1);
				updateSkillDisplay(player);
			};
			const refreshPlayerSkills = player => {
				if (getAllPlayersCount() > 5 || !player) return;
				const avatar = player.node.avatar;
				if (!avatar) return;
				const merged = [...(player.skills || []), ...(player.additionalSkills ? Object.keys(player.additionalSkills) : [])].filter(skill => isOtherSkill(skill, player));
				playerSkillArrays.set(player, merged);
				updateSkillDisplay(player);
			};
			["showCharacterEnd", "hideCharacter", "changeCharacter", "removeCharacter"].forEach(eventName => {
				const oldHandler = lib.element.player[eventName];
				if (!oldHandler) return;
				lib.element.player[eventName] = function (...args) {
					if (typeof oldHandler === "function") oldHandler.apply(this, args);
					refreshPlayerSkills(this);
				};
			});
			const origAdd = lib.element.player.addSkill;
			const origRemove = lib.element.player.removeSkill;
			const origIsUnderControl = lib.element.player.isUnderControl;
			lib.element.player.addSkill = function (skill, ...args) {
				const res = origAdd.apply(this, [skill, ...args]);
				const applyAdd = s => requestAnimationFrame(() => updateSkillArray(this, s, true));
				if (Array.isArray(skill)) skill.forEach(applyAdd);
				else applyAdd(skill);
				return res;
			};
			lib.element.player.removeSkill = function (skill, ...args) {
				const res = origRemove.apply(this, [skill, ...args]);
				const applyRemove = s => requestAnimationFrame(() => updateSkillArray(this, s, false));
				if (Array.isArray(skill)) skill.forEach(applyRemove);
				else applyRemove(skill);
				return res;
			};
			if (typeof origIsUnderControl === "function") {
				lib.element.player.isUnderControl = function (...args) {
					const result = origIsUnderControl.apply(this, args);
					const prev = this.__babyshaUnderControl;
					this.__babyshaUnderControl = result;
					if (prev !== undefined && prev !== result && getAllPlayersCount() <= 5) {
						requestAnimationFrame(() => refreshPlayerSkills(this));
					}
					return result;
				};
			}
			lib.skill._zhuanhuanjiUpdate = {
				trigger: { global: "changeZhuanhuanji" },
				forced: true,
				popup: false,
				silent: true,
				filter(event, player) {
					return getAllPlayersCount() <= 5 && event.player && event.skill;
				},
				async content(event, trigger, player) {
					updateSkillDisplay(event.player);
				},
			};
			return { refreshPlayerSkills };
		})();
		lib.refreshPlayerSkills = skillDisplayManager.refreshPlayerSkills;
	}
	async function clearAllSkillDisplay() {
		for (const player of [...game.players, ...(game.dead || [])]) {
			const avatar = player.node.avatar;
			if (!avatar) continue;
			avatar.parentNode.querySelectorAll(".baby_skill").forEach(list => list.remove());
		}
	}
	lib.clearAllSkillDisplay = clearAllSkillDisplay;
	// 统一隐藏线上服务器前缀
	const hiddenPrefixes = ["新杀", "手杀", "OL", "TW"];
	const removeLeadingHiddenPrefix = name => {
		const hiddenPrefix = hiddenPrefixes.find(hp => name.startsWith(hp));
		return hiddenPrefix ? name.slice(hiddenPrefix.length) : name;
	};
	get.slimNameHorizontal = function (str) {
		let slimName = lib.translate[`${str}_ab`] || lib.translate[str];
		if (!slimName) return "";
		if (!lib.translate[`${str}_prefix`]) {
			return removeLeadingHiddenPrefix(slimName);
		}
		const prefixList = lib.translate[str + "_prefix"].split("|").filter(p => !hiddenPrefixes.includes(p));
		const setPrefix = [];
		let processedName = slimName;
		for (const prefix of prefixList) {
			const hiddenPrefixBefore = hiddenPrefixes.find(hp => processedName.startsWith(hp + prefix));
			if (hiddenPrefixBefore) {
				setPrefix.push(prefix);
				processedName = processedName.slice(hiddenPrefixBefore.length + prefix.length);
			} else if (processedName.startsWith(prefix)) {
				setPrefix.push(prefix);
				processedName = processedName.slice(prefix.length);
			} else {
				break;
			}
		}
		if (setPrefix.length) {
			return `${setPrefix.map(prefix => get.prefixSpan(prefix, str)).join("")}<span>${removeLeadingHiddenPrefix(processedName)}</span>`;
		}
		return removeLeadingHiddenPrefix(processedName);
	};
	const originalPrefixSpan = get.prefixSpan;
	get.prefixSpan = function (prefix, name) {
		return hiddenPrefixes.includes(prefix) ? "" : originalPrefixSpan.call(this, prefix, name);
	};
});
