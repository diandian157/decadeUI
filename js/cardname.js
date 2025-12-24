import { game, ui } from "noname";

/** 手牌数量阈值，超过此值时显示卡牌别名 */
const CARD_COUNT_THRESHOLD = 15;

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 500;

/** 手牌区域名称 */
const HANDCARD_ZONES = ["handcards1", "handcards2"];

/**
 * 获取玩家的手牌区域元素
 */
function getHandcardZones() {
	return HANDCARD_ZONES.map(name => game.me?.node?.[name]).filter(Boolean);
}

/**
 * 更新卡牌别名的显示状态
 */
function updateVisibility() {
	const count = game.me?.countCards("h") ?? 0;
	const visible = count > CARD_COUNT_THRESHOLD ? "on" : "off";

	getHandcardZones().forEach(zone => {
		zone.dataset.cardAlternateNameVisible = visible;
	});
}

/**
 * 绑定 MutationObserver 监听手牌变化
 * @returns {boolean} 绑定是否成功
 */
function bindObservers() {
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
}

/**
 * 初始化卡牌别名显示功能
 * 当手牌数量超过阈值时，自动切换显示模式
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
}
