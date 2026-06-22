import { dynamicBackgroundConfig } from "../skins/dynamicBackground.js";
import { AnimationPlayer } from "./AnimationPlayer.js";

const dynamicBackgroundItems = {
	off: "关闭",
	...Object.fromEntries(Object.keys(dynamicBackgroundConfig).map(name => [name, name])),
};

function getDocumentZoom() {
	const gameZoom = globalThis.game?.documentZoom;
	if (Number.isFinite(gameZoom) && gameZoom > 0) return gameZoom;
	const windowZoom = window.documentZoom;
	if (Number.isFinite(windowZoom) && windowZoom > 0) return windowZoom;
	const bodyZoom = parseFloat(window.getComputedStyle(document.body).zoom);
	return Number.isFinite(bodyZoom) && bodyZoom > 0 ? bodyZoom : 1;
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

function syncBackgroundCanvasStyle(canvas) {
	if (!(canvas instanceof HTMLCanvasElement)) return false;
	const zoom = getDocumentZoom();
	const transform = zoom !== 1 ? `matrix(${1 / zoom}, 0, 0, ${1 / zoom}, 0, 0)` : "";
	const changed =
		canvas.style.position !== "fixed" ||
		canvas.style.width !== "100vw" ||
		canvas.style.height !== "100vh" ||
		canvas.style.transform !== transform;
	if (!changed) return false;
	Object.assign(canvas.style, {
		display: "block",
		position: "fixed",
		left: "0",
		top: "0",
		width: "100vw",
		height: "100vh",
		pointerEvents: "none",
		zIndex: "-1",
		transformOrigin: "left top",
		transform,
	});
	return true;
}

function getBackgroundViewportSize(canvas) {
	const rect = canvas?.getBoundingClientRect?.();
	return {
		width: rect?.width || canvas?.clientWidth || window.innerWidth || 1,
		height: rect?.height || canvas?.clientHeight || window.innerHeight || 1,
	};
}

function parseDynamicBackground(value) {
	if (!value || value === "off") return null;
	return dynamicBackgroundConfig[value] || null;
}

function createDynamicBackgroundController() {
	let animation = null;
	let playVersion = 0;

	const ensureAnimation = () => {
		if (animation) return animation;

		animation = new AnimationPlayer(`${window.decadeUIPath || ""}assets/dynamic/`, document.body, "decadeUI-canvas-background");
		animation.dprAdaptive = true;
		animation.ignoreMissingRegions = true;
		animation.current = [];
		animation.currentKey = null;
		syncBackgroundCanvasStyle(animation.canvas);
		animation.backgroundReferenceSize = getBackgroundViewportSize(animation.canvas);
		animation.backgroundViewportSize = { ...animation.backgroundReferenceSize };

		const syncBackgroundViewport = force => {
			const viewport = getBackgroundViewportSize(animation.canvas);
			const previous = animation.backgroundViewportSize;
			const changed = force || !previous || previous.width !== viewport.width || previous.height !== viewport.height;
			if (!changed) return false;
			animation.backgroundViewportSize = viewport;
			animation.resized = false;
			for (const node of animation.current) {
				if (!node?._backgroundResponsiveScale) continue;
				node.scale = node._backgroundConfigScale * getFullscreenViewportScale();
			}
			return true;
		};

		const baseRender = animation.render.bind(animation);
		animation.render = function (timestamp) {
			if (syncBackgroundCanvasStyle(this.canvas)) this.resized = false;
			syncBackgroundViewport(false);
			return baseRender(timestamp);
		};

		const baseStopSpineAll = animation.stopSpineAll.bind(animation);
		animation.stopSpineAll = function () {
			playVersion++;
			this.current = [];
			this.currentKey = null;
			return baseStopSpineAll();
		};
		animation.stop = animation.stopSpineAll.bind(animation);

		animation.play = async function (configName) {
			if (syncBackgroundCanvasStyle(this.canvas)) this.resized = false;
			const config = dynamicBackgroundConfig[configName];
			if (!config) {
				this.stopSpineAll();
				return console.warn(`[十周年UI] 未找到动态背景配置：${configName}`);
			}
			if (this.currentKey === configName) return;

			this.stopSpineAll();
			const currentPlayVersion = playVersion;
			this.currentKey = configName;

			const { beijing, ...foreground } = config;
			const sprites = [beijing, foreground].filter(sprite => sprite?.name);
			const loaded = await Promise.all(
				sprites.map(sprite => {
					if (this.hasSpine(sprite.name)) return true;
					return new Promise(resolve => {
						this.loadSpine(sprite.name, sprite.skelType || "skel", () => resolve(true), () => resolve(false));
					});
				})
			);

			if (currentPlayVersion !== playVersion) return;
			this.current = [];
			for (let index = 0; index < sprites.length; index++) {
				if (!loaded[index]) continue;
				try {
					const sprite = sprites[index];
					const mobileScale = getFullscreenViewportScale();
					const node = this.loopSpine({ ...sprite, scale: (sprite.scale ?? 1) * mobileScale });
					node._backgroundBaseScale = (sprite.scale ?? 1) * mobileScale;
					node._backgroundConfigScale = sprite.scale ?? 1;
					node._backgroundResponsiveScale = void 0 === sprite.width && void 0 === sprite.height;
					this.current.push(node);
				} catch (error) {
					console.error(`[十周年UI] 动态背景骨骼解析失败：${sprites[index].name}`, error);
				}
			}
			syncBackgroundViewport(true);
			if (!this.current.length) {
				this.currentKey = null;
				console.error(`[十周年UI] 动态背景加载失败：${configName}`);
			}
		};

		window.decadeUI?.bodySensor?.addListener?.(() => {
			syncBackgroundCanvasStyle(animation.canvas);
			syncBackgroundViewport(true);
		}, true);
		const handleViewportResize = () => {
			syncBackgroundCanvasStyle(animation.canvas);
			syncBackgroundViewport(true);
		};
		window.addEventListener("resize", handleViewportResize, { passive: true });
		window.visualViewport?.addEventListener?.("resize", handleViewportResize, { passive: true });
		if (window.ResizeObserver) {
			animation.backgroundResizeObserver = new ResizeObserver(handleViewportResize);
			animation.backgroundResizeObserver.observe(animation.canvas);
		}
		return animation;
	};

	return {
		get current() {
			return animation?.current;
		},
		get canvas() {
			return animation?.canvas;
		},
		play(configName) {
			return ensureAnimation().play(configName);
		},
		stopSpineAll() {
			return animation?.stopSpineAll?.();
		},
		stop() {
			return animation?.stopSpineAll?.();
		},
		getAnimation() {
			return animation;
		},
	};
}

function applyDynamicBackgroundConfig(value) {
	if (!parseDynamicBackground(value)) return void window.decadeUI?.backgroundAnimation?.stopSpineAll?.();
	window.decadeUI?.backgroundAnimation?.play(value);
}

const dynamicBackgroundAssets = dynamicBackgroundConfig;

export { applyDynamicBackgroundConfig, createDynamicBackgroundController, dynamicBackgroundAssets, dynamicBackgroundItems, parseDynamicBackground };
