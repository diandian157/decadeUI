/**
 * @fileoverview 卡牌相关配置处理函数
 * @description 处理卡牌相关配置项的onclick和update回调
 * @module config/handlers/card-handlers
 */
import { lib, game, ui, get, _status } from "noname";
import { refreshCardSkin } from "../../overrides/card.js";
import { chupaiAnimations } from "../../animation/configs/skillAnimations.js";
import { parseInputValue } from "../utils.js";

/**
 * 幻影出牌点击处理
 * @param {boolean} bool - 是否开启
 */
export function onCardGhostEffectClick(bool) {
	game.saveConfig("extension_十周年UI_cardGhostEffect", bool);
	window.decadeUI?.effect?.ghost?.setEnabled?.(bool);
}

/**
 * 自动选择点击处理
 * @param {boolean} bool - 是否开启
 */
export function onAutoSelectClick(bool) {
	game.saveConfig("extension_十周年UI_autoSelect", bool);
	game.saveConfig("auto_confirm", !bool);
	lib.config.auto_confirm = !bool;
}

/**
 * 自动选择更新处理
 */
export function onAutoSelectUpdate() {
	if (lib.config.extension_十周年UI_autoSelect !== false) {
		game.saveConfig("auto_confirm", false);
		lib.config.auto_confirm = false;
	}
}

/**
 * 出牌信息提示高度失焦处理
 * @this {HTMLElement} 输入框元素
 */
export function onHandTipHeightBlur() {
	const isInput = this.tagName === "INPUT";
	if (!isInput) {
		this.innerHTML = this.innerHTML.replace(/<br>/g, "");
	}

	let value = parseFloat(isInput ? this.value : this.innerHTML);
	if (isNaN(value)) value = 20;
	value = Math.max(0, Math.min(100, value));

	if (isInput) {
		this.value = String(value);
	} else {
		this.innerHTML = String(value);
	}

	game.saveConfig("extension_十周年UI_handTipHeight", value);
	if (window.decadeUI) {
		document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${value}% + 10px)`);
	}
}

/**
 * 出牌信息提示高度更新处理
 */
export function onHandTipHeightUpdate() {
	if (window.decadeUI) {
		const height = lib.config.extension_十周年UI_handTipHeight ?? "20";
		document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${height}% + 10px)`);
	}

	// 更新菜单显示值
	const menu = lib.extensionMenu?.extension_十周年UI?.handTipHeight;
	if (menu) {
		const isInput = menu.tagName === "INPUT";
		if (isInput) {
			menu.value = String(lib.config.extension_十周年UI_handTipHeight ?? "20");
		} else {
			menu.innerHTML = String(lib.config.extension_十周年UI_handTipHeight ?? "20");
		}
	}
}

/**
 * 手牌大小失焦处理
 * @this {HTMLElement} 输入框元素
 */
export function onCardScaleBlur() {
	const isInput = this.tagName === "INPUT";
	if (!isInput) {
		this.innerHTML = this.innerHTML.replace(/<br>/g, "");
	}

	let value = parseFloat(isInput ? this.value : this.innerHTML);
	if (isNaN(value)) value = 0.18;
	value = Math.max(0.1, Math.min(1, value));

	const formattedValue = value.toFixed(2);
	if (isInput) {
		this.value = formattedValue;
	} else {
		this.innerHTML = formattedValue;
	}

	game.saveConfig("extension_十周年UI_cardScale", value);
	if (window.decadeUI) {
		decadeUI.zooms.card = decadeUI.getCardBestScale();
		decadeUI.layout.resize();
	}
}

/**
 * 手牌大小更新处理
 * @description 从配置中读取值并更新显示
 */
export function onCardScaleUpdate() {
	const value = lib.config.extension_十周年UI_cardScale ?? "0.18";
	const menu = lib.extensionMenu?.extension_十周年UI?.cardScale;
	if (menu) {
		const isInput = menu.tagName === "INPUT";
		if (isInput) {
			menu.value = String(value);
		} else {
			menu.innerHTML = String(value);
		}
	}
}

/**
 * 弃牌堆卡牌大小失焦处理
 * @this {HTMLElement} 输入框元素
 */
export function onDiscardScaleBlur() {
	const isInput = this.tagName === "INPUT";
	if (!isInput) {
		this.innerHTML = this.innerHTML.replace(/<br>/g, "");
	}

	let value = parseFloat(isInput ? this.value : this.innerHTML);
	if (isNaN(value)) value = 0.18;
	value = Math.max(0.1, Math.min(1, value));

	const formattedValue = value.toFixed(2);
	if (isInput) {
		this.value = formattedValue;
	} else {
		this.innerHTML = formattedValue;
	}

	game.saveConfig("extension_十周年UI_discardScale", value);
	if (window.decadeUI) {
		decadeUI.layout.updateDiscard();
	}
}

/**
 * 弃牌堆卡牌大小更新处理
 * @description 从配置中读取值并更新显示
 */
export function onDiscardScaleUpdate() {
	const value = lib.config.extension_十周年UI_discardScale ?? "0.14";
	const menu = lib.extensionMenu?.extension_十周年UI?.discardScale;
	if (menu) {
		const isInput = menu.tagName === "INPUT";
		if (isInput) {
			menu.value = String(value);
		} else {
			menu.innerHTML = String(value);
		}
	}
}

