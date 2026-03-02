/**
 * 技能按钮悬浮提示模块
 * 提供技能按钮鼠标悬停时的详细信息展示功能
 * @class SkillButtonTooltip
 */

import { lib, ui, get } from "noname";

export class SkillButtonTooltip {
	constructor() {
		/** @type {HTMLDivElement|null} 提示框元素 */
		this.tooltip = null;
		/** @type {HTMLElement|null} 当前绑定的按钮 */
		this.currentButton = null;
		/** @type {number|null} 隐藏延迟定时器 */
		this.hideTimeout = null;
		/** @type {number|null} 显示延迟定时器 */
		this.showTimeout = null;
		/** @type {number} 显示延迟时间（毫秒） */
		this.showDelay = 1000;
	}

	/**
	 * 创建提示框元素
	 * @private
	 * @returns {HTMLDivElement} 提示框元素
	 */
	createTooltip() {
		if (this.tooltip) return this.tooltip;

		this.tooltip = document.createElement("div");
		this.tooltip.className = "skill-button-tooltip";
		this.tooltip.style.cssText = `
			position: absolute;
			background: rgba(0, 0, 0, 0.9);
			color: white;
			padding: 10px 15px;
			border-radius: 4px;
			border: 1px solid white;
			font-family: yuanli, sans-serif;
			font-size: 14px;
			line-height: 1.6;
			max-width: 300px;
			word-wrap: break-word;
			z-index: 99999;
			pointer-events: none;
			opacity: 0;
			transition: opacity 0.2s ease;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
		`;
		ui.arena.appendChild(this.tooltip);
		return this.tooltip;
	}

	/**
	 * 获取元素相对于 ui.arena 的位置
	 * @private
	 * @param {HTMLElement} element - 目标元素
	 * @returns {{left: number, top: number, width: number, height: number}} 位置信息
	 */
	getElementPosition(element) {
		let left = 0;
		let top = 0;
		let current = element;

		while (current && current !== ui.arena && current !== document.body) {
			left += current.offsetLeft || 0;
			top += current.offsetTop || 0;
			current = current.offsetParent;
		}

		return {
			left,
			top,
			width: element.offsetWidth || 0,
			height: element.offsetHeight || 0,
		};
	}

	/**
	 * 获取技能描述（支持动态翻译）
	 * @private
	 * @param {string} skillName - 技能名称
	 * @param {Player} player - 玩家对象
	 * @returns {string} 技能描述文本
	 */
	getSkillDescription(skillName, player) {
		let str = "";

		try {
			if (player && lib.dynamicTranslate && lib.dynamicTranslate[skillName]) {
				const dynamicResult = lib.dynamicTranslate[skillName](player, skillName);
				if (typeof dynamicResult === "string" && dynamicResult) {
					str = dynamicResult;
				}
			}

			if (!str) {
				str = lib.translate[skillName + "_info"] || "";
			}
		} catch (e) {
			console.error(`获取技能 ${skillName} 的描述时出错:`, e);
			str = lib.translate[skillName + "_info"] || "";
		}

		return str;
	}

	/**
	 * 格式化技能描述
	 * 处理标签高亮、编号换行等格式化规则
	 * @private
	 * @param {string} text - 原始文本
	 * @returns {string} 格式化后的文本
	 */
	formatSkillDescription(text) {
		if (!text) return "";

		const { text: protectedText, brackets } = this.protectBrackets(text);
		text = protectedText;

		text = this.addLineBreaksBeforeNumbers(text);
		text = this.addLineBreakAfterLastNumber(text);
		text = this.addLineBreaksBeforeRegularNumbers(text);
		text = this.addLineBreakAfterLastRegularNumber(text);
		text = this.addLineBreaksBeforeYinYang(text);
		text = this.addLineBreakAfterLastYinYang(text);

		text = this.restoreBrackets(text, brackets);

		return text;
	}

