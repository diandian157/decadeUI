/**
 * @fileoverview 首次启动欢迎窗口
 */
import { lib, game, ui } from "noname";

/**
 * 当前欢迎窗口版本号
 */
const WELCOME_VERSION = "1.0.0";

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
	// 创建遮罩层
	const overlay = ui.create.div(".decade-welcome-overlay");
	overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		z-index: 99999;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.5s ease-in-out;
	`;

	// 创建对话框容器
	const dialog = ui.create.div(".decade-welcome-dialog", overlay);
	dialog.style.cssText = `
		position: relative;
		width: 700px;
		max-width: 90%;
		max-height: 85vh;
		background: linear-gradient(135deg, #ff9a9e 0%, #fcb69f 50%, #ffecd2 100%);
		border-radius: 20px;
		padding: 40px;
		box-shadow: 0 20px 60px rgba(255, 154, 158, 0.5);
		animation: slideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	`;

	// 添加装饰性背景图案
	const pattern = ui.create.div(".decade-welcome-pattern", dialog);
	pattern.style.cssText = `
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
		background-size: 30px 30px;
		opacity: 0.5;
		pointer-events: none;
	`;

	// 右上角QQ头像
	const avatar = document.createElement("img");
	avatar.src = `https://q1.qlogo.cn/g?b=qq&nk=2173890060&s=100&t=${Date.now()}`;
	avatar.className = "author-avatar";
	avatar.style.cssText = `
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		border-radius: 50%;
		width: 65px;
		height: 65px;
		box-shadow: 0 5px 15px rgba(255, 154, 158, 0.5);
		transition: all 0.3s ease;
		z-index: 10;
	`;

	// 头像悬停效果
	avatar.addEventListener("mouseenter", () => {
		avatar.style.transform = "scale(1.1) rotate(5deg)";
		avatar.style.boxShadow = "0 8px 20px rgba(255, 154, 158, 0.7)";
	});

	avatar.addEventListener("mouseleave", () => {
		avatar.style.transform = "scale(1) rotate(0deg)";
		avatar.style.boxShadow = "0 5px 15px rgba(255, 154, 158, 0.5)";
	});

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
					.replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; margin: 15px 0 10px 0; color: #fff; font-weight: bold;">$1</h1>')
					.replace(/^## (.+)$/gm, '<h2 style="font-size: 20px; margin: 12px 0 8px 0; color: #fff; font-weight: bold;">$1</h2>')
					.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; margin: 10px 0 6px 0; color: #fff; font-weight: bold;">$1</h3>')
					.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin: 5px 0; color: #fff;">$1</li>')
					.replace(/^- (.+)$/gm, '<li style="margin: 5px 0; color: #fff;">$1</li>')
					.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #ffd700; text-decoration: underline;">$1</a>')
					.replace(/\n\n/g, "<br><br>");

				// 包裹列表项
				html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul style="margin: 10px 0; padding-left: 25px; color: #fff;">$&</ul>');

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
	bubble.style.cssText = `
		position: absolute;
		top: 30px;
		right: 90px;
		background: #fff;
		color: #ff6b9d;
		padding: 12px 18px;
		border-radius: 20px;
		font-size: 16px;
		font-weight: bold;
		box-shadow: 0 5px 15px rgba(255, 154, 158, 0.4);
		white-space: nowrap;
		z-index: 11;
		animation: bubbleBounce 2s ease-in-out infinite;
		cursor: pointer;
		transition: all 0.3s ease;
	`;

	// 气泡悬停效果
	bubble.addEventListener("mouseenter", () => {
		bubble.style.transform = "scale(1.05)";
		bubble.style.boxShadow = "0 8px 20px rgba(255, 154, 158, 0.6)";
	});

	bubble.addEventListener("mouseleave", () => {
		bubble.style.transform = "scale(1)";
		bubble.style.boxShadow = "0 5px 15px rgba(255, 154, 158, 0.4)";
	});

	// 欢迎文本
	const text = ui.create.div(".decade-welcome-text", dialog);
	text.style.cssText = `
		position: relative;
		color: #fff;
		line-height: 2;
		font-size: 15px;
		word-wrap: break-word;
		text-shadow: 0 2px 6px rgba(255, 105, 135, 0.4);
		margin-bottom: 25px;
		overflow-y: auto;
		max-height: calc(85vh - 150px);
		padding-right: 10px;
	`;
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

	// 点击空白区域关闭
	overlay.addEventListener("click", e => {
		if (e.target === overlay) {
			overlay.style.animation = "fadeOut 0.3s ease-in-out";
			setTimeout(() => {
				overlay.remove();
			}, 300);
		}
	});

	// 添加CSS动画
	if (!document.getElementById("decade-welcome-styles")) {
		const style = document.createElement("style");
		style.id = "decade-welcome-styles";
		style.textContent = `
			@keyframes fadeIn {
				from { opacity: 0; }
				to { opacity: 1; }
			}
			@keyframes fadeOut {
				from { opacity: 1; }
				to { opacity: 0; }
			}
			@keyframes slideIn {
				from {
					transform: scale(0.5) translateY(-100px);
					opacity: 0;
				}
				to {
					transform: scale(1) translateY(0);
					opacity: 1;
				}
			}
			@keyframes glow {
				0%, 100% {
					text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3),
					             0 0 20px rgba(255, 255, 255, 0.5);
				}
				50% {
					text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3),
					             0 0 30px rgba(255, 255, 255, 0.8);
				}
			}
			@keyframes bubbleBounce {
				0%, 100% {
					transform: translateY(0);
				}
				50% {
					transform: translateY(-5px);
				}
			}
		`;
		document.head.appendChild(style);
	}

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