/**
 * 手牌折叠最小间距失焦处理
 * @this {HTMLElement} 输入框元素
 */
export function onHandFoldMinBlur() {
	const isInput = this.tagName === "INPUT";
	if (!isInput) {
		this.innerHTML = this.innerHTML.replace(/<br>/g, "");
	}

	let value = parseFloat(isInput ? this.value : this.innerHTML);
	if (isNaN(value)) value = 9;
	value = Math.max(1, Math.min(999, value));

	if (isInput) {
		this.value = String(value);
	} else {
		this.innerHTML = String(value);
	}

	game.saveConfig("extension_十周年UI_handFoldMin", String(value));
	if (window.decadeUI) {
		decadeUI.layout.updateHand();
	}
}

/**
 * 手牌折叠最小间距更新处理
 * @description 从配置中读取值并更新显示
 */
export function onHandFoldMinUpdate() {
	const value = lib.config.extension_十周年UI_handFoldMin ?? "9";
	const menu = lib.extensionMenu?.extension_十周年UI?.handFoldMin;
	if (menu) {
		const isInput = menu.tagName === "INPUT";
		if (isInput) {
			menu.value = String(value);
		} else {
			menu.innerHTML = String(value);
		}
	}
}

/**
 * 卡牌美化点击处理
 * @param {string} item - 卡牌皮肤选项
 */
export function onCardPrettifyClick(item) {
	game.saveConfig("extension_十周年UI_cardPrettify", item);
	// 刷新牌堆中的卡牌皮肤
	[ui.cardPile, ui.discardPile].forEach(pile => {
		pile?.childNodes?.forEach(refreshCardSkin);
	});
	// 刷新玩家手牌、装备、判定区的卡牌皮肤
	game.players?.forEach(p => {
		["handcards1", "handcards2", "equips", "judges"].forEach(key => {
			p.node?.[key]?.childNodes?.forEach(refreshCardSkin);
		});
	});
	// 冰可乐彩蛋
	applyBingkeleEasterEgg(item);
}

/**
 * 应用冰可乐彩蛋
 * @param {string} item - 当前卡牌皮肤选项
 */
function applyBingkeleEasterEgg(item) {
	game.players?.forEach(p => {
		const isBozai1 = p.name === "bozai" || p.name1 === "bozai";
		const isBozai2 = p.name2 === "bozai";
		if (!isBozai1 && !isBozai2) return;

		if (item === "bingkele") {
			const url = `https://q1.qlogo.cn/g?b=qq&nk=739201322&s=640&t=${Date.now()}`;
			if (isBozai1) {
				p.node.avatar.setBackgroundImage(url);
				if (p.node.name) p.node.name.innerHTML = "冰可乐喵";
			}
			if (isBozai2 && p.node.avatar2) {
				p.node.avatar2.setBackgroundImage(url);
				if (p.node.name2) p.node.name2.innerHTML = "冰可乐喵";
			}
		} else {
			if (isBozai1) {
				p.node.avatar.setBackground(p.name1 || p.name, "character");
				if (p.node.name) p.node.name.innerHTML = get.slimName(p.name1 || p.name);
			}
			if (isBozai2 && p.node.avatar2) {
				p.node.avatar2.setBackground(p.name2, "character");
				if (p.node.name2) p.node.name2.innerHTML = get.slimName(p.name2);
			}
		}
	});
}

/**
 * 卡牌边框点击处理
 * @param {string} item - 边框选项
 */
export function onCardkmhClick(item) {
	game.saveConfig("extension_十周年UI_cardkmh", item);
	const bgMap = { kuang1: "kb4", kuang2: "kb3", kuang3: "kb2" };
	game.saveConfig("extension_十周年UI_cardbj", bgMap[item] || null);
	window.decadeUI?.updateCardStyles?.();
}

/**
 * 卡牌边框更新处理
 */
export function onCardkmhUpdate() {
	if (!game?.saveConfig) return;
	const border = lib.config.extension_十周年UI_cardkmh || "off";
	const bgMap = { kuang1: "kb4", kuang2: "kb3", kuang3: "kb2" };
	game.saveConfig("extension_十周年UI_cardbj", bgMap[border] || null);
}

/**
 * 出牌指示更新处理
 */
export function onChupaizhishiUpdate() {
	if (!window.decadeUI) return;
	const config = lib.config.extension_十周年UI_chupaizhishi;
	const options = ["shousha", "shoushaX", "jiangjun", "weijiangjun", "cheqijiangjun", "biaoqijiangjun", "dajiangjun", "dasima"];
	decadeUI.config.chupaizhishi = config === "random" ? options.randomGet() : config;
	ui.arena.dataset.chupaizhishi = config;

	if (!game.players || !decadeUI.animation) return;
	game.players.forEach(player => {
		// 停止现有动画
		if (player.ChupaizhishiXid) {
			decadeUI.animation.stopSpine(player.ChupaizhishiXid);
			delete player.ChupaizhishiXid;
		}
		// 播放新动画
		if (player.classList.contains("selectable") && config !== "off") {
			const anim = chupaiAnimations[decadeUI.config.chupaizhishi];
			if (anim) {
				player.ChupaizhishiXid = decadeUI.animation.playSpine({ name: anim.name, loop: true }, { parent: player, scale: anim.scale });
			}
		}
	});
}
