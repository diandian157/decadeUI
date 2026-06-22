import { lib, game, ui, get } from "noname";
import { SpineRenderer } from "../animation/SpineRenderer.js";
import { getLayaSkPlayer } from "../animation/LayaSkPlayer.js";

const SAVE_KEY = "extension_十周年UI_dynamicSkinChoice";
const LAST_PREVIEW_PATH_KEY = "extension_十周年UI_lastPreviewPath";
const DEFAULT_PREVIEW_PATH = "extension/十周年UI/assets/dynamic";

let selectorOverlay = null;
let previewOverlay = null;
let clickListenerReady = false;

function setActiveItem(container, activeBtn) {
	container.querySelectorAll(".decade-preview-resource.active, .decade-preview-folder.active").forEach(el => el.classList.remove("active"));
	activeBtn?.classList.add("active");
}

function hostNode() {
	return ui.window || document.body;
}

function createDiv(className, parent, text) {
	const node = document.createElement("div");
	if (className) node.className = className;
	if (text) node.textContent = text;
	parent?.appendChild(node);
	return node;
}

function createButton(className, parent, text, onClick) {
	const node = document.createElement("button");
	if (className) node.className = className;
	node.type = "button";
	node.textContent = text;
	node.addEventListener("click", onClick);
	parent?.appendChild(node);
	return node;
}

