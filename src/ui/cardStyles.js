/**
 * 卡牌样式模块
 * 包含：卡牌边框、卡牌背景
 */
import { lib } from "noname";

/** 添加样式到页面 */
const addStyle = css => {
	const style = document.createElement("style");
	style.innerHTML = css;
	document.head.appendChild(style);
};

/** 生成边框CSS */
const getBorderCSS = (borderName, selector, imageWidth) => {
	if (!borderName || borderName === "off") return "";
	const url = `${lib.assetURL}extension/十周年UI/assets/image/${borderName}.png`;
	return `${selector} { width: 108px; height: 150px; border: 1px solid; border-radius: 10px; border-image-source: url('${url}'); border-image-slice: 17; border-image-width: ${imageWidth}px; }`;
};

/** 等阶→边框/卡背映射：five→大司马，four→大将军，three/two→国都护，one→无 */
const levelToBorder = { five: "kuang1", four: "kuang2", three: "kuang3", two: "kuang3", one: null };
const levelToBg = { five: "kb4", four: "kb3", three: "kb2", two: "kb2", one: null };

/** 根据玩家获取边框名（主玩家用配置，其他玩家用等阶） */
function getBorderByPlayer(player, isMe) {
	if (!player) return null;
	if (isMe) {
		// 主玩家使用配置的边框
		const config = lib.config.extension_十周年UI_cardkmh;
		return config && config !== "off" ? config : null;
	}
	// 其他玩家根据等阶（one返回null表示无边框）
	const level = player.dataset?.borderLevel || lib.config.extension_十周年UI_borderLevel || "five";
	return level in levelToBorder ? levelToBorder[level] : "kuang1";
}

/** 根据玩家获取卡背名 */
function getBgByPlayer(player, isMe) {
	if (!player) return null;
	if (isMe) {
		// 主玩家使用配置的卡背
		return lib.config.extension_十周年UI_cardbj || null;
	}
	// 其他玩家根据等阶
	const level = player.dataset?.borderLevel || lib.config.extension_十周年UI_borderLevel || "five";
	return level in levelToBg ? levelToBg[level] : "kb4";
}

/** 为卡牌应用边框和卡背样式 */
export function applyCardBorder(card, player, isMe = false) {
	const border = getBorderByPlayer(player, isMe);

	// 应用边框
	if (border) {
		const borderUrl = `${lib.assetURL}extension/十周年UI/assets/image/${border}.png`;
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

	// 应用卡背（仅对背面朝上的牌）
	const bg = getBgByPlayer(player, isMe);
	if (bg && bg !== "kb1" && (card.classList.contains("infohidden") || card.classList.contains("infoflip") || !card.childElementCount)) {
		const bgUrl = `${lib.assetURL}extension/十周年UI/assets/image/${bg}.png`;
		card.style.setProperty("background", `url('${bgUrl}')`, "important");
		card.style.setProperty("background-size", "100% 100%", "important");
	}
}

/** 初始化卡牌样式 */
export function setupCardStyles() {
	const borderConfig = lib.config.extension_十周年UI_cardkmh;

	// 主玩家手牌基础布局
	addStyle(`
		.hand-cards > .handcards > .card {
			margin: 0; width: 108px; height: 150px; position: absolute;
			transition-property: transform, opacity, left, top;
			z-index: 51;
		}
	`);

	// 主玩家边框：使用用户选择的边框
	if (borderConfig && borderConfig !== "off") {
		addStyle(getBorderCSS(borderConfig, ".hand-cards > .handcards > .card", 20));
	}

	// 主玩家卡背样式（仅限手牌区，其他区域由JS动态设置）
	const cardBg = lib.config.extension_十周年UI_cardbj;
	if (cardBg && cardBg !== "kb1") {
		addStyle(`.hand-cards > .handcards > .card:empty, .hand-cards > .handcards > .card.infohidden { background: url('${lib.assetURL}extension/十周年UI/assets/image/${cardBg}.png'); background-size: 100% 100% !important; }`);
	}
}
