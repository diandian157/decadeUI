/**
 * 事件处理模块
 */
import { lib, game, ui, get, ai, _status } from "noname";

/** 创建handler模块 */
export function createHandlerModule() {
	return {
		handMousewheel(e) {
			if (!ui.handcards1Container) return console.error("ui.handcards1Container");
			const hand = ui.handcards1Container;
			if (hand.scrollNum === undefined) hand.scrollNum = 0;
			if (hand.lastFrameTime === undefined) hand.lastFrameTime = performance.now();

			function handScroll() {
				const now = performance.now();
				const delta = now - hand.lastFrameTime;
				let num = Math.round((delta / 16) * 16);
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
					hand.frameId = undefined;
					hand.lastFrameTime = undefined;
				} else {
					hand.frameId = requestAnimationFrame(handScroll);
					ui.handcards1Container.scrollLeft += num;
				}
			}

			hand.scrollNum += e.wheelDelta > 0 ? -84 : 84;
			if (hand.frameId === undefined) hand.frameId = requestAnimationFrame(handScroll);
		},
	};
}