	/**
	 * 保护〖〗和（）括号内容
	 * 使用占位符替换括号内容，避免被格式化规则影响
	 * @private
	 * @param {string} text - 原始文本
	 * @returns {{text: string, brackets: string[]}} 处理后的文本和括号内容数组
	 */
	protectBrackets(text) {
		const brackets = [];
		let protectedText = text.replace(/〖[^〗]*〗/g, match => {
			const index = brackets.length;
			brackets.push(match);
			return `__BRACKET_${index}__`;
		});
		protectedText = protectedText.replace(/（[^）]*）/g, match => {
			const index = brackets.length;
			brackets.push(match);
			return `__BRACKET_${index}__`;
		});
		return { text: protectedText, brackets };
	}

	/**
	 * 还原〖〗和（）括号内容
	 * 支持嵌套括号的还原
	 * @private
	 * @param {string} text - 处理后的文本
	 * @param {string[]} brackets - 括号内容数组
	 * @returns {string} 还原后的文本
	 */
	restoreBrackets(text, brackets) {
		let maxIterations = 10;
		let iteration = 0;

		while (/__BRACKET_\d+__/.test(text) && iteration < maxIterations) {
			text = text.replace(/__BRACKET_(\d+)__/g, (match, index) => {
				return brackets[parseInt(index)] || match;
			});
			iteration++;
		}

		return text;
	}

	/**
	 * 在效果编号前添加换行
	 * 处理①②③④⑤⑥⑦⑧⑨⑩等编号
	 * @private
	 * @param {string} text - 文本
	 * @returns {string} 处理后的文本
	 */
	addLineBreaksBeforeNumbers(text) {
		return text.replace(/(\S)([①②③④⑤⑥⑦⑧⑨⑩])/g, "$1<br>$2");
	}

	/**
	 * 在最后一个效果编号后的第一个句号后换行
	 * @private
	 * @param {string} text - 文本
	 * @returns {string} 处理后的文本
	 */
	addLineBreakAfterLastNumber(text) {
		return text.replace(/([①②③④⑤⑥⑦⑧⑨⑩])(?![\s\S]*[①②③④⑤⑥⑦⑧⑨⑩])([^。]*?。)/g, "$1$2<br>");
	}

	/**
	 * 在普通数字编号前添加换行
	 * 处理 1、2、3、或 1.2.3. 格式
	 * @private
	 * @param {string} text - 文本
	 * @returns {string} 处理后的文本
	 */
	addLineBreaksBeforeRegularNumbers(text) {
		return text.replace(/(\S)(\d+[、.])/g, "$1<br>$2");
	}

	/**
	 * 在最后一个普通数字编号后的第一个句号后换行
	 * @private
	 * @param {string} text - 文本
	 * @returns {string} 处理后的文本
	 */
	addLineBreakAfterLastRegularNumber(text) {
		return text.replace(/(\d+[、.])(?![\s\S]*\d+[、.])([^。]*?。)/g, "$1$2<br>");
	}

	/**
	 * 在阴阳标记前添加换行
	 * 只匹配"阴："或"阳："格式，排除紧跟在效果编号后的情况
	 * @private
	 * @param {string} text - 文本
	 * @returns {string} 处理后的文本
	 */
	addLineBreaksBeforeYinYang(text) {
		return text.replace(/([^①②③④⑤⑥⑦⑧⑨⑩\s])([阳阴]：)/g, "$1<br>$2");
	}

	/**
	 * 在最后一个阴阳标记后的第一个句号或分号后换行
	 * 如果阴阳标记后有分效果编号，则不换行
	 * @private
	 * @param {string} text - 文本
	 * @returns {string} 处理后的文本
	 */
	addLineBreakAfterLastYinYang(text) {
		const yinYangMatch = text.match(/([阳阴]：)(?![\s\S]*[阳阴]：)/);
		if (!yinYangMatch) return text;

		const yinYangIndex = yinYangMatch.index + yinYangMatch[0].length;
		const afterYinYang = text.substring(yinYangIndex);

		const hasCircleNumbers = /[①②③④⑤⑥⑦⑧⑨⑩]/.test(afterYinYang);
		const hasSpecialNumbers = /[⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑]/.test(afterYinYang);
		const hasRegularNumbers = /\d+[、.]/.test(afterYinYang);

		if (hasCircleNumbers || hasSpecialNumbers || hasRegularNumbers) {
			return text;
		}

		return text.replace(/([阳阴]：)(?![\s\S]*[阳阴]：)([^。；]*?[。；])/, "$1$2<br>");
	}

