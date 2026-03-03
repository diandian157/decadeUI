/**
 * @fileoverview 配置模块入口
 * @description 组装所有配置定义，提供统一的配置导出
 * @module config
 */
import { appearanceConfigs } from "./definitions/appearance.js";
import { cardConfigs } from "./definitions/card.js";
import { componentConfigs } from "./definitions/component.js";
import { miscConfigs } from "./definitions/misc.js";
import { cardSkinPresets, cardSkinMeta, registerDynamicSkin, getAllCardSkinPresets } from "./utils.js";

/**
 * 扩展配置项
 * @description 按功能分组组装的完整配置对象
 * @type {Object}
 */
export const config = {
	...appearanceConfigs,
	...cardConfigs,
	...componentConfigs,
	...miscConfigs,
};

export { cardSkinPresets, cardSkinMeta, registerDynamicSkin, getAllCardSkinPresets };
export { appearanceConfigs, cardConfigs, componentConfigs, miscConfigs };
