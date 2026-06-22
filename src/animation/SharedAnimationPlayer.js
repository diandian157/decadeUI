import { SpineRenderer } from "./SpineRenderer.js";
import { SpineMask } from "./SpineMask.js";
import { dynamicCanvasLayers } from "./containerConfig.js";

let handleId = 0;

function cloneSprite(sprite) {
	if ("string" == typeof sprite) return { name: sprite };
	return { ...(sprite || {}) };
}

function getDocumentZoom() {
	const gameZoom = globalThis.game?.documentZoom;
	if (Number.isFinite(gameZoom) && gameZoom > 0) return gameZoom;
	const windowZoom = window.documentZoom;
	if (Number.isFinite(windowZoom) && windowZoom > 0) return windowZoom;
	const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom);
	if (Number.isFinite(bodyZoom) && bodyZoom > 0) return bodyZoom;
	return 1;
}

function isMobileDevice() {
	return !!globalThis.lib?.device || /Android|iPhone|iPad|iPod|Mobile/i.test(globalThis.navigator?.userAgent || "");
}

function getMobileDeviceScale() {
	if (!isMobileDevice()) return 1;
	const scale = globalThis.game?.deviceZoom;
	return Number.isFinite(scale) && scale > 0 ? Math.min(scale, 1) : 1;
}

function getFullscreenViewportScale() {
	if (!isMobileDevice()) return 1;
	const deviceScale = getMobileDeviceScale();
	const viewport = globalThis.visualViewport;
	const width = viewport?.width || globalThis.innerWidth || document.documentElement.clientWidth || 1280;
	const height = viewport?.height || globalThis.innerHeight || document.documentElement.clientHeight || 720;
	return Math.min(deviceScale, width / 1280, height / 720, 1) * 0.8;
}

function applyScaleFactor(value, factor) {
	if (Array.isArray(value)) return value.map(item => (Number(item) || 0) * factor);
	return (Number(value) || 1) * factor;
}

function applyFullscreenCanvasStyle(canvas, zIndex) {
	if (!(canvas instanceof HTMLCanvasElement)) return false;
	const zoom = getDocumentZoom();
	const transform = zoom !== 1 ? `matrix(${1 / zoom}, 0, 0, ${1 / zoom}, 0, 0)` : "";
	const changed = canvas.style.transform !== transform || canvas.style.zIndex !== String(zIndex);
	Object.assign(canvas.style, {
		display: "block",
		position: "fixed",
		left: "0",
		top: "0",
		width: "100vw",
		height: "100vh",
		pointerEvents: "none",
		zIndex: String(zIndex),
		transformOrigin: "left top",
		transform,
	});
	return changed;
}

function getDomAnimationKind(dom, requestedKind) {
	if (requestedKind) return requestedKind;
	if (!(dom instanceof HTMLElement)) return null;
	if (dom.classList.contains("player")) return "player";
	if (dom.classList.contains("card")) return "card";
	return null;
}

function isAnimationDebugEnabled(...kinds) {
	const flag = window.decadeUIAnimationDebug ?? window.dcdAnimDebug;
	if (flag === true) return true;
	const list = Array.isArray(flag) ? flag : [flag];
	return kinds.flat().some(kind => kind && list.includes(kind));
}

function getZoomSnapshot() {
	return {
		bodyZoom: parseFloat(window.getComputedStyle(document.body).zoom) || 1,
		gameZoom: globalThis.game?.documentZoom,
		windowZoom: window.documentZoom,
		documentZoom: getDocumentZoom(),
	};
}

function toPlainRect(rect) {
	if (!rect) return null;
	return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height, x: rect.x, y: rect.y };
}

function safeDebugString(payload) {
	try {
		return JSON.stringify(payload);
	} catch (error) {
		return String(error?.message || error);
	}
}

function pushDebugHistory(type, payload) {
	const history = (window.dcdAnimDebugHistory ||= []);
	history.push({ type, time: Date.now(), payload });
	if (history.length > 60) history.splice(0, history.length - 60);
}

