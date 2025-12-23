"use strict";
decadeModule.import((lib, game, ui, get) => {
	if (!lib.config["extension_十周年UI_cardPrompt"]) return;

	const MAX_PARENT_DEPTH_SHALLOW = 5;
	const MAX_PARENT_DEPTH_DEEP = 10;
	const COMPARE_EVENT_NAMES = ["compareMultiple", "chooseToCompare", "chooseToCompareMultiple"];

	const decPrompt = text => (typeof text === "string" ? text.replace(/＃/g, "") : text);
	window.getDecPrompt = decPrompt;
	const stripTags = text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "");
	const sanitizePrompt = text => stripTags(decPrompt(text ?? "")).replace(/#/g, "");
	const getSingleTarget = target => {
		if (!target) return null;
		return Array.isArray(target) ? (target[0] ?? null) : target;
	};
	const resolveName = target => {
		if (!target) return null;
		const name = typeof target === "object" && target.name ? target.name : target;
		if (!name) return null;
		return get.slimNameHorizontal(name);
	};
	const closeDialog = dialog => {
		if (!dialog) return;
		if (typeof dialog === "object" && dialog.close) dialog.close();
	};
	const closeCardDialog = () => {
		closeDialog(ui.cardDialog);
		delete ui.cardDialog;
	};
	const hasVisibleTip = () => {
		const tip = ui.cardDialog;
		if (!tip) return false;
		if (tip.closed) return false;
		const info = tip.$info;
		if (info && typeof info.innerHTML === "string" && info.innerHTML.trim()) return true;
		const text = tip.textContent;
		if (typeof text === "string" && text.trim()) return true;
		return false;
	};
	const resetHandTips = () => {
		closeCardDialog();
		const tips = dui?.statics?.handTips;
		if (!Array.isArray(tips)) return;
		tips.forEach(tip => {
			if (!tip) return;
			tip.clear?.();
			tip.hide?.();
			if (tip.$info) tip.$info.innerHTML = "";
			tip.closed = true;
		});
	};
	const ensureTip = () => {
		closeCardDialog();
		return (ui.cardDialog = dui.showHandTip());
	};
	const appendTipHTML = (tipNode, html, style) => {
		if (!html) return;
		const nodes = tipNode.childNodes;
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].textContent === "") {
				nodes[i].innerHTML = html;
				if (style) nodes[i].dataset.type = style;
				return nodes[i];
			}
		}
		const span = document.createElement("span");
		span.innerHTML = html;
		if (style) span.dataset.type = style;
		return tipNode.appendChild(span);
	};
	const appendTipText = (tipNode, content) => {
		if (!content) return;
		if (Array.isArray(content)) {
			content.forEach(segment => {
				if (segment?.text) {
					if (segment.text.includes("<") || segment.text.includes("&lt;")) {
						appendTipHTML(tipNode, segment.text, segment.style);
					} else {
						tipNode.appendText(segment.text, segment.style);
					}
				}
			});
			return;
		}
		if (typeof content === "string" && (content.includes("<") || content.includes("&lt;"))) {
			appendTipHTML(tipNode, content);
		} else {
			tipNode.appendText(content);
		}
	};
	const cleanSkillName = name => {
		if (!name) return name;
		let cleaned = name;
		if (cleaned.endsWith("_cost")) cleaned = cleaned.slice(0, -"_cost".length);
		if (cleaned.endsWith("_backup")) cleaned = cleaned.slice(0, -"_backup".length);
		return cleaned;
	};
	const appendSkillName = (tipNode, skillName, player) => {
		tipNode.appendText("【");
		const resolvedSkill = get.sourceSkillFor ? get.sourceSkillFor(cleanSkillName(skillName)) : cleanSkillName(skillName);
		tipNode.appendText(get.skillTranslation(resolvedSkill, player), "phase");
		tipNode.appendText("】");
	};
	const isAskWuxie = event => {
		if (!event) return false;
		if (event.card?.name === "wuxie") return true;
		return sanitizePrompt(event.prompt).includes("无懈可击");
	};
	const resolveWuxieTarget = (event, respondCard, parentMap) => {
		let targetName = resolveName(getSingleTarget(respondCard?.target ?? respondCard?.targets));
		if (targetName) return targetName;
		if (event.target) {
			targetName = resolveName(getSingleTarget(event.target));
			if (targetName) return targetName;
		}
		if (parentMap) {
			if (parentMap.target) {
				targetName = resolveName(getSingleTarget(parentMap.target));
				if (targetName) return targetName;
			}
			if (parentMap.targets) {
				targetName = resolveName(getSingleTarget(parentMap.targets));
				if (targetName) return targetName;
			}
			if (parentMap.isJudge && parentMap.player) {
				targetName = resolveName(parentMap.player);
				if (targetName) return targetName;
			}
		}
		const fallback = event.target || parentMap?.target || parentMap?.targets?.[0] || respondCard?.target || respondCard?.targets?.[0] || parentMap?.player;
		return resolveName(getSingleTarget(fallback)) ?? "未知目标";
	};
	const getWuxieStateWord = (event, parentMap) => {
		if (typeof parentMap?.state === "number") {
			return parentMap.state > 0 ? "生效" : "失效";
		}
		const matchState = sanitizePrompt(event.prompt).match(/即将(生|失)效/);
		if (matchState) return matchState[1] === "生" ? "生效" : "失效";
		return "生效或失效";
	};
	const buildWuxieTipText = event => {
		const [sourcePlayer, respondCard] = Array.isArray(event.respondTo) ? event.respondTo : [];
		const sourceName = resolveName(sourcePlayer) ?? "未知角色";
		const cardName = respondCard ? get.translation(respondCard.name || respondCard) : "该牌";
		const parentEvent = typeof event.getParent === "function" ? event.getParent() : null;
		const parentMap = parentEvent?._info_map;
		const targetName = resolveWuxieTarget(event, respondCard, parentMap);
		const stateWord = getWuxieStateWord(event, parentMap);
		const segment = text => decPrompt(sanitizePrompt(text));
		const segmentName = name => decPrompt(name);
		return [{ text: segmentName(sourceName), style: "phase" }, { text: segment("对") }, { text: segmentName(targetName), style: "phase" }, { text: segment("使用的【") }, { text: segment(cardName), style: "phase" }, { text: segment("】即将") }, { text: segment(stateWord) }, { text: segment("，是否使用【") }, { text: segment("无懈可击"), style: "phase" }, { text: segment("】？") }];
	};
	const isJiedaoEvent = event => {
		if (!event?.respondTo) return false;
		const card = Array.isArray(event.respondTo) ? event.respondTo[1] : null;
		return card?.name === "jiedao";
	};
	const buildJiedaoTipText = event => {
		const [sourcePlayer, respondCard] = event.respondTo;
		const sourceName = resolveName(sourcePlayer) ?? "未知角色";
		const targetName = resolveName(event.sourcex) ?? "目标";
		const wrapText = text => decPrompt(sanitizePrompt(text));
		return [
			{ text: wrapText("请对"), style: "" },
			{ text: wrapText(targetName), style: "phase" },
			{ text: wrapText("使用【"), style: "" },
			{ text: wrapText("杀"), style: "phase" },
			{ text: wrapText("】，或令"), style: "" },
			{ text: wrapText(sourceName), style: "phase" },
			{ text: wrapText("获得你的武器"), style: "" },
		];
	};
	const parseRespondCardInfo = respondCard => {
		if (!Array.isArray(respondCard) || !respondCard[1]) return { actionWord: "打出", cardName: "" };
		const card = respondCard[1];
		const cardName = card?.name || card;
		if (!cardName || typeof cardName !== "string") return { actionWord: "打出", cardName: "" };
		const cardInfoKey = cardName + "_info";
		let cardInfo = lib.translate?.[cardInfoKey] || get.translation(cardInfoKey);
		if (!cardInfo || typeof cardInfo !== "string") return { actionWord: "打出", cardName: "" };
		const plainInfo = get.plainText ? get.plainText(cardInfo) : stripTags(cardInfo);
		const match = plainInfo.match(/(?:需|须)(打出|使用)(?:.*?张|一张)【(.+?)】|打出(?:.*?张|一张)【(.+?)】/);
		if (!match) return { actionWord: "打出", cardName: "" };
		if (match[1]) return { actionWord: match[1], cardName: match[2] };
		return { actionWord: "打出", cardName: match[3] };
	};
	const resolveRespondTargetName = event => {
		if (Array.isArray(event.respondTo) && event.respondTo[1]) {
			const respondCard = event.respondTo[1];
			const respondName = respondCard?.name || respondCard;
			if (respondName) return get.translation(respondName);
		}
		if (typeof event.getParent === "function") {
			const parent = event.getParent();
			const parentName = parent?.skill || parent?.name;
			if (parentName) return get.skillTranslation(parentName, event.player);
		}
		return "当前请求";
	};
	const buildRespondTipText = event => {
		if (!event) return null;
		if (isAskWuxie(event)) return buildWuxieTipText(event);
		if (isJiedaoEvent(event)) return buildJiedaoTipText(event);
		const promptText = sanitizePrompt(event.prompt);
		if (!promptText) return null;
		const wrapText = text => decPrompt(sanitizePrompt(text));
		const [min = 1, max = min] = get.select(event.selectCard) ?? [];
		const needCount = max >= 0 ? max : min;
		const { actionWord, cardName: respondCardName } = parseRespondCardInfo(event.respondTo);
		const respondTargetName = resolveRespondTargetName(event);
		return [{ text: wrapText(`请${actionWord}${needCount}张【`) }, { text: wrapText(respondCardName), style: "phase" }, { text: wrapText("】响应【") }, { text: wrapText(respondTargetName), style: "phase" }, { text: wrapText("】") }];
	};
	const traverseParent = (event, maxDepth, predicate) => {
		if (typeof event.getParent !== "function") return null;
		let parent = event.getParent();
		for (let depth = 0; depth < maxDepth && parent; depth++) {
			if (predicate(parent)) return parent;
			parent = typeof parent.getParent === "function" ? parent.getParent() : null;
		}
		return null;
	};
	const markPhaseDiscard = event => {
		return traverseParent(event, MAX_PARENT_DEPTH_SHALLOW, parent => parent.name === "phaseDiscard") !== null;
	};
	const getCompareParent = event => {
		return traverseParent(event, MAX_PARENT_DEPTH_DEEP, parent => COMPARE_EVENT_NAMES.includes(parent.name));
	};
	const getCompareSkill = event => {
		const compareParent = getCompareParent(event);
		if (!compareParent) return null;
		let parent = compareParent.getParent();
		for (let depth = 0; depth < MAX_PARENT_DEPTH_DEEP && parent; depth++) {
			if (parent.skill) return parent.skill;
			if (parent.name && !COMPARE_EVENT_NAMES.includes(parent.name)) return parent.name;
			parent = typeof parent.getParent === "function" ? parent.getParent() : null;
		}
		return null;
	};
	const showTip = (tip, content) => {
		appendTipText(tip, content);
		tip.strokeText();
		tip.show();
	};
	const getPositionWord = position => {
		if (!position || position === "h") return "手";
		if (position === "e") return "装备";
		return "";
	};
	const buildDiscardTipText = (event, selectedCount, needCount, min) => {
		const positionWord = getPositionWord(event.position);
		const prefix = event.forced ? "请" : "是否";
		const suffix = event.forced ? "" : "？";
		const minText = min !== needCount ? `（至少${min}张）` : "";
		return `${prefix}弃置${selectedCount}/${needCount}张${positionWord}牌${minText}${suffix}`;
	};
	const appendDiscardSkillPrefix = (tip, event, compareSkill) => {
		const skillName = compareSkill || (event.getParent ? event.getParent().skill || event.getParent().name || "" : "");
		if (!skillName) return "";
		appendSkillName(tip, skillName, event.player);
		tip.appendText("：");
		return "";
	};
	const handleDiscard = event => {
		closeCardDialog();
		closeDialog(event.dialog);
		event.dialog = false;
		event.prompt = false;
		const discardTip = ensureTip();
		const compareSkill = getCompareSkill(event);
		const showPhase = markPhaseDiscard(event);
		if (showPhase) {
			discardTip.appendText("弃牌阶段", "phase");
		} else {
			appendDiscardSkillPrefix(discardTip, event, compareSkill);
		}
		const selectedCount = (ui.selected?.cards ?? []).length;
		const [min = 0, max = min] = get.select(event.selectCard) ?? [];
		const needCount = max >= 0 ? max : min;
		const prefix = showPhase ? "，" : "";
		const tipText = decPrompt(stripTags(prefix + buildDiscardTipText(event, selectedCount, needCount, min)));
		discardTip.appendText(tipText);
		showTip(discardTip);
		event.filterStop = function () {
			if (this.step > 1 && ui.cardDialog) closeCardDialog();
		};
	};
	const handleRespondUse = (event, compareSkill) => {
		const promptIncludesRespond = typeof event.prompt === "string" && event.prompt.includes("响应");
		const respondTipText = event.respondTo || promptIncludesRespond ? buildRespondTipText(event) : null;
		if (!respondTipText) return false;
		event.prompt = false;
		const respondTip = ensureTip();
		if (compareSkill) {
			appendSkillName(respondTip, compareSkill, event.player);
			respondTip.appendText("，");
		}
		showTip(respondTip, respondTipText);
		return true;
	};
	const handleDyingUse = event => {
		if (event.type !== "dying" || !event.dying) return false;
		closeDialog(event.dialog);
		event.dialog = false;
		event.prompt = false;
		const dyingTip = ensureTip();
		const dyingName = resolveName(event.dying) ?? get.translation(event.dying);
		appendTipHTML(dyingTip, dyingName, "phase");
		const tipText = decPrompt(stripTags(`濒死，需要${1 - event.dying.hp}个桃，是否帮助？`));
		dyingTip.appendText(tipText);
		showTip(dyingTip);
		return true;
	};
	const handleSkillUse = event => {
		if (!event.skill) return false;
		const skillTip = ensureTip();
		skillTip.appendText("是否发动");
		appendSkillName(skillTip, event.skill, event.player);
		const tipText = decPrompt(stripTags("？"));
		skillTip.appendText(tipText);
		showTip(skillTip);
		return true;
	};
	const cleanCardInfoText = text => {
		return text
			.replace(/出牌阶段，/g, "")
			.replace(/每回合限一次。/g, "")
			.replace(/准备阶段，/g, "")
			.replace(/锁定技。/g, "")
			.replace(/锁定技，/g, "");
	};
	const handlePhaseUse = event => {
		if (event.type !== "phase") return false;
		const selectedCards = ui.selected?.cards ?? [];
		const tip = ensureTip();
		if (selectedCards.length === 1) {
			const cardInfo = get.translation(`${get.name(selectedCards[0])}_info`);
			const plainText = get.plainText ? get.plainText(cardInfo) : stripTags(cardInfo);
			const text = decPrompt(stripTags(cleanCardInfoText(plainText)));
			tip.appendText(text);
		} else {
			tip.appendText("出牌阶段", "phase");
			tip.appendText(decPrompt(stripTags("，请选择一张卡牌")));
		}
		showTip(tip);
		return true;
	};
	const handleUse = event => {
		closeCardDialog();
		const compareSkill = getCompareSkill(event);
		if (handleRespondUse(event, compareSkill)) return;
		if (handleDyingUse(event)) return;
		if (handleSkillUse(event)) return;
		handlePhaseUse(event);
	};
	const handleRespond = event => {
		closeCardDialog();
		closeDialog(event.dialog);
		event.dialog = false;
		event.prompt2 = false;
		const tip = ensureTip();
		const compareSkill = getCompareSkill(event);
		if (compareSkill) {
			appendSkillName(tip, compareSkill, event.player);
			tip.appendText("，");
		}
		const respondTipText = buildRespondTipText(event);
		event.prompt = false;
		showTip(tip, respondTipText);
	};
	lib.hooks.checkBegin.add(event => {
		if (event.player !== game.me) return;
		if (event.name === "chooseToUse" && event.type === "dying" && event.dying) event.prompt = false;
		if (event.name === "chooseToDiscard") event.prompt = false;
	});
	lib.hooks.checkButton.add(event => {
		const dialog = event.dialog;
		if (!dialog?.buttons) return;
		const range = get.select(event.selectButton);
		const maxSelect = range[1];
		const isUnlimited = maxSelect === -1;
		let selectableButtons = false;
		dialog.buttons.forEach(button => {
			if (button.classList.contains("unselectable")) return;
			const isFiltered = event.filterButton(button, event.player) && lib.filter.buttonIncluded(button);
			const isSelected = button.classList.contains("selected");
			if (isFiltered) {
				if (ui.selected.buttons.length < maxSelect) {
					button.classList.add("selectable");
				} else if (isUnlimited) {
					button.classList.add("selected");
					ui.selected.buttons.add(button);
				} else {
					button.classList.remove("selectable");
				}
			} else {
				button.classList.remove("selectable");
				if (isUnlimited && isSelected) {
					button.classList.remove("selected");
					ui.selected.buttons.remove(button);
				}
			}
			if (isSelected) {
				button.classList.add("selectable");
			} else if (!selectableButtons && button.classList.contains("selectable")) {
				selectableButtons = true;
			}
		});
		event.custom?.add?.button?.();
	});
	lib.hooks.checkEnd.add(event => {
		if (event.player !== game.me) {
			closeCardDialog();
			return;
		}
		if (event.name === "chooseToDiscard") {
			handleDiscard(event);
			return;
		}
		if (event.name === "chooseToUse") {
			handleUse(event);
			return;
		}
		if (event.name === "chooseToRespond") {
			handleRespond(event);
			return;
		}
		closeCardDialog();
	});
	const installPromptCleanup = () => {
		if (game.__decadePromptCleanupInstalled || typeof game.over !== "function") return;
		game.__decadePromptCleanupInstalled = true;
		const originalGameOver = game.over;
		game.over = function decadeUIPromptCleanup(...args) {
			try {
				resetHandTips();
			} catch (error) {}
			return originalGameOver.apply(this, args);
		};
	};
	const refreshTipForCurrentEvent = event => {
		if (!event) return;
		if (event.player !== game.me) return;
		if (event.name === "chooseToDiscard") {
			handleDiscard(event);
			return;
		}
		if (event.name === "chooseToUse") {
			handleUse(event);
			return;
		}
		if (event.name === "chooseToRespond") {
			handleRespond(event);
			return;
		}
		if (event.type === "phase") {
			handlePhaseUse(event);
		}
	};
	const installCancelRefresh = () => {
		if (game.__decadePromptCancelRefreshInstalled) return;
		const click = ui?.click;
		if (!click || typeof click.cancel !== "function") return;
		game.__decadePromptCancelRefreshInstalled = true;
		const originalCancel = click.cancel;
		click.cancel = function decadeUIPromptCancel(...args) {
			const result = originalCancel.apply(this, args);
			setTimeout(() => {
				try {
					if (hasVisibleTip()) return;
					const current = typeof _status !== "undefined" ? _status.event : null;
					refreshTipForCurrentEvent(current);
				} catch (e) {}
			}, 0);
			return result;
		};
	};
	installPromptCleanup();
	installCancelRefresh();
});
