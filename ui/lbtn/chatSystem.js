/**
 * 聊天系统模块
 * 合并了chat.js和chatSystem.js的功能
 */

// ==================== 常量 ====================
const MAX_CHAT_RECORDS = 50;
const DIALOG_HIDE_DELAY = 1000;
const DIALOG_LIFESAY_HIDE_DELAY = 100;
const DIALOG_ANIMATION_DELAY = 100;
const XUWU_COUNT = 10;
const XUWU_DELAY = 100;

// 投掷物品配置
export const THROW_ITEMS = [
	{ name: "meijiu", left: "-155px", bottom: "150px", image: "meijiu", label: "酒杯", emotionType: "wine" },
	{ name: "xianhua", left: "-230px", bottom: "150px", image: "xianhua", label: "鲜花", emotionType: "flower" },
	{ name: "tuoxie", left: "-155px", bottom: "82px", image: "tuoxie", label: "拖鞋", emotionType: "shoe" },
	{ name: "jidan", left: "-230px", bottom: "82px", image: "jidan", label: "鸡蛋", emotionType: "egg" },
	{ name: "cailan", left: "-80px", bottom: "150px", image: "cailan", label: "荷花", emotionType: "flower" },
	{ name: "qicai", left: "-155px", bottom: "13px", image: "qicai", label: "烟花", emotionType: "flower" },
	{ name: "xiaojiu", left: "-230px", bottom: "13px", image: "xiaojiu", label: "灯笼", emotionType: "wine" },
	{ name: "xueqiu", left: "-80px", bottom: "82px", image: "xueqiu", label: "雪球", emotionType: "wine" },
];

const THROW_ITEM_NAMES = ["jidan", "tuoxie", "xianhua", "meijiu", "cailan", "qicai", "xiaojiu", "xueqiu", "xuwu"];

// ==================== 工具函数 ====================

// 获取当前玩家
export function getCurrentPlayer() {
	if (game.me) return game.me;
	if (game.connectPlayers) {
		return game.online ? game.connectPlayers.find(p => p.playerid === game.onlineID) : game.connectPlayers[0];
	}
	return null;
}

// 发送聊天消息
export function sendChatMessage(message) {
	const player = getCurrentPlayer();
	if (!player) return;

	// 处理 /playAudio 命令
	// 格式: /playAudio <path> <text>
	// 例如: /playAudio skill/dcsb_juemou2 「绝谋」武侯遗志...
	if (message.startsWith("/playAudio ")) {
		const firstSpaceIndex = message.indexOf(" ", 11);
		if (firstSpaceIndex !== -1) {
			const audioPath = message.slice(11, firstSpaceIndex);
			const displayText = message.slice(firstSpaceIndex + 1);

			// 播放音频
			if (typeof game.playAudio === "function") {
				game.playAudio(audioPath);
			}

			// 显示文本（如果有）
			if (displayText) {
				if (game.online) {
					game.send("chat", game.onlineID, displayText);
				} else {
					player.chat(displayText);
				}
			}
			return;
		} else {
			// 只有路径没有文本
			const audioPath = message.slice(11);
			if (audioPath && typeof game.playAudio === "function") {
				game.playAudio(audioPath);
			}
			return;
		}
	}

	if (game.online) {
		game.send("chat", game.onlineID, message);
	} else {
		player.chat(message);
	}
}

// 投掷表情
export function throwEmotion(target, emotionType) {
	if (game.online) {
		game.send("throwEmotion", target, emotionType);
	} else {
		game.me.throwEmotion(target, emotionType);
	}
	if (window.shuliang) {
		window.shuliang.innerText = parseInt(window.shuliang.innerText) - 1;
	}
}

// 隐藏弹窗
export function hideDialog(dialog, styleProp, styleValue, delay = DIALOG_HIDE_DELAY) {
	if (!dialog?.show) return;
	dialog.style[styleProp] = styleValue;
	setTimeout(() => {
		dialog.hide();
		dialog.show = false;
	}, delay);
}

