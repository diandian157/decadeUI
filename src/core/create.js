/**
 * decadeUI.create 模块
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { element } from "../utils/element.js";

/** 创建decadeUI.create模块 */
export function createDecadeUICreateModule() {
	return {
		skillDialog() {
			const dialog = document.createElement("div");
			dialog.className = "skill-dialog";

			const extend = {
				caption: undefined,
				tip: undefined,
				open(customParent) {
					if (!customParent) {
						const size = decadeUI.get.bodySize();
						this.style.minHeight = parseInt(size.height * 0.42) + "px";
						if (this.parentNode !== ui.arena) ui.arena.appendChild(this);
					}
					this.style.animation = "open-dialog 0.4s";
					return this;
				},
				show() {
					this.style.animation = "open-dialog 0.4s";
				},
				hide() {
					this.style.animation = "close-dialog 0.1s forwards";
				},
				close() {
					const func = function (e) {
						if (e.animationName !== "close-dialog") return;
						this.remove();
						this.removeEventListener("animationend", func);
					};
					if (this.style.animationName === "close-dialog") {
						setTimeout(d => d.remove(), 100, this);
					} else {
						this.style.animation = "close-dialog 0.1s forwards";
						this.addEventListener("animationend", func);
					}
				},
				appendControl(text, clickFunc) {
					const control = document.createElement("div");
					control.className = "control-button";
					control.textContent = text;
					if (clickFunc) control.addEventListener("click", clickFunc);
					return this.$controls.appendChild(control);
				},
				$caption: element.create("caption", dialog),
				$content: element.create("content", dialog),
				$tip: element.create("tip", dialog),
				$controls: element.create("controls", dialog),
			};

			decadeUI.get.extend(dialog, extend);
			Object.defineProperties(dialog, {
				caption: {
					configurable: true,
					get() {
						return this.$caption.innerHTML;
					},
					set(value) {
						if (this.$caption.innerHTML !== value) this.$caption.innerHTML = value;
					},
				},
				tip: {
					configurable: true,
					get() {
						return this.$tip.innerHTML;
					},
					set(value) {
						if (this.$tip.innerHTML !== value) this.$tip.innerHTML = value;
					},
				},
			});
			return dialog;
		},

		compareDialog(player, target) {
			const dialog = decadeUI.create.skillDialog();
			dialog.classList.add("compare");
			dialog.$content.classList.add("buttons");

			const extend = {
				player: undefined,
				target: undefined,
				playerCard: undefined,
				targetCard: undefined,
				$player: element.create("player-character player1", dialog.$content),
				$target: element.create("player-character player2", dialog.$content),
				$playerCard: element.create("player-card", dialog.$content),
				$targetCard: element.create("target-card", dialog.$content),
				$vs: element.create("vs", dialog.$content),
			};

			decadeUI.get.extend(dialog, extend);
			element.create("image", dialog.$player);
			element.create("image", dialog.$target);

			Object.defineProperties(dialog, {
				player: {
					configurable: true,
					get() {
						return this._player;
					},
					set(value) {
						if (this._player === value) return;
						this._player = value;
						this.$player.firstChild.style.backgroundImage = !value || value.isUnseen() ? "" : (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
						if (value) this.$playerCard.dataset.text = get.translation(value) + "发起";
					},
				},
				target: {
					configurable: true,
					get() {
						return this._target;
					},
					set(value) {
						if (this._target === value) return;
						this._target = value;
						this.$target.firstChild.style.backgroundImage = !value || value.isUnseen() ? "" : (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
						if (value) this.$targetCard.dataset.text = get.translation(value);
					},
				},
				playerCard: {
					configurable: true,
					get() {
						return this._playerCard;
					},
					set(value) {
						if (this._playerCard === value) return;
						if (this._playerCard) this._playerCard.remove();
						this._playerCard = value;
						if (value) this.$playerCard.appendChild(value);
					},
				},
				targetCard: {
					configurable: true,
					get() {
						return this._targetCard;
					},
					set(value) {
						if (this._targetCard === value) return;
						if (this._targetCard) this._targetCard.remove();
						this._targetCard = value;
						if (value) this.$targetCard.appendChild(value);
					},
				},
			});

			if (player) dialog.player = player;
			if (target) dialog.target = target;
			return dialog;
		},
	};
}
