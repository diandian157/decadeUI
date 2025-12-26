/**
 * 卡牌别名显示模块
 * 当手牌数量超过阈值时，自动切换显示模式
 */
import { lib, game, ui, get, ai, _status } from "noname";

// ==================== 常量 ====================
const CARD_COUNT_THRESHOLD = 15; // 手牌数量阈值
const POLL_INTERVAL = 500; // 轮询间隔（毫秒）
const HANDCARD_ZONES = ["handcards1", "handcards2"];

// ==================== 内部函数 ====================

/** 获取玩家的手牌区域元素 */
const getHandcardZones = () => HANDCARD_ZONES.map(name => game.me?.node?.[name]).filter(Boolean);

/** 更新卡牌别名的显示状态 */
const updateVisibility = () => {
	const count = game.me?.countCards("h") ?? 0;
	const visible = count > CARD_COUNT_THRESHOLD ? "on" : "off";
	getHandcardZones().forEach(zone => {
		zone.dataset.cardAlternateNameVisible = visible;
	});
};

/** 绑定 MutationObserver 监听手牌变化 */
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

/** 初始化卡牌别名显示功能 */
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
}
