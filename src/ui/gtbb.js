/**
 * @fileoverview 滚动播报模块 (GTBB - 购托播报)，显示模拟的抽卡/开箱播报信息
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {string[]} 故事/活动名称列表 */
const STORIES = ["周年", "五一", "踏青", "牛年", "开黑", "冬至", "春分", "鼠年", "盛典", "魏魂", "群魂", "蜀魂", "吴魂", "猪年", "圣诞", "国庆", "狗年", "金秋", "奇珍", "元旦", "小雪", "冬日", "招募", "梦之回廊", "虎年", "新春", "七夕", "大雪", "端午", "武将", "中秋", "庆典"];

/** @type {string[]} 盒子类型列表 */
const BOX_TYPES = ["盒子", "宝盒", "礼包", "福袋", "礼盒", "庆典", "盛典"];

/** @type {string[]} 动作词列表 */
const ACTIONS = ["通过", "使用", "开启"];

/** @type {string[]} 尾部消息列表 */
const TAIL_MSGS = [",大家快恭喜TA吧！", ",大家快恭喜TA吧。无名杀是一款非盈利游戏(づ ●─● )づ", ",祝你新的一年天天开心，万事如意"];

/**
 * 获取已启用的武将包列表
 * @returns {string[]} 武将包名称数组
 */
function getEnabledPacks() {
	const packs = [...lib.config.characters];
	for (const packName of Object.keys(lib.characterPack)) {
		if (!packName.startsWith("mode_extension_")) continue;
		const extName = packName.slice(15);
		if (lib.config[`extension_${extName}_characters_enable`] === true) {
			packs.push(packName);
		}
	}
	return packs;
}

/**
 * 遍历武将并应用映射函数
 * @param {Function} mapFn - 映射函数
 * @returns {Array} 映射结果数组
 */
function mapCharacters(mapFn) {
	const results = [];
	for (const packName of getEnabledPacks()) {
		const pack = lib.characterPack[packName];
		if (!pack) continue;
		for (const [charName, info] of Object.entries(pack)) {
			if (info.isUnseen || lib.filter.characterDisabled(charName)) continue;
			const result = mapFn(charName);
			if (result) results.push(result);
		}
	}
	return results;
}

/**
 * 获取武将显示名称
 * @param {string} charName - 武将名称
 * @returns {string|null} 显示名称
 */
function getDisplayName(charName) {
	const name = get.slimName(charName);
	return name && name !== charName ? name : null;
}

/**
 * 获取武将称号
 * @param {string} charName - 武将名称
 * @returns {string} 武将称号
 */
function getCharacterTitle(charName) {
	let title = lib.characterTitle[charName] || "";
	if (title.startsWith("#")) title = title.slice(2);
	return get.plainText(title);
}

/**
 * 创建跑马灯HTML内容
 * @param {object} config - 配置对象
 * @param {string} config.GTBBFont - 字体配置
 * @returns {string} HTML字符串
 */
function createMarqueeHTML(config) {
	const nickname = lib.config.connect_nickname;
	const randomNames = mapCharacters(getDisplayName);
	const skins = mapCharacters(name => {
		const displayName = getDisplayName(name);
		return displayName ? `${displayName}×1` : null;
	});
	const generals = mapCharacters(name => {
		const displayName = getDisplayName(name);
		if (!displayName) return null;
		const title = getCharacterTitle(name);
		return title ? `${title}·${displayName}*1（动+静）` : `${displayName}*1（动+静）`;
	});

	const name = [randomNames.randomGet(), nickname].randomGet();
	const skin = skins.randomGet();
	const general = generals.randomGet();
	const reward = [`<font color="#56e4fa">${skin}</font>`, `<font color="#f3c20f">${general}</font>`].randomGet();

	const useCustomFont = config.GTBBFont !== "off";
	const fontset = useCustomFont ? "FZLBJW" : "yuanli";
	const colorA = useCustomFont ? "#efe8dc" : "#86CC5B";
	const colorB = useCustomFont ? "#22c622" : "#B3E1EC";

	return `
		<marquee direction="left" behavior="scroll" scrollamount="9.8" loop="1" width="100%" height="50" align="absmiddle">
			<font face="${fontset}">
				玩家
				<font color="${colorA}"><b>${name}</b></font>
				${ACTIONS.randomGet()}
				<font color="${colorB}"><b>${STORIES.randomGet()}${BOX_TYPES.randomGet()}</b></font>
				获得了<b>${reward}</b>${TAIL_MSGS.randomGet()}
			</font>
		</marquee>
	`;
}

/**
 * 应用样式到播报元素
 * @param {HTMLElement} div - 外层容器
 * @param {HTMLElement} div2 - 内层容器
 * @param {boolean} isStyleOn - 是否启用样式
 * @returns {void}
 */
function applyStyles(div, div2, isStyleOn) {
	if (isStyleOn) {
		div.style.cssText = "pointer-events:none;width:100%;height:25px;font-size:23px;z-index:6;";
		div2.style.cssText = "pointer-events:none;background:rgba(0,0,0,0.5);width:100%;height:27px;";
	} else {
		div.style.cssText = "pointer-events:none;width:56%;height:35px;font-size:18px;z-index:20;background-size:100% 100%;background-repeat:no-repeat;left:50%;top:15%;transform:translateX(-50%);";
		div.style.backgroundImage = `url(${lib.assetURL}extension/十周年UI/ui/assets/lbtn/uibutton/goutuo.png)`;
		div2.style.cssText = "pointer-events:none;width:85.5%;height:35px;left:8%;line-height:35px;";
	}
}

/**
 * 初始化滚动播报功能
 * @param {object} config - 配置对象
 * @param {boolean} config.GTBB - 是否启用播报
 * @param {string} config.GTBBYangshi - 样式配置
 * @returns {void}
 */
export function initGTBB(config) {
	if (!config.GTBB) return;

	const div = ui.create.div("");
	const div2 = ui.create.div("", div);
	const extConfig = lib.config["extension_十周年UI_GTBBFont"];
	const interval = parseFloat(lib.config["extension_十周年UI_GTBBTime"]);

	applyStyles(div, div2, config.GTBBYangshi === "on");

	function showGTBB() {
		div2.innerHTML = createMarqueeHTML({ GTBBFont: extConfig });
		div.show();
		setTimeout(() => div.hide(), 15500);
	}

	const checkId = setInterval(() => {
		if (!div.parentNode && ui.window) {
			ui.window.appendChild(div);
			clearInterval(checkId);
			showGTBB();
			setInterval(showGTBB, interval);
		}
	}, 5000);
}
