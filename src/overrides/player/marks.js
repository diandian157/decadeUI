/**
 * @fileoverview Player标记系统覆写模块
 * @description 处理玩家标记（mark）相关的覆写，包括技能标记、武将标记等
 * @module overrides/player/marks
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { getBasePlayerMethods } from "./base.js";

/**
 * 跳过标记的技能前缀列表
 * @constant {string[]}
 */
const SKIP_PREFIXES = ["xinfu_falu_", "starcanxi_"];

/**
 * 跳过标记的例外技能集合
 * @constant {Set<string>}
 */
const SKIP_EXCEPTIONS = new Set(["starcanxi_wangsheng", "starcanxi_xiangsi", "starcanxi_cancel"]);

/**
 * 检查是否应该跳过标记
 * @param {*} item - 要检查的项目
 * @returns {boolean} 是否跳过
 * @private
 */
function shouldSkipMark(item) {
	if (!item) return false;

	const style = window.decadeUI?.config?.newDecadeStyle ?? lib.config.extension_十周年UI_newDecadeStyle;

	if (style === "Off") return false;

	// 检查转换技和限定技
	const info = get.info(item);
	if (info?.zhuanhuanji || info?.zhuanhuanji2 || info?.limited) {
		return true;
	}

	if (typeof item !== "string") return false;
	if (style !== "on" && style !== "othersOff") return false;

	// 检查前缀
	return SKIP_PREFIXES.some(p => item.startsWith(p)) && !SKIP_EXCEPTIONS.has(item);
}

/**
 * 标记技能覆写
 * @description 根据UI样式过滤部分标记的显示
 * @param {string} name - 技能名
 * @param {*} [info] - 信息
 * @param {*} [card] - 卡牌
 * @param {boolean} [nobroadcast] - 是否不广播
 * @returns {*} 原方法返回值
 * @this {Object} 玩家对象
 */
export function playerMarkSkill(name, info, card, nobroadcast) {
	if (shouldSkipMark(name)) return;
	const base = getBasePlayerMethods();
	return base.markSkill.apply(this, [name, info, card, nobroadcast]);
}

/**
 * 取消标记技能覆写
 * @description 根据UI样式过滤部分标记的取消
 * @param {string} name - 技能名
 * @param {*} [info] - 信息
 * @param {*} [card] - 卡牌
 * @param {boolean} [nobroadcast] - 是否不广播
 * @returns {*} 原方法返回值
 * @this {Object} 玩家对象
 */
export function playerUnmarkSkill(name, info, card, nobroadcast) {
	if (shouldSkipMark(name)) return;
	const base = getBasePlayerMethods();
	return base.unmarkSkill.apply(this, [name, info, card, nobroadcast]);
}

/**
 * 标记覆写
 * @description 创建并显示玩家标记，支持卡牌和技能标记
 * @param {*} item - 标记项（技能名、卡牌或卡牌数组）
 * @param {Object|string} [info] - 标记信息或标识符
 * @param {string} [skill] - 关联技能名
 * @returns {HTMLElement|HTMLElement[]} 标记元素或元素数组
 * @this {Object} 玩家对象
 */
export function playerMark(item, info, skill) {
	const style = lib.config.extension_十周年UI_newDecadeStyle;

	if (item && style !== "Off") {
		const itemInfo = get.info(item);
		if (itemInfo && (itemInfo.zhuanhuanji || itemInfo.zhuanhuanji2 || itemInfo.limited)) {
			return;
		}
	}

	if (item && typeof item === "string") {
		if (item.startsWith("xinfu_falu_") && (style === "on" || style === "othersOff")) {
			return;
		}
		if (item.startsWith("starcanxi_") && !SKIP_EXCEPTIONS.has(item)) {
			if (style === "on" || style === "othersOff") {
				return;
			}
		}
	}

	if (get.itemtype(item) === "cards") {
		return item.map(card => this.mark(card, info));
	}

	const mark = createMarkElement(item, skill);

	if (typeof info === "object") {
		mark.info = info;
	} else if (typeof info === "string") {
		mark.markidentifer = info;
	}

	bindMarkEvents(mark);

	this.node.marks.appendChild(mark);
	this.updateMarks();
	ui.updatem(this);

	return mark;
}

/**
 * 创建标记元素
 * @param {*} item - 标记项
 * @param {string} [skill] - 关联技能名
 * @returns {HTMLElement} 标记元素
 * @private
 */
