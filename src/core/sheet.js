/**
 * @fileoverview 样式表模块，提供CSS样式表的查询和操作功能
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 创建sheet模块
 * @returns {Object} sheet模块对象
 */
export function createSheetModule() {
	return {
		/**
		 * 初始化样式表列表
		 */
		init() {
			if (!this.sheetList) {
				this.sheetList = [];
				for (let i = 0; i < document.styleSheets.length; i++) {
					if (document.styleSheets[i].href?.indexOf("extension/" + encodeURI(decadeUIName)) !== -1) {
						this.sheetList.push(document.styleSheets[i]);
					}
				}
			}
			if (this.sheetList) delete this.init;
		},

		/**
		 * 获取样式规则
		 * @param {string} selector - CSS选择器
		 * @param {string} cssName - CSS文件名
		 * @returns {CSSStyleDeclaration|null} 样式声明对象
		 */
		getStyle(selector, cssName) {
			if (!this.sheetList) this.init();
			if (!this.sheetList) throw "sheet not loaded";
			if (typeof selector !== "string" || !selector) throw 'parameter "selector" error';
			if (!this.cachedSheet) this.cachedSheet = {};
			if (this.cachedSheet[selector]) return this.cachedSheet[selector];

			const sheetList = this.sheetList;
			let sheet,
				shouldBreak = false;

			for (let j = sheetList.length - 1; j >= 0; j--) {
				if (typeof cssName === "string") {
					cssName = cssName.replace(/.css/, "") + ".css";
					for (let k = j; k >= 0; k--) {
						if (sheetList[k].href.indexOf(cssName) !== -1) sheet = sheetList[k];
					}
					shouldBreak = true;
					if (!sheet) throw "cssName not found";
				} else {
					sheet = sheetList[j];
				}

				try {
					for (let i = 0; i < sheet.cssRules.length; i++) {
						if (!(sheet.cssRules[i] instanceof CSSMediaRule)) {
							if (sheet.cssRules[i].selectorText === selector) {
								this.cachedSheet[selector] = sheet.cssRules[i].style;
								return sheet.cssRules[i].style;
							}
						} else {
							const rules = sheet.cssRules[i].cssRules;
							for (let k = 0; k < rules.length; k++) {
								if (rules[k].selectorText === selector) return rules[k].style;
							}
						}
					}
				} catch (e) {
					console.error(e, "error-sheet", sheet);
				}
				if (shouldBreak) break;
			}
			return null;
		},

		/**
		 * 插入样式规则
		 * @param {string} rule - CSS规则字符串
		 * @param {number} index - 插入位置
		 * @param {string} cssName - CSS文件名
		 * @returns {CSSStyleDeclaration} 插入的样式声明
		 */
		insertRule(rule, index, cssName) {
			if (!this.sheetList) this.init();
			if (!this.sheetList) throw "sheet not loaded";
			if (typeof rule !== "string" || !rule) throw 'parameter "rule" error';

			let sheet;
			if (typeof cssName === "string") {
				cssName = cssName.replace(/.css/, "") + ".css";
				for (let j = this.sheetList.length - 1; j >= 0; j--) {
					if (this.sheetList[j].href.indexOf(cssName) !== -1) sheet = this.sheetList[j];
				}
				if (!sheet) throw "cssName not found";
			}
			if (!sheet) sheet = this.sheetList[this.sheetList.length - 1];

			const inserted = typeof index === "number" ? sheet.insertRule(rule, index) : sheet.insertRule(rule, sheet.cssRules.length);
			return sheet.cssRules[inserted].style;
		},
	};
}
