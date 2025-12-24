/**
 * 核心模块索引
 */
export { bootstrapExtension } from "./bootstrap.js";
export { SVG_NS, INCOMPATIBLE_MODES, RECOMMENDED_LAYOUT, CLIP_PATHS } from "./constants.js";
export { initializeDecadeUIEnvironment, initSvgClipPaths, patchGlobalMethods } from "./environment.js";
export { createDecadeUIDialogModule } from "./dialog.js";
export { createDecadeUIAnimateModule } from "./animate.js";
export { createResizeSensorClass } from "./resize-sensor.js";
export { createLayoutModule } from "./layout.js";
export { createSheetModule } from "./sheet.js";
export { createDecadeUIGetModule } from "./getters.js";
export { createDecadeUISetModule } from "./setters.js";
export { createDecadeUICreateModule } from "./create.js";
export { createStaticsModule } from "./statics.js";
export { createHandlerModule } from "./handler.js";
export { initHooks } from "./hooks.js";
export { registerDecadeUIUtilityModule, enhanceDecadeUIRuntime } from "./utility.js";
