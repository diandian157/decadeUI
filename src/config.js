/**
 * @fileoverview 扩展配置项定义（兼容入口）
 * @description 从模块化配置目录重新导出，保持向后兼容
 * @deprecated 请直接从 './config/index.js' 导入
 */
export { config, cardSkinPresets, cardSkinMeta } from "./config/index.js";
