/**
 * Player 覆写模块
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { DynamicPlayer } from "../animation/index.js";
import { applyCardBorder } from "../ui/cardStyles.js";

// 基础方法引用
let basePlayerMethods = null;

/** 播放出牌音效 */
const playShowCardAudio = () => {
	if (!lib.config["extension_十周年UI_bettersound"]) return;
	game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard.mp3");
};

/**
 * 设置基础方法引用
 */
export function setBasePlayerMethods(methods) {
	basePlayerMethods = methods;
}

/**
 * 添加技能覆写
 */
export function playerAddSkill(skill) {
	const result = basePlayerMethods.addSkill.apply(this, arguments);
	if (!Array.isArray(result)) {
		const skills = ["name", "name1", "name2"].reduce((list, name) => {
			if (this[name] && (name != "name1" || this.name != this.name1)) {
				list.addArray(get.character(this[name], 3) || []);
			}
			return list;
		}, []);
		if (!skills.includes(result)) {
			const info = get.info(result);
			if (!(!info || info.nopop || !get.translation(result + "_info") || !lib.translate[result + "_info"])) {
				this.node.gainSkill.gain(result);
			}
		}
	}
	[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
	return result;
}

/**
 * 移除技能覆写
 */
export function playerRemoveSkill(skill) {
	const result = basePlayerMethods.removeSkill.apply(this, arguments);
	if (!Array.isArray(result)) {
		if (this.node.gainSkill.skills?.includes(result)) {
			this.node.gainSkill.lose(result);
		}
	}
	[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
	return result;
}

/**
 * 觉醒技能覆写
 */
export function playerAwakenSkill(skill) {
	const result = basePlayerMethods.awakenSkill.apply(this, arguments);
	ui.updateSkillControl?.(this);
	if (get.info(skill)?.dutySkill) {
		const that = this;
		game.expandSkills([skill]).forEach(taofen => that.shixiaoSkill(taofen));
	}
	const fname = _status.event.getParent()?.skill;
	if (fname?.endsWith("_fail") && fname?.slice(0, -5) == skill) {
		this.failSkill(skill);
	}
	return result;
}

/**
 * 设置身份覆写
 */
export function playerSetIdentity(identity) {
	identity = identity || this.identity;
	this.node.identity.dataset.color = identity;
	if (get.mode() == "guozhan") {
		if (identity == "ye" && get.is.jun(this)) {
			this.identity = identity = lib.character[this.name1][1];
		}
		this.group = identity;
		this.node.identity.firstChild.innerHTML = get.translation(identity);
		return this;
	}
	if (get.is.jun(this)) {
		this.node.identity.firstChild.innerHTML = "君";
	} else {
		this.node.identity.firstChild.innerHTML = get.translation(identity);
	}
	return this;
}

/**
 * 获取状态覆写
 */
export function playerGetState() {
	const state = basePlayerMethods.getState.apply(this, arguments);
	state.seat = this.seat;
	return state;
}

/**
 * 检查是否应该跳过标记
 */
const SKIP_PREFIXES = ["xinfu_falu_", "starcanxi_"];
const SKIP_EXCEPTIONS = new Set(["starcanxi_wangsheng", "starcanxi_xiangsi", "starcanxi_cancel"]);

function shouldSkipMark(item) {
	if (!item) return false;
	const style = duicfg?.newDecadeStyle ?? lib.config.extension_十周年UI_newDecadeStyle;
	if (style === "Off") return false;

	const info = get.info(item);
	if (info?.zhuanhuanji || info?.zhuanhuanji2 || info?.limited) return true;

	if (typeof item !== "string") return false;
	if (style !== "on" && style !== "othersOff") return false;

	return SKIP_PREFIXES.some(p => item.startsWith(p)) && !SKIP_EXCEPTIONS.has(item);
}

/**
 * 标记技能覆写
 */
export function playerMarkSkill(name, info, card, nobroadcast) {
	if (shouldSkipMark(name)) return;
	return basePlayerMethods.markSkill.apply(this, arguments);
}

/**
 * 取消标记技能覆写
 */
export function playerUnmarkSkill(name, info, card, nobroadcast) {
	if (shouldSkipMark(name)) return;
	return basePlayerMethods.unmarkSkill.apply(this, arguments);
}

/**
 * 重新初始化武将覆写
 */
export async function playerReinitCharacter(from, to, log) {
	this.stopDynamic();
	const result = basePlayerMethods.reinitCharacter.apply(this, arguments);
	await Promise.resolve(result);
	this._decadeUIApplyDynamicSkin();
	return result;
}

/**
 * 设置座位号覆写
 */
export function playerSetSeatNum() {
	basePlayerMethods.setSeatNum.apply(this, arguments);
	this.seat = this.getSeatNum();
	game.broadcastAll(function (player) {
		const actualSeat = player.getSeatNum ? player.getSeatNum() : player.seat;
		if (!player.node.seat) {
			player.node.seat = window.decadeUI.element.create("seat", player);
		}
		player.node.seat.innerHTML = get.cnNumber(actualSeat, true);
	}, this);
}

/**
 * 玩家$uninit覆写
 */
export function playerUninit() {
	// 清理所有前缀标记
	if (window.decadeModule?.prefixMark) {
		window.decadeModule.prefixMark.clearPrefixMarks(this);
	}
	this.stopDynamic();
	this.doubleAvatar = false;
	delete this.node.campWrap.dataset.camp;
	const campName = this.node.campWrap.node.campName;
	while (campName.firstChild) {
		campName.removeChild(campName.lastChild);
	}
	campName.style.removeProperty("background-image");
	const hujiat = this.node.hpWrap.querySelector(".hujia");
	if (hujiat) hujiat.remove();
	this.node.showCards?.hide();
	basePlayerMethods.$uninit.apply(this, arguments);
	return this;
}

/**
 * 玩家$reinit覆写
 */
export function playerReinit(from, to, maxHp, online) {
	basePlayerMethods.$reinit.apply(this, arguments);
	if (window.decadeModule?.prefixMark) {
		window.decadeModule.prefixMark.clearPrefixMarks(this);
		const currentCharacter = this.name1 || this.name;
		if (currentCharacter) {
			window.decadeModule.prefixMark.showPrefixMark(currentCharacter, this);
		}
		if (this.doubleAvatar && this.name2) {
			window.decadeModule.prefixMark.showPrefixMark(this.name2, this);
		}
	}
	this._addPrefixSeparator(this.node.name);
	if (this.doubleAvatar && this.node.name2) {
		this._addPrefixSeparator(this.node.name2);
	}
	return this;
}

/**
 * 玩家$update覆写
 */
export function playerUpdate() {
	basePlayerMethods.$update.apply(this, arguments);

	// 护甲显示修改
	let hujiat = this.node.hpWrap.querySelector(".hujia");
	if (this.hujia > 0) {
		if (!hujiat) {
			hujiat = ui.create.div(".hujia");
			this.node.hpWrap.appendChild(hujiat);
		}
		hujiat.innerText = this.hujia == Infinity ? "∞" : this.hujia;
	} else if (hujiat) {
		hujiat.remove();
	}

	// 体力条显示修改
	const hidden = this.classList.contains("unseen_show") || this.classList.contains("unseen2_show");
	let hp = this.hp;
	let hpMax = hidden ? 1 : this.maxHp;
	let hpNode = this.node.hp;
	const goon = hpMax > 5 || (this.hujia && hpMax > 3);

	if (!this.storage.nohp) {
		if (goon) {
			hpNode.innerHTML = (isNaN(hp) ? "×" : hp == Infinity ? "∞" : hp) + "<br>/<br>" + (isNaN(hpMax) ? "×" : hpMax == Infinity ? "∞" : hpMax) + "<div></div>";
			if (hp == 0) hpNode.lastChild.classList.add("lost");
			hpNode.classList.add("textstyle");
		}
	}
	this.dataset.maxHp = goon ? 4 : hpMax;

	// 手牌数显示修改
	let count = this.countCards("h");
	if (this == game.me) {
		const currentStyle = lib.config.extension_十周年UI_newDecadeStyle;
		if (currentStyle === "onlineUI" || currentStyle === "babysha" || currentStyle === "codename") {
			this.node.count.innerHTML = count + "/" + this.getHandcardLimit();
		} else {
			this.node.count.innerHTML = count;
		}
	} else if (count >= 10) {
		this.node.count.innerHTML = count;
	}

	// 可见手牌显示刷新
	this.decadeUI_updateShowCards();
	return this;
}

/**
 * 使用卡牌覆写
 */
export function playerUseCard() {
	const event = basePlayerMethods.useCard.apply(this, arguments);
	playShowCardAudio();
	const finish = event.finish;
	event.finish = function () {
		if (typeof finish === "function") finish.apply(this, arguments);
		const targets = this.targets;
		if (Array.isArray(targets)) targets.forEach(target => target.classList.remove("target"));
	};
	event.pushHandler("decadeUI_LineAnimation", (event, option) => {
		if (event.step === 1 && option.state === "begin" && !event.hideTargets) {
			const targets = event.targets;
			if (Array.isArray(targets)) targets.forEach(target => target.classList.add("target"));
		}
	});
	return event;
}

/**
 * 打出卡牌覆写
 */
export function playerRespond() {
	playShowCardAudio();
	return basePlayerMethods.respond.apply(this, arguments);
}

/**
 * 失去卡牌覆写
 */
export function playerLose() {
	const next = basePlayerMethods.lose.apply(this, arguments);
	let event = _status.event;
	if (event.name === "loseAsync") event = event.getParent();
	if (event.name == "useCard" || event.name === "respond") {
		next.animate = true;
		next.blameEvent = event;
	}
	return next;
}

/**
 * 使用卡牌动画前覆写
 */
export function playerUseCardAnimateBefore(event) {
	basePlayerMethods.useCardAnimateBefore?.apply(this, arguments);
	if (event.lose_map && Object.keys(event.lose_map).some(item => item !== "noowner" && event.lose_map[item].length)) {
		event.throw = false;
	}
}

/**
 * 响应动画前覆写
 */
export function playerRespondAnimateBefore(event) {
	basePlayerMethods.respondAnimateBefore?.apply(this, arguments);
	if (event.lose_map && Object.keys(event.lose_map).some(item => item !== "noowner" && event.lose_map[item].length)) {
		event.throw = false;
	}
}

/**
 * 转换技覆写
 */
export function playerChangeZhuanhuanji(skill) {
	basePlayerMethods.$changeZhuanhuanji.apply(this, arguments);
	if (!get.is.zhuanhuanji(skill, this)) return;
	if (this.hiddenSkills.includes(skill) && this !== game.me) return;

	const mark = this.node.xSkillMarks?.querySelector(`[data-id="${skill}"]`);
	const decadeUI = window.decadeUI;
	const decadeUIPath = window.decadeUIPath;
	const url = `${lib.assetURL}extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/${skill}_yang.png`;

	function imageExists(url) {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send();
		return xhr.status !== 404;
	}

	try {
		if (mark) mark.dk = imageExists(url);
	} catch (err) {
		if (mark) mark.dk = false;
	}

	if (!mark) return;

	const style = lib.config.extension_十周年UI_newDecadeStyle;
	const yangUrl = `extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/${skill}_yang.png`;
	const yingUrl = `extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/${skill}_ying.png`;
	const defaultYangUrl = "extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/ditu_yang.png";
	const defaultYingUrl = "extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/ditu_ying.png";

	if (style != "off") {
		if (mark.classList.contains("yin")) {
			mark.classList.remove("yin");
			mark.classList.add("yang");
		} else {
			mark.classList.remove("yang");
			mark.classList.add("yin");
		}
	} else {
		if (mark.dd === true) {
			this.yingSkill(skill);
			mark.dd = false;
			mark.setBackgroundImage(mark.dk ? yangUrl : defaultYangUrl);
		} else {
			this.yangSkill(skill);
			mark.dd = true;
			mark.setBackgroundImage(mark.dk ? yingUrl : defaultYingUrl);
		}
	}
}

/**
 * 尝试技能动画覆写
 */
export function playerTrySkillAnimate(name) {
	basePlayerMethods.trySkillAnimate.apply(this, arguments);
	const that = this;

	// AI技能提示条
	if (lib.config["extension_十周年UI_enable"] && lib.config.extension_十周年UI_jindutiao == true) {
		if (that != game.me) {
			const ef = that.getElementsByClassName("tipskill");

			// 移除旧的技能提示
			if (ef[0]) ef[0].parentNode.removeChild(ef[0]);
			const tipbanlist = ["_recasting", "jiu"];

			if (!tipbanlist.includes(name) && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
				const tipskillbox = document.createElement("div");
				const tipskillimg = document.createElement("img");
				const tipskilltext = document.createElement("div");

				// 盒子样式
				tipskillbox.classList.add("tipskill");
				tipskillbox.style.cssText = "display:block;position:absolute;pointer-events:none;z-index:90;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:0px;";

				// 技能文本
				tipskilltext.innerHTML = get.skillTranslation(name, that).slice(0, 2);
				tipskilltext.style.cssText = "color:#ADC63A;text-shadow:#707852 0 0;font-size:11px;font-family:shousha;display:block;position:absolute;z-index:91;bottom:-22px;letter-spacing:1.5px;line-height:15px;left:15px;";

				// 思考中底图
				tipskillimg.src = lib.assetURL + "extension/十周年UI/ui/assets/lbtn/shoushatip/skilltip.png";
				tipskillimg.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
				tipskillbox.appendChild(tipskillimg);
				tipskillbox.appendChild(tipskilltext);
				that.appendChild(tipskillbox);

				// 自动移除提示
				setTimeout(() => {
					if (tipskillbox.parentNode) tipskillbox.parentNode.removeChild(tipskillbox);
				}, 1500);
			}
		}
	}
}

/**
 * 设置模式状态覆写
 */
export function playerSetModeState(info) {
	if (info?.seat) {
		if (!this.node.seat) {
			this.node.seat = window.decadeUI.element.create("seat", this);
		}
		this.node.seat.innerHTML = get.cnNumber(info.seat, true);
	}
	return basePlayerMethods.setModeState.apply(this, arguments);
}

/**
 * 装备变化处理覆写
 */
export function playerHandleEquipChange() {
	basePlayerMethods.$handleEquipChange.apply(this, arguments);
	const player = this;
	if (!(player == game.me && ui.equipSolts)) return;

	const sum = Array.from(player.node.equips.childNodes).filter(card => {
		return ![1, 2, 3, 4, 5].includes(get.equipNum(card));
	}).length;

	const current = Array.from(ui.equipSolts.back.children).filter(elements => {
		return elements.dataset.type == 5;
	}).length;

	let delta = sum - current;
	if (delta > 0) {
		while (delta > 0) {
			delta--;
			const ediv = window.decadeUI.element.create(null, ui.equipSolts.back);
			ediv.dataset.type = 5;
		}
	} else if (delta < 0) {
		for (let i = 0; i > sum; i--) {
			const element = Array.from(ui.equipSolts.back.children).find(elements => {
				return elements.dataset.type == 5;
			});
			if (element?.dataset.type == 5) element.remove();
		}
	}
}

/**
 * 应用player覆写
 */
export function applyPlayerOverrides() {
	if (!lib.element?.player) return;
	// 基础方法在外部设置
}

/**
 * 标记覆写
 */
export function playerMark(item, info, skill) {
	if (item && lib.config.extension_十周年UI_newDecadeStyle != "Off") {
		const info = get.info(item);
		if (info && (info.zhuanhuanji || info.zhuanhuanji2 || info.limited)) return;
	}
	if (item && typeof item === "string" && item.startsWith("xinfu_falu_")) {
		if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
			return;
		}
	}
	if (item && typeof item === "string" && item.startsWith("starcanxi_") && item !== "starcanxi_wangsheng" && item !== "starcanxi_xiangsi" && item !== "starcanxi_cancel") {
		if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
			return;
		}
	}
	if (get.itemtype(item) === "cards") {
		const marks = [];
		for (const card of item) marks.push(this.mark(card, info));
		return marks;
	}
	let mark;
	if (get.itemtype(item) === "card") {
		mark = item.copy("mark");
		mark.suit = item.suit;
		mark.number = item.number;
		if (item.classList.contains("fullborder")) {
			mark.classList.add("fakejudge");
			mark.classList.add("fakemark");
			if (!mark.node.mark) mark.node.mark = mark.querySelector(".mark-text") || decadeUI.element.create("mark-text", mark);
			mark.node.mark.innerHTML = lib.translate[name.name + "_bg"] || get.translation(name.name)[0];
		}
		item = item.name;
	} else {
		mark = ui.create.div(".card.mark");
		let markText = lib.translate[item + "_bg"];
		if (!markText || markText[0] == "+" || markText[0] == "-") {
			markText = get.translation(item).slice(0, 2);
			if (decadeUI.config.playerMarkStyle != "decade") {
				markText = markText[0];
			}
		}
		mark.text = decadeUI.element.create("mark-text", mark);
		if (lib.skill[item] && lib.skill[item].markimage) {
			markText = "　";
			mark.text.style.animation = "none";
			mark.text.setBackgroundImage(lib.skill[item].markimage);
			mark.text.style["box-shadow"] = "none";
			mark.text.style.backgroundPosition = "center";
			mark.text.style.backgroundSize = "contain";
			mark.text.style.backgroundRepeat = "no-repeat";
			mark.text.classList.add("before-hidden");
		} else if (markText.length == 2) mark.text.classList.add("small-text");
		if (lib.skill[item] && lib.skill[item].zhuanhuanji) {
			mark.text.style.animation = "none";
			mark.text.classList.add("before-hidden");
		}
		if (markText && markText.includes("☯")) {
			mark.style.setProperty("display", "none", "important");
		}
		mark.text.innerHTML = markText;
	}
	mark.name = item;
	mark.skill = skill || item;
	if (!mark.classList.contains("own-skill") && !mark.classList.contains("other-skill")) {
		const skillIntro = lib.skill[mark.skill]?.intro;
		const hasCardDisplay = typeof skillIntro?.mark === "function" || ["expansion", "card", "cards"].includes(skillIntro?.content);
		mark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
	}
	if (typeof info == "object") {
		mark.info = info;
	} else if (typeof info == "string") {
		mark.markidentifer = info;
	}
	mark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
	if (!lib.config.touchscreen) {
		if (lib.config.hover_all) {
			lib.setHover(mark, ui.click.hoverplayer);
		}
		if (lib.config.right_info) {
			mark.oncontextmenu = ui.click.rightplayer;
		}
	}
	this.node.marks.appendChild(mark);
	this.updateMarks();
	ui.updatem(this);
	return mark;
}

