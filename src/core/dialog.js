/**
 * 对话框模块
 */
import { ui } from "noname";

/** 事件监听器管理器 */
const createListenerManager = dialog => ({
	_dialog: dialog,
	_list: [],
	add(element, event, handler, useCapture) {
		if (!(element instanceof HTMLElement) || !event || typeof handler !== "function") {
			return console.error("Invalid arguments for listener");
		}
		this._list.push([element, event, handler]);
		element.addEventListener(event, handler, useCapture);
	},
	remove(element, event, handler) {
		for (let i = this._list.length - 1; i >= 0; i--) {
			const [el, evt, fn] = this._list[i];
			const match = (!element || el === element) && (!event || evt === event) && (!handler || fn === handler);
			if (match) {
				el.removeEventListener(evt, fn);
				this._list.splice(i, 1);
			}
		}
	},
	clear() {
		this._list.forEach(([el, evt, fn]) => el.removeEventListener(evt, fn));
		this._list.length = 0;
	},
});

/** 解析时间字符串为毫秒 */
function parseDuration(duration) {
	if (typeof duration === "number") return duration;
	if (duration.includes("ms")) return parseInt(duration);
	if (duration.includes("s")) return parseFloat(duration) * 1000;
	return parseInt(duration);
}

/** 创建对话框模块 */
export const createDecadeUIDialogModule = () => ({
	create(className, parentNode, tagName = "div") {
		const element = document.createElement(tagName);
		Object.keys(decadeUI.dialog).forEach(key => {
			if (decadeUI.dialog[key] && key !== "listens") element[key] = decadeUI.dialog[key];
		});
		element.listens = createListenerManager(element);
		if (className) element.className = className;
		if (parentNode) parentNode.appendChild(element);
		return element;
	},
	show() {
		if (this === decadeUI.dialog) return;
		this.classList.remove("hidden");
	},
	hide() {
		if (this === decadeUI.dialog) return;
		this.classList.add("hidden");
	},
	animate(property, duration, toValues, fromValues) {
		if (this === decadeUI.dialog || !property || !duration || !toValues) return;
		const props = property.replace(/\s/g, "").split(",");
		const ms = parseDuration(duration);
		if (isNaN(ms)) return console.error("Invalid duration");
		if (fromValues) props.forEach((prop, i) => this.style.setProperty(prop, fromValues[i]));
		const { transitionDuration, transitionProperty } = this.style;
		this.style.transitionDuration = `${ms}ms`;
		this.style.transitionProperty = property;
		ui.refresh(this);
		props.forEach((prop, i) => this.style.setProperty(prop, toValues[i]));
		setTimeout(() => {
			this.style.transitionDuration = transitionDuration;
			this.style.transitionProperty = transitionProperty;
		}, ms);
	},
	close(delay, fadeOut) {
		if (this === decadeUI.dialog || !this.parentNode) return;
		this.listens.clear();
		if (fadeOut && delay) this.animate("opacity", delay, [0]);
		if (delay) {
			const ms = typeof delay === "number" ? delay : parseInt(delay);
			setTimeout(() => this.parentNode?.removeChild(this), ms);
		} else {
			this.parentNode.removeChild(this);
		}
	},
	listens: createListenerManager(null),
});
