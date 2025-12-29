/**
 * @fileoverview 调试工具模块，提供Eruda调试器和Node.js文件系统初始化
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 初始化Eruda调试工具
 */
export function initEruda() {
	if (!lib.config[`extension_${decadeUIName}_eruda`]) return;

	const script = document.createElement("script");
	script.src = `${decadeUIPath}src/libs/eruda.js`;
	script.onload = () => eruda.init();
	document.body.appendChild(script);
}

/**
 * 初始化Node.js文件系统
 */
export function initNodeFS() {
	if (window.require && !window.fs) {
		window.fs = require("fs");
	}
}
