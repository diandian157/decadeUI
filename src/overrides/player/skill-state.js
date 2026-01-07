/**
 * @fileoverview Player技能状态覆写模块
 * @description 处理技能的阴阳状态、转换技、失效状态等
 * @module overrides/player/skill-state
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { getBasePlayerMethods } from "./base.js";

/**
 * 转换技覆写
 * @description 处理转换技的阴阳状态切换和UI更新
 * @param {string} skill - 技能名
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerChangeZhuanhuanji(skill) {
	const base = getBasePlayerMethods();
	base.$changeZhuanhuanji.apply(this, arguments);

	if (!get.is.zhuanhuanji(skill, this)) return;

	if (this.hiddenSkills.includes(skill) && this !== game.me) return;

	const mark = this.node.xSkillMarks?.querySelector(`[data-id="${skill}"]`);
	if (!mark) return;

	const customImageUrl = `${lib.assetURL}extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/${skill}_yang.png`;
	mark.dk = checkImageExists(customImageUrl);

	const style = lib.config.extension_十周年UI_newDecadeStyle;

	if (style !== "off") {
		toggleYinYangClass(mark);
	} else {
		toggleYinYangImage(this, mark, skill);
	}
}

/**
 * 检查图片是否存在（同步方式）
 * @param {string} url - 图片URL
 * @returns {boolean} 是否存在
 * @private
 * @deprecated 应改用异步方式
 */
function checkImageExists(url) {
	try {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send();
		return xhr.status !== 404;
	} catch (err) {
		return false;
	}
}

/**
 * 切换阴阳CSS类
 * @param {HTMLElement} mark - 标记元素
 * @returns {void}
 * @private
 */
function toggleYinYangClass(mark) {
	if (mark.classList.contains("yin")) {
		mark.classList.remove("yin");
		mark.classList.add("yang");
	} else {
		mark.classList.remove("yang");
		mark.classList.add("yin");
	}
}

/**
 * 切换阴阳背景图
 * @param {Object} player - 玩家对象
 * @param {HTMLElement} mark - 标记元素
 * @param {string} skill - 技能名
 * @returns {void}
 * @private
 */
function toggleYinYangImage(player, mark, skill) {
	const basePath = "extension/十周年UI/ui/assets/skill/shousha/zhuanhuanji/";
	const yangUrl = `${basePath}${skill}_yang.png`;
	const yingUrl = `${basePath}${skill}_ying.png`;
	const defaultYangUrl = `${basePath}ditu_yang.png`;
	const defaultYingUrl = `${basePath}ditu_ying.png`;

	if (mark.dd === true) {
		player.setSkillYinYang(skill, false);
		mark.dd = false;
		mark.setBackgroundImage(mark.dk ? yangUrl : defaultYangUrl);
	} else {
		player.setSkillYinYang(skill, true);
		mark.dd = true;
		mark.setBackgroundImage(mark.dk ? yingUrl : defaultYingUrl);
	}
}

/**
 * 设置技能阴阳状态
 * @description 广播到所有客户端
 * @param {string} skill - 技能名
 * @param {boolean} isYang - true为阳，false为阴
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerSetSkillYinYang(skill, isYang) {
	game.broadcastAll((player, skill, isYang) => player.$setSkillYinYang(skill, isYang), this, skill, isYang);
}

/**
 * $设置技能阴阳状态（本地执行）
 * @description 更新玩家的阴阳技能列表
 * @param {string} skill - 技能名
 * @param {boolean} isYang - true为阳，false为阴
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function player$SetSkillYinYang(skill, isYang) {
	this.yangedSkills ??= [];
	this.yingedSkills ??= [];

	if (isYang) {
		this.yangedSkills.add(skill);
		this.yingedSkills.remove(skill);
	} else {
		this.yingedSkills.add(skill);
		this.yangedSkills.remove(skill);
	}
}

/**
 * 技能状态类型
 * @typedef {'fail'|'shixiao'|'unshixiao'} SkillStateType
 */

/**
 * 设置技能状态
 * @description 广播到所有客户端
 * @param {string} skill - 技能名
 * @param {SkillStateType} state - 状态类型
 *   - 'fail': 使命技失败
 *   - 'shixiao': 技能失效
 *   - 'unshixiao': 取消失效
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function playerSetSkillState(skill, state) {
	game.broadcastAll((player, skill, state) => player.$setSkillState(skill, state), this, skill, state);
}

/**
 * $设置技能状态（本地执行）
 * @description 更新技能的失败/失效状态
 * @param {string} skill - 技能名
 * @param {SkillStateType} state - 状态类型
 * @returns {void}
 * @this {Object} 玩家对象
 */
export function player$SetSkillState(skill, state) {
	switch (state) {
		case "fail":
			handleFailState(this, skill);
			break;
		case "shixiao":
			handleShixiaoState(this, skill, true);
			break;
		case "unshixiao":
			handleShixiaoState(this, skill, false);
			break;
	}
}

/**
 * 处理失败状态
 * @param {Object} player - 玩家对象
 * @param {string} skill - 技能名
 * @returns {void}
 * @private
 */
function handleFailState(player, skill) {
	if (player.hiddenSkills.includes(skill) && player !== game.me) {
		return;
	}

	const mark = player.node.xSkillMarks?.querySelector(`[data-id="${skill}"]`);
	if (mark) {
		mark.classList.add("fail");
	}
}

/**
 * 处理失效状态
 * @param {Object} player - 玩家对象
 * @param {string} skill - 技能名
 * @param {boolean} isShixiao - 是否失效
 * @returns {void}
 * @private
 */
function handleShixiaoState(player, skill, isShixiao) {
	player.shixiaoedSkills ??= [];

	if (isShixiao) {
		player.shixiaoedSkills.add(skill);
	} else {
		player.shixiaoedSkills.remove(skill);
	}
}
