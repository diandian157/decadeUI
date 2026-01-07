/**
 * @fileoverview 整体外观配置处理函数
 * @description 处理外观相关配置项的onclick和update回调
 * @module config/handlers/appearance-handlers
 */
import { lib, game, ui, _status } from "noname";
import { UI_ANIMATION } from "../../constants.js";

/**
 * 扩展开关点击处理
 * @description 一键关闭/恢复其他扩展
 */
export function onExtensionToggleClick() {
	window.decadeUI?.toggleExtensions?.();
}

/**
 * 扩展开关更新处理
 * @description 更新菜单显示文本
 */
export function onExtensionToggleUpdate() {
	const key = "extension_十周年UI_closedExtensions";
	const closed = Array.isArray(lib.config[key]) ? lib.config[key] : [];
	const menu = lib.extensionMenu?.extension_十周年UI?.extensionToggle;
	if (menu) {
		menu.name = closed.length > 0 ? `<ins>一键恢复 ${closed.length} 个扩展</ins>` : "<ins>一键关闭其他扩展</ins>";
	}
}

/**
 * 切换样式点击处理
 * @param {string} control - 选择的样式值
 */
export function onNewDecadeStyleClick(control) {
	const origin = lib.config.extension_十周年UI_newDecadeStyle;
	game.saveConfig("extension_十周年UI_newDecadeStyle", control);
	if (origin !== control) {
		setTimeout(() => game.reload(), UI_ANIMATION.RELOAD_DELAY);
	}
}

/**
 * 切换样式更新处理
 * @description 更新arena的dataset属性
 */
export function onNewDecadeStyleUpdate() {
	if (!window.decadeUI) return;
	const style = lib.config.extension_十周年UI_newDecadeStyle;
	ui.arena.dataset.newDecadeStyle = style;
	const decadeLayoutStyles = ["on", "othersOff", "onlineUI", "babysha", "codename"];
	ui.arena.dataset.decadeLayout = decadeLayoutStyles.includes(style) ? "on" : "off";
}

/**
 * 左右布局点击处理
 * @param {string} item - 布局选项
 */
export function onRightLayoutClick(item) {
	lib.config.extension_十周年UI_rightLayout = item ?? "off";
	game.saveConfig("extension_十周年UI_rightLayout", item);
	game.reload();
}

/**
 * 左右布局更新处理
 */
export function onRightLayoutUpdate() {
	const layout = lib.config.extension_十周年UI_rightLayout;
	if (layout === "on" || layout === "off") {
		ui.arena.dataset.rightLayout = layout;
	}
}

/**
 * 露头样式点击处理
 * @param {string} item - 露头样式选项
 */
export function onOutcropSkinClick(item) {
	game.saveConfig("extension_十周年UI_outcropSkin", item);
	if (window.decadeUI) {
		ui.arena.dataset.outcropSkin = item;
		decadeUI.clearOutcropCache?.();
		const players = [...(game.players || []), ...(game.dead || [])];
		players.forEach(player => {
			if (!player?.node) return;
			const name1 = player.name1 || player.name;
			if (player.node.avatar && name1) {
				player.node.avatar.setBackground(name1, "character");
			}
			if (player.node.avatar2 && player.name2) {
				player.node.avatar2.setBackground(player.name2, "character");
			}
		});
	}
}

/**
 * 露头样式更新处理
 */
export function onOutcropSkinUpdate() {
	if (!window.decadeUI) return;
	const style = lib.config.extension_十周年UI_outcropSkin;
	ui.arena.dataset.outcropSkin = style;
	decadeUI.updateAllOutcropAvatars?.(style);
}

/**
 * 等阶边框更新处理
 */
export function onBorderLevelUpdate() {
	if (!window.decadeUI) return;
	const value = lib.config.extension_十周年UI_borderLevel;
	ui.arena.dataset.borderLevel = value;
	ui.arena.dataset.longLevel = value;

	if (!_status.gameStarted) return;
	const players = ui.arena?.querySelectorAll?.(".player") || [];
	if (value === "random") {
		const levels = ["one", "two", "three", "four", "five"];
		players.forEach(p => {
			const level = p === game.me ? "five" : levels[Math.floor(Math.random() * levels.length)];
			p.dataset.borderLevel = level;
			p.dataset.longLevel = level;
		});
	} else {
		players.forEach(p => {
			delete p.dataset.borderLevel;
			delete p.dataset.longLevel;
		});
	}
}

/**
 * 单独装备栏更新处理
 */
export function onAloneEquipUpdate() {
	const config = lib.config.extension_十周年UI_aloneEquip;
	if (window.decadeUI) {
		ui.arena.dataset.aloneEquip = config ? "on" : "off";
	}
	_status.nopopequip = config;

	if (!_status.gameStarted || !ui?.equipSolts) return;

	try {
		ui.equipSolts.style.display = config ? "" : "none";
	} catch (e) {}

	if (config && game.me !== ui.equipSolts.me) {
		ui.equipSolts.me?.appendChild(ui.equipSolts.equips);
		ui.equipSolts.me = game.me;
		ui.equipSolts.equips = game.me.node.equips;
		ui.equipSolts.appendChild(game.me.node.equips);
		game.me.$syncExpand();
	}
	if (!config && game.me === ui.equipSolts.me) {
		ui.equipSolts.me.appendChild(ui.equipSolts.equips);
		ui.equipSolts.me = undefined;
	}
	game.uncheck();
	game.check();
}

/**
 * 菜单美化点击处理
 * @param {boolean} bool - 是否开启
 */
export function onMeanPrettifyClick(bool) {
	game.saveConfig("extension_十周年UI_meanPrettify", bool);
	ui.css.decadeMenu?.remove();
	delete ui.css.decadeMenu;
	if (bool) {
		ui.css.decadeMenu = lib.init.css(`${window.decadeUIPath}src/styles`, "menu");
	}
}

/**
 * 动态皮肤点击处理
 * @param {boolean} value - 是否开启
 */
export function onDynamicSkinClick(value) {
	game.saveConfig("extension_十周年UI_dynamicSkin", value);
	lib.config.dynamicSkin = value;
	game.saveConfig("dynamicSkin", value);
}

/**
 * 动皮露头更新处理
 */
export function onDynamicSkinOutcropUpdate() {
	if (!window.decadeUI) return;
	const enable = lib.config.extension_十周年UI_dynamicSkinOutcrop;
	ui.arena.dataset.dynamicSkinOutcrop = enable ? "on" : "off";
	game.players?.forEach(player => {
		if (player.dynamic) {
			player.dynamic.outcropMask = enable;
			player.dynamic.update(false);
		}
	});
}
