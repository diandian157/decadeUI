"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	if (lib.config.extension_十周年UI_JDTS) {
		game.showJDTsImage = (imageName, durationOrPersistent) => {
			const style = lib.config.extension_十周年UI_JDTSYangshi;
			const extMap = { 2: "png", 3: "webp", 4: "jpeg" };
			const ext = extMap[style] || "jpg";
			const imgPath = `extension/十周年UI/shoushaUI/lbtn/images/JDTS/${imageName}.${ext}`;
			let position;
			if (style === "1") {
				const isSpecialMode = get.mode() === "taixuhuanjing" || lib.config.extension_EngEX_SSServant;
				position = isSpecialMode ? [10, 58, 7, 6] : [3, 58, 7, 6];
			} else {
				position = [18, 65, 8, 4.4];
			}
			game.as_showImage(imgPath, position, durationOrPersistent);
		};
		//游戏结束消失
		lib.onover.push(() => {
			game.as_removeImage();
		});
		//等待响应
		lib.skill._jd_ddxyA = {
			trigger: {
				player: ["chooseToRespondBegin"],
			},
			silent: true,
			direct: true,
			filter(event, player) {
				return player === game.me && _status.auto === false;
			},
			async content(event, trigger, player) {
				trigger._jd_ddxy = true;
				game.showJDTsImage("ddxy", 10);
			},
		};
		//成为杀的目标开始
		lib.skill._jd_ddxyB = {
			trigger: {
				target: "shaBegin",
			},
			silent: true,
			filter(event, player) {
				return game.me === event.target;
			},
			charlotte: true,
			forced: true,
			async content(event, trigger, player) {
				trigger._jd_ddxy = true;
				game.showJDTsImage("ddxy", true);
			},
		};
		lib.skill._jd_ddxyC = {
			trigger: {
				player: ["useCardToBegin", "phaseJudge"],
			},
			silent: true,
			filter(event, player) {
				if (event.card.storage?.nowuxie) return false;
				const card = event.card;
				const info = get.info(card);
				if (info.wuxieable === false) return false;
				if (event.name !== "phaseJudge") {
					if (event.getParent().nowuxie) return false;
					if (!event.target) {
						if (info.wuxieable) return true;
						return false;
					}
					if (event.player.hasSkillTag("playernowuxie", false, event.card)) return false;
					if (get.type(event.card) !== "trick" && !info.wuxieable) return false;
				}
				return player === game.me && _status.auto === false;
			},
			charlotte: true,
			forced: true,
			async content(event, trigger, player) {
				trigger._jd_ddxy = true;
				game.showJDTsImage("ddxy", true);
			},
		};
		//使用或打出闪后
		lib.skill._jd_shiyongshanD = {
			forced: true,
			charlotte: true,
			trigger: {
				player: ["useCard", "respondAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && event.card.name === "shan";
			},
			async content(event, trigger, player) {
				trigger._jd_ddxy = true;
				game.as_removeImage();
				if (_status.as_showImage_phase) {
					game.showJDTsImage(_status.as_showImage_phase, true);
				}
			},
		};
		//等待响应及游戏结束
		lib.skill._jd_ddxyE = {
			trigger: {
				player: ["chooseToRespondEnd", "useCardToEnd", "phaseJudgeEnd", "respondSha", "shanBegin"],
			},
			silent: true,
			filter(event, player) {
				if (!event._jd_ddxy) return false;
				return player === game.me && _status.auto === false;
			},
			direct: true,
			async content() {
				game.as_removeImage();
				if (_status.as_showImage_phase) {
					game.showJDTsImage(_status.as_showImage_phase, true);
				}
			},
		};
		//对方正在思考
		lib.skill._jd_dfsk = {
			trigger: {
				global: ["phaseBegin", "phaseEnd", "phaseJudgeBegin", "phaseDrawBegin", "phaseUseBegin", "phaseDiscardBegin"],
			},
			silent: true,
			charlotte: true,
			forced: true,
			filter(event, player) {
				//剩余人数两人时
				if (game.players.length === 2 && _status.currentPhase !== game.me) return true;
			},
			async content() {
				game.showJDTsImage("dfsk", true);
			},
		};
		//死亡或回合结束消失
		lib.skill._jd_wjsw = {
			trigger: {
				global: ["phaseEnd", "useCardAfter"],
			},
			silent: true,
			filter(event, player) {
				return _status.currentPhase !== game.me && player !== game.me;
			},
			forced: true,
			charlotte: true,
			async content() {
				game.as_removeImage();
			},
		};
		lib.skill._jd_swxs = {
			trigger: {
				global: ["dieAfter"],
			},
			silent: true,
			forced: true,
			charlotte: true,
			filter(event, player) {
				return player === game.me && _status.auto === false;
			},
			async content() {
				game.as_removeImage();
			},
		};
		//回合开始
		lib.skill._jd_hhks = {
			trigger: {
				player: ["phaseBegin"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("hhks", true);
				_status.as_showImage_phase = "hhks";
			},
		};
		//准备阶段
		lib.skill._jd_zbjdb = {
			trigger: {
				player: ["phaseZhunbeiBefore"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("pdjd", true);
				_status.as_showImage_phase = "zbjd";
			},
		};
		lib.skill._jd_zbjde = {
			trigger: {
				player: ["phaseZhunbeiAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "zbjd") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
		//判定阶段
		lib.skill._jd_pdjdb = {
			trigger: {
				player: ["phaseJudgeBefore"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("pdjd", true);
				_status.as_showImage_phase = "pdjd";
			},
		};
		lib.skill._jd_pdjde = {
			trigger: {
				player: ["phaseJudgeAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "pdjd") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
		//摸牌阶段
		lib.skill._jd_mpjdb = {
			trigger: {
				player: ["phaseDrawBefore"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("mpjd", true);
				_status.as_showImage_phase = "mpjd";
			},
		};
		lib.skill._jd_mpjde = {
			trigger: {
				player: ["phaseDrawAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "mpjd") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
		//出牌阶段
		lib.skill._jd_cpjdb = {
			trigger: {
				player: ["phaseUseBefore"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("cpjd", true);
				_status.as_showImage_phase = "cpjd";
			},
		};
		lib.skill._jd_cpjde = {
			trigger: {
				player: ["phaseUseAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "cpjd") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
		//弃牌阶段
		lib.skill._jd_qpjdb = {
			trigger: {
				player: ["phaseDiscardBefore"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("qpjd", true);
				_status.as_showImage_phase = "qpjd";
			},
		};
		lib.skill._jd_qpjde = {
			trigger: {
				player: ["phaseDiscardAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "qpjd") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
		//结束阶段
		lib.skill._jd_jsjdb = {
			trigger: {
				player: ["phaseJieshuBefore"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("pdjd", true);
				_status.as_showImage_phase = "jsjd";
			},
		};
		lib.skill._jd_jsjde = {
			trigger: {
				player: ["phaseJieshuAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "jsjd") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
		//回合结束
		lib.skill._jd_hhjsb = {
			trigger: {
				player: ["phaseEnd"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: Infinity,
			firstDo: true,
			async content() {
				game.showJDTsImage("hhjs", true);
				_status.as_showImage_phase = "hhjs";
			},
		};
		lib.skill._jd_hhjse = {
			trigger: {
				player: ["phaseAfter"],
			},
			silent: true,
			filter(event, player) {
				return player === game.me && _status.currentPhase === player;
			},
			charlotte: true,
			ruleSkill: true,
			direct: true,
			priority: -Infinity,
			lastDo: true,
			async content() {
				if (_status.as_showImage_phase === "hhjs") {
					game.as_removeImage();
					delete _status.as_showImage_phase;
				}
			},
		};
	}
});
