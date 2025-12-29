/**
 * @fileoverview 卡牌样式模块，包含卡牌边框和卡牌背景样式管理
 */
import { lib, _status } from "noname";

// ==================== 动态样式元素引用 ====================

/** @type {HTMLStyleElement|null} 边框样式元素 */
let borderStyleEl = null;

/** @type {HTMLStyleElement|null} 背景样式元素 */
let bgStyleEl = null;

/**
 * 添加或更新样式
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
 * 生成边框CSS
 * @param {string} borderName - 边框名称
 * @param {string} selector - CSS选择器
 * @param {number} imageWidth - 边框图片宽度
 * @returns {string} CSS字符串
 */
const getBorderCSS = (borderName, selector, imageWidth) => {
	if (!borderName || borderName === "off") return "";
	const url = `${lib.assetURL}extension/十周年UI/image/ui/card/${borderName}.png`;
	return `${selector} { width: 108px; height: 150px; border: 1px solid; border-radius: 10px; border-image-source: url('${url}'); border-image-slice: 17; border-image-width: ${imageWidth}px; }`;
};

/**
 * 等阶→边框映射：five→大司马，four→大将军，three/two→国都护，one→无
 * @type {Object.<string, string|null>}
 */
const levelToBorder = { five: "kuang1", four: "kuang2", three: "kuang3", two: "kuang3", one: null };

/**
 * 等阶→卡背映射
 * @type {Object.<string, string|null>}
 */
const levelToBg = { five: "kb4", four: "kb3", three: "kb2", two: "kb2", one: null };

/**
 * 检查功能是否启用（主玩家选了cardkmh才生效）
 * @returns {boolean} 是否启用
 */
function isFeatureEnabled() {
	const config = lib.config.extension_十周年UI_cardkmh;
	return config && config !== "off";
}

/**
 * 根据玩家获取边框名（主玩家用配置，其他玩家用等阶）
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
 * 根据玩家获取卡背名
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
	if (bg && (card.classList.contains("infohidden") || card.classList.contains("infoflip") || !card.childElementCount)) {
		const bgUrl = `${lib.assetURL}extension/十周年UI/image/ui/card/${bg}.png`;
		card.style.setProperty("background", `url('${bgUrl}')`, "important");
		card.style.setProperty("background-size", "100% 100%", "important");
	}
}

/**
 * 更新主玩家手牌区样式（支持热更新）
 * @returns {void}
 */
export function updateCardStyles() {
	const borderConfig = lib.config.extension_十周年UI_cardkmh;
	const cardBg = lib.config.extension_十周年UI_cardbj;
	const selector = ".hand-cards > .handcards > .card";

	// 更新边框样式（关闭时清空）
	borderStyleEl = updateStyle(borderStyleEl, getBorderCSS(borderConfig, selector, 20));

	// 更新卡背样式（关闭时清空，使用本体卡背）
	const bgCSS = cardBg ? `${selector}:empty, ${selector}.infohidden { background: url('${lib.assetURL}extension/十周年UI/image/ui/card/${cardBg}.png'); background-size: 100% 100% !important; }` : "";
	bgStyleEl = updateStyle(bgStyleEl, bgCSS);
}

/**
 * 初始化卡牌样式
 * @returns {void}
 */
export function setupCardStyles() {
	// 主玩家手牌基础布局（只需添加一次）
	const baseStyle = document.createElement("style");
	baseStyle.innerHTML = `
		.hand-cards > .handcards > .card {
			margin: 0; width: 108px; height: 150px; position: absolute;
			transition-property: transform, opacity, left, top;
			z-index: 51;
		}
	`;
	document.head.appendChild(baseStyle);

	// 初始化动态样式
	updateCardStyles();
}
