/**
 * @fileoverview 卡牌样式模块
 * @description 管理卡牌边框和卡背样式，支持根据玩家等阶动态切换
 */
import { lib, game, _status } from "noname";

/**
 * 边框样式元素
 * @type {HTMLStyleElement|null}
 */
let borderStyleEl = null;

/**
 * 卡背样式元素
 * @type {HTMLStyleElement|null}
 */
let bgStyleEl = null;

/**
 * 添加或更新样式元素
 * @param {HTMLStyleElement|null} styleEl - 样式元素
 * @param {string} css - CSS内容
 * @returns {HTMLStyleElement} 样式元素
 */
const updateStyle = (styleEl, css) => {
	if (!styleEl) {
		styleEl = document.createElement("style");
		document.head.appendChild(styleEl);
	}
	styleEl.innerHTML = css;
	return styleEl;
};

/**
 * 生成卡牌边框CSS
 * @param {string} borderName - 边框名称（kuang1/kuang2/kuang3/off）
 * @param {string} selector - CSS选择器
 * @param {number} imageWidth - 边框图片宽度（像素）
 * @returns {string} CSS字符串
 */
const getBorderCSS = (borderName, selector, imageWidth) => {
	if (!borderName || borderName === "off") return "";
	const url = `${lib.assetURL}extension/十周年UI/image/ui/card/${borderName}.png`;
	return `${selector} { width: 108px; height: 150px; border: 1px solid; border-radius: 10px; border-image-source: url('${url}'); border-image-slice: 17; border-image-width: ${imageWidth}px; }`;
};

/**
 * 等阶到边框的映射表
 * @description five=大司马, four=大将军, three/two=国都护, one=无边框
 * @type {Object.<string, string|null>}
 */
const levelToBorder = { five: "kuang1", four: "kuang2", three: "kuang3", two: "kuang3", one: null };

/**
 * 等阶到卡背的映射表
 * @type {Object.<string, string|null>}
 */
const levelToBg = { five: "kb4", four: "kb3", three: "kb2", two: "kb2", one: null };

/**
 * 检查卡牌样式功能是否启用
 * @description 只有主玩家选择了边框样式才会启用
 * @returns {boolean} 是否启用
 */
function isFeatureEnabled() {
	const config = lib.config.extension_十周年UI_cardkmh;
	return config && config !== "off";
}

/**
 * 根据玩家获取边框名称
 * @description 主玩家使用配置的边框，其他玩家根据等阶自动匹配
 * @param {HTMLElement} player - 玩家元素
 * @param {boolean} isMe - 是否为主玩家
 * @returns {string|null} 边框名称
 */
function getBorderByPlayer(player, isMe) {
	if (!player) return null;
	if (isMe) {
		const config = lib.config.extension_十周年UI_cardkmh;
		return config && config !== "off" ? config : null;
	}
	if (!isFeatureEnabled()) return null;
	const level = player.dataset?.borderLevel || lib.config.extension_十周年UI_borderLevel || "five";
	return level in levelToBorder ? levelToBorder[level] : "kuang1";
}

/**
 * 根据玩家获取卡背名称
 * @description 主玩家使用配置的卡背，其他玩家根据等阶自动匹配
 * @param {HTMLElement} player - 玩家元素
 * @param {boolean} isMe - 是否为主玩家
 * @returns {string|null} 卡背名称
 */
function getBgByPlayer(player, isMe) {
	if (!player) return null;
	if (isMe) {
		return lib.config.extension_十周年UI_cardbj || null;
	}
	if (!isFeatureEnabled()) return null;
	const level = player.dataset?.borderLevel || lib.config.extension_十周年UI_borderLevel || "five";
	return levelToBg[level] || null;
}

/**
 * 为卡牌应用边框和卡背样式
 * @description 根据玩家等阶或配置动态设置卡牌外观
 * @param {HTMLElement} card - 卡牌元素
 * @param {HTMLElement} player - 玩家元素
 * @param {boolean} [isMe=false] - 是否为主玩家
 * @returns {void}
 */
