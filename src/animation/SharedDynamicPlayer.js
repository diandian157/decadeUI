import { SpineRenderer, ImageNode } from "./SpineRenderer.js";
import { SpineMask } from "./SpineMask.js";
import { dynamicCanvasLayers } from "./containerConfig.js";
import { lib, game, ui } from "noname";

let sharedDynamicRenderer;
let builtId = 0;
let legacyDynamicId = 0;

function isDynamicZoomCompatibilityEnabled() {
	const value = lib.config.extension_十周年UI_dynamicSkinZoomCompat;
	return value === true || value === "on";
}

const DESIGN_WIDTH = 130;
const DESIGN_HEIGHT = DESIGN_WIDTH * 1.35;
const outcropConfigs = {
	shizhounian: { extraTopRatio: 12 / 180, mask: "shizhounian" },
	shousha: { extraTopRatio: 27 / 180, mask: "shousha" },
};

function getSharedDynamicRenderer() {
	if (!sharedDynamicRenderer) sharedDynamicRenderer = new SharedDynamicRenderer();
	return sharedDynamicRenderer;
}

function isExternalPath(path) {
	return /^(?:https?:|file:|data:|blob:|\/)/i.test(path);
}

function cloneSprite(sprite) {
	if ("string" == typeof sprite) return { name: sprite };
	return { ...(sprite || {}) };
}

function applyDoubleAvatarOffset(sprite, isDeputy) {
	const result = { ...sprite };
	if (Array.isArray(result.x)) {
		result.x = [...result.x];
		result.x[1] += isDeputy ? 0.25 : -0.25;
	} else if (void 0 === result.x) {
		result.x = [0, isDeputy ? 0.75 : 0.25];
	} else {
		result.x = [result.x, isDeputy ? 0.25 : -0.25];
	}
	return result;
}

function getDynamicOutcropConfig(style) {
	if (!style || style === "off") return null;
	return outcropConfigs[style] || outcropConfigs.shizhounian;
}

function getCurrentUiStyle() {
	return window.decadeUI?.config?.newDecadeStyle ?? window.lib?.config?.extension_十周年UI_newDecadeStyle ?? "on";
}

function getDocumentZoom() {
	const gameZoom = game?.documentZoom;
	if (Number.isFinite(gameZoom) && gameZoom > 0) return gameZoom;
	const windowZoom = window.documentZoom;
	if (Number.isFinite(windowZoom) && windowZoom > 0) return windowZoom;
	const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom);
	if (Number.isFinite(bodyZoom) && bodyZoom > 0) return bodyZoom;
	return 1;
}

function isGetBoundingClientRectHijacked() {
	// 皮肤切换扩展等会劫持 HTMLElement.prototype.getBoundingClientRect，
	// 把返回值提前除以 documentZoom（Chrome >= 128 修复）。
	// 检测方式与 SpineRenderer._calcReferBounds 一致。
	return !HTMLElement.prototype.getBoundingClientRect.toString().includes("[native code]");
}

function getCanvasLocalRect(rect, canvas, compatMode = false) {
	// canvas CSS 尺寸由 syncUpperCanvasBounds 设为布局像素（viewport / bodyZoom），
	// 因此 canvasRect.width / canvas.clientWidth = bodyZoom（原生 getBoundingClientRect）。
	//
	// 原生情况：getBoundingClientRect 返回视觉像素，除以 bodyZoom 得布局像素，
	//   再乘 canvasScaleX(dpr) = 物理像素，与 canvas 物理宽度一致。
	//
	// 被劫持情况（皮肤切换扩展）：getBoundingClientRect 已除以 documentZoom，
	//   返回布局像素。此时 canvasRect 也是布局像素，canvasRect.width/canvasWidth = 1。
	//   不应再除 bodyZoom，直接用布局像素，乘 canvasScaleX(dpr) = 物理像素。
	const canvasRect = canvas.getBoundingClientRect();
	const canvasWidth = canvas.clientWidth || canvasRect.width || 1;
	const canvasHeight = canvas.clientHeight || canvasRect.height || 1;
	let scaleX = canvasRect.width / canvasWidth || 1;
	let scaleY = canvasRect.height / canvasHeight || 1;
	if (!isGetBoundingClientRectHijacked()) {
		// 原生 getBoundingClientRect 返回视觉像素，需除以 bodyZoom 转布局像素
		const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom) || 1;
		scaleX = scaleX / bodyZoom || 1;
		scaleY = scaleY / bodyZoom || 1;
	}
	// 被劫持时 scaleX=1，不除 bodyZoom，保持布局像素
	return {
		left: (rect.left - canvasRect.left) / scaleX,
		top: (rect.top - canvasRect.top) / scaleY,
		width: rect.width / scaleX,
		height: rect.height / scaleY,
	};
}

function getPlayerLocalOpacity(player) {
	let opacity = 1;
	for (let node = player; node && node !== ui.arena && node !== document.body; node = node.parentElement) {
		const value = parseFloat(window.getComputedStyle(node).opacity);
		if (Number.isFinite(value)) opacity *= value;
	}
	return Math.max(0, Math.min(1, opacity));
}