/**
 * 标记武将覆写
 */
export function playerMarkCharacter(name, info, learn, learn2) {
	if (typeof name == "object") name = name.name;
	const nodeMark = ui.create.div(".card.mark");
	const nodeMarkText = ui.create.div(".mark-text", nodeMark);
	if (!info) info = {};
	if (!info.name) info.name = get.translation(name);
	if (!info.content) info.content = get.skillintro(name, learn, learn2);
	if (name.startsWith("unknown")) {
		const unknownText = get.translation(name)[0];
		if (unknownText && unknownText.includes("☯")) {
			nodeMark.style.setProperty("display", "none", "important");
		}
		nodeMarkText.innerHTML = unknownText;
	} else {
		if (!get.character(name)) return console.error(name);
		const text = info.name.slice(0, 2);
		if (text.length == 2) nodeMarkText.classList.add("small-text");
		if (text && text.includes("☯")) {
			nodeMark.style.setProperty("display", "none", "important");
		}
		nodeMarkText.innerHTML = text;
	}
	nodeMark.name = name + "_charactermark";
	nodeMark.info = info;
	nodeMark.text = nodeMarkText;
	const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
	nodeMark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
	nodeMark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
	if (!lib.config.touchscreen) {
		if (lib.config.hover_all) {
			lib.setHover(nodeMark, ui.click.hoverplayer);
		}
		if (lib.config.right_info) {
			nodeMark.oncontextmenu = ui.click.rightplayer;
		}
	}
	this.node.marks.appendChild(nodeMark);
	ui.updatem(this);
	return nodeMark;
}

