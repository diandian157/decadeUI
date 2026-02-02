/**
 * @fileoverview 配置模块入口
 * @description 组装所有配置定义，提供统一的配置导出
 * @module config
 */
import { appearanceConfigs } from "./definitions/appearance.js";
import { cardConfigs } from "./definitions/card.js";
import { componentConfigs } from "./definitions/component.js";
import { miscConfigs } from "./definitions/misc.js";
import { cardSkinPresets, cardSkinMeta } from "./utils.js";

/**
 * 扩展配置项
 * @description 按功能分组组装的完整配置对象
 * @type {Object}
 */
export const config = {
	// 整体外观配置（包含更新配置）
	...appearanceConfigs,

	// 卡牌相关配置
	...cardConfigs,

	// 部件管理配置
	...componentConfigs,

	// 小小玩楞配置
	...miscConfigs,
};

// 导出卡牌皮肤相关数据（保持向后兼容）
export { cardSkinPresets, cardSkinMeta };

// 导出各分组配置（便于按需引用）
export { appearanceConfigs, cardConfigs, componentConfigs, miscConfigs };
