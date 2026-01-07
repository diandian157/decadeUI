/**
 * @fileoverview 配置处理函数统一导出
 * @description 汇总所有配置处理函数，便于统一引用
 * @module config/handlers
 */

// 整体外观处理函数
export { onExtensionToggleClick, onExtensionToggleUpdate, onNewDecadeStyleClick, onNewDecadeStyleUpdate, onRightLayoutClick, onRightLayoutUpdate, onOutcropSkinClick, onOutcropSkinUpdate, onBorderLevelUpdate, onAloneEquipUpdate, onMeanPrettifyClick, onDynamicSkinClick, onDynamicSkinOutcropUpdate } from "./appearance-handlers.js";

// 卡牌相关处理函数
export { onTranslateClick, onCardGhostEffectClick, onAutoSelectClick, onAutoSelectUpdate, onHandTipHeightBlur, onHandTipHeightUpdate, onCardScaleBlur, onDiscardScaleBlur, onCardPrettifyClick, onCardkmhClick, onCardkmhUpdate, onChupaizhishiUpdate } from "./card-handlers.js";

// 部件管理处理函数
export { onJindutiaoYangshiUpdate, onJindutiaoSetBlur, onJindutiaoSetUpdate, onJDTSYangshiUpdate, onGTBBYangshiClick, onPlayerMarkStyleUpdate, onLoadingStyleUpdate, onGainSkillsVisibleUpdate } from "./component-handlers.js";
