"use strict";

decadeModule.import((lib, game, _ui, get, _ai, _status) => {
	// ==================== 工具函数 ====================

	/** 获取当前模式是否为双将模式 */
	const isDoubleCharacterMode = () => {
		const mode = get.mode();
		return mode === "guozhan" || lib.config.mode_config[mode]?.double_character;
	};

	/** 添加样式到页面 */
	const addStyle = css => {
		const style = document.createElement("style");
		style.innerHTML = css;
		document.head.appendChild(style);
	};

	/** 播放扩展音效 */
	const playExtAudio = name => {
		game.playAudio("..", "extension", "十周年UI", `audio/${name}`);
	};

	// ==================== 武将背景模式 ====================

	if (lib.config["extension_十周年UI_wujiangbeijing"]) {
		const setPlayerBackground = player => {
			if (!player) return;
			player.setAttribute("data-mode", isDoubleCharacterMode() ? "guozhan" : "normal");
		};

		lib.skill._wjBackground = {
			charlotte: true,
			forced: true,
			popup: false,
			priority: 100,
			trigger: {
				global: ["gameStart", "modeSwitch"],
				player: ["enterGame", "showCharacterEnd"],
			},
			async content() {
				game.players.forEach(setPlayerBackground);
				game.dead.forEach(setPlayerBackground);
			},
		};

		lib.arenaReady.push(() => {
			document.body.setAttribute("data-mode", isDoubleCharacterMode() ? "guozhan" : "normal");
		});
	}

	// ==================== 增强音效 ====================

	if (lib.config["extension_十周年UI_bettersound"]) {
		// 屏蔽原生掉血音效
		game._decadeUI_blockedEquipAudios = game._decadeUI_blockedEquipAudios || new Set(["loseHp"]);

		// 包装 playAudio 以过滤音效
		if (!game._decadeUI_playAudioWrapped) {
			const originalPlayAudio = game.playAudio;
			game.playAudio = function (...args) {
				if (args[0] === "effect" && game._decadeUI_blockedEquipAudios?.has(args[1])) return;
				return originalPlayAudio.apply(this, args);
			};
			game._decadeUI_playAudioWrapped = true;
		}

		// UI点击音效
		if (!game._decadeUI_uiClickAudioHandler) {
			const AUDIO_RULES = [
				{ test: t => t.closest("#dui-controls") && (t.classList?.contains("control") || t.parentElement?.classList?.contains("control")), sound: "BtnSure" },
				{ test: t => t.closest(".menubutton, .button, .card"), sound: "card_click" },
			];

			const uiClickAudioHandler = e => {
				if (e.button !== 0) return;

				const audioToPlay = AUDIO_RULES.find(r => r.test(e.target))?.sound;
				if (!audioToPlay) return;

				// 防抖：60ms内不重复播放
				const now = Date.now();
				if (now - (game._decadeUI_lastUIAudioAt || 0) < 60) return;
				game._decadeUI_lastUIAudioAt = now;

				playExtAudio(audioToPlay);
			};

			document.body.addEventListener("pointerdown", uiClickAudioHandler, { capture: true, passive: true });
			game._decadeUI_uiClickAudioHandler = uiClickAudioHandler;
		}

		// 准备阶段音效
		lib.skill._preparePhaseAudio = {
			charlotte: true,
			forced: true,
			popup: false,
			trigger: { player: ["phaseZhunbeiBefore"] },
			filter: (_event, player) => player === game.me && _status.currentPhase === player,
			async content() {
				playExtAudio("seatRoundState_start");
			},
		};

		// 掉血音效
		lib.skill._hpLossAudio = {
			charlotte: true,
			forced: true,
			popup: false,
			trigger: { player: "loseHpBefore" },
			filter: event => !!event.num,
			async content() {
				playExtAudio("hpLossSund.mp3");
			},
		};
	}

	// ==================== 卡牌边框样式 ====================

	const borderImageName = lib.config.extension_十周年UI_cardkmh;
	if (borderImageName && borderImageName !== "off") {
		const borderUrl = `${lib.assetURL}extension/十周年UI/assets/image/${borderImageName}.png`;
		const borderBase = `border: 1px solid; border-radius: 10px; border-image-source: url('${borderUrl}'); border-image-slice: 17;`;

		addStyle(`
			.hand-cards > .handcards > .card {
				margin: 0; width: 108px; height: 150px; position: absolute;
				transition-property: transform, opacity, left, top;
				${borderBase} border-image-width: 20px; z-index: 51;
			}
			#arena > .card,
			#arena.oblongcard:not(.chess) > .card,
			#arena.oblongcard:not(.chess) .handcards > .card {
				width: 108px; height: 150px;
				${borderBase} border-image-width: 16px;
			}
		`);
	}

	// ==================== 卡牌背景样式 ====================

	const cardBg = lib.config.extension_十周年UI_cardbj;
	if (cardBg && cardBg !== "kb1") {
		addStyle(`.card:empty, .card.infohidden { background: url('${lib.assetURL}extension/十周年UI/assets/image/${cardBg}.png'); background-size: 100% 100% !important; }`);
	}

	// ==================== 技能外显 (babysha样式专用) ====================

	if (lib.config.extension_十周年UI_newDecadeStyle === "babysha" && game.players.length <= 5) {
		initSkillDisplay();
	}

	/** 清除所有技能外显 */
	lib.clearAllSkillDisplay = async function () {
		for (const player of [...game.players, ...(game.dead || [])]) {
			player.node?.avatar?.parentNode?.querySelectorAll(".baby_skill").forEach(el => el.remove());
		}
	};

	// ==================== 武将名前缀处理 ====================

	const HIDDEN_PREFIXES = ["新杀", "手杀", "OL", "TW"];

	/** 移除隐藏前缀 */
	const removeHiddenPrefix = name => {
		const prefix = HIDDEN_PREFIXES.find(p => name.startsWith(p));
		return prefix ? name.slice(prefix.length) : name;
	};

	/** 获取精简横向名称 */
	get.slimNameHorizontal = function (str) {
		const slimName = lib.translate[`${str}_ab`] || lib.translate[str];
		if (!slimName) return "";

		const prefixKey = `${str}_prefix`;
		if (!lib.translate[prefixKey]) return removeHiddenPrefix(slimName);

		const prefixList = lib.translate[prefixKey].split("|").filter(p => !HIDDEN_PREFIXES.includes(p));
		const setPrefix = [];
		let processedName = slimName;

		for (const prefix of prefixList) {
			const hiddenBefore = HIDDEN_PREFIXES.find(hp => processedName.startsWith(hp + prefix));
			if (hiddenBefore) {
				setPrefix.push(prefix);
				processedName = processedName.slice(hiddenBefore.length + prefix.length);
			} else if (processedName.startsWith(prefix)) {
				setPrefix.push(prefix);
				processedName = processedName.slice(prefix.length);
			} else {
				break;
			}
		}

		if (setPrefix.length) {
			const prefixHtml = setPrefix.map(p => get.prefixSpan(p, str)).join("");
			return `${prefixHtml}<span>${removeHiddenPrefix(processedName)}</span>`;
		}
		return removeHiddenPrefix(processedName);
	};

	// 包装 prefixSpan 以过滤隐藏前缀
	const originalPrefixSpan = get.prefixSpan;
	get.prefixSpan = function (prefix, name) {
		return HIDDEN_PREFIXES.includes(prefix) ? "" : originalPrefixSpan.call(this, prefix, name);
	};

	// ==================== 技能外显模块 ====================

	function initSkillDisplay() {
		const MAX_PLAYERS = 5;
		const playerSkillArrays = new WeakMap();

		const getAllPlayersCount = () => game.players.length + (game.dead?.length || 0);

		/** 判断是否为需要显示的技能 */
		const isDisplayableSkill = (skill, player) => {
			if (!player || player === game.me || !lib.translate?.[skill]) return false;
			const info = get.info(skill);
			if (info?.charlotte) return false;
			if (info?.zhuSkill && !player.isZhu) return true;
			return !info || !info.nopop || skill.startsWith("olhedao_tianshu_");
		};

		const getSkillName = skill => lib.translate?.[skill] || skill;

		/** 获取技能图标 */
		const getSkillIcon = (skill, player) => {
			const info = get.info(skill);
			if (!info) return null;
			if (info.limited) return "xiandingjihs.png";
			if (info.juexingji) return "juexingjihs.png";
			if (get.is.zhuanhuanji(skill, player)) {
				const markNode = player?.node?.xSkillMarks?.querySelector(`.skillMarkItem.zhuanhuanji[data-id="${skill}"]`);
				return markNode?.classList.contains("yin") ? "mark_yinghs.png" : "mark_yanghs.png";
			}
			return null;
		};

		/** 显示技能描述弹窗 */
		const showSkillPopup = (skill, targetEl) => {
			document.querySelector(".baby_skill_popup")?.remove();
			if (!lib.skill[skill]) return;

			const popup = document.createElement("div");
			popup.className = "baby_skill_popup";
			popup.innerHTML = `
				<div class="skill_title">${getSkillName(skill)}</div>
				<div class="skill_description">${get.translation(skill, "info") || "暂无描述"}</div>
			`;
			document.body.appendChild(popup);

			// 计算高度
			const title = popup.querySelector(".skill_title");
			const desc = popup.querySelector(".skill_description");
			popup.style.height = `${title.scrollHeight + desc.scrollHeight + 32}px`;

			// 定位
			const rect = targetEl.getBoundingClientRect();
			const popupRect = popup.getBoundingClientRect();
			let left = rect.left + rect.width / 2 - popupRect.width / 2;
			let top = rect.top - popupRect.height - 10;

			left = Math.max(10, Math.min(left, window.innerWidth - popupRect.width - 10));
			if (top < 10) top = rect.bottom + 10;

			popup.style.left = `${left}px`;
			popup.style.top = `${top}px`;

			// 点击外部关闭
			const closeHandler = e => {
				if (!popup.contains(e.target)) {
					popup.remove();
					document.removeEventListener("click", closeHandler);
				}
			};
			setTimeout(() => document.addEventListener("click", closeHandler), 100);
		};

		/** 更新玩家技能显示 */
		const updateSkillDisplay = player => {
			if (getAllPlayersCount() > MAX_PLAYERS) return;
			const avatar = player.node?.avatar;
			if (!avatar) return;

			// 清除旧显示
			avatar.parentNode.querySelectorAll(".baby_skill").forEach(el => el.remove());

			// 去重技能
			const skillArray = playerSkillArrays.get(player) || [];
			const seen = new Set();
			const uniqueSkills = skillArray.filter(skill => {
				const name = getSkillName(skill);
				if (seen.has(name)) return false;
				seen.add(name);
				return true;
			});

			// 计算位置
			const rect = avatar.getBoundingClientRect();
			const isLeft = rect.left < window.innerWidth / 2;
			const isDouble = isDoubleCharacterMode();
			const baseOffset = isDouble ? 135 : 75;

			// 创建技能元素
			const frag = document.createDocumentFragment();
			uniqueSkills.forEach((skill, idx) => {
				const skillEl = document.createElement("div");
				skillEl.className = "baby_skill";
				Object.assign(skillEl.style, {
					position: "absolute",
					bottom: `${idx * 35 + 30}px`,
					zIndex: "102",
					left: isLeft ? `${avatar.offsetWidth + (isDouble ? 65 : 10)}px` : "",
					right: isLeft ? "" : `${avatar.offsetWidth + baseOffset}px`,
				});

				// 技能名
				const skillBox = document.createElement("div");
				skillBox.className = "baby_skill_box";
				skillBox.dataset.skill = skill;
				skillBox.textContent = getSkillName(skill).slice(0, 2);
				skillBox.style.cursor = "pointer";
				skillBox.addEventListener("click", e => {
					e.stopPropagation();
					playExtAudio("BtnSure");
					showSkillPopup(skill, e.target);
				});
				skillEl.appendChild(skillBox);

				// 技能图标
				const icon = getSkillIcon(skill, player);
				if (icon) {
					const iconImg = document.createElement("img");
					iconImg.src = `extension/十周年UI/shoushaUI/skill/babysha/${icon}`;
					Object.assign(iconImg.style, { position: "absolute", top: "3px", right: "-15px", width: "16px", height: "16px", zIndex: "103" });
					skillEl.appendChild(iconImg);
				}

				frag.appendChild(skillEl);
			});
			avatar.parentNode.appendChild(frag);
		};

		/** 更新技能数组 */
		const updateSkillArray = (player, skill, add = true) => {
			if (getAllPlayersCount() > MAX_PLAYERS || !isDisplayableSkill(skill, player)) return;

			if (!playerSkillArrays.has(player)) playerSkillArrays.set(player, []);
			const arr = playerSkillArrays.get(player);
			const idx = arr.indexOf(skill);

			if (add && idx === -1) arr.push(skill);
			else if (!add && idx > -1) arr.splice(idx, 1);

			updateSkillDisplay(player);
		};

		/** 刷新玩家所有技能 */
		const refreshPlayerSkills = player => {
			if (getAllPlayersCount() > MAX_PLAYERS || !player?.node?.avatar) return;

			const skills = [...(player.skills || []), ...(player.additionalSkills ? Object.keys(player.additionalSkills) : [])];
			playerSkillArrays.set(
				player,
				skills.filter(s => isDisplayableSkill(s, player))
			);
			updateSkillDisplay(player);
		};

		// 钩子：角色事件
		["showCharacterEnd", "hideCharacter", "changeCharacter", "removeCharacter"].forEach(event => {
			const original = lib.element.player[event];
			if (typeof original !== "function") return;
			lib.element.player[event] = function (...args) {
				original.apply(this, args);
				refreshPlayerSkills(this);
			};
		});

		// 钩子：添加/移除技能
		const origAdd = lib.element.player.addSkill;
		const origRemove = lib.element.player.removeSkill;

		lib.element.player.addSkill = function (skill, ...args) {
			const res = origAdd.apply(this, [skill, ...args]);
			const skills = Array.isArray(skill) ? skill : [skill];
			skills.forEach(s => requestAnimationFrame(() => updateSkillArray(this, s, true)));
			return res;
		};

		lib.element.player.removeSkill = function (skill, ...args) {
			const res = origRemove.apply(this, [skill, ...args]);
			const skills = Array.isArray(skill) ? skill : [skill];
			skills.forEach(s => requestAnimationFrame(() => updateSkillArray(this, s, false)));
			return res;
		};

		// 钩子：控制状态变化
		const origIsUnderControl = lib.element.player.isUnderControl;
		if (typeof origIsUnderControl === "function") {
			lib.element.player.isUnderControl = function (...args) {
				const result = origIsUnderControl.apply(this, args);
				const prev = this.__babyshaUnderControl;
				this.__babyshaUnderControl = result;
				if (prev !== undefined && prev !== result && getAllPlayersCount() <= MAX_PLAYERS) {
					requestAnimationFrame(() => refreshPlayerSkills(this));
				}
				return result;
			};
		}

		// 转换技更新监听
		lib.skill._zhuanhuanjiUpdate = {
			charlotte: true,
			forced: true,
			popup: false,
			silent: true,
			trigger: { global: "changeZhuanhuanji" },
			filter: event => getAllPlayersCount() <= MAX_PLAYERS && event.player && event.skill,
			async content(event) {
				updateSkillDisplay(event.player);
			},
		};

		lib.refreshPlayerSkills = refreshPlayerSkills;
	}
});
