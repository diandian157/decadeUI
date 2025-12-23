import { lib, game, ui, get, ai, _status } from "noname";
import { ChildNodesWatcher } from "../../../noname/library/cache/childNodesWatcher.js";
import { initializeDecadeUIEnvironment, createDecadeUIDialogModule, createDecadeUIAnimateModule, createResizeSensorClass } from "./conmodules.js";
import { cardSkinMeta, cardSkinPresets } from "./config.js";

const createDecadeUIObject = () => ({
	init() {
		this.extensionName = decadeUIName;
		this.bodySensor = initializeDecadeUIEnvironment(this);
		this.initOverride();
		return this;
	},
	initOverride() {
		const override = (dest, src) => {
			let ok = true;
			for (const key in src) {
				if (dest[key]) {
					ok = override(dest[key], src[key]);
					if (ok) dest[key] = src[key];
				} else {
					dest[key] = src[key];
				}
				ok = false;
			}
			return ok;
		};
		const createBaseVariables = () => ({
			ui: {
				create: {
					cards: ui.create.cards,
					button: ui.create.button,
					arena: ui.create.arena,
					pause: ui.create.pause,
					characterDialog: ui.create.characterDialog,
				},
				click: {
					intro: ui.click.intro,
				},
				update: ui.update,
			},
			get: {
				skillState: get.skillState,
			},
			game: {
				swapSeat: game.swapSeat,
				swapControl: game.swapControl,
				swapPlayer: game.swapPlayer,
				addGlobalSkill: game.addGlobalSkill,
				removeGlobalSkill: game.removeGlobalSkill,
			},
			lib: {
				element: {
					card: {
						$init: lib.element.card.$init,
						copy: lib.element.card.copy,
					},
					player: {
						addSkill: lib.element.player.addSkill,
						removeSkill: lib.element.player.removeSkill,
						awakenSkill: lib.element.player.awakenSkill,
						getState: lib.element.player.getState,
						setModeState: lib.element.player.setModeState,
						$dieAfter: lib.element.player.$dieAfter,
						$skill: lib.element.player.$skill,
						markSkill: lib.element.player.markSkill,
						unmarkSkill: lib.element.player.unmarkSkill,
						reinitCharacter: lib.element.player.reinitCharacter,
						$init: lib.element.player.$init,
						$uninit: lib.element.player.$uninit,
						$reinit: lib.element.player.$reinit,
						setSeatNum: lib.element.player.setSeatNum,
						$update: lib.element.player.$update,
						useCard: lib.element.player.useCard,
						lose: lib.element.player.lose,
						$draw: lib.element.player.$draw,
						$handleEquipChange: lib.element.player.$handleEquipChange,
						useCardAnimateBefore: lib.element.player.useCardAnimateBefore,
						respondAnimateBefore: lib.element.player.respondAnimateBefore,
						$changeZhuanhuanji: lib.element.player.$changeZhuanhuanji,
						trySkillAnimate: lib.element.player.trySkillAnimate,
					},
					content: {
						lose: lib.element.content.lose,
						gain: lib.element.content.gain,
						chooseToCompare: lib.element.content.chooseToCompare.slice(),
						chooseToCompareMultiple: lib.element.content.chooseToCompareMultiple.slice(),
						chooseToCompareEffect: lib.element.content.chooseToCompareEffect.slice(),
					},
					dialog: {
						close: lib.element.dialog.close,
					},
				},
				init: {
					cssstyles: lib.init.cssstyles,
				},
			},
		});
		const base = createBaseVariables();
		const ride = {
			lib: {
				element: {
					dialog: {
						open() {
							if (this.noopen) return;
							for (let i = 0; i < ui.dialogs.length; i++) {
								if (ui.dialogs[i] == this) {
									this.show();
									this.refocus();
									ui.dialogs.remove(this);
									ui.dialogs.unshift(this);
									ui.update();
									return this;
								}
								if (!this.peaceDialog) {
									if (ui.dialogs[i].static) ui.dialogs[i].unfocus();
									else ui.dialogs[i].hide();
								}
							}
							ui.dialog = this;
							ui.arena.appendChild(this);
							ui.dialogs.unshift(this);
							ui.update();
							if (!this.classList.contains("prompt")) this.style.animation = "open-dialog 0.5s";
							return this;
						},
						close() {
							if (this.intersection) {
								this.intersection.disconnect();
								this.intersection = undefined;
							}
							return base.lib.element.dialog.close.apply(this, arguments);
						},
					},
					event: {
						addMessageHook(message, callback) {
							if (this._messages === undefined) this._messages = {};
							message = message.toLowerCase();
							if (this._messages[message] === undefined) this._messages[message] = [];
							message = this._messages[message];
							message.push(callback);
						},
						triggerMessage(message) {
							if (this._messages === undefined) return;
							message = message.toLowerCase();
							if (this._messages[message] === undefined) return;
							message = this._messages[message];
							for (let i = 0; i < message.length; i++) {
								if (typeof message[i] === "function") message[i].call(this);
							}
							this._messages[message] = [];
						},
					},
					card: {
						copy() {
							const clone = base.lib.element.card.copy.apply(this, arguments);
							clone.nature = this.nature;
							const skinKey = decadeUI?.config?.cardPrettify;
							if (!skinKey || skinKey === "off") return clone;
							const res = dui.statics.cards;
							const readOk = !!(res.READ_OK && res.READ_OK[skinKey]);
							if (!readOk) return clone;
							const skinCache = res[skinKey];
							let asset = skinCache && skinCache[clone.name];
							const fallbackMap = { bingkele: "decade", GoldCard: "caise" };
							const fallbackKey = fallbackMap[skinKey];
							const hasFallback = fallbackKey && cardSkinMeta[fallbackKey];
							if (asset && !asset.loaded && clone.classList.contains("decade-card")) {
								if (asset.loaded === undefined) {
									const image = asset.image;
									image.addEventListener("error", () => {
										if (hasFallback) {
											const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
											const fallbackAsset = fallbackCache[clone.name];
											if (fallbackAsset && fallbackAsset.loaded) {
												clone.style.background = `url("${fallbackAsset.url}")`;
											} else if (fallbackAsset && fallbackAsset.loaded === undefined) {
												const fallbackImage = fallbackAsset.image;
												if (fallbackImage) {
													fallbackImage.addEventListener("load", () => {
														clone.style.background = `url("${fallbackAsset.url}")`;
													});
													fallbackImage.addEventListener("error", () => {
														clone.style.background = asset.rawUrl;
														clone.classList.remove("decade-card");
													});
												} else {
													clone.style.background = asset.rawUrl;
													clone.classList.remove("decade-card");
												}
											} else {
												clone.style.background = asset.rawUrl;
												clone.classList.remove("decade-card");
											}
										} else {
											clone.style.background = asset.rawUrl;
											clone.classList.remove("decade-card");
										}
									});
								} else {
									if (hasFallback) {
										const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
										const fallbackAsset = fallbackCache[clone.name];
										if (fallbackAsset && fallbackAsset.loaded) {
											clone.style.background = `url("${fallbackAsset.url}")`;
										} else {
											clone.style.background = asset.rawUrl;
											clone.classList.remove("decade-card");
										}
									} else {
										clone.style.background = asset.rawUrl;
										clone.classList.remove("decade-card");
									}
								}
							} else if (!asset && hasFallback) {
								const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
								const fallbackAsset = fallbackCache[clone.name];
								if (fallbackAsset && fallbackAsset.loaded) {
									clone.style.background = `url("${fallbackAsset.url}")`;
									clone.classList.add("decade-card");
								}
							}
							return clone;
						},
						$init(card) {
							base.lib.element.card.$init.apply(this, arguments);
							this.node.range.innerHTML = "";
							const tags = Array.isArray(card[4]) ? [...card[4]] : [];
							if (this.cardid) {
								_status.cardtag = _status.cardtag || {};
								for (const i in _status.cardtag) {
									if (_status.cardtag[i].includes(this.cardid)) {
										tags.push(i);
									}
								}
								const uniqueTags = [...new Set(tags)];
								if (uniqueTags.length) {
									let tagstr = ' <span class="cardtag">';
									uniqueTags.forEach(tag => {
										_status.cardtag[tag] = _status.cardtag[tag] || [];
										if (!_status.cardtag[tag].includes(this.cardid)) {
											_status.cardtag[tag].push(this.cardid);
										}
										tagstr += lib.translate[tag + "_tag"];
									});
									tagstr += "</span>";
									this.node.range.innerHTML += tagstr;
								}
							}
							const verticalName = this.$vertname;
							this.$name.innerHTML = verticalName.innerHTML;
							const cardNumber = this.number;
							this.$suitnum.$num.innerHTML = (cardNumber !== 0 ? get.strNumber(cardNumber) : false) || cardNumber || "";
							this.$suitnum.$suit.innerHTML = get.translation((this.dataset.suit = this.suit));
							const equip = this.$equip;
							const innerHTML = equip.innerHTML;
							const spaceIdx = innerHTML.indexOf(" ");
							equip.$suitnum.innerHTML = innerHTML.slice(0, spaceIdx);
							equip.$name.innerHTML = innerHTML.slice(spaceIdx);
							const node = this.node;
							const background = node.background;
							node.judgeMark.node.judge.innerHTML = background.innerHTML;
							const classList = background.classList;
							if (classList.contains("tight")) classList.remove("tight");
							const cardStyle = this.style;
							if (cardStyle.color) cardStyle.removeProperty("color");
							if (cardStyle.textShadow) cardStyle.removeProperty("text-shadow");
							const info = node.info;
							const infoStyle = info.style;
							if (infoStyle.opacity) infoStyle.removeProperty("opacity");
							const verticalNameStyle = verticalName.style;
							if (verticalNameStyle.opacity) verticalNameStyle.removeProperty("opacity");
							if (info.childElementCount)
								while (info.firstChild) {
									info.removeChild(info.lastChild);
								}
							if (equip.childElementCount)
								while (equip.firstChild) {
									equip.removeChild(equip.lastChild);
								}
							const skinKey = decadeUI.config.cardPrettify;
							if (skinKey !== "off") {
								const skin = cardSkinMeta[skinKey];
								if (!skin) {
									this.classList.remove("decade-card");
									return this;
								}
								let filename = card[2];
								this.classList.add("decade-card");
								if (!this.classList.contains("infohidden")) {
									if (Array.isArray(card) && card[2] === "sha" && card[3] && !Array.isArray(card[3])) {
										filename += "_" + get.natureList(card[3]).sort(lib.sort.nature).join("_");
									}
									const res = dui.statics.cards;
									const skinCache = res[skinKey] || (res[skinKey] = {});
									let asset = skinCache[filename];
									const readOk = !!(res.READ_OK && res.READ_OK[skinKey]);
									const fallbackMap = { bingkele: "decade", GoldCard: "caise" };
									const fallbackKey = fallbackMap[skinKey];
									const hasFallback = fallbackKey && cardSkinMeta[fallbackKey];
									if (readOk) {
										if (asset === undefined) {
											if (hasFallback) {
												const fallbackCache = res[fallbackKey] || (res[fallbackKey] = {});
												const fallbackAsset = fallbackCache[filename];
												if (fallbackAsset && fallbackAsset.loaded) {
													this.style.background = `url("${fallbackAsset.url}")`;
												} else {
													this.classList.remove("decade-card");
												}
											} else {
												this.classList.remove("decade-card");
											}
										} else {
											this.style.background = `url("${asset.url}")`;
										}
									} else {
										const folder = skin.dir || skinKey;
										const extension = skin.extension || "png";
										const url = lib.assetURL + `extension/${decadeUIName}/image/card/${folder}/${filename}.${extension}`;
										if (!asset) {
											skinCache[filename] = asset = {
												name: filename,
												url: undefined,
												loaded: undefined,
												rawUrl: undefined,
											};
										}
										if (asset.loaded !== false) {
											if (asset.loaded === undefined) {
												const image = new Image();
												image.onload = function () {
													asset.loaded = true;
													image.onload = undefined;
												};
												const cardElem = this;
												image.onerror = function () {
													if (hasFallback) {
														const fallbackSkin = cardSkinMeta[fallbackKey];
														const fallbackFolder = fallbackSkin.dir || fallbackKey;
														const fallbackExtension = fallbackSkin.extension || "png";
														const fallbackUrl = lib.assetURL + `extension/${decadeUIName}/image/card/${fallbackFolder}/${filename}.${fallbackExtension}`;
														const fallbackImage = new Image();
														fallbackImage.onload = function () {
															asset.loaded = true;
															asset.url = fallbackUrl;
															cardElem.style.background = `url("${fallbackUrl}")`;
															fallbackImage.onload = undefined;
														};
														fallbackImage.onerror = function () {
															asset.loaded = false;
															fallbackImage.onerror = undefined;
															cardElem.style.background = asset.rawUrl;
															cardElem.classList.remove("decade-card");
														};
														fallbackImage.src = fallbackUrl;
													} else {
														asset.loaded = false;
														image.onerror = undefined;
														cardElem.style.background = asset.rawUrl;
														cardElem.classList.remove("decade-card");
													}
													image.onerror = undefined;
												};
												asset.url = url;
												asset.rawUrl = this.style.background || this.style.backgroundImage;
												asset.image = image;
												image.src = url;
											}
											this.style.background = `url("${url}")`;
										} else {
											this.classList.remove("decade-card");
										}
									}
								}
							} else {
								this.classList.remove("decade-card");
							}
							return this;
						},
						updateTransform(bool, delay) {
							if (delay) {
								setTimeout(() => {
									this.updateTransform(this.classList.contains("selected"));
								}, delay);
							} else {
								if (_status.event.player != game.me) return;
								if (this._transform && this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.parentNode == ui.me && (!_status.mousedown || _status.mouseleft)) {
									if (bool) {
										const offset = decadeUI.isMobile() ? 10 : 12;
										this.style.transform = `${this._transform} translateY(-${offset}px)`;
									} else {
										this.style.transform = this._transform || "";
									}
								}
							}
						},
						moveTo(player) {
							if (!player) return;
							if (this.name && (this.name.startsWith("shengbei_left_") || this.name.startsWith("shengbei_right_"))) {
								return this;
							}
							const arena = dui.boundsCaches.arena;
							if (!arena.updated) arena.update();
							player.checkBoundsCache();
							this.fixed = true;
							const x = Math.round((player.cacheWidth - arena.cardWidth) / 2 + player.cacheLeft);
							const y = Math.round((player.cacheHeight - arena.cardHeight) / 2 + player.cacheTop);
							const scale = arena.cardScale;
							this.tx = x;
							this.ty = y;
							this.scaled = true;
							this.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
							return this;
						},
						moveDelete(player) {
							this.fixed = true;
							if (this.name && (this.name.startsWith("shengbei_left_") || this.name.startsWith("shengbei_right_"))) {
								setTimeout(() => {
									this.delete();
								}, 460);
							} else {
								this.moveTo(player);
								setTimeout(() => {
									this.delete();
								}, 460);
							}
						},
					},
					control: {
						add(item) {
							const node = document.createElement("div");
							node.link = item;
							node.innerHTML = get.translation(item);
							node.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
							this.appendChild(node);
							this.updateLayout();
						},
						open() {
							ui.control.insertBefore(this, _status.createControl || ui.confirm);
							ui.controls.unshift(this);
							return this;
						},
						close() {
							this.remove();
							ui.controls.remove(this);
							if (ui.confirm == this) ui.confirm = null;
							if (ui.skills == this) ui.skills = null;
							if (ui.skills2 == this) ui.skills2 = null;
							if (ui.skills3 == this) ui.skills3 = null;
						},
						replace() {
							const items = Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments);
							let index = 0;
							const nodes = this.childNodes;
							this.custom = undefined;
							for (let i = 0; i < items.length; i++) {
								if (typeof items[i] === "function") {
									this.custom = items[i];
								} else {
									if (index < nodes.length) {
										nodes[i].link = items[i];
										nodes[i].innerHTML = get.translation(items[i]);
									} else {
										this.add(items[i]);
									}
									index++;
								}
							}
							while (index < nodes.length) {
								nodes[index].remove();
							}
							this.updateLayout();
							ui.updatec();
							return this;
						},
						updateLayout() {
							const nodes = this.childNodes;
							if (nodes.length >= 2) {
								this.classList.add("combo-control");
								for (const node of nodes) node.classList.add("control");
							} else {
								this.classList.remove("combo-control");
								if (nodes.length === 1) nodes[0].classList.remove("control");
							}
						},
					},
					player: {
						addSkill(skill) {
							const result = base.lib.element.player.addSkill.apply(this, arguments);
							if (!Array.isArray(result)) {
								const skills = ["name", "name1", "name2"].reduce((list, name) => {
									if (this[name] && (name != "name1" || this.name != this.name1)) {
										list.addArray(get.character(this[name], 3) || []);
									}
									return list;
								}, []);
								if (!skills.includes(result)) {
									const info = get.info(result);
									if (!(!info || info.nopop || !get.translation(result + "_info") || !lib.translate[result + "_info"])) this.node.gainSkill.gain(result);
								}
							}
							[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
							return result;
						},
						removeSkill(skill) {
							const result = base.lib.element.player.removeSkill.apply(this, arguments);
							if (!Array.isArray(result)) {
								if (this.node.gainSkill.skills && this.node.gainSkill.skills.includes(result)) {
									this.node.gainSkill.lose(result);
								}
							}
							[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
							return result;
						},
						awakenSkill(skill) {
							const result = base.lib.element.player.awakenSkill.apply(this, arguments);
							ui.updateSkillControl(this);
							if (get.info(skill)?.dutySkill) {
								const that = this;
								game.expandSkills([skill]).forEach(taofen => that.shixiaoSkill(taofen));
							}
							const fname = _status.event.getParent()?.skill;
							if (fname?.endsWith("_fail") && fname?.slice(0, -5) == skill) {
								this.failSkill(skill);
							}
							return result;
						},
						setIdentity(identity) {
							identity = identity || this.identity;
							this.node.identity.dataset.color = identity;
							if (get.mode() == "guozhan") {
								if (identity == "ye" && get.is.jun(this)) this.identity = identity = lib.character[this.name1][1];
								this.group = identity;
								this.node.identity.firstChild.innerHTML = get.translation(identity);
								return this;
							}
							if (get.is.jun(this)) {
								this.node.identity.firstChild.innerHTML = "君";
							} else {
								this.node.identity.firstChild.innerHTML = get.translation(identity);
							}
							return this;
						},
						getState() {
							const state = base.lib.element.player.getState.apply(this, arguments);
							state.seat = this.seat;
							return state;
						},
						mark(item, info, skill) {
							if (item && lib.config.extension_十周年UI_newDecadeStyle != "Off") {
								const info = get.info(item);
								if (info && (info.zhuanhuanji || info.zhuanhuanji2 || info.limited)) return;
							}
							if (item && typeof item === "string" && item.startsWith("xinfu_falu_")) {
								if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									return;
								}
							}
							if (item && typeof item === "string" && item.startsWith("starcanxi_") && item !== "starcanxi_wangsheng" && item !== "starcanxi_xiangsi" && item !== "starcanxi_cancel") {
								if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									return;
								}
							}
							if (get.itemtype(item) === "cards") {
								const marks = [];
								for (const card of item) marks.push(this.mark(card, info));
								return marks;
							}
							let mark;
							if (get.itemtype(item) === "card") {
								mark = item.copy("mark");
								mark.suit = item.suit;
								mark.number = item.number;
								if (item.classList.contains("fullborder")) {
									mark.classList.add("fakejudge");
									mark.classList.add("fakemark");
									if (!mark.node.mark) mark.node.mark = mark.querySelector(".mark-text") || decadeUI.element.create("mark-text", mark);
									mark.node.mark.innerHTML = lib.translate[name.name + "_bg"] || get.translation(name.name)[0];
								}
								item = item.name;
							} else {
								mark = ui.create.div(".card.mark");
								let markText = lib.translate[item + "_bg"];
								if (!markText || markText[0] == "+" || markText[0] == "-") {
									markText = get.translation(item).slice(0, 2);
									if (decadeUI.config.playerMarkStyle != "decade") {
										markText = markText[0];
									}
								}
								mark.text = decadeUI.element.create("mark-text", mark);
								if (lib.skill[item] && lib.skill[item].markimage) {
									markText = "　";
									mark.text.style.animation = "none";
									mark.text.setBackgroundImage(lib.skill[item].markimage);
									mark.text.style["box-shadow"] = "none";
									mark.text.style.backgroundPosition = "center";
									mark.text.style.backgroundSize = "contain";
									mark.text.style.backgroundRepeat = "no-repeat";
									mark.text.classList.add("before-hidden");
								} else if (markText.length == 2) mark.text.classList.add("small-text");
								if (lib.skill[item] && lib.skill[item].zhuanhuanji) {
									mark.text.style.animation = "none";
									mark.text.classList.add("before-hidden");
								}
								if (markText && markText.includes("☯")) {
									mark.style.setProperty("display", "none", "important");
								}
								mark.text.innerHTML = markText;
							}
							mark.name = item;
							mark.skill = skill || item;
							if (!mark.classList.contains("own-skill") && !mark.classList.contains("other-skill")) {
								const skillIntro = lib.skill[mark.skill]?.intro;
								const hasCardDisplay = typeof skillIntro?.mark === "function" || ["expansion", "card", "cards"].includes(skillIntro?.content);
								mark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
							}
							if (typeof info == "object") {
								mark.info = info;
							} else if (typeof info == "string") {
								mark.markidentifer = info;
							}
							mark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
							if (!lib.config.touchscreen) {
								if (lib.config.hover_all) {
									lib.setHover(mark, ui.click.hoverplayer);
								}
								if (lib.config.right_info) {
									mark.oncontextmenu = ui.click.rightplayer;
								}
							}
							this.node.marks.appendChild(mark);
							this.updateMarks();
							ui.updatem(this);
							return mark;
						},
						markSkill(name, info, card, nobroadcast) {
							if (name && lib.config.extension_十周年UI_newDecadeStyle != "Off") {
								const info = get.info(name);
								if (info && (info.zhuanhuanji || info.zhuanhuanji2 || info.limited)) return;
							}
							if (name && typeof name === "string" && name.startsWith("xinfu_falu_")) {
								if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									return;
								}
							}
							if (name && typeof name === "string" && name.startsWith("starcanxi_") && name !== "starcanxi_wangsheng" && name !== "starcanxi_xiangsi" && name !== "starcanxi_cancel") {
								if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									return;
								}
							}
							return base.lib.element.player.markSkill.apply(this, arguments);
						},
						unmarkSkill(name, info, card, nobroadcast) {
							if (name && lib.config.extension_十周年UI_newDecadeStyle != "Off") {
								const info = get.info(name);
								if (info && (info.zhuanhuanji || info.zhuanhuanji2 || info.limited)) return;
							}
							if (name && typeof name === "string" && name.startsWith("xinfu_falu_")) {
								if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									return;
								}
							}
							if (name && typeof name === "string" && name.startsWith("starcanxi_") && name !== "starcanxi_wangsheng" && name !== "starcanxi_xiangsi" && name !== "starcanxi_cancel") {
								if (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									return;
								}
							}
							return base.lib.element.player.unmarkSkill.apply(this, arguments);
						},
						markCharacter(name, info, learn, learn2) {
							if (typeof name == "object") name = name.name;
							const nodeMark = ui.create.div(".card.mark");
							const nodeMarkText = ui.create.div(".mark-text", nodeMark);
							if (!info) info = {};
							if (!info.name) info.name = get.translation(name);
							if (!info.content) info.content = get.skillintro(name, learn, learn2);
							if (name.startsWith("unknown")) {
								const unknownText = get.translation(name)[0];
								if (unknownText && unknownText.includes("☯")) {
									nodeMark.style.setProperty("display", "none", "important");
								}
								nodeMarkText.innerHTML = unknownText;
							} else {
								if (!get.character(name)) return console.error(name);
								const text = info.name.slice(0, 2);
								if (text.length == 2) nodeMarkText.classList.add("small-text");
								if (text && text.includes("☯")) {
									nodeMark.style.setProperty("display", "none", "important");
								}
								nodeMarkText.innerHTML = text;
							}
							nodeMark.name = name + "_charactermark";
							nodeMark.info = info;
							nodeMark.text = nodeMarkText;
							const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
							nodeMark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
							nodeMark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
							if (!lib.config.touchscreen) {
								if (lib.config.hover_all) {
									lib.setHover(nodeMark, ui.click.hoverplayer);
								}
								if (lib.config.right_info) {
									nodeMark.oncontextmenu = ui.click.rightplayer;
								}
							}
							this.node.marks.appendChild(nodeMark);
							ui.updatem(this);
							return nodeMark;
						},
						markSkillCharacter(id, target, name, content) {
							if (typeof target == "object") target = target.name;
							game.broadcastAll(
								function (player, target, name, content, id) {
									if (player.marks[id]) {
										player.marks[id].name = name + "_skillmark";
										player.marks[id].info = {
											name: name,
											content: content,
											id: id,
										};
										const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
										player.marks[id].classList.remove("own-skill", "other-skill");
										player.marks[id].classList.add(hasCardDisplay ? "other-skill" : "own-skill");
										game.addVideo("changeMarkCharacter", player, {
											id: id,
											name: name,
											content: content,
											target: target,
										});
									} else {
										const nodeMark = ui.create.div(".card.mark");
										const nodeMarkText = ui.create.div(".mark-text", nodeMark);
										const skillName = get.translation(name);
										const text = skillName.slice(0, 2);
										if (text.length == 2) nodeMarkText.classList.add("small-text");
										if (text && text.includes("☯")) {
											nodeMark.style.setProperty("display", "none", "important");
										}
										nodeMarkText.innerHTML = text;
										nodeMark.name = name + "_skillmark";
										nodeMark.info = {
											name: name,
											content: content,
											id: id,
										};
										nodeMark.text = nodeMarkText;
										const hasCardDisplay = typeof lib.skill[name]?.intro?.mark === "function";
										nodeMark.classList.add(hasCardDisplay ? "other-skill" : "own-skill");
										nodeMark.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
										if (!lib.config.touchscreen) {
											if (lib.config.hover_all) {
												lib.setHover(nodeMark, ui.click.hoverplayer);
											}
											if (lib.config.right_info) {
												nodeMark.oncontextmenu = ui.click.rightplayer;
											}
										}
										player.node.marks.appendChild(nodeMark);
										player.marks[id] = nodeMark;
										game.addVideo("markCharacter", player, {
											name: name,
											content: content,
											id: id,
											target: target,
										});
									}
									player.marks[id].classList.add("skillmark");
									player.marks[id]._name = name;
									ui.updatem(player);
								},
								this,
								target,
								name,
								content,
								id
							);
							return this;
						},
						playDynamic(animation, deputy) {
							deputy = deputy === true;
							if (animation === undefined) return console.error("playDynamic: 参数1不能为空");
							let dynamic = this.dynamic;
							if (!dynamic) {
								dynamic = new duilib.DynamicPlayer("assets/dynamic/");
								dynamic.dprAdaptive = true;
								this.dynamic = dynamic;
								this.$dynamicWrap.appendChild(dynamic.canvas);
							} else {
								if (deputy && dynamic.deputy) {
									dynamic.stop(dynamic.deputy);
									dynamic.deputy = null;
								} else if (dynamic.primary) {
									dynamic.stop(dynamic.primary);
									dynamic.primary = null;
								}
							}
							if (typeof animation == "string")
								animation = {
									name: animation,
								};
							if (this.doubleAvatar) {
								if (Array.isArray(animation.x)) {
									animation.x = [...animation.x];
									animation.x[1] += deputy ? 0.25 : -0.25;
								} else {
									if (animation.x === undefined) {
										animation.x = [0, deputy ? 0.75 : 0.25];
									} else {
										animation.x = [animation.x, deputy ? 0.25 : -0.25];
									}
								}
								animation.clip = {
									x: [0, deputy ? 0.5 : 0],
									y: 0,
									width: [0, 0.5],
									height: [0, 1],
									clipParent: true,
								};
							}
							if (this.$dynamicWrap.parentNode != this) this.appendChild(this.$dynamicWrap);
							dynamic.outcropMask = duicfg.dynamicSkinOutcrop;
							const avatar = dynamic.play(animation);
							if (deputy === true) {
								dynamic.deputy = avatar;
							} else {
								dynamic.primary = avatar;
							}
							this.classList.add(deputy ? "d-skin2" : "d-skin");
						},
						stopDynamic(primary, deputy) {
							const dynamic = this.dynamic;
							if (!dynamic) return;
							primary = primary === true;
							deputy = deputy === true;
							if (primary && dynamic.primary) {
								dynamic.stop(dynamic.primary);
								dynamic.primary = null;
							} else if (deputy && dynamic.deputy) {
								dynamic.stop(dynamic.deputy);
								dynamic.deputy = null;
							} else if (!primary && !deputy) {
								dynamic.stopAll();
								dynamic.primary = null;
								dynamic.deputy = null;
							}
							if (!dynamic.primary && !dynamic.deputy) {
								this.classList.remove("d-skin");
								this.classList.remove("d-skin2");
								this.$dynamicWrap.remove();
							}
						},
						async reinitCharacter(from, to, log) {
							this.stopDynamic();
							const result = base.lib.element.player.reinitCharacter.apply(this, arguments);
							await Promise.resolve(result);
							this._decadeUIApplyDynamicSkin();
							return result;
						},
						_decadeUIApplyDynamicSkin() {
							if (typeof game.qhly_changeDynamicSkin === "function") {
								this.name1 && game.qhly_changeDynamicSkin(this, undefined, this.name1, false, true);
								this.doubleAvatar && this.name2 && game.qhly_changeDynamicSkin(this, undefined, this.name2, true, true);
								return;
							}
							if (!duicfg.dynamicSkin || _status.mode == null) return;
							decadeUI.CUR_DYNAMIC ??= 0;
							decadeUI.MAX_DYNAMIC ??= (decadeUI.isMobile() ? 2 : 10) + (window.OffscreenCanvas ? 8 : 0);
							if (!this.dynamic && decadeUI.CUR_DYNAMIC >= decadeUI.MAX_DYNAMIC) return;
							const dskins = decadeUI.dynamicSkin;
							if (!dskins) return;
							const avatars = this.doubleAvatar && this.name2 ? [this.name1, this.name2] : [this.name1];
							let increased = false;
							avatars.forEach((name, i) => {
								const skins = dskins[name];
								if (!skins) return;
								const skinKeys = Object.keys(skins);
								if (!skinKeys.length) return;
								const skin = skins[skinKeys[0]];
								if (!skin?.name) return;
								const animation = {
									name: skin.name,
									action: skin.action,
									loop: true,
									loopCount: -1,
									speed: skin.speed ?? 1,
									filpX: skin.filpX,
									filpY: skin.filpY,
									opacity: skin.opacity,
									x: skin.x,
									y: skin.y,
									scale: skin.scale,
									angle: skin.angle,
									hideSlots: skin.hideSlots,
									clipSlots: skin.clipSlots,
								};
								if (skin.player || skin._transform !== undefined) {
									animation.player = {
										...(skin.player || {}),
										...(skin._transform !== undefined && { _transform: skin._transform }),
									};
								}
								this.playDynamic(animation, i === 1);
								if (skin.background) {
									this.$dynamicWrap.style.backgroundImage = `url("${decadeUIPath}assets/dynamic/${skin.background}")`;
								} else {
									this.$dynamicWrap.style.removeProperty("background-image");
								}
								if (!increased) {
									increased = true;
									decadeUI.CUR_DYNAMIC++;
								}
							});
						},
						say(str) {
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
									if (decadeUI.config.newDecadeStyle === "off" || decadeUI.config.newDecadeStyle === "on" || decadeUI.config.newDecadeStyle === "othersOff") {
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
							if (lib.config.background_speak && lib.quickVoice.includes(str)) {
								game.playAudio("voice", this.sex === "female" ? "female" : "male", lib.quickVoice.indexOf(str));
							}
						},
						updateMark(name, storage) {
							if (!this.marks[name]) {
								if (lib.skill[name] && lib.skill[name].intro && (this.storage[name] || lib.skill[name].intro.markcount)) {
									this.markSkill(name);
									if (!this.marks[name]) return this;
								} else {
									return this;
								}
							}
							const mark = this.marks[name];
							if (storage && this.storage[name]) this.syncStorage(name);
							if (lib.skill[name] && lib.skill[name].intro && !lib.skill[name].intro.nocount && (this.storage[name] || lib.skill[name].intro.markcount)) {
								let num = 0;
								if (typeof lib.skill[name].intro.markcount == "function") {
									num = lib.skill[name].intro.markcount(this.storage[name], this, name);
								} else if (lib.skill[name].intro.markcount == "expansion") {
									num = this.countCards("x", card => card.hasGaintag(name));
								} else if (typeof this.storage[name + "_markcount"] == "number") {
									num = this.storage[name + "_markcount"];
								} else if (name == "ghujia") {
									num = this.hujia;
								} else if (typeof this.storage[name] == "number") {
									num = this.storage[name];
								} else if (Array.isArray(this.storage[name])) {
									num = this.storage[name].length;
								}
								if (num /* && num !== 1*/) {
									if (!mark.markcount) mark.markcount = decadeUI.element.create("mark-count", mark);
									mark.markcount.textContent = num;
								} else if (mark.markcount) {
									mark.markcount.delete();
									mark.markcount = undefined;
								}
							} else {
								if (mark.markcount) {
									mark.markcount.delete();
									mark.markcount = undefined;
								}
								if (lib.skill[name].mark == "auto") {
									this.unmarkSkill(name);
								}
							}
							return this;
						},
						$dieAfter() {
							this.node.gainSkill.innerHTML = null;
							if (!this.node.dieidentity) this.node.dieidentity = ui.create.div("died-identity", this);
							this.node.dieidentity.classList.add("died-identity");
							const that = this;
							const image = new Image();
							const identity = decadeUI.getPlayerIdentity(this);
							const goon = decadeUI.config.newDecadeStyle === "on" || decadeUI.config.newDecadeStyle === "othersOff";

							// 为onlineUI样式设置单独的路径判断
							let url;
							if (decadeUI.config.newDecadeStyle === "onlineUI") {
								url = `${decadeUIPath}image/decorationo/dead4_${identity}.png`;
							} else if (decadeUI.config.newDecadeStyle === "babysha") {
								url = `${decadeUIPath}image/decorationh/dead3_${identity}.png`;
							} else if (decadeUI.config.newDecadeStyle === "codename") {
								url = `${decadeUIPath}image/decoration_code/dead_${identity}.png`;
							} else if (goon) {
								url = `${decadeUIPath}image/decoration/dead_${identity}.png`;
							} else {
								if (this != game.me) {
									url = `${decadeUIPath}image/decorations/dead2_${identity}.png`;
								} else {
									url = `${decadeUIPath}image/decorations/dead2_me.png`;
								}
							}
							image.onerror = () => {
								that.node.dieidentity.innerHTML = `${decadeUI.getPlayerIdentity(that, that.identity, true)}<br>阵亡`;
							};

							// 离开效果仅在移动版样式下启用
							if ((that._trueMe || that) != game.me && that != game.me && lib.config.extension_十周年UI_newDecadeStyle === "off") {
								that.node.dieidentity.innerHTML = `<div style="width:21px; height:81px; left:22.5px; top:-12px; position:absolute; background-image: url(${lib.assetURL}extension/十周年UI/assets/image/likai.png);background-size: 100% 100%;"></div>`;
							} else {
								that.node.dieidentity.innerHTML = "";
							}
							that.node.dieidentity.style.backgroundImage = 'url("' + url + '")';
							image.src = url;
							setTimeout(() => {
								const rect = that.getBoundingClientRect();
								decadeUI.animation.playSpine("effect_zhenwang", {
									parent: that,
									scale: 0.8,
								});
							}, 250);
						},
						$skill(name, type, color, avatar) {
							const _this = this;
							if (typeof type != "string") type = "legend";
							game.addVideo("skill", this, [name, type, color, avatar]);
							game.broadcastAll(
								function (player, type, name, color, avatar) {
									if (window.decadeUI == void 0) {
										game.delay(2.5);
										if (name) player.$fullscreenpop(name, color, avatar);
										return;
									}
									decadeUI.delay(2500);
									if (name) decadeUI.effect.skill(player, name, avatar);
								},
								_this,
								type,
								name,
								color,
								avatar
							);
						},
						$syncExpand(map) {
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
						},
						_addPrefixSeparator(nameNode) {
							if (lib.config.extension_十周年UI_newDecadeStyle !== "off" || !nameNode) return;
							setTimeout(() => {
								if (!nameNode) return;
								const children = Array.from(nameNode.childNodes);
								for (let i = 0; i < children.length - 1; i++) {
									const current = children[i];
									const next = children[i + 1];
									if (current.nodeType === Node.ELEMENT_NODE && next.nodeType === Node.TEXT_NODE && next.textContent.trim() && !next.textContent.startsWith("•")) {
										next.textContent = "•" + next.textContent;
										return;
									}
								}
								if (nameNode.firstChild && nameNode.firstChild.nodeType === Node.ELEMENT_NODE && nameNode.childNodes.length > 1) {
									const separator = document.createTextNode("•");
									nameNode.insertBefore(separator, nameNode.childNodes[1]);
								}
							}, 0);
						},
						$init(character, character2) {
							base.lib.element.player.$init.apply(this, arguments);
							this.doubleAvatar = (character2 && lib.character[character2]) !== undefined;

							// 在othersOff一将成名样式下，检查武将原画是否存在，如果不存在则添加•体验后缀
							if (lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
								this.checkAndAddExperienceSuffix(character);
								if (character2) {
									this.checkAndAddExperienceSuffix(character2);
								}
							}
							const borderLevel = lib.config.extension_十周年UI_borderLevel;
							if (borderLevel === "random") {
								const levels = ["one", "two", "three", "four", "five"];
								this.dataset.borderLevel = levels[Math.floor(Math.random() * levels.length)];
							} else {
								delete this.dataset.borderLevel;
							}
							let CUR_DYNAMIC = decadeUI.CUR_DYNAMIC;
							let MAX_DYNAMIC = decadeUI.MAX_DYNAMIC;
							if (CUR_DYNAMIC === undefined) {
								CUR_DYNAMIC = 0;
								decadeUI.CUR_DYNAMIC = CUR_DYNAMIC;
							}
							if (MAX_DYNAMIC === undefined) {
								MAX_DYNAMIC = decadeUI.isMobile() ? 2 : 10;
								if (window.OffscreenCanvas) MAX_DYNAMIC += 8;
								decadeUI.MAX_DYNAMIC = MAX_DYNAMIC;
							}
							if (this.dynamic) this.stopDynamic();
							const showDynamic = (this.dynamic || CUR_DYNAMIC < MAX_DYNAMIC) && duicfg.dynamicSkin;
							if (showDynamic && _status.mode !== null) {
								const dskins = decadeUI.dynamicSkin;
								const avatars = this.doubleAvatar ? [character, character2] : [character];
								let increased;
								for (let i = 0; i < avatars.length; i++) {
									const skins = dskins[avatars[i]];
									if (skins === undefined) continue;
									const keys = Object.keys(skins);
									if (keys.length === 0) {
										console.error(`player.init: ${avatars[i]} 没有设置动皮参数`);
										continue;
									}
									const skin = skins[Object.keys(skins)[0]];
									if (skin.speed === undefined) skin.speed = 1;
									this.playDynamic(
										{
											name: skin.name, //	string 骨骼文件名，一般是assets/dynamic 下的动皮文件，也可以使用.. 来寻找其他文件目录
											action: skin.action, // string 播放动作 不填为默认
											loop: true, // boolean 是否循环播放
											loopCount: -1, // number 循环次数，只有loop为true时生效
											speed: skin.speed, // number 播放速度
											filpX: undefined, // boolean 水平镜像
											filpY: undefined, // boolean 垂直翻转
											opacity: undefined, // 0~1		不透明度
											x: skin.x, // 相对于父节点坐标x，不填为居中
											// (1) x: 10, 相当于 left: 10px；
											// (2) x: [10, 0.5], 相当于 left: calc(50% + 10px)；
											y: skin.y, // 相对于父节点坐标y，不填为居中
											// (1) y: 10，相当于 top: 10px；
											// (2) y: [10, 0.5]，相当于 top: calc(50% + 10px)；
											scale: skin.scale, // 缩放
											angle: skin.angle, // 角度
											hideSlots: skin.hideSlots, // 隐藏不需要的部件，想知道具体部件名称请使用SpineAltasSplit工具查看
											clipSlots: skin.clipSlots, // 剪掉超出头的部件，仅针对露头动皮，其他勿用
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
								player.node.showCards = createElement("div", {
									class: ["handdisplays"],
									parentNode: player,
								}).hide();

								// 自动检测武将牌位置，决定显示区域左右
								(function adjustShowCardsPosition() {
									const rect = player.getBoundingClientRect();
									const winWidth = window.innerWidth || document.documentElement.clientWidth;
									const showCards = player.node.showCards;
									const offset = 10;

									// babysha样式下，武将牌靠左就左边显示，靠右就右边显示
									if (lib.config.extension_十周年UI_newDecadeStyle === "babysha") {
										if (rect.left < winWidth / 2) {
											showCards.style.left = "";
											showCards.style.right = player.offsetWidth + offset + "px";
										} else {
											showCards.style.left = player.offsetWidth + offset + "px";
											showCards.style.right = "";
										}
									} else {
										// 其他样式保持原有逻辑
										if (rect.left < winWidth / 2) {
											showCards.style.left = player.offsetWidth + offset + "px";
											showCards.style.right = "";
										} else {
											showCards.style.left = "";
											showCards.style.right = player.offsetWidth + offset + "px";
										}
									}
									showCards.style.top = "90px";
								})();
								player.node.showCards.onclick = function () {
									const cards = player.getCards("h", c => get.is.shownCard(c) || player.isUnderControl(true) || game.me?.hasSkillTag("viewHandcard", null, player, true));
									if (cards.length > 0) {
										const Fool_popup = ui.create.div(".popup-container", ui.window);
										const handdisplay = ui.create.dialog(get.translation(player) + "的手牌", cards);
										handdisplay.static = true;
										Fool_popup.addEventListener("click", () => {
											Fool_popup.delete();
											handdisplay.close();
											handdisplay.delete();
										});
									}
								};

								// 边界修正
								const _rect = player.node.showCards.getBoundingClientRect();
								if (_rect.left <= 10 && !player.node.showCards.classList.contains("hidden")) {
									if (lib.config.extension_十周年UI_newDecadeStyle === "babysha") {
										const left = player.offsetWidth + 10;
										player.node.showCards.style.left = left + "px";
										player.node.showCards.style.right = "";
									} else {
										const left = lib.config.extension_十周年UI_enable && lib.config.extension_十周年UI_newDecadeStyle == "on" ? player.offsetWidth + 10 : player.offsetWidth + 5;
										player.node.showCards.style.left = left + "px";
									}
									player.node.showCards.style.top = "90px";
								}

								// 鼠标悬停/触摸事件
								player.node.showCards.onmouseover = player.node.showCards.ontouchend = function (e) {
									const cards = player.getCards("h");
									if (!cards.length) return;
									cards.forEach(c => {
										c.copy()._customintro = c._customintro;
									});
									if (e.type == "mouseover") {
										player.node.showCards.onmouseleave = function () {};
									} else {
										ui.window.addEventListener("touchend", function touch() {}, { once: true });
									}
								};

								// 监听手牌区变化
								["handcards1", "handcards2"].forEach(handcardZone => {
									const observer = new MutationObserver(mutationsList => {
										for (let mutation of mutationsList) {
											if (mutation.type === "childList") {
												const added = mutation.addedNodes.length > 0;
												const removed = mutation.removedNodes.length > 0;
												if (added || removed) player.decadeUI_updateShowCards();
											}
										}
									});
									observer.observe(player.node[handcardZone], { childList: true });
								});
							}

							// 十周年角标
							if (window.decadeModule && window.decadeModule.prefixMark) {
								window.decadeModule.prefixMark.showPrefixMark(character, this);
								if (character2 && this.doubleAvatar) {
									window.decadeModule.prefixMark.showPrefixMark(character2, this);
								}
							}

							this._addPrefixSeparator(this.node.name);
							if (this.doubleAvatar && this.node.name2) {
								this._addPrefixSeparator(this.node.name2);
							}

							const cardPrettify = lib.config.extension_十周年UI_cardPrettify;
							if (cardPrettify === "bingkele" && character === "bozai") {
								this.node.avatar.setBackgroundImage("extension/十周年UI/image/bingkele.png");
								if (this.node.name) {
									this.node.name.innerHTML = "冰可乐喵";
								}
							}

							// 刷新显示
							this.decadeUI_updateShowCards();
							return this;
						},
						$uninit() {
							// 清理所有前缀标记
							if (window.decadeModule && window.decadeModule.prefixMark) {
								window.decadeModule.prefixMark.clearPrefixMarks(this);
							}
							this.stopDynamic();
							this.doubleAvatar = false;
							delete this.node.campWrap.dataset.camp;
							const campName = this.node.campWrap.node.campName;
							while (campName.firstChild) {
								campName.removeChild(campName.lastChild);
							}
							campName.style.removeProperty("background-image");
							const hujiat = this.node.hpWrap.querySelector(".hujia");
							if (hujiat) hujiat.remove();
							this.node.showCards?.hide();
							base.lib.element.player.$uninit.apply(this, arguments);
							return this;
						},
						$reinit(from, to, maxHp, online) {
							base.lib.element.player.$reinit.apply(this, arguments);
							if (window.decadeModule && window.decadeModule.prefixMark) {
								window.decadeModule.prefixMark.clearPrefixMarks(this);
								const currentCharacter = this.name1 || this.name;
								if (currentCharacter) {
									window.decadeModule.prefixMark.showPrefixMark(currentCharacter, this);
								}
								if (this.doubleAvatar && this.name2) {
									window.decadeModule.prefixMark.showPrefixMark(this.name2, this);
								}
							}
							this._addPrefixSeparator(this.node.name);
							if (this.doubleAvatar && this.node.name2) {
								this._addPrefixSeparator(this.node.name2);
							}
							return this;
						},
						setSeatNum() {
							base.lib.element.player.setSeatNum.apply(this, arguments);
							this.seat = this.getSeatNum();
							game.broadcastAll(function (player) {
								const actualSeat = player.getSeatNum ? player.getSeatNum() : player.seat;
								if (!player.node.seat) {
									player.node.seat = decadeUI.element.create("seat", player);
								}
								player.node.seat.innerHTML = get.cnNumber(actualSeat, true);
							}, this);
						},
						checkAndAddExperienceSuffix(characterName) {
							const name = characterName;
							const nameinfo = get.character(name);
							if (!nameinfo) return;
							let src = null;
							let extimage = null;
							let dbimage = null;
							let modeimage = null;
							let gzbool = false;
							let imgPrefixUrl = null;
							let realName = name;
							const mode = get.mode();
							const addExperienceSuffix = () => {
								if (this.node?.name) {
									const currentName = this.node.name.innerHTML;
									if (!currentName.includes("•体验")) this.node.name.innerHTML = currentName + "•体验";
								}
							};
							if (lib.characterPack[`mode_${mode}`] && lib.characterPack[`mode_${mode}`][realName]) {
								if (mode === "guozhan") {
									if (realName.startsWith("gz_shibing")) {
										realName = realName.slice(3, 11);
									} else {
										if (lib.config.mode_config.guozhan?.guozhanSkin && nameinfo && nameinfo.hasSkinInGuozhan) gzbool = true;
										realName = realName.slice(3);
									}
								} else {
									modeimage = mode;
								}
							} else if (realName.includes("::")) {
								const arr = realName.split("::");
								modeimage = arr[0];
								realName = arr[1];
							}
							if (!modeimage && nameinfo) {
								if (nameinfo.img) {
									imgPrefixUrl = nameinfo.img;
								} else if (nameinfo.trashBin) {
									for (const value of nameinfo.trashBin) {
										if (typeof value !== "string") continue;
										const colonIndex = value.indexOf(":");
										if (colonIndex <= 0) continue;
										const prefix = value.slice(0, colonIndex);
										const payload = value.slice(colonIndex + 1);
										const handle = {
											img: () => (imgPrefixUrl = payload),
											ext: () => (extimage = value),
											db: () => (dbimage = value),
											mode: () => (modeimage = payload),
											character: () => (realName = payload),
										}[prefix];
										if (handle) handle();
										if (imgPrefixUrl || extimage || dbimage || modeimage || realName !== name) break;
									}
								}
							}
							if (imgPrefixUrl) {
								src = imgPrefixUrl;
							} else if (extimage) {
								src = extimage.replace(/^ext:/, "extension/");
							} else if (dbimage) {
								game.getDB("image", dbimage.slice(3))
									.then(() => {
										return;
									})
									.catch(() => {
										addExperienceSuffix();
									});
								return;
							} else if (modeimage) {
								src = `image/mode/${modeimage}/character/${realName}.jpg`;
							} else if (lib.config.skin[realName] && arguments[2] !== "noskin") {
								src = `image/skin/${realName}/${lib.config.skin[realName]}.jpg`;
							} else {
								src = `image/character/${gzbool ? "gz_" : ""}${realName}.jpg`;
							}

							const testImg = new Image();
							testImg.onerror = () => {
								addExperienceSuffix();
							};
							testImg.src = URL.canParse(src) ? src : lib.assetURL + src;
						},
						$update() {
							base.lib.element.player.$update.apply(this, arguments);

							// 护甲显示修改
							let hujiat = this.node.hpWrap.querySelector(".hujia");
							if (this.hujia > 0) {
								if (!hujiat) {
									hujiat = ui.create.div(".hujia");
									this.node.hpWrap.appendChild(hujiat);
								}
								hujiat.innerText = this.hujia == Infinity ? "∞" : this.hujia;
							} else if (hujiat) hujiat.remove();

							// 体力条显示修改
							const hidden = this.classList.contains("unseen_show") || this.classList.contains("unseen2_show");
							let hp = this.hp,
								hpMax = hidden ? 1 : this.maxHp,
								hpNode = this.node.hp;
							const goon = hpMax > 5 || (this.hujia && hpMax > 3);
							if (!this.storage.nohp) {
								if (goon) {
									hpNode.innerHTML = (isNaN(hp) ? "×" : hp == Infinity ? "∞" : hp) + "<br>/<br>" + (isNaN(hpMax) ? "×" : hpMax == Infinity ? "∞" : hpMax) + "<div></div>";
									if (hp == 0) hpNode.lastChild.classList.add("lost");
									hpNode.classList.add("textstyle");
								}
							}
							this.dataset.maxHp = goon ? 4 : hpMax;

							// 手牌数显示修改
							let count = this.countCards("h");
							if (this == game.me) {
								const currentStyle = lib.config.extension_十周年UI_newDecadeStyle;
								if (currentStyle === "onlineUI" || currentStyle === "babysha" || currentStyle === "codename") {
									this.node.count.innerHTML = count + "/" + this.getHandcardLimit();
								} else {
									this.node.count.innerHTML = count;
								}
							} else if (count >= 10) {
								this.node.count.innerHTML = count;
							}

							// 可见手牌显示刷新
							this.decadeUI_updateShowCards();
							return this;
						},
						directgain(cards, broadcast, gaintag) {
							if (!cards || !cards.length) return;
							const player = this;
							const handcards = player.node.handcards1;
							const fragment = document.createDocumentFragment();
							if (_status.event.name == "gameDraw") {
								player.$draw(cards.length);
							}
							for (let i = 0; i < cards.length; i++) {
								const card = cards[i];
								card.fix();
								if (card.parentNode == handcards) {
									cards.splice(i--, 1);
									continue;
								}
								if (gaintag) card.addGaintag(gaintag);
								fragment.appendChild(card);
							}
							if (player == game.me) {
								dui.layoutHandDraws(cards);
								dui.queueNextFrameTick(dui.layoutHand, dui);
							}
							const s = player.getCards("s");
							if (s.length) handcards.insertBefore(fragment, s[0]);
							else handcards.appendChild(fragment);
							if (!_status.video) {
								game.addVideo("directgain", this, get.cardsInfo(cards));
								this.update();
							}
							if (broadcast !== false) {
								game.broadcast(
									(player, cards) => {
										player.directgain(cards);
									},
									this,
									cards
								);
							}
							return this;
						},
						$addVirtualJudge(VCard, cards) {
							if (game.online) return;
							const player = this,
								card = VCard;
							const isViewAsCard = cards.length !== 1 || cards[0].name !== VCard.name || !card.isCard;
							let cardx;
							if (get.itemtype(card) == "card" && card.isViewAsCard) {
								cardx = card;
							} else cardx = isViewAsCard ? game.createCard(card.name, cards.length == 1 ? get.suit(cards[0]) : "none", cards.length == 1 ? get.number(cards[0]) : 0) : cards[0];
							game.broadcastAll(
								(player, cardx, isViewAsCard, VCard, cards) => {
									cardx.fix();
									if (!cardx.isViewAsCard) {
										const cardSymbol = Symbol("card");
										cardx.cardSymbol = cardSymbol;
										cardx[cardSymbol] = VCard;
									}
									cardx.style.transform = "";
									cardx.classList.remove("drawinghidden");
									delete cardx._transform;
									if (isViewAsCard && !cardx.isViewAsCard) {
										cardx.isViewAsCard = true;
										cardx.destroyLog = false;
										for (let i of cards) {
											i.goto(ui.special);
											i.destiny = player.node.judges;
										}
										if (cardx.destroyed) cardx._destroyed_Virtua = cardx.destroyed;
										cardx.destroyed = function (card, id, player, event) {
											if (card._destroyed_Virtua) {
												if (typeof card._destroyed_Virtua == "function") {
													let bool = card._destroyed_Virtua(card, id, player, event);
													if (bool === true) return true;
												} else if (lib.skill[card._destroyed_Virtua]) {
													if (player) {
														if (player.hasSkill(card._destroyed_Virtua)) {
															delete card._destroyed_Virtua;
															return false;
														}
													}
													return true;
												} else if (typeof card._destroyed_Virtua == "string") {
													return card._destroyed_Virtua == id;
												} else if (card._destroyed_Virtua === true) return true;
											}
											if (id == "ordering" && ["phaseJudge", "executeDelayCardEffect"].includes(event.getParent().name)) return false;
											if (id != "judge") {
												return true;
											}
										};
									}
									cardx.classList.add("drawinghidden");
									if (isViewAsCard) {
										cardx.cards = cards || [];
										cardx.viewAs = VCard.name;
										const bgMark = lib.translate[cardx.viewAs + "_bg"] || get.translation(cardx.viewAs)[0];
										if (cardx.classList.contains("fullskin") || cardx.classList.contains("fullborder")) {
											if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = bgMark;
											else cardx.node.background.innerHTML = bgMark;
										}
										cardx.classList.add("fakejudge");
									} else {
										delete cardx.viewAs;
										cardx.classList.remove("fakejudge");
										if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name)[0];
									}
									player.node.judges.insertBefore(cardx, player.node.judges.firstChild);
									// 判定标记美化
									let map = ["bingliang", "lebu", "shandian", "fulei", "hongshui", "huoshan", "caomu", "jlsgqs_shuiyanqijun", "jydiy_zouhuorumo", "jydiy_yungongliaoshang", "xwjh_biguanqingxiu", "xwjh_wushisanke", "xumou_jsrg", "dczixi_bingliang", "dczixi_lebu", "dczixi_shandian"];
									if (map.includes(cardx.name)) {
										let imageName = cardx.name;
										const judgeText = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name) || "";
										cardx.node.judgeMark.node.judge.innerText = "";
										cardx.node.judgeMark.node.judge.style.fontSize = "";
										const ext = (lib.config.extension_十周年UI_newDecadeStyle === "on" || lib.config.extension_十周年UI_newDecadeStyle === "othersOff") && ["bingliang", "lebu", "shandian"].includes(imageName) ? "1.png" : ".png";
										const basePath = `${lib.assetURL}extension/十周年UI/image/judgeMark/`;
										const tryImg = new Image();
										tryImg.onload = function () {
											cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${tryImg.src}")`;
											cardx.node.judgeMark.node.judge.innerText = "";
											cardx.node.judgeMark.node.judge.style.fontSize = "0px";
										};
										tryImg.onerror = function () {
											cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${basePath}tongyong.png")`;
											cardx.node.judgeMark.node.judge.innerText = judgeText ? judgeText[0] : "";
										};
										tryImg.src = `${basePath}${imageName}${ext}`;
										cardx.node.judgeMark.node.judge.style.zIndex = "99";
										cardx.node.judgeMark.node.judge.parentElement.children[0].style.background = "none";
										cardx.node.judgeMark.node.judge.parentElement.children[0].style.display = "none";
									} else {
										cardx.node.judgeMark.node.judge.style.backgroundImage = `url("${lib.assetURL}extension/十周年UI/image/judgeMark/tongyong.png")`;
									}
									ui.updatej(player);
								},
								player,
								cardx,
								isViewAsCard,
								VCard,
								cards
							);
						},
						useCard() {
							const event = base.lib.element.player.useCard.apply(this, arguments);
							const finish = event.finish;
							event.finish = function () {
								if (typeof finish === "function") finish.apply(this, arguments);
								const targets = this.targets;
								if (Array.isArray(targets)) targets.forEach(target => target.classList.remove("target"));
							};
							event.pushHandler("decadeUI_LineAnimation", (event, option) => {
								if (event.step === 1 && option.state === "begin" && !event.hideTargets) {
									const targets = event.targets;
									if (Array.isArray(targets)) targets.forEach(target => target.classList.add("target"));
								}
							});
							return event;
						},
						lose() {
							const next = base.lib.element.player.lose.apply(this, arguments);
							let event = _status.event;
							if (event.name === "loseAsync") event = event.getParent();
							if (event.name == "useCard" || event.name === "respond") {
								next.animate = true;
								next.blameEvent = event;
							}
							return next;
						},
						useCardAnimateBefore(event) {
							base.lib.element.player.useCardAnimateBefore?.apply(this, arguments);
							if (event.lose_map && Object.keys(event.lose_map).some(item => item !== "noowner" && event.lose_map[item].length)) event.throw = false;
						},
						respondAnimateBefore(event) {
							base.lib.element.player.respondAnimateBefore?.apply(this, arguments);
							if (event.lose_map && Object.keys(event.lose_map).some(item => item !== "noowner" && event.lose_map[item].length)) event.throw = false;
						},
						line(target, config) {
							if (get.itemtype(target) == "players") {
								for (let i = 0; i < target.length; i++) {
									this.line(target[i], config);
								}
							} else if (get.itemtype(target) == "player") {
								if (target == this) return;
								const player = this;
								game.broadcast(
									(player, target, config) => {
										player.line(target, config);
									},
									player,
									target,
									config
								);
								game.addVideo("line", player, [target.dataset.position, config]);
								player.checkBoundsCache(true);
								target.checkBoundsCache(true);
								let x1, y1;
								let x2, y2;
								const hand = dui.boundsCaches.hand;
								if (player == game.me) {
									hand.check();
									x1 = ui.arena.offsetWidth / 2;
									y1 = hand.y;
								} else {
									x1 = player.cacheLeft + player.cacheWidth / 2;
									y1 = player.cacheTop + player.cacheHeight / 2;
								}
								if (target == game.me) {
									hand.check();
									x2 = ui.arena.offsetWidth / 2;
									y2 = hand.y;
								} else {
									x2 = target.cacheLeft + target.cacheWidth / 2;
									y2 = target.cacheTop + target.cacheHeight / 2;
								}
								game.linexy([x1, y1, x2, y2], config, true);
							}
						},
						checkBoundsCache(forceUpdate) {
							let update;
							const refer = dui.boundsCaches.arena;
							refer.check();
							if (this.cacheReferW != refer.width || this.cacheReferH != refer.height || this.cachePosition != this.dataset.position) update = true;
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
						},
						queueCssAnimation(animation) {
							const current = this.style.animation;
							let animations = this._cssanimations;
							if (animations === undefined) {
								animations = [];
								this._cssanimations = animations;
								this.addEventListener("animationend", function (e) {
									if (this.style.animationName !== e.animationName) return;
									const current = this.style.animation;
									const animations = this._cssanimations;
									while (animations.length) {
										this.style.animation = animations.shift();
										if (this.style.animation !== current) return;
										animations.current = this.style.animation;
									}
									animations.current = "";
									this.style.animation = "";
								});
							}
							if (animations.current || animations.length) {
								animations.push(animation);
								return;
							}
							animations.current = animation;
							this.style.animation = animation;
						},
						$draw(num, init, config) {
							if (game.chess) return base.lib.element.player.$draw.call(this, num, init, config);
							if (init !== false && init !== "nobroadcast") {
								game.broadcast(
									function (player, num, init, config) {
										player.$draw(num, init, config);
									},
									this,
									num,
									init,
									config
								);
							}
							let cards;
							let isDrawCard;
							if (get.itemtype(num) == "cards") {
								cards = num.concat();
								isDrawCard = true;
							} else if (get.itemtype(num) == "card") {
								cards = [num];
								isDrawCard = true;
							} else if (typeof num == "number") {
								cards = new Array(num);
							} else {
								cards = new Array(1);
							}
							if (init !== false) {
								if (isDrawCard) {
									game.addVideo("drawCard", this, get.cardsInfo(cards));
								} else {
									game.addVideo("draw", this, num);
								}
							}
							if (_status.event && _status.event.name) {
								if (
									(function (event) {
										return event.name != "gain" && !event.name.includes("raw");
									})(_status.event)
								)
									isDrawCard = true;
							}
							if (game.me == this && !isDrawCard) return;
							const fragment = document.createDocumentFragment();
							let card;
							for (let i = 0; i < cards.length; i++) {
								card = cards[i];
								if (card == null) card = dui.element.create("card thrown drawingcard");
								else card = card.copy("thrown", "drawingcard", false);
								card.fixed = true;
								cards[i] = card;
								fragment.appendChild(card);
							}
							const player = this;
							dui.layoutDrawCards(cards, player, true);
							ui.arena.appendChild(fragment);
							dui.queueNextFrameTick(function () {
								dui.layoutDrawCards(cards, player);
								dui.delayRemoveCards(cards, 460, 220);
							});
						},
						$give(cards, target, log, record) {
							let itemtype;
							const duiMod = cards.duiMod && game.me == target;
							if (typeof cards == "number") {
								itemtype = "number";
								cards = new Array(cards);
							} else {
								itemtype = get.itemtype(cards);
								if (itemtype == "cards") {
									cards = cards.concat();
								} else if (itemtype == "card") {
									cards = [cards];
								} else {
									return;
								}
							}
							if (record !== false) {
								let cards2 = cards;
								if (itemtype == "number") {
									cards2 = cards.length;
									game.addVideo("give", this, [cards2, target.dataset.position]);
								} else {
									game.addVideo("giveCard", this, [get.cardsInfo(cards2), target.dataset.position]);
								}
								game.broadcast(
									function (source, cards2, target, record) {
										source.$give(cards2, target, false, record);
									},
									this,
									cards2,
									target,
									record
								);
							}
							if (log != false) {
								if (itemtype == "number") game.log(target, "从", this, "获得了" + get.cnNumber(cards.length) + "张牌");
								else game.log(target, "从", this, "获得了", cards);
							}
							if (this.$givemod) {
								this.$givemod(cards, target);
								return;
							}
							if (duiMod) return;
							let card;
							const hand = dui.boundsCaches.hand;
							hand.check();
							const draws = [];
							const player = this;
							const fragment = document.createDocumentFragment();
							for (let i = 0; i < cards.length; i++) {
								card = cards[i];
								if (card) {
									const cp = card.copy("card", "thrown", "gainingcard", false);
									let hs = player == game.me;
									if (hs) {
										if (card.throwWith) {
											hs = card.throwWith == "h" || card.throwWith == "s";
										} else {
											hs = card.parentNode == player.node.handcards1;
										}
									}
									if (hs) {
										cp.tx = Math.round(hand.x + card.tx);
										cp.ty = Math.round(hand.y + 30 + card.ty);
										cp.scaled = true;
										cp.style.transform = "translate(" + cp.tx + "px," + cp.ty + "px) scale(" + hand.cardScale + ")";
									} else {
										draws.push(cp);
									}
									card = cp;
								} else {
									card = dui.element.create("card thrown gainingcard");
									draws.push(card);
								}
								cards[i] = card;
								cards[i].fixed = true;
								fragment.appendChild(cards[i]);
							}
							if (draws.length) dui.layoutDrawCards(draws, player);
							ui.arena.appendChild(fragment);
							dui.queueNextFrameTick(function () {
								dui.layoutDrawCards(cards, target);
								dui.delayRemoveCards(cards, 460, 220);
							});
						},
						$gain2(cards, log) {
							let type = get.itemtype(cards);
							if (type != "cards") {
								if (type != "card") return;
								type = "cards";
								cards = [cards];
							}
							if (log === true) game.log(this, "获得了", cards);
							game.broadcast(
								function (player, cards) {
									player.$gain2(cards);
								},
								this,
								cards
							);
							const gains = [];
							const draws = [];
							let card;
							let clone;
							for (let i = 0; i < cards.length; i++) {
								clone = cards[i].clone;
								card = cards[i].copy("thrown", "gainingcard");
								card.fixed = true;
								if (clone && clone.parentNode == ui.arena) {
									card.scaled = true;
									card.style.transform = clone.style.transform;
									gains.push(card);
								} else {
									draws.push(card);
								}
							}
							if (gains.length) game.addVideo("gain2", this, get.cardsInfo(gains));
							if (draws.length) game.addVideo("drawCard", this, get.cardsInfo(draws));
							if (cards.duiMod && this == game.me) return;
							cards = gains.concat(draws);
							dui.layoutDrawCards(draws, this, true);
							const player = this;
							const fragment = document.createDocumentFragment();
							for (let i = 0; i < cards.length; i++) fragment.appendChild(cards[i]);
							ui.arena.appendChild(fragment);
							dui.queueNextFrameTick(function () {
								dui.layoutDrawCards(cards, player);
								dui.delayRemoveCards(cards, 460, 220);
							});
						},
						$handleEquipChange() {
							base.lib.element.player.$handleEquipChange.apply(this, arguments);
							const player = this;
							if (!(player == game.me && ui.equipSolts)) return;
							const sum = Array.from(player.node.equips.childNodes).filter(card => {
								return ![1, 2, 3, 4, 5].includes(get.equipNum(card));
							}).length;
							const current = Array.from(ui.equipSolts.back.children).filter(elements => {
								return elements.dataset.type == 5;
							}).length;
							let delta = sum - current;
							if (delta > 0) {
								while (delta > 0) {
									delta--;
									const ediv = decadeUI.element.create(null, ui.equipSolts.back);
									ediv.dataset.type = 5;
								}
							} else if (delta < 0) {
								for (let i = 0; i > sum; i--) {
									const element = Array.from(ui.equipSolts.back.children).find(elements => {
										return elements.dataset.type == 5;
									});
									if (element?.dataset.type == 5) element.remove();
								}
							}
						},
						$damage(source) {
							if (get.itemtype(source) == "player") {
								game.addVideo("damage", this, source.dataset.position);
							} else {
								game.addVideo("damage", this);
							}
							game.broadcast(
								function (player, source) {
									player.$damage(source);
								},
								this,
								source
							);
							this.queueCssAnimation("player-hurt 0.3s");
						},
						$throw(cards, time, record, nosource) {
							let itemtype;
							const duiMod = cards.duiMod && game.me == this && !nosource;
							if (typeof cards == "number") {
								itemtype = "number";
								cards = new Array(cards);
							} else {
								itemtype = get.itemtype(cards);
								if (itemtype == "cards") {
									cards = cards.concat();
								} else if (itemtype == "card") {
									cards = [cards];
								} else {
									const evt = _status.event;
									if (evt && evt.card && evt.cards === cards) {
										const card = ui.create.card().init([evt.card.suit, evt.card.number, evt.card.name, evt.card.nature]);
										if (evt.card.suit == "none") card.node.suitnum.style.display = "none";
										card.dataset.virtual = 1;
										cards = [card];
									}
								}
							}
							let card;
							let clone;
							const player = this;
							const hand = dui.boundsCaches.hand;
							hand.check();
							for (let i = 0; i < cards.length; i++) {
								card = cards[i];
								if (card) {
									clone = card.copy("thrown");
									if (duiMod && (card.throwWith == "h" || card.throwWith == "s")) {
										clone.tx = Math.round(hand.x + card.tx);
										clone.ty = Math.round(hand.y + 30 + card.ty);
										clone.scaled = true;
										clone.throwordered = true;
										clone.style.transform = "translate(" + clone.tx + "px," + clone.ty + "px) scale(" + hand.cardScale + ")";
									}
									card = clone;
								} else {
									card = dui.element.create("card infohidden infoflip");
									card.moveTo = lib.element.card.moveTo;
									card.moveDelete = lib.element.card.moveDelete;
								}
								cards[i] = card;
							}
							if (record !== false) {
								if (record !== "nobroadcast") {
									game.broadcast(
										function (player, cards, time, record, nosource) {
											player.$throw(cards, time, record, nosource);
										},
										this,
										cards,
										0,
										record,
										nosource
									);
								}
								game.addVideo("throw", this, [get.cardsInfo(cards), 0, nosource]);
							}
							cards.sort((a, b) => {
								if (a.tx === undefined && b.tx === undefined) return 0;
								if (a.tx === undefined) return duicfg.rightLayout ? -1 : 1;
								if (b.tx === undefined) return duicfg.rightLayout ? 1 : -1;
								return a.tx - b.tx;
							});
							for (let i = 0; i < cards.length; i++) {
								(card => {
									player.$throwordered2(card, nosource);
								})(cards[i]);
							}
							if (game.chess) this.chessFocus();
							return cards[cards.length - 1];
						},
						$throwordered2(card, nosource) {
							if (_status.connectMode) ui.todiscard = [];
							if (card.throwordered === undefined) {
								let x, y;
								const bounds = dui.boundsCaches.arena;
								if (!bounds.updated) bounds.update();
								this.checkBoundsCache();
								if (nosource) {
									x = (bounds.width - bounds.cardWidth) / 2 - bounds.width * 0.08;
									y = (bounds.height - bounds.cardHeight) / 2;
								} else {
									x = (this.cacheWidth - bounds.cardWidth) / 2 + this.cacheLeft;
									y = (this.cacheHeight - bounds.cardHeight) / 2 + this.cacheTop;
								}
								x = Math.round(x);
								y = Math.round(y);
								card.tx = x;
								card.ty = y;
								card.scaled = true;
								card.classList.add("thrown");
								card.style.transform = "translate(" + x + "px, " + y + "px)" + "scale(" + bounds.cardScale + ")";
							} else {
								card.throwordered = undefined;
							}
							if (card.fixed) return ui.arena.appendChild(card);
							let tagNode = card.querySelector(".used-info");
							if (tagNode == null) tagNode = card.appendChild(dui.element.create("used-info"));
							card.$usedtag = tagNode;
							ui.thrown.push(card);
							ui.arena.appendChild(card);
							dui.tryAddPlayerCardUseTag(card, this, _status.event);
							dui.queueNextFrameTick(dui.layoutDiscard, dui);
							return card;
						},
						$phaseJudge(card) {
							game.addVideo("phaseJudge", this, get.cardInfo(card));
							if (card[card.cardSymbol]?.cards?.length) {
								const cards = card[card.cardSymbol].cards;
								this.$throw(cards);
							} else {
								const VCard = game.createCard(card.name, "虚拟", "");
								this.$throw(VCard);
							}
							dui.delay(451);
						},
						decadeUI_updateShowCards() {
							const player = this;
							if (!player.node.showCards) return;
							if (player == game.me || player.isDead()) {
								player.node.showCards.hide();
								while (player.node.showCards.hasChildNodes()) player.node.showCards.removeChild(player.node.showCards.firstChild);
								return;
							}
							const cards = player.getCards("h", c => get.is.shownCard(c) || (typeof game.me !== "undefined" && player.isUnderControl(true)) || (game.me && game.me.hasSkillTag("viewHandcard", null, player, true)));
							if (!cards.length) {
								player.node.showCards.hide();
								return;
							}
							player.node.showCards.show();
							while (player.node.showCards.hasChildNodes()) player.node.showCards.removeChild(player.node.showCards.firstChild);
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
							for (let i = 0; i < 5; i++) {
								createElement("div", {
									class: ["handcard"],
									innerHTML: i < cards.length ? lib.translate[cards[i].name].slice(0, 2) : "",
									parentNode: player.node.showCards,
								});
							}
						},
						// 转换技，阴阳标记等
						$changeZhuanhuanji(skill) {
							base.lib.element.player.$changeZhuanhuanji.apply(this, arguments);
							if (!get.is.zhuanhuanji(skill, this)) return;
							if (this.hiddenSkills.includes(skill) && this !== game.me) return;
							const mark = this.node.xSkillMarks.querySelector(`[data-id="${skill}"]`);
							const url = `${lib.assetURL}extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${skill}_yang.png`;
							function imageExists(url) {
								const xhr = new XMLHttpRequest();
								xhr.open("GET", url, false);
								xhr.send();
								return xhr.status !== 404;
							}
							try {
								if (mark) mark.dk = imageExists(url);
							} catch (err) {
								if (mark) mark.dk = false;
							}
							if (!mark) return;
							const style = lib.config.extension_十周年UI_newDecadeStyle;
							const yangUrl = `extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${skill}_yang.png`;
							const yingUrl = `extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/${skill}_ying.png`;
							const defaultYangUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_yang.png";
							const defaultYingUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_ying.png";
							if (style != "off") {
								if (mark.classList.contains("yin")) {
									mark.classList.remove("yin");
									mark.classList.add("yang");
								} else {
									mark.classList.remove("yang");
									mark.classList.add("yin");
								}
							} else {
								if (mark.dd === true) {
									this.yingSkill(skill);
									mark.dd = false;
									mark.setBackgroundImage(mark.dk ? yangUrl : defaultYangUrl);
								} else {
									this.yangSkill(skill);
									mark.dd = true;
									mark.setBackgroundImage(mark.dk ? yingUrl : defaultYingUrl);
								}
							}
						},
						// 修改技能按钮：定义两个空集合阳按钮和阴按钮
						yangSkill(skill) {
							const player = this;
							game.broadcastAll(
								function (player, skill) {
									player.$yangSkill(skill);
								},
								player,
								skill
							);
						},
						$yangSkill(skill) {
							this.yangedSkills ??= [];
							this.yangedSkills.add(skill);
							this.yingedSkills ??= [];
							this.yingedSkills.remove(skill);
						},
						yingSkill(skill) {
							const player = this;
							game.broadcastAll(
								function (player, skill) {
									player.$yingSkill(skill);
								},
								player,
								skill
							);
						},
						$yingSkill(skill) {
							this.yingedSkills ??= [];
							this.yingedSkills.add(skill);
							this.yangedSkills ??= [];
							this.yangedSkills.remove(skill);
						},
						// 失败函数：为使命技的class样式添加fail后缀，失败时标记为白底和x，成功时为红底
						failSkill(skill) {
							const player = this;
							game.broadcastAll(
								function (player, skill) {
									player.$failSkill(skill);
								},
								player,
								skill
							);
						},
						$failSkill(skill) {
							if (this.hiddenSkills.includes(skill) && this !== game.me) return;
							const mark = this.node.xSkillMarks.querySelector('[data-id="' + skill + '"]');
							if (mark) mark.classList.add("fail");
						},
						// 失效函数：给技能按钮上锁，技能失效时加入失效集合，UI会检测并添加上锁图片
						shixiaoSkill(skill) {
							const player = this;
							game.broadcastAll(
								function (player, skill) {
									player.$shixiaoSkill(skill);
								},
								player,
								skill
							);
						},
						$shixiaoSkill(skill) {
							this.shixiaoedSkills ??= [];
							this.shixiaoedSkills.add(skill);
						},
						// 解除失效函数
						unshixiaoSkill(skill) {
							const player = this;
							game.broadcastAll(
								function (player, skill) {
									player.$unshixiaoSkill(skill);
								},
								player,
								skill
							);
						},
						$unshixiaoSkill(skill) {
							this.shixiaoedSkills ??= [];
							this.shixiaoedSkills.remove(skill);
						},
						trySkillAnimate(name) {
							base.lib.element.player.trySkillAnimate.apply(this, arguments);
							const that = this;

							// AI技能提示条
							if (lib.config["extension_十周年UI_enable"] && lib.config.extension_十周年UI_jindutiao == true) {
								if (that != game.me) {
									const cd = that.getElementsByClassName("tipshow");
									const ef = that.getElementsByClassName("tipskill");

									// 初始化
									if (cd[0]) cd[0].parentNode.removeChild(cd[0]);
									if (ef[0]) ef[0].parentNode.removeChild(ef[0]);
									const tipbanlist = ["_recasting", "jiu"];

									if (!tipbanlist.includes(name) && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
										const tipskillbox = document.createElement("div");
										const tipshow = document.createElement("img");
										const tipskilltext = document.createElement("div");

										// 盒子样式
										tipskillbox.classList.add("tipskill");
										tipskillbox.style.cssText = "display:block;position:absolute;pointer-events:none;z-index:90;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:0px;";

										// 技能文本
										tipskilltext.innerHTML = get.skillTranslation(name, that).slice(0, 2);
										tipskilltext.style.cssText = "color:#ADC63A;text-shadow:#707852 0 0;font-size:11px;font-family:shousha;display:block;position:absolute;z-index:91;bottom:-22px;letter-spacing:1.5px;line-height:15px;left:15px;";

										// 思考中底图
										tipshow.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/skilltip.png";
										tipshow.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
										tipskillbox.appendChild(tipshow);
										tipskillbox.appendChild(tipskilltext);
										that.appendChild(tipskillbox);
									}
								}
							}
						},
						setModeState(info) {
							if (info?.seat) {
								if (!this.node.seat) this.node.seat = decadeUI.element.create("seat", this);
								this.node.seat.innerHTML = get.cnNumber(info.seat, true);
							}
							if (base.lib.element.player.setModeState) {
								return base.lib.element.player.setModeState.apply(this, arguments);
							} else {
								return this.init(info.name, info.name2);
							}
						},
						$damagepop(num, nature, font, nobroadcast) {
							if (typeof num == "number" || typeof num == "string") {
								game.addVideo("damagepop", this, [num, nature, font]);
								if (nobroadcast !== false) {
									game.broadcast(
										function (player, num, nature, font) {
											player.$damagepop(num, nature, font);
										},
										this,
										num,
										nature,
										font
									);
								}
								let node;
								if (this.popupNodeCache && this.popupNodeCache.length) {
									node = this.popupNodeCache.shift();
								} else {
									node = decadeUI.element.create("damage");
								}
								if (font) {
									node.classList.add("normal-font");
								} else {
									node.classList.remove("normal-font");
								}
								if (typeof num == "number") {
									node.popupNumber = num;
									num = "";
								} else {
									node.popupNumber = null;
								}
								node.innerHTML = num;
								node.dataset.text = node.textContent || node.innerText;
								node.nature = nature || "soil";
								this.damagepopups.push(node);
							}
							if (this.damagepopups.length && !this.damagepopLocked) {
								const node = this.damagepopups.shift();
								this.damagepopLocked = true;
								if (this != node.parentNode) this.appendChild(node);
								const player = this;
								if (typeof node.popupNumber == "number") {
									const popupNum = node.popupNumber;
									if (popupNum < 0) {
										if (node.nature != "water") {
											const actionPairs = {
												thunder: ["play5", "play6"],
												fire: ["play3", "play4"],
												__default: ["play1", "play2"],
											};
											const pair = actionPairs[node.nature] || actionPairs.__default;
											const action = popupNum <= -2 ? pair[1] : pair[0];
											decadeUI.animation.playSpine(
												{
													name: "effect_shoujidonghua",
													action: action,
												},
												{
													scale: 0.8,
													parent: player,
												}
											);
										}
									} else {
										if (node.nature == "wood") {
											decadeUI.animation.playSpine("effect_zhiliao", {
												scale: 0.7,
												parent: player,
											});
										}
									}
								}
								node.style.animation = "open-fade-in-out 1.2s";
								setTimeout(
									function (player, node) {
										if (!player.popupNodeCache) player.popupNodeCache = [];
										node.style.animation = "";
										player.popupNodeCache.push(node);
									},
									1210,
									player,
									node
								);
								setTimeout(
									function (player) {
										player.damagepopLocked = false;
										player.$damagepop();
									},
									500,
									player
								);
							}
						},
						$compare(card1, target, card2) {
							game.broadcast(
								function (player, target, card1, card2) {
									player.$compare(card1, target, card2);
								},
								this,
								target,
								card1,
								card2
							);
							game.addVideo("compare", this, [get.cardInfo(card1), target.dataset.position, get.cardInfo(card2)]);
							const player = this;
							target.$throwordered2(card2.copy(false));
							player.$throwordered2(card1.copy(false));
						},
						$compareMultiple(card1, targets, cards) {
							game.broadcast(
								function (player, card1, targets, cards) {
									player.$compareMultiple(card1, targets, cards);
								},
								this,
								card1,
								targets,
								cards
							);
							game.addVideo("compareMultiple", this, [get.cardInfo(card1), get.targetsInfo(targets), get.cardsInfo(cards)]);
							const player = this;
							for (let i = targets.length - 1; i >= 0; i--) {
								targets[i].$throwordered2(cards[i].copy(false));
							}
							player.$throwordered2(card1.copy(false));
						},
					},
					content: {
						changeHp() {
							game.getGlobalHistory().changeHp.push(event);
							if (num < 0 && player.hujia > 0 && event.getParent().name == "damage" && !player.hasSkillTag("nohujia")) {
								event.hujia = Math.min(-num, player.hujia);
								event.getParent().hujia = event.hujia;
								event.num += event.hujia;
								player.changeHujia(-event.hujia).type = "damage";
							}
							num = event.num;
							player.hp += num;
							if (isNaN(player.hp)) player.hp = 0;
							if (player.hp > player.maxHp) player.hp = player.maxHp;
							player.update();
							if (event.popup !== false) {
								player.$damagepop(num, "water");
							}
							if (_status.dying.includes(player) && player.hp > 0) {
								_status.dying.remove(player);
								game.broadcast(function (list) {
									_status.dying = list;
								}, _status.dying);
								let evt = event.getParent("_save");
								if (evt && evt.finish) evt.finish();
								evt = event.getParent("dying");
								if (evt && evt.finish) evt.finish();
							}
							event.trigger("changeHp");
							dui.delay(68);
						},
						gain: [
							...base.lib.element.content.gain.slice(0, -2),
							async (event, trigger, player) => {
								let { cards, gaintag } = event;
								const handcards = player.node.handcards1;
								const fragment = document.createDocumentFragment();
								for (let i = 0; i < cards.length; i++) {
									const card = cards[i];
									let sort = lib.config.sort_card(card);
									if (lib.config.reverse_sort) sort = -sort;
									if (["o", "d"].includes(get.position(card, true))) {
										card.addKnower("everyone");
									}
									card.fix();
									card.style.transform = "";
									if (card.parentNode == handcards) {
										cards.splice(i--, 1);
										continue;
									}
									gaintag.forEach(tag => card.addGaintag(tag));
									if (event.knowers) card.addKnower(event.knowers);
									fragment.appendChild(card);
									if (_status.discarded) _status.discarded.remove(card);
									for (let j = 0; j < card.vanishtag.length; j++) {
										if (card.vanishtag[j][0] != "_") card.vanishtag.splice(j--, 1);
									}
								}
								const gainTo = function (cards, nodelay) {
									cards.duiMod = event.source;
									if (player == game.me) {
										dui.layoutHandDraws(cards);
										dui.queueNextFrameTick(dui.layoutHand, dui);
										game.addVideo("gain12", player, [get.cardsInfo(fragment.childNodes), gaintag]);
									}
									const s = player.getCards("s");
									if (s.length) handcards.insertBefore(fragment, s[0]);
									else handcards.appendChild(fragment);
									game.broadcast(
										function (player, cards, num, gaintag) {
											player.directgain(cards, null, gaintag);
											_status.cardPileNum = num;
										},
										player,
										cards,
										ui.cardPile.childNodes.length,
										gaintag
									);
									if (nodelay !== true) {
										setTimeout(
											function (player) {
												player.update();
												game.resume();
											},
											get.delayx(400, 400) + 66,
											player
										);
									} else {
										player.update();
									}
								};
								if (event.animate == "draw") {
									game.pause();
									gainTo(cards);
									player.$draw(cards.length);
								} else if (event.animate == "gain") {
									game.pause();
									gainTo(cards);
									player.$gain(cards, event.log);
								} else if (event.animate == "gain2" || event.animate == "draw2") {
									game.pause();
									gainTo(cards);
									player.$gain2(cards, event.log);
								} else if (event.animate == "give" || event.animate == "giveAuto") {
									game.pause();
									gainTo(cards);
									const evtmap = event.losing_map;
									if (event.animate == "give") {
										for (const i in evtmap) {
											const source = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
											source.$give(evtmap[i][0], player, event.log);
										}
									} else {
										for (const i in evtmap) {
											const source = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
											if (evtmap[i][1].length) source.$giveAuto(evtmap[i][1], player, event.log);
											if (evtmap[i][2].length) source.$give(evtmap[i][2], player, event.log);
										}
									}
								} else if (typeof event.animate == "function") {
									const time = event.animate(event);
									game.pause();
									setTimeout(
										function () {
											gainTo(cards, true);
											game.resume();
										},
										get.delayx(time, time)
									);
								} else {
									gainTo(cards, true);
								}
							},
							async (event, trigger, player) => {
								if (event.updatePile) game.updateRoundNumber();
							},
						],
						judge() {
							"step 0";
							const judgestr = get.translation(player) + "的" + event.judgestr + "判定";
							event.videoId = lib.status.videoId++;
							let cardj = event.directresult;
							if (!cardj) {
								if (player.getTopCards) cardj = player.getTopCards()[0];
								else cardj = get.cards()[0];
							}
							const owner = get.owner(cardj);
							if (owner) {
								owner.lose(cardj, "visible", ui.ordering);
							} else {
								const nextj = game.cardsGotoOrdering(cardj);
								if (event.position != ui.discardPile) nextj.noOrdering = true;
							}
							player.judging.unshift(cardj);
							game.addVideo("judge1", player, [get.cardInfo(player.judging[0]), judgestr, event.videoId]);
							game.broadcastAll(
								function (player, card /*, str*/, id, cardid) {
									const event = game.online ? {} : _status.event;
									if (game.chess) event.node = card.copy("thrown", "center", ui.arena).animate("start");
									else event.node = player.$throwordered2(card.copy(), true);
									if (lib.cardOL) lib.cardOL[cardid] = event.node;
									event.node.cardid = cardid;
									if (!window.decadeUI) {
										ui.arena.classList.add("thrownhighlight");
										event.node.classList.add("thrownhighlight");
									}
								},
								player,
								player.judging[0] /*, judgestr*/,
								event.videoId,
								get.id()
							);
							game.log(player, "进行" + event.judgestr + "判定，亮出的判定牌为", player.judging[0]);
							game.delay(2);
							if (!event.noJudgeTrigger) event.trigger("judge");
							("step 1");
							event.result = {
								card: player.judging[0],
								name: player.judging[0].name,
								number: get.number(player.judging[0]),
								suit: get.suit(player.judging[0]),
								color: get.color(player.judging[0]),
								node: event.node,
							};
							if (event.fixedResult) {
								for (const i in event.fixedResult) {
									event.result[i] = event.fixedResult[i];
								}
							}
							event.result.judge = event.judge(event.result);
							if (event.result.judge > 0) event.result.bool = true;
							else if (event.result.judge < 0) event.result.bool = false;
							else event.result.bool = null;
							player.judging.shift();
							game.checkMod(player, event.result, "judge", player);
							if (event.judge2) {
								const judge2 = event.judge2(event.result);
								if (typeof judge2 == "boolean") player.tryJudgeAnimate(judge2);
							}
							if (event.clearArena != false) {
								game.broadcastAll(ui.clear);
							}
							game.broadcast(function () {
								if (!window.decadeUI) ui.arena.classList.remove("thrownhighlight");
							});
							game.addVideo("judge2", null, event.videoId);
							game.log(player, "的判定结果为", event.result.card);
							event.trigger("judgeFixing");
							event.triggerMessage("judgeresult");
							if (event.callback) {
								const next = game.createEvent("judgeCallback", false);
								next.player = player;
								next.card = event.result.card;
								next.judgeResult = get.copy(event.result);
								next.setContent(event.callback);
							} else {
								if (!get.owner(event.result.card)) {
									if (event.position != ui.discardPile) event.position.appendChild(event.result.card);
								}
							}
						},
						lose: [
							async (event, trigger, player) => {
								const evt = event.getParent();
								if ((evt.name != "discard" || event.type != "discard") && (evt.name != "loseToDiscardpile" || event.type != "loseToDiscardpile")) {
									event.delay = false;
									if (event.blameEvent == undefined) event.animate = false;
								} else {
									if (evt.delay === false) event.delay = false;
									if (event.animate == undefined) event.animate = evt.animate;
								}
							},
							async (event, trigger, player) => {
								let { cards } = event;
								event.vcards = {
									cards: [],
									es: [],
									js: [],
								};
								event.vcard_cards = [];
								event.gaintag_map = {};
								const hs = [];
								const es = [];
								const js = [];
								const ss = [];
								const xs = [];
								const unmarks = [];
								if (event.insert_card && event.position == ui.cardPile) event.cards.reverse();
								const hej = player.getCards("hejsx");
								event.stockcards = cards.slice(0);
								for (let i = 0; i < cards.length; i++) {
									let cardx = [cards[i]];
									if (!hej.includes(cards[i])) {
										cards.splice(i--, 1);
										continue;
									} else if (cards[i].parentNode) {
										if (cards[i].parentNode.classList.contains("equips")) {
											cards[i].throwWith = cards[i].original = "e";
											const VEquip = cards[i][cards[i].cardSymbol];
											if (VEquip) {
												if (cards[i].isViewAsCard) {
													let loseCards = VEquip.cards;
													cardx.addArray(loseCards);
													event.vcard_cards.addArray(loseCards);
													loseCards.forEach(cardi => {
														cardi.throwWith = cardi.original = "e";
														delete cardi.destiny;
														es.push(cardi);
														event.vcard_map.set(cardi, VEquip || get.autoViewAs(cards[i], void 0, false));
													});
												} else {
													es.push(cards[i]);
													event.vcard_map.set(cards[i], VEquip || get.autoViewAs(cards[i], void 0, false));
													event.vcard_cards.add(cards[i]);
												}
												event.vcards.cards.push(cards[i]);
												event.vcards.es.push(cards[i]);
											}
										} else if (cards[i].parentNode.classList.contains("judges")) {
											cards[i].throwWith = cards[i].original = "j";
											const VJudge = cards[i][cards[i].cardSymbol];
											if (VJudge) {
												if (cards[i].isViewAsCard) {
													let loseCards = VJudge.cards;
													cardx.addArray(loseCards);
													event.vcard_cards.addArray(loseCards);
													loseCards.forEach(cardi => {
														cardi.throwWith = cardi.original = "j";
														delete cardi.destiny;
														js.push(cardi);
														event.vcard_map.set(cardi, VJudge || get.autoViewAs(cards[i], void 0, false));
													});
												} else {
													js.push(cards[i]);
													event.vcard_map.set(cards[i], VJudge || get.autoViewAs(cards[i], void 0, false));
													event.vcard_cards.add(cards[i]);
												}
												event.vcards.cards.push(cards[i]);
												event.vcards.js.push(cards[i]);
											}
										} else if (cards[i].parentNode.classList.contains("expansions")) {
											cards[i].throwWith = cards[i].original = "x";
											xs.push(cards[i]);
											event.vcard_map.set(cards[i], get.autoViewAs(cards[i], void 0, false));
											if (cards[i].gaintag && cards[i].gaintag.length) unmarks.addArray(cards[i].gaintag);
										} else if (cards[i].parentNode.classList.contains("handcards")) {
											if (cards[i].classList.contains("glows")) {
												cards[i].throwWith = cards[i].original = "s";
												ss.push(cards[i]);
												event.vcard_map.set(cards[i], get.autoViewAs(cards[i], void 0, false));
											} else {
												cards[i].throwWith = cards[i].original = "h";
												hs.push(cards[i]);
												event.vcard_map.set(cards[i], get.autoViewAs(cards[i], void 0, player));
											}
										} else {
											cards[i].throwWith = cards[i].original = null;
										}
									}
									for (let j = 0; j < cardx.length; j++) {
										if (cardx[j].gaintag && cardx[j].gaintag.length) {
											event.gaintag_map[cardx[j].cardid] = cardx[j].gaintag.slice(0);
											const tags = cardx[j].gaintag.filter(tag => !tag.startsWith("eternal_"));
											tags.forEach(tag => cardx[j].removeGaintag(tag));
										}
										cardx[j].style.transform += " scale(0.2)";
										cardx[j].classList.remove("glow");
										cardx[j].classList.remove("glows");
										cardx[j].recheck();
										const info = lib.card[cardx[j].name];
										if ("_destroy" in cardx[j]) {
											if (cardx[j]._destroy) {
												cardx[j].delete();
												cardx[j].destroyed = cardx[j]._destroy;
												continue;
											}
										} else if ("destroyed" in cardx[j]) {
											if (event.getlx !== false && event.position && cardx[j].willBeDestroyed(event.position.id, null, event)) {
												cardx[j].selfDestroy(event);
												continue;
											}
										} else if (info.destroy) {
											cardx[j].delete();
											cardx[j].destroyed = info.destroy;
											continue;
										}
										if (event.position) {
											if (_status.discarded) {
												if (event.position == ui.discardPile) {
													_status.discarded.add(cardx[j]);
												} else {
													_status.discarded.remove(cardx[j]);
												}
											}
											if (event.insert_index) {
												cardx[j].fix();
												event.position.insertBefore(cardx[j], event.insert_index(event, cardx[j]));
											} else if (event.insert_card) {
												cardx[j].fix();
												event.position.insertBefore(cardx[j], event.position.firstChild);
											} else if (event.position == ui.cardPile) {
												cardx[j].fix();
												event.position.appendChild(cardx[j]);
											} else cardx[j].goto(event.position);
										} else {
											cardx[j].remove();
										}
									}
								}
								if (player == game.me) dui.queueNextFrameTick(dui.layoutHand, dui);
								ui.updatej(player);
								game.broadcast(
									(player, cards, num) => {
										for (let i = 0; i < cards.length; i++) {
											cards[i].removeGaintag(true);
											cards[i].classList.remove("glow");
											cards[i].classList.remove("glows");
											cards[i].fix();
											cards[i].remove();
										}
										if (player == game.me) ui.updatehl();
										ui.updatej(player);
										_status.cardPileNum = num;
									},
									player,
									cards.slice(),
									ui.cardPile.childNodes.length
								);
								if (event.animate != false) {
									const evt = event.getParent();
									evt.discardid = lib.status.videoId++;
									game.broadcastAll(
										function (player, cards, id, visible) {
											const cardx = cards
												.slice()
												.map(i => (i.cards ? i.cards : [i]))
												.flat();
											cardx.duiMod = true;
											if (visible) player.$throw(cardx, null, "nobroadcast");
											const cardnodes = [];
											cardnodes._discardtime = get.time();
											for (let i = 0; i < cardx.length; i++) {
												if (cardx[i].clone) cardnodes.push(cardx[i].clone);
											}
											ui.todiscard[id] = cardnodes;
										},
										player,
										cards,
										evt.discardid,
										event.visible
									);
									if (lib.config.sync_speed && cards[0]?.clone) {
										if (evt.delay != false) {
											const waitingForTransition = get.time();
											evt.waitingForTransition = waitingForTransition;
											cards[0].clone.listenTransition(function () {
												if (_status.waitingForTransition == waitingForTransition && _status.paused) {
													game.resume();
												}
												delete evt.waitingForTransition;
											});
										} else if (evt.getParent().discardTransition) {
											delete evt.getParent().discardTransition;
											const waitingForTransition = get.time();
											evt.getParent().waitingForTransition = waitingForTransition;
											cards[0].clone.listenTransition(function () {
												if (_status.waitingForTransition == waitingForTransition && _status.paused) {
													game.resume();
												}
												delete evt.getParent().waitingForTransition;
											});
										}
									}
								}
								game.addVideo("lose", player, [get.cardsInfo(hs), get.cardsInfo(es), get.cardsInfo(js), get.cardsInfo(ss)]);
								event.cards2 = hs.concat(es);
								cards.removeArray(event.vcards.cards);
								cards.addArray(event.vcard_cards);
								player.getHistory("lose").push(event);
								game.getGlobalHistory().cardMove.push(event);
								player.update();
								game.addVideo("loseAfter", player);
								event.num = 0;
								if (event.position == ui.ordering) {
									const evt = event.relatedEvent || event.getParent();
									if (!evt.orderingCards) evt.orderingCards = [];
									if (!evt.noOrdering && !evt.cardsOrdered) {
										evt.cardsOrdered = true;
										const next = game.createEvent("orderingDiscard", false);
										event.next.remove(next);
										evt.after.push(next);
										next.relatedEvent = evt;
										next.setContent("orderingDiscard");
									}
									if (!evt.noOrdering) {
										evt.orderingCards.addArray(cards);
									}
								} else if (event.position == ui.cardPile) {
									game.updateRoundNumber();
								}
								if (unmarks.length) {
									for (const i of unmarks) {
										player[(lib.skill[i] && lib.skill[i].mark) || player.hasCard(card => card.hasGaintag(i), "x") ? "markSkill" : "unmarkSkill"](i);
									}
								}
								event.hs = hs;
								event.es = es;
								event.js = js;
								event.ss = ss;
								event.xs = xs;
								game.clearCardKnowers(hs);
								if (hs.length && !event.visible) {
									player.getCards("h").forEach(hcard => {
										hcard.clearKnowers();
									});
								}
							},
							...base.lib.element.content.lose.slice(2),
						],
						/*翻面*/
						turnOver() {
							game.log(player, "翻面");
							game.broadcastAll(player => player.classList.toggle("turnedover"), player);
							game.addVideo("turnOver", player, player.classList.contains("turnedover"));
							player.queueCssAnimation("turned-over 0.5s linear");
						},
						chooseToCompare: [
							base.lib.element.content.chooseToCompare[0],
							async (event, trigger, player) => {
								let __compareName = event.getParent()?.name === "trigger" ? event.name : event.getParent().name;
								if (typeof __compareName === "string" && __compareName.startsWith("pre_")) __compareName = __compareName.slice(4);
								event.compareName = __compareName;
								event.compareId = `${event.compareName}_${get.id()}`;
								event.addMessageHook("finished", function () {
									const dialog = ui.dialogs[this.compareId];
									if (dialog) dialog.close();
								});
								game.broadcastAll(
									function (player, target, eventName, compareId) {
										if (window.decadeUI) {
											const dialog = decadeUI.create.compareDialog();
											dialog.caption = get.translation(get.sourceSkillFor(eventName)) + "拼点";
											dialog.player = player;
											dialog.target = typeof target === "string" ? player : target;
											dialog.open();
											decadeUI.delay(400);
											ui.dialogs[compareId] = dialog;
										}
									},
									player,
									event.target,
									event.compareName,
									event.compareId
								);
							},
							...base.lib.element.content.chooseToCompare.slice(1, 3),
							async (event, trigger, player) => {
								game.broadcastAll(eventName => {
									if (window.decadeUI) {
										const dialog = ui.dialogs[eventName];
										if (dialog) {
											dialog.$playerCard.classList.add("infohidden");
											dialog.$playerCard.classList.add("infoflip");
										}
									}
								}, event.compareId);
							},
							...base.lib.element.content.chooseToCompare.slice(3, 5),
							async (event, trigger, player) => {
								if (event.isDelay) {
									game.broadcastAll(eventName => {
										if (window.decadeUI) {
											const dialog = ui.dialogs[eventName];
											if (dialog) dialog.close();
										}
									}, event.compareId);
								}
							},
							base.lib.element.content.chooseToCompare[5],
							async (event, trigger, player) => {
								const target = event.target;
								game.broadcastAll(
									(eventName, player, target, playerCard, targetCard) => {
										ui.arena.classList.add("thrownhighlight");
										if (window.decadeUI) {
											const dialog = ui.dialogs[eventName];
											if (dialog) {
												dialog.playerCard = playerCard.copy();
												dialog.targetCard = targetCard.copy();
												if (typeof target === "string") dialog.target = player;
											}
										} else {
											ui.arena.classList.add("thrownhighlight");
											player.$compare(playerCard, typeof target === "string" ? player : target, targetCard);
										}
									},
									event.compareId,
									player,
									target,
									event.card1,
									event.card2
								);
								game.addVideo("thrownhighlight1");
							},
							base.lib.element.content.chooseToCompare[7],
							async (event, trigger, player) => {
								decadeUI.delay(400);
							},
							...base.lib.element.content.chooseToCompare.slice(9, 11),
							async (event, trigger, player) => {
								game.broadcastAll(
									function (str, eventName, result) {
										if (!window.decadeUI) {
											const dialog = ui.create.dialog(str);
											dialog.classList.add("center");
											setTimeout(
												function (dialog) {
													dialog.close();
												},
												1000,
												dialog
											);
											return;
										}
										const dialog = ui.dialogs[eventName];
										dialog.$playerCard.dataset.result = result ? "赢" : "没赢";
										setTimeout(
											function (dialog, eventName) {
												dialog.close();
												setTimeout(
													function (dialog) {
														dialog.player.$throwordered2(dialog.playerCard, true);
														dialog.target.$throwordered2(dialog.targetCard, true);
													},
													180,
													dialog
												);
												ui.dialogs[eventName] = undefined;
											},
											1400,
											dialog,
											eventName
										);
									},
									event.str,
									event.compareId,
									event.result.bool
								);
								decadeUI.delay(1800);
							},
							base.lib.element.content.chooseToCompare[12],
						],
						chooseToCompareEffect: [
							...base.lib.element.content.chooseToCompareEffect.slice(0, 2),
							async (event, trigger, player) => {
								const evt = event.parentEvent;
								const target = event.target;
								let __compareName2 = evt.getParent()?.name === "trigger" ? evt.name : evt.getParent().name;
								if (typeof __compareName2 === "string" && __compareName2.startsWith("pre_")) __compareName2 = __compareName2.slice(4);
								event.compareName = __compareName2;
								event.compareId = `${event.compareName}_${get.id()}`;
								event.addMessageHook("finished", function () {
									const dialog = ui.dialogs[this.compareId];
									if (dialog) dialog.close();
								});
								game.broadcastAll(
									function (player, target, eventName, compareId, playerCard, targetCard) {
										if (window.decadeUI) {
											const dialog = decadeUI.create.compareDialog();
											dialog.caption = get.translation(get.sourceSkillFor(eventName)) + "拼点";
											dialog.player = player;
											dialog.target = target;
											dialog.playerCard = playerCard.copy();
											dialog.targetCard = targetCard.copy();
											dialog.open();
											decadeUI.delay(400);
											ui.dialogs[compareId] = dialog;
										} else ui.arena.classList.add("thrownhighlight");
									},
									player,
									target,
									event.compareName,
									event.compareId,
									event.card1,
									event.card2
								);
								game.addVideo("thrownhighlight1");
							},
							base.lib.element.content.chooseToCompareEffect[3],
							async (event, trigger, player) => {
								decadeUI.delay(400);
							},
							...base.lib.element.content.chooseToCompareEffect.slice(5, 7),
							async (event, trigger, player) => {
								game.broadcastAll(
									function (str, eventName, result) {
										if (!window.decadeUI) {
											const dialog = ui.create.dialog(str);
											dialog.classList.add("center");
											setTimeout(
												function (dialog) {
													dialog.close();
												},
												1000,
												dialog
											);
											return;
										}
										const dialog = ui.dialogs[eventName];
										dialog.$playerCard.dataset.result = result ? "赢" : "没赢";
										setTimeout(
											function (dialog, eventName) {
												dialog.close();
												setTimeout(
													function (dialog) {
														dialog.player.$throwordered2(dialog.playerCard, true);
														dialog.target.$throwordered2(dialog.targetCard, true);
													},
													180,
													dialog
												);
												ui.dialogs[eventName] = undefined;
											},
											1400,
											dialog,
											eventName
										);
									},
									event.str,
									event.compareId,
									event.result.bool
								);
								decadeUI.delay(1800);
							},
							...base.lib.element.content.chooseToCompareEffect.slice(8, 10),
						],
						chooseToCompareMultiple: [
							async (event, trigger, player) => {
								const targets = event.targets;
								await base.lib.element.content.chooseToCompareMultiple[0](event, trigger, player);
								let __compareName3 = event.getParent()?.name === "trigger" ? event.name : event.getParent().name;
								if (typeof __compareName3 === "string" && __compareName3.startsWith("pre_")) __compareName3 = __compareName3.slice(4);
								event.compareName = __compareName3;
								event.compareId = `${event.compareName}_${get.id()}`;
								event.addMessageHook("finished", function () {
									const dialog = ui.dialogs[this.compareId];
									if (dialog) dialog.close();
								});
								game.broadcastAll(
									function (player, target, eventName, compareId) {
										if (!window.decadeUI) return;
										const dialog = decadeUI.create.compareDialog();
										dialog.caption = get.translation(get.sourceSkillFor(eventName)) + "拼点";
										dialog.player = player;
										dialog.target = target;
										dialog.open();
										decadeUI.delay(400);
										ui.dialogs[compareId] = dialog;
									},
									player,
									targets[0],
									event.compareName,
									event.compareId
								);
							},
							...base.lib.element.content.chooseToCompareMultiple.slice(1, 4),
							async (event, trigger, player) => {
								game.log(player, "的拼点牌为", event.card1);
								game.broadcastAll(
									function (eventName, playerCard) {
										if (!window.decadeUI) return;
										const dialog = ui.dialogs[eventName];
										dialog.playerCard = playerCard.copy();
									},
									event.compareId,
									event.card1
								);
							},
							async (event, trigger, player) => {
								const targets = event.targets;
								if (event.iwhile < targets.length) {
									event.target = targets[event.iwhile];
									event.target.addTempClass("target");
									player.addTempClass("target");
									event.card2 = event.cardlist[event.iwhile];
									event.num2 = event.getNum(event.card2);
									game.log(event.target, "的拼点牌为", event.card2);
									player.line(event.target);
									game.broadcastAll(
										function (eventName, player, target, playerCard, targetCard) {
											if (!window.decadeUI) {
												player.$compare(playerCard, target, targetCard);
												return;
											}
											let dialog = ui.dialogs[eventName];
											if (!dialog && window.decadeUI) {
												dialog = decadeUI.create.compareDialog();
												dialog.caption = get.translation(get.sourceSkillFor(eventName)) + "拼点";
												dialog.player = player;
												dialog.playerCard = playerCard.copy();
												dialog.open();
												ui.dialogs[eventName] = dialog;
											}
											if (dialog) {
												if (typeof dialog.show === "function") dialog.show();
												dialog.target = target;
												dialog.targetCard = targetCard.copy();
											} else {
												player.$compare(playerCard, target, targetCard);
												return;
											}
										},
										event.compareId,
										player,
										event.target,
										event.card1,
										event.card2
									);
									event.trigger("compare");
								} else {
									event.goto(12);
								}
							},
							async (event, trigger, player) => {
								decadeUI.delay(400);
							},
							...base.lib.element.content.chooseToCompareMultiple.slice(7, 9),
							async (event, trigger, player) => {
								game.broadcastAll(
									function (str, eventName, result) {
										if (!window.decadeUI) {
											const dialog = ui.create.dialog(str);
											dialog.classList.add("center");
											setTimeout(
												function (dialog) {
													dialog.close();
												},
												1000,
												dialog
											);
											return;
										}
										const dialog = ui.dialogs[eventName];
										dialog.$playerCard.dataset.result = result ? "赢" : "没赢";
										setTimeout(
											function (dialog) {
												dialog.close();
												dialog.$playerCard.dataset.result = "";
												setTimeout(
													function (dialog) {
														dialog.target.$throwordered2(dialog.targetCard, true);
													},
													180,
													dialog
												);
												if (typeof eventName !== "undefined") {
													ui.dialogs[eventName] = undefined;
												}
											},
											1400,
											dialog,
											eventName
										);
									},
									event.str,
									event.compareId,
									event.forceWinner === player || (event.forceWinner !== event.target && event.num1 > event.num2)
								);
								decadeUI.delay(1800);
							},
							async (event, trigger, player) => {
								if (event.callback) {
									game.broadcastAll(
										function (card1, card2) {
											if (!window.decadeUI) {
												if (card1.clone) card1.clone.style.opacity = 0.5;
												if (card2.clone) card2.clone.style.opacity = 0.5;
											}
										},
										event.card1,
										event.card2
									);
									const next = game.createEvent("compareMultiple");
									next.player = player;
									next.target = event.target;
									next.card1 = event.card1;
									next.card2 = event.card2;
									next.num1 = event.num1;
									next.num2 = event.num2;
									next.winner = event.winner;
									next.setContent(event.callback);
									event.compareMultiple = true;
								}
							},
							...base.lib.element.content.chooseToCompareMultiple.slice(11, 13),
						],
					},
				},
				init: {
					cssstyles() {
						const temp = lib.config.glow_phase;
						lib.config.glow_phase = "";
						base.lib.init.cssstyles.call(this);
						lib.config.glow_phase = temp;
						ui.css.styles.sheet.insertRule('.avatar-name, .avatar-name-default { font-family: "' + (lib.config.name_font || "xinkai") + '", "xinwei" }', 0);
					},
				},
			},
			ui: {
				updatec() {
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
				},
				updatehl() {
					dui.queueNextFrameTick(dui.layoutHand, dui);
				},
				updatej(player) {
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
				},
				updatem(player) {},
				updatez() {
					window.documentZoom = game.documentZoom;
					document.body.style.zoom = game.documentZoom;
					document.body.style.width = "100%";
					document.body.style.height = "100%";
					document.body.style.transform = "";
				},
				update() {
					for (const update of ui.updates) update();
					if (ui.dialog === undefined || ui.dialog.classList.contains("noupdate")) return;
					if (game.chess) return base.ui.update();
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
				},
				updatejm(player, nodes, start, inv) {
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
				},
				updatexr: (() => {
					return duilib.throttle(ui.updatex, 100, ui);
				})(),
				create: {
					prebutton(item, type, position, noclick) {
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
					},
					rarity(button) {
						if (!lib.config.show_rarity) return;
						const rarity = game.getRarity(button.link);
						const intro = button.node.intro;
						intro.classList.add("showintro");
						intro.classList.add("rarity");
						if (intro.innerText) intro.innerText = "";
						intro.style.backgroundImage = 'url("' + decadeUIPath + "assets/image/rarity_" + rarity + '.png")';
					},
					button(item, type, position, noclick, node) {
						const button = base.ui.create.button.apply(this, arguments);
						if (position) position.appendChild(button);
						return button;
					},
					control() {
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
						//for (let i in lib.element.control) control[i] = lib.element.control[i];
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
					},
					dialog(...args) {
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
					},
					selectlist(list, init, position, onchange) {
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
					},
					identityCard(identity, position, info, noclick) {
						const card = ui.create.card(position, info, noclick);
						card.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
						card.classList.add("button");
						card._customintro = function (uiintro) {
							uiintro.add(`${get.translation(identity + 2)}的身份牌`);
						};
						const fileName = "extension/十周年UI/image/identityCard/mougong_" + identity + ".jpg";
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
					},
					spinningIdentityCard(identity, dialog) {
						const card = ui.create.identityCard(identity);
						const buttons = ui.create.div(".buttons", dialog.content);
						buttons.appendChild(card);
						setTimeout(() => {
							buttons.appendChild(card);
							dialog.open();
						}, 50);
					},
					arena() {
						ui.updatez();
						const result = base.ui.create.arena.apply(this, arguments);
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
					},
					pause() {
						const dialog = base.ui.create.pause.call(this);
						dialog.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
						return dialog;
					},
					characterDialog() {
						const dialog = base.ui.create.characterDialog.apply(this, arguments);
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
								//分离搜索函数
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
					},
					buttonPresets: {
						character(item, type, position, noclick, node) {
							if (node) {
								node.classList.add("button");
								node.classList.add("character");
								node.classList.add("decadeUI");
								node.style.display = "";
							} else {
								node = ui.create.div(".button.character.decadeUI");
							}
							node._link = item;
							if (type == "characterx") {
								if (_status.noReplaceCharacter) {
									type = "character";
								} else if (lib.characterReplace[item] && lib.characterReplace[item].length) {
									item = lib.characterReplace[item].randomGet();
								}
							}
							if (_status.noReplaceCharacter && type == "characterx") type = "character";
							if (type == "characterx") {
								if (lib.characterReplace[item] && lib.characterReplace[item].length) item = lib.characterReplace[item].randomGet();
							}
							node.link = item;
							dui.element.create("character", node);
							const doubleCamp = get.is.double(node._link, true);
							if (doubleCamp) node._changeGroup = true;
							if (type == "characterx" && lib.characterReplace[node._link] && lib.characterReplace[node._link].length > 1) {
								node._replaceButton = true;
							}
							node.refresh = function (node, item, intersection) {
								if (intersection) {
									node.awaitItem = item;
									intersection.observe(node);
								} else {
									node.setBackground(item, "character");
								}
								if (node.node) {
									node.node.name.remove();
									node.node.hp.remove();
									node.node.group.remove();
									node.node.intro.remove();
									if (node.node.replaceButton) node.node.replaceButton.remove();
								}
								node.node = {
									name: decadeUI.element.create("name", node),
									hp: decadeUI.element.create("hp", node),
									group: decadeUI.element.create("identity", node),
									intro: decadeUI.element.create("intro", node),
									info: decadeUI.element.create("info", node),
								};
								const infoitem = get.character(item);
								node.node.name.innerHTML = get.slimName(item);
								if (lib.config.buttoncharacter_style == "default" || lib.config.buttoncharacter_style == "simple") {
									if (lib.config.buttoncharacter_style == "simple") {
										node.node.group.style.display = "none";
									}
									node.classList.add("newstyle");
									node.node.name.dataset.nature = get.groupnature(get.bordergroup(infoitem));
									node.node.group.dataset.nature = get.groupnature(get.bordergroup(infoitem), "raw");
									ui.create.div(node.node.hp);
									const hp = get.infoHp(infoitem[2]);
									const maxHp = get.infoMaxHp(infoitem[2]);
									const hujia = get.infoHujia(infoitem[2]);
									const check =
										(get.mode() == "single" && _status.mode == "changban") ||
										((get.mode() == "guozhan" ||
											(function (config) {
												if (typeof config === "string") return config === "double";
												return Boolean(config) === true;
											})(_status.connectMode ? lib.configOL.double_character : get.config("double_character"))) &&
											(_status.connectMode || (_status.connectMode ? lib.configOL.double_hp : get.config("double_hp")) == "pingjun"));
									let str = get.numStr(hp / (check ? 2 : 1));
									if (hp != maxHp) {
										str += "/";
										str += get.numStr(maxHp / (check ? 2 : 1));
									}
									ui.create.div(".text", str, node.node.hp);
									if (infoitem[2] == 0) {
										node.node.hp.hide();
									} else if (get.infoHp(infoitem[2]) <= 3) {
										node.node.hp.dataset.condition = "mid";
									} else {
										node.node.hp.dataset.condition = "high";
									}
									if (hujia > 0) {
										ui.create.div(node.node.hp, ".shield");
										ui.create.div(".text", get.numStr(hujia), node.node.hp);
									}
								} else {
									const hp = get.infoHp(infoitem[2]);
									const maxHp = get.infoMaxHp(infoitem[2]);
									const shield = get.infoHujia(infoitem[2]);
									if (maxHp > 14) {
										if (typeof infoitem[2] == "string") node.node.hp.innerHTML = infoitem[2];
										else node.node.hp.innerHTML = get.numStr(infoitem[2]);
										node.node.hp.classList.add("text");
									} else {
										for (let i = 0; i < maxHp; i++) {
											const next = ui.create.div("", node.node.hp);
											if (i >= hp) next.classList.add("exclude");
										}
										for (let i = 0; i < shield; i++) {
											ui.create.div(node.node.hp, ".shield");
										}
									}
								}
								if (node.node.hp.childNodes.length == 0) {
									node.node.name.style.top = "8px";
								}
								if (node.node.name.querySelectorAll("br").length >= 4) {
									node.node.name.classList.add("long");
									if (lib.config.buttoncharacter_style == "old") {
										node.addEventListener("mouseenter", ui.click.buttonnameenter);
										node.addEventListener("mouseleave", ui.click.buttonnameleave);
									}
								}
								node.node.intro.innerText = lib.config.intro;
								if (!noclick) lib.setIntro(node);
								if (infoitem[1]) {
									const doubleCamp = get.is.double(item, true);
									if (doubleCamp) {
										node.node.group.innerHTML = doubleCamp.reduce((previousValue, currentValue) => `${previousValue}<div data-nature="${get.groupnature(currentValue)}">${get.translation(currentValue)}</div>`, "");
										if (doubleCamp.length > 4)
											if (new Set([5, 6, 9]).has(doubleCamp.length)) node.node.group.style.height = "48px";
											else node.node.group.style.height = "64px";
									} else node.node.group.innerHTML = `<div>${get.translation(infoitem[1])}</div>`;
									node.node.group.style.backgroundColor = get.translation(`${get.bordergroup(infoitem)}Color`);
								} else {
									node.node.group.style.display = "none";
								}
								if (node._replaceButton) {
									const intro = ui.create.div(".button.replaceButton", node);
									node.node.replaceButton = intro;
									intro.innerText = "切换";
									intro._node = node;
									intro.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
										_status.tempNoButton = true;
										const node = this._node;
										const list = lib.characterReplace[node._link];
										let link = node.link;
										let index = list.indexOf(link);
										if (index == list.length - 1) index = 0;
										else index++;
										link = list[index];
										node.link = link;
										node.refresh(node, link);
										setTimeout(
											_status => {
												_status.tempNoButton = undefined;
											},
											200,
											_status
										);
									});
								}
							};
							node.refresh(node, item, position ? position.intersection : undefined);
							if (position) position.appendChild(node);
							return node;
						},
					},
				},
				click: {
					card(e) {
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
									if (lib.config.extension_十周年UI_showTemp) {
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
									} else {
										const nodeviewas = ui.create.cardTempName(cardskb, this);
										if (lib.config.cardtempname !== "default") nodeviewas.classList.remove("vertical");
									}
									this.dataset.low = 1;
									this.dataset.view = 1;
								}
								if (rsuit != vsuit || rnum != vnum) {
									if (this._tempSuitNum) {
										this._tempSuitNum.delete();
										delete this._tempSuitNum;
									}
									dui.cardTempSuitNum(this, vsuit, vnum);
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
					},
					intro() {
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
						return base.ui.click.intro.apply(this, arguments);
					},
				},
			},
			game: {
				logv(player, card, targets, event, forced, logvid) {
					if (!player) {
						player = _status.event.getParent().logvid;
						if (!player) return;
					}
					const node = ui.create.div(".hidden");
					node.node = {};
					logvid = logvid || get.id();
					game.broadcast((player, card, targets, event, forced, logvid) => game.logv(player, card, targets, event, forced, logvid), player, card, targets, event, forced, logvid);
					if (typeof player == "string") {
						const childNode = Array.from(ui.historybar.childNodes).find(value => value.logvid == player);
						if (childNode) childNode.added.push(card);
						return;
					}
					if (typeof card == "string") {
						if (card != "die") {
							if (lib.skill[card] && lib.skill[card].logv === false && !forced) return;
							if (!lib.translate[card]) return;
						}
						let avatar;
						if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
						else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
						else return;
						node.node.avatar = avatar;
						avatar.style.transform = "";
						avatar.className = "avatar";
						if (card == "die") {
							node.dead = true;
							node.player = player;
							const avatar2 = avatar.cloneNode();
							avatar2.className = "avatarbg grayscale1";
							avatar.appendChild(avatar2);
							avatar.style.opacity = 0.6;
						} else {
							node.node.text = ui.create.div("", get.translation(card, "skill"), avatar);
							node.node.text.dataset.nature = "water";
							node.skill = card;
						}
						node.appendChild(avatar);
						if (card == "die" && targets && targets != player) {
							node.source = targets;
							player = targets;
							if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
							else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
							else if (get.mode() == "guozhan" && player.node && player.node.name_seat) {
								avatar = ui.create.div(".avatar.cardbg");
								avatar.innerHTML = player.node.name_seat.innerHTML[0];
							} else return;
							avatar.style.transform = "";
							node.node.avatar2 = avatar;
							avatar.classList.add("avatar2");
							node.appendChild(avatar);
						}
					} else if (Array.isArray(card)) {
						node.cards = card[1].slice(0);
						card = card[0];
						const info = [card.suit || "", card.number || "", card.name || "", card.nature || ""];
						if (!Array.isArray(node.cards) || !node.cards.length) {
							node.cards = [ui.create.card(node, "noclick", true).init(info)];
						}
						if (card.name == "wuxie") {
							if (ui.historybar.firstChild && ui.historybar.firstChild.type == "wuxie") {
								ui.historybar.firstChild.players.push(player);
								ui.historybar.firstChild.cards.addArray(node.cards);
								return;
							}
							node.type = "wuxie";
							node.players = [player];
						}
						if (card.copy) card.copy(node, false);
						else {
							card = ui.create.card(node, "noclick", true);
							card.init(info);
						}
						let avatar;
						if (!player.isUnseen(0)) avatar = player.node.avatar.cloneNode();
						else if (!player.isUnseen(1)) avatar = player.node.avatar2.cloneNode();
						else if (get.mode() == "guozhan" && player.node && player.node.name_seat) {
							avatar = ui.create.div(".avatar.cardbg");
							avatar.innerHTML = player.node.name_seat.innerHTML[0];
						} else return;
						node.node.avatar = avatar;
						avatar.style.transform = "";
						avatar.classList.add("avatar2");
						node.appendChild(avatar);
						if (targets && targets.length == 1 && targets[0] != player && get.itemtype(targets[0]) == "player")
							(() => {
								let avatar2;
								const target = targets[0];
								if (!target.isUnseen(0)) {
									avatar2 = target.node.avatar.cloneNode();
								} else if (!player.isUnseen(1)) {
									avatar2 = target.node.avatar2.cloneNode();
								} else if (get.mode() == "guozhan" && target.node && target.node.name_seat) {
									avatar2 = ui.create.div(".avatar.cardbg");
									avatar2.innerHTML = target.node.name_seat.innerHTML[0];
								} else {
									return;
								}
								node.node.avatar2 = avatar2;
								avatar2.style.transform = "";
								avatar2.classList.add("avatar2");
								avatar2.classList.add("avatar3");
								node.insertBefore(avatar2, avatar);
							})();
					}
					if (targets && targets.length) {
						if (targets.length == 1 && targets[0] == player) {
							node.targets = [];
						} else {
							node.targets = targets;
						}
					}
					const bounds = dui.boundsCaches.window;
					bounds.check();
					const fullheight = bounds.height,
						num = Math.round((fullheight - 8) / 50),
						margin = (fullheight - 42 * num) / (num + 1);
					node.style.transform = "scale(0.8)";
					ui.historybar.insertBefore(node, ui.historybar.firstChild);
					ui.refresh(node);
					node.classList.remove("hidden");
					Array.from(ui.historybar.childNodes).forEach((value, index) => {
						if (index < num) {
							value.style.transform = `scale(1) translateY(${margin + index * (42 + margin) - 4}px)`;
							return;
						}
						if (value.removetimeout) return;
						value.style.opacity = 0;
						value.style.transform = `scale(1) translateY(${fullheight}px)`;
						value.removetimeout = setTimeout(
							(
								current => () =>
									current.remove()
							)(value),
							500
						);
					});
					if (lib.config.touchscreen) node.addEventListener("touchstart", ui.click.intro);
					else {
						node.addEventListener(lib.config.pop_logv ? "mousemove" : "click", ui.click.logv);
						node.addEventListener("mouseleave", ui.click.logvleave);
					}
					node.logvid = logvid;
					node.added = [];
					if (!game.online) {
						event = event || _status.event;
						event.logvid = node.logvid;
					}
					return node;
				},
				swapSeat(player1, player2, prompt, behind, noanimate) {
					base.game.swapSeat.apply(this, arguments);
					player1.seat = player1.getSeatNum();
					if (player1.node.seat) player1.node.seat.innerHTML = get.cnNumber(player1.seat, true);
					player2.seat = player2.getSeatNum();
					if (player2.node.seat) player2.node.seat.innerHTML = get.cnNumber(player2.seat, true);
				},
				swapPlayer(player, player2) {
					const list = [game.me, player];
					const result = base.game.swapPlayer.call(this, player, player2);
					/*-----------------分割线-----------------*/
					// 单独装备栏
					if (lib.config.extension_十周年UI_aloneEquip && game.me && game.me !== ui.equipSolts.me) {
						ui.equipSolts.me.appendChild(ui.equipSolts.equips);
						ui.equipSolts.me = game.me;
						ui.equipSolts.equips = game.me.node.equips;
						ui.equipSolts.appendChild(game.me.node.equips);
						game.me.$syncExpand();
					}
					// 可见手牌显示
					list.forEach(i => i.decadeUI_updateShowCards());
					if (lib.refreshPlayerSkills) {
						list.forEach(i => lib.refreshPlayerSkills(i));
					}
					if (lib.clearAllSkillDisplay) lib.clearAllSkillDisplay();
					if (lib.refreshPlayerSkills) {
						game.players.concat(game.dead || []).forEach(i => lib.refreshPlayerSkills(i));
					}
					return result;
				},
				swapControl(player) {
					const result = base.game.swapControl.call(this, player);
					// 单独装备栏
					if (lib.config.extension_十周年UI_aloneEquip && game.me && game.me !== ui.equipSolts.me) {
						ui.equipSolts.me.appendChild(ui.equipSolts.equips);
						ui.equipSolts.me = game.me;
						ui.equipSolts.equips = game.me.node.equips;
						ui.equipSolts.appendChild(game.me.node.equips);
						game.me.$syncExpand();
					}
					if (ui.equipSolts) {
						if (game.me && typeof game.me.$handleEquipChange === "function") {
							game.me.$handleEquipChange();
						}
						if (player && typeof player.$handleEquipChange === "function") {
							player.$handleEquipChange();
						}
					}
					// 可见手牌显示
					player.decadeUI_updateShowCards();
					if (lib.refreshPlayerSkills) {
						lib.refreshPlayerSkills(player);
						if (game.me) lib.refreshPlayerSkills(game.me);
					}
					if (lib.clearAllSkillDisplay) lib.clearAllSkillDisplay();
					if (lib.refreshPlayerSkills) {
						game.players.concat(game.dead || []).forEach(i => lib.refreshPlayerSkills(i));
					}
					return result;
				},
				addGlobalSkill() {
					const result = base.game.addGlobalSkill.apply(this, arguments);
					[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
					return result;
				},
				removeGlobalSkill() {
					const result = base.game.removeGlobalSkill.apply(this, arguments);
					[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
					return result;
				},
			},
			get: {
				//十周年UI技能排除
				skillState(player) {
					const skills = base.get.skillState.apply(this, arguments);
					if (game.me !== player) {
						const global = (skills.global = skills.global.concat());
						for (let i = global.length - 1; i >= 0; i--) {
							if (global[i].includes("decadeUI")) global.splice(i, 1);
						}
					}
					return skills;
				},
				objtype(obj) {
					obj = Object.prototype.toString.call(obj);
					const map = {
						"[object Array]": "array",
						"[object Object]": "object",
						"[object HTMLDivElement]": "div",
						"[object HTMLTableElement]": "table",
						"[object HTMLTableRowElement]": "tr",
						"[object HTMLTableCellElement]": "td",
						"[object HTMLBodyElement]": "td",
					};
					return map[obj];
				},
			},
		};
		override(lib, ride.lib);
		override(ui, ride.ui);
		override(game, ride.game);
		override(get, ride.get);
		decadeUI.get.extend(decadeUI, duilib);
		if (decadeModule.modules) {
			for (let i = 0; i < decadeModule.modules.length; i++) {
				decadeModule.modules[i](lib, game, ui, get, ai, _status);
			}
		}
		document.body.onresize = ui.updatexr;
		//game.check修改
		//添加target的un-selectable classList显示
		lib.hooks["checkTarget"].push(function decadeUI_selectable(target, event) {
			const list = ["selected", "selectable"];
			target.classList[list.some(select => target.classList.contains(select)) ? "remove" : "add"]("un-selectable");
		});
		//对十周年UI和本体的视为卡牌样式的同时适配
		const updateTempname = lib.hooks["checkCard"].indexOf(lib.hooks["checkCard"].find(i => i.name && i.name == "updateTempname"));
		lib.hooks["checkCard"][updateTempname] = function updateTempname(card, event) {
			if (lib.config.cardtempname === "off") return;
			const skill = _status.event.skill,
				goon = skill && get.info(skill) && get.info(skill).viewAs && !get.info(skill).ignoreMod && (ui.selected.cards || []).includes(card);
			let cardname, cardnature, cardskb;
			if (!goon) {
				cardname = get.name(card);
				cardnature = get.nature(card);
			} else {
				cardskb = typeof get.info(skill).viewAs == "function" ? get.info(skill).viewAs([card], _status.event.player || game.me) : get.info(skill).viewAs;
				cardname = get.name(cardskb);
				cardnature = get.nature(cardskb);
			}
			if (card.name !== cardname || !get.is.sameNature(card.nature, cardnature, true)) {
				if (lib.config.extension_十周年UI_showTemp) {
					if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);
					let tempname = "",
						tempname2 = get.translation(cardname);
					if (cardnature) {
						card._tempName.dataset.nature = cardnature;
						if (cardname == "sha") {
							tempname2 = get.translation(cardnature) + tempname2;
						}
					}
					tempname += tempname2;
					card._tempName.innerHTML = tempname;
					card._tempName.tempname = tempname;
				} else {
					const node = goon ? ui.create.cardTempName(cardskb, card) : ui.create.cardTempName(card);
					if (lib.config.cardtempname !== "default") node.classList.remove("vertical");
				}
				card.dataset.low = 1;
			}
			const cardnumber = get.number(card),
				cardsuit = get.suit(card);
			if (card.dataset.views != 1 && (card.number != cardnumber || card.suit != cardsuit)) {
				dui.cardTempSuitNum(card, cardsuit, cardnumber);
			}
		};
		//根据手杀ui选项开关调用不同结束出牌阶段的弹出样式
		//为onlineUI样式单独改为取消
		lib.hooks["checkEnd"].push(function decadeUI_UIconfirm() {
			if (_status.event?.name == "chooseToUse" && _status.event.type == "phase" && ui.confirm?.lastChild.link == "cancel") {
				const UIconfig = lib.config.extension_十周年UI_newDecadeStyle;
				let innerHTML = UIconfig !== "othersOff" || UIconfig === "on" ? "回合结束" : "结束出牌";
				if (UIconfig === "onlineUI") innerHTML = "取消";
				else if (_status.event.skill || (ui.selected?.cards ?? []).length > 0) {
					if (UIconfig === "off") innerHTML = "<img draggable='false' src=" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/QX.png>";
					else innerHTML = "取消";
				} else if (UIconfig === "off") {
					innerHTML = "<img draggable='false' src=" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jscp.png>";
				}
				ui.confirm.lastChild.innerHTML = innerHTML;
				const UIcustom = ui.confirm.custom;
				ui.confirm.custom = function (...args) {
					if (typeof UIcustom === "function") UIcustom(...args);
					if (ui.cardDialog) {
						ui.cardDialog.close();
						delete ui.cardDialog;
					}
				};
			}
		});
		//game.uncheck修改
		//对十周年UI和本体的视为卡牌样式的同时适配
		const removeTempname = lib.hooks["uncheckCard"].indexOf(lib.hooks["uncheckCard"].find(i => i.name && i.name == "removeTempname"));
		lib.hooks["uncheckCard"][removeTempname] = function removeTempname(card, event) {
			if (card._tempName) {
				card._tempName.delete();
				delete card._tempName;
				card.dataset.low = 0;
				card.dataset.view = 0;
			}
			if (card._tempSuitNum) {
				card._tempSuitNum.delete();
				delete card._tempSuitNum;
				card.dataset.views = 0;
			}
			if (decadeUI && decadeUI.layout) decadeUI.layout.invalidateHand();
		};
		//移除target的un-selectable classList显示
		lib.hooks["uncheckTarget"].push(function decadeUI_unselectable(target, event) {
			target.classList.remove("un-selectable");
		});
		const updateDialog = lib.hooks["checkOverflow"].indexOf(lib.hooks["checkOverflow"].find(i => i.name && i.name == "updateDialog"));
		lib.hooks["checkOverflow"][updateDialog] = function updateDialog(itemOption, itemContainer, addedItems, game) {
			//计算压缩折叠的量
			const gap = 5;
			const L = itemContainer.originWidth / game.documentZoom;
			const W = addedItems[0].getBoundingClientRect().width / game.documentZoom;
			let n = addedItems.length;
			const r = -20; //为偏移留出的空间，如果r为0，可能会把前面的卡牌全遮住
			if (n * W + (n + 1) * gap < L) {
				itemContainer.style.setProperty("--ml", gap + "px");
			} else {
				const ml = Math.min((n * W - L + 30 * n) / (n - 1), W - r / game.documentZoom);
				itemContainer.style.setProperty("--ml", "-" + ml + "px");
			}
		};
		ui.click.identity = function (e) {
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
				if (!dui.$identityMarkBox) {
					dui.$identityMarkBox = decadeUI.element.create("identity-mark-box");
					dui.$identityMarkBox.ondeactive = function () {
						dui.$identityMarkBox.remove();
						_status.clicked = false;
						if (!ui.arena.classList.contains("menupaused")) game.resume2();
					};
				}
				let index = 0;
				let node;
				const nodes = dui.$identityMarkBox.childNodes;
				for (const key in identityList) {
					node = nodes[index];
					if (!node) {
						node = decadeUI.element.create("identity-mark-item", dui.$identityMarkBox);
						node.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
							this.player.setIdentity(this.link);
							dui.$identityMarkBox.remove();
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
						player.appendChild(dui.$identityMarkBox);
						dui.set.activeElement(dui.$identityMarkBox);
					},
					0,
					this.parentNode
				);
			}
		};
		ui.click.volumn = function () {
			const setting = ui.create.dialog("hidden");
			setting.listen(function (e) {
				e.stopPropagation();
			});
			const backVolume = decadeUI.component.slider(0, 8, parseInt(lib.config.volumn_background));
			const gameVolume = decadeUI.component.slider(0, 8, parseInt(lib.config.volumn_audio));
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
		};
		ui.clear = function () {
			game.addVideo("uiClear");
			const nodes = document.getElementsByClassName("thrown");
			for (let i = nodes.length - 1; i >= 0; i--) {
				if (nodes[i].fixed) continue;
				if (nodes[i].classList.contains("card")) {
					if (nodes[i].name && (nodes[i].name.startsWith("shengbei_left_") || nodes[i].name.startsWith("shengbei_right_"))) {
						nodes[i].delete();
					} else {
						decadeUI.layout.clearout(nodes[i]);
					}
				} else nodes[i].delete();
			}
		};
		ui.create.me = function (hasme) {
			ui.arena.dataset.layout = game.layout;
			ui.mebg = ui.create.div("#mebg", ui.arena);
			ui.me = ui.create.div(".hand-wrap", ui.arena);
			ui.handcards1Container = decadeUI.element.create("hand-cards", ui.me);
			ui.handcards1Container.onmousewheel = decadeUI.handler.handMousewheel;
			ui.handcards2Container = ui.create.div("#handcards2");
			ui.arena.classList.remove("nome");
			const equipSolts = (ui.equipSolts = decadeUI.element.create("equips-wrap"));
			equipSolts.back = decadeUI.element.create("equips-back", equipSolts);
			for (let repetition = 0; repetition < 5; repetition++) {
				const ediv = decadeUI.element.create(null, equipSolts.back);
				ediv.dataset.type = repetition;
			}
			ui.arena.insertBefore(equipSolts, ui.me);
			if (!lib.config.extension_十周年UI_aloneEquip) {
				equipSolts.style.display = "none";
			}
			decadeUI.bodySensor.addListener(decadeUI.layout.resize);
			decadeUI.layout.resize();
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
			/*-----------------分割线-----------------*/
			if (lib.config.extension_十周年UI_aloneEquip) {
				if (game.me) {
					equipSolts.me = game.me;
					equipSolts.equips = game.me.node.equips;
					equipSolts.appendChild(game.me.node.equips);
				}
			}
		};
		ui.create.player = function (position, noclick) {
			const player = ui.create.div(".player", position);
			const playerExtend = {
				node: {
					avatar: ui.create.div(".primary-avatar", player, ui.click.avatar).hide(),
					avatar2: ui.create.div(".deputy-avatar", player, ui.click.avatar2).hide(),
					turnedover: decadeUI.element.create("turned-over", player),
					framebg: ui.create.div(".framebg", player),
					intro: ui.create.div(".intro", player),
					identity: ui.create.div(".identity", player),
					hp: ui.create.div(".hp", player),
					//------创造位置-----//
					long: ui.create.div(".long", player),
					wei: ui.create.div(".wei", player),
					//-------分割线------//
					name: ui.create.div(".name", player),
					name2: ui.create.div(".name.name2", player),
					nameol: ui.create.div(".nameol", player),
					count: ui.create.div(".card-count", player),
					equips: ui.create.div(".equips", player).hide(),
					judges: ui.create.div(".judges", player),
					marks: decadeUI.element.create("dui-marks", player),
					chain: decadeUI.element.create("chain", player),
					handcards1: ui.create.div(".handcards"),
					handcards2: ui.create.div(".handcards"),
					expansions: ui.create.div(".expansions"),
				},
				phaseNumber: 0,
				invisibleSkills: [],
				skipList: [],
				skills: [],
				initedSkills: [],
				additionalSkills: {},
				disabledSkills: {},
				hiddenSkills: [],
				awakenedSkills: [],
				forbiddenSkills: {},
				popups: [],
				damagepopups: [],
				judging: [],
				extraEquip: [],
				stat: [
					{
						card: {},
						skill: {},
						triggerSkill: {},
					},
				],
				actionHistory: [
					{
						useCard: [],
						respond: [],
						skipped: [],
						lose: [],
						gain: [],
						sourceDamage: [],
						damage: [],
						custom: [],
						useSkill: [],
					},
				],
				tempSkills: {},
				storage: {
					counttrigger: new Proxy(
						{},
						{
							get(_, prop) {
								return player.getStat("triggerSkill")[prop];
							},
							set(_, prop, value) {
								player.getStat("triggerSkill")[prop] = value;
								return true;
							},
							deleteProperty(_, prop) {
								delete player.getStat("triggerSkill")[prop];
								return true;
							},
							has(_, prop) {
								return prop in player.getStat("triggerSkill");
							},
							ownKeys() {
								return Reflect.ownKeys(player.getStat("triggerSkill"));
							},
							getOwnPropertyDescriptor(_, prop) {
								return Object.getOwnPropertyDescriptor(player.getStat("triggerSkill"), prop);
							},
						}
					),
				},
				marks: {},
				expandedSlots: {},
				disabledSlots: {},
				ai: {
					friend: [],
					enemy: [],
					neutral: [],
					handcards: {
						global: [],
						source: [],
						viewed: [],
					},
				},
				queueCount: 0,
				outCount: 0,
				vcardsMap: {
					handcards: [],
					equips: [],
					judges: [],
				},
			};
			const chainImg = new Image();
			chainImg.onerror = function () {
				const node = decadeUI.element.create("chain-back", player.node.chain);
				for (let i = 0; i < 40; i++) decadeUI.element.create("cardbg", node).style.transform = "translateX(" + (i * 5 - 5) + "px)";
				chainImg.onerror = undefined;
			};
			chainImg.src = decadeUIPath + "assets/image/tie_suo.png";
			const extend = {
				$cardCount: playerExtend.node.count,
				$dynamicWrap: decadeUI.element.create("dynamic-wrap"),
			};
			playerExtend.node.handcards1._childNodesWatcher = new ChildNodesWatcher(playerExtend.node.handcards1);
			playerExtend.node.handcards2._childNodesWatcher = new ChildNodesWatcher(playerExtend.node.handcards2);
			decadeUI.get.extend(player, extend);
			decadeUI.get.extend(player, playerExtend);
			//decadeUI.get.extend(player, lib.element.player);
			Object.setPrototypeOf(player, lib.element.Player.prototype);
			player.node.action = ui.create.div(".action", player.node.avatar);
			const realIdentity = ui.create.div(player.node.identity);
			realIdentity.player = player;
			let observer = new MutationObserver(mutationsList => {
				for (let mutation of mutationsList) {
					if (mutation.type === "childList") {
						const addedNodes = Array.from(mutation.addedNodes);
						const removedNodes = Array.from(mutation.removedNodes);
						if (addedNodes.some(card => !card.classList.contains("emptyequip")) || removedNodes.some(card => !card.classList.contains("emptyequip"))) {
							player.$handleEquipChange();
						}
					}
				}
			});
			const config = {
				childList: true,
			};
			observer.observe(playerExtend.node.equips, config);
			Object.defineProperties(realIdentity, {
				innerHTML: {
					configurable: true,
					get() {
						return this.innerText;
					},
					set(value) {
						if (get.mode() == "guozhan" || _status.mode == "jiange" || _status.mode == "siguo") {
							this.style.display = "none";
							this.innerText = value;
							this.parentNode.classList.add("guozhan-mode");
							return;
						}
						const currentStyle = lib.config.extension_十周年UI_newDecadeStyle;
						if (currentStyle === "codename" && value === "猜") {
							this.innerText = "";
							this.style.visibility = "";
							this.parentNode.style.backgroundImage = "";
							return;
						}
						let filename;
						let checked;
						const identity = this.parentNode.dataset.color;
						const gameMode = get.mode();
						const handlerMap = {
							猜: () => {
								filename = "cai";
								if (_status.mode == "purple" && identity == "cai") {
									filename += "_blue";
									checked = true;
								}
							},
							友: () => {
								filename = "friend";
							},
							敌: () => {
								filename = "enemy";
							},
							反: () => {
								filename = "fan";
								if (get.mode() == "doudizhu") {
									filename = "nongmin";
									checked = true;
								}
							},
							主: () => {
								filename = "zhu";
								if (get.mode() == "versus" && get.translation(player.side + "Color") == "wei") {
									filename += "_blue";
									this.player.classList.add("opposite-camp");
									checked = true;
								} else if (get.mode() == "doudizhu") {
									filename = "dizhu";
									checked = true;
								}
							},
							忠: () => {
								filename = "zhong";
								if (gameMode == "identity" && _status.mode == "purple") {
									filename = "qianfeng";
								} else if (get.mode() == "versus" && get.translation(player.side + "Color") == "wei") {
									filename += "_blue";
									this.player.classList.add("opposite-camp");
									checked = true;
								}
							},
							内: () => {
								if (_status.mode == "purple") {
									filename = identity == "rNei" ? "xizuo" : "xizuo_blue";
									checked = true;
								} else {
									filename = "nei";
								}
							},
							野: () => {
								filename = "ye";
							},
							首: () => {
								filename = "zeishou";
							},
							帅: () => {
								filename = "zhushuai";
							},
							将: () => {
								filename = "dajiang";
								if (_status.mode == "three" || get.translation(player.side + "Color") == "wei") {
									filename = "zhushuai_blue";
									checked = true;
								}
							},
							兵: () => {
								filename = this.player.side === false ? "qianfeng_blue" : "qianfeng";
								checked = true;
							},
							卒: () => {
								filename = this.player.side === false ? "qianfeng_blue" : "qianfeng";
								checked = true;
							},
							师: () => {
								filename = "junshi";
							},
							盟: () => {
								filename = "mengjun";
							},
							神: () => {
								filename = "boss";
							},
							从: () => {
								filename = "suicong";
							},
							先: () => {
								filename = "xianshou";
							},
							后: () => {
								filename = "houshou";
							},
							民: () => {
								filename = "commoner";
							},
						};
						const fn = handlerMap[value];
						if (fn) {
							fn();
						} else {
							this.innerText = value;
							this.style.visibility = "";
							this.parentNode.style.backgroundImage = "";
							return;
						}
						if (!checked && this.parentNode.dataset.color) {
							if (this.parentNode.dataset.color[0] == "b") {
								filename += "_blue";
								this.player.classList.add("opposite-camp");
							}
						}
						this.innerText = value;
						this.style.visibility = "hidden";
						const image = new Image();
						image.node = this;
						image.onerror = function () {
							this.node.style.visibility = "";
						};

						// 不同样式身份标记
						const style = lib.config.extension_十周年UI_newDecadeStyle;
						const srcMap = {
							onlineUI: "image/decorationo/identity2_",
							babysha: "image/decorationh/identity3_",
							on: "image/decoration/identity_",
							othersOff: "image/decoration/identity_",
							codename: "image/decoration_code/identity5_",
						};
						const srcPrefix = srcMap[style] || "image/decorations/identity2_";
						image.src = decadeUIPath + srcPrefix + filename + ".png";
						this.parentNode.style.backgroundImage = 'url("' + image.src + '")';
					},
				},
			});
			Object.defineProperties(player.node.count, {
				innerHTML: {
					configurable: true,
					get() {
						return this.textContent;
					},
					set(value) {
						if (this.textContent == value) return;
						this.textContent = value;
						this.dataset.text = value;
					},
				},
			});
			if (!noclick) {
				player.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.target);
				player.node.identity.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.identity);
				if (lib.config.touchscreen) {
					player.addEventListener("touchstart", ui.click.playertouchstart);
				}
			} else {
				player.noclick = true;
			}
			const campWrap = decadeUI.element.create("camp-wrap");
			const hpWrap = decadeUI.element.create("hp-wrap");
			player.insertBefore(campWrap, player.node.name);
			player.insertBefore(hpWrap, player.node.hp);
			player.node.campWrap = campWrap;
			player.node.hpWrap = hpWrap;
			hpWrap.appendChild(player.node.hp);
			const campWrapExtend = {
				node: {
					back: decadeUI.element.create("camp-back", campWrap),
					border: decadeUI.element.create("camp-border", campWrap),
					campName: decadeUI.element.create("camp-name", campWrap),
					avatarName: player.node.name,
					avatarDefaultName: decadeUI.element.create("avatar-name-default", campWrap),
				},
			};
			decadeUI.get.extend(campWrap, campWrapExtend);
			campWrap.appendChild(player.node.name);
			campWrap.node.avatarName.className = "avatar-name";
			campWrap.node.avatarDefaultName.innerHTML = get.mode() === "guozhan" ? "主将" : "隐匿";
			const node = {
				mask: player.insertBefore(decadeUI.element.create("mask"), player.node.identity),
				gainSkill: decadeUI.element.create("gain-skill", player),
			};
			const properties = {
				gainSkill: {
					player: player,
					gain(skill) {
						const sender = this;
						if (!sender.skills) sender.skills = [];
						if (!sender.skills.includes(skill) && lib.translate[skill]) {
							// 手杀样式下将获得技能显示在标记内
							if (lib.config.extension_十周年UI_newDecadeStyle === "off" && lib.config.extension_十周年UI_gainSkillsVisible !== "off") {
								const info = lib.skill[skill];
								if (!info || info.charlotte || info.sub || (info.mark && !info.limited) || info.nopop || info.popup === false || info.equipSkill) return;
								if (info.onremove && game.me != this.player.storage[skill]) return;
								if (lib.config.extension_十周年UI_gainSkillsVisible === "othersOn" && player === game.me) return;
								if (!info.intro)
									info.intro = {
										content() {
											return get.skillInfoTranslation(skill, player, false);
										},
									};
								player.markSkill(skill);
							}
							sender.skills.push(skill);
							let html = "";
							for (let i = 0; i < sender.skills.length; i++) {
								/*-----------------分割线-----------------*/
								html += `${lib.translate[sender.skills[i]]} `;
								sender.innerHTML = html;
							}
						}
					},
					lose(skill) {
						const sender = this;
						const index = sender.skills.indexOf(skill);
						if (index >= 0) {
							sender.skills.splice(index, 1);
							let html = "";
							for (let i = 0; i < sender.skills.length; i++) {
								/*-----------------分割线-----------------*/
								html += `${lib.translate[sender.skills[i]]} `;
							}
							sender.innerHTML = html;
						}
					},
				},
			};
			decadeUI.get.extend(node.gainSkill, properties.gainSkill);
			decadeUI.get.extend(player.node, node);
			return player;
		};
		ui.create.card = function (position, info, noclick) {
			const card = ui.create.div(".card");
			card.node = {
				image: ui.create.div(".image", card),
				info: ui.create.div(".info"),
				suitnum: decadeUI.element.create("suit-num", card),
				name: ui.create.div(".name", card),
				name2: ui.create.div(".name2", card),
				background: ui.create.div(".background", card),
				intro: ui.create.div(".intro", card),
				range: ui.create.div(".range", card),
				gaintag: decadeUI.element.create("gaintag info", card),
				judgeMark: decadeUI.element.create("judge-mark", card),
				cardMask: decadeUI.element.create("card-mask", card),
			};
			const extend = {
				$name: decadeUI.element.create("top-name", card),
				$vertname: card.node.name,
				$equip: card.node.name2,
				$suitnum: card.node.suitnum,
				$range: card.node.range,
				$gaintag: card.node.gaintag,
			};
			for (const i in extend) card[i] = extend[i];
			//for (var i in lib.element.card) card[i] = lib.element.card[i];
			Object.setPrototypeOf(card, lib.element.Card.prototype);
			card.node.intro.innerText = lib.config.intro;
			if (!noclick) lib.setIntro(card);
			card.storage = {};
			card.vanishtag = [];
			card.gaintag = [];
			card._uncheck = [];
			if (info != "noclick") {
				card.addEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.card);
				if (lib.config.touchscreen) {
					card.addEventListener("touchstart", ui.click.cardtouchstart);
					card.addEventListener("touchmove", ui.click.cardtouchmove);
				}
				if (lib.cardSelectObserver) {
					lib.cardSelectObserver.observe(card, {
						attributes: true,
					});
				}
			}
			card.$suitnum.$num = decadeUI.element.create(null, card.$suitnum, "span");
			card.$suitnum.$num.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
			card.$suitnum.$br = decadeUI.element.create(null, card.$suitnum, "br");
			card.$suitnum.$suit = decadeUI.element.create("suit", card.$suitnum, "span");
			card.$suitnum.$suit.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
			card.$equip.$suitnum = decadeUI.element.create(null, card.$equip, "span");
			card.$equip.$name = decadeUI.element.create(null, card.$equip, "span");
			card.node.judgeMark.node = {
				back: decadeUI.element.create("back", card.node.judgeMark),
				mark: decadeUI.element.create("mark", card.node.judgeMark),
				judge: decadeUI.element.create("judge", card.node.judgeMark),
			};
			if (position) position.appendChild(card);
			return card;
		};
		ui.create.cards = function () {
			const result = base.ui.create.cards.apply(this, arguments);
			game.updateRoundNumber();
			return result;
		};
		lib.init.layout = function (layout, nosave) {
			if (!nosave) game.saveConfig("layout", layout);
			game.layout = layout;
			const relayout = function () {
				ui.arena.dataset.layout = game.layout;
				if (lib.config.phonelayout) {
					ui.css.phone.href = lib.assetURL + "layout/default/phone.css";
					ui.arena.classList.add("phone");
					ui.arena.setAttribute("data-phonelayout", "on");
				} else {
					ui.css.phone.href = "";
					ui.arena.classList.remove("phone");
					ui.arena.setAttribute("data-phonelayout", "off");
				}
				for (let i = 0; i < game.players.length; i++) {
					if (get.is.linked2(game.players[i])) {
						if (game.players[i].classList.contains("linked")) {
							game.players[i].classList.remove("linked");
							game.players[i].classList.add("linked2");
						}
					} else {
						if (game.players[i].classList.contains("linked2")) {
							game.players[i].classList.remove("linked2");
							game.players[i].classList.add("linked");
						}
					}
				}
				ui.updatej();
				ui.updatem();
				setTimeout(() => {
					if (game.me) game.me.update();
					setTimeout(() => {
						ui.updatex();
					}, 500);
					setTimeout(() => {
						ui.updatec();
					}, 1000);
				}, 100);
			};
			setTimeout(relayout, 500);
		};
		Object.defineProperties(lib.element.player, {
			group: {
				configurable: true,
				get() {
					return this._group;
				},
				set(group) {
					if (!group) return;
					this._group = group;
					this.node.campWrap.dataset.camp = get.character(this.name)?.groupBorder || group;
					if (lib.config.extension_十周年UI_forcestyle == "2") {
						this._group = group;
						this.node.campWrap.dataset.camp = get.character(this.name)?.groupBorder || group;
						if (!decadeUI.config.campIdentityImageMode) {
							if (!this._finalGroup) {
								this.node.campWrap.node.campName.innerHTML = "";
							} else {
								const name = get.translation(this._finalGroup);
								const str = get.plainText(name);
								if (str.length <= 2) {
									this.node.campWrap.node.campName.innerHTML = name;
								} else {
									this.node.campWrap.node.campName.innerHTML = name.replaceAll(str, str[0]);
								}
							}
						} else {
							//使用队列解决异步竞争势力变更问题
							this._lastCampTask = this._lastCampTask || Promise.resolve();
							this._lastCampTask = this._lastCampTask.then(async () => {
								this.node.campWrap.node.campName.innerHTML = "";
								this.node.campWrap.node.campName.style.backgroundImage = "";
								this._finalGroup = group;
								const create = () => {
									if (decadeUI.config.newDecadeStyle == "codename" || !this._finalGroup) {
										this.node.campWrap.node.campName.innerHTML = "";
									} else {
										const name = get.translation(this._finalGroup);
										const str = get.plainText(name);
										this.node.campWrap.node.campName.innerHTML = str.length <= 2 ? name : name.replaceAll(str, str[0]);
									}
								};
								const loadImage = url => {
									return new Promise((resolve, reject) => {
										const image = new Image();
										image.onload = () => resolve(url);
										image.onerror = () => reject(url);
										image.src = url;
									});
								};
								if (decadeUI.config.newDecadeStyle == "onlineUI") {
									create();
									return;
								}
								try {
									const primaryUrl = decadeUIPath + (decadeUI.config.newDecadeStyle == "off" ? "image/decorations/name2_" : decadeUI.config.newDecadeStyle == "babysha" ? "image/decorationh/hs_" : "image/decoration/name_") + group + ".png";
									await loadImage(primaryUrl);
									this.node.campWrap.node.campName.style.backgroundImage = `url("${primaryUrl}")`;
									return;
								} catch {}
								try {
									const imageName = `group_${group}`;
									const info = lib.card[imageName];
									if (!info || !info.image) throw new Error();
									let src;
									if (info.image.startsWith("db:")) {
										src = await game.getDB("image", info.image.slice(3));
									} else if (info.image.startsWith("ext:")) {
										src = `${lib.assetURL}${info.image.replace(/^ext:/, "extension/")}`;
									} else {
										src = `${lib.assetURL}${info.image}`;
									}
									await loadImage(src);
									this.node.campWrap.node.campName.style.backgroundImage = `url("${src}")`;
									return;
								} catch {}
								create();
							});
						}
					} else {
						if (decadeUI.config.newDecadeStyle == "codename") {
							this.node.campWrap.node.campName.innerHTML = "";
						} else if (!this._finalGroup) {
							this.node.campWrap.node.campName.innerHTML = "";
						} else {
							const name = get.translation(this._finalGroup);
							const str = get.plainText(name);
							if (str.length <= 1) {
								this.node.campWrap.node.campName.innerHTML = name;
							} else {
								this.node.campWrap.node.campName.innerHTML = str[0];
							}
						}
						if (decadeUI.config.newDecadeStyle == "off") {
							const image = new Image();
							const url = decadeUIPath + (decadeUI.config.newDecadeStyle == "off" ? "image/decorations/name2_" : decadeUI.config.newDecadeStyle == "babysha" ? "image/decorationh/hs_" : decadeUI.config.newDecadeStyle == "othersOff" ? "image/decoration/name_" : "image/decoration/name_") + group + ".png";
							this._finalGroup = group;
							const create = () => {
								if (decadeUI.config.newDecadeStyle == "codename") {
									this.node.campWrap.node.campName.innerHTML = "";
								} else if (!this._finalGroup) {
									this.node.campWrap.node.campName.innerHTML = "";
								} else {
									const name = get.translation(this._finalGroup);
									const str = get.plainText(name);
									if (str.length <= 1) {
										this.node.campWrap.node.campName.innerHTML = name;
									} else {
										this.node.campWrap.node.campName.innerHTML = str[0];
									}
								}
							};
							image.onerror = () => {
								create();
							};
							this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
							image.src = url;
						} else {
							this._finalGroup = group;
							// codename样式下不显示文字势力
							if (decadeUI.config.newDecadeStyle == "codename") {
								this.node.campWrap.node.campName.innerHTML = "";
							} else if (!this._finalGroup) {
								this.node.campWrap.node.campName.innerHTML = "";
							} else {
								const name = get.translation(this._finalGroup);
								const str = get.plainText(name);
								if (str.length <= 1) {
									this.node.campWrap.node.campName.innerHTML = name;
								} else {
									this.node.campWrap.node.campName.innerHTML = str[0];
								}
							}
						}
					}
				},
			},
		});
	},
	dialog: createDecadeUIDialogModule(),
	animate: createDecadeUIAnimateModule(),
	ResizeSensor: createResizeSensorClass(),
	sheet: {
		init() {
			if (!this.sheetList) {
				this.sheetList = [];
				for (let i = 0; i < document.styleSheets.length; i++) {
					if (document.styleSheets[i].href && document.styleSheets[i].href.indexOf("extension/" + encodeURI(decadeUIName)) != -1) {
						this.sheetList.push(document.styleSheets[i]);
					}
				}
			}
			if (this.sheetList) delete this.init;
		},
		getStyle(selector, cssName) {
			if (!this.sheetList) this.init();
			if (!this.sheetList) throw "sheet not loaded";
			if (typeof selector != "string" || !selector) throw 'parameter "selector" error';
			if (!this.cachedSheet) this.cachedSheet = {};
			if (this.cachedSheet[selector]) return this.cachedSheet[selector];
			const sheetList = this.sheetList;
			let sheet;
			let shouldBreak = false;
			for (let j = sheetList.length - 1; j >= 0; j--) {
				if (typeof cssName == "string") {
					cssName = cssName.replace(/.css/, "") + ".css";
					for (let k = j; k >= 0; k--) {
						if (sheetList[k].href.indexOf(cssName) != -1) {
							sheet = sheetList[k];
						}
					}
					shouldBreak = true;
					if (!sheet) throw "cssName not found";
				} else {
					sheet = sheetList[j];
				}
				// 添加try-catch保证正常运行
				try {
					for (let i = 0; i < sheet.cssRules.length; i++) {
						if (!(sheet.cssRules[i] instanceof CSSMediaRule)) {
							if (sheet.cssRules[i].selectorText == selector) {
								this.cachedSheet[selector] = sheet.cssRules[i].style;
								return sheet.cssRules[i].style;
							}
						} else {
							const rules = sheet.cssRules[i].cssRules;
							for (let j = 0; j < rules.length; j++) {
								if (rules[j].selectorText == selector) {
									return rules[j].style;
								}
							}
						}
					}
				} catch (error) {
					console.error(error);
					console.log("error-sheet", sheet);
				}
				if (shouldBreak) break;
			}
			return null;
		},
		insertRule(rule, index, cssName) {
			if (!this.sheetList) this.init();
			if (!this.sheetList) throw "sheet not loaded";
			if (typeof rule != "string" || !rule) throw 'parameter "rule" error';
			let sheet;
			if (typeof cssName == "string") {
				for (let j = sheetList.length - 1; j >= 0; j--) {
					cssName = cssName.replace(/.css/, "") + ".css";
					if (sheetList[j].href.indexOf(cssName) != -1) {
						sheet = sheetList[k];
					}
				}
				if (!sheet) throw "cssName not found";
			}
			if (!sheet) sheet = this.sheetList[this.sheetList.length - 1];
			let inserted = 0;
			if (typeof index == "number") {
				inserted = sheet.insertRule(rule, index);
			} else {
				inserted = sheet.insertRule(rule, sheet.cssRules.length);
			}
			return sheet.cssRules[inserted].style;
		},
	},
	layout: {
		update() {
			this.updateHand();
			this.updateDiscard();
		},
		updateHand() {
			if (!game.me) return;
			const handNode = ui.handcards1;
			if (!handNode) return console.error("hand undefined");
			const cards = [];
			const childs = handNode.childNodes;
			for (let i = 0; i < childs.length; i++) {
				const card = childs[i];
				if (!card.classList.contains("removing")) {
					cards.push(card);
				} else {
					card.scaled = false;
				}
			}
			if (!cards.length) return;
			const bounds = dui.boundsCaches.hand;
			bounds.check();
			const pw = bounds.width;
			const ph = bounds.height;
			const cw = bounds.cardWidth;
			const ch = bounds.cardHeight;
			const cs = bounds.cardScale;
			const csw = cw * cs;
			let x;
			const y = Math.round((ch * cs - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			let totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;
			let expand;
			if (totalW > limitW) {
				xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
				if (lib.config.fold_card) {
					let min = cs;
					min *= 9;
					if (xMargin < min) {
						expand = true;
						xMargin = min;
					}
				}
			} else {
				/*-----------------分割线-----------------*/
				// 手牌折叠方式
				if (lib.config.extension_十周年UI_newDecadeStyle == "codename") {
					// codename样式始终居中
					xStart = (ui.arena.offsetWidth - totalW) / 2 - bounds.x;
				} else if (get.is && typeof get.is.phoneLayout === "function" && lib.config.phonelayout) {
					xStart += 0; // 触屏模式靠左
				} else if (lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff") {
					xStart = (ui.arena.offsetWidth - totalW) / 2 - bounds.x;
				}
			}
			let selectedIndex = -1;
			for (let i = 0; i < cards.length; i++) {
				if (cards[i].classList.contains("selected")) {
					if (selectedIndex !== -1) {
						selectedIndex = -1;
						break;
					}
					selectedIndex = i;
				}
			}
			const folded = totalW > limitW && xMargin < csw - 0.5;
			let spreadOffsetLeft = 0;
			let spreadOffsetRight = 0;
			let baseShift = 0;
			if (folded && selectedIndex !== -1) {
				const spreadOffset = Math.max(0, csw - xMargin + 2);
				spreadOffsetLeft = Math.round(spreadOffset * 0.2);
				spreadOffsetRight = spreadOffset;
				const selX = xStart + selectedIndex * xMargin;
				const maxSelX = Math.max(0, limitW - csw);
				const targetSelX = Math.max(0, Math.min(maxSelX, selX));
				baseShift = Math.round(targetSelX - selX);
			}
			for (let i = 0; i < cards.length; i++) {
				let fx = xStart + i * xMargin + baseShift;
				if (spreadOffsetLeft || spreadOffsetRight) {
					if (i < selectedIndex) fx -= spreadOffsetLeft;
					else if (i > selectedIndex) fx += spreadOffsetRight;
				}
				x = Math.round(fx);
				const card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
				card._transform = card.style.transform;
				card.updateTransform(card.classList.contains("selected"));
			}
			if (expand) {
				/*-----------------分割线-----------------*/
				// 手牌滑动，咸鱼大佬提供代码
				ui.handcards1Container.classList.add("scrollh");
				ui.handcards1Container.style.overflowX = "scroll";
				ui.handcards1Container.style.overflowY = "hidden";
				handNode.style.width = Math.round(cards.length * xMargin + (csw - xMargin)) + "px";
			} else {
				/*-----------------分割线-----------------*/
				// 手牌滑动，咸鱼大佬提供代码
				ui.handcards1Container.classList.remove("scrollh");
				ui.handcards1Container.style.overflowX = "";
				ui.handcards1Container.style.overflowY = "";
				handNode.style.width = "100%";
			}
		},
		updateDiscard() {
			if (!ui.thrown) ui.thrown = [];
			for (let i = ui.thrown.length - 1; i >= 0; i--) {
				if (ui.thrown[i].classList.contains("drawingcard") || ui.thrown[i].classList.contains("removing") || ui.thrown[i].parentNode != ui.arena || ui.thrown[i].fixed) {
					ui.thrown.splice(i, 1);
				} else {
					ui.thrown[i].classList.remove("removing");
				}
			}
			if (!ui.thrown.length) return;
			const cards = ui.thrown;
			const bounds = dui.boundsCaches.arena;
			bounds.check();
			const pw = bounds.width;
			const ph = bounds.height;
			const cw = bounds.cardWidth;
			const ch = bounds.cardHeight;
			const cardScale = (lib && lib.config && lib.config.extension_十周年UI_cardScale) || 0.18;
			const discardScale = Math.max(0.1, parseFloat(cardScale) - 0.05);
			const bodySize = decadeUI.get.bodySize();
			const base = discardScale;
			const cs = Math.min((bodySize.height * base) / ch, 1);
			const csw = cw * cs;
			let x;
			const y = Math.round((ph - ch) / 2);
			let xMargin = csw + 2;
			let xStart = (csw - cw) / 2;
			let totalW = cards.length * csw + (cards.length - 1) * 2;
			const limitW = pw;
			if (totalW > limitW) {
				xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
			} else {
				xStart += (limitW - totalW) / 2;
			}
			let card;
			for (let i = 0; i < cards.length; i++) {
				x = Math.round(xStart + i * xMargin);
				card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
			}
		},
		clearout(card) {
			if (!card) return;
			if (card.fixed || card.classList.contains("removing")) return;
			if (card.name && (card.name.startsWith("shengbei_left_") || card.name.startsWith("shengbei_right_"))) {
				card.delete();
				return;
			}
			if (ui.thrown.indexOf(card) == -1) {
				ui.thrown.splice(0, 0, card);
				dui.queueNextFrameTick(dui.layoutDiscard, dui);
			}
			card.classList.add("invalided");
			setTimeout(
				function (card) {
					card.remove();
					dui.queueNextFrameTick(dui.layoutDiscard, dui);
				},
				2333,
				card
			);
		},
		// 通用防抖辅助方法
		_debounce(config) {
			let timestamp = config.defaultDelay;
			const nowTime = new Date().getTime();
			if (this[config.timeoutKey]) {
				clearTimeout(this[config.timeoutKey]);
				timestamp = nowTime - this[config.timeKey];
				if (timestamp > config.maxDelay) {
					this[config.timeoutKey] = null;
					this[config.timeKey] = null;
					config.immediateCallback();
					return;
				}
			} else {
				this[config.timeKey] = nowTime;
			}
			this[config.timeoutKey] = setTimeout(() => {
				decadeUI.layout[config.timeoutKey] = null;
				decadeUI.layout[config.timeKey] = null;
				config.callback();
			}, timestamp);
		},
		delayClear() {
			this._debounce({
				defaultDelay: 500,
				maxDelay: 1000,
				timeoutKey: "_delayClearTimeout",
				timeKey: "_delayClearTimeoutTime",
				immediateCallback: function () {
					ui.clear();
				},
				callback: function () {
					ui.clear();
				},
			});
		},
		invalidate() {
			this.invalidateHand();
			this.invalidateDiscard();
		},
		invalidateHand(debugName) {
			this._debounce({
				defaultDelay: 40,
				maxDelay: 180,
				timeoutKey: "_handcardTimeout",
				timeKey: "_handcardTimeoutTime",
				immediateCallback: function () {
					decadeUI.layout.updateHand();
				},
				callback: function () {
					decadeUI.layout.updateHand();
				},
			});
		},
		invalidateDiscard() {
			this._debounce({
				defaultDelay: ui.thrown && ui.thrown.length > 15 ? 80 : 40,
				maxDelay: 180,
				timeoutKey: "_discardTimeout",
				timeKey: "_discardTimeoutTime",
				immediateCallback: function () {
					decadeUI.layout.updateDiscard();
				},
				callback: function () {
					decadeUI.layout.updateDiscard();
				},
			});
		},
		resize() {
			if (decadeUI.isMobile()) ui.arena.classList.add("dui-mobile");
			else ui.arena.classList.remove("dui-mobile");
			const set = decadeUI.dataset;
			set.animSizeUpdated = false;
			set.bodySize.updated = false;
			const caches = decadeUI.boundsCaches;
			for (const key in caches) caches[key].updated = false;
			let buttonsWindow = decadeUI.sheet.getStyle("#window > .dialog.popped .buttons:not(.smallzoom)");
			if (!buttonsWindow) {
				buttonsWindow = decadeUI.sheet.insertRule("#window > .dialog.popped .buttons:not(.smallzoom) { zoom: 1; }");
			}
			let buttonsArena = decadeUI.sheet.getStyle("#arena:not(.choose-character) .buttons:not(.smallzoom)");
			if (!buttonsArena) {
				buttonsArena = decadeUI.sheet.insertRule("#arena:not(.choose-character) .buttons:not(.smallzoom) { zoom: 1; }");
			}
			decadeUI.zooms.card = decadeUI.getCardBestScale();
			if (ui.me) {
				const height = Math.round(decadeUI.getHandCardSize().height * decadeUI.zooms.card + 30.4) + "px";
				ui.me.style.height = height;
			}
			if (buttonsArena) {
				buttonsArena.zoom = decadeUI.zooms.card;
			}
			if (buttonsWindow) {
				buttonsWindow.zoom = decadeUI.zooms.card;
			}
			decadeUI.layout.invalidate();
		},
	},
	handler: {
		handMousewheel(e) {
			if (!ui.handcards1Container) return console.error("ui.handcards1Container");
			const hand = ui.handcards1Container;
			if (hand.scrollNum == void 0) hand.scrollNum = 0;
			if (hand.lastFrameTime == void 0) hand.lastFrameTime = performance.now();
			function handScroll() {
				const now = performance.now();
				const delta = now - hand.lastFrameTime;
				let num = Math.round((delta / 16) * 16);
				hand.lastFrameTime = now;
				if (hand.scrollNum > 0) {
					num = Math.min(hand.scrollNum, num);
					hand.scrollNum -= num;
				} else {
					num = Math.min(-hand.scrollNum, num);
					hand.scrollNum += num;
					num = -num;
				}
				if (hand.scrollNum == 0) {
					hand.frameId = void 0;
					hand.lastFrameTime = void 0;
				} else {
					hand.frameId = requestAnimationFrame(handScroll);
					ui.handcards1Container.scrollLeft += num;
				}
			}
			if (e.wheelDelta > 0) {
				hand.scrollNum -= 84;
			} else {
				hand.scrollNum += 84;
			}
			if (hand.frameId == void 0) {
				hand.frameId = requestAnimationFrame(handScroll);
			}
		},
	},
	zooms: {
		body: 1,
		card: 1,
	},
	create: {
		skillDialog() {
			const dialog = document.createElement("div");
			dialog.className = "skill-dialog";
			const extend = {
				caption: undefined,
				tip: undefined,
				open(customParent) {
					if (!customParent) {
						const size = decadeUI.get.bodySize();
						this.style.minHeight = parseInt(size.height * 0.42) + "px";
						if (this.parentNode != ui.arena) ui.arena.appendChild(this);
					}
					this.style.animation = "open-dialog 0.4s";
					return this;
				},
				show() {
					this.style.animation = "open-dialog 0.4s";
				},
				hide() {
					this.style.animation = "close-dialog 0.1s forwards";
				},
				close() {
					const func = function (e) {
						if (e.animationName != "close-dialog") return;
						this.remove();
						this.removeEventListener("animationend", func);
					};
					const animation = "close-dialog";
					if (this.style.animationName == animation) {
						setTimeout(
							function (dialog) {
								dialog.remove();
							},
							100,
							this
						);
					} else {
						this.style.animation = animation + " 0.1s forwards";
						this.addEventListener("animationend", func);
					}
				},
				appendControl(text, clickFunc) {
					const control = document.createElement("div");
					control.className = "control-button";
					control.textContent = text;
					if (clickFunc) {
						control.addEventListener("click", clickFunc);
					}
					return this.$controls.appendChild(control);
				},
				$caption: decadeUI.element.create("caption", dialog),
				$content: decadeUI.element.create("content", dialog),
				$tip: decadeUI.element.create("tip", dialog),
				$controls: decadeUI.element.create("controls", dialog),
			};
			decadeUI.get.extend(dialog, extend);
			Object.defineProperties(dialog, {
				caption: {
					configurable: true,
					get() {
						return this.$caption.innerHTML;
					},
					set(value) {
						if (this.$caption.innerHTML == value) return;
						this.$caption.innerHTML = value;
					},
				},
				tip: {
					configurable: true,
					get() {
						return this.$tip.innerHTML;
					},
					set(value) {
						if (this.$tip.innerHTML == value) return;
						this.$tip.innerHTML = value;
					},
				},
			});
			return dialog;
		},
		compareDialog(player, target) {
			const dialog = decadeUI.create.skillDialog();
			dialog.classList.add("compare");
			dialog.$content.classList.add("buttons");
			const extend = {
				player: undefined,
				target: undefined,
				playerCard: undefined,
				targetCard: undefined,
				$player: decadeUI.element.create("player-character player1", dialog.$content),
				$target: decadeUI.element.create("player-character player2", dialog.$content),
				$playerCard: decadeUI.element.create("player-card", dialog.$content),
				$targetCard: decadeUI.element.create("target-card", dialog.$content),
				$vs: decadeUI.element.create("vs", dialog.$content),
			};
			decadeUI.get.extend(dialog, extend);
			(decadeUI.element.create("image", dialog.$player),
				decadeUI.element.create("image", dialog.$target),
				Object.defineProperties(dialog, {
					player: {
						configurable: true,
						get() {
							return this._player;
						},
						set(value) {
							if (this._player == value) return;
							this._player = value;
							if (value == null || value.isUnseen()) {
								this.$player.firstChild.style.backgroundImage = "";
							} else {
								this.$player.firstChild.style.backgroundImage = (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
							}
							if (value) this.$playerCard.dataset.text = get.translation(value) + "发起";
						},
					},
					target: {
						configurable: true,
						get() {
							return this._target;
						},
						set(value) {
							if (this._target == value) return;
							this._target = value;
							if (value == null || value.isUnseen()) {
								this.$target.firstChild.style.backgroundImage = "";
							} else {
								this.$target.firstChild.style.backgroundImage = (value.isUnseen(0) ? value.node.avatar2 : value.node.avatar).style.backgroundImage;
							}
							if (value) this.$targetCard.dataset.text = get.translation(value);
						},
					},
					playerCard: {
						configurable: true,
						get() {
							return this._playerCard;
						},
						set(value) {
							if (this._playerCard == value) return;
							if (this._playerCard) this._playerCard.remove();
							this._playerCard = value;
							if (value) this.$playerCard.appendChild(value);
						},
					},
					targetCard: {
						configurable: true,
						get() {
							return this._targetCard;
						},
						set(value) {
							if (this._targetCard == value) return;
							if (this._targetCard) this._targetCard.remove();
							this._targetCard = value;
							if (value) this.$targetCard.appendChild(value);
						},
					},
				}));
			if (player) dialog.player = player;
			if (target) dialog.target = target;
			return dialog;
		},
	},
	get: {
		judgeEffect(name, value) {
			const negativeGood = new Set(["caomu", "草木皆兵", "fulei", "浮雷", "shandian", "闪电", "bingliang", "兵粮寸断", "lebu", "乐不思蜀"]);
			if (negativeGood.has(name)) return value < 0 ? true : false;
			return value;
		},
		isWebKit() {
			return document.body.style.WebkitBoxShadow !== undefined;
		},
		lerp(min, max, fraction) {
			return (max - min) * fraction + min;
		},
		ease(fraction) {
			if (!decadeUI.get._bezier3) decadeUI.get._bezier3 = new duilib.CubicBezierEase(0.25, 0.1, 0.25, 1);
			return decadeUI.get._bezier3.ease(fraction);
		},
		extend(target, source) {
			if (source === null || typeof source !== "object") return target;
			const keys = Object.keys(source);
			let i = keys.length;
			while (i--) {
				target[keys[i]] = source[keys[i]];
			}
			return target;
		},
		bodySize() {
			const size = decadeUI.dataset.bodySize;
			if (!size.updated) {
				const body = document.body;
				size.updated = true;
				size.height = body.clientHeight;
				size.width = body.clientWidth;
			}
			return size;
		},
		bestValueCards(cards, player) {
			if (!player) player = _status.event.player;
			const matchs = [];
			const basics = [];
			const equips = [];
			const hasEquipSkill = player.hasSkill("xiaoji");
			cards.sort((a, b) => {
				return get.value(b, player) - get.value(a, player);
			});
			for (let i = 0; i >= 0 && i < cards.length; i++) {
				let limited = false;
				const type = get.type(cards[i]);
				const handler = {
					basic: () => {
						for (let j = 0; j < basics.length; j++) {
							if (!cards[i].toself && basics[j].name == cards[i].name) {
								limited = true;
								break;
							}
						}
						if (!limited) basics.push(cards[i]);
					},
					equip: () => {
						if (hasEquipSkill) return;
						for (let j = 0; j < equips.length; j++) {
							if (get.subtype(equips[j]) == get.subtype(cards[i])) {
								limited = true;
								break;
							}
						}
						if (!limited) equips.push(cards[i]);
					},
				}[type];
				if (handler) handler();
				if (!limited) {
					matchs.push(cards[i]);
					cards.splice(i--, 1);
				}
			}
			cards.sort((a, b) => {
				return get.value(b, player) - get.value(a, player);
			});
			cards = matchs.concat(cards);
			return cards;
		},
		cheatJudgeCards(cards, judges, friendly) {
			if (!cards || !judges) throw arguments;
			const cheats = [];
			let judgeCost;
			for (let i = 0; i < judges.length; i++) {
				const judge = get.judge(judges[i]);
				cards.sort((a, b) => {
					return friendly ? judge(b) - judge(a) : judge(a) - judge(b);
				});
				judgeCost = judge(cards[0]);
				if ((friendly && judgeCost >= 0) || (!friendly && judgeCost < 0)) {
					cheats.push(cards.shift());
				} else {
					break;
				}
			}
			return cheats;
		},
		elementLeftFromWindow(element) {
			let left = element.offsetLeft;
			let current = element.offsetParent;
			while (current != null) {
				left += current.offsetLeft;
				current = current.offsetParent;
			}
			return left;
		},
		elementTopFromWindow(element) {
			let top = element.offsetTop;
			let current = element.offsetParent;
			while (current != null) {
				top += current.offsetTop;
				current = current.offsetParent;
			}
			return top;
		},
		handcardInitPos() {
			const hand = dui.boundsCaches.hand;
			if (!hand.updated) hand.update();
			const cardW = hand.cardWidth;
			const cardH = hand.cardHeight;
			const scale = hand.cardScale;
			const x = -Math.round((cardW - cardW * scale) / 2);
			const y = (cardH * scale - cardH) / 2;
			return {
				x: x,
				y: y,
				scale: scale,
			};
		},
	},
	set: (function (set) {
		set.activeElement = function (element) {
			const deactive = dui.$activeElement;
			dui.$activeElement = element;
			if (deactive && deactive != element && typeof deactive.ondeactive == "function") {
				deactive.ondeactive();
			}
			if (element && element != deactive && typeof element.onactive == "function") {
				element.onactive();
			}
		};
		return set;
	})({}),
	statics: {
		cards: (function (cards) {
			const ensureSkinCache = skinKey => {
				if (!cards[skinKey]) cards[skinKey] = {};
				return cards[skinKey];
			};
			cards.READ_OK = {};
			const readFiles = function (files, skinKey, folder, extension, entry) {
				if (!folder) return;
				const skinCache = ensureSkinCache(skinKey);
				const prefix = decadeUIPath + "image/card/" + folder + "/";
				const ext = extension ? "." + extension.toLowerCase() : null;
				cards.READ_OK[skinKey] = true;
				for (let i = 0; i < files.length; i++) {
					const current = files[i];
					let filename = entry ? current.name : current;
					if (!filename) continue;
					if (entry && current.isDirectory) continue;
					const lower = filename.toLowerCase();
					let cardname = filename;
					if (ext) {
						if (!lower.endsWith(ext)) continue;
						cardname = filename.substring(0, filename.length - ext.length);
					} else {
						const dotIndex = filename.lastIndexOf(".");
						if (dotIndex === -1) continue;
						cardname = filename.substring(0, dotIndex);
					}
					skinCache[cardname] = {
						url: prefix + filename,
						name: cardname,
						loaded: true,
					};
				}
			};
			if (window.fs) {
				cardSkinPresets.forEach(skin => {
					const folder = skin.dir || skin.key;
					fs.readdir(__dirname + "/" + decadeUIPath + "image/card/" + folder + "/", function (err, files) {
						if (err) return;
						readFiles(files, skin.key, folder, skin.extension);
					});
				});
			} else if (window.resolveLocalFileSystemURL) {
				cardSkinPresets.forEach(skin => {
					const folder = skin.dir || skin.key;
					resolveLocalFileSystemURL(decadeUIResolvePath + "image/card/" + folder + "/", function (entry) {
						const reader = entry.createReader();
						reader.readEntries(function (entries) {
							readFiles(entries, skin.key, folder, skin.extension, true);
						});
					});
				});
			}
			return cards;
		})({}),
		handTips: [],
	},
	dataset: {
		animSizeUpdated: false,
		bodySizeUpdated: false,
		bodySize: {
			height: 1,
			width: 1,
			updated: false,
		},
	},
});

export { createDecadeUIObject };
