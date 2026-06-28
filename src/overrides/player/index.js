/**
 * @fileoverview Player覆写模块入口
 * @description 统一导出所有玩家相关的覆写方法，按职责拆分为多个子模块
 * @module overrides/player
 */

import { lib, game } from "noname";

// 基础方法管理
export { setBasePlayerMethods, getBasePlayerMethods, applyPlayerOverrides } from "./base.js";

// Hooks注册
export { registerDecadeUIHooks } from "./hooks.js";

// 核心状态覆写
export { playerAwakenSkill, playerSetIdentity, playerGetState, playerSetModeState, playerSetSeatNum, playerUninit, playerReinit, playerReinitCharacter, playerUpdate } from "./state.js";

// 卡牌操作覆写
export { playerUseCard, playerRespond, playerLose, playerUseCardAnimateBefore, playerRespondAnimateBefore, playerHandleEquipChange } from "./card-actions.js";

// 标记部分覆写
export { playerMarkSkill, playerUnmarkSkill, playerMark, playerMarkCharacter, playerUpdateMark, playerMarkSkillCharacter } from "./marks.js";

// 技能状态覆写
export { playerChangeZhuanhuanji, playerSetSkillYinYang, player$SetSkillYinYang, playerSetSkillState, player$SetSkillState, preloadZhuanhuanjiImage } from "./skill-state.js";

// 动态皮肤覆写
export { playerPlayDynamic, playerStopDynamic, playerApplyDynamicSkin } from "./dynamic-skin.js";

// 动画效果覆写
export { playerDamagepop, playerDamage, playerCompare, playerCompareMultiple, playerLine, playerDieAfter, playerSkill, playerQueueCssAnimation } from "./animations.js";

// 卡牌移动覆写（样式路由：优先加载 card-movement-{style}.js，不存在则用 card-movement.js 兜底）
const cardMovementStyle = lib.config.extension_十周年UI_newDecadeStyle || "on";
let cardMovementModule;
if (cardMovementStyle !== "on" && cardMovementStyle !== "off" && cardMovementStyle !== "othersOff") {
	const styleFilePath = `extension/十周年UI/src/overrides/player/card-movement-${cardMovementStyle}.js`;
	const fileExists = await new Promise((resolve) => {
		game.checkFile(styleFilePath, (result) => resolve(result === 1));
	});
	if (fileExists) {
		cardMovementModule = await import(`./card-movement-${cardMovementStyle}.js`);
	}
}
if (!cardMovementModule) {
	cardMovementModule = await import("./card-movement.js");
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
} = cardMovementModule;

// UI相关覆写
export { playerSay, playerSyncExpand, playerCheckAndAddExperienceSuffix, playerUpdateShowCards, playerCheckBoundsCache } from "./ui.js";