	/**
	 * 显示提示框
	 * @param {HTMLElement} button - 技能按钮元素
	 * @param {string} skillName - 技能名称
	 * @param {Player} player - 玩家对象
	 */
	show(button, skillName, player) {
		if (!button || !skillName) return;

		clearTimeout(this.hideTimeout);
		clearTimeout(this.showTimeout);

		this.currentButton = button;

		this.showTimeout = setTimeout(() => {
			if (this.currentButton !== button) return;

			const tooltip = this.createTooltip();

			const skillInfo = this.getSkillDescription(skillName, player);
			const formattedInfo = this.formatSkillDescription(skillInfo);
			const skillTranslation = lib.translate[skillName] || get.translation(skillName) || skillName;

			tooltip.innerHTML = `<strong style="font-size: 20px;">${skillTranslation}</strong><br>${formattedInfo}`;

			tooltip.style.opacity = "0";
			tooltip.style.display = "block";
			tooltip.style.left = "-9999px";
			tooltip.style.top = "-9999px";

			requestAnimationFrame(() => {
				this.positionTooltip(tooltip, button);
			});
		}, this.showDelay);
	}

	/**
	 * 定位提示框
	 * 水平居中于按钮，垂直显示在按钮上方
	 * @private
	 * @param {HTMLDivElement} tooltip - 提示框元素
	 * @param {HTMLElement} button - 按钮元素
	 */
	positionTooltip(tooltip, button) {
		const buttonPos = this.getElementPosition(button);
		const tooltipWidth = tooltip.offsetWidth;
		const tooltipHeight = tooltip.offsetHeight;

		let left = buttonPos.left + buttonPos.width / 2 - tooltipWidth / 2;

		const padding = 10;
		const arenaWidth = ui.arena.offsetWidth;
		if (left < padding) {
			left = padding;
		} else if (left + tooltipWidth > arenaWidth - padding) {
			left = arenaWidth - tooltipWidth - padding;
		}

		const top = buttonPos.top - tooltipHeight - 10;

		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
		tooltip.style.opacity = "1";
	}

	/**
	 * 隐藏提示框
	 */
	hide() {
		clearTimeout(this.showTimeout);

		if (!this.tooltip) {
			this.currentButton = null;
			return;
		}

		this.tooltip.style.opacity = "0";
		this.currentButton = null;

		this.hideTimeout = setTimeout(() => {
			if (this.tooltip && this.tooltip.style.opacity === "0") {
				this.tooltip.style.left = "-9999px";
				this.tooltip.style.display = "none";
			}
		}, 200);
	}

	/**
	 * 为技能按钮添加悬浮提示
	 * @param {HTMLElement} button - 技能按钮元素
	 * @param {string} skillName - 技能名称
	 * @param {Player} player - 玩家对象
	 */
	attach(button, skillName, player) {
		if (!button || !skillName) return;

		if (lib.device === "ios" || lib.device === "android") return;

		if (button.dataset.tooltipAttached === "true") return;

		const self = this;

		button.addEventListener("mouseenter", function () {
			self.show(button, skillName, player);
		});

		button.addEventListener("mouseleave", function () {
			self.hide();
		});

		button.dataset.tooltipAttached = "true";
	}

	/**
	 * 销毁提示框
	 * 清理所有资源和事件监听器
	 */
	destroy() {
		clearTimeout(this.showTimeout);
		clearTimeout(this.hideTimeout);

		if (this.tooltip && this.tooltip.parentNode) {
			this.tooltip.parentNode.removeChild(this.tooltip);
		}
		this.tooltip = null;
		this.currentButton = null;
	}
}

/**
 * 全局单例实例
 * @type {SkillButtonTooltip}
 */
export const skillButtonTooltip = new SkillButtonTooltip();