export function applyCardBorder(card, player, isMe = false) {
	const border = getBorderByPlayer(player, isMe);

	if (border) {
		const borderUrl = `${lib.assetURL}extension/十周年UI/image/ui/card/${border}.png`;
		Object.assign(card.style, {
			width: "108px",
			height: "150px",
			border: "1px solid",
			borderRadius: "10px",
			borderImageSource: `url('${borderUrl}')`,
			borderImageSlice: "17",
			borderImageWidth: "16px",
		});
	}

	const bg = getBgByPlayer(player, isMe);
	if (bg && !card.dataset.identityCard && (card.classList.contains("infohidden") || card.classList.contains("infoflip") || !card.childElementCount)) {
		const bgUrl = `${lib.assetURL}extension/十周年UI/image/ui/card/${bg}.png`;
		card.style.setProperty("background", `url('${bgUrl}')`, "important");
		card.style.setProperty("background-size", "100% 100%", "important");
		if (card.classList.contains("infohidden") || card.classList.contains("infoflip")) {
			card.innerHTML = "";
		}
	}
}

/**
 * 更新主玩家手牌区样式
 * @description 根据配置动态更新手牌边框和卡背，支持热更新
 * @returns {void}
 */
export function updateCardStyles() {
	const borderConfig = lib.config.extension_十周年UI_cardkmh;
	const cardBg = lib.config.extension_十周年UI_cardbj;
	const selector = ".hand-cards > .handcards > .card";

	borderStyleEl = updateStyle(borderStyleEl, getBorderCSS(borderConfig, selector, 20));

	const bgCSS = cardBg ? `${selector}:empty, ${selector}.infohidden { background: url('${lib.assetURL}extension/十周年UI/image/ui/card/${cardBg}.png'); background-size: 100% 100% !important; }` : "";
	bgStyleEl = updateStyle(bgStyleEl, bgCSS);
}

/**
 * 初始化卡牌样式系统
 * @description 设置手牌基础布局并启动样式监听
 * @returns {void}
 */
export function setupCardStyles() {
	const baseStyle = document.createElement("style");
	baseStyle.innerHTML = `
		.hand-cards > .handcards > .card {
			margin: 0; width: 108px; height: 150px; position: absolute;
			transition-property: transform, opacity, left, top;
			z-index: 51;
		}
	`;
	document.head.appendChild(baseStyle);

	updateCardStyles();
	setupDialogCardObserver();
}

/**
 * 监听对话框中的卡牌变化
 * @description 自动为对话框中的隐藏卡牌应用卡背样式
 * @returns {void}
 */
function setupDialogCardObserver() {
	const observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if (node.nodeType === 1) {
					if (node.classList?.contains("dialog")) {
						setTimeout(() => processDialogCards(node), 50);
					}
					const dialogs = node.querySelectorAll?.(".dialog");
					dialogs?.forEach(dialog => setTimeout(() => processDialogCards(dialog), 50));
				}
			});
		});
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	document.querySelectorAll(".dialog").forEach(dialog => setTimeout(() => processDialogCards(dialog), 50));
}

/**
 * 处理对话框中的卡牌样式
 * @description 为对话框中的隐藏卡牌应用卡背，排除身份牌
 * @param {HTMLElement} dialog - 对话框元素
 * @returns {void}
 */
function processDialogCards(dialog) {
	if (!isFeatureEnabled()) return;

	const cards = dialog.querySelectorAll(".card.infohidden, .card.infoflip");
	if (!cards.length) return;

	const sourcePlayer = _status.event?.target;
	const isMe = !sourcePlayer || sourcePlayer === game.me;
	const bgName = getBgByPlayer(sourcePlayer || game.me, isMe);

	cards.forEach(card => {
		if (card.dataset.identityCard) return;

		if (card.innerHTML) card.innerHTML = "";

		if (bgName) {
			const bgUrl = `${lib.assetURL}extension/十周年UI/image/ui/card/${bgName}.png`;
			card.style.setProperty("background-image", `url('${bgUrl}')`, "important");
			card.style.setProperty("background-size", "100% 100%", "important");
		} else {
			card.style.removeProperty("background-image");
			card.style.removeProperty("background-size");
		}
	});
}
