/**
 * @fileoverview UI点击方法模块
 * @description 包含ui.click相关的覆写方法
 * @module overrides/ui/click
 */

import { lib, game, ui, get, _status } from "noname";
import { getBaseUiClickIntro } from "./base.js";

/**
 * 卡牌点击处理
 * @description 处理卡牌的选中/取消选中逻辑
 * @param {Event} e - 事件对象
 */
export function uiClickCard(e) {
	delete this._waitingfordrag;
	if (_status.dragged) return;
	if (_status.clicked) return;
	if (ui.intro) return;
	_status.clicked = true;

	// 判定区/标记区卡牌点击
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

	// 取消选中
	if (this.classList.contains("selected")) {
		ui.selected.cards.remove(this);

		if (_status.multitarget || _status.event.complexSelect) {
			game.uncheck();
			game.check();
		} else {
			this.classList.remove("selected");
			this.updateTransform();

			// 清理临时名称
			if (this.dataset.view == 1) {
				this.dataset.view = 0;
				if (this._tempName) {
					this._tempName.delete();
					delete this._tempName;
					this.dataset.low = 0;
				}
			}

			// 清理临时花色点数
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
		// 选中卡牌
		ui.selected.cards.add(this);
		this.classList.add("selected");

		if (ui._handcardHover === this) {
			ui._handcardHover = null;
		}
		this.updateTransform(true);

		// 处理视为卡牌的显示
		const skill = _status.event.skill;
		if (get.info(skill) && get.info(skill).viewAs && !get.info(skill).ignoreMod) {
			handleViewAsCard(this, skill);
		}

		if (decadeUI && decadeUI.layout) decadeUI.layout.invalidateHand();
	}

	// 棋盘模式范围显示
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

	// 装备弹出介绍
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
 * 处理视为卡牌的显示
 * @param {HTMLElement} card - 卡牌元素
 * @param {string} skill - 技能名
 * @private
 */
function handleViewAsCard(card, skill) {
	const cardskb = typeof get.info(skill).viewAs == "function" ? get.info(skill).viewAs([card], _status.event.player) : get.info(skill).viewAs;

	const rsuit = get.suit(card),
		rnum = get.number(card),
		rname = get.name(card);
	const vname = get.name(cardskb);
	const rnature = get.nature(card),
		vnature = get.nature(cardskb);
	let vsuit = get.suit(cardskb),
		vnum = get.number(cardskb);

	if (vsuit == "none") vsuit = rsuit;
	if (!vnum) vnum = rnum;

	// 显示临时名称
	if (rname != vname || !get.is.sameNature(rnature, vnature, true)) {
		if (card._tempName) {
			card._tempName.delete();
			delete card._tempName;
		}
		if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);

		let tempname = "",
			tempname2 = get.translation(vname);
		if (vnature) {
			card._tempName.dataset.nature = vnature;
			if (vname == "sha") {
				tempname2 = get.translation(vnature) + tempname2;
			}
		}
		tempname += tempname2;
		card._tempName.innerHTML = tempname;
		card._tempName.tempname = tempname;
		card.dataset.low = 1;
		card.dataset.view = 1;
	}

	// 显示临时花色点数
	if (rsuit != vsuit || rnum != vnum) {
		if (card._tempSuitNum) {
			card._tempSuitNum.delete();
			delete card._tempSuitNum;
		}
		decadeUI.cardTempSuitNum(card, vsuit, vnum);
		card.dataset.views = 1;
	}
}

/**
 * 介绍点击处理
 * @description 处理卡牌/玩家介绍弹窗的显示
 */
export function uiClickIntro() {
	// 空装备槽不显示介绍
	if ((this && !this.extraEquip && this.classList && this.classList.contains("emptyequip")) || (this && this.parentNode && this.parentNode.classList && this.parentNode.classList.contains("emptyequip")) || (this && this.dataset && typeof this.dataset.name === "string" && this.dataset.name.startsWith("empty_equip"))) {
		return;
	}

	if (this.classList.contains("infohidden")) return;

	// 修复十周年UI触屏布局下装备介绍被压缩的问题
	if (this.classList.contains("card") && this.parentNode && this.parentNode.classList.contains("equips") && get.is.phoneLayout() && !get.is.mobileMe(this.parentNode.parentNode)) {
		handleEquipIntro.call(this, arguments[0]);
		return;
	}

	return getBaseUiClickIntro()?.apply(this, arguments);
}

/**
 * 处理装备介绍弹窗
 * @param {Event} e - 事件对象
 * @private
 */
function handleEquipIntro(e) {
	if (_status.dragged) return;
	_status.clicked = true;

	if (this.classList.contains("player") && !this.name) return;

	if (this.parentNode == ui.historybar) {
		if (ui.historybar.style.zIndex == "22") {
			if (_status.removePop) {
				if (_status.removePop(this) == false) return;
			} else {
				return;
			}
		}
		ui.historybar.style.zIndex = 22;
	}

	const uiintro = get.nodeintro(this, false, e);
	if (!uiintro) return;

	uiintro.classList.add("popped");
	uiintro.classList.add("static");
	ui.window.appendChild(uiintro);

	const layer = ui.create.div(".poplayer", ui.window);

	const clicklayer = function (e) {
		if (_status.touchpopping) return;
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
		if (e && e.stopPropagation) e.stopPropagation();
		if (uiintro._onclose) uiintro._onclose();
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
}

/**
 * 身份点击处理
 * @description 处理身份标记的点击切换
 * @param {Event} e - 事件对象
 */
export function uiClickIdentity(e) {
	if (_status.dragged || !game.getIdentityList || _status.video || this.parentNode.forceShown) return;
	_status.clicked = true;

	let identityList = game.getIdentityList(this.parentNode);
	if (!identityList) return;

	if (lib.config.mark_identity_style == "click") {
		// 点击切换模式
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
		// 弹出选择框模式
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

		showIdentityMarkBox.call(this, identityList);
	}
}

/**
 * 显示身份标记选择框
 * @param {Object} identityList - 身份列表
 * @private
 */
function showIdentityMarkBox(identityList) {
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

/**
 * 音量设置对话框
 * @description 创建音量设置对话框
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
