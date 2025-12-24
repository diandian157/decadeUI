/**
 * 常量定义
 */

export const SVG_NS = "http://www.w3.org/2000/svg";
export const INCOMPATIBLE_MODES = new Set(["chess", "tafang", "hs_hearthstone"]);
export const RECOMMENDED_LAYOUT = "nova";

// SVG裁剪路径配置
export const CLIP_PATHS = [
	{ id: "solo-clip", d: "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z" },
	{ id: "duol-clip", d: "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z" },
	{ id: "duor-clip", d: "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z" },
	{ id: "dskin-clip", d: "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z" },
];
