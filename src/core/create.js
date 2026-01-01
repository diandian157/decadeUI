/**
 * @fileoverview decadeUI.create模块，提供对话框和UI组件创建功能
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { element } from "../utils/element.js";

/**
 * 创建decadeUI.create模块
 * @returns {Object} create模块对象
 */
export function createDecadeUICreateModule() {
	return {
		/**
		 * 创建技能对话框
		 * @returns {HTMLElement} 对话框元素
		 */
		skillDialog() {
			const dialog = document.createElement("div");
			dialog.className = "skill-dialog";

			const extend = {
				caption: undefined,
				tip: undefined,
				/**
				 * 打开对话框
				 * @param {HTMLElement} customParent - 自定义父节点
				 * @returns {HTMLElement} this
				 */
				open(customParent) {
					if (!customParent) {
						const size = decadeUI.get.bodySize();
						this.style.minHeight = parseInt(size.height * 0.42) + "px";
						if (this.parentNode !== ui.arena) ui.arena.appendChild(this);
					}
					this.style.animation = "open-dialog 0.4s";
					return this;
				},
				/**
				 * 显示对话框
				 */
				show() {
					this.style.animation = "open-dialog 0.4s";
				},
				/**
				 * 隐藏对话框
				 */
				hide() {
					this.style.animation = "close-dialog 0.1s forwards";
				},
				/**
				 * 关闭对话框
				 */
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
				/**
				 * 添加控制按钮
				 * @param {string} text - 按钮文本
				 * @param {Function} clickFunc - 点击回调
				 * @returns {HTMLElement} 按钮元素
				 */
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
	};
}
