import { lib, game, ui, get, ai, _status } from "noname";

// 核心模块
import { bootstrapExtension } from "./core/bootstrap.js";
import { createDecadeUIObject } from "./core/decadeUI.js";
import { registerDecadeUIUtilityModule, enhanceDecadeUIRuntime } from "./core/utility.js";

// 动画模块
import { setupGameAnimation } from "./animation/gameIntegration.js";

// 特效模块
import { setupEffects } from "./effects/index.js";

// 功能模块
import { setupAutoSelect } from "./features/autoSelect.js";
import { setupCardDragSort } from "./features/cardDragSort.js";
import { setupEquipHand } from "./features/equipHand.js";
import { setupLuckyCard } from "./features/luckyCard.js";

// 音频模块
import { setupSkillDieAudio, setupAudioHooks, setupEnhancedAudio } from "./audio/index.js";

// 皮肤模块
import { setupDynamicSkin } from "./skins/index.js";

// UI模块
import { registerLegacyModules } from "./ui/progress-bar.js";
import { initCardPrompt } from "./ui/cardPrompt.js";
import { initComponent } from "./ui/component.js";
import { setupCharacterBackground } from "./ui/characterBackground.js";
import { setupCardStyles } from "./ui/cardStyles.js";
import { setupCharacterNamePrefix } from "./ui/characterNamePrefix.js";
import { setupSkillDisplay } from "./ui/skillDisplay.js";

// 技能模块
import { initSkills } from "./skills/index.js";

/** 完成核心初始化 */
export const finalizeDecadeUICore = (decadeUI, config) => {
	registerDecadeUIUtilityModule(decadeUI);
	decadeUI.config = config;
	decadeUI.config.campIdentityImageMode ??= true;

	// 配置更新函数
	const updateFn = () => {
		const menu = lib.extensionMenu[`extension_${decadeUIName}`];
		for (const key in menu) {
			if (menu[key] && typeof menu[key].update === "function") menu[key].update();
		}
	};
	duicfg.update = updateFn;
	decadeUI.config.update = updateFn;

	decadeUI.init();

	// 初始化各模块
	setupGameAnimation(lib, game, ui, get, ai, _status);
	setupEffects();
	initComponent(decadeUI);
	initSkills();
	initCardPrompt({ lib, game, ui, get });
	setupAutoSelect();
	setupCardDragSort();
	setupEquipHand();
	setupLuckyCard();
	setupEnhancedAudio();
	setupCharacterBackground();
	setupCardStyles();
	setupCharacterNamePrefix();
	setupSkillDisplay();
	setupSkillDieAudio();
	setupAudioHooks();
	setupDynamicSkin();

	console.timeEnd(decadeUIName);
	return decadeUI;
};

/**
 * 扩展content函数 - 无名杀扩展主入口
 */
export function content(config, pack) {
	if (!bootstrapExtension()) return;

	// 创建全局配置对象
	window.duicfg = {
		dynamicSkin: lib.config.extension_十周年UI_dynamicSkin,
		newDecadeStyle: lib.config.extension_十周年UI_newDecadeStyle,
	};

	// 创建decadeUI核心对象
	const decadeUI = createDecadeUIObject();
	window.decadeUI = decadeUI;
	window.dui = decadeUI;

	// 增强运行时功能
	enhanceDecadeUIRuntime(decadeUI);

	// 完成初始化
	finalizeDecadeUICore(decadeUI, config);

	// 注册进度条等遗留模块
	registerLegacyModules(config);
}
