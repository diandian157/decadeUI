"use strict";

/**
 * @fileoverview 十周年UI动画模块入口，统一导出所有动画相关功能
 */
import { lib, game, ui, get, ai, _status } from "noname";

export { throttle, observeSize, lerp, getBrowserInfo, useNewDpr } from "./utils.js";
export { CubicBezierEase, ease } from "./easing.js";
export { TimeStep } from "./TimeStep.js";
export { APNode } from "./APNode.js";
export { AnimationPlayer } from "./AnimationPlayer.js";
export { AnimationPlayerPool } from "./AnimationPlayerPool.js";
export { DynamicPlayer, BUILT_ID, DynamicWorkers } from "./DynamicPlayer.js";
export { SharedAnimationPlayer } from "./SharedAnimationPlayer.js";
export { SharedDynamicRenderer, getSharedDynamicRenderer, refreshSharedDynamicZoomCompatibility } from "./SharedDynamicPlayer.js";
export { SpineRenderer, SpineContainer, SpineNode, ImageNode } from "./SpineRenderer.js";
export { SpineMask } from "./SpineMask.js";
export { dynamicCanvasLayers } from "./containerConfig.js";
export { LayaSkPlayer, LayaSkInstance, getLayaSkPlayer, playSkel } from "./LayaSkPlayer.js";
export { applyDynamicBackgroundConfig, createDynamicBackgroundController, dynamicBackgroundAssets, dynamicBackgroundItems, parseDynamicBackground } from "./backgroundAnimation.js";
export { skillDefines, cardDefines, chupaiAnimations } from "./configs/skillAnimations.js";
export { assetList } from "./configs/assetList.js";
export { cardTriggers } from "./configs/cardTriggers.js";
export { initSkillAnimations } from "./initAnimations.js";
