/**
 * @fileoverview 技能/阵亡语音模块
 * 提供技能语音和阵亡语音播放功能，并显示文本气泡
 */

"use strict";

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 初始化技能/阵亡语音功能
 * 设置 game.trySkillAudio 和 game.tryDieAudio 方法
 */
export function setupSkillDieAudio() {
	/**
	 * 尝试播放技能语音
	 * @param {string} skill - 技能名称
	 * @param {Object} player - 玩家对象
	 * @param {boolean} directaudio - 是否直接播放音频
	 * @param {boolean} nobroadcast - 是否不广播
	 * @param {Object} skillInfo - 技能信息
	 * @param {Array} args - 额外参数
	 * @returns {*} 音频播放结果
	 */
	game.trySkillAudio = function (skill, player, directaudio, nobroadcast, skillInfo, args) {
		if (!nobroadcast) {
			game.broadcast(game.trySkillAudio, skill, player, directaudio, nobroadcast, skillInfo, args);
		}

		if (!lib.config.background_speak) return;
		const info = skillInfo || lib.skill[skill];
		if (!info) return;
		if (info.direct && !directaudio) return;
		if (lib.skill.global.includes(skill) && !info.forceaudio) return;

		const audioObj = get.Audio.skill({ skill, player, info: skillInfo, args });
		const pick = audioObj.audioList.slice().randomRemove();
		if (!pick) return;

		if (pick.text && player?.say && lib.config.extension_十周年UI_skillDieAudio) {
			player.say(pick.text);
		}

		return game.tryAudio({ audioList: [pick.file], random: false });
	};

	/**
	 * 尝试播放阵亡语音
	 * @param {Object} player - 阵亡的玩家对象
	 * @param {Object} dieInfo - 阵亡信息
	 * @returns {*} 音频播放结果
	 */
	game.tryDieAudio = function (player, dieInfo) {
		game.broadcast(game.tryDieAudio, player, dieInfo);

		if (!lib.config.background_speak) return;
		if (!player) return;

		const audioObj = get.Audio.die({ player, info: dieInfo });
		const pick = audioObj.audioList.slice().randomRemove();
		if (!pick) return;

		if (pick.text && player.say && lib.config.extension_十周年UI_skillDieAudio) {
			player.say(pick.text);
		}

		return game.tryAudio({ audioList: [pick.file], random: false });
	};
}