function isMenuDimmed() {
	return !!(ui.arena?.classList?.contains("paused") || ui.arena?.classList?.contains("menupaused") || document.querySelector(".pausedbg"));
}

class SharedDynamicRenderer {
	constructor() {
		this.pathPrefix = `${window.decadeUIPath || ""}assets/dynamic/`;
		this.playerStates = new WeakMap();
		this.activeStates = new Set();
		this.layoutFrame = null;
		this.upperRenderer = null;
		this.menuDimmed = false;
		this.canvasOpacity = 1;
		this.legacyStates = new Map();
	}

	getDynamicZoomScale() {
		// 坐标基准分析：
		// - 原生 getBoundingClientRect（兼容关闭+皮肤切换关闭）：
		//   getCanvasLocalRect 返回视觉像素，canvasScaleX = devicePixelRatio，
		//   renderX = 视觉像素 × devicePixelRatio = 物理像素 ✓（坐标正确）
		//   但 renderScale = _baseScale × node.scale × devicePixelRatio，
		//   canvas 物理宽度 = 视觉像素 × devicePixelRatio = 布局 × documentZoom × devicePixelRatio，
		//   spine 视觉大小比预期小 documentZoom 倍，需要返回 documentZoom 补偿。
		// - 被劫持 getBoundingClientRect（兼容打开+皮肤切换打开）：
		//   getCanvasLocalRect 返回布局像素，canvasScaleX = dpr（含 documentZoom），
		//   renderX = 布局像素 × dpr = 物理像素 ✓（坐标正确）
		//   renderScale = _baseScale × node.scale × dpr，与 canvas 物理宽度基准一致，返回 1。
		return isGetBoundingClientRectHijacked() ? 1 : getDocumentZoom();
	}

	syncDynamicNodeScale(node, zoomScale = this.getDynamicZoomScale()) {
		// 动皮容器尺寸已经来自玩家实际 DOM，game.deviceZoom 已包含在该尺寸中。
		// 再乘 deviceZoom 会在手机端重复缩小，且不同分辨率下误差并不固定。
		if (node?.isSpine) node._baseScale = zoomScale;
	}

	ensureUpperRenderer() {
		if (this.upperRenderer) return this.upperRenderer;
		const layer = dynamicCanvasLayers.player;
		let canvas = document.getElementById(layer.canvasId);
		if (!canvas) {
			canvas = document.createElement("canvas");
			canvas.id = layer.canvasId;
			canvas.className = "animation-player";
			(ui.arena || document.body).appendChild(canvas);
		}
		this.upperRenderer = new SpineRenderer(canvas, { dprAdaptive: true });
		// 旧十周年UI中 renderer 本身就是消息端点。兼容能力必须挂在真实
		// renderer 上，不能只依赖 player.dynamic.renderer 外面的一层代理，
		// 否则皮肤切换缓存或重新赋值 renderer 后 postMessage 会消失。
		Object.defineProperty(this.upperRenderer, "postMessage", {
			configurable: false,
			enumerable: false,
			writable: false,
			value: message => this.handleLegacyRendererMessage(message),
		});
		this.upperRenderer.canvas.style.zIndex = String(layer.cssZIndex);
		this.mountUpperCanvas();
		window.decadeUI?.bodySensor?.addListener?.(() => {
			this.syncUpperCanvasBounds();
			this.upperRenderer.resized = false;
		}, true);
		return this.upperRenderer;
	}

	mountUpperCanvas() {
		const canvas = this.upperRenderer?.canvas;
		const parent = ui.arena || document.body;
		if (!canvas) return;
		if (canvas.parentNode !== parent) parent.insertBefore(canvas, parent.firstChild);
		canvas.style.zIndex = String(dynamicCanvasLayers.player.cssZIndex);
		canvas.style.position = "absolute";
		canvas.style.pointerEvents = "none";
		this.syncUpperCanvasBounds();
		this.upperRenderer.resized = false;
	}

