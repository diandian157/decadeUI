/**
 * @fileoverview 独立配置窗口UI
 */
import { lib, game, ui } from "noname";
import { config } from "./index.js";

let currentOverlay = null;

// 加载CSS样式
function loadStyles() {
	if (document.getElementById("decade-config-window-styles")) return;

	const link = document.createElement("link");
	link.id = "decade-config-window-styles";
	link.rel = "stylesheet";
	link.href = `${lib.assetURL}extension/十周年UI/src/config/config-window.css`;
	document.head.appendChild(link);
}

function createConfigWindow() {
	if (currentOverlay) return;

	// 确保样式已加载
	loadStyles();

	// 遮罩层
	const overlay = ui.create.div(".decade-config-overlay");

	// 渐变背景对话框
	const dialog = ui.create.div(".decade-config-dialog", overlay);

	// 装饰图案
	const pattern = ui.create.div(".decade-config-pattern", dialog);

	// 标题
	const title = ui.create.div(".decade-config-title", dialog);
	title.innerHTML = "十周年UI配置中心";

	// 右上角QQ头像
	const avatar = document.createElement("img");
	avatar.src = `https://q1.qlogo.cn/g?b=qq&nk=2173890060&s=100&t=${Date.now()}`;
	avatar.className = "decade-config-avatar";

	avatar.onclick = () => {
		overlay.remove();
		currentOverlay = null;
	};

	dialog.appendChild(avatar);

	// 左侧标签栏
	const sidebar = ui.create.div(".decade-config-sidebar", dialog);

	// 右侧内容区
	const content = ui.create.div(".decade-config-content", dialog);

	// 标签数据
	const tabs = [
		{ id: "appearance", name: "整体外观" },
		{ id: "card", name: "卡牌相关" },
		{ id: "component", name: "部件管理" },
		{ id: "misc", name: "其他设置" },
	];

	let currentTab = "appearance";

	// 创建标签按钮
	tabs.forEach(tab => {
		const btn = ui.create.div(".decade-config-tab", sidebar);
		btn.innerHTML = tab.name;
		if (tab.id === currentTab) {
			btn.classList.add("active");
		}

		btn.onclick = () => {
			if (currentTab === tab.id) return;
			currentTab = tab.id;

			// 更新标签状态
			Array.from(sidebar.children).forEach(child => {
				child.classList.remove("active");
			});
			btn.classList.add("active");

			loadConfigs(content, currentTab);
		};
	});

	// 加载初始配置
	loadConfigs(content, currentTab);

	// 点击遮罩层关闭对话框
	overlay.addEventListener("click", e => {
		if (e.target === overlay) {
			overlay.remove();
			currentOverlay = null;
		}
	});

	document.body.appendChild(overlay);
	currentOverlay = overlay;
}

function loadConfigs(container, tabId) {
	container.innerHTML = "";
	container.scrollTop = 0;
	const configs = getConfigsByTab(tabId);

	configs.forEach(configItem => {
		if (configItem.isTitle) {
			const titleEl = ui.create.div(".decade-config-section-title", container);
			titleEl.innerHTML = configItem.name;
			return;
		}

		// 配置项创建
		const configKey = `extension_十周年UI_${configItem.key}`;
		const configDef = config[configItem.key];
		if (!configDef) return;

		const item = ui.create.div(".decade-config-item", container);

		const table = document.createElement("table");
		table.className = "decade-config-table";

		const tr = document.createElement("tr");
		const tdName = document.createElement("td");
		tdName.className = "decade-config-name";
		tdName.innerHTML = configItem.name;

		// 介绍文字
		let introDiv = null;
		if (configDef.intro) {
			introDiv = document.createElement("div");
			introDiv.className = "decade-config-intro";
			introDiv.innerHTML = configDef.intro;

			// 点击名称切换介绍显示
			tdName.onclick = function (e) {
				e.stopPropagation();
				introDiv.classList.toggle("show");
			};
		}

		const tdControl = document.createElement("td");
		tdControl.className = "decade-config-control";

		// 根据类型创建控件
		if (configItem.type === "toggle") {
			const currentValue = lib.config[configKey];
			const initValue = currentValue !== undefined ? currentValue : configDef.init;

			const toggle = document.createElement("div");
			toggle.className = `decade-config-toggle ${initValue ? "on" : "off"}`;

			const slider = document.createElement("div");
			slider.className = "decade-config-toggle-slider";
			toggle.appendChild(slider);

			toggle.onclick = function () {
				const newValue = !lib.config[configKey];
				game.saveConfig(configKey, newValue);

				// 更新样式
				toggle.className = `decade-config-toggle ${newValue ? "on" : "off"}`;

				// 调用回调
				if (configDef.onclick) {
					configDef.onclick(newValue);
				} else if (configDef.update) {
					configDef.update();
				}
			};

			tdControl.appendChild(toggle);
		} else if (configItem.type === "select") {
			// 将对象转换为数组格式 [[key, value], ...]
			const listArray = Object.keys(configDef.item).map(key => [key, configDef.item[key]]);
			const currentValue = lib.config[configKey] ?? configDef.init;
			const select = ui.create.selectlist(listArray, currentValue);

			select.className = "decade-config-select";

			// 处理 HTML 内容
			Array.from(select.options).forEach(option => {
				const optionValue = option.value;
				const originalText = configDef.item[optionValue];
				if (typeof originalText === "string" && originalText.includes("<")) {
					const temp = document.createElement("div");
					temp.innerHTML = originalText;
					const textContent = temp.textContent || temp.innerText;

					if (!textContent.trim()) {
						option.textContent = optionValue;
					} else {
						option.textContent = textContent;
					}
				}
			});

			select.onchange = function () {
				const newValue = this.value;

				if (configDef.onclick) {
					configDef.onclick(newValue);
				} else {
					game.saveConfig(configKey, newValue);

					if (configDef.update) {
						configDef.update();
					}
				}
			};
			tdControl.appendChild(select);
		} else if (configItem.type === "input") {
			const input = document.createElement("input");
			input.type = "text";
			input.className = "decade-config-input";
			input.value = lib.config[configKey] ?? configDef.init;

			input.addEventListener("blur", function () {
				const newValue = this.value.trim();

				if (newValue) {
					if (configDef.onblur) {
						configDef.onblur.call(this);
					} else {
						game.saveConfig(configKey, newValue);
					}

					if (configDef.update) {
						configDef.update();
					}
				}
			});

			input.addEventListener("keydown", function (e) {
				if (e.key === "Enter") {
					this.blur();
				}
			});

			tdControl.appendChild(input);
		}

		tr.appendChild(tdName);
		tr.appendChild(tdControl);
		table.appendChild(tr);

		// 如果有介绍，添加到 table 下方
		if (introDiv) {
			const trIntro = document.createElement("tr");
			const tdIntro = document.createElement("td");
			tdIntro.colSpan = 2;
			tdIntro.appendChild(introDiv);
			trIntro.appendChild(tdIntro);
			table.appendChild(trIntro);
		}

		item.appendChild(table);
	});
}

