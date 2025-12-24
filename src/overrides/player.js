/**
 * Player 覆写模块
 * @description 玩家相关的覆写方法
 */

import { lib, game, ui, get, _status } from "noname";

// 基础方法引用
let basePlayerMethods = null;

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
function shouldSkipMark(item) {
	const style = lib.config.extension_十周年UI_newDecadeStyle;
	if (item && style != "Off") {
		const info = get.info(item);
		if (info && (info.zhuanhuanji || info.zhuanhuanji2 || info.limited)) return true;
	}
	if (item && typeof item === "string") {
		if (item.startsWith("xinfu_falu_")) {
			if (style === "on" || style === "othersOff") return true;
		}
		if (item.startsWith("starcanxi_") && item !== "starcanxi_wangsheng" && item !== "starcanxi_xiangsi" && item !== "starcanxi_cancel") {
			if (style === "on" || style === "othersOff") return true;
		}
	}
	return false;
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
	const url = `${lib.assetURL}extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${skill}_yang.png`;

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
	const yangUrl = `extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${skill}_yang.png`;
	const yingUrl = `extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${skill}_ying.png`;
	const defaultYangUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_yang.png";
	const defaultYingUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_ying.png";

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
			const cd = that.getElementsByClassName("tipshow");
			const ef = that.getElementsByClassName("tipskill");

			// 初始化
			if (cd[0]) cd[0].parentNode.removeChild(cd[0]);
			if (ef[0]) ef[0].parentNode.removeChild(ef[0]);
			const tipbanlist = ["_recasting", "jiu"];

			if (!tipbanlist.includes(name) && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
				const tipskillbox = document.createElement("div");
				const tipshow = document.createElement("img");
				const tipskilltext = document.createElement("div");

				// 盒子样式
				tipskillbox.classList.add("tipskill");
				tipskillbox.style.cssText = "display:block;position:absolute;pointer-events:none;z-index:90;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:0px;";

				// 技能文本
				tipskilltext.innerHTML = get.skillTranslation(name, that).slice(0, 2);
				tipskilltext.style.cssText = "color:#ADC63A;text-shadow:#707852 0 0;font-size:11px;font-family:shousha;display:block;position:absolute;z-index:91;bottom:-22px;letter-spacing:1.5px;line-height:15px;left:15px;";

				// 思考中底图
				tipshow.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/skilltip.png";
				tipshow.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
				tipskillbox.appendChild(tipshow);
				tipskillbox.appendChild(tipskilltext);
				that.appendChild(tipskillbox);
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