/**
 * 更新标记覆写
 */
export function playerUpdateMark(name, storage) {
	if (!this.marks[name]) {
		if (lib.skill[name] && lib.skill[name].intro && (this.storage[name] || lib.skill[name].intro.markcount)) {
			this.markSkill(name);
			if (!this.marks[name]) return this;
		} else {
			return this;
		}
	}
	const mark = this.marks[name];
	if (storage && this.storage[name]) this.syncStorage(name);
	if (lib.skill[name] && lib.skill[name].intro && !lib.skill[name].intro.nocount && (this.storage[name] || lib.skill[name].intro.markcount)) {
		let num = 0;
		if (typeof lib.skill[name].intro.markcount == "function") {
			num = lib.skill[name].intro.markcount(this.storage[name], this, name);
		} else if (lib.skill[name].intro.markcount == "expansion") {
			num = this.countCards("x", card => card.hasGaintag(name));
		} else if (typeof this.storage[name + "_markcount"] == "number") {
			num = this.storage[name + "_markcount"];
		} else if (name == "ghujia") {
			num = this.hujia;
		} else if (typeof this.storage[name] == "number") {
			num = this.storage[name];
		} else if (Array.isArray(this.storage[name])) {
			num = this.storage[name].length;
		}
		if (num) {
			if (!mark.markcount) mark.markcount = decadeUI.element.create("mark-count", mark);
			mark.markcount.textContent = num;
		} else if (mark.markcount) {
			mark.markcount.delete();
			mark.markcount = undefined;
		}
	} else {
		if (mark.markcount) {
			mark.markcount.delete();
			mark.markcount = undefined;
		}
		if (lib.skill[name].mark == "auto") {
			this.unmarkSkill(name);
		}
	}
	return this;
}

/**
 * 标记技能武将覆写
 */
export function playerMarkSkillCharacter(id, target, name, content) {
	if (typeof target == "object") target = target.name;
	game.broadcastAll(
		function (player, target, name, content, id) {
			if (player.marks[id]) {
				player.marks[id].name = name + "_skillmark";
				player.marks[id].info = {
					name: name,
					content: content,
					id: id,
				};
				const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
				player.marks[id].classList.remove("own-skill", "other-skill");
				player.marks[id].classList.add(hasCardDisplay ? "other-skill" : "own-skill");
				game.addVideo("changeMarkCharacter", player, {
					id: id,
					name: name,
					content: content,
					target: target,
				});
			} else {
				const nodeMark = ui.create.div(".card.mark");
				const nodeMarkText = ui.create.div(".mark-text", nodeMark);
				const skillName = get.translation(name);
				const text = skillName.slice(0, 2);
				if (text.length == 2) nodeMarkText.classList.add("small-text");
				if (text && text.includes("☯")) {
					nodeMark.style.setProperty("display", "none", "important");
				}
				nodeMarkText.innerHTML = text;
				nodeMark.name = name + "_skillmark";
				nodeMark.info = {
					name: name,
					content: content,
					id: id,
				};
				nodeMark.text = nodeMarkText;
				const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
				nodeMark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
				nodeMark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
				if (!lib.config.touchscreen) {
					if (lib.config.hover_all) {
						lib.setHover(nodeMark, ui.click.hoverplayer);
					}
					if (lib.config.right_info) {
						nodeMark.oncontextmenu = ui.click.rightplayer;
					}
				}
				player.node.marks.appendChild(nodeMark);
				player.marks[id] = nodeMark;
				game.addVideo("markCharacter", player, {
					name: name,
					content: content,
					id: id,
					target: target,
				});
			}
			player.marks[id].classList.add("skillmark");
			player.marks[id]._name = name;
			ui.updatem(player);
		},
		this,
		target,
		name,
		content,
		id
	);
	return this;
}

/**
 * 播放动态皮肤覆写
 */
export function playerPlayDynamic(animation, deputy) {
	deputy = deputy === true;
	if (animation === undefined) return console.error("playDynamic: 参数1不能为空");
	let dynamic = this.dynamic;
	if (!dynamic) {
		dynamic = new DynamicPlayer("assets/dynamic/");
		dynamic.dprAdaptive = true;
		this.dynamic = dynamic;
		this.$dynamicWrap.appendChild(dynamic.canvas);
	} else {
		if (deputy && dynamic.deputy) {
			dynamic.stop(dynamic.deputy);
			dynamic.deputy = null;
		} else if (dynamic.primary) {
			dynamic.stop(dynamic.primary);
			dynamic.primary = null;
		}
	}
	if (typeof animation == "string")
		animation = {
			name: animation,
		};
	if (this.doubleAvatar) {
		if (Array.isArray(animation.x)) {
			animation.x = [...animation.x];
			animation.x[1] += deputy ? 0.25 : -0.25;
		} else {
			if (animation.x === undefined) {
				animation.x = [0, deputy ? 0.75 : 0.25];
			} else {
				animation.x = [animation.x, deputy ? 0.25 : -0.25];
			}
		}
		animation.clip = {
			x: [0, deputy ? 0.5 : 0],
			y: 0,
			width: [0, 0.5],
			height: [0, 1],
			clipParent: true,
		};
	}
	if (this.$dynamicWrap.parentNode != this) this.appendChild(this.$dynamicWrap);
	dynamic.outcropMask = duicfg.dynamicSkinOutcrop;
	const avatar = dynamic.play(animation);
	if (deputy === true) {
		dynamic.deputy = avatar;
	} else {
		dynamic.primary = avatar;
	}
	this.classList.add(deputy ? "d-skin2" : "d-skin");
}

/**
 * 停止动态皮肤覆写
 */
export function playerStopDynamic(primary, deputy) {
	const dynamic = this.dynamic;
	if (!dynamic) return;
	primary = primary === true;
	deputy = deputy === true;
	if (primary && dynamic.primary) {
		dynamic.stop(dynamic.primary);
		dynamic.primary = null;
	} else if (deputy && dynamic.deputy) {
		dynamic.stop(dynamic.deputy);
		dynamic.deputy = null;
	} else if (!primary && !deputy) {
		dynamic.stopAll();
		dynamic.primary = null;
		dynamic.deputy = null;
	}
	if (!dynamic.primary && !dynamic.deputy) {
		this.classList.remove("d-skin");
		this.classList.remove("d-skin2");
		this.$dynamicWrap.remove();
	}
}

/**
 * 应用动态皮肤覆写
 */
