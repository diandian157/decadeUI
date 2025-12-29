/**
 * @fileoverview 布局初始化模块
 * 提供游戏布局的初始化和切换功能
 */

import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建布局初始化函数
 * @returns {Function} 布局初始化函数
 */
export function createLayoutInit() {
	/**
	 * 初始化布局
	 * @param {string} layout - 布局名称
	 * @param {boolean} [nosave] - 是否不保存配置
	 */
	return function (layout, nosave) {
		if (!nosave) game.saveConfig("layout", layout);
		game.layout = layout;

		/**
		 * 重新布局
		 */
		const relayout = function () {
			ui.arena.dataset.layout = game.layout;
			if (lib.config.phonelayout) {
				ui.css.phone.href = lib.assetURL + "layout/default/phone.css";
				ui.arena.classList.add("phone");
				ui.arena.setAttribute("data-phonelayout", "on");
			} else {
				ui.css.phone.href = "";
				ui.arena.classList.remove("phone");
				ui.arena.setAttribute("data-phonelayout", "off");
			}

			for (const p of game.players) {
				if (get.is.linked2(p)) {
					if (p.classList.contains("linked")) {
						p.classList.remove("linked");
						p.classList.add("linked2");
					}
				} else {
					if (p.classList.contains("linked2")) {
						p.classList.remove("linked2");
						p.classList.add("linked");
					}
				}
			}

			ui.updatej();
			ui.updatem();
			setTimeout(() => {
				if (game.me) game.me.update();
				setTimeout(() => ui.updatex(), 500);
				setTimeout(() => ui.updatec(), 1000);
			}, 100);
		};
		setTimeout(relayout, 500);
	};
}
