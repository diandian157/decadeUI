/**
 * 布局模块
 */
import { lib, game, ui, get, ai, _status } from "noname";

const getStyle = () => decadeUI?.config?.newDecadeStyle ?? lib.config.extension_十周年UI_newDecadeStyle;
const getDiscardScale = () => lib.config?.extension_十周年UI_discardScale ?? 0.14;

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

			const cards = [...handNode.childNodes].filter(card => {
				if (card.classList.contains("removing")) {
					card.scaled = false;
					return false;
				}
				return true;
			});
			if (!cards.length) return;

			const bounds = decadeUI.boundsCaches.hand;
			bounds.check();
			const { width: pw, cardWidth: cw, cardHeight: ch, cardScale: cs, x: boundsX } = bounds;
			const csw = cw * cs;
			const y = Math.round((ch * cs - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			const totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;
			let expand = false;

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
				const style = getStyle();
				const shouldCenter = style === "codename" || ((style === "on" || style === "othersOff") && !lib.config.phonelayout);
				if (shouldCenter) {
					xStart = (ui.arena.offsetWidth - totalW) / 2 - boundsX;
				}
			}

			let selectedIndex = -1,
				spreadOffsetLeft = 0,
				spreadOffsetRight = 0,
				baseShift = 0;
			const folded = totalW > limitW && xMargin < csw - 0.5;

			if (folded && typeof ui.getSpreadOffset === "function") {
				const spread = ui.getSpreadOffset(cards, { cardWidth: csw, currentMargin: xMargin });
				({ selectedIndex, spreadLeft: spreadOffsetLeft, spreadRight: spreadOffsetRight } = spread);
				if (selectedIndex !== -1) {
					const selX = xStart + selectedIndex * xMargin;
					const maxSelX = Math.max(0, limitW - csw);
					baseShift = Math.round(Math.max(0, Math.min(maxSelX, selX)) - selX);
				}
			}

			cards.forEach((card, i) => {
				let fx = xStart + i * xMargin + baseShift;
				if (spreadOffsetLeft || spreadOffsetRight) {
					if (i < selectedIndex) fx -= spreadOffsetLeft;
					else if (i > selectedIndex) fx += spreadOffsetRight;
				}
				const x = Math.round(fx);
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = `translate(${x}px,${y}px) scale(${cs})`;
				card._transform = card.style.transform;
				card.updateTransform(card.classList.contains("selected"));
			});

			const container = ui.handcards1Container;
			if (expand) {
				container.classList.add("scrollh");
				container.style.overflowX = "scroll";
				container.style.overflowY = "hidden";
				handNode.style.width = `${Math.round(cards.length * xMargin + (csw - xMargin))}px`;
			} else {
				container.classList.remove("scrollh");
				container.style.overflowX = container.style.overflowY = "";
				handNode.style.width = "100%";
			}
		},

		updateDiscard() {
			ui.thrown ??= [];
			ui.thrown = ui.thrown.filter(t => {
				if (t.classList.contains("drawingcard") || t.classList.contains("removing") || t.parentNode !== ui.arena || t.fixed) {
					return false;
				}
				t.classList.remove("removing");
				return true;
			});
			if (!ui.thrown.length) return;

			const cards = ui.thrown;
			const bounds = decadeUI.boundsCaches.arena;
			bounds.check();
			const { width: pw, height: ph, cardWidth: cw, cardHeight: ch } = bounds;
			const cs = Math.min((decadeUI.get.bodySize().height * getDiscardScale()) / ch, 1);
			const csw = cw * cs;
			const y = Math.round((ph - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			const totalW = cards.length * csw + (cards.length - 1) * 2;

			if (totalW > pw) {
				xMargin = csw - Math.abs(pw - csw * cards.length) / (cards.length - 1);
			} else {
				xStart += (pw - totalW) / 2;
			}

			cards.forEach((card, i) => {
				const x = Math.round(xStart + i * xMargin);
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = `translate(${x}px,${y}px) scale(${cs})`;
			});
		},

		clearout(card) {
			if (!card || card.fixed || card.classList.contains("removing")) return;
			if (card.name?.startsWith("shengbei_left_") || card.name?.startsWith("shengbei_right_")) {
				card.delete();
				return;
			}
			if (!ui.thrown.includes(card)) {
				ui.thrown.unshift(card);
				decadeUI.queueNextFrameTick(decadeUI.layoutDiscard, decadeUI);
			}
			card.classList.add("invalided");
			setTimeout(
				c => {
					c.remove();
					decadeUI.queueNextFrameTick(decadeUI.layoutDiscard, decadeUI);
				},
				2333,
				card
			);
		},

		_debounce(config) {
			const { defaultDelay, maxDelay, timeoutKey, timeKey, immediateCallback, callback } = config;
			const nowTime = Date.now();

			if (this[timeoutKey]) {
				clearTimeout(this[timeoutKey]);
				if (nowTime - this[timeKey] > maxDelay) {
					this[timeoutKey] = this[timeKey] = null;
					immediateCallback();
					return;
				}
			} else {
				this[timeKey] = nowTime;
			}

			this[timeoutKey] = setTimeout(
				() => {
					this[timeoutKey] = this[timeKey] = null;
					callback();
				},
				this[timeoutKey] ? nowTime - this[timeKey] : defaultDelay
			);
		},

		delayClear() {
			this._debounce({
				defaultDelay: 500,
				maxDelay: 1000,
				timeoutKey: "_delayClearTimeout",
				timeKey: "_delayClearTimeoutTime",
				immediateCallback: ui.clear,
				callback: ui.clear,
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
				immediateCallback: () => this.updateHand(),
				callback: () => this.updateHand(),
			});
		},

		invalidateDiscard() {
			this._debounce({
				defaultDelay: ui.thrown?.length > 15 ? 80 : 40,
				maxDelay: 180,
				timeoutKey: "_discardTimeout",
				timeKey: "_discardTimeoutTime",
				immediateCallback: () => this.updateDiscard(),
				callback: () => this.updateDiscard(),
			});
		},

		resize() {
			ui.arena.classList.toggle("dui-mobile", decadeUI.isMobile());

			decadeUI.dataset.animSizeUpdated = false;
			decadeUI.dataset.bodySize.updated = false;
			Object.values(decadeUI.boundsCaches).forEach(cache => (cache.updated = false));

			const ensureStyle = selector => decadeUI.sheet.getStyle(selector) || decadeUI.sheet.insertRule(`${selector} { zoom: 1; }`);
			const buttonsWindow = ensureStyle("#window > .dialog.popped .buttons:not(.smallzoom)");
			const buttonsArena = ensureStyle("#arena:not(.choose-character) .buttons:not(.smallzoom)");

			decadeUI.zooms.card = decadeUI.getCardBestScale();
			if (ui.me) ui.me.style.height = `${Math.round(decadeUI.getHandCardSize().height * decadeUI.zooms.card + 30.4)}px`;
			if (buttonsArena) buttonsArena.zoom = decadeUI.zooms.card;
			if (buttonsWindow) buttonsWindow.zoom = decadeUI.zooms.card;
			this.invalidate();
		},
	};
}