function getConfigsByTab(tabId) {
	const configMap = {
		appearance: [
			{ isTitle: true, name: "样式设置" },
			{ key: "newDecadeStyle", name: "切换样式", type: "select" },
			{ key: "outcropSkin", name: "露头样式", type: "select" },
			{ key: "borderLevel", name: "等阶边框", type: "select" },
			{ isTitle: true, name: "功能开关" },
			{ key: "aloneEquip", name: "单独装备栏", type: "toggle" },
			{ key: "meanPrettify", name: "菜单美化", type: "toggle" },
			{ key: "dynamicSkin", name: "动态皮肤", type: "toggle" },
			{ key: "dynamicSkinOutcrop", name: "动皮露头", type: "toggle" },
			{ key: "killEffect", name: "击杀特效", type: "toggle" },
		],
		card: [
			{ isTitle: true, name: "卡牌效果" },
			{ key: "cardGhostEffect", name: "幻影出牌", type: "toggle" },
			{ key: "autoSelect", name: "自动选择", type: "toggle" },
			{ key: "cardPrompt", name: "出牌信息提示", type: "toggle" },
			{ isTitle: true, name: "卡牌样式" },
			{ key: "cardPrettify", name: "卡牌美化", type: "select" },
			{ key: "cardkmh", name: "卡牌边框", type: "select" },
			{ key: "chupaizhishi", name: "出牌指示", type: "select" },
			{ isTitle: true, name: "尺寸调整" },
			{ key: "cardScale", name: "手牌大小", type: "input" },
			{ key: "discardScale", name: "弃牌堆卡牌大小", type: "input" },
			{ key: "handTipHeight", name: "出牌信息提示高度", type: "input" },
			{ key: "handFoldMin", name: "手牌折叠", type: "input" },
		],
		component: [
			{ isTitle: true, name: "进度条设置" },
			{ key: "jindutiaoYangshi", name: "进度条样式", type: "select" },
			{ key: "jindutiaoST", name: "进度条速度", type: "select" },
			{ key: "jindutiaoSet", name: "进度条高度", type: "input" },
			{ isTitle: true, name: "界面元素" },
			{ key: "JDTSYangshi", name: "阶段提示", type: "select" },
			{ key: "GTBBYangshi", name: "狗托播报", type: "select" },
			{ key: "GTBBFont", name: "播报字体", type: "select" },
			{ key: "GTBBTime", name: "时间间隔", type: "select" },
			{ key: "playerMarkStyle", name: "标记样式", type: "select" },
			{ key: "loadingStyle", name: "光标+loading框", type: "select" },
			{ key: "gainSkillsVisible", name: "获得技能显示", type: "select" },
		],
		misc: [
			{ isTitle: true, name: "音效与视觉" },
			{ key: "bettersound", name: "更多音效", type: "toggle" },
			{ key: "skillDieAudio", name: "中二模式", type: "toggle" },
			{ key: "wujiangbeijing", name: "武将背景", type: "toggle" },
			{ key: "shiliyouhua", name: "官方势力", type: "toggle" },
			{ isTitle: true, name: "游戏功能" },
			{ key: "enableRecastInteraction", name: "重铸交互", type: "toggle" },
			{ key: "mx_decade_characterDialog", name: "自由选将筛选框", type: "select" },
			{ key: "rightLayout", name: "左右布局", type: "select" },
			{ key: "eruda", name: "调试助手", type: "toggle" },
		],
	};

	return configMap[tabId] || [];
}

export function showDecadeConfigWindow() {
	createConfigWindow();
}

export function hideDecadeConfigWindow() {
	if (currentOverlay) {
		currentOverlay.remove();
		currentOverlay = null;
	}
}
