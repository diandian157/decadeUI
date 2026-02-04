/**
 * @fileoverview UI创建方法模块
 * @description 包含ui.create相关的覆写方法
 * @module overrides/ui/create
 */

import { lib, game, ui, get, _status } from "noname";
import { getBaseUiCreateArena, getBaseUiCreatePause, getBaseUiCreateCharacterDialog, getBaseUiCreateButton } from "./base.js";
import { uiUpdatez } from "./update.js";

/**
 * 创建预按钮
 * @description 创建延迟激活的按钮，用于性能优化
 * @param {*} item - 项目数据
 * @param {string} type - 按钮类型
 * @param {HTMLElement} [position] - 父容器
 * @param {boolean} [noclick] - 是否禁用点击
 * @returns {HTMLElement} 按钮元素
 */
export function uiCreatePrebutton(item, type, position, noclick) {
	const button = ui.create.div();
	button.style.display = "none";
	button.link = item;
	button.activate = function () {
		const node = ui.create.button(item, type, undefined, noclick, button);
		node.activate = undefined;
	};
	_status.prebutton.push(button);
	if (position) position.appendChild(button);
	return button;
}

/**
 * 创建稀有度标记
 * @description 在武将按钮上显示稀有度图标
 * @param {HTMLElement} button - 按钮元素
 */
export function uiCreateRarity(button) {
	if (!lib.config.show_rarity) return;

	const rarity = game.getRarity(button.link);
	const intro = button.node.intro;
	intro.classList.add("showintro");
	intro.classList.add("rarity");
	if (intro.innerText) intro.innerText = "";
	intro.style.backgroundImage = 'url("' + decadeUIPath + "image/ui/rarity/rarity_" + rarity + '.png")';
}

/**
 * 创建控制按钮
 * @description 创建底部控制栏按钮
 * @returns {HTMLElement} 控制元素
 */
export function uiCreateControl() {
	let controls;
	let nozoom = false;

	if (Array.isArray(arguments[0])) {
		controls = arguments[0];
	} else {
		controls = arguments;
	}

	const control = document.createElement("div");
	control.className = "control";
	control.style.opacity = 1;
	Object.setPrototypeOf(control, lib.element.Control.prototype);

	for (let i = 0; i < controls.length; i++) {
		if (typeof controls[i] == "function") {
			control.custom = controls[i];
		} else if (controls[i] == "nozoom") {
			nozoom = true;
		} else if (controls[i] == "stayleft") {
			control.stayleft = true;
			control.classList.add("stayleft");
		} else {
			control.add(controls[i]);
		}
	}

	ui.controls.unshift(control);
	ui.control.insertBefore(control, _status.createControl || ui.confirm);
	control.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control2);

	return control;
}

/**
 * 创建对话框
 * @description 创建十周年UI风格的对话框
 * @param {...*} args - 参数列表
 * @returns {HTMLElement} 对话框元素
 */
export function uiCreateDialog(...args) {
	let hidden = false;
	let notouchscroll = false;
	let forcebutton = false;
	let noforcebutton = false;
	let peaceDialog = false;

	const dialog = decadeUI.element.create("dialog");
	dialog.supportsPagination = false;
	dialog.paginationMap = new Map();
	dialog.paginationMaxCount = new Map();
	dialog.contentContainer = decadeUI.element.create("content-container", dialog);
	dialog.content = decadeUI.element.create("content", dialog.contentContainer);
	dialog.buttons = [];
	Object.setPrototypeOf(dialog, lib.element.Dialog.prototype);

	// 解析参数
	for (let i = 0; i < args.length; i++) {
		if (typeof args[i] == "boolean") dialog.static = args[i];
		else if (args[i] == "hidden") hidden = true;
		else if (args[i] == "notouchscroll") notouchscroll = true;
		else if (args[i] == "forcebutton") forcebutton = true;
		else if (args[i] == "noforcebutton") noforcebutton = true;
		else if (args[i] == "peaceDialog") peaceDialog = true;
		else dialog.add(args[i]);
	}

	if (!hidden) dialog.open();

	if (!lib.config.touchscreen) {
		dialog.contentContainer.onscroll = ui.update;
	}

	if (!notouchscroll) {
		dialog.contentContainer.ontouchstart = ui.click.dialogtouchStart;
		dialog.contentContainer.ontouchmove = ui.click.touchScroll;
		dialog.contentContainer.style.WebkitOverflowScrolling = "touch";
		dialog.ontouchstart = ui.click.dragtouchdialog;
	}

	if (noforcebutton) {
		dialog.noforcebutton = true;
	} else if (forcebutton) {
		dialog.forcebutton = true;
		dialog.classList.add("forcebutton");
	}

	if (peaceDialog) dialog.peaceDialog = true;

	return dialog;
}

