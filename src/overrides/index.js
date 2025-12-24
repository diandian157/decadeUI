/**
 * 覆写模块入口
 * @description 统一管理所有覆写
 */

export * from "./control.js";
export * from "./dialog.js";
export * from "./event.js";
export * from "./card.js";
export * from "./player.js";
export * from "./game.js";
export * from "./get.js";
export * from "./ui.js";

import { applyControlOverrides } from "./control.js";
import { applyDialogOverrides } from "./dialog.js";
import { applyEventExtensions } from "./event.js";
import { applyCardOverrides } from "./card.js";
import { applyPlayerOverrides } from "./player.js";
import { applyGameOverrides } from "./game.js";
import { applyGetOverrides } from "./get.js";
import { applyUiOverrides } from "./ui.js";

/**
 * 应用所有基础覆写
 */
export function applyBaseOverrides() {
	applyControlOverrides();
	applyDialogOverrides();
	applyEventExtensions();
	applyCardOverrides();
	applyPlayerOverrides();
	applyGameOverrides();
	applyGetOverrides();
	applyUiOverrides();
}
