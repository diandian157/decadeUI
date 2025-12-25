/**
 * 聊天系统模块
 */
import { addClickEffect, hideDialog } from "../utils.js";

const MAX_CHAT_RECORDS = 50;
const DIALOG_HIDE_DELAY = 1000;
const DIALOG_ANIMATION_DELAY = 100;

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

// 创建基础弹窗
export function createDialogBase(config) {
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
	lib.setScroll(bgColor);
	parent.appendChild(bgColor);

	return { bgPict, bgColor };
}

// 隐藏其他弹窗
export function hideOtherDialogs(excludeDialog, dialogConfigs) {
	dialogConfigs.forEach(({ name, prop, value, delay }) => {
		if (name !== excludeDialog && window[name]) {
			hideDialog(window[name], prop, value, delay || DIALOG_HIDE_DELAY);
		}
	});
}

// 处理音频路径
export function processAudioPath(path) {
	const target = "ext:";
	const isMatch = path.startsWith(target);
	const actualPath = isMatch ? `../extension/${path.slice(target.length)}` : path;
	const parts = actualPath.split("/");
	const filename = parts.pop().split(".")[0];
	const directory = parts.pop();
	return { directory, filename };
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
