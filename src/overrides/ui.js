/**
 * @fileoverview UI覆写模块 - UI相关的覆写方法
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { throttle } from "../animation/index.js";

/** @type {Function|null} 基础UI更新方法 */
let baseUiUpdate = null;

/** @type {Function|null} 基础介绍点击方法 */
let baseUiClickIntro = null;

/**
 * 设置基础UI方法引用
 * @param {Object} base - 基础方法对象
 */
export function setBaseUiMethods(base) {
	baseUiUpdate = base.update;
	baseUiClickIntro = base.click?.intro;
}

/**
 * 更新控制栏位置
 */
export function uiUpdatec() {
	const controls = ui.control.childNodes;
	let stayleft;
	let offsetLeft;
	for (let i = 0; i < controls.length; i++) {
		if (!stayleft && controls[i].stayleft) {
			stayleft = controls[i];
		} else if (!offsetLeft) {
			offsetLeft = controls[i].offsetLeft;
		}
		if (stayleft && offsetLeft) break;
	}
	if (stayleft) {
		if (ui.$stayleft != stayleft) {
			stayleft._width = stayleft.offsetWidth;
			ui.$stayleft = stayleft;
		}
		if (offsetLeft < stayleft._width) {
			stayleft.style.position = "static";
		} else {
			stayleft.style.position = "absolute";
		}
	}
}

/**
 * 更新手牌布局
 */
export function uiUpdatehl() {
	decadeUI.queueNextFrameTick(decadeUI.layoutHand, decadeUI);
}

/**
 * 更新判定区
 * @param {Object} player - 玩家
 */
export function uiUpdatej(player) {
	if (!player) return;
	const judges = player.node.judges.childNodes;
	for (let i = 0; i < judges.length; i++) {
		if (judges[i].classList.contains("removing")) continue;
		judges[i].classList.remove("drawinghidden");
		if (_status.connectMode) {
			const bgMark = lib.translate[judges[i].name + "_bg"] || get.translation(judges[i].name)[0];
			judges[i].node.judgeMark.node.judge.innerHTML = bgMark;
		}
	}
}

/**
 * 更新标记（空实现）
 * @param {Object} player - 玩家
 */
export function uiUpdatem(player) {}

/**
 * 更新缩放
 */
export function uiUpdatez() {
	window.documentZoom = game.documentZoom;
	document.body.style.zoom = game.documentZoom;
	document.body.style.width = "100%";
	document.body.style.height = "100%";
	document.body.style.transform = "";
}

/**
 * 更新对话框
 */
export function uiUpdate() {
	for (const update of ui.updates) update();
	if (ui.dialog === undefined || ui.dialog.classList.contains("noupdate")) return;
	if (game.chess) return baseUiUpdate?.();
	if ((!ui.dialog.buttons || !ui.dialog.buttons.length) && !ui.dialog.forcebutton && ui.dialog.classList.contains("fullheight") === false && get.mode() !== "stone") {
		ui.dialog.classList.add("prompt");
	} else {
		ui.dialog.classList.remove("prompt");
		let height = ui.dialog.content.offsetHeight;
		if (decadeUI.isMobile()) height = decadeUI.get.bodySize().height * 0.75 - 80;
		else height = decadeUI.get.bodySize().height * 0.45;
		ui.dialog.style.height = Math.min(height, ui.dialog.content.offsetHeight) + "px";
	}
	if (!ui.dialog.forcebutton && !ui.dialog._scrollset) {
		ui.dialog.classList.remove("scroll1");
		ui.dialog.classList.remove("scroll2");
	} else {
		ui.dialog.classList.add("scroll1");
		ui.dialog.classList.add("scroll2");
	}
}

/**
 * 更新判定标记
 * @param {Object} player - 玩家
 * @param {NodeList} nodes - 节点列表
 * @param {number} [start=0] - 起始位置
 * @param {boolean} [inv] - 是否反转
 */
export function uiUpdatejm(player, nodes, start, inv) {
	if (typeof start != "number") start = 0;
	for (let i = 0; i < nodes.childElementCount; i++) {
		const node = nodes.childNodes[i];
		if (i < start) {
			node.style.transform = "";
		} else if (node.classList.contains("removing")) {
			start++;
		} else {
			node.classList.remove("drawinghidden");
		}
	}
}

/**
 * 节流更新 - 延迟初始化
 * @type {Function|null}
 */
let _uiUpdatexr = null;

/**
 * 节流更新方法
 * @returns {*} 更新结果
 */
