/**
 * Control覆写模块
 * @description lib.element.control的覆写方法
 */
import { lib, ui, get, _status } from "noname";

/**
 * 保存原始方法的引用
 */
let originals = null;

/**
 * 保存原始方法
 */
export function saveOriginals() {
	if (originals) return originals;
	originals = {
		add: lib.element.control.add,
		open: lib.element.control.open,
		close: lib.element.control.close,
		replace: lib.element.control.replace,
	};
	return originals;
}

/**
 * 获取原始方法
 */
export function getOriginal(name) {
	return originals?.[name];
}

/**
 * control.add 覆写
 */
export function controlAdd(item) {
	const node = document.createElement("div");
	node.link = item;
	node.innerHTML = get.translation(item);
	node.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
	this.appendChild(node);
	this.updateLayout?.();
}

/**
 * control.open 覆写
 */
export function controlOpen() {
	ui.control.insertBefore(this, _status.createControl || ui.confirm);
	ui.controls.unshift(this);
	return this;
}

/**
 * control.close 覆写
 */
export function controlClose() {
	this.remove();
	ui.controls.remove(this);
	if (ui.confirm === this) ui.confirm = null;
	if (ui.skills === this) ui.skills = null;
	if (ui.skills2 === this) ui.skills2 = null;
	if (ui.skills3 === this) ui.skills3 = null;
}

/**
 * control.replace 覆写
 */
export function controlReplace(...args) {
	const items = Array.isArray(args[0]) ? args[0] : args;
	let index = 0;
	const nodes = this.childNodes;
	this.custom = undefined;

	for (let i = 0; i < items.length; i++) {
		if (typeof items[i] === "function") {
			this.custom = items[i];
		} else {
			if (index < nodes.length) {
				nodes[i].link = items[i];
				nodes[i].innerHTML = get.translation(items[i]);
			} else {
				this.add(items[i]);
			}
			index++;
		}
	}

	while (index < nodes.length) {
		nodes[index].remove();
	}

	this.updateLayout?.();
	ui.updatec?.();
	return this;
}

/**
 * control.updateLayout 新增方法
 */
export function controlUpdateLayout() {
	const nodes = this.childNodes;
	if (nodes.length >= 2) {
		this.classList.add("combo-control");
		for (const node of nodes) {
			node.classList.add("control");
		}
	} else {
		this.classList.remove("combo-control");
		if (nodes.length === 1) {
			nodes[0].classList.remove("control");
		}
	}
}

/**
 * 应用control覆写
 */
export function applyControlOverrides() {
	saveOriginals();

	lib.element.control.add = controlAdd;
	lib.element.control.open = controlOpen;
	lib.element.control.close = controlClose;
	lib.element.control.replace = controlReplace;
	lib.element.control.updateLayout = controlUpdateLayout;
}