class SharedAnimationPlayer {
	constructor(pathPrefix, canvasId = dynamicCanvasLayers.upper.canvasId) {
		const layer = canvasId === dynamicCanvasLayers.domEffect.canvasId ? dynamicCanvasLayers.domEffect : dynamicCanvasLayers.upper;
		this.pathPrefix = pathPrefix;
		this.layer = layer;
		this.records = new Map();
		this.domContainers = new Map();
		this.boundsCache = new Map();
		this.actionsCache = new Map();
		this.layoutFrame = null;
		let canvas = document.getElementById(canvasId);
		if (!canvas) {
			canvas = document.createElement("canvas");
			canvas.id = canvasId;
			canvas.className = "animation-player";
			document.body.appendChild(canvas);
		}
		applyFullscreenCanvasStyle(canvas, layer.cssZIndex);
		this.renderer = new SpineRenderer(canvas, { dprAdaptive: true });
		applyFullscreenCanvasStyle(this.renderer.canvas, layer.cssZIndex);
		this.canvas = this.renderer.canvas;
		this.gl = this.renderer.gl;
		this.fullscreenContainer = this.renderer.createContainer({
			name: "fullscreenEffect",
			zIndex: layer.containers.fullscreenEffect,
		});
		this.cap = {
			animations: [{ hasSpine: name => this.hasSpine(name) }],
			loadSpine: (name, fileType, done, fail) => this.loadSpine(name, fileType, done, fail),
			playSpineTo: (node, sprite, position) => this.playSpine(sprite, { ...(position || {}), parent: node, containerKind: getDomAnimationKind(node, position?.containerKind) }),
		};
		window.dcdAnimDebugDump = () => this.dumpDebugState();
	}

	syncCanvasStyle() {
		if (applyFullscreenCanvasStyle(this.canvas, this.layer.cssZIndex)) {
			this.renderer.resized = false;
			this.renderer.updateCanvasSize?.(true);
		}
	}

	hasSpine(name) {
		return !!this.renderer.loadedAssets[this.resolvePath(name)];
	}

	loadSpine(name, fileType = "skel", done, fail) {
		this.renderer.loadSpineAssets(this.resolvePath(name), fileType).then(success => {
			if (success) this.cacheSpineMeta(name, fileType).finally(() => done?.());
			else fail?.();
		});
	}

	prepSpine() {}

	playSpine(sprite, position = {}) {
		this.syncCanvasStyle();
		const data = cloneSprite(sprite);
		if (!data?.name) return null;
		const parent = position.parent instanceof HTMLElement ? position.parent : null;
		const containerKind = getDomAnimationKind(parent, position.containerKind);
		if (data.loop && parent && containerKind === "player") this.stopDomLoopSpine(parent);
		const id = data.id ?? handleId++;
		const handle = this.createHandle(id);
		const record = { id, handle, nodes: [], container: null, cancelled: false, loop: !!data.loop, parentDom: parent };
		this.records.set(id, record);
		this.createNode(record, data, position);
		return handle;
	}

	loopSpine(sprite, position) {
		const data = cloneSprite(sprite);
		data.loop = true;
		return this.playSpine(data, position);
	}

	stopSpine(handle) {
		const id = handle?.id ?? handle;
		const record = this.records.get(id);
		if (!record) return null;
		this.destroyRecord(record);
		return handle;
	}

	stopSpineAll() {
		for (const record of [...this.records.values()]) this.destroyRecord(record);
	}

	getSpineActions(name) {
		const filename = this.resolvePath(name);
		const cached = this.actionsCache.get(filename);
		if (cached) return cached;
		for (const record of this.records.values()) {
			const node = record.nodes.find(node => node.skeleton?.name === filename);
			if (node) {
				const actions = this.renderer.getSpineActions(node);
				this.actionsCache.set(filename, actions);
				return actions;
			}
		}
		return [];
	}

	getSpineBounds(name) {
		this.syncCanvasStyle();
		this.renderer.updateCanvasSize?.();
		const filename = this.resolvePath(name);
		const cached = this.boundsCache.get(filename);
		if (cached) return cached;
		for (const record of this.records.values()) {
			const node = record.nodes.find(node => node.skeleton?.name === filename);
			if (node?.bounds) {
				this.boundsCache.set(filename, node.bounds);
				return node.bounds;
			}
		}
		return null;
	}

