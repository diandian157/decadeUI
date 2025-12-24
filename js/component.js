"use strict";

decadeModule.import(function (lib, game, ui, get, ai, _status) {
	decadeUI.component = {
		/**
		 * 创建滑动条组件
		 * @param {number} min - 最小值，默认0
		 * @param {number} max - 最大值，默认100
		 * @param {number} value - 初始值，默认中间值
		 */
		slider(min, max, value) {
			const slider = document.createElement("input");
			slider.className = "slider";
			slider.type = "range";
			slider.min = min ?? 0;
			slider.max = max ?? 100;

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
			slider.value = value ?? (slider.max - slider.min) * 0.5;

			return slider;
		},

		/**
		 * 创建聊天框组件
		 */
		chatBox() {
			// 初始化DOM结构
			const box = decadeUI.dialog.create("chat-box folded");
			box.container = decadeUI.dialog.create("container", box);
			box.operation = decadeUI.dialog.create("operation", box);
			box.content = decadeUI.dialog.create("content", box.container);

			const operation = box.operation;
			operation.fold = decadeUI.dialog.create("fold-button", operation, "button");
			operation.input = decadeUI.dialog.create("chat-input", operation, "input");
			operation.sticker = decadeUI.dialog.create("sticker-button", operation, "button");
			operation.send = decadeUI.dialog.create("send-button", operation, "button");

			operation.fold.innerHTML = "…";
			operation.sticker.innerHTML = "表情";
			operation.send.innerHTML = "发送";

			const input = operation.input;

			// 添加聊天记录
			box.addEntry = info => {
				const text = decadeUI.dialog.create("chat-text", box.content);
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
		},
	};
});
