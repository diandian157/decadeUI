/**
 * @fileoverview 继承子技能模块
 * @description 用于扩展已有技能的子技能
 * @module skills/sub-skills
 */

import { lib, game, get, _status } from "noname";

/**
 * @type {Object.<string, Object>}
 * @description 继承子技能集合
 */
export const inheritSubSkill = {
	/**
	 * 自若排序
	 * @description 自若技能的手牌排序子技能
	 */
	olziruo: {
		sort: {
			async content(event, trigger, player) {
				event.getParent(2).goto(0);

				if (_status.connectMode || !event.isMine()) {
					player.tempBanSkill("olziruo_sort", {
						player: ["useCard1", "useSkillBegin", "chooseToUseEnd"],
					});
				}

				const next = player.chooseToMove("自若：请整理手牌顺序", true);
				next.set("list", [["手牌", player.getCards("h")]]);
				next.set("processAI", list => {
					const player = get.player();
					const cards = list[0][1].slice();
					cards.sort((a, b) => get.useful(b, player) - get.useful(a, player));
					if (player.storage.olziruo) cards.reverse();
					return [cards];
				});

				const result = await next.forResult();
				if (!result?.bool) return;

				result.moved[0].reverse().forEach(card => {
					player.node.handcards1.insertBefore(card, player.node.handcards1.firstChild);
				});
				decadeUI.queueNextFrameTick(decadeUI.layoutHand, decadeUI);
			},
		},
	},

	/**
	 * 诈死距离显示控制
	 * @description 控制诈死状态下的距离显示
	 */
	jsrgzhasi: {
		undist: {
			init(player) {
				if (player._distanceDisplay) {
					player._distanceDisplay.style.display = "none";
				}
			},
			onremove(player) {
				if (player._distanceDisplay) {
					player._distanceDisplay.style.display = "";
				}
			},
		},
	},
};

/**
 * @type {Object.<string, Object>}
 * @description 势力优化相关技能
 */
export const factionOptimizeSkill = {
	/**
	 * 势力选择
	 * @description 在非国战模式下，当玩家势力不在标准势力列表中时，允许选择势力
	 */
	_slyh: {
		trigger: { global: "gameStart", player: "enterGame" },
		forced: true,
		popup: false,
		silent: true,
		priority: Infinity,
		filter(_, player) {
			return get.mode() !== "guozhan" && player.group && !lib.group.includes(player.group);
		},
		async content() {
			const player = _status.event.player;
			const groups = lib.group.slice(0, 5);
			const result = await player
				.chooseButton(["请选择你的势力", [groups.map(group => ["", "", `group_${group}`]), "vcard"]], true)
				.set("direct", true)
				.set("ai", button => Math.random())
				.forResult();

			if (result?.bool && result.links?.length) {
				const selectedGroup = result.links[0][2].slice(6);
				player.group = selectedGroup;
				player.node.name.dataset.nature = get.groupnature(selectedGroup);
			}
		},
	},
};
