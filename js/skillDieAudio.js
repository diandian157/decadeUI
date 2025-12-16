"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
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
		if (pick.text && player?.say && lib.config.extension_十周年UI_skillDieAudio) player.say(pick.text);
		return game.tryAudio({ audioList: [pick.file], random: false });
	};

	game.tryDieAudio = function (player, dieInfo) {
		game.broadcast(game.tryDieAudio, player, dieInfo);
		if (!lib.config.background_speak) return;
		if (!player) return;
		const audioObj = get.Audio.die({ player, info: dieInfo });
		const pick = audioObj.audioList.slice().randomRemove();
		if (!pick) return;
		if (pick.text && player.say && lib.config.extension_十周年UI_skillDieAudio) player.say(pick.text);
		return game.tryAudio({ audioList: [pick.file], random: false });
	};
});
