/**
 * 调试工具模块
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 初始化 Eruda 调试工具
 */
export function initEruda() {
	if (!lib.config[`extension_${decadeUIName}_eruda`]) return;

	const script = document.createElement("script");
	script.src = `${decadeUIPath}src/libs/eruda.js`;
	script.onload = () => eruda.init();
	document.body.appendChild(script);
}

/**
 * 初始化 Node.js 文件系统
 */
export function initNodeFS() {
	if (window.require && !window.fs) {
		window.fs = require("fs");
	}
}
