"use strict";

/**
 * @fileoverview 特效模块配置常量定义
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 特效配置常量
 * @type {Object}
 */
export const CONFIG = {
	// 动画参数
	ANIM_SPEED: 0.07,
	FRAME_RATE: 17,
	LINE_COLOR: "rgb(250,220,140)",
	LINE_WIDTH: 2.6,

	// 时间配置(ms)
	EFFECT_DURATION: 2180,
	KILL_DELAY: 2000,
	KILL_CLOSE: 3000,

	// 击杀特效
	KILL_LIGHT_COUNT: 10,
	KILL_SCALE: 1.2,

	// 技能特效尺寸
	SKILL_MAX_W: 288,
	SKILL_MAX_H: 378,
	SKILL_NAME_Y: 165,
	GENERAL_X: 200,
	GENERAL_Y: 160,
};

/**
 * 武将名样式配置
 * @type {Object}
 */
export const GENERAL_NAME_STYLE = {
	position: "absolute",
	writingMode: "vertical-lr",
	textOrientation: "upright",
	fontFamily: "yuanli",
	color: "rgb(215, 234, 67)",
	fontSize: "25px",
	textShadow: "0 0 5px black, 0 0 10px black",
	pointerEvents: "none",
	letterSpacing: "5px",
	zIndex: 17,
};
