/**
 * @fileoverview 卡牌别名显示模块，根据配置开关显示卡牌名称标签
 */
import { lib, game, ui, _status } from "noname";

// ==================== 常量 ====================

/** @type {number} 轮询间隔（毫秒） */
const POLL_INTERVAL = 500;

/** @type {string[]} 手牌区域名称列表 */
const HANDCARD_ZONES = ["handcards1", "handcards2"];

// ==================== 内部函数 ====================

/**
 * 获取玩家的手牌区域元素
 * @returns {HTMLElement[]} 手牌区域元素数组
 */
const getHandcardZones = () => HANDCARD_ZONES.map(name => game.me?.node?.[name]).filter(Boolean);

/**
 * 更新卡牌别名的显示状态
 * @returns {void}
 */
const updateVisibility = () => {
	// 根据配置开关决定显示状态
	const visible = lib.config.extension_十周年UI_cardAlternateName !== false ? "on" : "off";
	getHandcardZones().forEach(zone => {
		zone.dataset.cardAlternateNameVisible = visible;
	});
};

/**
 * 绑定 MutationObserver 监听手牌变化
 * @returns {boolean} 是否绑定成功
 */
const bindObservers = () => {
	const zones = getHandcardZones();
	if (!zones.length) return false;

	// 清理旧的观察者
	ui.window._cardAlternateNameVisibleObservers?.forEach(ob => ob.disconnect());

	// 创建新的观察者
	ui.window._cardAlternateNameVisibleObservers = zones.map(zone => {
		const observer = new MutationObserver(updateVisibility);
		observer.observe(zone, { childList: true });
		return observer;
	});

	updateVisibility();
	return true;
};

// ==================== 导出函数 ====================

/**
 * 初始化卡牌别名显示功能
 * @returns {void}
 */
export function initCardAlternateNameVisible() {
	// 清理已有的定时器
	if (window._cardAlternateNameVisibleTimer) {
		clearInterval(window._cardAlternateNameVisibleTimer);
		window._cardAlternateNameVisibleTimer = null;
	}

	// 轮询直到绑定成功
	const tryBind = () => {
		if (bindObservers()) {
			clearInterval(window._cardAlternateNameVisibleTimer);
			window._cardAlternateNameVisibleTimer = null;
		}
	};

	window._cardAlternateNameVisibleTimer = setInterval(tryBind, POLL_INTERVAL);
	tryBind();

	if (window.decadeUI) {
		if (!window.decadeUI.cardAlternateName) {
			window.decadeUI.cardAlternateName = {};
		}
		window.decadeUI.cardAlternateName.updateVisibility = updateVisibility;
	}
}