// 隐藏其他弹窗
export function hideOtherDialogs(excludeDialog, dialogConfigs) {
	dialogConfigs.forEach(({ name, prop, value, delay }) => {
		if (name !== excludeDialog && window[name]) {
			hideDialog(window[name], prop, value, delay || DIALOG_HIDE_DELAY);
		}
	});
}

// 创建基础弹窗
export function createDialogBase(name, config) {
	const dialog = ui.create.div("hidden");
	dialog.classList.add("popped", "static");
	dialog.show = true;
	Object.assign(dialog.style, config.styles);
	if (config.backgroundImage) dialog.setBackgroundImage(config.backgroundImage);
	if (config.zIndex) dialog.style.zIndex = config.zIndex;
	if (config.boxShadow !== undefined) dialog.style.boxShadow = config.boxShadow;
	if (config.animation) {
		setTimeout(() => Object.assign(dialog.style, config.animation), DIALOG_ANIMATION_DELAY);
	}
	ui.window.appendChild(dialog);
	return dialog;
}

// 创建弹窗背景
export function createDialogBackground(parent, config) {
	const bgPict = ui.create.div("hidden");
	Object.assign(bgPict.style, config.pictStyles);
	bgPict.setBackgroundImage(config.pictImage);
	if (config.pictBoxShadow !== undefined) bgPict.style.boxShadow = config.pictBoxShadow;
	parent.appendChild(bgPict);

	const bgColor = ui.create.div("hidden");
	Object.assign(bgColor.style, config.colorStyles);
	bgColor.setBackgroundImage(config.colorImage);
	if (typeof lib !== "undefined") lib.setScroll(bgColor);
	parent.appendChild(bgColor);

	return { bgPict, bgColor };
}

// 按钮点击效果
export function addClickEffect(div) {
	div.style.transition = "opacity 0.5s";
	const isTouchscreen = typeof lib !== "undefined" ? lib.config.touchscreen : "ontouchstart" in window;
	const eventType = isTouchscreen ? "touchstart" : "mousedown";
	const endEventType = isTouchscreen ? "touchend" : "mouseup";
	div.addEventListener(eventType, () => (div.style.transform = "scale(0.95)"));
	div.addEventListener(endEventType, () => (div.style.transform = ""));
	div.onmouseout = () => (div.style.transform = "");
}

// 处理音频路径
export function processAudioPath(path) {
	const target = "ext:";
	const isMatch = path.startsWith(target);
	const actualPath = isMatch ? `../extension/${path.slice(target.length)}` : path;

	// 去掉扩展名，保留完整的相对路径
	const pathWithoutExt = actualPath.replace(/\.[^/.]+$/, "");

	// 返回完整路径（用于 game.playAudio）
	return { fullPath: pathWithoutExt };
}

// 创建语音项
export function createVoiceItem(container, index, content, audioPath, onClick) {
	const item = ui.create.div("hidden", "", onClick);
	item.style.cssText = "height:10%;width:100%;left:0%;top:0%;position:relative;";
	item.pos = index;
	item.content = content;
	if (audioPath) item.audioPath = audioPath;
	item.innerHTML = `<font color=white>${content}</font>`;
	container.appendChild(item);
	addClickEffect(item);
	return item;
}

// 初始化聊天记录
export function initChatRecord() {
	if (!window.chatRecord) window.chatRecord = [];
}

// 添加聊天记录
export function addChatWord(str) {
	initChatRecord();
	if (window.chatRecord.length > MAX_CHAT_RECORDS) {
		window.chatRecord.shift();
	}
	if (str) {
		window.chatRecord.push(str);
	}
	const html = window.chatRecord.map(r => `<br>${r}<br>`).join("");
	if (window.chatBackground2) {
		window.chatBackground2.innerHTML = html;
	}
}

// 关闭语音弹窗
export function closeLifesayDialog() {
	if (window.dialog_lifesay) {
		window.dialog_lifesay.delete();
		window.dialog_lifesay = undefined;
	}
}

