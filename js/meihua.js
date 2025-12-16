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

	// 更多音效
	if (lib.config["extension_十周年UI_bettersound"]) {
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
		lib.skill._hpLossAudio = {
			trigger: { player: "loseHpBefore" },
			forced: true,
			popup: false,
			charlotte: true,
			filter(event) {
				return !!event.num;
			},
			async content(event, trigger, player) {
				game.playAudio("..", "extension", "十周年UI", "audio/hpLossSund.mp3");
			},
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
			const getSkillIcon = (skill, player) => {
				const info = get.info(skill);
				if (!info) return null;
				if (info.limited) {
					return "xiandingjihs.png";
				}
				if (info.juexingji) {
					return "juexingjihs.png";
				}
				if (get.is.zhuanhuanji(skill, player)) {
					const markNode = player?.node?.xSkillMarks?.querySelector(`.skillMarkItem.zhuanhuanji[data-id="${skill}"]`);
					const imgType = markNode?.classList.contains("yin") ? "ying" : "yang";
					return imgType === "yang" ? "mark_yanghs.png" : "mark_yinghs.png";
				}
				return null;
			};
			const showSkillDescription = (skill, targetElement) => {
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
				const skillDesc = get.translation(skill, "info") || "暂无描述";
				description.innerHTML = skillDesc;
				popup.appendChild(description);
				document.body.appendChild(popup);
				const titleHeight = title.scrollHeight;
				const descHeight = description.scrollHeight;
				const marginBetween = 8; // 标题和描述之间的间距
				const padding = 24; // 上下padding
				const totalContentHeight = titleHeight + descHeight + marginBetween + padding;
				popup.style.height = `${totalContentHeight}px`;
				const rect = targetElement.getBoundingClientRect();
				const popupRect = popup.getBoundingClientRect();
				let left = rect.left + rect.width / 2 - popupRect.width / 2; // 居中显示
				let top = rect.top - popupRect.height - 10;
				if (left < 10) left = 10;
				if (left + popupRect.width > window.innerWidth - 10) left = window.innerWidth - popupRect.width - 10;
				if (top < 10) top = rect.bottom + 10;
				popup.style.left = `${left}px`;
				popup.style.top = `${top}px`;
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
