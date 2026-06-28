// 卡牌移动模块路由入口
// 根据当前样式动态加载对应的 card-movement 实现，如不存在则回退到默认版本
const style = lib.config.extension_十周年UI_newDecadeStyle || "on";

let targetModule;
if (style !== "on" && style !== "off" && style !== "othersOff") {
	const styleFile = `extension/十周年UI/src/overrides/player/card-movement-${style}.js`;
	const exists = await new Promise((resolve) => {
		game.checkFile(styleFile, (result) => resolve(result === 1));
	});
	if (exists) {
		targetModule = await import(`./card-movement-${style}.js`);
	}
}

if (!targetModule) {
	targetModule = await import("./card-movement-base.js");
}

export const {
	setBasePlayerDraw,
	playerDraw,
	playerGain2,
	playerGive,
	playerThrow,
	playerThrowordered2,
	playerPhaseJudge,
	playerAddVirtualJudge,
	playerAddVirtualEquip,
	playerDirectgain,
	playerDirectgains,
} = targetModule;
