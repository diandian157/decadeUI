/**
 * @fileoverview 版本工具模块 - 提供版本号比较和兼容性检查功能
 */

import { lib, game, ui, _status } from "noname";

/** 版本检查延迟配置 */
const DELAY_CONFIG = {
	INITIAL: 300, // 初始检查延迟（ms）
	FALLBACK: 800, // 备用显示延迟（ms）
	PRE_HIDE_INTERVAL: 30, // 预隐藏检查间隔（ms）
	KEEP_ON_TOP_INTERVAL: 30, // 保持置顶检查间隔（ms）
	RETRY: 100, // 重试延迟（ms）
};

/** 弹窗样式配置 */
const DIALOG_STYLES = {
	Z_INDEX: "99999",
	LINK_COLOR: "#5bc0de",
	WARNING_COLOR: "#f0ad4e",
	BUTTON_WIDTH: "120px",
};

/**
 * 比较两个版本号
 * @param {string} v1 - 版本号1
 * @param {string} v2 - 版本号2
 * @returns {number} 1(v1>v2), -1(v1<v2), 0(相等)
 */
export function compareVersions(v1, v2) {
	const parts1 = v1.split(".").map(Number);
	const parts2 = v2.split(".").map(Number);
	const maxLen = Math.max(parts1.length, parts2.length);

	for (let i = 0; i < maxLen; i++) {
		const p1 = parts1[i] || 0;
		const p2 = parts2[i] || 0;
		if (p1 !== p2) return p1 > p2 ? 1 : -1;
	}
	return 0;
}

/**
 * 检查版本兼容性并提示用户
 * @returns {void}
 */
export function checkVersionCompatibility() {
	const currentVersion = lib.version;
	const requiredVersion = lib.extensionPack.十周年UI.minNonameVersion;
	const comparison = compareVersions(currentVersion, requiredVersion);

	if (comparison === 0) return;

	// 标记版本不匹配
	_status.decadeVersionMismatch = true;

	// 根据版本比较结果显示相应的警告
	setTimeout(() => {
		const dialogConfig = getDialogConfig(comparison, requiredVersion);
		scheduleDialogDisplay(dialogConfig);
	}, DELAY_CONFIG.INITIAL);
}

/**
 * 获取弹窗配置
 * @param {number} comparison - 版本比较结果
 * @param {string} requiredVersion - 要求的版本号
 * @returns {Object} 弹窗配置对象
 */
function getDialogConfig(comparison, requiredVersion) {
	if (comparison === -1) {
		// 无名杀版本过低
		return {
			message: `无名杀本体过低，请下载${requiredVersion}离线包或完整包。`,
			links: [
				{
					text: "前往GitHub下载",
					href: "https://github.com/libnoname/noname/releases",
				},
			],
		};
	} else {
		// 十周年UI版本过低
		return {
			message: "十周年UI版本过低，请下载新版本：",
			links: [
				{ text: "QQ群聊 985914900", href: "https://qm.qq.com/q/QsKh0KIYGA" },
				{ text: "GitHub仓库", href: "https://github.com/diandian157/decadeUI" },
			],
		};
	}
}

/**
 * 调度弹窗显示
 * @param {Object} config - 弹窗配置
 * @returns {void}
 */
function scheduleDialogDisplay(config) {
	if (lib.arenaReady) {
		lib.arenaReady.push(() => showVersionMismatchDialog(config));
	} else {
		setTimeout(() => showVersionMismatchDialog(config), DELAY_CONFIG.FALLBACK);
	}
}

/**
 * 显示版本不匹配弹窗
 * @param {Object} options - 配置选项
 * @param {string} options.message - 提示消息
 * @param {Array<{text: string, href: string}>} options.links - 下载链接列表
 * @returns {void}
 */
function showVersionMismatchDialog(options) {
	// 预隐藏其他弹窗
	const preHideInterval = startPreHiding();

	// 确保UI已初始化
	if (!ui.dialogs) {
		setTimeout(() => {
			clearInterval(preHideInterval);
			showVersionMismatchDialog(options);
		}, DELAY_CONFIG.RETRY);
		return;
	}

	clearInterval(preHideInterval);

	// 创建并配置弹窗
	const dialog = createDialog(options);

	// 管理弹窗显示
	const dialogManager = new DialogManager(dialog);
	dialogManager.show();
}

/**
 * 弹窗管理器类
 */
class DialogManager {
	constructor(dialog) {
		this.dialog = dialog;
		this.hiddenDialogs = [];
		this.checkInterval = null;
	}

	/**
	 * 显示弹窗并开始管理
	 */
	show() {
		this.dialog.open();
		this.hideOtherDialogs();
		this.startMonitoring();
		this.overrideCloseMethod();
	}

