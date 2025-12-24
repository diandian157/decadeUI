/**
 * decadeUI.get 模块
 */
import { CubicBezierEase } from "../animation/index.js";

/** 创建decadeUI.get模块 */
export function createDecadeUIGetModule() {
	return {
		judgeEffect(name, value) {
			const negativeGood = new Set(["caomu", "草木皆兵", "fulei", "浮雷", "shandian", "闪电", "bingliang", "兵粮寸断", "lebu", "乐不思蜀"]);
			return negativeGood.has(name) ? value < 0 : value;
		},

		isWebKit() {
			return document.body.style.WebkitBoxShadow !== undefined;
		},

		lerp(min, max, fraction) {
			return (max - min) * fraction + min;
		},

		ease(fraction) {
			if (!decadeUI.get._bezier3) {
				decadeUI.get._bezier3 = new CubicBezierEase(0.25, 0.1, 0.25, 1);
			}
			return decadeUI.get._bezier3.ease(fraction);
		},

		extend(target, source) {
			if (source === null || typeof source !== "object") return target;
			const keys = Object.keys(source);
			let i = keys.length;
			while (i--) target[keys[i]] = source[keys[i]];
			return target;
		},

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
					for (const b of basics) {
						if (!cards[i].toself && b.name === cards[i].name) {
							limited = true;
							break;
						}
					}
					if (!limited) basics.push(cards[i]);
				} else if (type === "equip" && !hasEquipSkill) {
					for (const e of equips) {
						if (get.subtype(e) === get.subtype(cards[i])) {
							limited = true;
							break;
						}
					}
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

		elementLeftFromWindow(element) {
			let left = element.offsetLeft,
				current = element.offsetParent;
			while (current) {
				left += current.offsetLeft;
				current = current.offsetParent;
			}
			return left;
		},

		elementTopFromWindow(element) {
			let top = element.offsetTop,
				current = element.offsetParent;
			while (current) {
				top += current.offsetTop;
				current = current.offsetParent;
			}
			return top;
		},

		handcardInitPos() {
			const hand = dui.boundsCaches.hand;
			if (!hand.updated) hand.update();
			const cardW = hand.cardWidth,
				cardH = hand.cardHeight,
				scale = hand.cardScale;
			return {
				x: -Math.round((cardW - cardW * scale) / 2),
				y: (cardH * scale - cardH) / 2,
				scale,
			};
		},
	};
}