export function playerApplyDynamicSkin() {
	if (typeof game.qhly_changeDynamicSkin === "function") {
		this.name1 && game.qhly_changeDynamicSkin(this, undefined, this.name1, false, true);
		this.doubleAvatar && this.name2 && game.qhly_changeDynamicSkin(this, undefined, this.name2, true, true);
		return;
	}
	if (!duicfg.dynamicSkin || _status.mode == null) return;
	decadeUI.CUR_DYNAMIC ??= 0;
	decadeUI.MAX_DYNAMIC ??= (decadeUI.isMobile() ? 2 : 10) + (window.OffscreenCanvas ? 8 : 0);
	if (!this.dynamic && decadeUI.CUR_DYNAMIC >= decadeUI.MAX_DYNAMIC) return;
	const dskins = decadeUI.dynamicSkin;
	if (!dskins) return;
	const avatars = this.doubleAvatar && this.name2 ? [this.name1, this.name2] : [this.name1];
	let increased = false;
	avatars.forEach((name, i) => {
		const skins = dskins[name];
		if (!skins) return;
		const skinKeys = Object.keys(skins);
		if (!skinKeys.length) return;
		const skin = skins[skinKeys[0]];
		if (!skin?.name) return;
		const animation = {
			name: skin.name,
			action: skin.action,
			loop: true,
			loopCount: -1,
			speed: skin.speed ?? 1,
			filpX: skin.filpX,
			filpY: skin.filpY,
			opacity: skin.opacity,
			x: skin.x,
			y: skin.y,
			scale: skin.scale,
			angle: skin.angle,
			hideSlots: skin.hideSlots,
			clipSlots: skin.clipSlots,
		};
		if (skin.player || skin._transform !== undefined) {
			animation.player = {
				...(skin.player || {}),
				...(skin._transform !== undefined && { _transform: skin._transform }),
			};
		}
		this.playDynamic(animation, i === 1);
		if (skin.background) {
			this.$dynamicWrap.style.backgroundImage = `url("${decadeUIPath}assets/dynamic/${skin.background}")`;
		} else {
			this.$dynamicWrap.style.removeProperty("background-image");
		}
		if (!increased) {
			increased = true;
			decadeUI.CUR_DYNAMIC++;
		}
	});
}

/**
 * 说话覆写
 */
