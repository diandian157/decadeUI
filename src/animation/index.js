"use strict";

/**
 * 十周年UI动画模块入口
 * 基于Spine骨骼动画的游戏特效系统
 */

// 工具函数
export { throttle, observeSize, lerp, getBrowserInfo, useNewDpr } from "./utils.js";

// 缓动函数
export { CubicBezierEase, ease } from "./easing.js";

// 时间步进器
export { TimeStep } from "./TimeStep.js";

// 动画节点
export { APNode } from "./APNode.js";

// 播放器
export { AnimationPlayer } from "./AnimationPlayer.js";
export { AnimationPlayerPool } from "./AnimationPlayerPool.js";
export { DynamicPlayer, BUILT_ID, DynamicWorkers } from "./DynamicPlayer.js";

// 配置
export { skillDefines, cardDefines, chupaiAnimations } from "./configs/skillAnimations.js";
export { assetList } from "./configs/assetList.js";
export { cardTriggers } from "./configs/cardTriggers.js";

// 初始化函数
export { initSkillAnimations } from "./initAnimations.js";

// ==================== 兼容层 ====================
// 为了兼容旧代码，将模块挂载到全局 duilib 命名空间

import { throttle, observeSize, lerp } from "./utils.js";
import { CubicBezierEase, ease } from "./easing.js";
import { TimeStep } from "./TimeStep.js";
import { APNode } from "./APNode.js";
import { AnimationPlayer } from "./AnimationPlayer.js";
import { AnimationPlayerPool } from "./AnimationPlayerPool.js";
import { DynamicPlayer, BUILT_ID as _BUILT_ID, DynamicWorkers as _DynamicWorkers } from "./DynamicPlayer.js";

// 确保全局 duilib 存在
if (typeof window !== "undefined") {
	window.duilib = window.duilib || {};
	Object.assign(window.duilib, {
		throttle,
		observeSize,
		lerp,
		CubicBezierEase,
		ease,
		TimeStep,
		APNode,
		AnimationPlayer,
		AnimationPlayerPool,
		DynamicPlayer,
		BUILT_ID: _BUILT_ID,
		DynamicWorkers: _DynamicWorkers,
	});
}
