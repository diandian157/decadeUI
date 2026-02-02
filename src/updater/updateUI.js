/**
 * 更新UI组件
 * @description 负责显示更新对话框、进度条等UI元素
 */

import { ui, game } from "noname";

export class UpdateUI {
	constructor(config) {
		this.config = config;
		this.progressDialog = null;
	}

	/**
	 * 显示更新确认对话框
	 * @param {Object} updateInfo - 更新信息
	 * @returns {Promise<boolean>} 用户是否确认更新
	 */
	async showUpdateDialog(updateInfo) {
		return new Promise(resolve => {
			const { currentVersion, remoteVersion, changelog, publishDate, minCompatibility } = updateInfo;

			// 创建对话框
			const dialog = ui.create.div(".popup-container", ui.window);
			dialog.style.cssText = `
				position: fixed;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.7);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10000;
			`;

			const content = ui.create.div(dialog);
			content.style.cssText = `
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				border-radius: 12px;
				padding: 30px;
				max-width: 500px;
				width: 90%;
				box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
				color: white;
			`;

			// 标题
			const title = ui.create.div(content);
			title.innerHTML = "🎉 发现新版本";
			title.style.cssText = `
				font-size: 24px;
				font-weight: bold;
				margin-bottom: 20px;
				text-align: center;
			`;

			// 版本信息
			const versionInfo = ui.create.div(content);
			versionInfo.innerHTML = `
				<div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
					<div style="margin-bottom: 8px;">
						<span style="opacity: 0.8;">当前版本：</span>
						<span style="font-weight: bold;">${currentVersion}</span>
					</div>
					<div style="margin-bottom: 8px;">
						<span style="opacity: 0.8;">最新版本：</span>
						<span style="font-weight: bold; color: #4ade80;">${remoteVersion}</span>
					</div>
					<div style="margin-bottom: 8px;">
						<span style="opacity: 0.8;">发布日期：</span>
						<span>${publishDate}</span>
					</div>
					${
						minCompatibility
							? `
						<div>
							<span style="opacity: 0.8;">最低适配：</span>
							<span>无名杀 ${minCompatibility}</span>
						</div>
					`
							: ""
					}
				</div>
			`;

			// 更新日志
			if (changelog) {
				const changelogBox = ui.create.div(content);
				changelogBox.style.cssText = `
					background: rgba(255,255,255,0.1);
					padding: 15px;
					border-radius: 8px;
					margin-bottom: 20px;
					max-height: 200px;
					overflow-y: auto;
				`;

				const changelogTitle = ui.create.div(changelogBox);
				changelogTitle.innerHTML = "📝 更新内容";
				changelogTitle.style.cssText = `
					font-weight: bold;
					margin-bottom: 10px;
					font-size: 16px;
				`;

				const changelogContent = ui.create.div(changelogBox);
				changelogContent.innerHTML = this.formatChangelog(changelog);
				changelogContent.style.cssText = `
					line-height: 1.6;
					opacity: 0.9;
				`;
			}

			// 按钮容器
			const buttonContainer = ui.create.div(content);
			buttonContainer.style.cssText = `
				display: flex;
				gap: 15px;
				justify-content: center;
			`;

			// 取消按钮
			const cancelBtn = ui.create.div(buttonContainer);
			cancelBtn.innerHTML = "稍后更新";
			cancelBtn.style.cssText = `
				padding: 12px 30px;
				background: rgba(255,255,255,0.2);
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.3s;
			`;
			cancelBtn.onmouseover = () => {
				cancelBtn.style.background = "rgba(255,255,255,0.3)";
			};
			cancelBtn.onmouseout = () => {
				cancelBtn.style.background = "rgba(255,255,255,0.2)";
			};
			cancelBtn.onclick = () => {
				dialog.remove();
				resolve(false);
			};

			// 确认按钮
			const confirmBtn = ui.create.div(buttonContainer);
			confirmBtn.innerHTML = "立即更新";
			confirmBtn.style.cssText = `
				padding: 12px 30px;
				background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
				border-radius: 6px;
				cursor: pointer;
				font-weight: bold;
				transition: all 0.3s;
			`;
			confirmBtn.onmouseover = () => {
				confirmBtn.style.transform = "translateY(-2px)";
				confirmBtn.style.boxShadow = "0 5px 15px rgba(74, 222, 128, 0.4)";
			};
			confirmBtn.onmouseout = () => {
				confirmBtn.style.transform = "translateY(0)";
				confirmBtn.style.boxShadow = "none";
			};
			confirmBtn.onclick = () => {
				dialog.remove();
				resolve(true);
			};
		});
	}

