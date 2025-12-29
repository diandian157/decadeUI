/**
 * @fileoverview 增强音效模块
 * 提供UI点击音效、准备阶段音效、掉血音效等增强音效功能
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 播放扩展音效
 * @param {string} name - 音效文件名
 */
const playExtAudio = name => {
	game.playAudio("..", "extension", "十周年UI", `audio/${name}`);
};

/**
 * 初始化增强音效功能
 * 包含UI点击音效、准备阶段音效、掉血音效
 */
export function setupEnhancedAudio() {
	if (!lib.config["extension_十周年UI_bettersound"]) return;

	// 屏蔽原生掉血音效
	game._decadeUI_blockedEquipAudios = game._decadeUI_blockedEquipAudios || new Set(["loseHp"]);

	// 包装 playAudio 以过滤音效
	if (!game._decadeUI_playAudioWrapped) {
		const originalPlayAudio = game.playAudio;
		game.playAudio = function (...args) {
			if (args[0] === "effect" && game._decadeUI_blockedEquipAudios?.has(args[1])) return;
			return originalPlayAudio.apply(this, args);
		};
		game._decadeUI_playAudioWrapped = true;
	}

	// UI点击音效
	if (!game._decadeUI_uiClickAudioHandler) {
		/**
		 * @type {Array<{test: Function, sound: string}>}
		 * UI音效规则配置
		 */
		const AUDIO_RULES = [
			{ test: t => t.closest("#dui-controls") && (t.classList?.contains("control") || t.parentElement?.classList?.contains("control")), sound: "BtnSure" },
			{ test: t => t.closest(".menubutton, .button, .card"), sound: "card_click" },
		];

		/**
		 * UI点击音效处理函数
		 * @param {PointerEvent} e - 指针事件
		 */
		const uiClickAudioHandler = e => {
			if (e.button !== 0) return;
			const audioToPlay = AUDIO_RULES.find(r => r.test(e.target))?.sound;
			if (!audioToPlay) return;

			// 防抖：60ms内不重复播放
			const now = Date.now();
			if (now - (game._decadeUI_lastUIAudioAt || 0) < 60) return;
			game._decadeUI_lastUIAudioAt = now;
			playExtAudio(audioToPlay);
		};

		document.body.addEventListener("pointerdown", uiClickAudioHandler, { capture: true, passive: true });
		game._decadeUI_uiClickAudioHandler = uiClickAudioHandler;
	}

	// 准备阶段音效技能
	lib.skill._preparePhaseAudio = {
		charlotte: true,
		forced: true,
		popup: false,
		trigger: { player: ["phaseZhunbeiBefore"] },
		filter: (_event, player) => player === game.me && _status.currentPhase === player,
		async content() {
			playExtAudio("seatRoundState_start");
		},
	};

	// 掉血音效技能
	lib.skill._hpLossAudio = {
		charlotte: true,
		forced: true,
		popup: false,
		trigger: { player: "loseHpBefore" },
		filter: event => !!event.num,
		async content() {
			playExtAudio("hpLossSund.mp3");
		},
	};
}
