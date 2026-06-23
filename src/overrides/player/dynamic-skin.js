import { lib, game, _status } from "noname";
import "../../animation/utils.js";
import { getSharedDynamicRenderer as i } from "../../animation/SharedDynamicPlayer.js";
import { applyGroupCapImage } from "../../../ui/character/skins/shousha.js";
function isDynamicSkinEnabled() {
	return !0 === window.decadeUI?.config?.dynamicSkin || "on" === window.decadeUI?.config?.dynamicSkin;
}
function isExternalPath(path) {
	return /^(?:https?:|file:|data:|blob:|\/)/i.test(path);
}
function resolveDynamicBackground(path) {
	if (!path) return path;
	const prefix = `${window.decadeUIPath || ""}assets/dynamic/`;
	return isExternalPath(path) || path.startsWith(prefix) ? path : `${prefix}${path}`;
}
function getDynamicBackgroundNode(player, isDeputy) {
	if (!player?.$dynamicWrap) return;
	const className = isDeputy ? "deputy-bg" : "primary-bg";
	let node = player.$dynamicWrap.querySelector(`:scope > .${className}`);
	if (!node) {
		node = document.createElement("div");
		node.className = className;
		player.$dynamicWrap.appendChild(node);
	}
	return node;
}
function applyDynamicBackground(player, background, isDeputy) {
	const node = getDynamicBackgroundNode(player, isDeputy);
	if (!node) return;
	background ? (node.style.backgroundImage = `url("${resolveDynamicBackground(background)}")`) : node.style.removeProperty("background-image");
}
function pickDynamicSkinName(skins) {
	const names = Object.keys(skins || {});
	return names.length ? names[0] : null;
}
function normalizeLegacyDynamicSkin(skin, ignoreClip) {
	if ("string" == typeof skin) return { name: skin, loop: true };
	const data = { ...(skin || {}) };
	const legacyPlayer = data.player && data.player !== data ? data.player : null;
	if (legacyPlayer) {
		if (!data.name && legacyPlayer.name) data.name = legacyPlayer.name;
		if (!data.beijing && legacyPlayer.beijing) data.beijing = { ...legacyPlayer.beijing };
		if (!data.qianjing && legacyPlayer.qianjing) data.qianjing = { ...legacyPlayer.qianjing };
		if (!data.background && legacyPlayer.background) data.background = legacyPlayer.background;
	}
	if (!data.beijing && data.dynamicBackground) {
		data.beijing = "string" == typeof data.dynamicBackground ? { name: data.dynamicBackground, loop: true } : { ...data.dynamicBackground, loop: data.dynamicBackground.loop ?? true };
	}
	if (data.beijing && data.beijing.name && void 0 === data.beijing.loop) data.beijing.loop = true;
	if (data.qianjing && data.qianjing.name && void 0 === data.qianjing.loop) data.qianjing.loop = true;
	data.loop = data.loop ?? true;
	data.speed = data.speed ?? 1;
	if (ignoreClip) data.clipSlots = void 0;
	return data;
}
function n(n, e, o, r) {
	if (((e = !0 === e), void 0 === n)) return console.error("playDynamic: 参数1不能为空");
	console.log("[十周年UI调试-playDynamic] 调用十周年UI的playDynamic, player=", this?.name, "isDeputy=", e, "skinName=", n?.name);
	const sharedRenderer = i();
	let t = this.dynamic;
	let background;
	if (t && !t._decadeSharedDynamic) {
		try {
			t.stopAll?.();
			t.canvas?.remove?.();
		} catch (error) {
			console.warn("[十周年UI] 迁移旧动态皮肤实例时停止旧播放器失败", error);
		}
		t = null;
	}
	(t ? (e ? t.deputy && (t.stop(t.deputy), (t.deputy = null)) : t.primary && (t.stop(t.primary), (t.primary = null))) : ((t = sharedRenderer.getPlayerState(this).api), (this.dynamic = t)),
		(n = normalizeLegacyDynamicSkin(n, r)),
		(background = n.background),
		this.$dynamicWrap.parentNode !== this && this.appendChild(this.$dynamicWrap),
		(t.outcropMask = o ?? (window.decadeUI?.config?.dynamicSkinOutcrop || false)));
	const a = sharedRenderer.play(this, n, e);
	applyDynamicBackground(this, background, e);
	(e ? (t.deputy = a) : (t.primary = a), this.classList.add(e ? "d-skin2" : "d-skin"));
	if (this.node?.cap) applyGroupCapImage(this.node.cap, this.node.campWrap?.dataset?.camp || this.group);
	// 皮肤切换的攻击、出场、特殊动作都依赖这一步完成出框 Worker
	// 的资源预加载。旧播放器在自己的播放生命周期里调用它；共享播放器
	// 必须在统一入口补上，不能分别为 gongji/chuchang 打补丁。
	const skinSwitch = window.skinSwitch;
	if ("function" == typeof skinSwitch?.chukuangPlayerInit) {
		try {
			skinSwitch.chukuangPlayerInit(this, !e, n.player || n);
		} catch (error) {
			console.warn("[十周年UI] 初始化皮肤切换出框播放链失败", error);
		}
	}
}
function e(i, n) {
	const e = this.dynamic;
	e &&
		((n = !0 === n),
		(i = !0 === i) && e.primary ? (e.stop(e.primary), (e.primary = null)) : n && e.deputy ? (e.stop(e.deputy), (e.deputy = null)) : i || n || (e.stopAll(), (e.primary = null), (e.deputy = null)),
		e.primary || e.deputy || (e.stopAll?.(), this.classList.remove("d-skin", "d-skin2"), this.$dynamicWrap.remove()));
}
function t() {
	const i = window.decadeUI;
	if (!isDynamicSkinEnabled() || null === _status.mode) return void this.stopDynamic?.();
	if (this.classList.contains("out")) return void this.stopDynamic?.();
	if (
		((i.CUR_DYNAMIC ??= 0),
		(i.MAX_DYNAMIC ??= Number.POSITIVE_INFINITY),
		!this.dynamic && i.CUR_DYNAMIC >= i.MAX_DYNAMIC)
	)
		return;
	const n = i.dynamicSkin;
	if (!n) return;
	const e = this.doubleAvatar && this.name2 ? [this.name1, this.name2] : [this.name1];
	let t = !1;
	e.forEach((e, a) => {
		const r = n[e];
		if (!r) return;
		const o = pickDynamicSkinName(r);
		if (!o) return;
		const s = r[o];
		if (!s?.name) return;
		const d = (function (i) {
			const n = { name: i.name, skinName: o, action: i.action, loop: !0, loopCount: -1, speed: i.speed ?? 1, filpX: i.filpX, filpY: i.filpY, opacity: i.opacity, x: i.x, y: i.y, scale: i.scale, angle: i.angle, hideSlots: i.hideSlots, clipSlots: i.clipSlots, version: i.version, json: i.json, skelType: i.skelType, beijing: i.beijing, background: i.background, player: i.player || i };
			void 0 !== i.alpha && (n.alpha = i.alpha);
			void 0 !== i.unpackPremultipliedAlpha && (n.unpackPremultipliedAlpha = i.unpackPremultipliedAlpha);
			(i.player || void 0 !== i._transform) && (n.player = { ...(i.player || {}), ...(void 0 !== i._transform && { _transform: i._transform }) });
			return n;
		})(s);
		(s.background && (d.background = s.background), this.playDynamic(d, 1 === a), t || ((t = !0), i.CUR_DYNAMIC++));
	});
}
function o() {
	const _origOut = lib.element.player.out;
	lib.element.player.out = function () {
		const result = _origOut.apply(this, arguments);
		this.stopDynamic?.();
		return result;
	};

	// 千幻聆音会在 arenaReady 中把 playDynamic/stopDynamic 以及现有玩家
	// 实例重新定义为它自己的逐 Canvas 旧播放器。等所有 arenaReady 回调
	// 执行完后恢复统一入口：千幻仍可选择皮肤、整理配置，但最终播放状态、
	// renderer 消息和 Canvas 必须由十周年UI共享播放器持有。
	const restoreSharedDynamicEntry = () => {
		const defineEntry = target => {
			if (!target) return;
			for (const [key, value] of [["playDynamic", n], ["stopDynamic", e]]) {
				const descriptor = Object.getOwnPropertyDescriptor(target, key);
				if (descriptor && descriptor.configurable === false) continue;
				Object.defineProperty(target, key, {
					configurable: true,
					enumerable: true,
					writable: true,
					value,
				});
			}
		};
		// 千幻的换肤预览和大头像不一定是 game.player，而是直接调用这两个
		// 公开函数；它们也必须进入同一共享播放入口，否则仍会实例化旧
		// DynamicPlayer/AnimationPlayer 并用固定 runtime 解析新版 atlas。
		lib.qhly_playdynamic = n;
		lib.qhly_stopdynamic = e;
		defineEntry(lib.element.player);
		for (const player of game.players || []) {
			const oldDynamic = player.dynamic;
			const primary = oldDynamic && !oldDynamic._decadeSharedDynamic ? oldDynamic.primary : null;
			const deputy = oldDynamic && !oldDynamic._decadeSharedDynamic ? oldDynamic.deputy : null;
			defineEntry(player);
			// 千幻可能已在本回调之前创建并播放了旧逐 Canvas 动皮；只恢复
			// 函数还不够，要把当前正在播放的配置一并迁移到共享播放器。
			if (primary || deputy) {
				try {
					oldDynamic.stopAll?.();
					oldDynamic.canvas?.remove?.();
				} catch (error) {
					console.warn("[十周年UI] 停止千幻旧动皮播放器失败", error);
				}
				player.dynamic = null;
				if (primary) n.call(player, primary.player || primary, false);
				if (deputy) n.call(player, deputy.player || deputy, true);
			}
		}
	};
	lib.arenaReady?.push?.(() => setTimeout(restoreSharedDynamicEntry, 0));
}
export { t as playerApplyDynamicSkin, n as playerPlayDynamic, e as playerStopDynamic, o as setupDynamicSkinOutHook };
