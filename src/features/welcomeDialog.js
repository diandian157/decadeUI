/**
 * @fileoverview 首次启动欢迎窗口
 */
import { lib, game, ui } from "noname";

/**
 * 当前欢迎窗口版本号
 */
const WELCOME_VERSION = "1.0.0";

// 加载CSS样式
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
 * @returns {boolean}
 */
function shouldShowWelcome() {
	const storageKey = "extension_十周年UI_welcomeVersion";
	const lastVersion = lib.config[storageKey];

	// 如果从未显示过，或者版本号不同，则显示
	if (!lastVersion || lastVersion !== WELCOME_VERSION) {
		// 保存当前版本号
		game.saveConfig(storageKey, WELCOME_VERSION);
		return true;
	}

	return false;
}

/**
 * 创建二次元风格的欢迎窗口
 */
function createWelcomeDialog() {
	// 确保样式已加载
	loadStyles();

	// 创建遮罩层
	const overlay = ui.create.div(".decade-welcome-overlay");

	// 创建对话框容器
	const dialog = ui.create.div(".decade-welcome-dialog", overlay);

	// 添加装饰性背景图案
	ui.create.div(".decade-welcome-pattern", dialog);

	// 右上角QQ头像
	const avatar = document.createElement("img");
	avatar.src = `https://q1.qlogo.cn/g?b=qq&nk=2173890060&s=100&t=${Date.now()}`;
	avatar.className = "author-avatar";

	// 点击头像加载更新日志
	let isShowingUpdate = false; // 标记当前是否显示更新日志
	let defaultContent = ""; // 保存默认内容

	avatar.addEventListener("click", async () => {
		if (isShowingUpdate) {
			// 返回前言
			text.innerHTML = defaultContent;
			bubble.innerHTML = "点我查看更新内容";
			isShowingUpdate = false;
			text.scrollTop = 0;
		} else {
			// 加载更新日志
			try {
				const response = await fetch(`${decadeUIPath}docs/update.md`);
				const markdown = await response.text();

				// 简单的Markdown转HTML（处理基本格式）
				let html = markdown
					.replace(/^# (.+)$/gm, '<h1 style="font-size: 22px; margin: 8px 0 5px 0; color: #fff; font-weight: bold;">$1</h1>')
					.replace(/^## (.+)$/gm, '<h2 style="font-size: 19px; margin: 6px 0 4px 0; color: #fff; font-weight: bold;">$1</h2>')
					.replace(/^### (.+)$/gm, '<h3 style="font-size: 17px; margin: 5px 0 3px 0; color: #fff; font-weight: bold;">$1</h3>')
					.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin: 2px 0; color: #fff; line-height: 1.5; font-size: 15px;">$1</li>')
					.replace(/^- (.+)$/gm, '<li style="margin: 2px 0; color: #fff; line-height: 1.5; font-size: 15px;">$1</li>')
					.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #ffd700; text-decoration: underline;">$1</a>')
					.replace(/\n\n/g, "<br>");

				// 包裹列表项
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

	// 说话气泡
	const bubble = ui.create.div(".decade-welcome-bubble", dialog);
	bubble.innerHTML = "点我查看更新内容";

	// 欢迎文本
	const text = ui.create.div(".decade-welcome-text", dialog);
	text.innerHTML = `
		<p style="margin: 0 0 15px 0;">
			这条信息，只有二次元の朋友们才能看见哟(°°)。
		</p>
		<p style="margin: 0 0 15px 0;">
			诶多诶多，希望收到这条信息的由纪，在新的一年里，能像二次元里的大家一样，天☆天☆开☆心☆喵~(=^▽^=) kira(∗＞∀❛ั❛)✧*，瓦达西，对……大家sukisukidaisuki！(≧ω≦)/。
		</p>
		<p style="margin: 0 0 15px 0;">
			还有，2026年，一定要和二次元の米娜桑继续在一起哟，不可以变成坏！现！充！（ᗜ ˰ ᗜ）啊嘞？已经不喜欢二次元了吗（失望的眼神）……诶多，呆胶布的( • ˍ • * * *•• *•• * )。
		</p>
		<p style="margin: 0 0 15px 0;">
			希望由纪能带着二次元の米娜桑的祝福魔法「magic」，在三次元の世界里，当一个加把劲骑士「knight」。还有，要当好现充，和二次元的大家和睦相处哟（坏现充是要被「魔法少女」teriteri掉的！）。
		</p>
		<p style="margin: 15px 0 0 0; font-weight: bold; text-align: center; font-size: 16px;">
			好啦，米娜桑！(*^ω^*)新的一年，从美妙的邂逅开始♬
		</p>
	`;

	defaultContent = text.innerHTML;

	// 关闭按钮
	const closeButton = ui.create.div(".decade-welcome-close-button", dialog);
	closeButton.innerHTML = "开始游玩";
	closeButton.addEventListener("click", () => {
		overlay.style.animation = "fadeOut 0.3s ease-in-out";
		setTimeout(() => {
			overlay.remove();
		}, 300);
	});

	document.body.appendChild(overlay);
}

/**
 * 设置启动欢迎功能
 */
export function setupWelcomeDialog() {
	if (!shouldShowWelcome()) {
		return;
	}

	setTimeout(() => {
		createWelcomeDialog();
	}, 1000);
}
