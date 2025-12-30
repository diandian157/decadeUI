/**
 * @fileoverview 玩家初始化模块
 * 提供玩家角色初始化相关功能，包括动态皮肤、手牌可见、角标等
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { element } from "../utils/element.js";
import { updatePlayerOutcropAvatar } from "./outcropAvatar.js";

/**
 * 创建player.$init方法
 * @param {object} base - 基础对象，包含lib.element.player.$init
 * @returns {Function} 初始化函数
 */
export function createPlayerInit(base) {
	/**
	 * 玩家初始化函数
	 * @param {string} character - 主将名称
	 * @param {string} [character2] - 副将名称
	 * @returns {HTMLElement} 玩家元素
	 */
	return function (character, character2) {
		base.lib.element.player.$init.apply(this, arguments);
		this.doubleAvatar = (character2 && lib.character[character2]) !== undefined;

		// othersOff样式下检查武将原画
		if (lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
			this.checkAndAddExperienceSuffix(character);
			if (character2) this.checkAndAddExperienceSuffix(character2, true);
		}

		// 边框等级
		const borderLevel = lib.config.extension_十周年UI_borderLevel;
		if (borderLevel === "random") {
			// 主玩家永远five，其他玩家随机
			if (this === game.me) {
				this.dataset.borderLevel = "five";
			} else {
				/** @type {string[]} */
				const levels = ["one", "two", "three", "four", "five"];
				this.dataset.borderLevel = levels[Math.floor(Math.random() * levels.length)];
			}
		} else {
			delete this.dataset.borderLevel;
		}

		// 动态皮肤
		/** @type {number} */
		let CUR_DYNAMIC = decadeUI.CUR_DYNAMIC ?? 0;
		/** @type {number} */
		let MAX_DYNAMIC = decadeUI.MAX_DYNAMIC ?? (decadeUI.isMobile() ? 2 : 10) + (window.OffscreenCanvas ? 8 : 0);
		decadeUI.CUR_DYNAMIC = CUR_DYNAMIC;
		decadeUI.MAX_DYNAMIC = MAX_DYNAMIC;

		if (this.dynamic) this.stopDynamic();
		const showDynamic = (this.dynamic || CUR_DYNAMIC < MAX_DYNAMIC) && decadeUI.config.dynamicSkin;
		if (showDynamic && _status.mode !== null) {
			const dskins = decadeUI.dynamicSkin;
			const avatars = this.doubleAvatar ? [character, character2] : [character];
			let increased;
			for (let i = 0; i < avatars.length; i++) {
				const skins = dskins[avatars[i]];
				if (!skins) continue;
				const keys = Object.keys(skins);
				if (!keys.length) {
					console.error(`player.init: ${avatars[i]} 没有设置动皮参数`);
					continue;
				}
				const skin = skins[keys[0]];
				if (skin.speed === undefined) skin.speed = 1;
				this.playDynamic(
					{
						name: skin.name,
						action: skin.action,
						loop: true,
						loopCount: -1,
						speed: skin.speed,
						filpX: undefined,
						filpY: undefined,
						opacity: undefined,
						x: skin.x,
						y: skin.y,
						scale: skin.scale,
						angle: skin.angle,
						hideSlots: skin.hideSlots,
						clipSlots: skin.clipSlots,
					},
					i === 1
				);
				this.$dynamicWrap.style.backgroundImage = `url("${decadeUIPath}assets/dynamic/${skin.background}")`;
				if (!increased) {
					increased = true;
					decadeUI.CUR_DYNAMIC++;
				}
			}
		}

		// 手牌可见功能
		if (!this.node.showCards) {
			const player = this;
			player.node.showCards = element.create("handdisplays", player);
			player.node.showCards.hide();

			const rect = player.getBoundingClientRect();
			const winWidth = window.innerWidth || document.documentElement.clientWidth;
			const showCards = player.node.showCards;
			/** @type {number} */
			const offset = 10;
			const isBabysha = lib.config.extension_十周年UI_newDecadeStyle === "babysha";
			if ((isBabysha && rect.left < winWidth / 2) || (!isBabysha && rect.left >= winWidth / 2)) {
				showCards.style.left = "";
				showCards.style.right = player.offsetWidth + offset + "px";
			} else {
				showCards.style.left = player.offsetWidth + offset + "px";
				showCards.style.right = "";
			}
			showCards.style.top = "90px";

			player.node.showCards.onclick = function () {
				const cards = player.getCards("h", c => get.is.shownCard(c) || player.isUnderControl(true) || game.me?.hasSkillTag("viewHandcard", null, player, true));
				if (cards.length > 0) {
					const popup = ui.create.div(".popup-container", ui.window);
					const handdisplay = ui.create.dialog(get.translation(player) + "的手牌", cards);
					handdisplay.static = true;
					popup.addEventListener("click", () => {
						popup.delete();
						handdisplay.close();
						handdisplay.delete();
					});
				}
			};

			["handcards1", "handcards2"].forEach(zone => {
				const observer = new MutationObserver(mutations => {
					for (const m of mutations) {
						if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
							player.decadeUI_updateShowCards();
							break;
						}
					}
				});
				observer.observe(player.node[zone], { childList: true });
			});
		}

		// 十周年角标
		if (window.decadeModule?.prefixMark) {
			window.decadeModule.prefixMark.showPrefixMark(character, this);
			if (character2 && this.doubleAvatar) {
				window.decadeModule.prefixMark.showPrefixMark(character2, this);
			}
		}

		this._addPrefixSeparator(this.node.name);
		if (this.doubleAvatar && this.node.name2) this._addPrefixSeparator(this.node.name2);

		// 冰可乐彩蛋
		if (lib.config.extension_十周年UI_cardPrettify === "bingkele") {
			const url = `https://q1.qlogo.cn/g?b=qq&nk=739201322&s=640&t=${Date.now()}`;
			if (character === "bozai") {
				this.node.avatar.setBackgroundImage(url);
				if (this.node.name) this.node.name.innerHTML = "冰可乐喵";
			}
			if (character2 === "bozai" && this.node.avatar2) {
				this.node.avatar2.setBackgroundImage(url);
				if (this.node.name2) this.node.name2.innerHTML = "冰可乐喵";
			}
		}

		this.decadeUI_updateShowCards();

		// 应用露头头像
		const outcropStyle = lib.config.extension_十周年UI_outcropSkin;
		if (outcropStyle && outcropStyle !== "off") {
			updatePlayerOutcropAvatar(this, outcropStyle);
		}

		return this;
	};
}