	async cacheSpineMeta(name, fileType = "skel") {
		const filename = this.resolvePath(name);
		if (this.boundsCache.has(filename) && this.actionsCache.has(filename)) return;
		const skelType = (fileType || "skel").toLowerCase();
		try {
			const node = await this.renderer.createSpineNode(filename, { skelType });
			if (!node) return;
			if (node.bounds) this.boundsCache.set(filename, node.bounds);
			this.actionsCache.set(filename, this.renderer.getSpineActions(node));
			if (node._assetFilename && this.renderer._assetRefCount?.[node._assetFilename]) {
				this.renderer._assetRefCount[node._assetFilename]--;
				if (this.renderer._assetRefCount[node._assetFilename] <= 0) delete this.renderer._assetRefCount[node._assetFilename];
			}
			node._assetFilename = null;
			node.destroy();
		} catch (error) {
			console.warn("[SharedAnimationPlayer] cacheSpineMeta failed:", filename, error);
		}
	}

	createHandle(id) {
		const handle = {
			id,
			completed: false,
			fadeTo: value => {
				const record = this.records.get(id);
				record?.nodes.forEach(node => node.fadeTo?.(value));
				return handle;
			},
			setAction: (action, mixDuration) => {
				const record = this.records.get(id);
				record?.nodes.forEach(node => node.setAction?.(action, mixDuration));
				return handle;
			},
			resetAction: mixDuration => {
				const record = this.records.get(id);
				record?.nodes.forEach(node => node.resetAction?.(mixDuration));
				return handle;
			},
		};
		return handle;
	}

	getNodeDuration(node, meta) {
		const actions = this.renderer.getSpineActions(node);
		if (!actions?.length) return 2500;
		const durationOf = name => actions.find(action => action.name === name)?.duration || 0;
		if (Array.isArray(meta.action)) {
			const total = meta.action.reduce((sum, name) => sum + durationOf(name), 0);
			return total > 0 ? total * 1000 : 2500;
		}
		if (meta.action) {
			const duration = durationOf(meta.action);
			return duration > 0 ? duration * 1000 : 2500;
		}
		const defaultAction = actions[actions.length > 1 ? 1 : 0];
		return defaultAction?.duration > 0 ? defaultAction.duration * 1000 : 2500;
	}

	scheduleAutoDestroy(record, node, meta) {
		if (meta.loop) return;
		const speed = Number.isFinite(meta.speed) && meta.speed > 0 ? meta.speed : 1;
		const duration = this.getNodeDuration(node, meta) / speed;
		const timeout = Math.max(500, duration + 300);
		record.autoDestroyTimer = setTimeout(() => {
			if (this.records.get(record.id) === record) this.destroyRecord(record);
		}, timeout);
	}

