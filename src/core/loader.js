/**
 * @fileoverview 资源加载模块，提供脚本和样式文件的动态加载功能
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建脚本元素
 * @param {string} path - 脚本路径
 * @param {boolean} isAsync - 是否异步加载
 * @returns {HTMLScriptElement|null} 创建的script元素，如已存在则返回null
 */
export function createScriptElement(path, isAsync = false) {
	if (document.querySelector(`script[src*="${path}"]`)) return null;

	const version = lib.extensionPack.十周年UI.version;
	const script = document.createElement("script");

	if (isAsync) {
		script.async = true;
		script.defer = true;
	}

	script.src = `${path}?v=${version}&t=${Date.now()}`;
	script.onload = () => script.remove();
	script.onerror = () => script.remove();
	document.head.appendChild(script);

	return script;
}

/**
 * 创建样式链接元素
 * @param {string} path - 样式文件路径
 * @returns {HTMLLinkElement|null} 创建的link元素，如已存在则返回null
 */
export function createLinkElement(path) {
	const basePath = path.split("?")[0];
	if (document.querySelector(`link[href*="${basePath}"]`)) return null;

	const version = lib.extensionPack.十周年UI.version;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `${path}?v=${version}&t=${Date.now()}`;
	document.head.appendChild(link);

	return link;
}
