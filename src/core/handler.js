/**
 * @fileoverview 事件处理模块，提供手牌滚动等交互处理
 */
import { lib, game, ui, get, ai, _status } from "noname";

/** @type {number} 滚动步长 */
const SCROLL_STEP = 84;

/**
 * 创建handler模块
 * @returns {Object} handler模块对象
 */
export function createHandlerModule() {
	return {
		/**
		 * 手牌区鼠标滚轮处理
		 * @param {WheelEvent} e - 滚轮事件
		 */
		handMousewheel(e) {
			const hand = ui.handcards1Container;
			if (!hand) return console.error("ui.handcards1Container");

			hand.scrollNum ??= 0;
			hand.lastFrameTime ??= performance.now();

			const handScroll = () => {
				const now = performance.now();
				const delta = now - hand.lastFrameTime;
				let num = Math.round(delta);
				hand.lastFrameTime = now;

				if (hand.scrollNum > 0) {
					num = Math.min(hand.scrollNum, num);
					hand.scrollNum -= num;
				} else {
					num = Math.min(-hand.scrollNum, num);
					hand.scrollNum += num;
					num = -num;
				}

				if (hand.scrollNum === 0) {
					hand.frameId = hand.lastFrameTime = undefined;
				} else {
					hand.frameId = requestAnimationFrame(handScroll);
					hand.scrollLeft += num;
				}
			};

			hand.scrollNum += e.wheelDelta > 0 ? -SCROLL_STEP : SCROLL_STEP;
			hand.frameId ??= requestAnimationFrame(handScroll);
		},
	};
}
