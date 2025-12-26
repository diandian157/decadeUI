/**
 * 武将背景模式模块
 */
import { lib, game, ui, get, ai, _status } from "noname";

/** 获取当前模式是否为双将模式 */
export const isDoubleCharacterMode = () => {
	const mode = get.mode();
	return mode === "guozhan" || lib.config.mode_config[mode]?.double_character;
};

/** 初始化武将背景模式 */
export function setupCharacterBackground() {
	if (!lib.config["extension_十周年UI_wujiangbeijing"]) return;

	const setPlayerBackground = player => {
		if (!player) return;
		player.setAttribute("data-mode", isDoubleCharacterMode() ? "guozhan" : "normal");
	};

	lib.skill._wjBackground = {
		charlotte: true,
		forced: true,
		popup: false,
		priority: 100,
		trigger: {
			global: ["gameStart", "modeSwitch"],
			player: ["enterGame", "showCharacterEnd"],
		},
		async content() {
			game.players.forEach(setPlayerBackground);
			game.dead.forEach(setPlayerBackground);
		},
	};

	lib.arenaReady.push(() => {
		document.body.setAttribute("data-mode", isDoubleCharacterMode() ? "guozhan" : "normal");
	});
}
