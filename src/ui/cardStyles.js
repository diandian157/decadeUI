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

/** 初始化卡牌样式 */
export function setupCardStyles() {
	// 卡牌边框样式
	const borderImageName = lib.config.extension_十周年UI_cardkmh;
	if (borderImageName && borderImageName !== "off") {
		const borderUrl = `${lib.assetURL}extension/十周年UI/assets/image/${borderImageName}.png`;
		const borderBase = `border: 1px solid; border-radius: 10px; border-image-source: url('${borderUrl}'); border-image-slice: 17;`;

		addStyle(`
			.hand-cards > .handcards > .card {
				margin: 0; width: 108px; height: 150px; position: absolute;
				transition-property: transform, opacity, left, top;
				${borderBase} border-image-width: 20px; z-index: 51;
			}
			#arena > .card,
			#arena.oblongcard:not(.chess) > .card,
			#arena.oblongcard:not(.chess) .handcards > .card {
				width: 108px; height: 150px;
				${borderBase} border-image-width: 16px;
			}
		`);
	}

	// 卡牌背景样式
	const cardBg = lib.config.extension_十周年UI_cardbj;
	if (cardBg && cardBg !== "kb1") {
		addStyle(`.card:empty, .card.infohidden { background: url('${lib.assetURL}extension/十周年UI/assets/image/${cardBg}.png'); background-size: 100% 100% !important; }`);
	}
}