function createMarkElement(item, skill) {
	let mark;
	let itemName = item;

	if (get.itemtype(item) === "card") {
		mark = item.copy("mark");
		mark.suit = item.suit;
		mark.number = item.number;

		if (item.classList.contains("fullborder")) {
			mark.classList.add("fakejudge", "fakemark");
			if (!mark.node.mark) {
				mark.node.mark = mark.querySelector(".mark-text") || window.decadeUI.element.create("mark-text", mark);
			}
			mark.node.mark.innerHTML = lib.translate[item.name + "_bg"] || get.translation(item.name)[0];
		}
		itemName = item.name;
	} else {
		mark = ui.create.div(".card.mark");
		const markStyle = window.decadeUI?.config?.playerMarkStyle;

		let markText = lib.translate[item + "_bg"];
		if (!markText || markText[0] === "+" || markText[0] === "-") {
			markText = get.translation(item).slice(0, 2);
			if (markStyle !== "decade") {
				markText = markText[0];
			}
		}

		mark.text = window.decadeUI.element.create("mark-text", mark);

		if (lib.skill[item]?.markimage) {
			markText = "　";
			Object.assign(mark.text.style, {
				animation: "none",
				boxShadow: "none",
				backgroundPosition: "center",
				backgroundSize: "contain",
				backgroundRepeat: "no-repeat",
			});
			mark.text.setBackgroundImage(lib.skill[item].markimage);
			mark.text.classList.add("before-hidden");
		} else if (markText.length === 2) {
			mark.text.classList.add("small-text");
		}

		if (lib.skill[item]?.zhuanhuanji) {
			mark.text.style.animation = "none";
			mark.text.classList.add("before-hidden");
		}

		// 隐藏包含☯的标记
		if (markText?.includes("☯")) {
			mark.style.setProperty("display", "none", "important");
		}

		mark.text.innerHTML = markText;
	}

	mark.name = itemName;
	mark.skill = skill || itemName;

	// 设置标记类型
	if (!mark.classList.contains("own-skill") && !mark.classList.contains("other-skill")) {
		const skillIntro = lib.skill[mark.skill]?.intro;
		const hasCardDisplay = typeof skillIntro?.mark === "function" || ["expansion", "card", "cards"].includes(skillIntro?.content);
		mark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
	}

	return mark;
}

/**
 * 绑定标记事件
 * @param {HTMLElement} mark - 标记元素
 * @returns {void}
 * @private
 */
function bindMarkEvents(mark) {
	mark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);

	if (!lib.config.touchscreen) {
		if (lib.config.hover_all) {
			lib.setHover(mark, ui.click.hoverplayer);
		}
		if (lib.config.right_info) {
			mark.oncontextmenu = ui.click.rightplayer;
		}
	}
}

/**
 * 标记武将覆写
 * @description 创建武将标记元素
 * @param {string|Object} name - 武将名或武将对象
 * @param {Object} [info] - 标记信息
 * @param {*} [learn] - 学习参数
 * @param {*} [learn2] - 学习参数2
 * @returns {HTMLElement} 标记元素
 * @this {Object} 玩家对象
 */
export function playerMarkCharacter(name, info, learn, learn2) {
	if (typeof name === "object") name = name.name;

	const nodeMark = ui.create.div(".card.mark");
	const nodeMarkText = ui.create.div(".mark-text", nodeMark);

	if (!info) info = {};
	if (!info.name) info.name = get.translation(name);
	if (!info.content) info.content = get.skillintro(name, learn, learn2);

	if (name.startsWith("unknown")) {
		const unknownText = get.translation(name)[0];
		if (unknownText?.includes("☯")) {
			nodeMark.style.setProperty("display", "none", "important");
		}
		nodeMarkText.innerHTML = unknownText;
	} else {
		if (!get.character(name)) {
			return console.error(name);
		}
		const text = info.name.slice(0, 2);
		if (text.length === 2) {
			nodeMarkText.classList.add("small-text");
		}
		if (text?.includes("☯")) {
			nodeMark.style.setProperty("display", "none", "important");
		}
		nodeMarkText.innerHTML = text;
	}

	nodeMark.name = name + "_charactermark";
	nodeMark.info = info;
	nodeMark.text = nodeMarkText;

	// 设置标记类型
	const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
	nodeMark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");

	bindMarkEvents(nodeMark);

	this.node.marks.appendChild(nodeMark);
	ui.updatem(this);

	return nodeMark;
}

