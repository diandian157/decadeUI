/**
 * @fileoverview UI覆写模块入口
 * @description 统一导出所有UI相关的覆写方法
 * @module overrides/ui
 */

// 基础方法
export { setBaseUiMethods, setBaseUiCreateMethods } from "./base.js";

// 更新方法
export { uiUpdatec, uiUpdatehl, uiUpdatej, uiUpdatem, uiUpdatez, uiUpdate, uiUpdatejm, uiUpdatexr } from "./update.js";

// ui.create
export { uiCreatePrebutton, uiCreateRarity, uiCreateControl, uiCreateDialog, uiCreateSelectlist, uiCreateIdentityCard, uiCreateSpinningIdentityCard, uiCreateArena, uiCreatePause, uiCreateCharacterDialog, uiCreateButton, uiCreateMe } from "./create.js";

// ui.click
export { uiClickCard, uiClickIntro, uiClickIdentity, uiClickVolumn } from "./click.js";

// 其他方法
export { uiClear } from "./misc.js";

// 应用覆写
export { applyUiOverrides } from "./base.js";
