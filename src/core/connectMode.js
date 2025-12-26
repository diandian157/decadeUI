/**
 * 联机模式模块
 */
import { lib, ui, _status } from "noname";

/**
 * 设置联机模式监听
 */
export function setupConnectMode() {
	Object.defineProperties(_status, {
		connectMode: {
			configurable: true,
			get() {
				return this._connectMode;
			},
			set(value) {
				this._connectMode = value;
				if (!value || !lib.extensions) return;

				const decadeExtension = lib.extensions.find(ext => ext[0] === decadeUIName);
				if (!decadeExtension) return;

				const startBeforeFunction = lib.init.startBefore;
				lib.init.startBefore = function (...args) {
					try {
						_status.extension = decadeExtension[0];
						_status.evaluatingExtension = decadeExtension[3];
						decadeExtension[1](decadeExtension[2], decadeExtension[4]);
						delete _status.extension;
						delete _status.evaluatingExtension;
						console.log(`%c${decadeUIName}: 联机成功`, "color:blue");
					} catch (e) {
						console.error(e);
					}
					startBeforeFunction?.apply(this, args);
				};
			},
		},
		_connectMode: { value: false, writable: true },
	});
}

/**
 * 设置布局可视化菜单
 */
export function setupLayoutVisualMenu() {
	lib.configMenu.appearence.config.layout.visualMenu = (node, link) => {
		node.className = `button character themebutton ${lib.config.theme}`;
		node.classList.add(link);
		if (node.created) return;

		node.created = true;
		node.style.overflow = "scroll";
		const list = ["re_caocao", "re_liubei", "sp_zhangjiao", "sunquan"];

		while (list.length) {
			ui.create.div(".avatar", ui.create.div(".seat-player.fakeplayer", node)).setBackground(list.randomRemove(), "character");
		}
	};
}
