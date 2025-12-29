/**
 * @fileoverview 常量定义模块，包含SVG命名空间、不兼容模式和裁剪路径配置
 */

/** @type {string} SVG命名空间 */
export const SVG_NS = "http://www.w3.org/2000/svg";

/** @type {Set<string>} 不兼容的游戏模式 */
export const INCOMPATIBLE_MODES = new Set(["chess", "tafang", "hs_hearthstone"]);

/** @type {string} 推荐布局 */
export const RECOMMENDED_LAYOUT = "nova";

/** @type {Array<Object>} SVG裁剪路径配置 */
export const CLIP_PATHS = [
	{ id: "solo-clip", d: "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z" },
	{ id: "duol-clip", d: "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z" },
	{ id: "duor-clip", d: "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z" },
	{ id: "dskin-clip", d: "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z" },
];
