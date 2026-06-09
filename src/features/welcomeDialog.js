/**
 * @fileoverview 首次启动欢迎窗口
 * @description 扩展首次启动或版本更新时显示欢迎对话框
 * @module features/welcomeDialog
 */
import { lib, game, ui } from "noname";

/**
 * 加载欢迎窗口样式表
 * @description 动态加载CSS文件，避免重复加载
 */
function loadStyles() {
	if (document.getElementById("decade-welcome-styles")) return;

	const link = document.createElement("link");
	link.id = "decade-welcome-styles";
	link.rel = "stylesheet";
	link.href = `${lib.assetURL}extension/十周年UI/src/features/welcomeDialog.css`;
	document.head.appendChild(link);
}

/**
 * 检查是否需要显示欢迎窗口
 * @param {Object} extensionInfo - 扩展信息对象
 * @param {string} extensionInfo.version - 当前扩展版本号
 * @returns {boolean} 是否需要显示欢迎窗口
 */
function shouldShowWelcome(extensionInfo) {
	const storageKey = "extension_十周年UI_welcomeVersion";
	const lastVersion = lib.config[storageKey];
	const currentVersion = extensionInfo.version;

	if (!lastVersion || lastVersion !== currentVersion) {
		game.saveConfig(storageKey, currentVersion);
		return true;
	}

	return false;
}

/**
 * 创建欢迎对话框
 * @description 显示欢迎信息和更新日志，支持点击头像切换内容
 */
export function createWelcomeDialog() {
	loadStyles();

	const overlay = ui.create.div(".decade-welcome-overlay");
	const dialog = ui.create.div(".decade-welcome-dialog", overlay);
	ui.create.div(".decade-welcome-pattern", dialog);

	const avatar = document.createElement("img");
	avatar.src = `${lib.assetURL}extension/十周年UI/image/ui/avatar/avatar.jpg`;
	avatar.className = "author-avatar";

	let isShowingUpdate = false;
	let defaultContent = "";

	/**
	 * 点击头像切换内容
	 * @description 在欢迎信息和更新日志之间切换
	 */
	avatar.addEventListener("click", async () => {
		if (isShowingUpdate) {
			text.innerHTML = defaultContent;
			bubble.innerHTML = "点我查看更新内容";
			isShowingUpdate = false;
			text.scrollTop = 0;
		} else {
			try {
				const response = await fetch(`${decadeUIPath}docs/update.md`);
				const markdown = await response.text();

				let html = markdown
					.replace(/^# (.+)$/gm, '<h1 style="font-size: 22px; margin: 8px 0 5px 0; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">$1</h1>')
					.replace(/^## (.+)$/gm, '<h2 style="font-size: 19px; margin: 6px 0 4px 0; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">$1</h2>')
					.replace(/^### (.+)$/gm, '<h3 style="font-size: 17px; margin: 5px 0 3px 0; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">$1</h3>')
					.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin: 2px 0; color: #fff; line-height: 1.5; font-size: 15px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">$1</li>')
					.replace(/^- (.+)$/gm, '<li style="margin: 2px 0; color: #fff; line-height: 1.5; font-size: 15px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">$1</li>')
					.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #ffd700; text-decoration: underline; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">$1</a>')
					.replace(/\n\n/g, "<br>");

				html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul style="margin: 3px 0 5px 15px; padding-left: 15px; color: #fff;">$&</ul>');

				text.innerHTML = html;
				bubble.innerHTML = "点我返回前言";
				isShowingUpdate = true;
				text.scrollTop = 0;
			} catch (e) {
				text.innerHTML = '<p style="color: #fff; text-align: center;">更新日志加载失败 (´；ω；`)</p>';
			}
		}
	});

	dialog.appendChild(avatar);

	const bubble = ui.create.div(".decade-welcome-bubble", dialog);
	bubble.innerHTML = "点我查看更新内容";

	const text = ui.create.div(".decade-welcome-text", dialog);
	text.innerHTML = `
		<p style="margin: 0 0 15px 0;">
			今天不发癫，祝所有考生前程似锦。
		</p>
		<p style="margin: 0 0 15px 0;">
			被选中的孩子啊，你已解开了‘十二年义务教育’的古老封印。那名为‘高考’的终焉试炼，不过是世界意志对你灵魂强度的一次小小考验——而你，已经证明了自己。
		</p>
		<p style="margin: 0 0 15px 0;">
			此刻，沉睡于你血脉中的真正力量已然觉醒——那是名为‘无限可能的未来’的至高圣物。笔是曾经的法杖，试卷是燃烧殆尽的诅咒卷轴，而那个在题海中无数次倒下的你，如今终于站在了现实与幻想的交界线上。
		</p>
		<p style="margin: 0 0 15px 0;">
		    爆裂吧，名为‘压力’的现实！粉碎吧，那些写满焦虑的试卷！从今天起，你不再是教室里那个默默无闻的普通学生——你将以‘大学生’之名，背负着梦想，在这个平淡的世界里，刻下只属于你的、闪闪发光的传说！
		</p>
		<p style="margin: 0 0 15px 0;">
			去吧，勇者。你的下一站——是星辰大海！
		</p>
	`;

	defaultContent = text.innerHTML;

	lib.setScroll(text);

	overlay.addEventListener("click", e => {
		if (e.target === overlay) {
			overlay.remove();
		}
	});

	document.body.appendChild(overlay);
}

/**
 * 初始化欢迎对话框
 * @param {Object} extensionInfo - 扩展信息对象
 * @param {string} extensionInfo.version - 当前扩展版本号
 * @description 检查版本并在需要时延迟显示欢迎窗口
 */
export function setupWelcomeDialog(extensionInfo) {
	if (!shouldShowWelcome(extensionInfo)) {
		return;
	}

	setTimeout(() => {
		createWelcomeDialog();
	}, 1000);
}