/**
 * 创建选择列表
 * @description 创建下拉选择框
 * @param {Array} list - 选项列表
 * @param {*} init - 初始值
 * @param {HTMLElement} [position] - 父容器
 * @param {Function} [onchange] - 变更回调
 * @returns {HTMLSelectElement} 选择元素
 */
export function uiCreateSelectlist(list, init, position, onchange) {
	const select = document.createElement("select");

	for (let i = 0; i < list.length; i++) {
		const option = document.createElement("option");
		if (Array.isArray(list[i])) {
			option.value = list[i][0];
			option.innerText = list[i][1];
		} else {
			option.value = list[i];
			option.innerText = list[i];
		}
		if (init == option.value) option.selected = "selected";
		select.appendChild(option);
	}

	if (position) position.appendChild(select);
	if (onchange) select.onchange = onchange;

	return select;
}

/**
 * 创建身份卡
 * @description 创建带身份图片的卡牌
 * @param {string} identity - 身份标识
 * @param {HTMLElement} [position] - 父容器
 * @param {*} [info] - 附加信息
 * @param {boolean} [noclick] - 是否禁用点击
 * @returns {HTMLElement} 卡牌元素
 */
export function uiCreateIdentityCard(identity, position, info, noclick) {
	const card = ui.create.card(position, info, noclick);
	card.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
	card.classList.add("button");

	card._customintro = function (uiintro) {
		uiintro.add(`${get.translation(identity + 2)}的身份牌`);
	};

	const fileName = "extension/十周年UI/image/ui/identity-card/mougong_" + identity + ".jpg";

	new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve();
		image.onerror = reject;
		image.src = `${lib.assetURL}${fileName}`;
	})
		.then(() => {
			card.classList.add("fullimage");
			card.setBackgroundImage(fileName);
			card.style.backgroundSize = "cover";
		})
		.catch(() => {
			card.node.background.innerHTML = get.translation(identity)[0];
		});

	return card;
}

/**
 * 创建旋转身份卡
 * @description 创建带旋转动画的身份卡
 * @param {string} identity - 身份标识
 * @param {HTMLElement} dialog - 对话框
 */
export function uiCreateSpinningIdentityCard(identity, dialog) {
	const card = ui.create.identityCard(identity);
	const buttons = ui.create.div(".buttons", dialog.content);

	setTimeout(() => {
		buttons.appendChild(card);
		dialog.open();
		ui.create.cardSpinning(card);
	}, 50);
}

/**
 * 创建按钮
 * @description 创建通用按钮
 * @param {*} item - 项目数据
 * @param {string} type - 按钮类型
 * @param {HTMLElement} [position] - 父容器
 * @param {boolean} [noclick] - 是否禁用点击
 * @param {HTMLElement} [node] - 现有节点
 * @returns {HTMLElement} 按钮元素
 */
export function uiCreateButton(item, type, position, noclick, node) {
	const button = getBaseUiCreateButton()?.apply(this, arguments);
	if (position) position.appendChild(button);
	return button;
}

/**
 * 创建游戏画面
 * @description 创建游戏主画面并应用十周年UI样式
 * @returns {HTMLElement} 游戏画面元素
 */
export function uiCreateArena() {
	uiUpdatez();

	const result = getBaseUiCreateArena()?.apply(this, arguments);

	// 移除原有布局类
	ui.arena.classList.remove("slim_player");
	ui.arena.classList.remove("uslim_player");
	ui.arena.classList.remove("mslim_player");
	ui.arena.classList.remove("lslim_player");
	ui.arena.classList.remove("oldlayout");
	ui.arena.classList.remove("mobile");

	// 添加十周年UI类
	ui.arena.classList.add("decadeUI");
	ui.control.id = "dui-controls";

	// 设置手机布局属性
	if (lib.config.phonelayout) {
		ui.arena.setAttribute("data-phonelayout", "on");
	} else {
		ui.arena.setAttribute("data-phonelayout", "off");
	}

	decadeUI.config.update();

	return result;
}