export function uiUpdatexr() {
	if (!_uiUpdatexr) {
		_uiUpdatexr = throttle(ui.updatex, 100, ui);
	}
	return _uiUpdatexr.apply(this, arguments);
}

// ==================== ui.create方法 ====================

/**
 * 创建预按钮
 * @param {*} item - 项目
 * @param {string} type - 类型
 * @param {HTMLElement} [position] - 位置
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
 * @param {...*} args - 参数
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
	if (!lib.config.touchscreen) dialog.contentContainer.onscroll = ui.update;
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
 * @param {Array} list - 选项列表
 * @param {*} init - 初始值
 * @param {HTMLElement} [position] - 位置
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
 * @param {string} identity - 身份
 * @param {HTMLElement} [position] - 位置
 * @param {*} [info] - 信息
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
 * @param {string} identity - 身份
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

/** @type {Function|null} 基础arena方法引用 */
let baseUiCreateArena = null;

/** @type {Function|null} 基础pause方法引用 */
let baseUiCreatePause = null;

/** @type {Function|null} 基础characterDialog方法引用 */
let baseUiCreateCharacterDialog = null;

/** @type {Function|null} 基础button方法引用 */
let baseUiCreateButton = null;

/**
 * 设置基础create方法引用
 * @param {Object} base - 基础方法对象
 */
export function setBaseUiCreateMethods(base) {
	baseUiCreateArena = base.arena;
	baseUiCreatePause = base.pause;
	baseUiCreateCharacterDialog = base.characterDialog;
	baseUiCreateButton = base.button;
}

/**
 * 创建按钮
 * @param {*} item - 项目
 * @param {string} type - 类型
 * @param {HTMLElement} [position] - 位置
 * @param {boolean} [noclick] - 是否禁用点击
 * @param {HTMLElement} [node] - 节点
 * @returns {HTMLElement} 按钮元素
 */
export function uiCreateButton(item, type, position, noclick, node) {
	const button = baseUiCreateButton?.apply(this, arguments);
	if (position) position.appendChild(button);
	return button;
}

/**
 * 创建游戏画面
 * @returns {HTMLElement} 游戏画面元素
 */
