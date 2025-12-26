/**
 * 资源加载模块
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建脚本元素
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
 */
export function createLinkElement(path) {
	// 提取不带查询参数的路径进行检查
	const basePath = path.split("?")[0];
	if (document.querySelector(`link[href*="${basePath}"]`)) return null;

	const version = lib.extensionPack.十周年UI.version;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	// 添加时间戳避免缓存问题
	link.href = `${path}?v=${version}&t=${Date.now()}`;
	document.head.appendChild(link);

	return link;
}
