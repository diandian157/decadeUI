import { lib, game } from "noname";
import { dynamicCanvasLayers } from "./containerConfig.js";

let loadPromise = null;
let sharedPlayer = null;
let skHandleId = 0;

function extensionBasePath() {
	return window.decadeUIPath || `${lib.assetURL || ""}extension/十周年UI/`;
}

function loadScriptOnce(url) {
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[data-decade-laya="${url}"]`);
		if (existing) {
			if (existing.dataset.loaded === "true") resolve();
			else {
				existing.addEventListener("load", () => resolve(), { once: true });
				existing.addEventListener("error", reject, { once: true });
			}
			return;
		}
		const script = document.createElement("script");
		script.dataset.decadeLaya = url;
		script.src = url;
		script.onload = () => {
			script.dataset.loaded = "true";
			resolve();
		};
		script.onerror = event => reject(event);
		document.head.appendChild(script);
	});
}

function ensureSkSuffix(path) {
	if (!path || /\.[a-z0-9]+(?:[?#].*)?$/i.test(path)) return path;
	return `${path}.sk`;
}

function resolveSkPath(path) {
	if (/^(?:https?:|file:|data:|blob:|\/)/i.test(path)) return path;
	if (path.startsWith(extensionBasePath())) return path;
	if (path.startsWith("extension/")) return `${lib.assetURL || ""}${ensureSkSuffix(path)}`;
	return `${extensionBasePath()}${ensureSkSuffix(path)}`;
}

function getDocumentZoom() {
	const gameZoom = game?.documentZoom;
	if (Number.isFinite(gameZoom) && gameZoom > 0) return gameZoom;
	const windowZoom = window.documentZoom;
	if (Number.isFinite(windowZoom) && windowZoom > 0) return windowZoom;
	const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom);
	return Number.isFinite(bodyZoom) && bodyZoom > 0 ? bodyZoom : 1;
}

function getLayaCanvas() {
	const Laya = window.Laya;
	return Laya?.Render?.canvas || document.getElementById(dynamicCanvasLayers.upper.layaCanvasId) || document.getElementById("layaCanvas");
}

function getCanvasPixelScale(canvas) {
	const rect = canvas?.getBoundingClientRect?.();
	if (!canvas || !rect?.width || !rect?.height) return { x: 1, y: 1, value: 1 };
	const width = Number(canvas.getAttribute("width")) || canvas.width || rect.width;
	const height = Number(canvas.getAttribute("height")) || canvas.height || rect.height;
	const x = width / rect.width || 1;
	const y = height / rect.height || 1;
	return { x, y, value: Math.min(x, y) || 1 };
}

async function ensureLayaLoaded() {
	if (window.Laya?.Templet) return window.Laya;
	if (!loadPromise) {
		const base = extensionBasePath();
		loadPromise = loadScriptOnce(`${base}src/libs/laya.core.min.js`)
			.then(() => loadScriptOnce(`${base}src/libs/laya.ani.min.js`))
			.then(() => {
				if (!window.Laya?.Templet) throw new Error("Laya runtime loaded but Templet is unavailable");
				return window.Laya;
			});
	}
	return loadPromise;
}

class LayaSkInstance {
	constructor(player, path, options = {}) {
		this.player = player;
		this.id = skHandleId++;
		this.path = resolveSkPath(path);
		this.options = options;
		this.loop = !!options.loop;
		this.keepOnly = this.loop ? false : !!options.keepOnly;
		this.initPlay = options.initPlay !== false;
		this.followed = !!options.followed;
		this.beginIndex = typeof options.beginIndex === "number" ? options.beginIndex : 0;
		this.currentIndex = this.beginIndex - 1;
		this.endIndex = typeof options.endIndex === "number" ? options.endIndex : null;
		this.scale = options.scale ?? 1;
		this.scaleWithElement = !!options.scaleWithElement;
		this.baseReferenceRect = null;
		this.speed = options.speed ?? 1;
		this.alpha = options.alpha ?? options.opacity ?? 1;
		this.offset = options.offset || { x: 0, y: 0 };
		this.fixedPos = Array.isArray(options.pos) ? options.pos : null;
		this.referenceElement = options.pos instanceof HTMLElement ? options.pos : typeof options.pos === "string" ? document.querySelector(options.pos) : null;
		this.onReady = options.onReady;
		this.onPlay = options.onPlay;
		this.onEnd = options.onEnd;
		this.onError = options.onError;
		this.completed = false;
		this.destroyed = false;
		this.armature = null;
		this.templet = options.templet || new window.Laya.Templet();
		this.ready = new Promise(resolve => (this._resolveReady = resolve));
		this._bindEvents();
		if (options.pause) game.pause2?.();
		this.templet.loadAni(this.path);
	}

	_bindEvents() {
		const { Event } = window.Laya;
		this.templet.on(Event.COMPLETE, this, this._onLoadComplete);
		this.templet.on(Event.ERROR, this, this._onLoadError);
	}

	_offEvents() {
		const { Event } = window.Laya;
		this.templet?.off(Event.COMPLETE, this, this._onLoadComplete);
		this.templet?.off(Event.ERROR, this, this._onLoadError);
		this.armature?.off(Event.STOPPED, this, this._onStopped);
	}

	_onLoadError(error) {
		console.error("[LayaSkPlayer] loadAni failed:", this.path, error);
		this.onError?.(error);
		this.end();
		this._resolveReady?.(null);
	}

	_onLoadComplete() {
		if (this.destroyed || !this.templet) return;
		try {
			this.armature = this.templet.buildArmature(1);
		} catch (error) {
			try {
				this.armature = this.templet.buildArmature(0);
			} catch (innerError) {
				console.error("[LayaSkPlayer] buildArmature failed:", this.path, innerError || error);
				this.onError?.(innerError || error);
				this.end();
				this._resolveReady?.(null);
				return;
			}
		}
		this.setScale(this.scale);
		this.setSpeed(this.speed);
		this.setAlpha(this.alpha);
		this.updatePosition();
		this.onReady?.(this.armature, this);
		this._resolveReady?.(this);
		if (this.initPlay) this.play(this.options.action, this.loop);
		if (this.followed) this.startPositionUpdate();
		window.Laya.stage.addChild(this.armature);
	}

	getActions() {
		const armature = this.armature;
		if (!armature) return [];
		const count = armature.getAnimNum?.() || this.templet?.getAnimNum?.() || 0;
		const names = [];
		for (let i = 0; i < count; i++) {
			const name = armature.getAniNameByIndex?.(i) || this.templet?.getAniNameByIndex?.(i);
			names.push(name || String(i));
		}
		return names;
	}

	play(action = this.options.action, loop = this.loop) {
		if (!this.armature) return this;
		this.loop = !!loop;
		this.onPlay?.(this.armature, this);
		if (action !== undefined && action !== null && action !== "") {
			const resolvedAction = typeof action === "string" && /^\d+$/.test(action) ? Number(action) : action;
			this.armature.play(resolvedAction, this.loop);
			if (!this.loop) this.armature.once(window.Laya.Event.STOPPED, this, this._onStopped);
			return this;
		}
		this.playNext();
		return this;
	}

	playNext() {
		if (!this.armature) return this;
		this.currentIndex++;
		const aniNum = this.endIndex ?? this.armature.getAnimNum?.() ?? 0;
		if (this.currentIndex >= aniNum) {
			if (!this.loop) return this.end();
			this.currentIndex = this.beginIndex;
		}
		this.onPlay?.(this.armature, this);
		this.armature.play(this.currentIndex, false);
		this.armature.on(window.Laya.Event.STOPPED, this, this._onStopped, [aniNum]);
		return this;
	}

	_onStopped(aniNum) {
		if (this.destroyed) return;
		const total = aniNum ?? this.armature?.getAnimNum?.() ?? 0;
		if (!this.loop && !this.keepOnly && this.currentIndex + 1 >= total) {
			this.end();
		} else if (this.currentIndex + 1 < total) {
			this.playNext();
		} else if (!this.keepOnly) {
			this.currentIndex = this.beginIndex - 1;
			this.playNext();
		}
	}

	startPositionUpdate() {
		if (!this.referenceElement || !this.armature || this.positionLoop) return;
		this.positionLoop = true;
		window.Laya.timer.frameLoop(1, this, this.updatePosition);
	}

	stopPositionUpdate() {
		if (!this.positionLoop) return;
		window.Laya.timer.clear(this, this.updatePosition);
		this.positionLoop = false;
	}

	setTargetElement(element) {
		this.referenceElement = element instanceof HTMLElement ? element : typeof element === "string" ? document.querySelector(element) : null;
		this.baseReferenceRect = null;
		this.updatePosition();
		if (this.followed) this.startPositionUpdate();
		return this;
	}

	setScale(scale) {
		this.scale = scale;
		this.applyScale();
		return this;
	}

	getElementScaleRatio() {
		if (!this.scaleWithElement || !this.referenceElement) return 1;
		const rect = this.referenceElement.getBoundingClientRect();
		if (!rect.width || !rect.height) return 1;
		if (!this.baseReferenceRect) this.baseReferenceRect = { width: rect.width, height: rect.height };
		const sx = rect.width / (this.baseReferenceRect.width || rect.width);
		const sy = rect.height / (this.baseReferenceRect.height || rect.height);
		return Math.min(sx || 1, sy || 1);
	}

	applyScale() {
		if (!this.armature) return;
		const canvasScale = getCanvasPixelScale(this.player.canvas).value;
		const ratio = this.getElementScaleRatio();
		if (Array.isArray(this.scale)) this.armature.scale((this.scale[0] ?? 1) * canvasScale * ratio, (this.scale[1] ?? 1) * canvasScale * ratio);
		else this.armature.scale((this.scale ?? 1) * canvasScale * ratio, (this.scale ?? 1) * canvasScale * ratio);
	}

	setSpeed(speed = 1) {
		this.speed = speed;
		this.armature?.playbackRate?.(speed);
		return this;
	}

	setAlpha(alpha = 1) {
		this.alpha = alpha;
		if (this.armature) this.armature.alpha = alpha;
		return this;
	}

	setPosition(x, y) {
		this.fixedPos = [x, y];
		this.updatePosition();
		return this;
	}

	updatePosition() {
		if (!this.armature) return;
		this.applyScale();
		const canvas = this.player.canvas || getLayaCanvas();
		const canvasRect = canvas?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 };
		const canvasScale = getCanvasPixelScale(canvas);
		if (this.fixedPos) {
			this.armature.visible = true;
			this.armature.pos(this.fixedPos[0] * canvasScale.x, this.fixedPos[1] * canvasScale.y);
			return;
		}
		if (!this.referenceElement) return;
		if (!this.referenceElement.isConnected) {
			this.armature.visible = false;
			return;
		}
		this.armature.visible = true;
		const elemRect = this.referenceElement.getBoundingClientRect();
		const centerX = elemRect.left + elemRect.width / 2;
		const centerY = elemRect.top + elemRect.height / 2;
		this.armature.pos((centerX - canvasRect.left) * canvasScale.x + (this.offset.x || 0) * canvasScale.x, (centerY - canvasRect.top) * canvasScale.y + (this.offset.y || 0) * canvasScale.y);
	}

	end() {
		this.completed = true;
		this.destroy();
		this.onEnd?.();
		if (this.options.pause) game.resume2?.();
		return this;
	}

	destroy() {
		if (this.destroyed) return this;
		this.destroyed = true;
		this.stopPositionUpdate();
		this._offEvents();
		try {
			this.armature?.stop?.();
			this.armature?.removeSelf?.();
			this.armature?.removeChildren?.();
			this.armature?.destroy?.(true);
		} catch (error) {
			console.warn("[LayaSkPlayer] armature destroy failed:", error);
		}
		try {
			this.templet?.destroy?.();
		} catch (error) {
			console.warn("[LayaSkPlayer] templet destroy failed:", error);
		}
		this.armature = null;
		this.templet = null;
		this.player.records.delete(this.id);
		return this;
	}
}

class LayaSkPlayer {
	constructor() {
		this.ready = null;
		this.canvas = null;
		this.records = new Map();
		this._resizeHandler = () => this.resize();
	}

	async init() {
		if (this.ready) return this.ready;
		this.ready = ensureLayaLoaded().then(() => {
			const { Browser, WebGL } = window.Laya;
			if (window.Config) {
				window.Config.isAlpha = true;
				window.Config.isAntialias = true;
			}
			if (!window.Laya.stage) window.Laya.init(Browser.clientWidth, Browser.clientHeight, WebGL);
			this.canvas = getLayaCanvas();
			if (this.canvas) {
				this.canvas.id = dynamicCanvasLayers.upper.layaCanvasId;
				this.canvas.classList.add("decade-laya-sk-canvas");
				this.canvas.style.zIndex = String(dynamicCanvasLayers.upper.layaCssZIndex);
				this.canvas.style.pointerEvents = "none";
			}
			window.Laya.stage.scaleMode = "exactfit";
			window.Laya.stage.bgColor = null;
			this.resize();
			if (!this._resizeBound) {
				window.addEventListener("resize", this._resizeHandler);
				lib.onresize?.push?.(this._resizeHandler);
				this._resizeBound = true;
			}
			return this;
		});
		return this.ready;
	}

	resize() {
		const Laya = window.Laya;
		if (!Laya?.Browser) return;
		if (Laya.stage?.size) Laya.stage.size(Laya.Browser.clientWidth, Laya.Browser.clientHeight);
		const canvas = this.canvas || getLayaCanvas();
		if (!canvas) return;
		this.canvas = canvas;
		canvas.setAttribute("width", String(Laya.Browser.clientWidth));
		canvas.setAttribute("height", String(Laya.Browser.clientHeight));
		const zoom = getDocumentZoom();
		canvas.style.transformOrigin = "left top";
		canvas.style.transform = zoom && zoom !== 1 ? `matrix(${1 / zoom}, 0, 0, ${1 / zoom}, 0, 0)` : "";
		for (const record of this.records.values()) record.updatePosition();
	}

	async playSkel(path, options = {}) {
		await this.init();
		const instance = new LayaSkInstance(this, path, options);
		this.records.set(instance.id, instance);
		return instance;
	}

	clearSkel(instance) {
		Promise.resolve(instance).then(handle => handle?.end?.());
	}

	clearAll() {
		for (const record of [...this.records.values()]) record.end();
	}
}

function getLayaSkPlayer() {
	if (!sharedPlayer) sharedPlayer = new LayaSkPlayer();
	return sharedPlayer;
}

async function playSkel(path, options) {
	return getLayaSkPlayer().playSkel(path, options);
}

export { LayaSkPlayer, LayaSkInstance, getLayaSkPlayer, playSkel, resolveSkPath };
