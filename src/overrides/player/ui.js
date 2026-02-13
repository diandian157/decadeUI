/**
 * @fileoverview UI相关覆写模块
 * @description 处理玩家UI相关的覆写方法，包括聊天气泡、手牌显示、前缀分隔符等
 * @module overrides/player/ui
 */

import { lib, game, ui, get, ai, _status } from "noname";

/** @type {Object|null} decadeUI引用（延迟获取） */
let _decadeUI = null;

/**
 * 获取decadeUI引用
 * @returns {Object} decadeUI对象
 */
function getDui() {
	if (!_decadeUI) _decadeUI = window.decadeUI;
	return _decadeUI;
}

/**
 * 说话覆写
 * @description 处理玩家聊天气泡的显示，支持文本和图片消息
 * @param {string} str - 说话内容，可包含HTML
 * @returns {void}
 */
export function playerSay(str) {
	str = str.replace(/##assetURL##/g, lib.assetURL);

	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = str;
	const textContent = tempDiv.textContent || tempDiv.innerText || "";
	const isImageOnly = textContent.trim() === "" && tempDiv.querySelectorAll("img").length > 0;

	if (isImageOnly) {
		if (!this.$chatImage || !this.$chatImage.parentNode) {
			this.$chatImage = decadeUI.element.create("chat-image");
			this.$chatImage.style.position = "absolute";
			this.$chatImage.style.pointerEvents = "none";

			const style = decadeUI.config.newDecadeStyle;
			if (style === "off" || style === "on" || style === "othersOff") {
				this.$chatImage.style.left = "50%";
				this.$chatImage.style.top = "50%";
				this.$chatImage.style.transform = "translate(-50%, -50%)";
				this.$chatImage.style.zIndex = "90";
			} else {
				this.$chatImage.style.left = "-40%";
				this.$chatImage.style.top = "-50px";
				this.$chatImage.style.transform = "translateX(-50%)";
				this.$chatImage.style.zIndex = "90";
			}
		}

		const imageContainer = this.$chatImage;
		imageContainer.innerHTML = str;

		// 设置图片默认尺寸
		const images = imageContainer.querySelectorAll("img");
		images.forEach(img => {
			if (!img.style.width && !img.style.height) {
				img.style.width = "100px";
				img.style.height = "auto";
				img.style.maxWidth = "100px";
			}
		});

		if (this != imageContainer.parentNode) this.appendChild(imageContainer);
		imageContainer.classList.remove("removing");
		imageContainer.style.animation = "fade-in 0.3s";

		if (imageContainer.timeout) clearTimeout(imageContainer.timeout);
		imageContainer.timeout = setTimeout(() => {
			imageContainer.timeout = undefined;
			imageContainer.delete();
			this.$chatImage = undefined;
		}, 2000);
	} else {
		if (!this.$chatBubble) {
			this.$chatBubble = decadeUI.element.create("chat-bubble");
		}

		const bubble = this.$chatBubble;
		bubble.innerHTML = str;

		if (this != bubble.parentNode) this.appendChild(bubble);
		bubble.classList.remove("removing");
		bubble.style.animation = "fade-in 0.3s";

		if (bubble.timeout) clearTimeout(bubble.timeout);
		bubble.timeout = setTimeout(() => {
			bubble.timeout = undefined;
			bubble.delete();
		}, 2000);
	}

	const name = get.translation(this.name);
	const info = [name ? `${name}[${this.nickname}]` : this.nickname, str];
	lib.chatHistory.push(info);

	if (_status.addChatEntry) {
		if (_status.addChatEntry._origin.parentNode) {
			_status.addChatEntry(info, false);
		} else {
			_status.addChatEntry = undefined;
		}
	}

	// 播放快捷语音
	if (lib.config.background_speak && lib.quickVoice.includes(str)) {
		game.playAudio("voice", this.sex === "female" ? "female" : "male", lib.quickVoice.indexOf(str));
	}
}

/**
 * 同步扩展槽位覆写
 * @description 同步玩家的扩展装备槽位显示
 * @param {Object} [map] - 槽位映射对象
 * @returns {void}
 */
export function playerSyncExpand(map) {
	if (this != game.me) return;

	if (!map) map = this.expandedSlots || {};

	game.addVideo("$syncExpand", this, get.copy(map));
	game.broadcast(
		function (player, map) {
			player.expandedSlots = map;
			player.$syncExpand(map);
		},
		this,
		map
	);

	const goon = lib.skill.expandedSlots.intro.markcount(null, game.me) > 0;
	this[goon ? "markSkill" : "unmarkSkill"]("expandedSlots");

	let ele;
	while ((ele = ui.equipSolts.back.firstChild)) {
		ele.remove();
	}

	const storage = this.expandedSlots;
	const equipSolts = ui.equipSolts;

	for (let repetition = 0; repetition < 5; repetition++) {
		if (storage && storage["equip" + (repetition + 1)]) {
			for (let adde = 0; adde < storage["equip" + (repetition + 1)]; adde++) {
				const addediv = decadeUI.element.create(null, equipSolts.back);
				addediv.dataset.type = repetition;
			}
		}
		const ediv = decadeUI.element.create(null, equipSolts.back);
		ediv.dataset.type = repetition;
	}
}

/**
 * 检查并添加体验后缀
 * @description 检测武将头像是否加载成功，失败时添加"•体验"后缀
 * @param {string} characterName - 武将名
 * @param {boolean} isDeputy - 是否为副将
 * @returns {void}
 */
export function playerCheckAndAddExperienceSuffix(characterName, isDeputy) {
	if (!get.character(characterName)) return;

	const player = this;
	const nameNode = player.node?.[isDeputy ? "name2" : "name"];
	const avatarNode = player.node?.[isDeputy ? "avatar2" : "avatar"];

	if (!nameNode) return;

	const addSuffix = () => {
		if (!nameNode.textContent.endsWith("•体验")) {
			nameNode.textContent = `${nameNode.textContent}•体验`;
		}
	};

	const removeSuffix = () => {
		if (nameNode.textContent.endsWith("•体验")) {
			nameNode.textContent = nameNode.textContent.slice(0, -3);
		}
	};

	const bgImage = avatarNode?.style?.backgroundImage;
	if (!bgImage) {
		addSuffix();
		return;
	}

	const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
	if (!match?.[1]) {
		addSuffix();
		return;
	}

	const src = match[1];
	const testImg = new Image();
	testImg.onload = removeSuffix;
	testImg.onerror = addSuffix;
	testImg.src = src;
}

/**
 * 更新显示手牌覆写
 * @description 更新玩家可见手牌的显示
 * @returns {void}
 */
export function playerUpdateShowCards() {
	const player = this;

	if (!player.node.showCards) return;

	if (player == game.me || player.isDead()) {
		player.node.showCards.hide();
		while (player.node.showCards.hasChildNodes()) {
			player.node.showCards.removeChild(player.node.showCards.firstChild);
		}
		return;
	}

	const cards = player.getCards(
		"h",
		c =>
			get.is.shownCard(c) ||
			(typeof game.me !== "undefined" && player.isUnderControl(true)) ||
			(game.me && game.me.hasSkillTag("viewHandcard", null, player, true))
	);

	if (!cards.length) {
		player.node.showCards.hide();
		return;
	}

	player.node.showCards.show();

	while (player.node.showCards.hasChildNodes()) {
		player.node.showCards.removeChild(player.node.showCards.firstChild);
	}

	/**
	 * 创建DOM元素的辅助函数
	 * @param {string} tag - 标签名
	 * @param {Object} opts - 选项
	 * @returns {HTMLElement} 创建的元素
	 */
	function createElement(tag, opts = {}) {
		const d = document.createElement(tag);
		for (const key in opts) {
			if (!Object.hasOwnProperty.call(opts, key)) continue;
			const setterMap = {
				class: v => v.forEach(x => d.classList.add(x)),
				id: v => (d.id = v),
				parentNode: v => v.appendChild(d),
				listen: v => {
					for (const evt in v) {
						if (typeof v[evt] == "function") d[evt] = v[evt];
					}
				},
				style: v => {
					for (const s in v) d.style[s] = v[s];
				},
				children: v => v.forEach(x => d.appendChild(x)),
				insertBefore: v => v[0].insertBefore(d, v[1]),
			};
			if (key == "innerHTML" || key == "innerText") {
				d[key] = opts[key];
			} else if (setterMap[key]) {
				setterMap[key](opts[key]);
			}
		}
		return d;
	}

	// 创建手牌显示元素（最多5张）
	for (let i = 0; i < 5; i++) {
		createElement("div", {
			class: ["handcard"],
			innerHTML: i < cards.length ? lib.translate[cards[i].name].slice(0, 2) : "",
			parentNode: player.node.showCards,
		});
	}
}

/**
 * 检查边界缓存覆写
 * @description 检查并更新玩家元素的位置缓存
 * @param {boolean} [forceUpdate] - 是否强制更新
 * @returns {void}
 */
export function playerCheckBoundsCache(forceUpdate) {
	let update;
	const refer = getDui().boundsCaches.arena;
	refer.check();

	if (this.cacheReferW != refer.width || this.cacheReferH != refer.height || this.cachePosition != this.dataset.position) {
		update = true;
	}

	this.cacheReferW = refer.width;
	this.cacheReferH = refer.height;
	this.cachePosition = this.dataset.position;

	if (this.cacheLeft === null) update = true;

	if (update || forceUpdate) {
		this.cacheLeft = this.offsetLeft;
		this.cacheTop = this.offsetTop;
		this.cacheWidth = this.offsetWidth;
		this.cacheHeight = this.offsetHeight;
	}
}