export function uiCreateArena() {
	uiUpdatez();
	const result = baseUiCreateArena?.apply(this, arguments);
	ui.arena.classList.remove("slim_player");
	ui.arena.classList.remove("uslim_player");
	ui.arena.classList.remove("mslim_player");
	ui.arena.classList.remove("lslim_player");
	ui.arena.classList.remove("oldlayout");
	ui.arena.classList.remove("mobile");
	ui.arena.classList.add("decadeUI");
	ui.control.id = "dui-controls";
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
 * @returns {HTMLElement} 对话框元素
 */
export function uiCreatePause() {
	const dialog = baseUiCreatePause?.call(this);
	dialog.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
	return dialog;
}

/**
 * 创建武将选择对话框
 * @returns {HTMLElement} 对话框元素
 */
export function uiCreateCharacterDialog() {
	const dialog = baseUiCreateCharacterDialog?.apply(this, arguments);
	const control = lib.config.extension_十周年UI_mx_decade_characterDialog || "default";
	if (control != "default") {
		const Searcher = dialog.querySelector(".searcher.caption");
		if (Searcher) Searcher.parentNode.removeChild(Searcher);
		if (control == "extension-OL-system") {
			const content_container = dialog.childNodes[0];
			const content = content_container.childNodes[0];
			const switch_con = content.childNodes[0];
			const buttons = content.childNodes[1];
			const div = ui.create.div("extension-OL-system");
			div.style.cssText = "display: flex; justify-content: center; align-items: center; gap: 6px; height: 35px; width: 100%; padding: 0 5px; top: -2px; left: 0; font-size: 18px; font-family: xinwei, sans-serif; box-sizing: border-box;";
			div.innerHTML = '<label style="font-size:20px;">搜索：</label><select style="height:26px; min-width:150px; font-size:15px; padding:1px 4px; border:1px solid #aaa; border-radius:4px; outline:none; flex-shrink:0;"><option value="name">名称翻译</option><option value="name1">名称ID</option><option value="name2">名称ID(精确匹配)</option><option value="skill">技能翻译</option><option value="skill1">技能ID</option><option value="skill2">技能ID(精确匹配)</option><option value="skill3">技能描述/翻译</option></select><input type="text" placeholder="非精确匹配支持正则搜索" style="height:24px; width:175px; font-size:15px; padding:1px 6px; border:1px solid #aaa; border-radius:4px; outline:none; flex-shrink:0; text-align:center;"/><button style="height:26px; padding:0 10px; font-size:15px; border:1px solid #aaa; border-radius:4px; background:#f5f5f5; cursor:pointer;">搜索</button>';
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

					const matched = (function (choice, value, name, skills) {
						if (choice.endsWith("2")) {
							return choice === "name2" ? value === name : skills.includes(value);
						}
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
						return skills.some(skill => test(get.translation(skill + "_info")));
					})(choice, value, name, skills);

					if (matched) node.classList.remove("nodisplay");
				}
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
	}
	return dialog;
}

// ==================== ui.click方法 ====================

/**
 * 卡牌点击处理
 * @param {Event} e - 事件对象
 */
export function uiClickCard(e) {
	delete this._waitingfordrag;
	if (_status.dragged) return;
	if (_status.clicked) return;
	if (ui.intro) return;
	_status.clicked = true;
	if (this.parentNode && (this.parentNode.classList.contains("judges") || this.parentNode.classList.contains("dui-marks"))) {
		if (!(e && e instanceof MouseEvent)) {
			const rect = this.getBoundingClientRect();
			const zoom = game.hasExtension && game.hasExtension("皮肤切换") ? game.documentZoom : 1;
			e = {
				clientX: (rect.left + 10) * zoom,
				clientY: (rect.top + 10) * zoom,
			};
		}
		ui.click.touchpop();
		ui.click.intro.call(this, e);
		_status.clicked = false;
		return;
	}
	const custom = _status.event.custom;
	if (custom.replace.card) {
		custom.replace.card(this);
		return;
	}
	if (this.classList.contains("selectable") == false) return;
	if (this.classList.contains("selected")) {
		ui.selected.cards.remove(this);
		if (_status.multitarget || _status.event.complexSelect) {
			game.uncheck();
			game.check();
		} else {
			this.classList.remove("selected");
			this.updateTransform();
			if (this.dataset.view == 1) {
				this.dataset.view = 0;
				if (this._tempName) {
					this._tempName.delete();
					delete this._tempName;
					this.dataset.low = 0;
				}
			}
			if (this.dataset.views == 1) {
				this.dataset.views = 0;
				if (this._tempSuitNum) {
					this._tempSuitNum.delete();
					delete this._tempSuitNum;
				}
			}
			if (decadeUI && decadeUI.layout) decadeUI.layout.invalidateHand();
		}
	} else {
		ui.selected.cards.add(this);
		this.classList.add("selected");
		this.updateTransform(true);
		const skill = _status.event.skill;
		if (get.info(skill) && get.info(skill).viewAs && !get.info(skill).ignoreMod) {
			const cardskb = typeof get.info(skill).viewAs == "function" ? get.info(skill).viewAs([this], _status.event.player) : get.info(skill).viewAs;
			const rsuit = get.suit(this),
				rnum = get.number(this),
				rname = get.name(this);
			const vname = get.name(cardskb);
			const rnature = get.nature(this),
				vnature = get.nature(cardskb);
			let vsuit = get.suit(cardskb),
				vnum = get.number(cardskb);
			if (vsuit == "none") vsuit = rsuit;
			if (!vnum) vnum = rnum;
			if (rname != vname || !get.is.sameNature(rnature, vnature, true)) {
				if (this._tempName) {
					this._tempName.delete();
					delete this._tempName;
				}
				if (!this._tempName) this._tempName = ui.create.div(".temp-name", this);
				let tempname = "",
					tempname2 = get.translation(vname);
				if (vnature) {
					this._tempName.dataset.nature = vnature;
					if (vname == "sha") {
						tempname2 = get.translation(vnature) + tempname2;
					}
				}
				tempname += tempname2;
				this._tempName.innerHTML = tempname;
				this._tempName.tempname = tempname;
				this.dataset.low = 1;
				this.dataset.view = 1;
			}
			if (rsuit != vsuit || rnum != vnum) {
				if (this._tempSuitNum) {
					this._tempSuitNum.delete();
					delete this._tempSuitNum;
				}
				decadeUI.cardTempSuitNum(this, vsuit, vnum);
				this.dataset.views = 1;
			}
		}
		if (decadeUI && decadeUI.layout) decadeUI.layout.invalidateHand();
	}
	if (game.chess && get.config("show_range") && !_status.event.skill && this.classList.contains("selected") && _status.event.isMine() && _status.event.name == "chooseToUse") {
		const player = _status.event.player;
		const range = get.info(this).range;
		if (range) {
			if (typeof range.attack === "number") {
				player.createRangeShadow(Math.min(8, player.getAttackRange(true) + range.attack - 1));
			} else if (typeof range.global === "number") {
				player.createRangeShadow(Math.min(8, player.getGlobalFrom() + range.global));
			}
		}
	}
	if (custom.add.card) {
		custom.add.card();
	}
	game.check();
	if (lib.config.popequip && arguments[0] != "popequip" && ui.arena && ui.arena.classList.contains("selecting") && this.parentNode.classList.contains("popequip")) {
		if (this.classList && this.classList.contains("emptyequip")) return;
		const rect = this.getBoundingClientRect();
		ui.click.touchpop();
		ui.click.intro.call(this.parentNode, {
			clientX: rect.left + 18,
			clientY: rect.top + 12,
		});
	}
}

/**
 * 介绍点击处理
 */
export function uiClickIntro() {
	if ((this && !this.extraEquip && this.classList && this.classList.contains("emptyequip")) || (this && this.parentNode && this.parentNode.classList && this.parentNode.classList.contains("emptyequip")) || (this && this.dataset && typeof this.dataset.name === "string" && this.dataset.name.startsWith("empty_equip"))) {
		return;
	}
	if (this.classList.contains("infohidden")) return;
	// 修复十周年UI触屏布局下装备介绍被压缩的问题
	if (this.classList.contains("card") && this.parentNode && this.parentNode.classList.contains("equips") && get.is.phoneLayout() && !get.is.mobileMe(this.parentNode.parentNode)) {
		const e = arguments[0];
		if (_status.dragged) {
			return;
		}
		_status.clicked = true;
		if (this.classList.contains("player") && !this.name) {
			return;
		}
		if (this.parentNode == ui.historybar) {
			if (ui.historybar.style.zIndex == "22") {
				if (_status.removePop) {
					if (_status.removePop(this) == false) {
						return;
					}
				} else {
					return;
				}
			}
			ui.historybar.style.zIndex = 22;
		}
		const uiintro = get.nodeintro(this, false, e);
		if (!uiintro) {
			return;
		}
		uiintro.classList.add("popped");
		uiintro.classList.add("static");
		ui.window.appendChild(uiintro);
		const layer = ui.create.div(".poplayer", ui.window);
		const clicklayer = function (e) {
			if (_status.touchpopping) {
				return;
			}
			delete ui.throwEmotion;
			delete _status.removePop;
			game.closePoptipDialog();
			uiintro.delete();
			this.remove();
			ui.historybar.style.zIndex = "";
			delete _status.currentlogv;
			if (!ui.arena.classList.contains("menupaused") && !uiintro.noresume) {
				game.resume2();
			}
			if (e && e.stopPropagation) {
				e.stopPropagation();
			}
			if (uiintro._onclose) {
				uiintro._onclose();
			}
			return false;
		};
		layer.addEventListener(lib.config.touchscreen ? "touchend" : "click", clicklayer);
		if (!lib.config.touchscreen) {
			layer.oncontextmenu = clicklayer;
		}
		if (this.parentNode == ui.historybar && lib.config.touchscreen) {
			const rect = this.getBoundingClientRect();
			e = { clientX: 0, clientY: rect.top + 30 };
		}
		lib.placePoppedDialog(uiintro, e);
		if (this.parentNode == ui.historybar) {
			if (lib.config.show_history == "right") {
				uiintro.style.left = "calc(100% - 10px)";
				uiintro.style.right = "auto";
			} else {
				uiintro.style.right = "calc(100% - 10px)";
				uiintro.style.left = "auto";
			}
		}
		return;
	}
	return baseUiClickIntro?.apply(this, arguments);
}

/**
 * 身份点击处理
 * @param {Event} e - 事件对象
 */
export function uiClickIdentity(e) {
	if (_status.dragged || !game.getIdentityList || _status.video || this.parentNode.forceShown) return;
	_status.clicked = true;
	let identityList = game.getIdentityList(this.parentNode);
	if (!identityList) return;
	if (lib.config.mark_identity_style == "click") {
		let getNext = false;
		let theNext;
		const current = this.firstChild.innerText;
		for (const key in identityList) {
			if (theNext === null || getNext) {
				theNext = key;
				if (getNext) break;
			}
			if (current === identityList[key]) getNext = true;
		}
		this.parentNode.setIdentity(theNext);
	} else {
		if (get.mode() == "guozhan") {
			identityList = {
				wei: "魏",
				shu: "蜀",
				wu: "吴",
				qun: "群",
				jin: "晋",
				ye: "野",
			};
			if (_status.forceKey) identityList.key = "键";
		}
		const _dui = window.decadeUI;
		if (!_dui.$identityMarkBox) {
			_dui.$identityMarkBox = window.decadeUI.element.create("identity-mark-box");
			_dui.$identityMarkBox.ondeactive = function () {
				_dui.$identityMarkBox.remove();
				_status.clicked = false;
				if (!ui.arena.classList.contains("menupaused")) game.resume2();
			};
		}
		let index = 0;
		let node;
		const nodes = _dui.$identityMarkBox.childNodes;
		for (const key in identityList) {
			node = nodes[index];
			if (!node) {
				node = window.decadeUI.element.create("identity-mark-item", _dui.$identityMarkBox);
				node.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
					this.player.setIdentity(this.link);
					_dui.$identityMarkBox.remove();
					_status.clicked = false;
				});
			} else {
				node.style.display = "";
			}
			node.link = key;
			node.player = this.parentNode;
			node.innerText = identityList[key];
			index++;
		}
		while (index < nodes.length) {
			nodes[index].style.display = "none";
			index++;
		}
		game.pause2();
		setTimeout(
			function (player) {
				player.appendChild(_dui.$identityMarkBox);
				_dui.set.activeElement(_dui.$identityMarkBox);
			},
			0,
			this.parentNode
		);
	}
}

