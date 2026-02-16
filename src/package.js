/**
 * @fileoverview 扩展包信息定义
 */

import "./features/didYouKnow.js";

/**
 * 生成扩展包信息
 * @param {Object} otherInfo - info.json中的其他信息
 * @returns {Object}
 */
export const mainpackage = otherInfo => {
	const pkg = {
		character: { character: {}, translate: {} },
		card: { card: {}, translate: {}, list: [] },
		skill: { skill: {}, translate: {} },
	};

	const pack = { ...pkg, ...otherInfo };

	const githubUrl = "https://github.com/diandian157/decadeUI";
	const copyHandler = `navigator.clipboard.writeText('${githubUrl}').then(() => alert('已成功复制，粘贴到浏览器打开，部分进不去需要翻墙')).catch(() => alert('复制失败，请手动复制'))`;

	pack.intro = `<a href="javascript:void(0)" onclick="${copyHandler}" style="color: #FFFACD;">点击复制仓库地址</a>`;

	// 点击头像播放音效并打开欢迎welcomeDialog窗口
	if (!window.decadeUIWelcome) {
		window.decadeUIWelcome = {
			show: () => {
				// 播放音效
				new Audio("extension/十周年UI/audio/Ciallo.mp3").play();
				// 打开欢迎窗口
				import("./features/welcomeDialog.js").then(module => {
					module.createWelcomeDialog();
				});
			},
		};
	}

	Object.defineProperty(pack, "author", {
		get() {
			return `<img src="https://q1.qlogo.cn/g?b=qq&nk=2173890060&s=100&t=${Date.now()}" class="author-avatar" onclick="window.decadeUIWelcome.show()" style="cursor:pointer;border-radius:50%;width:50px;height:50px;vertical-align:bottom">点点<br>${window.decadeUIDidYouKnow.getHTML()}`;
		},
	});

	return pack;
};
