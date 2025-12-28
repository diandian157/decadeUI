/**
 * 事件处理模块
 */
import { lib, game, ui, get, ai, _status } from "noname";

const SCROLL_STEP = 84;

/** 创建handler模块 */
export function createHandlerModule() {
	return {
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
