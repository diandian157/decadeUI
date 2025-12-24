/**
 * UI组件模块
 * 提供滑动条、聊天框等通用UI组件
 */

// ==================== 滑动条组件 ====================

/**
 * 创建滑动条组件
 * @param {number} min - 最小值，默认0
 * @param {number} max - 最大值，默认100
 * @param {number} value - 初始值，默认中间值
 */
export function createSlider(min = 0, max = 100, value) {
	const slider = document.createElement("input");
	slider.className = "slider";
	slider.type = "range";
	slider.min = min;
	slider.max = max;

	// 更新滑动条背景进度
	const updateProgress = () => {
		const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
		slider.style.backgroundSize = `${percent}% 100%`;
	};

	// 重写value属性，确保设置值时同步更新进度条样式
	const originalValue = Object.getOwnPropertyDescriptor(slider.__proto__, "value");
	Object.defineProperty(slider, "value", {
		configurable: true,
		get: () => originalValue.get.call(slider),
		set: val => {
			originalValue.set.call(slider, val);
			updateProgress();
		},
	});

	slider.addEventListener("input", updateProgress);
	slider.value = value ?? (max - min) * 0.5;

	return slider;
}

// ==================== 聊天框组件 ====================

/**
 * 创建聊天框组件
 * @param {object} decadeUI - decadeUI实例
 */
export function createChatBox(decadeUI) {
	const { dialog } = decadeUI;

	// 初始化DOM结构
	const box = dialog.create("chat-box folded");
	box.container = dialog.create("container", box);
	box.operation = dialog.create("operation", box);
	box.content = dialog.create("content", box.container);

	const operation = box.operation;
	operation.fold = dialog.create("fold-button", operation, "button");
	operation.input = dialog.create("chat-input", operation, "input");
	operation.sticker = dialog.create("sticker-button", operation, "button");
	operation.send = dialog.create("send-button", operation, "button");

	operation.fold.innerHTML = "…";
	operation.sticker.innerHTML = "表情";
	operation.send.innerHTML = "发送";

	const input = operation.input;

	// 添加聊天记录
	box.addEntry = info => {
		const text = dialog.create("chat-text", box.content);
		text.innerHTML = `<span class="sender">${info[0]}</span>:<span class="text">${info[1]}</span>`;
		box.overrideEntry?.(info);
		box.content.scrollTop = box.content.scrollHeight;
	};
	box.addEntry._origin = box;

	// 获取当前玩家
	const getCurrentPlayer = () => {
		if (game.me) return game.me;
		if (!game.connectPlayers) return null;
		if (game.online) {
			return game.connectPlayers.find(p => p.playerid === game.onlineID) || null;
		}
		return game.connectPlayers[0];
	};

	// 发送消息
	box.sendInputText = () => {
		const str = input.value;
		if (!str) return;

		const player = getCurrentPlayer();
		if (!player) return;

		if (game.online) {
			game.send("chat", game.onlineID, str);
		} else {
			lib.element.player.chat.call(player, str);
		}

		input.value = "";
		_status.chatValue = "";
	};

	// 折叠/展开按钮
	operation.fold.addEventListener("click", () => {
		const isFolded = box.classList.toggle("folded");
		operation.fold.innerHTML = isFolded ? "…" : "<<";
	});

	// 发送按钮
	operation.send.addEventListener("click", () => {
		box.sendInputText();
		input.focus();
	});

	// 输入框事件
	input.addEventListener("change", () => {
		_status.chatValue = input.value;
	});

	input.addEventListener("keydown", e => {
		if (e.keyCode === 13) box.sendInputText();
		e.stopPropagation();
	});

	return box;
}

// ==================== 初始化入口 ====================

/**
 * 初始化组件模块，挂载到decadeUI
 * @param {object} decadeUI - decadeUI实例
 */
export function initComponent(decadeUI) {
	decadeUI.component = {
		slider: createSlider,
		chatBox: () => createChatBox(decadeUI),
	};
}
