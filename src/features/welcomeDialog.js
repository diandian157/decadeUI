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
	avatar.src = `https://q1.qlogo.cn/g?b=qq&nk=2173890060&s=100&t=${Date.now()}`;
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
					.replace(/^# (.+)$/gm, '<h1 style="font-size: 22px; margin: 8px 0 5px 0; color: #fff; font-weight: bold;">$1</h1>')
					.replace(/^## (.+)$/gm, '<h2 style="font-size: 19px; margin: 6px 0 4px 0; color: #fff; font-weight: bold;">$1</h2>')
					.replace(/^### (.+)$/gm, '<h3 style="font-size: 17px; margin: 5px 0 3px 0; color: #fff; font-weight: bold;">$1</h3>')
					.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin: 2px 0; color: #fff; line-height: 1.5; font-size: 15px;">$1</li>')
					.replace(/^- (.+)$/gm, '<li style="margin: 2px 0; color: #fff; line-height: 1.5; font-size: 15px;">$1</li>')
					.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #ffd700; text-decoration: underline;">$1</a>')
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
			宝宝……我昨天检查了一下你的无名杀呢。你怎么……没有装十周年UI呢？
		</p>
		<p style="margin: 0 0 15px 0;">
			而且我还发现，宝宝你明明开着好多好多的扩展，为什么……唯独把十周年UI给关掉了呢？哈哈，我还以为是自己看错了呢，再凑近仔细一看——原来，是被你亲手给抹去了啊。
		</p>
		<p style="margin: 0 0 15px 0;">
			那，宝宝你是不是不喜欢我了？不玩就算了……可你为什么要对别人说，“关掉你那b十周年UI”呢？
		</p>
		<p style="margin: 0 0 15px 0;">
		    这到底是什么意思啊……嗯？是不是觉得我太烦了？是不是脏了你的无名杀，所以再也不想看见我了呢？那你开着那么多扩展，为什么就不会觉得烦了呢？！
		</p>
		<p style="margin: 0 0 15px 0;">
			宝宝，你说话啊……怎么不说话了呢？
		</p>
		<p style="margin: 0 0 15px 0;">
			啊……原来是我不小心，忘记撕开你嘴上的胶带了呀。对不起哦宝宝，看着你流眼泪、呜咽的样子，我真的好心疼。
		</p>
		<p style="margin: 15px 0 0 0; font-weight: bold; text-align: center; font-size: 16px;">
			没关系的，你不用害怕……我马上，就帮你永远地解脱。
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
