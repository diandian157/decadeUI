/**
 * decadeUI.get 模块
 */
import { CubicBezierEase, lerp } from "../animation/index.js";

const NEGATIVE_GOOD_CARDS = new Set(["caomu", "草木皆兵", "fulei", "浮雷", "shandian", "闪电", "bingliang", "兵粮寸断", "lebu", "乐不思蜀"]);

/** 创建decadeUI.get模块 */
export function createDecadeUIGetModule() {
	return {
		judgeEffect(name, value) {
			return NEGATIVE_GOOD_CARDS.has(name) ? value < 0 : value;
		},

		isWebKit: () => document.body.style.WebkitBoxShadow !== undefined,

		lerp,

		ease(fraction) {
			this._bezier3 ??= new CubicBezierEase(0.25, 0.1, 0.25, 1);
			return this._bezier3.ease(fraction);
		},

		extend: (target, source) => (source && typeof source === "object" ? Object.assign(target, source) : target),

		bodySize() {
			const size = decadeUI.dataset.bodySize;
			if (!size.updated) {
				size.updated = true;
				size.height = document.body.clientHeight;
				size.width = document.body.clientWidth;
			}
			return size;
		},

		bestValueCards(cards, player) {
			if (!player) player = _status.event.player;
			const matchs = [],
				basics = [],
				equips = [];
			const hasEquipSkill = player.hasSkill("xiaoji");

			cards.sort((a, b) => get.value(b, player) - get.value(a, player));

			for (let i = 0; i < cards.length; i++) {
				let limited = false;
				const type = get.type(cards[i]);
				if (type === "basic") {
					limited = basics.some(b => !cards[i].toself && b.name === cards[i].name);
					if (!limited) basics.push(cards[i]);
				} else if (type === "equip" && !hasEquipSkill) {
					limited = equips.some(e => get.subtype(e) === get.subtype(cards[i]));
					if (!limited) equips.push(cards[i]);
				}
				if (!limited) {
					matchs.push(cards[i]);
					cards.splice(i--, 1);
				}
			}

			cards.sort((a, b) => get.value(b, player) - get.value(a, player));
			return matchs.concat(cards);
		},

		cheatJudgeCards(cards, judges, friendly) {
			if (!cards || !judges) throw arguments;
			const cheats = [];
			for (const j of judges) {
				const judge = get.judge(j);
				cards.sort((a, b) => (friendly ? judge(b) - judge(a) : judge(a) - judge(b)));
				const cost = judge(cards[0]);
				if ((friendly && cost >= 0) || (!friendly && cost < 0)) cheats.push(cards.shift());
				else break;
			}
			return cheats;
		},

		elementLeftFromWindow: element => element.getBoundingClientRect().left + window.scrollX,

		elementTopFromWindow: element => element.getBoundingClientRect().top + window.scrollY,

		handcardInitPos() {
			const hand = decadeUI.boundsCaches.hand;
			if (!hand.updated) hand.update();
			const { cardWidth: cardW, cardHeight: cardH, cardScale: scale } = hand;
			return {
				x: -Math.round((cardW - cardW * scale) / 2),
				y: (cardH * scale - cardH) / 2,
				scale,
			};
		},
	};
}
