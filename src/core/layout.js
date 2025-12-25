/**
 * 布局模块
 */
import { lib, ui } from "noname";

/** 创建layout模块 */
export function createLayoutModule() {
	return {
		update() {
			this.updateHand();
			this.updateDiscard();
		},

		updateHand() {
			if (!game.me) return;
			const handNode = ui.handcards1;
			if (!handNode) return console.error("hand undefined");

			const cards = [];
			for (const card of handNode.childNodes) {
				if (!card.classList.contains("removing")) cards.push(card);
				else card.scaled = false;
			}
			if (!cards.length) return;

			const bounds = dui.boundsCaches.hand;
			bounds.check();
			const pw = bounds.width,
				cw = bounds.cardWidth,
				ch = bounds.cardHeight,
				cs = bounds.cardScale;
			const csw = cw * cs;
			const y = Math.round((ch * cs - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			let totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;
			let expand;

			if (totalW > limitW) {
				xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
				if (lib.config.fold_card) {
					const min = cs * 9;
					if (xMargin < min) {
						expand = true;
						xMargin = min;
					}
				}
			} else {
				const style = lib.config.extension_十周年UI_newDecadeStyle;
				if (style === "codename") {
					xStart = (ui.arena.offsetWidth - totalW) / 2 - bounds.x;
				} else if (style === "on" || style === "othersOff") {
					if (!lib.config.phonelayout) {
						xStart = (ui.arena.offsetWidth - totalW) / 2 - bounds.x;
					}
				}
			}

			let selectedIndex = -1;
			for (let i = 0; i < cards.length; i++) {
				if (cards[i].classList.contains("selected")) {
					if (selectedIndex !== -1) {
						selectedIndex = -1;
						break;
					}
					selectedIndex = i;
				}
			}

			const folded = totalW > limitW && xMargin < csw - 0.5;
			let spreadOffsetLeft = 0,
				spreadOffsetRight = 0,
				baseShift = 0;
			if (folded && selectedIndex !== -1) {
				const spreadOffset = Math.max(0, csw - xMargin + 2);
				spreadOffsetLeft = Math.round(spreadOffset * 0.2);
				spreadOffsetRight = spreadOffset;
				const selX = xStart + selectedIndex * xMargin;
				const maxSelX = Math.max(0, limitW - csw);
				baseShift = Math.round(Math.max(0, Math.min(maxSelX, selX)) - selX);
			}

			for (let i = 0; i < cards.length; i++) {
				let fx = xStart + i * xMargin + baseShift;
				if (spreadOffsetLeft || spreadOffsetRight) {
					if (i < selectedIndex) fx -= spreadOffsetLeft;
					else if (i > selectedIndex) fx += spreadOffsetRight;
				}
				const x = Math.round(fx);
				const card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = `translate(${x}px,${y}px) scale(${cs})`;
				card._transform = card.style.transform;
				card.updateTransform(card.classList.contains("selected"));
			}

			if (expand) {
				ui.handcards1Container.classList.add("scrollh");
				ui.handcards1Container.style.overflowX = "scroll";
				ui.handcards1Container.style.overflowY = "hidden";
				handNode.style.width = Math.round(cards.length * xMargin + (csw - xMargin)) + "px";
			} else {
				ui.handcards1Container.classList.remove("scrollh");
				ui.handcards1Container.style.overflowX = "";
				ui.handcards1Container.style.overflowY = "";
				handNode.style.width = "100%";
			}
		},

		updateDiscard() {
			if (!ui.thrown) ui.thrown = [];
			for (let i = ui.thrown.length - 1; i >= 0; i--) {
				const t = ui.thrown[i];
				if (t.classList.contains("drawingcard") || t.classList.contains("removing") || t.parentNode !== ui.arena || t.fixed) {
					ui.thrown.splice(i, 1);
				} else {
					t.classList.remove("removing");
				}
			}
			if (!ui.thrown.length) return;

			const cards = ui.thrown;
			const bounds = dui.boundsCaches.arena;
			bounds.check();
			const pw = bounds.width,
				ph = bounds.height,
				cw = bounds.cardWidth,
				ch = bounds.cardHeight;
			const discardScale = lib?.config?.extension_十周年UI_discardScale || 0.14;
			const bodySize = decadeUI.get.bodySize();
			const cs = Math.min((bodySize.height * discardScale) / ch, 1);
			const csw = cw * cs;
			const y = Math.round((ph - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			const totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;

			if (totalW > limitW) xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
			else xStart += (limitW - totalW) / 2;

			for (let i = 0; i < cards.length; i++) {
				const x = Math.round(xStart + i * xMargin);
				const card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = `translate(${x}px,${y}px) scale(${cs})`;
			}
		},

		clearout(card) {
			if (!card || card.fixed || card.classList.contains("removing")) return;
			if (card.name?.startsWith("shengbei_left_") || card.name?.startsWith("shengbei_right_")) {
				card.delete();
				return;
			}
			if (ui.thrown.indexOf(card) === -1) {
				ui.thrown.splice(0, 0, card);
				dui.queueNextFrameTick(dui.layoutDiscard, dui);
			}
			card.classList.add("invalided");
			setTimeout(
				c => {
					c.remove();
					dui.queueNextFrameTick(dui.layoutDiscard, dui);
				},
				2333,
				card
			);
		},

		_debounce(config) {
			let timestamp = config.defaultDelay;
			const nowTime = Date.now();
			if (this[config.timeoutKey]) {
				clearTimeout(this[config.timeoutKey]);
				timestamp = nowTime - this[config.timeKey];
				if (timestamp > config.maxDelay) {
					this[config.timeoutKey] = null;
					this[config.timeKey] = null;
					config.immediateCallback();
					return;
				}
			} else {
				this[config.timeKey] = nowTime;
			}
			this[config.timeoutKey] = setTimeout(() => {
				decadeUI.layout[config.timeoutKey] = null;
				decadeUI.layout[config.timeKey] = null;
				config.callback();
			}, timestamp);
		},

		delayClear() {
			this._debounce({
				defaultDelay: 500,
				maxDelay: 1000,
				timeoutKey: "_delayClearTimeout",
				timeKey: "_delayClearTimeoutTime",
				immediateCallback: () => ui.clear(),
				callback: () => ui.clear(),
			});
		},

		invalidate() {
			this.invalidateHand();
			this.invalidateDiscard();
		},

		invalidateHand() {
			this._debounce({
				defaultDelay: 40,
				maxDelay: 180,
				timeoutKey: "_handcardTimeout",
				timeKey: "_handcardTimeoutTime",
				immediateCallback: () => decadeUI.layout.updateHand(),
				callback: () => decadeUI.layout.updateHand(),
			});
		},

		invalidateDiscard() {
			this._debounce({
				defaultDelay: ui.thrown?.length > 15 ? 80 : 40,
				maxDelay: 180,
				timeoutKey: "_discardTimeout",
				timeKey: "_discardTimeoutTime",
				immediateCallback: () => decadeUI.layout.updateDiscard(),
				callback: () => decadeUI.layout.updateDiscard(),
			});
		},

		resize() {
			if (decadeUI.isMobile()) ui.arena.classList.add("dui-mobile");
			else ui.arena.classList.remove("dui-mobile");

			decadeUI.dataset.animSizeUpdated = false;
			decadeUI.dataset.bodySize.updated = false;
			for (const key in decadeUI.boundsCaches) decadeUI.boundsCaches[key].updated = false;

			let buttonsWindow = decadeUI.sheet.getStyle("#window > .dialog.popped .buttons:not(.smallzoom)");
			if (!buttonsWindow) buttonsWindow = decadeUI.sheet.insertRule("#window > .dialog.popped .buttons:not(.smallzoom) { zoom: 1; }");

			let buttonsArena = decadeUI.sheet.getStyle("#arena:not(.choose-character) .buttons:not(.smallzoom)");
			if (!buttonsArena) buttonsArena = decadeUI.sheet.insertRule("#arena:not(.choose-character) .buttons:not(.smallzoom) { zoom: 1; }");

			decadeUI.zooms.card = decadeUI.getCardBestScale();
			if (ui.me) ui.me.style.height = Math.round(decadeUI.getHandCardSize().height * decadeUI.zooms.card + 30.4) + "px";
			if (buttonsArena) buttonsArena.zoom = decadeUI.zooms.card;
			if (buttonsWindow) buttonsWindow.zoom = decadeUI.zooms.card;
			decadeUI.layout.invalidate();
		},
	};
}
