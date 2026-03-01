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
	lib.skill.quanjia.audio = ["ext:十周年UI/audio/hajimi/quanjia1.mp3", "ext:十周年UI/audio/hajimi/quanjia2.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/quanjia1"] = "请输入文本";
	lib.translate["#ext:十周年UI/audio/hajimi/quanjia2"] = "请输入文本";

	lib.skill.dckeshui.audio = ["ext:十周年UI/audio/hajimi/dckeshui.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/dckeshui"] = "zzzzzz";

	lib.skill.dcbaibian.audio = ["ext:十周年UI/audio/hajimi/dcbaibian.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/dcbaibian"] = "嘟嘟哒嘟嘟";

	lib.skill.dcmaimeng.audio = ["ext:十周年UI/audio/hajimi/dcmaimeng.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/dcmaimeng"] = "哇偶";

	lib.skill.dchuibian.audio = ["ext:十周年UI/audio/hajimi/dchuibian.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/dchuibian"] = "巴巴博弈";

	lib.skill.dcweiqu.audio = ["ext:十周年UI/audio/hajimi/dcweiqu.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/dcweiqu"] = "请输入文本";

	lib.skill.dcfanzhuan.audio = ["ext:十周年UI/audio/hajimi/dcfanzhuan.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/dcfanzhuan"] = "开！将大局逆转吧！";

	lib.skill.xuyuan.audio = ["ext:十周年UI/audio/hajimi/xuyuan.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/xuyuan"] = "happy！happy！happy！";

	lib.skill.xiaomian.audio = ["ext:十周年UI/audio/hajimi/xiaomian.mp3"];
	lib.translate["#ext:十周年UI/audio/hajimi/xiaomian"] = "嘿嘿";
}