// 关闭表情弹窗
export function closeEmojiDialog() {
	if (window.dialog_emoji) {
		window.dialog_emoji.delete();
		window.dialog_emoji = undefined;
	}
}

// ==================== 聊天系统初始化 ====================

/**
 * 初始化聊天系统
 * 注册game上的聊天相关方法
 */
export function initChatSystem(lib, game, ui, get) {
	const assetPath = "extension/十周年UI/ui/assets/";
	const chatAssetPath = `${assetPath}chat/`;

	initChatRecord();

	const EMOTION_SIZE = lib.config.extension_星之梦_emotionsize || 50;

	// 添加聊天记录
	game.addChatWord = str => {
		if (window.chatRecord.length > MAX_CHAT_RECORDS) window.chatRecord.shift();
		if (str) window.chatRecord.push(str);
		if (window.chatBackground2) game.updateChatWord(window.chatRecord.map(r => `<br>${r}<br>`).join(""));
	};

	game.updateChatWord = str => {
		if (window.chatBackground2) window.chatBackground2.innerHTML = str;
	};

	// 显示聊天界面
	game.showChatWordBackgroundX = () => {
		if (window.chatBg?.show) {
			window.chatBg.hide();
			THROW_ITEM_NAMES.forEach(item => {
				if (window[item]?.thrownn) window[item].thrownn = false;
			});
			window.chatBg.show = false;

			const dialogConfigs = [
				{ name: "dialog_lifesay", prop: "left", value: `-${window.dialog_lifesay?.style.width}`, delay: DIALOG_LIFESAY_HIDE_DELAY },
				{ name: "dialog_emoji", prop: "top", value: "100%", delay: DIALOG_HIDE_DELAY },
				{ name: "chatBackground", prop: "left", value: "100%", delay: DIALOG_HIDE_DELAY },
				{ name: "dialog_emotion", prop: "bottom", value: "100%", delay: DIALOG_HIDE_DELAY },
			];
			dialogConfigs.forEach(({ name, prop, value, delay }) => hideDialog(window[name], prop, value, delay));
			return;
		}

		window.chatBg = ui.create.div("hidden");
		window.chatBg.classList.add("popped", "static");
		window.chatBg.show = true;
		window.chatBg.style.cssText = "display:block;--w:450px;--h:calc(var(--w)*300/900);width:var(--w);height:var(--h);position:fixed;left:30%;bottom:10%;opacity:1;background-size:100% 100%;background-color:transparent;z-index:99;transition:all 0.5s;";
		window.chatBg.setBackgroundImage(`${chatAssetPath}chat.png`);
		ui.window.appendChild(window.chatBg);

		// 互动框
		window.hudongkuang = ui.create.div("hidden");
		window.hudongkuang.style.cssText = "display:block;--w:315px;--h:calc(var(--w)*135/142);width:var(--w);height:var(--h);left:-280px;bottom:-55px;transition:none;background-size:100% 100%;pointer-events:none;";
		window.hudongkuang.setBackgroundImage(`${chatAssetPath}hudong.png`);
		window.chatBg.appendChild(window.hudongkuang);

		// 语音按钮
		game.open_lifesay = () => {
			hideOtherDialogs("dialog_lifesay", [
				{ name: "dialog_emoji", prop: "top", value: "100%" },
				{ name: "chatBackground", prop: "left", value: "100%" },
				{ name: "dialog_emotion", prop: "bottom", value: "100%" },
			]);

			if (window.dialog_lifesay?.show) {
				window.dialog_lifesay.hide();
				window.dialog_lifesay.show = false;
				return;
			}

			window.dialog_lifesay = createDialogBase("dialog_lifesay", {
				styles: { height: "300px", width: "600px", left: "-600px", top: "calc(20% - 100px)", transition: "all 1s", opacity: "1", borderRadius: "8px", backgroundSize: "100% 100%" },
				backgroundImage: `${chatAssetPath}saydiv.png`,
				zIndex: 999999999,
				boxShadow: "none",
				animation: { left: "calc(50% - 300px)" },
			});

			const { bgColor } = createDialogBackground(window.dialog_lifesay, {
				pictStyles: { height: "100%", width: "100%", left: "0%", top: "0%", borderRadius: "8px", backgroundSize: "100% 100%" },
				pictImage: `${chatAssetPath}saydiv.png`,
				pictBoxShadow: "none",
				colorStyles: { height: "70%", width: "80%", left: "10%", top: "10%", borderRadius: "8px", overflowY: "scroll" },
				colorImage: `${chatAssetPath}saydiv.png`,
			});

			let skills = game.me?.getSkills?.(null, false, false).filter(s => !get.info(s)?.charlotte) || [];
			let skillsx = [...skills];
			skills.forEach(skill => {
				const info = get.info(skill);
				if (info?.derivation) {
					skillsx.push(...(Array.isArray(info.derivation) ? info.derivation : [info.derivation]));
				}
			});
			skillsx = [...new Set(skillsx)];

			let skillIndex = 0;
			skillsx.forEach(name => {
				if (!get.info(name)) return;
				const skillAudioData = get.Audio.skill({ skill: name, player: game.me.name });
				const { textList, fileList: audioList } = skillAudioData;
				textList.forEach((text, i) => {
					const displayContent = `「${get.skillTranslation(name)}」${text.replace(/~/g, " ")}`;
					const pureText = text.replace(/~/g, " "); // 纯台词，不带技能名
					const item = createVoiceItem(bgColor, skillIndex++, displayContent, audioList[i], function () {
						const { fullPath } = processAudioPath(this.audioPath);
						sendChatMessage(`/playAudio ${fullPath} ${this.pureText}`);
						closeLifesayDialog();
					});
					item.pureText = pureText;
				});
			});

			if (game.me?.name) {
				const dieAudioData = get.Audio.die({ player: game.me.name });
				const { textList: dieTextList, fileList: dieAudioList } = dieAudioData;
				dieTextList.forEach((text, i) => {
					const displayContent = `「阵亡」${text.replace(/~/g, " ")}`;
					const pureText = text.replace(/~/g, " ");
					const item = createVoiceItem(bgColor, skillIndex++, displayContent, dieAudioList[i], function () {
						const { fullPath } = processAudioPath(this.audioPath);
						sendChatMessage(`/playAudio ${fullPath} ${this.pureText}`);
						closeLifesayDialog();
					});
					item.pureText = pureText;
				});
			}

			lib.quickVoice?.forEach((voice, i) => {
				createVoiceItem(bgColor, skillIndex + i, voice, null, function () {
					sendChatMessage(this.content);
					closeLifesayDialog();
				});
			});
		};

		window.chatButton1 = ui.create.div("hidden", "", game.open_lifesay);
		window.chatButton1.style.cssText = "display:block;--w:75px;--h:calc(var(--w)*82/98);width:var(--w);height:var(--h);left:30px;bottom:15px;transition:none;background-size:100% 100%";
		window.chatButton1.setBackgroundImage(`${chatAssetPath}lifesay.png`);
		lib.setScroll(window.chatButton1);
		window.chatBg.appendChild(window.chatButton1);
		addClickEffect(window.chatButton1);

		// 创建投掷物品
		THROW_ITEMS.forEach(item => createThrowItemElement(item, chatAssetPath));

		// 鸡蛋风暴
		createXuwuElement(chatAssetPath);

		// 菜篮子
		createCailanziElement(chatAssetPath);

		// 表情按钮
		createEmojiButton(chatAssetPath, EMOTION_SIZE);

		// 记录按钮
		window.chatButton3 = ui.create.div("hidden", "", game.showChatWord);
		window.chatButton3.style.cssText = "display:block;--w:75px;--h:calc(var(--w)*82/98);width:var(--w);height:var(--h);left:210px;bottom:15px;transition:none;background-size:100% 100%";
		window.chatButton3.setBackgroundImage(`${chatAssetPath}jilu.png`);
		lib.setScroll(window.chatButton3);
		window.chatBg.appendChild(window.chatButton3);
		addClickEffect(window.chatButton3);

		// 发送按钮
		createSendButton(chatAssetPath);

		game.addChatWord();

		// 输入框
		createInputArea(chatAssetPath);
	};

	// 显示聊天记录
	game.showChatWord = () => {
		hideOtherDialogs("chatBackground", [
			{ name: "dialog_lifesay", prop: "left", value: `-${window.dialog_lifesay?.style.width}` },
			{ name: "dialog_emoji", prop: "top", value: "100%" },
			{ name: "dialog_emotion", prop: "bottom", value: "100%" },
		]);

		if (window.chatBackground?.show) {
			window.chatBackground.hide();
			window.chatBackground.show = false;
			return;
		}

		window.chatBackground = ui.create.div("hidden");
		window.chatBackground.classList.add("static");
		window.chatBackground.show = true;
		window.chatBackground.style.cssText = `transition:all 1s;height:330px;width:600px;top:calc(20% - 100px);left:100%;bottom:calc(${window.chatBg?.style.height || "0"} + 5px);opacity:1;border-radius:10px;background-size:100% 100%;`;
		window.chatBackground.setBackgroundImage(`${chatAssetPath}saydiv.png`);
		window.chatBackground.style.zIndex = 999999999;
		window.chatBackground.style.boxShadow = "none";
		setTimeout(() => (window.chatBackground.style.left = "calc(50% - 300px)"), DIALOG_ANIMATION_DELAY);

		game.mouseChatDiv = div => {
			if (lib.device === undefined) {
				div.onmouseover = function () {
					this.style.opacity = "1.0";
				};
				div.onmouseout = function () {
					this.style.opacity = "0.25";
				};
			} else {
				div.onclick = function () {
					this.style.opacity = this.style.opacity === "0.25" ? "0.75" : "0.25";
				};
			}
		};
		game.mouseChatDiv(window.chatBackground);
		ui.window.appendChild(window.chatBackground);

		const { bgColor } = createDialogBackground(window.chatBackground, {
			pictStyles: { height: "100%", width: "100%", left: "0%", bottom: "0%", transition: "none", borderRadius: "8px", backgroundSize: "100% 100%" },
			pictImage: `${chatAssetPath}saydiv.png`,
			pictBoxShadow: "none",
			colorStyles: { height: "70%", width: "80%", left: "10%", top: "10%", transition: "none", borderRadius: "8px", backgroundSize: "100% 100%" },
			colorImage: `${chatAssetPath}saydiv.png`,
		});

		window.chatBackground2 = ui.create.div("hidden");
		window.chatBackground2.style.cssText = "height:100%;width:100%;left:0%;bottom:0%;transition:none;text-align:left;overflow-y:scroll;";
		window.chatBackground2.innerHTML = "";
		lib.setScroll(window.chatBackground2);
		bgColor.appendChild(window.chatBackground2);
		game.addChatWord();
	};

	// 聊天记录技能
	lib.skill._wmkzSayChange = {
		trigger: { global: ["gameStart", "phaseBegin", "phaseAfter", "useCardAfter"] },
		forced: true,
		silent: true,
		filter: (event, player) => player.change_sayFunction !== true,
		content() {
			player.change_sayFunction = true;
			player.sayTextWord = player.say;
			player.say = str => {
				game.broadcastAll(
					(player, str) => {
						if (typeof game.addChatWord !== "function") {
							if (!window.chatRecord) window.chatRecord = [];
							game.addChatWord = strx => {
								if (window.chatRecord.length > MAX_CHAT_RECORDS) window.chatRecord.shift();
								if (strx) window.chatRecord.push(strx);
								if (window.chatBackground2) window.chatBackground2.innerHTML = window.chatRecord.map(r => `<br>${r}<br>`).join("");
							};
						}
						const processedStr = str.replace(/##assetURL##/g, lib.assetURL);
						const playerName = get.slimNameHorizontal(String(player.name));
						const displayName = player.nickname ? `${playerName}[${player.nickname}]` : playerName;
						game.addChatWord(`<font color=green>${displayName}</font><font color=white>：${processedStr}</font>`);
					},
					player,
					str
				);
				player.sayTextWord(str);
			};
		},
	};
}

// ==================== 内部辅助函数 ====================

// 创建投掷物品元素
function createThrowItemElement(config, chatAssetPath) {
	const { name, left, bottom, image, label, emotionType } = config;

	game[`open_${name}`] = () => {
		game.players.forEach(player => {
			player.onclick = function () {
				if (window[name].thrownn) throwEmotion(this, emotionType);
			};
		});
	};

	window[name] = ui.create.div("hidden", "", game[`open_${name}`]);
	window[name].style.cssText = `display:block;--w:63px;--h:calc(var(--w)*50/50);width:var(--w);height:var(--h);left:${left};bottom:${bottom};transition:none;background-size:100% 100%`;
	window[name].setBackgroundImage(`${chatAssetPath}${image}.png`);

	const labelDiv = document.createElement("div");
	labelDiv.textContent = label;
	labelDiv.style.cssText = "position:absolute;bottom:1px;left:0;right:0;text-align:center;color:rgba(255,220,0,0.7);font-size:12px;font-family:shousha;";
	window[name].appendChild(labelDiv);
	window[name].onclick = () => (window[name].thrownn = true);
	window.chatBg.appendChild(window[name]);
	if (typeof lib !== "undefined") lib.setScroll(window[name]);
	addClickEffect(window[name]);
}

// 创建鸡蛋风暴元素
function createXuwuElement(chatAssetPath) {
	game.open_xuwu = () => {
		game.players.forEach(player => {
			player.onclick = function () {
				if (window.xuwu.thrownn) {
					for (let i = 0; i < XUWU_COUNT; i++) {
						setTimeout(() => throwEmotion(this, i <= 8 ? "egg" : "shoe"), XUWU_DELAY * i);
					}
				}
			};
		});
	};

	window.xuwu = ui.create.div("hidden", "", game.open_xuwu);
	window.xuwu.style.cssText = "display:block;--w:63px;--h:calc(var(--w)*50/50);width:var(--w);height:var(--h);left:-80px;bottom:13px;transition:none;background-size:100% 100%";
	window.xuwu.setBackgroundImage(`${chatAssetPath}xuwu.png`);
	const xuwuLabel = document.createElement("div");
	xuwuLabel.textContent = "鸡蛋风暴";
	xuwuLabel.style.cssText = "position:absolute;bottom:1px;left:0;right:0;text-align:center;color:rgba(255,220,0,0.7);font-size:12px;font-family:shousha;";
	window.xuwu.appendChild(xuwuLabel);
	window.xuwu.onclick = () => (window.xuwu.thrownn = true);
	window.chatBg.appendChild(window.xuwu);
	if (typeof lib !== "undefined") lib.setScroll(window.xuwu);
	addClickEffect(window.xuwu);
}

// 创建菜篮子元素
function createCailanziElement(chatAssetPath) {
	window.cailanzi = ui.create.div("hidden");
	window.cailanzi.style.cssText = "display:block;--w:100px;--h:calc(var(--w)*59/150);width:var(--w);height:var(--h);left:-230px;bottom:225px;transition:none;background-size:100% 100%";
	window.cailanzi.setBackgroundImage(`${chatAssetPath}cailanzi.png`);
	window.chatBg.appendChild(window.cailanzi);

	window.shuliang = ui.create.node("div");
	window.shuliang.innerText = Math.floor(Math.random() * (999 - 100 + 1) + 100);
	window.shuliang.style.cssText = "display:block;left:-180px;bottom:235px;font-family:shousha;color:#97856a;font-weight:900;text-shadow:none;transition:none;background-size:100% 100%";
	window.chatBg.appendChild(window.shuliang);
}

// 创建表情按钮
function createEmojiButton(chatAssetPath, EMOTION_SIZE) {
	game.open_emoji = () => {
		hideOtherDialogs("dialog_emoji", [
			{ name: "dialog_lifesay", prop: "left", value: `-${window.dialog_lifesay?.style.width}` },
			{ name: "chatBackground", prop: "left", value: "100%" },
			{ name: "dialog_emotion", prop: "bottom", value: "100%" },
		]);

		if (window.dialog_emoji?.show) {
			window.dialog_emoji.hide();
			window.dialog_emoji.show = false;
			return;
		}

		window.dialog_emoji = createDialogBase("dialog_emoji", {
			styles: { height: "330px", width: "600px", left: "calc(50% - 300px)", top: "100%", transition: "all 1s", opacity: "1", borderRadius: "8px", backgroundSize: "100% 100%" },
			backgroundImage: `${chatAssetPath}saydiv.png`,
			zIndex: 999999999,
			boxShadow: "none",
			animation: { top: "calc(25% - 125px)" },
		});

		const { bgColor } = createDialogBackground(window.dialog_emoji, {
			pictStyles: { height: "100%", width: "100%", left: "0%", top: "0%", borderRadius: "8px", backgroundSize: "100% 100%" },
			pictImage: `${chatAssetPath}saydiv.png`,
			pictBoxShadow: "none",
			colorStyles: { height: "70%", width: "80%", left: "10%", top: "10%", borderRadius: "8px", overflowY: "scroll" },
			colorImage: `${chatAssetPath}saydiv.png`,
		});

		let emotionIndex = 0;
		const emotionList = typeof lib !== "undefined" ? lib.emotionList : {};
		const assetURL = typeof lib !== "undefined" ? lib.assetURL : "";

		Object.keys(emotionList || {}).forEach(pack => {
			const packDiv = ui.create.div("hidden", "", function () {
				Object.keys(emotionList || {}).forEach(p => {
					if (window[`dialog_emojiPack_${p}`]) window[`dialog_emojiPack_${p}`].style.display = "none";
				});
				for (let i = 0; i < emotionIndex; i++) {
					const content = window[`dialog_emojiContent_${i}`];
					if (content) content.style.display = content.packName === this.packName ? "" : "none";
				}
			});
			packDiv.style.cssText = "height:70px;width:70px;margin:0 5px 5px 0;display:inline-block;left:15px;top:0px;position:relative;background-size:100% 100%;";
			packDiv.packName = pack;
			packDiv.setBackgroundImage(`image/emotion/${pack}/1.gif`);
			window[`dialog_emojiPack_${pack}`] = packDiv;
			bgColor.appendChild(packDiv);
			addClickEffect(packDiv);
		});

		Object.keys(emotionList || {}).forEach(pack => {
			const count = emotionList[pack];
			for (let i = 1; i <= count; i++) {
				const emotionDiv = ui.create.div("hidden", "", function () {
					Object.keys(emotionList || {}).forEach(p => {
						if (window[`dialog_emojiPack_${p}`]) window[`dialog_emojiPack_${p}`].style.display = "";
					});
					for (let j = 0; j < emotionIndex; j++) {
						if (window[`dialog_emojiContent_${j}`]) window[`dialog_emojiContent_${j}`].style.display = "none";
					}
					const str = `<img src="${assetURL}image/emotion/${this.packName}/${this.emotionNum}.gif" width="${parseInt(EMOTION_SIZE)}" height="${parseInt(EMOTION_SIZE)}">`;
					sendChatMessage(str);
					closeEmojiDialog();
				});
				emotionDiv.style.cssText = "height:70px;width:70px;margin:0 5px 5px 0;display:inline-block;left:15px;top:0px;position:relative;background-size:100% 100%;display:none;";
				emotionDiv.packName = pack;
				emotionDiv.emotionNum = i;
				emotionDiv.setBackgroundImage(`image/emotion/${pack}/${i}.gif`);
				window[`dialog_emojiContent_${emotionIndex}`] = emotionDiv;
				bgColor.appendChild(emotionDiv);
				addClickEffect(emotionDiv);
				emotionIndex++;
			}
		});
	};

	window.chatButton2 = ui.create.div("hidden", "", game.open_emoji);
	window.chatButton2.style.cssText = "display:block;--w:75px;--h:calc(var(--w)*82/98);width:var(--w);height:var(--h);left:120px;bottom:15px;transition:none;background-size:100% 100%";
	window.chatButton2.setBackgroundImage(`${chatAssetPath}emoji.png`);
	if (typeof lib !== "undefined") lib.setScroll(window.chatButton2);
	window.chatBg.appendChild(window.chatButton2);
	addClickEffect(window.chatButton2);
}

// 创建发送按钮
function createSendButton(chatAssetPath) {
	window.sendInfo = content => {
		sendChatMessage(content);
		if (window.input) window.input.value = "";
	};

	window.chatSendBottom = ui.create.div("", "", () => {
		if (!window.input?.value) return;
		window.sendInfo(window.input.value);
	});
	window.chatSendBottom.style.cssText = "display:block;--w:100px;--h:calc(var(--w)*62/160);width:var(--w);height:var(--h);left:72%;top:16%;transition:none;background-size:100% 100%;text-align:center;border-radius:8px;";
	window.chatSendBottom.setBackgroundImage(`${chatAssetPath}buttonsend.png`);
	window.chatSendBottom.innerHTML = '<span style="color:#e6e6e6;font-size:23px;line-height:38px;font-weight:400;font-family:shousha">发送</span>';
	window.chatBg.appendChild(window.chatSendBottom);
	addClickEffect(window.chatSendBottom);
}

// 创建输入区域
function createInputArea(chatAssetPath) {
	const assetURL = typeof lib !== "undefined" ? lib.assetURL : "";

	window.chatInputOut = ui.create.div("hidden");
	window.chatInputOut.style.cssText = "display:block;--w:275px;--h:calc(var(--w)*50/320);width:var(--w);height:var(--h);left:8%;top:14%;transition:none;background-size:100% 100%;pointer-events:none;z-index:6;";
	window.chatInputOut.style.backgroundImage = `url('${assetURL}${chatAssetPath}sayX.png')`;
	window.chatBg.appendChild(window.chatInputOut);

	window.chatInput = ui.create.dialog("hidden");
	window.chatInput.style.cssText = "height:24px;width:44%;left:24.2%;top:31px;transition:none;";
	window.chatBg.appendChild(window.chatInput);

	window.ipt = ui.create.div();
	window.ipt.style.cssText = "height:24px;width:100%;top:0px;left:0px;margin:0px;border-radius:0px;background-image:linear-gradient(rgba(0,0,0,0.2),rgba(0,0,0,0.4));";
	if (window.input?.value) window.input_value = window.input.value;
	window.ipt.innerHTML = `<input type="text" value="${window.input_value || "请输入文字"}" style="color:white;font-family:shousha;width:calc(100% - 10px);text-align:left;"></input>`;
	window.input = window.ipt.querySelector("input");
	window.input.style.backgroundImage = `url('${assetURL}${chatAssetPath}say.png')`;
	window.input.style.backgroundSize = "120% 120%";
	window.input.style.boxShadow = "none";
	window.input.onclick = e => e.stopPropagation();
	window.input.onfocus = function () {
		if (this.value === "请输入文字") this.value = "";
	};
	window.input.onkeydown = e => {
		e.stopPropagation();
		if (e.keyCode === 13 || e.key === "Enter") {
			const value = String(e.target.value ?? "");
			if (value) window.sendInfo(value);
		}
	};
	window.chatInput.add(window.ipt);
}