function normalizePath(path) {
	return String(path || "").replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

function joinPath(base, name) {
	return `${normalizePath(base)}/${String(name || "").replace(/^\/+/, "")}`;
}

function parentPath(path) {
	const parts = normalizePath(path).split("/");
	if (parts.length <= 1) return normalizePath(path);
	parts.pop();
	return parts.join("/");
}

function toAssetUrl(path) {
	const value = normalizePath(path);
	if (/^(?:https?:|file:|data:|blob:|\/)/i.test(value)) return value;
	if (value.startsWith("extension/")) return `${lib.assetURL || ""}${value}`;
	return value;
}

function getSavedSkins() {
	if (!lib.config[SAVE_KEY] || "object" != typeof lib.config[SAVE_KEY]) {
		const legacy = lib.config.extension_十周年UI_dynamicSkin;
		lib.config[SAVE_KEY] = legacy && "object" == typeof legacy ? { ...legacy } : {};
		if (legacy && "object" == typeof legacy) game.saveConfig(SAVE_KEY, lib.config[SAVE_KEY]);
	}
	return lib.config[SAVE_KEY];
}

function saveSelectedSkin(character, skinName) {
	const saved = getSavedSkins();
	saved[character] = skinName;
	game.saveConfig(SAVE_KEY, saved);
}

function tagDynamicSkinNames() {
	const dynamicSkin = window.decadeUI?.dynamicSkin;
	if (!dynamicSkin) return;
	for (const skins of Object.values(dynamicSkin)) {
		if (!skins) continue;
		for (const [skinName, skin] of Object.entries(skins)) {
			if (skin && "object" == typeof skin && !skin.skinName) skin.skinName = skinName;
		}
	}
}

function cloneSkinConfig(skin, skinName) {
	const data = { ...(skin || {}), skinName };
	if (data.localePath) {
		if (data.name && !data.name.startsWith(`${data.localePath}/`)) data.name = `${data.localePath}/${data.name}`;
		if (data.background && !data.background.startsWith(`${data.localePath}/`)) data.background = `${data.localePath}/${data.background}`;
	}
	return data;
}

function getCharacterSkins(character) {
	return window.decadeUI?.dynamicSkin?.[character] || null;
}

function applyDynamicSkin(player, character, skinName, isPrimary) {
	if (!player || !character) return false;
	if ("none" === skinName) {
		player.stopDynamic?.(isPrimary, !isPrimary);
		saveSelectedSkin(character, "none");
		return true;
	}
	const skins = getCharacterSkins(character);
	const skin = skins?.[skinName];
	if (!skin) return false;
	player.stopDynamic?.(isPrimary, !isPrimary);
	player.playDynamic?.(cloneSkinConfig(skin, skinName), !isPrimary);
	player.$dynamicWrap?.style?.removeProperty?.("background-image");
	saveSelectedSkin(character, skinName);
	return true;
}

function collectPlayerAvatars(preferredPlayer) {
	const players = [];
	const source = [...(game.players || []), ...(game.dead || [])].filter(Boolean);
	const ordered = preferredPlayer ? [preferredPlayer, ...source.filter(player => player !== preferredPlayer)] : source;
	for (const player of ordered) {
		const items = [
			{ player, character: player.name1 || player.name, isPrimary: true, label: "主将" },
		];
		if (player.doubleAvatar && player.name2) items.push({ player, character: player.name2, isPrimary: false, label: "副将" });
		for (const item of items) {
			if (item.character && getCharacterSkins(item.character)) players.push(item);
		}
	}
	return players;
}

function closeSelector() {
	selectorOverlay?.remove();
	selectorOverlay = null;
}

function openSelector(preferredPlayer) {
	tagDynamicSkinNames();
	closeSelector();
	const avatars = collectPlayerAvatars(preferredPlayer);
	selectorOverlay = createDiv("decade-skin-tools-overlay", hostNode());
	const panel = createDiv("decade-skin-selector", selectorOverlay);
	const header = createDiv("decade-skin-tools-header", panel);
	createDiv("decade-skin-tools-title", header, "动皮切换");
	// createButton("decade-skin-tools-close", header, "关闭", closeSelector);
	const body = createDiv("decade-skin-tools-body", panel);
	const avatarList = createDiv("decade-skin-avatar-list", body);
	const skinList = createDiv("decade-skin-list", body);
	let current = avatars[0] || null;

	const renderSkins = () => {
		skinList.innerHTML = "";
		if (!current) {
			createDiv("decade-skin-empty", skinList, "当前场上没有可切换的动皮角色");
			return;
		}
		const title = createDiv("decade-skin-section-title", skinList, `${get.translation(current.character) || current.character} ${current.label}`);
		title.dataset.character = current.character;
		const saved = getSavedSkins()[current.character];
		const off = createButton(`decade-skin-item${"none" === saved ? " active" : ""}`, skinList, "关闭动皮", () => {
			applyDynamicSkin(current.player, current.character, "none", current.isPrimary);
			renderSkins();
		});
		off.dataset.skin = "none";
		const skins = getCharacterSkins(current.character) || {};
		for (const skinName of Object.keys(skins)) {
			const button = createButton(`decade-skin-item${saved === skinName ? " active" : ""}`, skinList, skinName, () => {
				applyDynamicSkin(current.player, current.character, skinName, current.isPrimary);
				renderSkins();
			});
			button.dataset.skin = skinName;
		}
	};

	const renderAvatars = () => {
		avatarList.innerHTML = "";
		for (const item of avatars) {
			const label = `${get.translation(item.character) || item.character} · ${item.label}`;
			const button = createButton(`decade-skin-avatar-item${item === current ? " active" : ""}`, avatarList, label, () => {
				current = item;
				renderAvatars();
				renderSkins();
			});
			button.dataset.character = item.character;
		}
	};

	renderAvatars();
	renderSkins();
}

function listDirectory(path) {
	return new Promise((resolve, reject) => {
		if ("function" != typeof game.getFileList) {
			reject(new Error("game.getFileList is unavailable"));
			return;
		}
		game.getFileList(normalizePath(path), (folders, files) => resolve({ folders: folders || [], files: files || [] }));
	});
}

function getResourceGroups(files) {
	const groups = new Map();
	for (const file of files || []) {
		const match = String(file).match(/^(.*)\.([^.]+)$/);
		if (!match) continue;
		const base = match[1];
		const ext = match[2].toLowerCase();
		if (!groups.has(base)) groups.set(base, { base, files: {}, type: null, skelType: null });
		groups.get(base).files[ext] = file;
	}
	const result = [];
	for (const group of groups.values()) {
		if (group.files.sk) {
			group.type = "sk";
			group.file = group.files.sk;
			result.push(group);
		} else if (group.files.atlas && (group.files.skel || group.files.json)) {
			group.type = "spine";
			group.skelType = group.files.skel ? "skel" : "json";
			result.push(group);
		}
	}
	return result.sort((a, b) => a.base.localeCompare(b.base, "zh-Hans-CN"));
}

function normalizeActionNames(actions) {
	return (actions || [])
		.map(action => "string" == typeof action ? action : action?.name)
		.filter(Boolean);
}

function closePreview() {
	const state = previewOverlay?._state;
	state?.cleanup?.();
	previewOverlay?.remove();
	previewOverlay = null;
}

function setPreviewStatus(state, text) {
	state.status.textContent = text || "";
}

function updateSpineNodeTransform(state) {
	if (!state.spineNode) return;
	const rect = state.stage.getBoundingClientRect();
	const ratioX = rect.width ? rect.width / 130 : 1;
	const ratioY = rect.height ? rect.height / (130 * 1.35) : 1;
	state.spineNode._origMeta = { x: [state.offsetX / ratioX, 0.5], y: [-state.offsetY / ratioY, 0.5], scale: state.scale };
	state.spineNode.scale = state.scale;
	state.spineNode.scaleX = state.scale;
	state.spineNode.scaleY = state.scale;
	state.spineNode.opacity = state.alpha;
	state.spineNode.setSpeed?.(state.speed);
	state.spineRenderer?.start?.();
}

function updatePreviewContainer(state) {
	const rect = state.stage.getBoundingClientRect();
	if (state.spineContainer) {
		state.spineContainer.setPosition(0, 0);
		state.spineContainer.setContentSize(rect.width, rect.height);
		for (const node of state.spineContainer.spineNodes) node._containerRect = { width: rect.width, height: rect.height };
		if (state.spineRenderer) state.spineRenderer.resized = false;
	}
	if (state.skCanvas && rect.width && rect.height) {
		state.skCanvas.width = Math.round(rect.width * (window.devicePixelRatio || 1));
		state.skCanvas.height = Math.round(rect.height * (window.devicePixelRatio || 1));
		state.skCanvas.style.cssText = state.skCanvasPreviewStyle;
		window.Laya?.stage?.size?.(rect.width, rect.height);
	}
	state.skInstance?.updatePosition?.();
}

function fillActionSelect(state, actions, selected, onChange) {
	state.actionSelect.innerHTML = "";
	state.actionSelect.onchange = null;
	if (!actions.length) {
		const option = document.createElement("option");
		option.value = "";
		option.textContent = "默认动作";
		state.actionSelect.appendChild(option);
		return;
	}
	for (const action of actions) {
		const option = document.createElement("option");
		option.value = action;
		option.textContent = action;
		if (action === selected) option.selected = true;
		state.actionSelect.appendChild(option);
	}
	state.actionSelect.onchange = () => onChange(state.actionSelect.value);
}

function cleanupPreviewResource(state, destroyRenderer = false) {
	if (state.spineContainer && state.spineRenderer) {
		state.spineRenderer.destroyContainer?.(state.spineContainer);
	}
	state.spineContainer = null;
	state.spineNode = null;
	if (destroyRenderer) {
		state.spineRenderer?.destroy?.();
		state.spineCanvas?.remove?.();
		state.spineRenderer = null;
		state.spineCanvas = null;
	}
	state.skInstance?.destroy?.();
	state.skInstance = null;
	if (state.skCanvas) {
		state.skCanvas.style.cssText = state.restoreSkStyle || "";
		if (state.restoreSkParent) state.restoreSkParent.appendChild(state.skCanvas);
		state.skCanvas = null;
		state.restoreSkParent = null;
		state.restoreSkStyle = null;
		state.skCanvasPreviewStyle = null;
		window.decadeUI?.LayaAnimationsManager && getLayaSkPlayer().resize();
	}
	if (state.restoreSkZIndex !== null) {
		const canvas = document.getElementById("decadeUI-canvas-sk");
		if (canvas) canvas.style.zIndex = state.restoreSkZIndex;
		state.restoreSkZIndex = null;
	}
}

function ensurePreviewSpineRenderer(state) {
	if (state.spineRenderer && state.spineCanvas?.isConnected) {
		state.stage.appendChild(state.spineCanvas);
		return state.spineRenderer;
	}
	const canvas = document.createElement("canvas");
	canvas.className = "decade-spine-preview-canvas";
	canvas.style.zIndex = "2";
	state.stage.appendChild(canvas);
	state.spineCanvas = canvas;
	state.spineRenderer = new SpineRenderer(canvas, { dprAdaptive: true });
	return state.spineRenderer;
}

async function previewSpineResource(state, resource) {
	const token = ++state.previewToken;
	cleanupPreviewResource(state);
	setPreviewStatus(state, "正在加载 Spine...");
	state.currentType.textContent = "Spine";
	try {
		const renderer = ensurePreviewSpineRenderer(state);
		const container = renderer.createContainer({ name: "preview" });
		state.spineContainer = container;
		updatePreviewContainer(state);
		const filename = toAssetUrl(joinPath(state.currentPath, resource.base));
		const loaded = await renderer.loadSpineAssets(filename, resource.skelType);
		if (token !== state.previewToken) return;
		if (!loaded) {
			setPreviewStatus(state, "Spine 加载失败");
			return;
		}
		const node = await renderer.createSpineNode(filename, { skelType: resource.skelType, loop: true, speed: state.speed });
		if (token !== state.previewToken) {
			node?.destroy?.();
			return;
		}
		if (!node) {
			setPreviewStatus(state, "Spine 创建失败");
			return;
		}
		state.spineNode = node;
		node.opacity = state.alpha;
		const rect = state.stage.getBoundingClientRect();
		node._origMeta = { x: [0, 0.5], y: [0, 0.5], scale: state.scale };
		node._containerRect = { width: rect.width, height: rect.height };
		const actionNames = normalizeActionNames(renderer.getSpineActions(node));
		const firstAction = actionNames[0];
		renderer._setupAnimation(node, { action: firstAction, loop: true, speed: state.speed });
		container.addChild(node);
		updateSpineNodeTransform(state);
		renderer.start();
		fillActionSelect(state, actionNames, firstAction, action => node.setAction?.(action, 0.15));
		if (firstAction) node.setAction?.(firstAction, 0);
		setPreviewStatus(state, resource.base);
	} catch (error) {
		console.error("[十周年UI] Spine 预览失败:", error);
		setPreviewStatus(state, `Spine 预览失败：${error?.message || error}`);
	}
}

async function previewSkResource(state, resource) {
	++state.previewToken;
	cleanupPreviewResource(state);
	setPreviewStatus(state, "正在加载 SK龙骨...");
	state.currentType.textContent = "SK龙骨";
	try {
		const player = getLayaSkPlayer();
		await player.init();
		if (player.canvas) {
			state.skCanvas = player.canvas;
			state.restoreSkParent = player.canvas.parentNode;
			state.restoreSkStyle = player.canvas.style.cssText || "";
			state.skCanvasPreviewStyle = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;";
			state.stage.appendChild(player.canvas);
			state.restoreSkZIndex = player.canvas.style.zIndex || "";
			player.canvas.style.cssText = state.skCanvasPreviewStyle;
			updatePreviewContainer(state);
		}
		const instance = await player.playSkel(joinPath(state.currentPath, resource.file), {
			pos: state.stage,
			followed: true,
			scaleWithElement: true,
			scale: state.scale,
			speed: state.speed,
			alpha: state.alpha,
			loop: true,
		});
		state.skInstance = instance;
		await instance.ready;
		const actions = normalizeActionNames(instance.getActions());
		fillActionSelect(state, actions, actions[0], action => instance.play(action, true));
		if (actions[0]) instance.play(actions[0], true);
		setPreviewStatus(state, resource.base);
	} catch (error) {
		console.error("[十周年UI] SK 预览失败:", error);
		setPreviewStatus(state, `SK 预览失败：${error?.message || error}`);
	}
}

function bindPreviewTransform(state) {
	const syncControls = () => {
		state.scaleInput.value = String(state.scale);
		state.speedInput.value = String(state.speed);
		state.alphaInput.value = String(state.alpha);
	};
	state.scaleInput.addEventListener("input", () => {
		state.scale = Number(state.scaleInput.value) || 1;
		updateSpineNodeTransform(state);
		state.skInstance?.setScale?.(state.scale);
	});
	state.speedInput.addEventListener("input", () => {
		state.speed = Number(state.speedInput.value) || 1;
		updateSpineNodeTransform(state);
		state.skInstance?.setSpeed?.(state.speed);
	});
	state.alphaInput.addEventListener("input", () => {
		state.alpha = Number(state.alphaInput.value);
		updateSpineNodeTransform(state);
		state.skInstance?.setAlpha?.(state.alpha);
	});
	let dragging = false;
	let lastX = 0;
	let lastY = 0;
	state.stage.addEventListener("pointerdown", event => {
		if (event.button !== 0) return;
		dragging = true;
		lastX = event.clientX;
		lastY = event.clientY;
		state.stage.setPointerCapture?.(event.pointerId);
	});
	state.stage.addEventListener("pointermove", event => {
		if (!dragging) return;
		state.offsetX += event.clientX - lastX;
		state.offsetY += event.clientY - lastY;
		lastX = event.clientX;
		lastY = event.clientY;
		updateSpineNodeTransform(state);
		if (state.skInstance) {
			state.skInstance.offset = { x: state.offsetX, y: state.offsetY };
			state.skInstance.updatePosition();
		}
	});
	state.stage.addEventListener("pointerup", () => (dragging = false));
	state.stage.addEventListener("wheel", event => {
		event.preventDefault();
		state.scale = Math.max(0.05, Math.min(3, state.scale + (event.deltaY > 0 ? -0.05 : 0.05)));
		syncControls();
		updateSpineNodeTransform(state);
		state.skInstance?.setScale?.(state.scale);
	}, { passive: false });
}

function bindDragScroll(scroller) {
	let pressed = false;
	let dragging = false;
	let suppressClick = false;
	let startX = 0;
	let startY = 0;
	let scrollTop = 0;
	let scrollLeft = 0;
	scroller.addEventListener("pointerdown", event => {
		if (event.button !== 0) return;
		pressed = true;
		dragging = false;
		suppressClick = false;
		startX = event.clientX;
		startY = event.clientY;
		scrollTop = scroller.scrollTop;
		scrollLeft = scroller.scrollLeft;
	});
	scroller.addEventListener("pointermove", event => {
		if (!pressed) return;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		if (!dragging) {
			if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
			dragging = true;
			suppressClick = true;
			scroller.setPointerCapture?.(event.pointerId);
		}
		event.preventDefault();
		scroller.scrollTop = scrollTop - dy;
		scroller.scrollLeft = scrollLeft - dx;
	});
	const endDrag = () => {
		pressed = false;
		dragging = false;
	};
	scroller.addEventListener("pointerup", endDrag);
	scroller.addEventListener("pointercancel", endDrag);
	scroller.addEventListener("click", event => {
		if (!suppressClick) return;
		suppressClick = false;
		event.preventDefault();
		event.stopPropagation();
	}, true);
}

function openPreview() {
	closePreview();
	previewOverlay = createDiv("decade-skin-preview-overlay", hostNode());
	const panel = createDiv("decade-skin-preview", previewOverlay);
	const header = createDiv("decade-skin-tools-header", panel);
	createDiv("decade-skin-tools-title", header, "Spine/SK 预览器");
	// createButton("decade-skin-tools-close", header, "关闭", closePreview);
	const toolbar = createDiv("decade-preview-toolbar", panel);
	const pathInput = document.createElement("input");
	pathInput.className = "decade-preview-path";
	pathInput.value = normalizePath(lib.config[LAST_PREVIEW_PATH_KEY] || DEFAULT_PREVIEW_PATH);
	toolbar.appendChild(pathInput);
	const body = createDiv("decade-preview-body", panel);
	const fileList = createDiv("decade-preview-file-list", body);
	bindDragScroll(fileList);
	const right = createDiv("decade-preview-right", body);
	const stage = createDiv("decade-preview-stage", right);
	const controls = createDiv("decade-preview-controls", right);
	const currentType = createDiv("decade-preview-type", controls, "-");
	const actionSelect = document.createElement("select");
	controls.appendChild(actionSelect);
	const scaleInput = document.createElement("input");
	scaleInput.type = "range";
	scaleInput.min = "0.05";
	scaleInput.max = "3";
	scaleInput.step = "0.01";
	const speedInput = document.createElement("input");
	speedInput.type = "range";
	speedInput.min = "0.1";
	speedInput.max = "3";
	speedInput.step = "0.05";
	const alphaInput = document.createElement("input");
	alphaInput.type = "range";
	alphaInput.min = "0";
	alphaInput.max = "1";
	alphaInput.step = "0.01";
	controls.append("缩放", scaleInput, "速度", speedInput, "透明", alphaInput);
	const status = createDiv("decade-preview-status", panel);
	createButton("decade-skin-tools-close decade-preview-close-bottom", panel, "关闭", closePreview);
	const state = {
		currentPath: pathInput.value,
		fileList,
		stage,
		status,
		currentType,
		actionSelect,
		scaleInput,
		speedInput,
		alphaInput,
		scale: 1,
		speed: 1,
		alpha: 1,
		offsetX: 0,
		offsetY: 0,
		restoreSkZIndex: null,
		skCanvas: null,
		restoreSkParent: null,
		restoreSkStyle: null,
		skCanvasPreviewStyle: null,
		spineCanvas: null,
		previewToken: 0,
		cleanup() {
			cleanupPreviewResource(state, true);
			window.removeEventListener("resize", state.onResize);
		},
		onResize: () => updatePreviewContainer(state),
	};
	previewOverlay._state = state;
	bindPreviewTransform(state);
	state.scaleInput.value = "1";
	state.speedInput.value = "1";
	state.alphaInput.value = "1";
	window.addEventListener("resize", state.onResize);

	const loadPath = async path => {
		state.currentPath = normalizePath(path || DEFAULT_PREVIEW_PATH);
		pathInput.value = state.currentPath;
		game.saveConfig(LAST_PREVIEW_PATH_KEY, state.currentPath);
		fileList.innerHTML = "";
		state.selectedItem = null;
		setPreviewStatus(state, "正在读取目录...");
		try {
			const { folders, files } = await listDirectory(state.currentPath);
			for (const folder of folders.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))) {
				createButton("decade-preview-folder", fileList, `/${folder}`, () => {
					setActiveItem(fileList, null);
					loadPath(joinPath(state.currentPath, folder));
				});
			}
			const resources = getResourceGroups(files);
			for (const resource of resources) {
				const btn = createButton(`decade-preview-resource ${resource.type}`, fileList, `${resource.type === "sk" ? "SK" : "Spine"} · ${resource.base}`, () => {
					setActiveItem(fileList, btn);
					state.offsetX = 0;
					state.offsetY = 0;
					if (resource.type === "sk") previewSkResource(state, resource);
					else previewSpineResource(state, resource);
				});
			}
			if (!folders.length && !resources.length) createDiv("decade-skin-empty", fileList, "没有找到可预览的 Spine/SK 资源");
			setPreviewStatus(state, state.currentPath);
		} catch (error) {
			console.error("[十周年UI] 预览器读取目录失败", error);
			setPreviewStatus(state, `读取失败：${error?.message || error}`);
		}
	};

	createButton("decade-preview-tool", toolbar, "上级", () => loadPath(parentPath(state.currentPath)));
	createButton("decade-preview-tool", toolbar, "刷新", () => loadPath(pathInput.value));
	createButton("decade-preview-tool", toolbar, "动皮", () => loadPath("extension/十周年UI/assets/dynamic"));
	createButton("decade-preview-tool", toolbar, "卡牌动画", () => loadPath("extension/十周年UI/assets/animation"));
	createButton("decade-preview-tool", toolbar, "SK", () => loadPath("extension/十周年UI/sk"));
	pathInput.addEventListener("keydown", event => {
		if (event.key === "Enter") loadPath(pathInput.value);
	});
	loadPath(pathInput.value);
}

function setupClickPlayerSelector() {
	if (clickListenerReady) return;
	clickListenerReady = true;
	document.addEventListener("click", event => {
		if (!lib.config.extension_十周年UI_clickPlayerDynamic) return;
		const player = event.target?.closest?.("#arena > .player");
		if (!player) return;
		if (!collectPlayerAvatars(player).length) return;
		openSelector(player);
	}, true);
}

function setupDecadeAnimationTools() {
	tagDynamicSkinNames();
	const tools = { openSelector, closeSelector, openPreview, closePreview, applyDynamicSkin, tagDynamicSkinNames };
	window.decadeUI.decadeAnimationTools = tools;
	return tools;
}

export { setupDecadeAnimationTools };
