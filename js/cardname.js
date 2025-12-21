import { game, ui, _status } from "noname";

export function initCardAlternateNameVisible() {
	const updateCardAlternateNameVisible = () => {
		const count = game.me?.countCards("h") ?? 0;
		const zones = ["handcards1", "handcards2"].map(name => game.me?.node?.[name]).filter(Boolean);

		zones.forEach(zone => {
			zone.dataset.cardAlternateNameVisible = count > 15 ? "on" : "off";
		});
	};
	const bindCardAlternateNameVisible = () => {
		if (!game.me?.node) return false;
		const zones = ["handcards1", "handcards2"].map(name => game.me.node[name]).filter(Boolean);
		if (!zones.length) return false;
		ui.window._cardAlternateNameVisibleObservers?.forEach(observer => observer.disconnect());
		const observers = zones.map(zone => {
			const observer = new MutationObserver(updateCardAlternateNameVisible);
			observer.observe(zone, { childList: true });
			return observer;
		});
		ui.window._cardAlternateNameVisibleObservers = observers;
		updateCardAlternateNameVisible();
		return true;
	};
	if (window._cardAlternateNameVisibleTimer) {
		clearInterval(window._cardAlternateNameVisibleTimer);
	}
	const tryBind = () => {
		if (bindCardAlternateNameVisible()) {
			clearInterval(window._cardAlternateNameVisibleTimer);
			window._cardAlternateNameVisibleTimer = null;
		}
	};
	window._cardAlternateNameVisibleTimer = setInterval(tryBind, 500);
	tryBind();
}
