/**
 * 移动动画修复模块
 */
import { game } from "noname";

/**
 * 修复移动动画缩放问题
 */
export function fixMoveAnimZoom() {
	if (game._decadeUI_fixMoveAnimZoom) return;
	game._decadeUI_fixMoveAnimZoom = true;

	const normalizeZoom = () => {
		const z = game.documentZoom;
		if (typeof z !== "number" || !isFinite(z) || z <= 0) {
			game.documentZoom = 1;
		}
	};

	// 修复 $swapElement
	if (typeof game.$swapElement === "function") {
		const _swap = game.$swapElement;
		game.$swapElement = function () {
			normalizeZoom();
			return _swap.apply(this, arguments);
		};
	}

	// 修复 $elementGoto
	if (typeof game.$elementGoto === "function") {
		const _goto = game.$elementGoto;
		game.$elementGoto = function (element, parent, position, duration, timefun) {
			normalizeZoom();

			const fromParent = element?.parentElement;
			const toParent = parent;
			const restore = [];

			const forceVisible = p => {
				if (!p?.style) return;
				restore.push([p, p.style.overflow]);
				p.style.overflow = "visible";
			};

			forceVisible(fromParent);
			forceVisible(toParent);

			const restoreOverflow = () => {
				restore.forEach(([p, ov]) => {
					p.style.overflow = ov;
				});
			};

			try {
				const ret = _goto.call(this, element, parent, position, duration, timefun);
				if (ret?.then) return ret.finally(restoreOverflow);
				restoreOverflow();
				return ret;
			} catch (e) {
				restoreOverflow();
				throw e;
			}
		};
	}
}