	async createNode(record, sprite, position) {
		this.syncCanvasStyle();
		const filename = this.resolvePath(sprite.name);
		const skelType = (sprite.skelType || (sprite.json ? "json" : "skel")).toLowerCase();
		const loaded = await this.renderer.loadSpineAssets(filename, skelType);
		if (!loaded || record.cancelled) return;
		const meta = {
			name: filename,
			action: sprite.action,
			loop: sprite.loop ?? false,
			loopCount: sprite.loopCount,
			speed: position.speed ?? sprite.speed ?? 1,
			x: position.x ?? sprite.x,
			y: position.y ?? sprite.y,
			width: position.width ?? sprite.width,
			height: position.height ?? sprite.height,
			scale: applyScaleFactor(position.scale ?? sprite.scale ?? 1, position.parent instanceof HTMLElement ? getMobileDeviceScale() : getFullscreenViewportScale()),
			angle: position.angle ?? sprite.angle,
			rotation: position.rotation ?? sprite.rotation,
			alpha: sprite.alpha,
			hideSlots: sprite.hideSlots,
			clipSlots: sprite.clipSlots,
			disableMask: sprite.disableMask,
			skelType,
			version: sprite.version,
		};
		const debugEnabled = isAnimationDebugEnabled("create", sprite.name, filename);
		if (debugEnabled) {
			const canvasRect = this.canvas.getBoundingClientRect();
			const payload = {
				stage: "SharedAnimationPlayer.createNode.before",
				recordId: record.id,
				name: sprite.name,
				filename,
				spriteScale: sprite.scale,
				positionScale: position.scale,
				meta: { x: meta.x, y: meta.y, width: meta.width, height: meta.height, scale: meta.scale },
				parent: position.parent instanceof HTMLElement
					? { className: String(position.parent.className || ""), kind: getDomAnimationKind(position.parent, position.containerKind) }
					: null,
				canvas: {
					width: this.canvas.width,
					height: this.canvas.height,
					clientWidth: this.canvas.clientWidth,
					clientHeight: this.canvas.clientHeight,
					rect: toPlainRect(canvasRect),
					styleTransform: this.canvas.style.transform,
				},
				zoom: getZoomSnapshot(),
			};
			pushDebugHistory("create-before", payload);
			console.warn("[DCD-ANIM create-before]", safeDebugString(payload));
		}
		const autoDestroy = !(sprite.loop ?? false);
		const oncomplete = position.oncomplete ?? sprite.oncomplete;
		if (autoDestroy || oncomplete) {
			meta.oncomplete = () => {
				oncomplete?.();
				if (autoDestroy && this.records.get(record.id) === record) this.destroyRecord(record);
			};
		}
		const node = await this.renderer.createSpineNode(filename, meta);
		if (!node || record.cancelled) {
			node?.destroy?.();
			return;
		}
		if (!(position.parent instanceof HTMLElement)) node._fullscreenConfiguredScale = position.scale ?? sprite.scale ?? 1;
		// DOM 本身会随 game.documentZoom 放大；共享全屏 canvas 则通过反向
		// transform 保持视觉尺寸不变。仅使用 scale 定位到 DOM 的特效需要在
		// 渲染阶段补回 documentZoom，显式 width/height 仍按 DOM 尺寸计算。
		node._scaleWithDocumentZoom = position.parent instanceof HTMLElement;
		if (node.bounds) this.boundsCache.set(filename, node.bounds);
		this.actionsCache.set(filename, this.renderer.getSpineActions(node));
		node.opacity = sprite.opacity ?? 1;
		this.renderer._setupAnimation(node, meta);
		if (autoDestroy) this.scheduleAutoDestroy(record, node, meta);
		const parent = position.parent instanceof HTMLElement ? position.parent : null;
		const containerKind = getDomAnimationKind(parent, position.containerKind);
		if (containerKind && parent) {
			const container = this.getDomContainer(parent, containerKind);
			record.container = container;
			node._origMeta = { x: meta.x ?? [0, 0.5], y: meta.y ?? [0, 0.5], scale: meta.scale };
			node._containerRect = { width: container._contentWidth, height: container._contentHeight };
			container.addChild(node);
		} else {
			node.referNode = parent || null;
			node.referFollow = parent ? position.follow !== false : false;
			if (!parent) {
				const canvasRect = this.canvas.getBoundingClientRect();
				const width = canvasRect.width || this.canvas.clientWidth || document.body.clientWidth || window.innerWidth || 0;
				const height = canvasRect.height || this.canvas.clientHeight || document.body.clientHeight || window.innerHeight || 0;
				node._origMeta = { x: meta.x ?? [0, 0.5], y: meta.y ?? [0, 0.5], scale: meta.scale };
				node._containerRect = { width, height };
			}
			this.fullscreenContainer.addChild(node);
		}
		if (debugEnabled) {
			const payload = {
				stage: "SharedAnimationPlayer.createNode.after",
				recordId: record.id,
				name: sprite.name,
				filename,
				containerKind: node.container?.name || "fullscreenEffect",
				node: {
					scale: node.scale,
					scaleX: node.scaleX,
					scaleY: node.scaleY,
					baseScale: node._baseScale,
					version: node.version,
					bounds: node.bounds?.size ? { x: node.bounds.size.x, y: node.bounds.size.y } : null,
					origMeta: node._origMeta,
					containerRect: node._containerRect,
				},
				container: node.container
					? {
							name: node.container.name,
							x: node.container.x,
							y: node.container.y,
							width: node.container._contentWidth,
							height: node.container._contentHeight,
							scaleX: node.container.scaleX,
							scaleY: node.container.scaleY,
					  }
					: null,
				zoom: getZoomSnapshot(),
			};
			pushDebugHistory("create-after", payload);
			console.warn("[DCD-ANIM create-after]", safeDebugString(payload));
		}
		record.nodes.push(node);
		this.renderer.start();
		this.startLayoutLoop();
	}

	getDomContainer(dom, kind) {
		let entry = this.domContainers.get(dom);
		if (entry) {
			this.ensureDomAnimationApi(entry);
			return entry.container;
		}
		const zIndex = kind === "player" ? this.layer.containers.playerEffect : this.layer.containers.card;
		const container = this.renderer.createContainer({
			name: kind,
			fatherDOM: dom,
			zIndex,
		});
		entry = { dom, kind, container };
		this.domContainers.set(dom, entry);
		this.ensureDomAnimationApi(entry);
		this.updateDomContainer(entry, true);
		return container;
	}

