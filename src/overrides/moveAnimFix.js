/**
 * 移动动画修复模块
 */
import { game } from "noname";
import { wrapBefore, wrapAround } from "../utils/safeOverride.js";

export function applyMoveAnimFix() {
	if (game._decadeUI_fixMoveAnimZoom) return [];
	game._decadeUI_fixMoveAnimZoom = true;

	const restoreFns = [];

	const normalizeZoom = () => {
		const z = game.documentZoom;
		if (typeof z !== "number" || !isFinite(z) || z <= 0) {
			game.documentZoom = 1;
		}
	};

	restoreFns.push(wrapBefore(game, "$swapElement", normalizeZoom));

	restoreFns.push(
		wrapAround(game, "$elementGoto", function (original, element, parent, position, duration, timefun) {
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
				const ret = original.call(this, element, parent, position, duration, timefun);
				if (ret?.then) {
					return ret.finally(restoreOverflow);
				}
				restoreOverflow();
				return ret;
			} catch (e) {
				restoreOverflow();
				throw e;
			}
		})
	);

	return restoreFns;
}