	/**
	 * 隐藏其他弹窗
	 */
	hideOtherDialogs() {
		ui.dialogs.forEach(d => {
			if (
				d !== this.dialog &&
				d.style.display !== "none" &&
				!this.hiddenDialogs.includes(d)
			) {
				this.hiddenDialogs.push(d);
				d.style.display = "none";
			}
		});
	}

	/**
	 * 保持弹窗在最上层
	 */
	keepOnTop() {
		if (!this.dialog.parentNode || !ui.dialogs.includes(this.dialog)) return;

		// 确保在最前面
		if (ui.dialogs[0] !== this.dialog) {
			ui.dialogs.remove(this.dialog);
			ui.dialogs.unshift(this.dialog);
			this.dialog.show();
			this.dialog.refocus();
		}

		// 持续隐藏其他弹窗
		this.hideOtherDialogs();
	}

	/**
	 * 开始监控
	 */
	startMonitoring() {
		this.checkInterval = setInterval(() => {
			if (!this.dialog.parentNode) {
				this.stopMonitoring();
				return;
			}
			this.keepOnTop();
		}, DELAY_CONFIG.KEEP_ON_TOP_INTERVAL);
	}

	/**
	 * 停止监控
	 */
	stopMonitoring() {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
	}

	/**
	 * 恢复被隐藏的弹窗
	 */
	restoreHiddenDialogs() {
		this.hiddenDialogs.forEach(d => {
			if (d.parentNode) {
				d.style.display = "";
			}
		});
		this.hiddenDialogs = [];
	}

	/**
	 * 重写关闭方法
	 */
	overrideCloseMethod() {
		const originalClose = this.dialog.close.bind(this.dialog);
		this.dialog.close = () => {
			this.stopMonitoring();
			this.restoreHiddenDialogs();
			return originalClose();
		};
	}
}

/**
 * 开始预隐藏其他弹窗
 * @returns {number} 定时器ID
 */
function startPreHiding() {
	const preHideDialogs = () => {
		if (ui.dialogs && ui.dialogs.length > 0) {
			ui.dialogs.forEach(d => {
				if (d.style.display !== "none") {
					d.style.display = "none";
				}
			});
		}
	};

	preHideDialogs();
	return setInterval(preHideDialogs, DELAY_CONFIG.PRE_HIDE_INTERVAL);
}

/**
 * 创建弹窗
 * @param {Object} options - 弹窗选项
 * @returns {HTMLElement} 弹窗元素
 */
function createDialog(options) {
	const dialog = ui.create.dialog("forcebutton");
	dialog.classList.add("fixed");
	dialog.style.zIndex = DIALOG_STYLES.Z_INDEX;
	dialog.static = true;

	// 添加内容
	addDialogContent(dialog, options);

	return dialog;
}

/**
 * 添加弹窗内容
 * @param {HTMLElement} dialog - 弹窗元素
 * @param {Object} options - 内容选项
 */
function addDialogContent(dialog, options) {
	// 提示消息
	dialog.add(`<div class="text center" style="line-height: 1.8;">${options.message}</div>`);

	// 下载链接
	const linkDiv = createLinkContainer(options.links);
	dialog.add(linkDiv);

	// 警告提示
	dialog.add(
		`<div class="text center" style="color: ${DIALOG_STYLES.WARNING_COLOR}; margin-top: 15px;">点击确定继续游戏，但遇到的问题均不受理</div>`
	);

	// 确定按钮
	const confirmBtn = createConfirmButton(dialog);
	dialog.add(confirmBtn);
}

/**
 * 创建链接容器
 * @param {Array<{text: string, href: string}>} links - 链接列表
 * @returns {HTMLElement} 链接容器元素
 */
function createLinkContainer(links) {
	const linkDiv = ui.create.div(".text.center");
	linkDiv.style.cssText = "margin: 15px 0;";

	links.forEach((link, index) => {
		if (index > 0) {
			linkDiv.appendChild(document.createTextNode(" 或 "));
		}

		const anchor = document.createElement("a");
		anchor.href = link.href;
		anchor.target = "_blank";
		anchor.textContent = link.text;
		anchor.style.cssText = `color: ${DIALOG_STYLES.LINK_COLOR}; text-decoration: underline; margin: 0 10px; font-size: 16px;`;
		linkDiv.appendChild(anchor);
	});

	return linkDiv;
}

/**
 * 创建确定按钮
 * @param {HTMLElement} dialog - 弹窗元素
 * @returns {HTMLElement} 按钮元素
 */
function createConfirmButton(dialog) {
	const confirmBtn = ui.create.div(".menubutton.large", "确定", () => {
		dialog.close();
		game.print("已确认版本不匹配，继续游戏...");
	});
	confirmBtn.style.cssText = `margin: 15px auto 0; width: ${DIALOG_STYLES.BUTTON_WIDTH};`;
	return confirmBtn;
}