	/**
	 * 创建进度对话框
	 * @param {string} title - 标题
	 * @returns {Object} 进度对话框对象
	 */
	createProgress(title = "正在更新...") {
		if (this.progressDialog) {
			this.progressDialog.remove();
		}

		const dialog = ui.create.div(".popup-container", ui.window);
		dialog.style.cssText = `
			position: fixed;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			border-radius: 12px;
			padding: 30px;
			min-width: 350px;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
			z-index: 10001;
			color: white;
		`;

		// 标题
		const titleEl = ui.create.div(dialog);
		titleEl.innerHTML = title;
		titleEl.style.cssText = `
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 20px;
			text-align: center;
		`;

		// 文件名
		const filenameEl = ui.create.div(dialog);
		filenameEl.style.cssText = `
			font-size: 14px;
			margin-bottom: 15px;
			text-align: center;
			opacity: 0.9;
			min-height: 20px;
		`;

		// 进度条容器
		const progressContainer = ui.create.div(dialog);
		progressContainer.style.cssText = `
			background: rgba(255,255,255,0.2);
			border-radius: 10px;
			height: 20px;
			overflow: hidden;
			margin-bottom: 10px;
		`;

		// 进度条
		const progressBar = ui.create.div(progressContainer);
		progressBar.style.cssText = `
			background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
			height: 100%;
			width: 0%;
			transition: width 0.3s;
			border-radius: 10px;
		`;

		// 进度文本
		const progressText = ui.create.div(dialog);
		progressText.innerHTML = "0 / 0";
		progressText.style.cssText = `
			text-align: center;
			font-size: 14px;
			opacity: 0.8;
		`;

		this.progressDialog = {
			dialog,
			titleEl,
			filenameEl,
			progressBar,
			progressText,
			remove: () => dialog.remove(),
			setTitle: text => {
				titleEl.innerHTML = text;
			},
			setFilename: text => {
				filenameEl.innerHTML = text;
			},
			setProgress: (current, total) => {
				const percent = total > 0 ? (current / total) * 100 : 0;
				progressBar.style.width = `${percent}%`;
				progressText.innerHTML = `${current} / ${total}`;
			},
		};

		return this.progressDialog;
	}

	/**
	 * 更新进度
	 */
	updateProgress(current, total, filename) {
		if (!this.progressDialog) {
			this.createProgress();
		}

		this.progressDialog.setProgress(current, total);
		if (filename) {
			this.progressDialog.setFilename(filename);
		}
	}

	/**
	 * 隐藏进度对话框
	 */
	hideProgress() {
		if (this.progressDialog) {
			this.progressDialog.remove();
			this.progressDialog = null;
		}
	}

	/**
	 * 格式化更新日志
	 */
	formatChangelog(changelog) {
		if (!changelog) return "";

		// 简单的Markdown转HTML
		return changelog
			.split("\n")
			.map(line => {
				line = line.trim();
				if (!line) return "<br>";

				// 标题
				if (line.startsWith("###")) {
					return `<div style="font-weight: bold; margin-top: 10px;">${line.replace(/^###\s*/, "")}</div>`;
				}
				if (line.startsWith("##")) {
					return `<div style="font-weight: bold; font-size: 16px; margin-top: 12px;">${line.replace(/^##\s*/, "")}</div>`;
				}

				// 列表
				if (line.startsWith("- ") || line.startsWith("* ")) {
					return `<div style="margin-left: 15px;">• ${line.substring(2)}</div>`;
				}

				// 普通文本
				return `<div>${line}</div>`;
			})
			.join("");
	}
}