	ensureDomAnimationApi(entry) {
		const { dom } = entry;
		if (dom._ap?._sharedAnimationPlayer === this) return;
		dom._ap = {
			_sharedAnimationPlayer: this,
			canvas: this.canvas,
			hasSpine: name => this.hasSpine(name),
			loadSpine: (name, fileType, done, fail) => this.loadSpine(name, fileType, done, fail),
			playSpine: (sprite, position) => this.playSpine(sprite, { ...(position || {}), parent: dom, containerKind: getDomAnimationKind(dom, entry.kind) }),
			loopSpine: (sprite, position) => {
				if ("string" == typeof sprite) sprite = { name: sprite, loop: true };
				else if (sprite) sprite = { ...sprite, loop: true };
				return this.playSpine(sprite, { ...(position || {}), parent: dom, containerKind: getDomAnimationKind(dom, entry.kind) });
			},
			stopSpine: handle => this.stopSpine(handle),
			stopSpineAll: () => this.stopDomSpineAll(dom),
		};
	}

	getContainerDebugPayload(entry) {
		const { dom, kind, container } = entry;
		const rawRect = dom.getBoundingClientRect();
		const bounds = this.renderer._calcReferBounds?.(dom);
		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasHeight = canvasRect.height || this.canvas.clientHeight || 0;
		const rect = bounds ? { left: bounds.x, top: canvasHeight - bounds.y - bounds.height, width: bounds.width, height: bounds.height } : toPlainRect(rawRect);
		return {
			kind,
			domClass: String(dom.className || ""),
			zoom: getZoomSnapshot(),
			bodyHeight: canvasHeight,
			rawRect: toPlainRect(rawRect),
			calcBounds: bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } : null,
			rect,
			container: { x: container.x, y: container.y, width: container._contentWidth, height: container._contentHeight, visible: container.visible },
			canvas: {
				clientWidth: this.canvas.clientWidth,
				clientHeight: this.canvas.clientHeight,
				width: this.canvas.width,
				height: this.canvas.height,
				rect: toPlainRect(canvasRect),
				stylePosition: this.canvas.style.position,
				styleLeft: this.canvas.style.left,
				styleTop: this.canvas.style.top,
				styleWidth: this.canvas.style.width,
				styleHeight: this.canvas.style.height,
				styleTransform: this.canvas.style.transform,
			},
		};
	}

	dumpDebugState() {
		const payload = {
			zoom: getZoomSnapshot(),
			body: {
				clientWidth: document.body.clientWidth,
				clientHeight: document.body.clientHeight,
				rect: toPlainRect(document.body.getBoundingClientRect()),
			},
			viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
			canvas: this.getContainerDebugPayload({ dom: document.body, kind: "body", container: this.fullscreenContainer }).canvas,
			containers: [...this.domContainers.values()].map(entry => this.getContainerDebugPayload(entry)),
			history: window.dcdAnimDebugHistory || [],
			records: [...this.records.values()].map(record => ({
				id: record.id,
				cancelled: record.cancelled,
				container: record.container ? { name: record.container.name, x: record.container.x, y: record.container.y, width: record.container._contentWidth, height: record.container._contentHeight } : null,
				nodes: record.nodes.map(node => ({
					name: node.skeleton?.name || node.name || node.meta?.name,
					container: node.container ? { name: node.container.name, x: node.container.x, y: node.container.y, width: node.container._contentWidth, height: node.container._contentHeight } : null,
					origMeta: node._origMeta,
					containerRect: node._containerRect,
					render: { x: node.renderX, y: node.renderY, scale: node.renderScale, opacity: node.renderOpacity },
				})),
			})),
		};
		console.warn("[DCD-ANIM dump]", safeDebugString(payload));
		return payload;
	}

	updateDomContainer(entry, force) {
		const { dom, kind, container } = entry;
		if (!dom.isConnected) {
			container.setVisible(false);
			return;
		}
		if (kind === "player" && !dom.classList.contains("selectable")) this.stopDomLoopSpine(dom);
		this.syncCanvasStyle();
		const rawRect = dom.getBoundingClientRect();
		const bounds = this.renderer._calcReferBounds?.(dom);
		// _calcReferBounds 的 y（距底部）用的是 canvas 可见高度，
		// 这里还原 top 必须用同一套 canvas 本地坐标。
		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasHeight = canvasRect.height || this.canvas.clientHeight || 0;
		const rect = bounds
			? { left: bounds.x, top: canvasHeight - bounds.y - bounds.height, width: bounds.width, height: bounds.height }
			: rawRect;
		let left = rect.left;
		let top = rect.top;
		let width = rect.width;
		let height = rect.height;
		if (kind === "card") {
			left -= rect.width * 1.2;
			top -= rect.height * 0.7;
			width = rect.width * 3.4;
			height = rect.height * 2.4;
		} else if (kind === "player") {
			left -= rect.width * 0.5;
			top -= rect.height * 0.5;
			width = rect.width * 2;
			height = rect.height * 2;
		}
		const visible = !!(width && height);
		container.setVisible(visible);
		if (!visible) return;
		if (force || container.x !== left || container.y !== top || container._contentWidth !== width || container._contentHeight !== height) {
			container.setPosition(left, top);
			container.setContentSize(width, height);
			container.setMask(kind === "player" ? null : SpineMask.rect(0, 0, width, height));
			for (const node of container.spineNodes) node._containerRect = { width, height };
		}
		if (isAnimationDebugEnabled(kind) && (entry.debugLogCount || 0) < 3) {
			entry.debugLogCount = (entry.debugLogCount || 0) + 1;
			const payload = this.getContainerDebugPayload(entry);
			pushDebugHistory("container", payload);
			console.warn("[DCD-ANIM container]", safeDebugString(payload));
		}
	}

	startLayoutLoop() {
		if (this.layoutFrame) return;
		const tick = () => {
			this.layoutFrame = null;
			this.syncCanvasStyle();
			for (const record of this.records.values()) {
				for (const node of record.nodes) {
					if (!node.referNode && node._containerRect && node.container === this.fullscreenContainer) {
						const canvasRect = this.canvas.getBoundingClientRect();
						node._containerRect = {
							width: canvasRect.width || this.canvas.clientWidth || document.body.clientWidth || window.innerWidth || 0,
							height: canvasRect.height || this.canvas.clientHeight || document.body.clientHeight || window.innerHeight || 0,
						};
						if (node._fullscreenConfiguredScale !== undefined) {
							const scale = applyScaleFactor(node._fullscreenConfiguredScale, getFullscreenViewportScale());
							if (Array.isArray(scale)) {
								node.scaleX = scale[0] ?? 1;
								node.scaleY = scale[1] ?? node.scaleX;
								node.scale = Math.max(node.scaleX, node.scaleY);
							} else {
								node.scale = node.scaleX = node.scaleY = scale;
							}
						}
					}
				}
			}
			if (!this.domContainers.size && !this.records.size) return;
			for (const entry of this.domContainers.values()) this.updateDomContainer(entry);
			this.layoutFrame = requestAnimationFrame(tick);
		};
		this.layoutFrame = requestAnimationFrame(tick);
	}

	destroyRecord(record) {
		record.cancelled = true;
		record.handle.completed = true;
		if (record.autoDestroyTimer) {
			clearTimeout(record.autoDestroyTimer);
			record.autoDestroyTimer = null;
		}
		for (const node of record.nodes) {
			const container = node.container;
			container?.removeChild?.(node);
			node.destroy();
		}
		record.nodes.length = 0;
		this.records.delete(record.id);
	}

	stopDomSpineAll(dom) {
		for (const record of [...this.records.values()]) {
			if (record.container?.fatherDOM === dom) this.destroyRecord(record);
		}
	}

	stopDomLoopSpine(dom) {
		for (const record of [...this.records.values()]) {
			if (record.loop && (record.parentDom === dom || record.container?.fatherDOM === dom)) {
				if (dom.ChupaizhishiXid === record.handle) delete dom.ChupaizhishiXid;
				this.destroyRecord(record);
			}
		}
	}

	resolvePath(name) {
		if (/^(?:https?:|file:|data:|blob:|\/)/i.test(name) || name.startsWith(this.pathPrefix)) return name;
		return `${this.pathPrefix}${name}`;
	}
}

export { SharedAnimationPlayer };
