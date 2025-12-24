/**
 * 阶段提示图片模块 (JDTS)
 * 显示回合阶段提示图片
 */

import { lib, game, get, _status } from "noname";

// 获取图片路径
const getImagePath = imageName => {
	const style = lib.config.extension_十周年UI_JDTSYangshi;
	const extMap = { 2: "png", 3: "webp", 4: "jpeg" };
	return `extension/十周年UI/shoushaUI/lbtn/images/JDTS/${imageName}.${extMap[style] || "jpg"}`;
};

// 获取图片位置
const getPosition = () => {
	const style = lib.config.extension_十周年UI_JDTSYangshi;
	if (style === "1") {
		const isSpecialMode = get.mode() === "taixuhuanjing" || lib.config.extension_EngEX_SSServant;
		return isSpecialMode ? [10, 58, 7, 6] : [3, 58, 7, 6];
	}
	return [18, 65, 8, 4.4];
};

// 显示阶段图片
const showPhaseImage = name => {
	game.showJDTsImage(name, true);
	_status.as_showImage_phase = name;
};

// 清除阶段图片
const clearPhaseImage = name => {
	if (_status.as_showImage_phase === name) {
		game.as_removeImage();
		delete _status.as_showImage_phase;
	}
};

// 恢复阶段图片
const restorePhaseImage = () => {
	game.as_removeImage();
	if (_status.as_showImage_phase) {
		game.showJDTsImage(_status.as_showImage_phase, true);
	}
};

// 判断函数
const isMe = player => player === game.me;
const isMyPhase = player => isMe(player) && _status.currentPhase === player;
const isManual = () => !_status.auto;

// 阶段事件配置
const phaseEvents = [
	["phaseBegin", "hhks", "hhks"],
	["phaseZhunbeiBefore", "pdjd", "zbjd"],
	["phaseJudgeBefore", "pdjd", "pdjd"],
	["phaseDrawBefore", "mpjd", "mpjd"],
	["phaseUseBefore", "cpjd", "cpjd"],
	["phaseDiscardBefore", "qpjd", "qpjd"],
	["phaseJieshuBefore", "pdjd", "jsjd"],
	["phaseEnd", "hhjs", "hhjs"],
];

const phaseEndEvents = [
	["phaseZhunbeiAfter", "zbjd"],
	["phaseJudgeAfter", "pdjd"],
	["phaseDrawAfter", "mpjd"],
	["phaseUseAfter", "cpjd"],
	["phaseDiscardAfter", "qpjd"],
	["phaseJieshuAfter", "jsjd"],
	["phaseAfter", "hhjs"],
];

/** 初始化阶段提示技能 */
export function initPhaseTipsSkills() {
	if (!lib.config.extension_十周年UI_JDTS) return;

	// 显示阶段图片方法
	game.showJDTsImage = (imageName, durationOrPersistent) => {
		game.as_showImage(getImagePath(imageName), getPosition(), durationOrPersistent);
	};

	// 游戏结束时清除图片
	lib.onover.push(() => game.as_removeImage());

	// 阶段开始事件
	phaseEvents.forEach(([event, image, phase]) => {
		lib.skill[`_jdts_${event}`] = {
			trigger: { player: event },
			silent: true,
			charlotte: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			filter: (e, player) => isMyPhase(player),
			async content() {
				showPhaseImage(image);
				_status.as_showImage_phase = phase;
			},
		};
	});

	// 阶段结束事件
	phaseEndEvents.forEach(([event, phase]) => {
		lib.skill[`_jdts_${event}`] = {
			trigger: { player: event },
			silent: true,
			charlotte: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			filter: (e, player) => isMyPhase(player),
			async content() {
				clearPhaseImage(phase);
			},
		};
	});

	// 等待响应提示
	lib.skill._jdts_ddxy_respond = {
		trigger: { player: "chooseToRespondBegin" },
		silent: true,
		direct: true,
		filter: (e, player) => isMe(player) && isManual(),
		async content(event, trigger) {
			trigger._jd_ddxy = true;
			game.showJDTsImage("ddxy", 10);
		},
	};

	// 杀响应提示
	lib.skill._jdts_ddxy_sha = {
		trigger: { target: "shaBegin" },
		silent: true,
		charlotte: true,
		forced: true,
		filter: event => isMe(event.target),
		async content(event, trigger) {
			trigger._jd_ddxy = true;
			game.showJDTsImage("ddxy", true);
		},
	};

	// 无懈可击提示
	lib.skill._jdts_ddxy_wuxie = {
		trigger: { player: ["useCardToBegin", "phaseJudge"] },
		silent: true,
		charlotte: true,
		forced: true,
		filter(event, player) {
			if (event.card.storage?.nowuxie) return false;
			const info = get.info(event.card);
			if (info.wuxieable === false) return false;
			if (event.name !== "phaseJudge") {
				if (event.getParent().nowuxie) return false;
				if (!event.target) return !!info.wuxieable;
				if (event.player.hasSkillTag("playernowuxie", false, event.card)) return false;
				if (get.type(event.card) !== "trick" && !info.wuxieable) return false;
			}
			return isMe(player) && isManual();
		},
		async content(event, trigger) {
			trigger._jd_ddxy = true;
			game.showJDTsImage("ddxy", true);
		},
	};

	// 闪使用后恢复
	lib.skill._jdts_shan_used = {
		trigger: { player: ["useCard", "respondAfter"] },
		silent: true,
		charlotte: true,
		forced: true,
		filter: (event, player) => isMe(player) && event.card.name === "shan",
		async content(event, trigger) {
			trigger._jd_ddxy = true;
			restorePhaseImage();
		},
	};

	// 等待响应结束
	lib.skill._jdts_ddxy_end = {
		trigger: { player: ["chooseToRespondEnd", "useCardToEnd", "phaseJudgeEnd", "respondSha", "shanBegin"] },
		silent: true,
		direct: true,
		filter: (event, player) => event._jd_ddxy && isMe(player) && isManual(),
		async content() {
			restorePhaseImage();
		},
	};

	// 对方思考提示（双人模式）
	lib.skill._jdts_dfsk = {
		trigger: { global: ["phaseBegin", "phaseEnd", "phaseJudgeBegin", "phaseDrawBegin", "phaseUseBegin", "phaseDiscardBegin"] },
		silent: true,
		charlotte: true,
		forced: true,
		filter: () => game.players.length === 2 && _status.currentPhase !== game.me,
		async content() {
			game.showJDTsImage("dfsk", true);
		},
	};

	// 清除提示
	lib.skill._jdts_clear = {
		trigger: { global: ["phaseEnd", "useCardAfter"] },
		silent: true,
		charlotte: true,
		forced: true,
		filter: (event, player) => _status.currentPhase !== game.me && player !== game.me,
		async content() {
			game.as_removeImage();
		},
	};

	// 死亡时清除
	lib.skill._jdts_die = {
		trigger: { global: "dieAfter" },
		silent: true,
		charlotte: true,
		forced: true,
		filter: (event, player) => isMe(player) && isManual(),
		async content() {
			game.as_removeImage();
		},
	};
}