/**
 * 创建暂停对话框
 * @description 创建暂停时的遮罩对话框
 * @returns {HTMLElement} 对话框元素
 */
export function uiCreatePause() {
	const dialog = getBaseUiCreatePause()?.call(this);
	dialog.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
	return dialog;
}

/**
 * 创建武将选择对话框
 * @description 创建武将选择对话框，支持多种搜索模式
 * @returns {HTMLElement} 对话框元素
 */
export function uiCreateCharacterDialog() {
	const dialog = getBaseUiCreateCharacterDialog()?.apply(this, arguments);
	const control = lib.config.extension_十周年UI_mx_decade_characterDialog || "default";

	if (control != "default") {
		// 移除原有搜索器
		const Searcher = dialog.querySelector(".searcher.caption");
		if (Searcher) Searcher.parentNode.removeChild(Searcher);

		if (control == "extension-OL-system") {
			createOLSearcher(dialog);
		}
	}

	return dialog;
}

/**
 * 创建OL风格搜索器
 * @param {HTMLElement} dialog - 对话框
 * @private
 */
function createOLSearcher(dialog) {
	const content_container = dialog.childNodes[0];
	const content = content_container.childNodes[0];
	const switch_con = content.childNodes[0];
	const buttons = content.childNodes[1];

	const div = ui.create.div("extension-OL-system");
	div.style.cssText =
		"display: flex; justify-content: center; align-items: center; gap: 6px; height: 35px; width: 100%; padding: 0 5px; top: -2px; left: 0; font-size: 18px; font-family: xinwei, sans-serif; box-sizing: border-box;";
	div.innerHTML = `
		<label style="font-size:20px;">搜索：</label>
		<select style="height:26px; min-width:150px; font-size:15px; padding:1px 4px; border:1px solid #aaa; border-radius:4px; outline:none; flex-shrink:0;">
			<option value="name">名称翻译</option>
			<option value="name1">名称ID</option>
			<option value="name2">名称ID(精确匹配)</option>
			<option value="skill">技能翻译</option>
			<option value="skill1">技能ID</option>
			<option value="skill2">技能ID(精确匹配)</option>
			<option value="skill3">技能描述/翻译</option>
		</select>
		<input type="text" placeholder="非精确匹配支持正则搜索" style="height:24px; width:175px; font-size:15px; padding:1px 6px; border:1px solid #aaa; border-radius:4px; outline:none; flex-shrink:0; text-align:center;"/>
		<button style="height:26px; padding:0 10px; font-size:15px; border:1px solid #aaa; border-radius:4px; background:#f5f5f5; cursor:pointer;">搜索</button>
	`;

	const input = div.querySelector("input");
	const select = div.querySelector("select");
	const button = div.querySelector("button");

	// 搜索函数
	function doSearch() {
		const value = input.value.trim();
		if (!value) {
			game.alert("搜索不能为空");
			input.focus();
			return;
		}

		const choice = select.value;

		for (let i = 0; i < buttons.childNodes.length; i++) {
			const node = buttons.childNodes[i];
			node.classList.add("nodisplay");
			const name = node.link;
			const skills = get.character(name).skills || [];

			const matched = matchCharacter(choice, value, name, skills);
			if (matched) node.classList.remove("nodisplay");
		}

		// 更新分页
		if (dialog.paginationMaxCount.get("character")) {
			const buttonsNode = dialog.content.querySelector(".buttons");
			const p = dialog.paginationMap.get(buttonsNode);
			if (p) {
				const array = dialog.buttons.filter(item => !item.classList.contains("nodisplay"));
				p.state.data = array;
				p.setTotalPageCount(Math.ceil(array.length / dialog.paginationMaxCount.get("character")));
			}
		}
	}

	// 绑定事件
	input.addEventListener("keydown", e => {
		e.stopPropagation();
		if (e.key === "Enter" || e.keyCode === 13) {
			e.preventDefault();
			doSearch();
		}
	});

	button.addEventListener("click", e => {
		e.stopPropagation();
		doSearch();
		input.focus();
	});

	input.addEventListener("mousedown", e => {
		e.stopPropagation();
	});

	switch_con.insertBefore(div, switch_con.firstChild);
}

