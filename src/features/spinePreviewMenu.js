import { ui, lib, game } from "noname";

const CONFIG_KEY = "extension_十周年UI_showSpinePreviewMenu";

let menuButton = null;

function isEnabled() {
	return !!lib.config[CONFIG_KEY];
}

function openPreview() {
	window.decadeUI?.decadeAnimationTools?.openPreview?.();
}

function removeMenuButton() {
	menuButton?.remove?.();
	menuButton = null;
}

function updateSpinePreviewMenu() {
	if (!ui.system1 && !ui.system2) return false;
	console.log("[十周年UI] updateSpinePreviewMenu called, config value:", lib.config[CONFIG_KEY], "enabled:", isEnabled());
	if (!isEnabled()) {
		removeMenuButton();
		return true;
	}
	if (!menuButton?.isConnected) {
		console.log("[十周年UI] Creating Spine/SK preview menu button");
		menuButton = ui.create.system("Spine/SK预览", openPreview, true);
	}
	return true;
}

function setupSpinePreviewMenu() {
	console.log("[十周年UI] setupSpinePreviewMenu init, current config:", CONFIG_KEY, "=", lib.config[CONFIG_KEY]);
	window.decadeUI && (window.decadeUI.updateSpinePreviewMenu = updateSpinePreviewMenu);

	// 仿照皮肤切换扩展的方式：使用 lib.arenaReady 确保 UI 已就绪后再创建菜单
	lib.arenaReady.push(function () {
		updateSpinePreviewMenu();
	});

	// 同时保留轮询作为备用机制（处理动态开启/关闭的情况）
	const timer = setInterval(() => {
		if (updateSpinePreviewMenu()) {
			console.log("[十周年UI] Polling completed, menu setup done");
			clearInterval(timer);
		}
	}, 500);
}

export { setupSpinePreviewMenu, updateSpinePreviewMenu };