/**
 * 音量设置对话框
 * @returns {HTMLElement} 设置对话框
 */
export function uiClickVolumn() {
	const setting = ui.create.dialog("hidden");
	setting.listen(function (e) {
		e.stopPropagation();
	});
	const backVolume = window.decadeUI.component.slider(0, 8, parseInt(lib.config.volumn_background));
	const gameVolume = window.decadeUI.component.slider(0, 8, parseInt(lib.config.volumn_audio));
	backVolume.onchange = function () {
		game.saveConfig("volumn_background", backVolume.value);
		ui.backgroundMusic.volume = backVolume.value / 8;
	};
	gameVolume.onchange = function () {
		game.saveConfig("volumn_audio", gameVolume.value);
	};
	setting.add("背景音量");
	setting.content.appendChild(backVolume);
	setting.add("游戏音量");
	setting.content.appendChild(gameVolume);
	setting.add(ui.create.div(".placeholder"));
	return setting;
}

/**
 * 清除弃牌区
 */
export function uiClear() {
	game.addVideo("uiClear");
	const nodes = document.getElementsByClassName("thrown");
	for (let i = nodes.length - 1; i >= 0; i--) {
		if (nodes[i].fixed) continue;
		if (nodes[i].classList.contains("card")) {
			if (nodes[i].name && (nodes[i].name.startsWith("shengbei_left_") || nodes[i].name.startsWith("shengbei_right_"))) {
				nodes[i].delete();
			} else {
				window.decadeUI.layout.clearout(nodes[i]);
			}
		} else nodes[i].delete();
	}
}