export function playerSay(str) {
	str = str.replace(/##assetURL##/g, lib.assetURL);
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = str;
	const textContent = tempDiv.textContent || tempDiv.innerText || "";
	const isImageOnly = textContent.trim() === "" && tempDiv.querySelectorAll("img").length > 0;

	if (isImageOnly) {
		if (!this.$chatImage || !this.$chatImage.parentNode) {
			this.$chatImage = decadeUI.element.create("chat-image");
			this.$chatImage.style.position = "absolute";
			this.$chatImage.style.pointerEvents = "none";
			if (decadeUI.config.newDecadeStyle === "off" || decadeUI.config.newDecadeStyle === "on" || decadeUI.config.newDecadeStyle === "othersOff") {
				this.$chatImage.style.left = "50%";
				this.$chatImage.style.top = "50%";
				this.$chatImage.style.transform = "translate(-50%, -50%)";
				this.$chatImage.style.zIndex = "90";
			} else {
				this.$chatImage.style.left = "-40%";
				this.$chatImage.style.top = "-50px";
				this.$chatImage.style.transform = "translateX(-50%)";
				this.$chatImage.style.zIndex = "90";
			}
		}
		const imageContainer = this.$chatImage;
		imageContainer.innerHTML = str;
		const images = imageContainer.querySelectorAll("img");
		images.forEach(img => {
			if (!img.style.width && !img.style.height) {
				img.style.width = "100px";
				img.style.height = "auto";
				img.style.maxWidth = "100px";
			}
		});
		if (this != imageContainer.parentNode) this.appendChild(imageContainer);
		imageContainer.classList.remove("removing");
		imageContainer.style.animation = "fade-in 0.3s";
		if (imageContainer.timeout) clearTimeout(imageContainer.timeout);
		imageContainer.timeout = setTimeout(() => {
			imageContainer.timeout = undefined;
			imageContainer.delete();
			this.$chatImage = undefined;
		}, 2000);
	} else {
		if (!this.$chatBubble) {
			this.$chatBubble = decadeUI.element.create("chat-bubble");
		}
		const bubble = this.$chatBubble;
		bubble.innerHTML = str;
		if (this != bubble.parentNode) this.appendChild(bubble);
		bubble.classList.remove("removing");
		bubble.style.animation = "fade-in 0.3s";
		if (bubble.timeout) clearTimeout(bubble.timeout);
		bubble.timeout = setTimeout(() => {
			bubble.timeout = undefined;
			bubble.delete();
		}, 2000);
	}
	const name = get.translation(this.name);
	const info = [name ? `${name}[${this.nickname}]` : this.nickname, str];
	lib.chatHistory.push(info);
	if (_status.addChatEntry) {
		if (_status.addChatEntry._origin.parentNode) {
			_status.addChatEntry(info, false);
		} else {
			_status.addChatEntry = undefined;
		}
	}
	if (lib.config.background_speak && lib.quickVoice.includes(str)) {
		game.playAudio("voice", this.sex === "female" ? "female" : "male", lib.quickVoice.indexOf(str));
	}
}

/**
 * 死亡后覆写
 */
export function playerDieAfter() {
	this.stopDynamic();
	this.node.gainSkill.innerHTML = null;
	if (!this.node.dieidentity) this.node.dieidentity = ui.create.div("died-identity", this);
	this.node.dieidentity.classList.add("died-identity");
	const that = this;
	const image = new Image();
	const identity = decadeUI.getPlayerIdentity(this);
	const goon = decadeUI.config.newDecadeStyle === "on" || decadeUI.config.newDecadeStyle === "othersOff";

	let url;
	if (decadeUI.config.newDecadeStyle === "onlineUI") {
		url = `${decadeUIPath}image/styles/online/dead4_${identity}.png`;
	} else if (decadeUI.config.newDecadeStyle === "babysha") {
		url = `${decadeUIPath}image/styles/baby/dead3_${identity}.png`;
	} else if (decadeUI.config.newDecadeStyle === "codename") {
		url = `${decadeUIPath}image/styles/codename/dead_${identity}.png`;
	} else if (goon) {
		url = `${decadeUIPath}image/styles/decade/dead_${identity}.png`;
	} else {
		if (this != game.me) {
			url = `${decadeUIPath}image/styles/shousha/dead2_${identity}.png`;
		} else {
			url = `${decadeUIPath}image/styles/shousha/dead2_me.png`;
		}
	}
	image.onerror = () => {
		that.node.dieidentity.innerHTML = `${decadeUI.getPlayerIdentity(that, that.identity, true)}<br>阵亡`;
	};

	if ((that._trueMe || that) != game.me && that != game.me && lib.config.extension_十周年UI_newDecadeStyle === "off") {
		that.node.dieidentity.innerHTML = `<div style="width:21px; height:81px; left:22.5px; top:-12px; position:absolute; background-image: url(${lib.assetURL}extension/十周年UI/image/ui/misc/likai.png);background-size: 100% 100%;"></div>`;
	} else {
		that.node.dieidentity.innerHTML = "";
	}
	that.node.dieidentity.style.backgroundImage = 'url("' + url + '")';
	image.src = url;
	setTimeout(() => {
		decadeUI.animation.playSpine("effect_zhenwang", {
			parent: that,
			scale: 0.8,
		});
	}, 250);
}

/**
 * 技能特效覆写
 */
export function playerSkill(name, type, color, avatar) {
	const _this = this;
	if (typeof type != "string") type = "legend";
	game.addVideo("skill", this, [name, type, color, avatar]);
	game.broadcastAll(
		function (player, type, name, color, avatar) {
			if (window.decadeUI == void 0) {
				game.delay(2.5);
				if (name) player.$fullscreenpop(name, color, avatar);
				return;
			}
			decadeUI.delay(2500);
			if (name) decadeUI.effect.skill(player, name, avatar);
		},
		_this,
		type,
		name,
		color,
		avatar
	);
}

/**
 * 同步扩展槽位覆写
 */
export function playerSyncExpand(map) {
	if (this != game.me) return;
	if (!map) map = this.expandedSlots || {};
	game.addVideo("$syncExpand", this, get.copy(map));
	game.broadcast(
		function (player, map) {
			player.expandedSlots = map;
			player.$syncExpand(map);
		},
		this,
		map
	);
	const goon = lib.skill.expandedSlots.intro.markcount(null, game.me) > 0;
	this[goon ? "markSkill" : "unmarkSkill"]("expandedSlots");
	let ele;
	while ((ele = ui.equipSolts.back.firstChild)) {
		ele.remove();
	}
	const storage = this.expandedSlots;
	const equipSolts = ui.equipSolts;
	for (let repetition = 0; repetition < 5; repetition++) {
		if (storage && storage["equip" + (repetition + 1)]) {
			for (let adde = 0; adde < storage["equip" + (repetition + 1)]; adde++) {
				const addediv = decadeUI.element.create(null, equipSolts.back);
				addediv.dataset.type = repetition;
			}
		}
		const ediv = decadeUI.element.create(null, equipSolts.back);
		ediv.dataset.type = repetition;
	}
}

/**
 * 添加前缀分隔符覆写
 */
export function playerAddPrefixSeparator(nameNode) {
	if (lib.config.extension_十周年UI_newDecadeStyle !== "off" || !nameNode) return;
	setTimeout(() => {
		if (!nameNode) return;
		const children = Array.from(nameNode.childNodes);
		for (let i = 0; i < children.length - 1; i++) {
			const current = children[i];
			const next = children[i + 1];
			if (current.nodeType === Node.ELEMENT_NODE && next.nodeType === Node.TEXT_NODE && next.textContent.trim() && !next.textContent.startsWith("•")) {
				next.textContent = "•" + next.textContent;
				return;
			}
		}
		if (nameNode.firstChild && nameNode.firstChild.nodeType === Node.ELEMENT_NODE && nameNode.childNodes.length > 1) {
			const separator = document.createTextNode("•");
			nameNode.insertBefore(separator, nameNode.childNodes[1]);
		}
	}, 0);
}

/**
 * 阳技能覆写
 */
export function playerYangSkill(skill) {
	const player = this;
	game.broadcastAll(
		function (player, skill) {
			player.$yangSkill(skill);
		},
		player,
		skill
	);
}

/**
 * $阳技能覆写
 */
export function player$YangSkill(skill) {
	this.yangedSkills ??= [];
	this.yangedSkills.add(skill);
	this.yingedSkills ??= [];
	this.yingedSkills.remove(skill);
}

/**
 * 阴技能覆写
 */
export function playerYingSkill(skill) {
	const player = this;
	game.broadcastAll(
		function (player, skill) {
			player.$yingSkill(skill);
		},
		player,
		skill
	);
}

/**
 * $阴技能覆写
 */
export function player$YingSkill(skill) {
	this.yingedSkills ??= [];
	this.yingedSkills.add(skill);
	this.yangedSkills ??= [];
	this.yangedSkills.remove(skill);
}

/**
 * 失败技能覆写
 */
export function playerFailSkill(skill) {
	const player = this;
	game.broadcastAll(
		function (player, skill) {
			player.$failSkill(skill);
		},
		player,
		skill
	);
}

/**
 * $失败技能覆写
 */
export function player$FailSkill(skill) {
	if (this.hiddenSkills.includes(skill) && this !== game.me) return;
	const mark = this.node.xSkillMarks.querySelector('[data-id="' + skill + '"]');
	if (mark) mark.classList.add("fail");
}

/**
 * 失效技能覆写
 */
export function playerShixiaoSkill(skill) {
	const player = this;
	game.broadcastAll(
		function (player, skill) {
			player.$shixiaoSkill(skill);
		},
		player,
		skill
	);
}

/**
 * $失效技能覆写
 */
export function player$ShixiaoSkill(skill) {
	this.shixiaoedSkills ??= [];
	this.shixiaoedSkills.add(skill);
}

/**
 * 解除失效技能覆写
 */
export function playerUnshixiaoSkill(skill) {
	const player = this;
	game.broadcastAll(
		function (player, skill) {
			player.$unshixiaoSkill(skill);
		},
		player,
		skill
	);
}

/**
 * $解除失效技能覆写
 */
export function player$UnshixiaoSkill(skill) {
	this.shixiaoedSkills ??= [];
	this.shixiaoedSkills.remove(skill);
}

/**
 * 伤害弹出覆写
 */
export function playerDamagepop(num, nature, font, nobroadcast) {
	if (typeof num == "number" || typeof num == "string") {
		game.addVideo("damagepop", this, [num, nature, font]);
		if (nobroadcast !== false) {
			game.broadcast(
				function (player, num, nature, font) {
					player.$damagepop(num, nature, font);
				},
				this,
				num,
				nature,
				font
			);
		}
		let node;
		if (this.popupNodeCache && this.popupNodeCache.length) {
			node = this.popupNodeCache.shift();
		} else {
			node = decadeUI.element.create("damage");
		}
		if (font) {
			node.classList.add("normal-font");
		} else {
			node.classList.remove("normal-font");
		}
		if (typeof num == "number") {
			node.popupNumber = num;
			num = "";
		} else {
			node.popupNumber = null;
		}
		node.innerHTML = num;
		node.dataset.text = node.textContent || node.innerText;
		node.nature = nature || "soil";
		this.damagepopups.push(node);
	}
	if (this.damagepopups.length && !this.damagepopLocked) {
		const node = this.damagepopups.shift();
		this.damagepopLocked = true;
		if (this != node.parentNode) this.appendChild(node);
		const player = this;
		if (typeof node.popupNumber == "number") {
			const popupNum = node.popupNumber;
			if (popupNum < 0) {
				if (node.nature != "water") {
					const actionPairs = {
						thunder: ["play5", "play6"],
						fire: ["play3", "play4"],
						__default: ["play1", "play2"],
					};
					const pair = actionPairs[node.nature] || actionPairs.__default;
					const action = popupNum <= -2 ? pair[1] : pair[0];
					decadeUI.animation.playSpine(
						{
							name: "effect_shoujidonghua",
							action: action,
						},
						{
							scale: 0.8,
							parent: player,
						}
					);
				}
			} else {
				if (node.nature == "wood") {
					decadeUI.animation.playSpine("effect_zhiliao", {
						scale: 0.7,
						parent: player,
					});
				}
			}
		}
		node.style.animation = "open-fade-in-out 1.2s";
		setTimeout(
			function (player, node) {
				if (!player.popupNodeCache) player.popupNodeCache = [];
				node.style.animation = "";
				player.popupNodeCache.push(node);
			},
			1210,
			player,
			node
		);
		setTimeout(
			function (player) {
				player.damagepopLocked = false;
				player.$damagepop();
			},
			500,
			player
		);
	}
}

// dui引用（延迟获取）
let dui = null;
function getDui() {
	if (!dui) dui = window.dui;
	return dui;
}

/**
 * 拼点覆写
 */
export function playerCompare(card1, target, card2) {
	const player = this;
	let cardsetions;
	if (lib.config.card_animation_info) {
		cardsetions = {};
		cardsetions[player.playerid] = get.cardsetion(player);
		cardsetions[target.playerid] = get.cardsetion(target);
	}
	game.broadcast(
		function (player, target, card1, card2, cardsetions) {
			player.$compare(card1, target, card2, cardsetions);
		},
		this,
		target,
		card1,
		card2,
		cardsetions
	);
	game.addVideo("compare", this, [get.cardInfo(card1), target.dataset.position, get.cardInfo(card2)]);
	const bounds = getDui().boundsCaches.arena;
	if (!bounds.updated) bounds.update();
	const scale = bounds.cardScale;
	const centerX = (bounds.width - bounds.cardWidth) / 2;
	const centerY = bounds.height * 0.45 - bounds.cardHeight / 2;
	const leftX = Math.round(centerX - 62);
	const rightX = Math.round(centerX + 62);
	const y = Math.round(centerY);
	const createFlipCard = (card, owner, x, delay) => {
		const node = card.copy("thrown");
		node.classList.add("infohidden");
		node.classList.remove("decade-card");
		node.style.background = "";
		node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(180deg)`;
		ui.arena.appendChild(node);
		ui.thrown.push(node);
		if (cardsetions && cardsetions[owner.playerid]) {
			const setion = ui.create.div(".cardsetion", cardsetions[owner.playerid], node);
			setion.style.setProperty("display", "block", "important");
		}
		setTimeout(() => {
			node.style.transition = "all ease-in 0.3s";
			node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(270deg) translateX(52px)`;
			node.listenTransition(() => {
				node.classList.remove("infohidden");
				if (card.classList.contains("decade-card")) {
					node.classList.add("decade-card");
					node.style.background = card.style.background;
				}
				node.style.transition = "all 0s";
				ui.refresh(node);
				node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(-90deg) translateX(52px)`;
				ui.refresh(node);
				node.style.transition = "";
				ui.refresh(node);
				node.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
			});
		}, delay);
		return node;
	};
	createFlipCard(card1, player, leftX, 300);
	setTimeout(() => {
		createFlipCard(card2, target, rightX, 200);
	}, 200);
}

/**
 * 多人拼点覆写
 */
export function playerCompareMultiple(card1, targets, cards) {
	const player = this;
	let cardsetions;
	if (lib.config.card_animation_info) {
		cardsetions = {};
		cardsetions[player.playerid] = get.cardsetion(player);
		for (let target of targets) {
			cardsetions[target.playerid] = get.cardsetion(target);
		}
	}
	game.broadcast(
		function (player, card1, targets, cards, cardsetions) {
			player.$compareMultiple(card1, targets, cards, cardsetions);
		},
		this,
		card1,
		targets,
		cards,
		cardsetions
	);
	game.addVideo("compareMultiple", this, [get.cardInfo(card1), get.targetsInfo(targets), get.cardsInfo(cards)]);
	const bounds = getDui().boundsCaches.arena;
	if (!bounds.updated) bounds.update();
	const scale = bounds.cardScale;
	const centerX = (bounds.width - bounds.cardWidth) / 2;
	const centerY = bounds.height * 0.45 - bounds.cardHeight / 2;
	const y = Math.round(centerY);
	const totalCards = targets.length + 1;
	const spacing = 124;
	const startX = Math.round(centerX - (spacing * (totalCards - 1)) / 2);
	const createFlipCard = (card, owner, x, delay) => {
		const node = card.copy("thrown");
		node.classList.add("infohidden");
		node.classList.remove("decade-card");
		node.style.background = "";
		node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(180deg)`;
		ui.arena.appendChild(node);
		ui.thrown.push(node);
		if (cardsetions && cardsetions[owner.playerid]) {
			const setion = ui.create.div(".cardsetion", cardsetions[owner.playerid], node);
			setion.style.setProperty("display", "block", "important");
		}
		setTimeout(() => {
			node.style.transition = "all ease-in 0.3s";
			node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(270deg) translateX(52px)`;
			node.listenTransition(() => {
				node.classList.remove("infohidden");
				if (card.classList.contains("decade-card")) {
					node.classList.add("decade-card");
					node.style.background = card.style.background;
				}
				node.style.transition = "all 0s";
				ui.refresh(node);
				node.style.transform = `translate(${x}px, ${y}px) scale(${scale}) perspective(600px) rotateY(-90deg) translateX(52px)`;
				ui.refresh(node);
				node.style.transition = "";
				ui.refresh(node);
				node.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
			});
		}, delay);
		return node;
	};
	createFlipCard(card1, player, startX, 300);
	for (let i = 0; i < targets.length; i++) {
		(index => {
			setTimeout(
				() => {
					createFlipCard(cards[index], targets[index], startX + spacing * (index + 1), 200);
				},
				200 * (index + 1)
			);
		})(i);
	}
}

/**
 * 检查并添加体验后缀覆写
 */
export function playerCheckAndAddExperienceSuffix(characterName) {
	const name = characterName;
	const nameinfo = get.character(name);
	if (!nameinfo) return;
	let src = null;
	let extimage = null;
	let dbimage = null;
	let modeimage = null;
	let gzbool = false;
	let imgPrefixUrl = null;
	let realName = name;
	const mode = get.mode();
	const player = this;
	const addExperienceSuffix = () => {
		if (player.node?.name) {
			const currentName = player.node.name.innerHTML;
			if (!currentName.includes("•体验")) player.node.name.innerHTML = currentName + "•体验";
		}
	};
	if (lib.characterPack[`mode_${mode}`] && lib.characterPack[`mode_${mode}`][realName]) {
		if (mode === "guozhan") {
			if (realName.startsWith("gz_shibing")) {
				realName = realName.slice(3, 11);
			} else {
				if (lib.config.mode_config.guozhan?.guozhanSkin && nameinfo && nameinfo.hasSkinInGuozhan) gzbool = true;
				realName = realName.slice(3);
			}
		} else {
			modeimage = mode;
		}
	} else if (realName.includes("::")) {
		const arr = realName.split("::");
		modeimage = arr[0];
		realName = arr[1];
	}
	if (!modeimage && nameinfo) {
		if (nameinfo.img) {
			imgPrefixUrl = nameinfo.img;
		} else if (nameinfo.trashBin) {
			for (const value of nameinfo.trashBin) {
				if (typeof value !== "string") continue;
				const colonIndex = value.indexOf(":");
				if (colonIndex <= 0) continue;
				const prefix = value.slice(0, colonIndex);
				const payload = value.slice(colonIndex + 1);
				const handle = {
					img: () => (imgPrefixUrl = payload),
					ext: () => (extimage = value),
					db: () => (dbimage = value),
					mode: () => (modeimage = payload),
					character: () => (realName = payload),
				}[prefix];
				if (handle) handle();
				if (imgPrefixUrl || extimage || dbimage || modeimage || realName !== name) break;
			}
		}
	}
	if (imgPrefixUrl) {
		src = imgPrefixUrl;
	} else if (extimage) {
		src = extimage.replace(/^ext:/, "extension/");
	} else if (dbimage) {
		game.getDB("image", dbimage.slice(3))
			.then(() => {
				return;
			})
			.catch(() => {
				addExperienceSuffix();
			});
		return;
	} else if (modeimage) {
		src = `image/mode/${modeimage}/character/${realName}.jpg`;
	} else if (lib.config.skin[realName] && arguments[2] !== "noskin") {
		src = `image/skin/${realName}/${lib.config.skin[realName]}.jpg`;
	} else {
		src = `image/character/${gzbool ? "gz_" : ""}${realName}.jpg`;
	}

	const testImg = new Image();
	testImg.onerror = () => {
		addExperienceSuffix();
	};
	testImg.src = URL.canParse(src) ? src : lib.assetURL + src;
}

/**
 * CSS动画队列覆写
 */
export function playerQueueCssAnimation(animation) {
	const current = this.style.animation;
	let animations = this._cssanimations;
	if (animations === undefined) {
		animations = [];
		this._cssanimations = animations;
		this.addEventListener("animationend", function (e) {
			if (this.style.animationName !== e.animationName) return;
			const current = this.style.animation;
			const animations = this._cssanimations;
			while (animations.length) {
				this.style.animation = animations.shift();
				if (this.style.animation !== current) return;
				animations.current = this.style.animation;
			}
			animations.current = "";
			this.style.animation = "";
		});
	}
	if (animations.current || animations.length) {
		animations.push(animation);
		return;
	}
	animations.current = animation;
	this.style.animation = animation;
}

/**
 * 伤害覆写
 */
export function playerDamage(source) {
	if (get.itemtype(source) == "player") {
		game.addVideo("damage", this, source.dataset.position);
	} else {
		game.addVideo("damage", this);
	}
	game.broadcast(
		function (player, source) {
			player.$damage(source);
		},
		this,
		source
	);
	this.queueCssAnimation("player-hurt 0.3s");
}

/**
 * 更新显示手牌覆写
 */
export function playerUpdateShowCards() {
	const player = this;
	if (!player.node.showCards) return;
	if (player == game.me || player.isDead()) {
		player.node.showCards.hide();
		while (player.node.showCards.hasChildNodes()) player.node.showCards.removeChild(player.node.showCards.firstChild);
		return;
	}
	const cards = player.getCards("h", c => get.is.shownCard(c) || (typeof game.me !== "undefined" && player.isUnderControl(true)) || (game.me && game.me.hasSkillTag("viewHandcard", null, player, true)));
	if (!cards.length) {
		player.node.showCards.hide();
		return;
	}
	player.node.showCards.show();
	while (player.node.showCards.hasChildNodes()) player.node.showCards.removeChild(player.node.showCards.firstChild);
	function createElement(tag, opts = {}) {
		const d = document.createElement(tag);
		for (const key in opts) {
			if (!Object.hasOwnProperty.call(opts, key)) continue;
			const setterMap = {
				class: v => v.forEach(x => d.classList.add(x)),
				id: v => (d.id = v),
				parentNode: v => v.appendChild(d),
				listen: v => {
					for (const evt in v) {
						if (typeof v[evt] == "function") d[evt] = v[evt];
					}
				},
				style: v => {
					for (const s in v) d.style[s] = v[s];
				},
				children: v => v.forEach(x => d.appendChild(x)),
				insertBefore: v => v[0].insertBefore(d, v[1]),
			};
			if (key == "innerHTML" || key == "innerText") {
				d[key] = opts[key];
			} else if (setterMap[key]) {
				setterMap[key](opts[key]);
			}
		}
		return d;
	}
	for (let i = 0; i < 5; i++) {
		createElement("div", {
			class: ["handcard"],
			innerHTML: i < cards.length ? lib.translate[cards[i].name].slice(0, 2) : "",
			parentNode: player.node.showCards,
		});
	}
}

/**
 * 检查边界缓存覆写
 */
export function playerCheckBoundsCache(forceUpdate) {
	let update;
	const refer = getDui().boundsCaches.arena;
	refer.check();
	if (this.cacheReferW != refer.width || this.cacheReferH != refer.height || this.cachePosition != this.dataset.position) update = true;
	this.cacheReferW = refer.width;
	this.cacheReferH = refer.height;
	this.cachePosition = this.dataset.position;
	if (this.cacheLeft === null) update = true;
	if (update || forceUpdate) {
		this.cacheLeft = this.offsetLeft;
		this.cacheTop = this.offsetTop;
		this.cacheWidth = this.offsetWidth;
		this.cacheHeight = this.offsetHeight;
	}
}

/**
 * 连线覆写
 */
export function playerLine(target, config) {
	if (get.itemtype(target) == "players") {
		for (let i = 0; i < target.length; i++) {
			this.line(target[i], config);
		}
	} else if (get.itemtype(target) == "player") {
		if (target == this) return;
		const player = this;
		game.broadcast(
			(player, target, config) => {
				player.line(target, config);
			},
			player,
			target,
			config
		);
		game.addVideo("line", player, [target.dataset.position, config]);
		player.checkBoundsCache(true);
		target.checkBoundsCache(true);
		let x1, y1;
		let x2, y2;
		const hand = getDui().boundsCaches.hand;
		if (player == game.me) {
			hand.check();
			x1 = ui.arena.offsetWidth / 2;
			y1 = hand.y;
		} else {
			x1 = player.cacheLeft + player.cacheWidth / 2;
			y1 = player.cacheTop + player.cacheHeight / 2;
		}
		if (target == game.me) {
			hand.check();
			x2 = ui.arena.offsetWidth / 2;
			y2 = hand.y;
		} else {
			x2 = target.cacheLeft + target.cacheWidth / 2;
			y2 = target.cacheTop + target.cacheHeight / 2;
		}
		game.linexy([x1, y1, x2, y2], config, true);
	}
}

/**
 * 直接获得卡牌覆写
 */
export function playerDirectgain(cards, broadcast, gaintag) {
	if (!cards || !cards.length) return;
	const player = this;
	const handcards = player.node.handcards1;
	const fragment = document.createDocumentFragment();
	if (_status.event.name == "gameDraw") {
		player.$draw(cards.length);
	}
	for (let i = 0; i < cards.length; i++) {
		const card = cards[i];
		card.fix();
		if (card.parentNode == handcards) {
			cards.splice(i--, 1);
			continue;
		}
		if (gaintag) card.addGaintag(gaintag);
		fragment.appendChild(card);
	}
	if (player == game.me) {
		getDui().layoutHandDraws(cards);
		getDui().queueNextFrameTick(getDui().layoutHand, getDui());
	}
	const s = player.getCards("s");
	if (s.length) handcards.insertBefore(fragment, s[0]);
	else handcards.appendChild(fragment);
	if (!_status.video) {
		game.addVideo("directgain", this, get.cardsInfo(cards));
		this.update();
	}
	if (broadcast !== false) {
		game.broadcast(
			(player, cards) => {
				player.directgain(cards);
			},
			this,
			cards
		);
	}
	return this;
}

/**
 * 阶段判定覆写
 */
export function playerPhaseJudge(card) {
	game.addVideo("phaseJudge", this, get.cardInfo(card));
	if (card[card.cardSymbol]?.cards?.length) {
		const cards = card[card.cardSymbol].cards;
		this.$throw(cards);
	} else {
		const VCard = game.createCard(card.name, "虚拟", "");
		this.$throw(VCard);
	}
	getDui().delay(451);
}

/**
 * 获得卡牌2覆写
 */
export function playerGain2(cards, log) {
	let type = get.itemtype(cards);
	if (type != "cards") {
		if (type != "card") return;
		type = "cards";
		cards = [cards];
	}
	if (log === true) game.log(this, "获得了", cards);
	game.broadcast(
		function (player, cards) {
			player.$gain2(cards);
		},
		this,
		cards
	);
	const gains = [];
	const draws = [];
	let card;
	let clone;
	const player = this;
	for (let i = 0; i < cards.length; i++) {
		clone = cards[i].clone;
		card = cards[i].copy("thrown", "gainingcard");
		card.fixed = true;
		// 非主玩家获得牌根据等阶应用边框和卡背
		if (player !== game.me) {
			applyCardBorder(card, player);
		}
		if (clone && clone.parentNode == ui.arena) {
			card.scaled = true;
			card.style.transform = clone.style.transform;
			gains.push(card);
		} else {
			draws.push(card);
		}
	}
	if (gains.length) game.addVideo("gain2", this, get.cardsInfo(gains));
	if (draws.length) game.addVideo("drawCard", this, get.cardsInfo(draws));
	if (cards.duiMod && this == game.me) return;
	cards = gains.concat(draws);
	getDui().layoutDrawCards(draws, this, true);
	const fragment = document.createDocumentFragment();
	for (let i = 0; i < cards.length; i++) fragment.appendChild(cards[i]);
	ui.arena.appendChild(fragment);
	getDui().queueNextFrameTick(function () {
		getDui().layoutDrawCards(cards, player);
		getDui().delayRemoveCards(cards, 460, 220);
	});
}

// base引用（延迟获取）
let basePlayerDraw = null;
export function setBasePlayerDraw(fn) {
	basePlayerDraw = fn;
}

/**
 * 摸牌动画覆写
 */
export function playerDraw(num, init, config) {
	if (game.chess) return basePlayerDraw.call(this, num, init, config);
	if (init !== false && init !== "nobroadcast") {
		game.broadcast(
			function (player, num, init, config) {
				player.$draw(num, init, config);
			},
			this,
			num,
			init,
			config
		);
	}
	let cards;
	let isDrawCard;
	if (get.itemtype(num) == "cards") {
		cards = num.concat();
		isDrawCard = true;
	} else if (get.itemtype(num) == "card") {
		cards = [num];
		isDrawCard = true;
	} else if (typeof num == "number") {
		cards = new Array(num);
	} else {
		cards = new Array(1);
	}
	if (init !== false) {
		if (isDrawCard) {
			game.addVideo("drawCard", this, get.cardsInfo(cards));
		} else {
			game.addVideo("draw", this, num);
		}
	}
	if (_status.event && _status.event.name) {
		if (
			(function (event) {
				return event.name != "gain" && !event.name.includes("raw");
			})(_status.event)
		)
			isDrawCard = true;
	}
	if (game.me == this && !isDrawCard) return;
	const fragment = document.createDocumentFragment();
	let card;
	const _dui = getDui();
	const player = this;
	for (let i = 0; i < cards.length; i++) {
		card = cards[i];
		if (card == null) card = _dui.element.create("card thrown drawingcard");
		else card = card.copy("thrown", "drawingcard", false);
		card.fixed = true;
		// 非主玩家摸牌根据等阶应用边框和卡背
		if (player !== game.me) {
			applyCardBorder(card, player);
		}
		cards[i] = card;
		fragment.appendChild(card);
	}
	_dui.layoutDrawCards(cards, player, true);
	ui.arena.appendChild(fragment);
	_dui.queueNextFrameTick(function () {
		_dui.layoutDrawCards(cards, player);
		_dui.delayRemoveCards(cards, 460, 220);
	});
}

/**
 * 给牌动画覆写
 */
export function playerGive(cards, target, log, record) {
	let itemtype;
	const duiMod = cards.duiMod && game.me == target;
	if (typeof cards == "number") {
		itemtype = "number";
		cards = new Array(cards);
	} else {
		itemtype = get.itemtype(cards);
		if (itemtype == "cards") {
			cards = cards.concat();
		} else if (itemtype == "card") {
			cards = [cards];
		} else {
			return;
		}
	}
	if (record !== false) {
		let cards2 = cards;
		if (itemtype == "number") {
			cards2 = cards.length;
			game.addVideo("give", this, [cards2, target.dataset.position]);
		} else {
			game.addVideo("giveCard", this, [get.cardsInfo(cards2), target.dataset.position]);
		}
		game.broadcast(
			function (source, cards2, target, record) {
				source.$give(cards2, target, false, record);
			},
			this,
			cards2,
			target,
			record
		);
	}
	if (log != false) {
		if (itemtype == "number") game.log(target, "从", this, "获得了" + get.cnNumber(cards.length) + "张牌");
		else game.log(target, "从", this, "获得了", cards);
	}
	if (this.$givemod) {
		this.$givemod(cards, target);
		return;
	}
	if (duiMod) return;
	let card;
	const _dui = getDui();
	const hand = _dui.boundsCaches.hand;
	hand.check();
	const draws = [];
	const player = this;
	const fragment = document.createDocumentFragment();
	for (let i = 0; i < cards.length; i++) {
		card = cards[i];
		if (card) {
			const cp = card.copy("card", "thrown", "gainingcard", false);
			let hs = player == game.me;
			if (hs) {
				if (card.throwWith) {
					hs = card.throwWith == "h" || card.throwWith == "s";
				} else {
					hs = card.parentNode == player.node.handcards1;
				}
			}
			if (hs) {
				cp.tx = Math.round(hand.x + card.tx);
				cp.ty = Math.round(hand.y + 30 + card.ty);
				cp.scaled = true;
				cp.style.transform = "translate(" + cp.tx + "px," + cp.ty + "px) scale(" + hand.cardScale + ")";
			} else {
				draws.push(cp);
			}
			card = cp;
		} else {
			card = _dui.element.create("card thrown gainingcard");
			draws.push(card);
		}
		cards[i] = card;
		cards[i].fixed = true;
		fragment.appendChild(cards[i]);
	}
	if (draws.length) _dui.layoutDrawCards(draws, player);
	ui.arena.appendChild(fragment);
	_dui.queueNextFrameTick(function () {
		_dui.layoutDrawCards(cards, target);
		_dui.delayRemoveCards(cards, 460, 220);
	});
}

/**
 * 弃牌动画覆写
 */
export function playerThrow(cards, time, record, nosource) {
	let itemtype;
	const duiMod = cards.duiMod && game.me == this && !nosource;
	if (typeof cards == "number") {
		itemtype = "number";
		cards = new Array(cards);
	} else {
		itemtype = get.itemtype(cards);
		if (itemtype == "cards") {
			cards = cards.concat();
		} else if (itemtype == "card") {
			cards = [cards];
		} else {
			const evt = _status.event;
			if (evt && evt.card && evt.cards === cards) {
				const card = ui.create.card().init([evt.card.suit, evt.card.number, evt.card.name, evt.card.nature]);
				if (evt.card.suit == "none") card.node.suitnum.style.display = "none";
				card.dataset.virtual = 1;
				cards = [card];
			}
		}
	}
	let card;
	let clone;
	const player = this;
	const _dui = getDui();
	const hand = _dui.boundsCaches.hand;
	hand.check();
	for (let i = 0; i < cards.length; i++) {
		card = cards[i];
		if (card) {
			clone = card.copy("thrown");
			if (duiMod && (card.throwWith == "h" || card.throwWith == "s")) {
				clone.tx = Math.round(hand.x + card.tx);
				clone.ty = Math.round(hand.y + 30 + card.ty);
				clone.scaled = true;
				clone.throwordered = true;
				clone.style.transform = "translate(" + clone.tx + "px," + clone.ty + "px) scale(" + hand.cardScale + ")";
			}
			card = clone;
		} else {
			card = _dui.element.create("card infohidden infoflip");
			card.moveTo = lib.element.card.moveTo;
			card.moveDelete = lib.element.card.moveDelete;
		}
		cards[i] = card;
	}
	if (record !== false) {
		if (record !== "nobroadcast") {
			game.broadcast(
				function (player, cards, time, record, nosource) {
					player.$throw(cards, time, record, nosource);
				},
				this,
				cards,
				0,
				record,
				nosource
			);
		}
		game.addVideo("throw", this, [get.cardsInfo(cards), 0, nosource]);
	}
	cards.sort((a, b) => {
		if (a.tx === undefined && b.tx === undefined) return 0;
		if (a.tx === undefined) return duicfg.rightLayout ? -1 : 1;
		if (b.tx === undefined) return duicfg.rightLayout ? 1 : -1;
		return a.tx - b.tx;
	});
	for (let i = 0; i < cards.length; i++) {
		(card => {
			player.$throwordered2(card, nosource);
		})(cards[i]);
	}
	if (game.chess) this.chessFocus();
	return cards[cards.length - 1];
}

/**
 * 弃牌动画2覆写
 */
export function playerThrowordered2(card, nosource) {
	if (_status.connectMode) ui.todiscard = [];
	const _dui = getDui();
	if (card.throwordered === undefined) {
		let x, y;
		const bounds = _dui.boundsCaches.arena;
		if (!bounds.updated) bounds.update();
		this.checkBoundsCache();
		if (nosource) {
			x = (bounds.width - bounds.cardWidth) / 2 - bounds.width * 0.08;
			y = (bounds.height - bounds.cardHeight) / 2;
		} else {
			x = (this.cacheWidth - bounds.cardWidth) / 2 + this.cacheLeft;
			y = (this.cacheHeight - bounds.cardHeight) / 2 + this.cacheTop;
		}
		x = Math.round(x);
		y = Math.round(y);
		card.tx = x;
		card.ty = y;
		card.scaled = true;
		card.classList.add("thrown");
		card.style.transform = "translate(" + x + "px, " + y + "px)" + "scale(" + bounds.cardScale + ")";
	} else {
		card.throwordered = undefined;
	}
	if (card.fixed) return ui.arena.appendChild(card);
	let tagNode = card.querySelector(".used-info");
	if (tagNode == null) tagNode = card.appendChild(_dui.element.create("used-info"));
	card.$usedtag = tagNode;
	// 出牌应用边框（主玩家用配置边框，其他玩家用等阶边框）
	applyCardBorder(card, this, this === game.me);
	ui.thrown.push(card);
	ui.arena.appendChild(card);
	_dui.tryAddPlayerCardUseTag(card, this, _status.event);
	_dui.queueNextFrameTick(_dui.layoutDiscard, _dui);
	return card;
}

/**
 * 添加虚拟判定覆写
 */
export function playerAddVirtualJudge(VCard, cards) {
	if (game.online) return;
	const player = this,
		card = VCard;
	const isViewAsCard = cards.length !== 1 || cards[0].name !== VCard.name || !card.isCard;
	let cardx;
	if (get.itemtype(card) == "card" && card.isViewAsCard) {
		cardx = card;
	} else cardx = isViewAsCard ? game.createCard(card.name, cards.length == 1 ? get.suit(cards[0]) : "none", cards.length == 1 ? get.number(cards[0]) : 0) : cards[0];
	game.broadcastAll(
		(player, cardx, isViewAsCard, VCard, cards) => {
			cardx.fix();
			if (!cardx.isViewAsCard) {
				const cardSymbol = Symbol("card");
				cardx.cardSymbol = cardSymbol;
				cardx[cardSymbol] = VCard;
			}
			cardx.style.transform = "";
			cardx.classList.remove("drawinghidden");
			delete cardx._transform;
			if (isViewAsCard && !cardx.isViewAsCard) {
				cardx.isViewAsCard = true;
				cardx.destroyLog = false;
				for (let i of cards) {
					i.goto(ui.special);
					i.destiny = player.node.judges;
				}
				if (cardx.destroyed) cardx._destroyed_Virtua = cardx.destroyed;
				cardx.destroyed = function (card, id, player, event) {
					if (card._destroyed_Virtua) {
						if (typeof card._destroyed_Virtua == "function") {
							let bool = card._destroyed_Virtua(card, id, player, event);
							if (bool === true) return true;
						} else if (lib.skill[card._destroyed_Virtua]) {
							if (player) {
								if (player.hasSkill(card._destroyed_Virtua)) {
									delete card._destroyed_Virtua;
									return false;
								}
							}
							return true;
						} else if (typeof card._destroyed_Virtua == "string") {
							return card._destroyed_Virtua == id;
						} else if (card._destroyed_Virtua === true) return true;
					}
					if (id == "ordering" && ["phaseJudge", "executeDelayCardEffect"].includes(event.getParent().name)) return false;
					if (id != "judge") {
						return true;
					}
				};
			}
			cardx.classList.add("drawinghidden");
			if (isViewAsCard) {
				cardx.cards = cards || [];
				cardx.viewAs = VCard.name;
				const bgMark = lib.translate[cardx.viewAs + "_bg"] || get.translation(cardx.viewAs)[0];
				if (cardx.classList.contains("fullskin") || cardx.classList.contains("fullborder")) {
					if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = bgMark;
					else cardx.node.background.innerHTML = bgMark;
				}
				cardx.classList.add("fakejudge");
			} else {
				delete cardx.viewAs;
				cardx.classList.remove("fakejudge");
				if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name)[0];
			}
			player.node.judges.insertBefore(cardx, player.node.judges.firstChild);
			// 判定标记美化
			let map = ["bingliang", "lebu", "shandian", "fulei", "hongshui", "huoshan", "caomu", "jlsgqs_shuiyanqijun", "jydiy_zouhuorumo", "jydiy_yungongliaoshang", "xwjh_biguanqingxiu", "xwjh_wushisanke", "xumou_jsrg", "dczixi_bingliang", "dczixi_lebu", "dczixi_shandian"];
			if (map.includes(cardx.name)) {
				let imageName = cardx.name;
				const judgeText = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name) || "";
				cardx.node.judgeMark.node.judge.innerText = "";
				cardx.node.judgeMark.node.judge.style.fontSize = "";
				const ext = (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") && ["bingliang", "lebu", "shandian"].includes(imageName) ? "1.png" : ".png";
				const basePath = `${lib.assetURL}extension/十周年UI/image/ui/judge-mark/`;
				const tryImg = new Image();
				tryImg.onload = function () {
					cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${tryImg.src}")`;
					cardx.node.judgeMark.node.judge.innerText = "";
					cardx.node.judgeMark.node.judge.style.fontSize = "0px";
				};
				tryImg.onerror = function () {
					cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${basePath}tongyong.png")`;
					cardx.node.judgeMark.node.judge.innerText = judgeText ? judgeText[0] : "";
				};
				tryImg.src = `${basePath}${imageName}${ext}`;
				cardx.node.judgeMark.node.judge.style.zIndex = "99";
				cardx.node.judgeMark.node.judge.parentElement.children[0].style.background = "none";
				cardx.node.judgeMark.node.judge.parentElement.children[0].style.display = "none";
			} else {
				cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${lib.assetURL}extension/十周年UI/image/ui/judge-mark/tongyong.png")`;
			}
			ui.updatej(player);
		},
		player,
		cardx,
		isViewAsCard,
		VCard,
		cards
	);
}
