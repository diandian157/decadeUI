/**
 * 身份相关工具函数
 * @description 从concore.js提取的身份处理函数
 */
import { lib, game, get, _status } from "noname";

/**
 * 获取玩家身份
 * @param {HTMLElement} player 玩家元素
 * @param {string} identity 身份
 * @param {boolean} chinese 是否中文
 * @param {boolean} isMark 是否标记
 */
export function getPlayerIdentity(player, identity, chinese, isMark) {
	if (!(player instanceof HTMLElement && get.itemtype(player) === "player")) {
		throw new Error("player参数无效");
	}
	if (!identity) identity = player.identity;

	const mode = get.mode();
	let translated = false;

	if (!chinese) {
		// 英文身份处理
		const result = handleEnglishIdentity(player, identity, mode);
		if (result !== undefined) return result;
	} else {
		// 中文身份处理
		const result = handleChineseIdentity(player, identity, mode, isMark);
		identity = result.identity;
		translated = result.translated;

		if (!translated) identity = get.translation(identity);
		if (isMark) identity = identity[0];
	}

	return identity;
}

/**
 * 处理英文身份
 */
function handleEnglishIdentity(player, identity, mode) {
	const handlers = {
		identity: () => {
			if (!player.isAlive() || player.identityShown || player === game.me) {
				return (player.special_identity || identity || "").replace(/identity_/, "");
			}
		},
		guozhan: () => {
			if (identity === "unknown") {
				identity = player.wontYe() ? lib.character[player.name1][1] : "ye";
			}
			if (get.is.jun(player)) identity += "jun";
		},
		versus: () => {
			if (!game.me) return;
			return handleVersusEnglish(player, identity);
		},
		doudizhu: () => {
			return identity === "zhu" ? "dizhu" : "nongmin";
		},
		boss: () => {
			const map = { zhu: "boss", zhong: "cong", cai: "meng" };
			return map[identity] || identity;
		},
	};

	const handler = handlers[mode];
	return handler?.();
}

/**
 * 处理对战模式英文身份
 */
function handleVersusEnglish(player, identity) {
	const handlers = {
		standard: () => {
			const map = { trueZhu: "shuai", trueZhong: "bing", falseZhu: "jiang", falseZhong: "zu" };
			return map[identity];
		},
		three: () => (get.translation(player.side + "Color") === "wei" ? identity + "_blue" : identity),
		four: () => (get.translation(player.side + "Color") === "wei" ? identity + "_blue" : identity),
		guandu: () => (get.translation(player.side + "Color") === "wei" ? identity + "_blue" : identity),
		two: () => {
			const side = player.finalSide || player.side;
			return game.me.side === side ? "friend" : "enemy";
		},
	};

	return handlers[_status.mode]?.();
}

/**
 * 处理中文身份
 */
function handleChineseIdentity(player, identity, mode, isMark) {
	let translated = false;

	const handlers = {
		identity: () => {
			if ((identity || "").indexOf("cai") < 0) {
				if (isMark) {
					if (player.special_identity) identity = player.special_identity + "_bg";
				} else {
					identity = player.special_identity || identity + "2";
				}
			}
		},
		guozhan: () => {
			if (identity === "unknown") {
				identity = player.wontYe() ? player.trueIdentity || lib.character[player.name1][1] : "ye";
			}
			if (get.is.jun(player)) {
				identity = isMark ? "君" : get.translation(identity) + "君";
			} else {
				identity = identity === "ye" ? "野心家" : identity === "qun" ? "群雄" : get.translation(identity) + "将";
			}
			translated = true;
		},
		versus: () => {
			translated = true;
			if (!game.me) return;
			const result = handleVersusChineseIdentity(player, identity, isMark);
			identity = result.identity;
			translated = result.translated;
		},
		doudizhu: () => {
			identity += "2";
		},
		boss: () => {
			translated = true;
			const map = { zhu: "BOSS", zhong: "仆从", cai: "盟军" };
			if (map[identity]) {
				identity = map[identity];
			} else {
				translated = false;
			}
		},
	};

	handlers[mode]?.();
	return { identity, translated };
}

/**
 * 处理对战模式中文身份
 */
function handleVersusChineseIdentity(player, identity, isMark) {
	let translated = true;
	const zhMap = { zhu: "主公", zhong: "忠臣", fan: "反贼" };

	const handlers = {
		three: () => zhMap[identity] || ((translated = false), identity),
		standard: () => zhMap[identity] || ((translated = false), identity),
		four: () => zhMap[identity] || ((translated = false), identity),
		guandu: () => zhMap[identity] || ((translated = false), identity),
		two: () => {
			const side = player.finalSide || player.side;
			return game.me.side === side ? "友方" : "敌方";
		},
		siguo: () => get.translation(identity) + "将",
		jiange: () => get.translation(identity) + "将",
	};

	const handler = handlers[_status.mode];
	if (handler) {
		identity = handler();
	} else {
		translated = false;
	}

	return { identity, translated };
}