/**
 * 更新标记覆写
 * @description 更新标记的计数显示
 * @param {string} name - 标记名
 * @param {boolean} [storage] - 是否同步存储
 * @returns {Object} 玩家对象（链式调用）
 * @this {Object} 玩家对象
 */
export function playerUpdateMark(name, storage) {
	if (!this.marks[name]) {
		const skillInfo = lib.skill[name];
		if (skillInfo?.intro && (this.storage[name] || skillInfo.intro.markcount)) {
			this.markSkill(name);
			if (!this.marks[name]) return this;
		} else {
			return this;
		}
	}

	const mark = this.marks[name];
	const skillInfo = lib.skill[name];

	if (storage && this.storage[name]) {
		this.syncStorage(name);
	}

	if (skillInfo?.intro && !skillInfo.intro.nocount && (this.storage[name] || skillInfo.intro.markcount)) {
		const num = calculateMarkCount(this, name, skillInfo);

		if (num) {
			if (!mark.markcount) {
				mark.markcount = window.decadeUI.element.create("mark-count", mark);
			}
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
		if (skillInfo?.mark === "auto") {
			this.unmarkSkill(name);
		}
	}

	return this;
}

/**
 * 计算标记计数
 * @param {Object} player - 玩家对象
 * @param {string} name - 标记名
 * @param {Object} skillInfo - 技能信息
 * @returns {number} 计数值
 * @private
 */
function calculateMarkCount(player, name, skillInfo) {
	const intro = skillInfo.intro;

	if (typeof intro.markcount === "function") {
		return intro.markcount(player.storage[name], player, name);
	}

	if (intro.markcount === "expansion") {
		return player.countCards("x", card => card.hasGaintag(name));
	}

	if (typeof player.storage[name + "_markcount"] === "number") {
		return player.storage[name + "_markcount"];
	}

	if (name === "ghujia") {
		return player.hujia;
	}

	if (typeof player.storage[name] === "number") {
		return player.storage[name];
	}

	if (Array.isArray(player.storage[name])) {
		return player.storage[name].length;
	}

	return 0;
}


/**
 * 标记技能武将覆写
 * @description 创建或更新技能关联的武将标记
 * @param {string} id - 标记ID
 * @param {Object|string} target - 目标武将
 * @param {string} name - 名称
 * @param {string} content - 内容
 * @returns {Object} 玩家对象（链式调用）
 * @this {Object} 玩家对象
 */
export function playerMarkSkillCharacter(id, target, name, content) {
	if (typeof target === "object") target = target.name;

	game.broadcastAll(
		(player, target, name, content, id) => {
			if (player.marks[id]) {
				updateExistingSkillMark(player, id, name, content, target);
			} else {
				createNewSkillMark(player, id, name, content, target);
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
 * 更新已有技能标记
 * @param {Object} player - 玩家对象
 * @param {string} id - 标记ID
 * @param {string} name - 名称
 * @param {string} content - 内容
 * @param {string} target - 目标
 * @private
 */
function updateExistingSkillMark(player, id, name, content, target) {
	const mark = player.marks[id];
	mark.name = name + "_skillmark";
	mark.info = { name, content, id };

	const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
	mark.classList.remove("own-skill", "other-skill");
	mark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");

	game.addVideo("changeMarkCharacter", player, { id, name, content, target });
}

/**
 * 创建新技能标记
 * @param {Object} player - 玩家对象
 * @param {string} id - 标记ID
 * @param {string} name - 名称
 * @param {string} content - 内容
 * @param {string} target - 目标
 * @private
 */
function createNewSkillMark(player, id, name, content, target) {
	const nodeMark = ui.create.div(".card.mark");
	const nodeMarkText = ui.create.div(".mark-text", nodeMark);

	const skillName = get.translation(name);
	const text = skillName.slice(0, 2);

	if (text.length === 2) {
		nodeMarkText.classList.add("small-text");
	}
	if (text?.includes("☯")) {
		nodeMark.style.setProperty("display", "none", "important");
	}

	nodeMarkText.innerHTML = text;
	nodeMark.name = name + "_skillmark";
	nodeMark.info = { name, content, id };
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

	game.addVideo("markCharacter", player, { name, content, id, target });
}
