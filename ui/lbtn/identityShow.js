/**
 * 身份显示模块
 */
import { GUOZHAN_IDENTITY_COLORS, IDENTITY_COLORS } from "../constants.js";

// 构建模式胜利条件翻译
export function buildModeWinTranslations(mode, versusMode) {
	const baseMap = {
		rZhu: "击败冷方主公<br>与所有野心家",
		rZhong: "保护暖方主公<br>击败冷方主公<br>与所有野心家",
		rYe: "联合冷方野心家<br>击败其他角色",
		rNei: "协助冷方主公<br>击败暖方主公<br>与所有野心家",
		bZhu: "击败暖方主公<br>与所有野心家",
		bZhong: "保护冷方主公<br>击败暖方主公<br>与所有野心家",
		bYe: "联合暖方野心家<br>击败其他角色",
		bNei: "协助暖方主公<br>击败冷方主公<br>与所有野心家",
		zhu: "推测场上身份<br>击败反贼内奸",
		zhong: "保护主公<br>取得最后胜利",
		fan: "找出反贼队友<br>全力击败主公",
		nei: "找出反贼忠臣<br>最后击败主公",
		mingzhong: "保护主公<br>取得最后胜利",
		undefined: "胜利条件",
	};

	const handlers = {
		doudizhu: () => ({ zhu: "击败所有农民", fan: "击败地主", undefined: "未选择阵营" }),
		single: () => ({ zhu: "击败对手", fan: "击败对手", undefined: "未选择阵营" }),
		boss: () => ({ zhu: "击败盟军", cai: "击败神祇", undefined: "未选择阵营" }),
		guozhan: () => {
			const map = { undefined: "未选择势力", unknown: "保持隐蔽", ye: "击败场上<br>所有其他角色", key: "击败所有<br>非键势力角色" };
			lib.group.forEach(g => {
				map[g] = `击败所有<br>非${get.translation(g)}势力角色`;
			});
			return map;
		},
		versus: () => {
			const vmHandlers = {
				standard: () => null,
				two: () => ({ undefined: get.config("replace_character_two") ? "抢先击败敌人<br>所有上场角色" : "协同队友<br>击败所有敌人" }),
				three: () => ({ undefined: get.config("replace_character_two") ? "抢先击败敌人<br>所有上场角色" : "协同队友<br>击败所有敌人" }),
				jiange: () => ({ wei: "击败所有<br>蜀势力角色", shu: "击败所有<br>魏势力角色" }),
				siguo: () => {
					const map = {};
					lib.group.forEach(g => {
						map[g] = `获得龙船或击败<br>非${get.translation(g)}势力角色`;
					});
					return map;
				},
			};
			return vmHandlers[versusMode]?.() || {};
		},
	};

	return handlers[mode]?.() || baseMap;
}

// 初始化身份显示
export function initIdentityShow() {
	if (game.ui_identityShow) return;

	game.ui_identityShow = ui.create.div("", "身份加载中......");
	game.ui_identityShow.style.cssText = "top:1.9px;left:63.5px;z-index:4;";
	ui.arena.appendChild(game.ui_identityShow);

	game.ui_identityShowx = ui.create.div("", "身份加载中......");
	game.ui_identityShowx.style.cssText = "top:1.9px;left:63.5px;z-index:3;";
	ui.arena.appendChild(game.ui_identityShowx);
}

// 更新身份显示
export function updateIdentityShow() {
	const show = game.ui_identityShow;
	const showx = game.ui_identityShowx;
	if (!show || !showx) return;

	let str = "";
	const mode = lib.config.mode;
	const versusMode = get.config("versus_mode");

	if (mode === "guozhan" || (mode === "versus" && ["siguo", "jiange"].includes(versusMode))) {
		// 国战/四国/剑阁模式
		GUOZHAN_IDENTITY_COLORS.forEach(({ key, color }) => {
			const count = game.countPlayer(p => p.identity === key);
			if (count > 0) str += `<font color="${color}">${get.translation(key)}</font> x ${count}  `;
		});
	} else if (mode === "versus" && versusMode === "two") {
		// 双将模式
		const enemy = game.countPlayer(p => p.isEnemyOf(game.me));
		const friend = game.countPlayer(p => p.isFriendOf(game.me));
		if (enemy > 0) str += `<font color="#ff0000">虎</font> x ${enemy}  `;
		if (friend > 0) str += `<font color="#00ff00">龙</font> x ${friend}  `;
	} else {
		// 身份模式
		const counts = {
			zhu: game.countPlayer(p => ["zhu", "rZhu", "bZhu"].includes(p.identity)),
			zhong: game.countPlayer(p => ["zhong", "rZhong", "bZhong", "mingzhong"].includes(p.identity)),
			fan: game.countPlayer(p => ["fan", "rYe", "bYe"].includes(p.identity)),
			nei: game.countPlayer(p => ["nei", "rNei", "bNei"].includes(p.identity)),
		};

		Object.entries(counts).forEach(([key, count]) => {
			if (count > 0) {
				str += `<font color="${IDENTITY_COLORS[key]}">${get.translation(key)}</font> x ${count}  `;
			}
		});
	}

	str += `<br>${game.me?.identity ? (lib.translate[game.me.identity + "_win_option"] ?? "") : ""}`;

	const style1 = "font-family:shousha;font-size:17px;font-weight:500;text-align:right;line-height:20px;color:#C1AD92;text-shadow:none;";
	const style2 = "font-family:shousha;font-size:17px;font-weight:500;text-align:right;line-height:20px;color:#2D241B;-webkit-text-stroke:2.7px #322B20;text-shadow:none;";

	show.innerHTML = `<span style="${style1}">${str}</span>`;
	showx.innerHTML = `<span style="${style2}">${str}</span>`;
}
