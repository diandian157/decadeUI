/**
 * @fileoverview decadeUI.get模块，提供各种获取器方法
 */
import { CubicBezierEase, lerp } from "../animation/index.js";

/** @type {Set<string>} 负面效果卡牌集合 */
const NEGATIVE_GOOD_CARDS = new Set(["caomu", "草木皆兵", "fulei", "浮雷", "shandian", "闪电", "bingliang", "兵粮寸断", "lebu", "乐不思蜀"]);

/**
 * 创建decadeUI.get模块
 * @returns {Object} get模块对象
 */
export function createDecadeUIGetModule() {
	return {
		/**
		 * 判断判定效果
		 * @param {string} name - 卡牌名称
		 * @param {number} value - 判定值
		 * @returns {number|boolean} 判定结果
		 */
		judgeEffect(name, value) {
			return NEGATIVE_GOOD_CARDS.has(name) ? value < 0 : value;
		},

		/**
		 * 检测是否为WebKit浏览器
		 * @returns {boolean} 是否为WebKit
		 */
		isWebKit: () => document.body.style.WebkitBoxShadow !== undefined,

		lerp,

		/**
		 * 缓动函数
		 * @param {number} fraction - 进度值(0-1)
		 * @returns {number} 缓动后的值
		 */
		ease(fraction) {
			this._bezier3 ??= new CubicBezierEase(0.25, 0.1, 0.25, 1);
			return this._bezier3.ease(fraction);
		},

		/**
		 * 扩展对象属性
		 * @param {Object} target - 目标对象
		 * @param {Object} source - 源对象
		 * @returns {Object} 扩展后的对象
		 */
		extend: (target, source) => (source && typeof source === "object" ? Object.assign(target, source) : target),

		/**
		 * 获取body尺寸
		 * @returns {Object} 包含width和height的对象
		 */
		bodySize() {
			const size = decadeUI.dataset.bodySize;
			if (!size.updated) {
				size.updated = true;
				size.height = document.body.clientHeight;
				size.width = document.body.clientWidth;
			}
			return size;
		},

		/**
		 * 获取最佳价值卡牌排序
		 * @param {Array} cards - 卡牌数组
		 * @param {Object} player - 玩家对象
		 * @returns {Array} 排序后的卡牌数组
		 */
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

		/**
		 * 获取作弊判定卡牌
		 * @param {Array} cards - 可用卡牌
		 * @param {Array} judges - 判定牌
		 * @param {boolean} friendly - 是否友好
		 * @returns {Array} 作弊卡牌数组
		 */
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

		/**
		 * 获取元素相对窗口的左边距
		 * @param {HTMLElement} element - DOM元素
		 * @returns {number} 左边距
		 */
		elementLeftFromWindow: element => element.getBoundingClientRect().left + window.scrollX,

		/**
		 * 获取元素相对窗口的上边距
		 * @param {HTMLElement} element - DOM元素
		 * @returns {number} 上边距
		 */
		elementTopFromWindow: element => element.getBoundingClientRect().top + window.scrollY,

		/**
		 * 获取手牌初始位置
		 * @returns {Object} 包含x、y和scale的位置对象
		 */
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
