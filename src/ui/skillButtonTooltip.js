/**
 * 技能按钮悬浮提示模块
 * @class SkillButtonTooltip
 */

import { lib, ui, get } from "noname";

export class SkillButtonTooltip {
	constructor() {
		/** @type {HTMLDivElement|null} */
		this.tooltip = null;
		/** @type {HTMLElement|null} */
		this.currentButton = null;
		/** @type {number|null} */
		this.hideTimeout = null;
	}

	/**
	 * 创建提示框元素
	 * @private
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
	 * 获取元素相对于ui.arena的位置
	 * @param {HTMLElement} element
	 * @private
	 */
	getElementPosition(element) {
		let left = 0;
		let top = 0;
		let current = element;

		// 累加offsetLeft和offsetTop直到ui.arena
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
	 * 获取技能描述（支持动态翻译和子技能回退）
	 * @param {string} skillName
	 * @param {Player} player
	 * @private
	 */
	getSkillDescription(skillName, player) {
		try {
			// 优先使用动态翻译
			if (player && lib.dynamicTranslate && lib.dynamicTranslate[skillName]) {
				const dynamicResult = lib.dynamicTranslate[skillName](player, skillName);
				if (typeof dynamicResult === "string" && dynamicResult) {
					return dynamicResult;
				}
			}
		} catch (e) {
			// 动态翻译出错，继续使用静态翻译
		}

		// 使用静态翻译
		return get.translation(skillName, "info") || "";
	}

	/**
	 * 格式化技能描述（标签高亮、编号换行等）
	 * @param {string} text
	 * @private
	 */
	formatSkillDescription(text) {
		if (!text) return "";

		// 高亮技能标签（锁定技、限定技等）
		text = this.highlightSkillTags(text);

		// 保护〖〗括号内的内容（避免被换行处理影响）
		const { text: protectedText, brackets } = this.protectBrackets(text);
		text = protectedText;

		// 在效果编号前换行（①②③等）
		text = this.addLineBreaksBeforeNumbers(text);

		// 在最后一个效果编号后的第一个句号后换行
		text = this.addLineBreakAfterLastNumber(text);

		// 在普通数字编号前换行（1、2、3、等）
		text = this.addLineBreaksBeforeRegularNumbers(text);

		// 在最后一个普通数字编号后的第一个句号后换行
		text = this.addLineBreakAfterLastRegularNumber(text);

		// 在阴阳标记前换行
		text = this.addLineBreaksBeforeYinYang(text);

		// 在最后一个阴阳标记后的第一个句号后换行
		text = this.addLineBreakAfterLastYinYang(text);

		// 还原〖〗括号内容
		text = this.restoreBrackets(text, brackets);

		return text;
	}

	/**
	 * 高亮技能标签
	 * @private
	 */
	highlightSkillTags(text) {
		const tags = ["锁定技", "限定技", "觉醒技", "转换技", "主公技", "主将技", "副将技", "阵法技", "使命技"];
		tags.forEach(tag => {
			text = text.replace(new RegExp(tag, "g"), `<span style="color: #ff4444;">${tag}</span>`);
		});
		return text;
	}

	/**
	 * 保护〖〗括号内容
	 * @private
	 */
	protectBrackets(text) {
		const brackets = [];
		const protectedText = text.replace(/〖[^〗]*〗/g, match => {
			const index = brackets.length;
			brackets.push(match);
			return `__BRACKET_${index}__`;
		});
		return { text: protectedText, brackets };
	}

	/**
	 * 还原〖〗括号内容
	 * @private
	 */
	restoreBrackets(text, brackets) {
		return text.replace(/__BRACKET_(\d+)__/g, (match, index) => {
			return brackets[parseInt(index)] || match;
		});
	}

	/**
	 * 在效果编号前添加换行（①②③等）
	 * @private
	 */
	addLineBreaksBeforeNumbers(text) {
		return text.replace(/(\S)([①②③④⑤⑥⑦⑧⑨⑩])/g, "$1<br>$2");
	}

	/**
	 * 在最后一个效果编号后的第一个句号后换行
	 * @private
	 */
	addLineBreakAfterLastNumber(text) {
		return text.replace(/([①②③④⑤⑥⑦⑧⑨⑩])(?![\s\S]*[①②③④⑤⑥⑦⑧⑨⑩])([^。]*?。)/g, "$1$2<br>");
	}

	/**
	 * 在普通数字编号前添加换行（1、2、或1.2.等）
	 * @private
	 */
	addLineBreaksBeforeRegularNumbers(text) {
		// 匹配 "1、" "2、" 或 "1." "2." 格式
		return text.replace(/(\S)(\d+[、.])/g, "$1<br>$2");
	}

	/**
	 * 在最后一个普通数字编号后的第一个句号后换行
	 * @private
	 */
	addLineBreakAfterLastRegularNumber(text) {
		// 匹配最后一个 "数字、" 或 "数字." 后的第一个句号
		return text.replace(/(\d+[、.])(?![\s\S]*\d+[、.])([^。]*?。)/g, "$1$2<br>");
	}

	/**
	 * 在阴阳标记前添加换行
	 * @private
	 */
	addLineBreaksBeforeYinYang(text) {
		return text.replace(/([^①②③④⑤⑥⑦⑧⑨⑩\s])([阳阴])/g, "$1<br>$2");
	}

	/**
	 * 在最后一个阴阳标记后的第一个句号或分号后换行
	 * @private
	 */
	addLineBreakAfterLastYinYang(text) {
		// 匹配最后一个阴阳标记，然后找其后的第一个句号或分号（支持中英文分号）
		return text.replace(/([阳阴])(?![\s\S]*[阳阴])([^。;；]*?[。;；])/g, "$1$2<br>");
	}

	/**
	 * 显示提示框
	 * @param {HTMLElement} button
	 * @param {string} skillName
	 * @param {Player} player
	 */
	show(button, skillName, player) {
		if (!button || !skillName) return;

		clearTimeout(this.hideTimeout);
		this.currentButton = button;

		const tooltip = this.createTooltip();

		// 获取并格式化技能描述
		const skillInfo = this.getSkillDescription(skillName, player);
		const formattedInfo = this.formatSkillDescription(skillInfo);
		const skillTranslation = lib.translate[skillName] || get.translation(skillName) || skillName;

		// 设置提示框内容
		tooltip.innerHTML = `<strong style="font-size: 20px;">${skillTranslation}</strong><br>${formattedInfo}`;

		// 先隐藏在屏幕外，等待计算位置
		tooltip.style.opacity = "0";
		tooltip.style.display = "block";
		tooltip.style.left = "-9999px";
		tooltip.style.top = "-9999px";

		// 等待下一帧再计算位置（确保内容已渲染）
		requestAnimationFrame(() => {
			this.positionTooltip(tooltip, button);
		});
	}

	/**
	 * 定位提示框（水平居中，垂直显示在按钮上方）
	 * @private
	 */
	positionTooltip(tooltip, button) {
		const buttonPos = this.getElementPosition(button);
		const tooltipWidth = tooltip.offsetWidth;
		const tooltipHeight = tooltip.offsetHeight;

		// 计算水平居中位置
		let left = buttonPos.left + buttonPos.width / 2 - tooltipWidth / 2;

		// 水平边界检测（相对于arena）
		const padding = 10;
		const arenaWidth = ui.arena.offsetWidth;
		if (left < padding) {
			left = padding;
		} else if (left + tooltipWidth > arenaWidth - padding) {
			left = arenaWidth - tooltipWidth - padding;
		}

		// 计算垂直位置 - 始终显示在按钮上方
		const top = buttonPos.top - tooltipHeight - 10;

		// 应用位置并显示
		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
		tooltip.style.opacity = "1";
	}

	/**
	 * 隐藏提示框
	 */
	hide() {
		if (!this.tooltip) return;

		this.tooltip.style.opacity = "0";
		this.currentButton = null;

		// 延迟移除，等待淡出动画完成
		this.hideTimeout = setTimeout(() => {
			if (this.tooltip && this.tooltip.style.opacity === "0") {
				this.tooltip.style.left = "-9999px";
				this.tooltip.style.display = "none";
			}
		}, 200);
	}

	/**
	 * 为技能按钮添加悬浮提示
	 * @param {HTMLElement} button
	 * @param {string} skillName
	 * @param {Player} player
	 */
	attach(button, skillName, player) {
		if (!button || !skillName) return;

		// 避免重复绑定
		if (button.dataset.tooltipAttached === "true") return;

		const self = this;

		button.addEventListener("mouseenter", function () {
			self.show(button, skillName, player);
		});

		button.addEventListener("mouseleave", function () {
			self.hide();
		});

		// 添加标记，表示已绑定
		button.dataset.tooltipAttached = "true";
	}

	/**
	 * 销毁提示框
	 */
	destroy() {
		if (this.tooltip && this.tooltip.parentNode) {
			this.tooltip.parentNode.removeChild(this.tooltip);
		}
		this.tooltip = null;
		this.currentButton = null;
		clearTimeout(this.hideTimeout);
	}
}

/**
 * 全局单例实例
 * @type {SkillButtonTooltip}
 */
export const skillButtonTooltip = new SkillButtonTooltip();
