/**
 * 通用工具函数
 */

// 生成随机百分比
export const getRandomPercentage = () => (Math.random() * 100).toFixed(2);

// 随机整数
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 数字转图片HTML
export function numberToImages(number, basePath) {
	const path = basePath || "extension/十周年UI/ui/assets/character/shousha/num/";
	const str = number.toString();
	let html = "";

	for (const char of str) {
		const src = char === "." ? `${lib.assetURL}${path}point.png` : `${lib.assetURL}${path}${char}.png`;
		html += `<img src="${src}" alt="${char}" style="--w:25px;--h:calc(var(--w)*52/38);width:var(--w);height:var(--h);margin-right:-9px;">`;
	}

	html += `<img src="${lib.assetURL}${path}personui_percentage.png" alt="%" style="--w:27px;--h:calc(var(--w)*51/41);width:var(--w);height:var(--h);margin-left:1px;">`;
	return html;
}

// 创建星级显示
export function createStars(container, rarity) {
	const starMap = { legend: 5, epic: 4, rare: 3, junk: 2 };
	const num = starMap[rarity] || 3;

	for (let i = 0; i < num; i++) {
		ui.create.div(".item", container);
	}
	for (let i = 0; i < 5 - num; i++) {
		ui.create.div(".item.huixing", container);
	}
}

// 创建露头面板
export function createLeftPane(parent, charName) {
	const skin = lib.config["extension_十周年UI_outcropSkin"];
	const classMap = { shizhounian: ".left3", shousha: ".left2" };
	const cls = classMap[skin] || ".left";

	const pane = ui.create.div(cls, parent);
	pane.setBackground(charName, "character");
	return pane;
}

// 计算胜率
export function calculateWinRate() {
	const record = lib.config.gameRecord?.[lib.config.mode];
	if (record && lib.config.mode !== "guozhan" && !_status.connectMode) {
		const wins = record.str.match(/(\d+)胜/g)?.map(w => parseInt(w)) || [0];
		const losses = record.str.match(/(\d+)负/g)?.map(l => parseInt(l)) || [0];
		const totalWins = wins.reduce((a, b) => a + b, 0);
		const totalLosses = losses.reduce((a, b) => a + b, 0);
		const total = totalWins + totalLosses;
		return total > 0 ? (totalWins / total) * 100 : 0;
	}
	return Math.random() * 100;
}

// 创建武将按钮
export function createCharButton(name, leftPane) {
	if (!name || !lib.character[name]) return;
	ui.create.button(name, "character", leftPane.firstChild, true);
}

// 生成玩家随机数据
export function generateRandomData(player) {
	const guanjieLevel = randomInt(1, 11);
	return {
		winRate: get.SL ? get.SL(player) * 100 + "%" : randomInt(50, 95) + "%",
		guanjieLevel,
		lucky: randomInt(1, 10000),
		popularity: randomInt(1, 10000),
		escapeRate: randomInt(0, 10),
		rankLevel: randomInt(1, 6),
		level: randomInt(100, 200),
		gailevel: randomInt(20, 80),
		vipLevel: Math.min(guanjieLevel + 1, 10),
		mvpCount: randomInt(20, 60),
	};
}

// 获取势力背景图片路径
export function getGroupBackgroundImage(group, skinPath) {
	const path = skinPath || "extension/十周年UI/ui/assets/character/shousha/character/";
	const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "devil", "daqin", "western", "shen", "key", "Han", "qin"];

	if (!group || group === "unknown") {
		return `${path}name2_unknown.png`;
	}
	if (!validGroups.includes(group)) {
		group = "default";
	}
	return `${path}name2_${group}.png`;
}

// 播放音效
export function playAudio(path) {
	game.playAudio(path);
}

// 按钮点击效果
export function addClickEffect(element) {
	element.style.transition = "opacity 0.5s";
	const downEvent = lib.config.touchscreen ? "touchstart" : "mousedown";
	const upEvent = lib.config.touchscreen ? "touchend" : "mouseup";

	element.addEventListener(downEvent, () => {
		element.style.transform = "scale(0.95)";
	});
	element.addEventListener(upEvent, () => {
		element.style.transform = "";
	});
	element.onmouseout = () => {
		element.style.transform = "";
	};
}

// 隐藏弹窗
export function hideDialog(dialog, prop, value, delay = 1000) {
	if (!dialog?.show) return;
	dialog.style[prop] = value;
	setTimeout(() => {
		dialog.hide();
		dialog.show = false;
	}, delay);
}

// 工具集合（兼容旧代码）
export const Utils = {
	getRandomPercentage,
	numberToImages,
	createStars,
	createLeftPane,
	calculateWinRate,
	createCharButton,
	generateRandomData,
	getGroupBackgroundImage,
};
