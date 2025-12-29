/**
 * @fileoverview 武将名前缀处理模块，过滤隐藏前缀并格式化武将名称显示
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 隐藏前缀列表
 * @type {string[]}
 */
const HIDDEN_PREFIXES = ["新杀", "手杀", "OL", "TW"];

/**
 * 移除隐藏前缀
 * @param {string} name - 原始名称
 * @returns {string} 处理后的名称
 */
const removeHiddenPrefix = name => {
	const prefix = HIDDEN_PREFIXES.find(p => name.startsWith(p));
	return prefix ? name.slice(prefix.length) : name;
};

/**
 * 初始化武将名前缀处理
 * @returns {void}
 */
export function setupCharacterNamePrefix() {
	/** 获取精简横向名称 */
	get.slimNameHorizontal = function (str) {
		const slimName = lib.translate[`${str}_ab`] || lib.translate[str];
		if (!slimName) return "";

		const prefixKey = `${str}_prefix`;
		if (!lib.translate[prefixKey]) return removeHiddenPrefix(slimName);

		const prefixList = lib.translate[prefixKey].split("|").filter(p => !HIDDEN_PREFIXES.includes(p));
		const setPrefix = [];
		let processedName = slimName;

		for (const prefix of prefixList) {
			const hiddenBefore = HIDDEN_PREFIXES.find(hp => processedName.startsWith(hp + prefix));
			if (hiddenBefore) {
				setPrefix.push(prefix);
				processedName = processedName.slice(hiddenBefore.length + prefix.length);
			} else if (processedName.startsWith(prefix)) {
				setPrefix.push(prefix);
				processedName = processedName.slice(prefix.length);
			} else {
				break;
			}
		}

		if (setPrefix.length) {
			const prefixHtml = setPrefix.map(p => get.prefixSpan(p, str)).join("");
			return `${prefixHtml}<span>${removeHiddenPrefix(processedName)}</span>`;
		}
		return removeHiddenPrefix(processedName);
	};

	// 包装 prefixSpan 以过滤隐藏前缀
	const originalPrefixSpan = get.prefixSpan;
	get.prefixSpan = function (prefix, name) {
		return HIDDEN_PREFIXES.includes(prefix) ? "" : originalPrefixSpan.call(this, prefix, name);
	};
}