/**
 * 创建玩家手牌区
 * @param {boolean} hasme - 是否有主玩家
 */
export function uiCreateMe(hasme) {
	ui.arena.dataset.layout = game.layout;
	ui.mebg = ui.create.div("#mebg", ui.arena);
	ui.me = ui.create.div(".hand-wrap", ui.arena);
	ui.handcards1Container = window.decadeUI.element.create("hand-cards", ui.me);
	ui.handcards1Container.onmousewheel = window.decadeUI.handler.handMousewheel;
	ui.handcards2Container = ui.create.div("#handcards2");
	ui.arena.classList.remove("nome");
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
	window.decadeUI.bodySensor.addListener(() => window.decadeUI.layout.resize());
	window.decadeUI.layout.resize();
	ui.handcards1Container.ontouchstart = ui.click.touchStart;
	ui.handcards2Container.ontouchstart = ui.click.touchStart;
	ui.handcards1Container.ontouchmove = ui.click.touchScroll;
	ui.handcards2Container.ontouchmove = ui.click.touchScroll;
	ui.handcards1Container.style.WebkitOverflowScrolling = "touch";
	ui.handcards2Container.style.WebkitOverflowScrolling = "touch";
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
	if (lib.config.extension_十周年UI_aloneEquip) {
		if (game.me) {
			equipSolts.me = game.me;
			equipSolts.equips = game.me.node.equips;
			equipSolts.appendChild(game.me.node.equips);
		}
	}
}

/**
 * 应用UI覆写
 */
export function applyUiOverrides() {
	// 此函数用于在需要时应用覆写
}