	syncUpperCanvasBounds() {
		const canvas = this.upperRenderer?.canvas;
		const arena = ui.arena;
		if (!canvas || !arena || canvas.parentNode !== arena) return;
		const arenaRect = arena.getBoundingClientRect();
		const arenaWidth = arena.clientWidth || arenaRect.width || 1;
		const arenaHeight = arena.clientHeight || arenaRect.height || 1;
		const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom) || 1;
		// 原生 getBoundingClientRect：arenaRect 是视觉像素，arenaWidth 是布局像素，
		//   scaleX = bodyZoom，viewport/scaleX = 布局像素（canvas CSS）。
		// 被劫持（皮肤切换扩展）：arenaRect 已除以 documentZoom = 布局像素，
		//   arenaWidth 也是布局像素，scaleX = 1。需手动用 bodyZoom 让 canvas CSS = 布局像素。
		let scaleX = arenaRect.width / arenaWidth || 1;
		let scaleY = arenaRect.height / arenaHeight || 1;
		if (isGetBoundingClientRectHijacked()) {
			scaleX = bodyZoom;
			scaleY = bodyZoom;
		}
		const viewportWidth = window.innerWidth || document.documentElement.clientWidth || arenaRect.width;
		const viewportHeight = window.innerHeight || document.documentElement.clientHeight || arenaRect.height;
		const nextBounds = {
			left: -arenaRect.left / scaleX,
			top: -arenaRect.top / scaleY,
			width: viewportWidth / scaleX,
			height: viewportHeight / scaleY,
		};
		const boundsKey = `${nextBounds.left}|${nextBounds.top}|${nextBounds.width}|${nextBounds.height}`;
		if (canvas._decadeFullscreenBoundsKey === boundsKey) return;
		canvas._decadeFullscreenBoundsKey = boundsKey;
		canvas.style.left = `${nextBounds.left}px`;
		canvas.style.top = `${nextBounds.top}px`;
		canvas.style.right = "auto";
		canvas.style.bottom = "auto";
		canvas.style.width = `${nextBounds.width}px`;
		canvas.style.height = `${nextBounds.height}px`;
		this.upperRenderer.resized = false;
	}

	getPlayerState(player) {
		let state = this.playerStates.get(player);
		if (state) return state;
		const renderer = this.ensureUpperRenderer();
		if (!player.$dynamicWrap) {
			const wrap = document.createElement("div");
			wrap.className = "decade-dynamic-wrap";
			wrap.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;";
			player.$dynamicWrap = wrap;
		}
		const playerLayer = dynamicCanvasLayers.player.containers.player;
		const root = renderer.createContainer({
			name: "player",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer,
		});
		const backgroundLayer = renderer.createContainer({
			name: "background",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer,
		});
		const background1 = renderer.createContainer({
			name: "background1",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer,
		});
		const background2 = renderer.createContainer({
			name: "background2",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer,
		});
		const avatarLayer = renderer.createContainer({
			name: "avatar",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer + 0.05,
		});
		const avatar1 = renderer.createContainer({
			name: "avatar1",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer + 0.1,
		});
		const avatar2 = renderer.createContainer({
			name: "avatar2",
			fatherDOM: player.$dynamicWrap,
			zIndex: playerLayer + 0.2,
		});
		root.addChild(backgroundLayer);
		backgroundLayer.addChild(background1);
		backgroundLayer.addChild(background2);
		root.addChild(avatarLayer);
		avatarLayer.addChild(avatar1);
		avatarLayer.addChild(avatar2);
		state = {
			legacyId: legacyDynamicId++,
			player,
			renderer,
			root,
			backgroundLayer,
			background1,
			background2,
			avatarLayer,
			avatar1,
			avatar2,
			records: { primary: null, deputy: null },
			background: null,
			outcropMask: window.decadeUI?.config?.dynamicSkinOutcrop || false,
			rect: { width: 0, height: 0 },
			visibleRect: { width: 0, height: 0, extraTop: 0 },
			domOpacity: 1,
			dynamicZoomScale: this.getDynamicZoomScale(),
		};
		state.api = this.createPlayerApi(state);
		this.legacyStates.set(state.legacyId, state);
		this.playerStates.set(player, state);
		this.activeStates.add(state);
		this.updatePlayerLayout(state, true);
		this.startLayoutLoop();
		return state;
	}

	createPlayerApi(state) {
		const legacyRenderer = state.renderer;
		const api = {
			_decadeSharedDynamic: true,
			id: state.legacyId,
			offscreen: false,
			actualRenderer: state.renderer,
			canvas: state.renderer.canvas,
			primary: null,
			deputy: null,
			play: sprite => this.play(state.player, sprite, false),
			stop: handle => this.stopHandle(state, handle),
			stopAll: () => this.stopAll(state),
			update: () => this.updatePlayerLayout(state, true),
			destroy: () => this.destroyPlayerState(state),
		};
		Object.defineProperty(api, "renderer", {
			configurable: false,
			enumerable: true,
			get: () => legacyRenderer,
			// 某些旧扩展会尝试回填 renderer。共享播放器只有一个真实
			// renderer，这里保留稳定门面，不允许外部赋值把消息桥覆盖掉。
			set: () => {},
		});
		Object.defineProperty(api, "outcropMask", {
			get: () => state.outcropMask,
			set: value => {
				state.outcropMask = value || false;
				this.updatePlayerLayout(state, true);
			},
		});
		return api;
	}

	play(player, sprite, isDeputy) {
		if (void 0 === sprite) {
			console.error("playDynamic: 参数1不能为空");
			return null;
		}
		const state = this.getPlayerState(player);
		let data = cloneSprite(sprite);
		if (!data.name) {
			console.error("playDynamic: 缺少 spine name");
			return null;
		}
		if (player.doubleAvatar) data = applyDoubleAvatarOffset(data, !!isDeputy);
		data.id = data.id ?? builtId++;
		if (!data.player || "object" != typeof data.player) {
			const legacyPlayer = { ...data };
			delete legacyPlayer.player;
			data.player = legacyPlayer;
		}
		data.loop = data.loop ?? true;
		const slot = isDeputy ? "deputy" : "primary";
		this.stopSlot(state, slot);
		if (player.$dynamicWrap.parentNode !== player) player.appendChild(player.$dynamicWrap);
		player.$dynamicWrap.style.removeProperty("background-image");
		state.outcropMask = window.decadeUI?.config?.dynamicSkinOutcrop || false;
		this.updatePlayerLayout(state, true);
		this.updateHiddenSlots(state);
		const record = {
			slot,
			handle: data,
			nodes: [],
			cancelled: false,
			hidden: this.isSlotHidden(state, slot),
		};
		data._decadeDynamicRecord = record;
		state.records[slot] = record;
		state.api[slot] = data;
		this.updateHiddenSlots(state);
		if (data.beijing) this.createBeijingNode(state, record, data.beijing);
		this.createSpineNode(state, record, data);
		return data;
	}

	playDynamic(target, sprite, isDeputy, options = {}) {
		if (target instanceof Element) return this.playDynamicTo(target, sprite, { ...options, isDeputy });
		const renderer = this.ensureUpperRenderer();
		const container = renderer.createContainer({ name: "dynamic", zIndex: options.zIndex ?? dynamicCanvasLayers.player.containers.player });
		// 全屏特效层默认 rect 基准与 getCanvasLocalRect 一致：
		// - 原生 getBoundingClientRect：localRect 返回视觉像素，canvas.clientWidth 需乘 bodyZoom。
		// - 被劫持（皮肤切换扩展）：localRect 返回布局像素，canvas.clientWidth 已是布局像素，不乘。
		// 调用方显式传入的 options.rect 视为与当前模式匹配的像素，不做转换。
		const hijacked = isGetBoundingClientRectHijacked();
		const zoom = hijacked ? 1 : getDocumentZoom();
		const rect = options.rect || { left: 0, top: 0, width: (renderer.canvas.clientWidth || window.innerWidth) * zoom, height: (renderer.canvas.clientHeight || window.innerHeight) * zoom };
		container.setPosition(rect.left, rect.top);
		container.setContentSize(rect.width, rect.height);
		const data = cloneSprite(target);
		data.id = data.id ?? builtId++;
		data.loop = data.loop ?? true;
		const record = { slot: "floating", handle: data, nodes: [], cancelled: false };
		this.createFloatingSpineNode(renderer, container, record, data);
		return {
			handle: data,
			container,
			stop: () => {
				record.cancelled = true;
				for (const node of record.nodes) {
					container.removeChild(node);
					node.destroy();
				}
				renderer.destroyContainer(container);
			},
		};
	}

	playDynamicTo(target, sprite, options = {}) {
		if (!(target instanceof Element)) return null;
		const isDeputy = !!options.isDeputy;
		const handle = this.play(target, sprite, isDeputy);
		return {
			handle,
			stop: () => {
				const state = this.playerStates.get(target);
				state?.api?.stop?.(handle);
			},
			destroy: () => {
				const state = this.playerStates.get(target);
				state?.api?.destroy?.();
			},
		};
	}

	async createFloatingSpineNode(renderer, container, record, sprite) {
		const filename = this.resolveDynamicPath(sprite.name);
		const skelType = (sprite.skelType || (sprite.json ? "json" : "skel")).toLowerCase();
		const loaded = await renderer.loadSpineAssets(filename, skelType);
		if (!loaded || record.cancelled) return;
		const node = await renderer.createSpineNode(filename, { ...sprite, name: filename, skelType });
		if (!node || record.cancelled) {
			node?.destroy?.();
			return;
		}
		node._origMeta = { x: sprite.x ?? [0, 0.5], y: sprite.y ?? [0, 0.5], scale: sprite.scale };
		node._containerRect = { width: container.width, height: container.height };
		renderer._setupAnimation(node, { ...sprite, name: filename, skelType });
		container.addChild(node);
		node._containerRect = { width: container._contentWidth, height: container._contentHeight };
		record.nodes.push(node);
		renderer.start();
	}

	async createSpineNode(state, record, sprite) {
		const renderer = state.renderer;
		const filename = this.resolveDynamicPath(sprite.name);
		const skelType = (sprite.skelType || (sprite.json ? "json" : "skel")).toLowerCase();
		const loaded = await renderer.loadSpineAssets(filename, skelType);
		if (!loaded || record.cancelled) return;
		console.log("[十周年UI调试-createSpineNode] 创建spine节点, filename=", filename, "state.rect=", JSON.stringify(state.rect), "dynamicZoomScale=", state.dynamicZoomScale);
		const meta = {
			name: filename,
			action: sprite.action,
			loop: sprite.loop ?? true,
			loopCount: sprite.loopCount,
			speed: sprite.speed ?? 1,
			x: sprite.x,
			y: sprite.y,
			width: sprite.width,
			height: sprite.height,
			scale: sprite.scale,
			angle: sprite.angle,
			rotation: sprite.rotation,
			mirror: sprite.mirror,
			flipX: sprite.flipX ?? sprite.filpX,
			flipY: sprite.flipY ?? sprite.filpY,
			opacity: sprite.opacity,
			alpha: sprite.alpha,
			hideSlots: sprite.hideSlots,
			clipSlots: sprite.clipSlots,
			disableMask: sprite.disableMask,
			skelType,
			version: sprite.version,
		};
		const node = await renderer.createSpineNode(filename, meta);
		if (!node || record.cancelled) {
			node?.destroy?.();
			return;
		}
		node.flipX = !!meta.flipX || !!meta.mirror;
		node.flipY = !!meta.flipY;
		node.opacity = meta.opacity ?? 1;
		node.visible = record.hidden !== true;
		node._origMeta = {
			x: meta.x ?? [0, 0.5],
			y: meta.y ?? [0, 0.5],
			scale: meta.scale,
		};
		node._containerRect = { ...state.rect };
		this.syncDynamicNodeScale(node, state.dynamicZoomScale);
		renderer._setupAnimation(node, meta);
		this.setupLegacyIdleSequence(node, sprite, false);
		const container = record.slot === "deputy" ? state.avatar2 : state.avatar1;
		container.addChild(node);
		record.nodes.push(node);
		renderer.start();
		// 旧动态 Worker 在待机骨骼就绪后发送 loadFinish，皮肤切换据此
		// 完成 StartPlay/playSkinEnd 生命周期握手。共享播放器已经直接创建
		// 节点，但仍需发出同样的协议事件供外部扩展继续工作。
		this.emitLegacyRendererMessage({ id: state.legacyId, type: "loadFinish", sprite: record.handle });
	}

	async createBeijingNode(state, record, sprite) {
		const renderer = state.renderer;
		const data = cloneSprite(sprite);
		if (!data.name) return;
		const filename = this.resolveDynamicPath(data.name);
		const skelType = (data.skelType || (data.json ? "json" : "skel")).toLowerCase();
		const loaded = await renderer.loadSpineAssets(filename, skelType);
		if (!loaded || record.cancelled) return;
		const meta = {
			name: filename,
			action: data.action,
			loop: data.loop ?? true,
			loopCount: data.loopCount,
			speed: data.speed ?? 1,
			x: data.x,
			y: data.y,
			width: data.width,
			height: data.height,
			scale: data.scale,
			angle: data.angle,
			rotation: data.rotation,
			mirror: data.mirror,
			flipX: data.flipX ?? data.filpX,
			flipY: data.flipY ?? data.filpY,
			opacity: data.opacity,
			alpha: data.alpha,
			hideSlots: data.hideSlots,
			clipSlots: data.clipSlots,
			disableMask: data.disableMask,
			skelType,
			version: data.version,
		};
		const node = await renderer.createSpineNode(filename, meta);
		if (!node || record.cancelled) {
			node?.destroy?.();
			return;
		}
		node.flipX = !!meta.flipX || !!meta.mirror;
		node.flipY = !!meta.flipY;
		node.opacity = meta.opacity ?? 1;
		node.visible = record.hidden !== true;
		node._origMeta = {
			x: meta.x ?? [0, 0.5],
			y: meta.y ?? [0, 0.5],
			scale: meta.scale,
		};
		node._containerRect = { width: state.visibleRect.width, height: state.visibleRect.height };
		this.syncDynamicNodeScale(node, state.dynamicZoomScale);
		renderer._setupAnimation(node, meta);
		this.setupLegacyIdleSequence(node, data, true);
		const container = record.slot === "deputy" ? state.background2 : state.background1;
		container.addChild(node);
		node._decadeDynamicLayer = "background";
		record.nodes.push(node);
		renderer.start();
	}

	async setBackground(state, background) {
		const src = this.resolveDynamicPath(background);
		if (state.background?.src === src) return;
		this.clearBackground(state);
		const node = new ImageNode(src, { x: [0, 0.5], y: [0, 0.5], width: [0, 1], height: [0, 1], fit: "stretch", opacity: 1 });
		state.background = { src, node };
		state.backgroundLayer.addChild(node);
		node._origMeta = { x: [0, 0.5], y: [0, 0.5] };
		node._containerRect = { width: state.visibleRect.width, height: state.visibleRect.height };
		await node.load();
		if (state.background?.node !== node) {
			node.destroy();
			return;
		}
		state.renderer.start();
	}

	findAnimationName(node, names) {
		const animations = node?.skeleton?.data?.animations || [];
		for (const expected of names.filter(Boolean)) {
			const found = animations.find(animation => animation.name.toLowerCase() === String(expected).toLowerCase());
			if (found) return found.name;
		}
		return null;
	}

	setupLegacyIdleSequence(node, sprite, isBackground) {
		if (!node?.state || !node?.skeleton?.data) return;
		const legacyConfig = sprite.player && "object" == typeof sprite.player ? sprite.player : sprite;
		const rawAction = "string" == typeof sprite.action ? sprite.action : "string" == typeof legacyConfig.action ? legacyConfig.action : null;
		// chuchang 不能成为循环待机标签，否则 recoverDaiJi 后会永久循环出场。
		const configuredAction = rawAction && !/^chuchang$/i.test(rawAction) ? rawAction : null;
		const idle = this.findAnimationName(node, [configuredAction, ...(isBackground ? ["DaiJi", "BeiJing", "play", "idle", "animation"] : ["DaiJi", "play", "idle", "animation"])]);
		const embeddedIntro = !isBackground && true !== legacyConfig.shizhounian ? this.findAnimationName(node, [legacyConfig.ss_jinchang, "ChuChang"]) : null;
		if (idle) {
			// 非 shizhounian 动皮可能把出场做成主骨骼 action：只播一次，
			// 然后由 Spine AnimationState 队列切回待机。shizhounian 的
			// chuchang 通常是独立骨骼，交给皮肤切换的出框 Worker 播放。
			if (embeddedIntro && embeddedIntro !== idle) {
				node.state.setAnimation(0, embeddedIntro, false).mixDuration = 0;
				node.state.addAnimation(0, idle, true, 0);
			} else {
				node.state.setAnimation(0, idle, true).mixDuration = 0;
			}
			node.action = idle;
			node.loop = true;
			node._decadeIdleAction = idle;
		}
	}

	clearBackground(state) {
		const node = state.background?.node;
		if (node) {
			const container = node.container;
			container?.removeChild?.(node);
			node.destroy();
		}
		state.background = null;
	}

	stopSlot(state, slot) {
		const record = state.records[slot];
		if (record) this.stopRecord(state, record);
	}

	stopHandle(state, handle) {
		const record = handle?._decadeDynamicRecord;
		if (record) this.stopRecord(state, record);
	}

	stopRecord(state, record) {
		record.cancelled = true;
		for (const node of record.nodes) {
			const container = node.container;
			container?.removeChild?.(node);
			node.destroy();
		}
		record.nodes.length = 0;
		if (state.records[record.slot] === record) state.records[record.slot] = null;
		if (state.api[record.slot] === record.handle) state.api[record.slot] = null;
		record.handle._decadeDynamicRecord = null;
	}

	stopAll(state) {
		this.stopSlot(state, "primary");
		this.stopSlot(state, "deputy");
		this.clearBackground(state);
	}

	destroyPlayerState(state) {
		this.stopAll(state);
		state.renderer.destroyContainer(state.avatar1);
		state.renderer.destroyContainer(state.avatar2);
		state.renderer.destroyContainer(state.avatarLayer);
		state.renderer.destroyContainer(state.background1);
		state.renderer.destroyContainer(state.background2);
		state.renderer.destroyContainer(state.backgroundLayer);
		state.renderer.destroyContainer(state.root);
		this.activeStates.delete(state);
		this.legacyStates.delete(state.legacyId);
		this.playerStates.delete(state.player);
	}

	getLegacyRecord(state, skinId, isPrimary) {
		const records = Object.values(state?.records || {}).filter(Boolean);
		return records.find(record => record.handle?.id === skinId) || ("boolean" == typeof isPrimary ? state?.records?.[isPrimary ? "primary" : "deputy"] : null) || records[0] || null;
	}

	emitLegacyRendererMessage(data) {
		const renderer = this.upperRenderer;
		if ("function" != typeof renderer?.onmessage) return;
		queueMicrotask(() => renderer.onmessage({ data }));
	}

	handleLegacyRendererMessage(message) {
		if (!message || "object" != typeof message) return;
		const messageId = message.id ?? message.data?.id;
		const state = this.legacyStates.get(messageId);
		if (!state && "StartPlay" !== message.message) return;
		const record = this.getLegacyRecord(state, message.skinID ?? message.skinId, message.isPrimary);
		const nodes = record?.nodes || [];
		const setVisible = visible => {
			if (record) record.hidden = !visible;
			for (const node of nodes) {
				node.visible = visible;
				node.opacity = visible ? 1 : 0;
			}
			state?.renderer?.start?.();
		};
		const setAllVisible = visible => {
			for (const currentRecord of Object.values(state?.records || {})) {
				if (!currentRecord) continue;
				currentRecord.hidden = !visible;
				for (const node of currentRecord.nodes) {
					node.visible = visible;
					node.opacity = visible ? 1 : 0;
				}
			}
			state?.renderer?.start?.();
		};
		switch (message.message) {
			case "StartPlay":
				if (state) this.emitLegacyRendererMessage({ id: state.legacyId, type: "playSkinEnd" });
				return !!state;
			case "ACTION": {
				const action = message.action === "Qhly" ? "GongJi" : message.action;
				let played = false;
				for (const node of nodes) {
					const nextAction = this.findAnimationName(node, [action]);
					if (!nextAction) continue;
					node.visible = true;
					node.opacity = 1;
					const idle = node._decadeIdleAction;
					if (nextAction === idle) {
						node.state.setAnimation(0, nextAction, true).mixDuration = 0;
					} else {
						node.state.setAnimation(0, nextAction, false).mixDuration = 0;
						if (idle) node.state.addAnimation(0, idle, true, 0);
					}
					played = true;
				}
				state.renderer.start();
				return played;
			}
			case "SHOW":
				setVisible(true);
				return true;
			case "HIDE":
			case "HIDE2":
				setVisible(false);
				return true;
			case "hideAllNode":
				setAllVisible(false);
				this.emitLegacyRendererMessage({ id: state.legacyId, type: "hideAllNodeEnd" });
				return true;
			case "recoverDaiJi":
				setVisible(true);
				for (const node of nodes) {
					const idle = node._decadeIdleAction || this.findAnimationName(node, ["DaiJi", "play", "idle", "animation"]);
					if (idle) node.state.setAnimation(0, idle, true).mixDuration = 0;
				}
				state?.renderer?.start?.();
				return true;
			case "RESIZE":
			case "ADJUST":
				for (const node of nodes) {
					const meta = (node._origMeta ||= {});
					if (null != message.x) meta.x = node.x = message.x;
					if (null != message.y) meta.y = node.y = message.y;
					if (null != message.scale) meta.scale = node.scale = message.scale;
					if (null != message.angle) node.angle = message.angle;
				}
				state.renderer.start();
				return true;
			case "changeSkelSkin":
				for (const node of nodes) {
					try {
						node.skeleton?.setSkinByName?.(message.skinName);
						node.skeleton?.setSlotsToSetupPose?.();
					} catch (error) {
						console.warn(`[十周年UI] 旧动皮接口切换 Skeleton skin 失败：${message.skinName}`, error);
					}
				}
				state.renderer.start();
				return true;
			case "CHANGE_ACTION": {
				const skinInfo = message.skinInfo || {};
				if (record?.handle?.player && "object" == typeof skinInfo) Object.assign(record.handle.player, skinInfo);
				for (const node of nodes) {
					if (message.isDefault) {
						const idle = node._decadeIdleAction || this.findAnimationName(node, ["DaiJi", "play", "idle", "animation"]);
						if (idle) node.state.setAnimation(0, idle, true).mixDuration = 0;
					}
					else {
						const action = this.findAnimationName(node, [skinInfo.action]);
						if (action) node.setAction(action, 0);
					}
				}
				state.renderer.start();
				return true;
			}
			case "UPDATE":
				this.updatePlayerLayout(state, true);
				return true;
			default:
				return false;
		}
	}

	updatePlayerLayout(state, force) {
		const { player, root, backgroundLayer, background1, background2, avatarLayer, avatar1, avatar2 } = state;
		this.updateHiddenSlots(state);
		this.updateDomOpacity(state);
		let anchor = player.$dynamicWrap;
		if (!anchor || !player.isConnected) {
			root.setVisible(false);
			return;
		}
		let rect = anchor.getBoundingClientRect();
		if (!rect.width && !rect.height) rect = player.getBoundingClientRect();
		const visible = !!(rect.width && rect.height && player.offsetParent !== null);
		root.setVisible(visible);
		if (!visible) return;
		const compatMode = isDynamicZoomCompatibilityEnabled();
		const localRect = getCanvasLocalRect(rect, state.renderer.canvas, compatMode);
		if (!state._layoutDebugLogged) {
			state._layoutDebugLogged = true;
			const canvas = state.renderer.canvas;
			const canvasRect = canvas.getBoundingClientRect();
			const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom) || 1;
			const gameZoom = game?.documentZoom;
			const winZoom = window.documentZoom;
			console.log("[十周年UI调试-Layout]", {
				player: player?.name,
				compatMode,
				gameZoom, winZoom, bodyZoom,
				anchorRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
				localRect,
				canvasCss: { w: canvas.clientWidth, h: canvas.clientHeight },
				canvasRect: { left: canvasRect.left, top: canvasRect.top, w: canvasRect.width, h: canvasRect.height },
				canvasBacking: { w: canvas.width, h: canvas.height },
				canvasScaleX: canvas.width / (canvasRect.width || 1),
			});
		}
		const outcrop = getDynamicOutcropConfig(state.outcropMask);
		const extraTop = outcrop ? Math.round(localRect.height * outcrop.extraTopRatio) : 0;
		const width = localRect.width;
		const height = localRect.height + extraTop;
		const left = localRect.left;
		const top = localRect.top - extraTop;
		const dynamicZoomScale = this.getDynamicZoomScale();
		if (force || state.rect.width !== width || state.rect.height !== height || state.rect.left !== left || state.rect.top !== top || state.visibleRect.extraTop !== extraTop || state.dynamicZoomScale !== dynamicZoomScale) {
			state.rect = { left, top, width, height };
			state.visibleRect = { width, height: localRect.height, extraTop };
			state.dynamicZoomScale = dynamicZoomScale;
			root.setPosition(left, top);
			root.setContentSize(width, height);
			root.setMask(null);
			const uiStyle = getCurrentUiStyle();
			const lutouEnabled = !!outcrop;
			const baseMask = SpineMask.fromLegacyDrawMask([0, 0, width, localRect.height], "bg", lutouEnabled, uiStyle);
			backgroundLayer.setPosition(0, extraTop);
			backgroundLayer.setContentSize(width, localRect.height);
			backgroundLayer.setMask(baseMask);
			background1.setPosition(0, 0);
			background2.setPosition(0, 0);
			background1.setContentSize(width, localRect.height);
			background2.setContentSize(width, localRect.height);
			avatarLayer.setPosition(0, 0);
			avatarLayer.setContentSize(width, height);
			// 移动版露头时，人物与背景使用同一尺寸、同一全局起点的遮罩。
			const avatarMaskLocation = lutouEnabled && uiStyle === "off"
				? [0, extraTop, width, localRect.height]
				: [0, 0, width, height];
			avatarLayer.setMask(SpineMask.fromLegacyDrawMask(avatarMaskLocation, "pe", lutouEnabled, uiStyle));
			avatar1.setPosition(0, 0);
			avatar2.setPosition(0, 0);
			if (player.doubleAvatar) {
				background1.setMask(SpineMask.rect(0, 0, width / 2, localRect.height));
				background2.setMask(SpineMask.rect(width / 2, 0, width / 2, localRect.height));
				avatar1.setMask(SpineMask.rect(0, 0, width / 2, height));
				avatar2.setMask(SpineMask.rect(width / 2, 0, width / 2, height));
			} else {
				background1.setMask(null);
				background2.setMask(null);
				avatar1.setMask(null);
				avatar2.setMask(null);
			}
			this.updateNodeRects(state);
		}
	}

	updateNodeRects(state) {
		const rect = { width: state.rect.width, height: state.rect.height };
		const backgroundRect = { width: state.visibleRect.width, height: state.visibleRect.height };
		const zoomScale = state.dynamicZoomScale || this.getDynamicZoomScale();
		for (const record of Object.values(state.records)) {
			if (!record) continue;
			for (const node of record.nodes) {
				node._containerRect = node._decadeDynamicLayer === "background" ? backgroundRect : rect;
				this.syncDynamicNodeScale(node, zoomScale);
			}
		}
		if (state.background?.node) state.background.node._containerRect = backgroundRect;
	}

	updateDomOpacity(state) {
		const opacity = getPlayerLocalOpacity(state.player);
		if (Math.abs(opacity - state.domOpacity) < 0.01) {
			this.updateCanvasOpacityState();
			return;
		}
		state.domOpacity = opacity;
		this.updateCanvasOpacityState();
		this.syncStateOpacity(state);
	}

	updateCanvasOpacityState() {
		const renderer = this.upperRenderer;
		if (!renderer?.canvas) return;
		const dimmed = isMenuDimmed();
		const states = [...this.activeStates].filter(state => state.player?.isConnected && state.root.visible !== false);
		let nextOpacity = dimmed ? 0.5 : 1;
		const opacities = states.map(state => state.domOpacity).filter(value => Number.isFinite(value));
		if (opacities.length > 1) {
			const minOpacity = Math.min(...opacities);
			const maxOpacity = Math.max(...opacities);
			if (maxOpacity < 0.99 && maxOpacity - minOpacity < 0.05) nextOpacity = Math.min(nextOpacity, minOpacity);
		}
		if (Math.abs(nextOpacity - this.canvasOpacity) < 0.01 && dimmed === this.menuDimmed) return;
		this.menuDimmed = dimmed;
		this.canvasOpacity = nextOpacity;
		renderer.canvas.style.opacity = nextOpacity < 0.99 ? String(nextOpacity) : "";
		renderer.canvas.style.transition = nextOpacity < 0.99 ? "opacity 0.12s linear" : "";
		for (const state of states) this.syncStateOpacity(state);
		renderer.start();
	}

	syncStateOpacity(state) {
		const canvasOpacity = this.canvasOpacity || 1;
		const nextAlpha = Math.max(0, Math.min(1, canvasOpacity < 0.99 ? state.domOpacity / canvasOpacity : state.domOpacity));
		if (Math.abs(nextAlpha - state.root.alpha) < 0.01) return;
		state.root.alpha = nextAlpha;
		state.root.updateTransform();
		state.renderer.start();
	}

	isSlotHidden(state, slot) {
		const player = state.player;
		if (!player || player === game.me || player._trueMe === game.me) return false;
		const classList = player.classList;
		return slot === "deputy" ? classList.contains("unseen2") && !classList.contains("unseen2_show") : classList.contains("unseen") && !classList.contains("unseen_show");
	}

	updateHiddenSlots(state) {
		const primaryHidden = this.isSlotHidden(state, "primary");
		const deputyHidden = this.isSlotHidden(state, "deputy");
		state.player?.classList?.toggle("decade-dynamic-primary-hidden", primaryHidden);
		state.player?.classList?.toggle("decade-dynamic-deputy-hidden", deputyHidden);
		state.avatar1.setVisible(!primaryHidden);
		state.avatar2.setVisible(!deputyHidden);
		for (const slot of ["primary", "deputy"]) {
			const record = state.records[slot];
			if (!record) continue;
			const hidden = slot === "deputy" ? deputyHidden : primaryHidden;
			if (record.hidden === hidden) continue;
			record.hidden = hidden;
			for (const node of record.nodes) node.visible = !hidden;
			state.renderer.start();
		}
	}

	startLayoutLoop() {
		if (this.layoutFrame) return;
		const tick = () => {
			this.layoutFrame = null;
			if (!this.activeStates.size) return;
			this.syncUpperCanvasBounds();
			for (const state of this.activeStates) this.updatePlayerLayout(state);
			this.layoutFrame = requestAnimationFrame(tick);
		};
		this.layoutFrame = requestAnimationFrame(tick);
	}

	refreshZoomCompatibility() {
		for (const state of this.activeStates) this.updatePlayerLayout(state, true);
		this.upperRenderer?.start?.();
	}

	resolveDynamicPath(path) {
		if (!path) return path;
		if (isExternalPath(path) || path.startsWith(this.pathPrefix)) return path;
		return `${this.pathPrefix}${path}`;
	}
}

function refreshSharedDynamicZoomCompatibility() {
	sharedDynamicRenderer?.refreshZoomCompatibility();
}

export { SharedDynamicRenderer, getSharedDynamicRenderer, refreshSharedDynamicZoomCompatibility };
