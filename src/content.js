import { bootstrapExtension, enhanceDecadeUIRuntime, finalizeDecadeUICore } from "./concore.js";
import { createDecadeUIObject } from "./conobject.js";
import { registerLegacyModules } from "../js/jindutiao.js";

export async function content(config, pack) {
	if (!bootstrapExtension()) return;
	window.duicfg = config;
	window.dui = window.decadeUI = createDecadeUIObject();
	enhanceDecadeUIRuntime(window.decadeUI);
	const decadeUI = finalizeDecadeUICore(window.decadeUI, config, pack);
	registerLegacyModules(config);
	return decadeUI;
}
