/**
 * @fileoverview 角色技能配音模块
 * 为本体角色添加技能配音和台词
 */

"use strict";

import { lib } from "noname";

/**
 * 设置角色技能配音
 * 为本体没有配音的角色添加技能语音
 */
export function setupCharacterAudio() {
	if (lib.skill.quanjia) {
		if (!lib.skill.quanjia.audioname2) {
			lib.skill.quanjia.audioname2 = {};
		}
		lib.skill.quanjia.audioname2.bozai = ["ext:十周年UI/audio/hajimi/quanjia1.mp3", "ext:十周年UI/audio/hajimi/quanjia2.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/quanjia1"] = "请输入文本";
		lib.translate["#ext:十周年UI/audio/hajimi/quanjia2"] = "请输入文本";
	}

	if (lib.skill.dckeshui) {
		if (!lib.skill.dckeshui.audioname2) {
			lib.skill.dckeshui.audioname2 = {};
		}
		lib.skill.dckeshui.audioname2.shuimianzhishen = ["ext:十周年UI/audio/hajimi/dckeshui.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/dckeshui"] = "zzzzzz";
	}

	if (lib.skill.dcbaibian) {
		if (!lib.skill.dcbaibian.audioname2) {
			lib.skill.dcbaibian.audioname2 = {};
		}
		lib.skill.dcbaibian.audioname2.bianhuanzhishen = ["ext:十周年UI/audio/hajimi/dcbaibian.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/dcbaibian"] = "嘟嘟哒嘟嘟";
	}

	if (lib.skill.dcmaimeng) {
		if (!lib.skill.dcmaimeng.audioname2) {
			lib.skill.dcmaimeng.audioname2 = {};
		}
		lib.skill.dcmaimeng.audioname2.keaizhishen = ["ext:十周年UI/audio/hajimi/dcmaimeng.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/dcmaimeng"] = "哇偶";
	}

	if (lib.skill.dchuibian) {
		if (!lib.skill.dchuibian.audioname2) {
			lib.skill.dchuibian.audioname2 = {};
		}
		lib.skill.dchuibian.audioname2.juezezhishen = ["ext:十周年UI/audio/hajimi/dchuibian.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/dchuibian"] = "巴巴博弈";
	}

	if (lib.skill.dcweiqu) {
		if (!lib.skill.dcweiqu.audioname2) {
			lib.skill.dcweiqu.audioname2 = {};
		}
		lib.skill.dcweiqu.audioname2.weiquzhishen = ["ext:十周年UI/audio/hajimi/dcweiqu.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/dcweiqu"] = "请输入文本";
	}

	if (lib.skill.dcfanzhuan) {
		if (!lib.skill.dcfanzhuan.audioname2) {
			lib.skill.dcfanzhuan.audioname2 = {};
		}
		lib.skill.dcfanzhuan.audioname2.nizhuanzhishen = ["ext:十周年UI/audio/hajimi/dcfanzhuan.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/dcfanzhuan"] = "开！将大局逆转吧！";
	}

	if (lib.skill.xuyuan) {
		if (!lib.skill.xuyuan.audioname2) {
			lib.skill.xuyuan.audioname2 = {};
		}
		lib.skill.xuyuan.audioname2.xiangjiaoduanwu = ["ext:十周年UI/audio/hajimi/xuyuan.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/xuyuan"] = "happy！happy！happy！";
	}

	if (lib.skill.xiaomian) {
		if (!lib.skill.xiaomian.audioname2) {
			lib.skill.xiaomian.audioname2 = {};
		}
		lib.skill.xiaomian.audioname2.xiangjiaoduanwu = ["ext:十周年UI/audio/hajimi/xiaomian.mp3"];
		lib.translate["#ext:十周年UI/audio/hajimi/xiaomian"] = "嘿嘿";
	}
}
