"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	if (!lib.config.extension_十周年UI_JDTS) return;

	const getImagePath = imageName => {
		const style = lib.config.extension_十周年UI_JDTSYangshi;
		const extMap = { 2: "png", 3: "webp", 4: "jpeg" };
		return `extension/十周年UI/shoushaUI/lbtn/images/JDTS/${imageName}.${extMap[style] || "jpg"}`;
	};

	const getPosition = () => {
		const style = lib.config.extension_十周年UI_JDTSYangshi;
		if (style === "1") {
			const isSpecialMode = get.mode() === "taixuhuanjing" || lib.config.extension_EngEX_SSServant;
			return isSpecialMode ? [10, 58, 7, 6] : [3, 58, 7, 6];
		}
		return [18, 65, 8, 4.4];
	};

	game.showJDTsImage = (imageName, durationOrPersistent) => {
		game.as_showImage(getImagePath(imageName), getPosition(), durationOrPersistent);
	};

	const showPhaseImage = name => {
		game.showJDTsImage(name, true);
		_status.as_showImage_phase = name;
	};

	const clearPhaseImage = name => {
		if (_status.as_showImage_phase === name) {
			game.as_removeImage();
			delete _status.as_showImage_phase;
		}
	};

	const restorePhaseImage = () => {
		game.as_removeImage();
		if (_status.as_showImage_phase) {
			game.showJDTsImage(_status.as_showImage_phase, true);
		}
	};

	const isMe = player => player === game.me;
	const isMyPhase = player => isMe(player) && _status.currentPhase === player;
	const isManual = () => !_status.auto;

	lib.onover.push(() => game.as_removeImage());

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

	lib.skill._jdts_ddxy_end = {
		trigger: { player: ["chooseToRespondEnd", "useCardToEnd", "phaseJudgeEnd", "respondSha", "shanBegin"] },
		silent: true,
		direct: true,
		filter: (event, player) => event._jd_ddxy && isMe(player) && isManual(),
		async content() {
			restorePhaseImage();
		},
	};

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
});