/**
 * 匹配武将搜索条件
 * @param {string} choice - 搜索类型
 * @param {string} value - 搜索值
 * @param {string} name - 武将名
 * @param {Array} skills - 技能列表
 * @returns {boolean} 是否匹配
 * @private
 */
function matchCharacter(choice, value, name, skills) {
	// 精确匹配
	if (choice.endsWith("2")) {
		return choice === "name2" ? value === name : skills.includes(value);
	}

	// 正则匹配
	let regex;
	try {
		regex = new RegExp(value, "i");
	} catch {
		game.alert("正则表达式无效");
		return false;
	}

	const test = t => t && regex.test(t);

	if (choice === "name1") return test(name);
	if (choice === "name") return test(get.translation(name)) || test(get.translation(name + "_ab"));
	if (choice === "skill1") return skills.some(skill => test(skill));
	if (choice === "skill") return skills.some(skill => test(get.translation(skill)));

	// skill3: 技能描述
	return skills.some(skill => test(get.translation(skill + "_info")));
}

/**
 * 创建玩家手牌区
 * @description 创建主玩家的手牌区域和装备栏
 * @param {boolean} hasme - 是否有主玩家
 */
export function uiCreateMe(hasme) {
	ui.arena.dataset.layout = game.layout;
	ui.mebg = ui.create.div("#mebg", ui.arena);
	ui.me = ui.create.div(".hand-wrap", ui.arena);

	// 创建手牌容器
	ui.handcards1Container = window.decadeUI.element.create("hand-cards", ui.me);
	ui.handcards1Container.onmousewheel = window.decadeUI.handler.handMousewheel;
	ui.handcards2Container = ui.create.div("#handcards2");
	ui.arena.classList.remove("nome");

	// 创建装备栏
	const equipSolts = (ui.equipSolts = window.decadeUI.element.create("equips-wrap"));
	equipSolts.back = window.decadeUI.element.create("equips-back", equipSolts);

	for (let repetition = 0; repetition < 5; repetition++) {
		const ediv = window.decadeUI.element.create(null, equipSolts.back);
		ediv.dataset.type = repetition;
	}

	ui.arena.insertBefore(equipSolts, ui.me);

	if (!lib.config.extension_十周年UI_aloneEquip) {
		equipSolts.style.display = "none";
	}

	// 监听尺寸变化
	window.decadeUI.bodySensor.addListener(() => window.decadeUI.layout.resize());
	window.decadeUI.layout.resize();

	// 绑定触摸事件
	ui.handcards1Container.ontouchstart = ui.click.touchStart;
	ui.handcards2Container.ontouchstart = ui.click.touchStart;
	ui.handcards1Container.ontouchmove = ui.click.touchScroll;
	ui.handcards2Container.ontouchmove = ui.click.touchScroll;
	ui.handcards1Container.style.WebkitOverflowScrolling = "touch";
	ui.handcards2Container.style.WebkitOverflowScrolling = "touch";

	// 设置手牌
	if (hasme && game.me) {
		ui.handcards1 = game.me.node.handcards1;
		ui.handcards2 = game.me.node.handcards2;
		ui.handcards1Container.appendChild(ui.handcards1);
		ui.handcards2Container.appendChild(ui.handcards2);
	} else if (game.players.length) {
		game.me = game.players[0];
		ui.handcards1 = game.me.node.handcards1;
		ui.handcards2 = game.me.node.handcards2;
		ui.handcards1Container.appendChild(ui.handcards1);
		ui.handcards2Container.appendChild(ui.handcards2);
	}

	// 设置装备
	if (lib.config.extension_十周年UI_aloneEquip) {
		if (game.me) {
			equipSolts.me = game.me;
			equipSolts.equips = game.me.node.equips;
			equipSolts.appendChild(game.me.node.equips);
		}
	}
}
