import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import { ChildNodesWatcher } from "../../../noname/library/cache/childNodesWatcher.js";
export async function content(config, pack) {
	if (get.mode() === "chess" || get.mode() === "tafang" || get.mode === "hs_hearthstone") return;
	//菜单栏错位bugfix
	// 检测是否开启皮肤切换扩展，开了就使用game.menuZoom = 1
	if (game.hasExtension && game.hasExtension("皮肤切换")) {
		game.menuZoom = 1;
	} else {
		// 让menuZoom使用系统的documentZoom值，确保菜单定位正确
		if (typeof game.menuZoom === "undefined" || game.menuZoom === null) {
			// 如果menuZoom未设置，让系统使用默认的documentZoom
			delete game.menuZoom;
		}
	}
	//单独装备栏
	_status.nopopequip = lib.config.extension_十周年UI_aloneEquip;
	// 布局检查与自动切换
	const recommendedLayouts = ["nova"];
	const currentLayout = lib.config.layout;
	if (!recommendedLayouts.includes(currentLayout)) {
		const shouldSwitch = confirm(
			"十周年UI提醒您，请使用<新版>布局以获得良好体验。\n" +
			"点击确定自动切换到<新版>布局，点击取消保持当前布局。"
		);
		if (shouldSwitch) {
			lib.config.layout = "nova";
			game.saveConfig("layout", "nova");
			alert("布局已切换为<新版>布局，游戏将自动重启以应用新布局。");
			setTimeout(() => location.reload(), 1000);
		}
	}
	console.time(decadeUIName);
	window.duicfg = config;
	window.dui = window.decadeUI = {
		init() {
			this.extensionName = decadeUIName;
			const sensor = decadeUI.element.create("sensor", document.body);
			sensor.id = "decadeUI-body-sensor";
			this.bodySensor = new decadeUI.ResizeSensor(sensor);
			const SVG_NS = "http://www.w3.org/2000/svg";
			const svg = document.body.appendChild(document.createElementNS(SVG_NS, "svg"));
			const defs = svg.appendChild(document.createElementNS(SVG_NS, "defs"));
			const clipPaths = [
				{ id: "solo-clip", d: "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z" },
				{ id: "duol-clip", d: "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z" },
				{ id: "duor-clip", d: "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z" },
				{ id: "dskin-clip", d: "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z" },
			];
			clipPaths.forEach(({ id, d }) => {
				const cp = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
				cp.id = id;
				cp.setAttribute("clipPathUnits", "objectBoundingBox");
				const path = cp.appendChild(document.createElementNS(SVG_NS, "path"));
				path.setAttribute("d", d);
			});
			document.addEventListener(
				"click",
				function (e) {
					dui.set.activeElement(e.target);
				},
				true
			);
			this.initOverride();
			// 初始化手牌提示高度
			const handTipHeight = lib.config["extension_十周年UI_handTipHeight"] || "20";
			document.documentElement.style.setProperty('--hand-tip-bottom', `calc(${handTipHeight}% + 10px)`);
			if (window.get && typeof window.get.cardsetion === "function") {
				const oldCardsetion = window.get.cardsetion;
				window.get.cardsetion = function (...args) {
					try {
						return oldCardsetion.apply(this, args);
					} catch (e) {
						if (e && e.message && e.message.indexOf("indexOf") !== -1) {
							return "";
						}
						throw e;
					}
				};
			}
			if (window.get && typeof window.get.getPlayerIdentity === "function") {
				const oldGetPlayerIdentity = window.get.getPlayerIdentity;
				window.get.getPlayerIdentity = function (player, identity, chinese, isMark) {
					if (!identity) identity = player.identity;
					if (typeof identity !== "string") identity = "";
					if (player && typeof player.special_identity !== "undefined" && typeof player.special_identity !== "string") {
						player.special_identity = "";
					}
					return oldGetPlayerIdentity.apply(this, arguments);
				};
			}
			return this;
		},
		initOverride() {
			function override(dest, src) {
				var ok = true;
				for (const key in src) {
					if (dest[key]) {
						ok = override(dest[key], src[key]);
						if (ok) {
							dest[key] = src[key];
						}
					} else {
						dest[key] = src[key];
					}
					ok = false;
				}
				return ok;
			}
			const base = {
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
						window: ui.click.window,
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
							//$syncExpand: lib.element.player.$syncExpand,
							markSkill: lib.element.player.markSkill,
							unmarkSkill: lib.element.player.unmarkSkill,
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
							chooseToGuanxing: lib.element.content.chooseToGuanxing,
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
			};
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
								if (this._messages == undefined) this._messages = {};
								message = message.toLowerCase();
								if (this._messages[message] == undefined) this._messages[message] = [];
								message = this._messages[message];
								message.push(callback);
							},
							triggerMessage(message) {
								if (this._messages == undefined) return;
								message = message.toLowerCase();
								if (this._messages[message] == undefined) return;
								message = this._messages[message];
								for (var i = 0; i < message.length; i++) {
									if (typeof message[i] == "function") message[i].call(this);
								}
								this._messages[message] = [];
							},
						},
						card: {
							copy() {
								var clone = base.lib.element.card.copy.apply(this, arguments);
								clone.nature = this.nature;
								var res = dui.statics.cards;
								var asset = res[clone.name];
								if (!res.READ_OK) return clone;
								if (asset && !asset.loaded && clone.classList.contains("decade-card")) {
									if (asset.loaded == undefined) {
										var image = asset.image;
										image.addEventListener("error", function () {
											clone.style.background = asset.rawUrl;
											clone.classList.remove("decade-card");
										});
									} else {
										clone.style.background = asset.rawUrl;
										clone.classList.remove("decade-card");
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
								const imgFormat = decadeUI.config.cardPrettify;
								if (imgFormat !== "off") {
									let filename = card[2];
									this.classList.add("decade-card");
									if (!this.classList.contains("infohidden")) {
										if (Array.isArray(card) && card[2] === "sha" && card[3] && !Array.isArray(card[3])) {
											filename += "_" + get.natureList(card[3]).sort(lib.sort.nature).join("_");
										}
										const res = dui.statics.cards;
										let asset = res[filename];
										if (res.READ_OK) {
											if (asset === undefined) {
												this.classList.remove("decade-card");
											} else {
												this.style.background = `url("${asset.url}")`;
											}
										} else {
											const url = lib.assetURL + `extension/${decadeUIName}/image/card/${filename}.${imgFormat}`;
											if (!asset) {
												res[filename] = asset = {
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
														asset.loaded = false;
														image.onerror = undefined;
														cardElem.style.background = asset.rawUrl;
														cardElem.classList.remove("decade-card");
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
									var that = this;
									setTimeout(function () {
										that.updateTransform(that.classList.contains("selected"));
									}, delay);
								} else {
									if (_status.event.player != game.me) return;
									if (this._transform && this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.parentNode == ui.me && (!_status.mousedown || _status.mouseleft)) {
										if (bool) {
											this.style.transform = this._transform + " translateY(-" + (decadeUI.isMobile() ? 10 : 12) + "px)";
										} else {
											this.style.transform = this._transform || "";
										}
									}
								}
							},
							moveTo(player) {
								if (!player) return;
								var arena = dui.boundsCaches.arena;
								if (!arena.updated) arena.update();
								player.checkBoundsCache();
								this.fixed = true;
								var x = Math.round((player.cacheWidth - arena.cardWidth) / 2 + player.cacheLeft);
								var y = Math.round((player.cacheHeight - arena.cardHeight) / 2 + player.cacheTop);
								var scale = arena.cardScale;
								this.tx = x;
								this.ty = y;
								this.scaled = true;
								this.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
								return this;
							},
							moveDelete(player) {
								this.fixed = true;
								this.moveTo(player);
								setTimeout(
									function (card) {
										card.delete();
									},
									460,
									this
								);
							},
						},
						control: {
							add(item) {
								var node = document.createElement("div");
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
								var items;
								var index = 0;
								var nodes = this.childNodes;
								if (Array.isArray(arguments[0])) {
									items = arguments[0];
								} else {
									items = arguments;
								}
								this.custom = undefined;
								for (var i = 0; i < items.length; i++) {
									if (typeof items[i] == "function") {
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
								var nodes = this.childNodes;
								if (nodes.length >= 2) {
									this.classList.add("combo-control");
									for (var i = 0; i < nodes.length; i++) nodes[i].classList.add("control");
								} else {
									this.classList.remove("combo-control");
									if (nodes.length == 1) nodes[0].classList.remove("control");
								}
							},
						},
						player: {
							addSkill(skill) {
								var skill = base.lib.element.player.addSkill.apply(this, arguments);
								if (!Array.isArray(skill)) {
									const skills = ["name", "name1", "name2"].reduce((list, name) => {
										if (this[name] && (name != "name1" || this.name != this.name1)) {
											list.addArray(get.character(this[name], 3) || []);
										}
										return list;
									}, []);
									if (!skills.includes(skill)) {
										var info = get.info(skill);
										if (!(!info || info.nopop || !get.translation(skill + "_info") || !lib.translate[skill + "_info"])) this.node.gainSkill.gain(skill);
									}
								}
								[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
								return skill;
							},
							removeSkill(skill) {
								var skill = base.lib.element.player.removeSkill.apply(this, arguments);
								if (!Array.isArray(skill)) {
									if (this.node.gainSkill.skills && this.node.gainSkill.skills.includes(skill)) {
										this.node.gainSkill.lose(skill);
									}
								}
								[...game.players, ...game.dead].forEach(i => i.decadeUI_updateShowCards());
								return skill;
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
								if (get.itemtype(item) == "cards") {
									var marks = new Array(item.length);
									for (var i = 0; i < item.length; i++) marks.push(this.mark(item[i], info));
									return marks;
								}
								var mark;
								if (get.itemtype(item) == "card") {
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
									var markText = lib.translate[item + "_bg"];
									if (!markText || markText[0] == "+" || markText[0] == "-") {
										markText = get.translation(item).substr(0, 2);
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
								var parentSkill = get && get.sourceSkillFor ? get.sourceSkillFor(mark.skill) : null;
								if (!mark.classList.contains("own-skill") && !mark.classList.contains("other-skill")) {
									var isOwnSkill = decadeUI.game.checkSkillOwnership.call(this, mark.skill, parentSkill);
									mark.classList.add(isOwnSkill ? "own-skill" : "other-skill");
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
								return base.lib.element.player.markSkill.apply(this, arguments);
							},
							unmarkSkill(name, info, card, nobroadcast) {
								if (name && lib.config.extension_十周年UI_newDecadeStyle != "Off") {
									const info = get.info(name);
									if (info && (info.zhuanhuanji || info.zhuanhuanji2 || info.limited)) return;
								}
								return base.lib.element.player.unmarkSkill.apply(this, arguments);
							},
							markCharacter(name, info, learn, learn2) {
								if (typeof name == "object") name = name.name;
								var nodeMark = ui.create.div(".card.mark");
								var nodeMarkText = ui.create.div(".mark-text", nodeMark);
								if (!info) info = {};
								if (!info.name) info.name = get.translation(name);
								if (!info.content) info.content = get.skillintro(name, learn, learn2);
								if (name.indexOf("unknown") == 0) {
									var unknownText = get.translation(name)[0];
									if (unknownText && unknownText.includes("☯")) {
										nodeMark.style.setProperty("display", "none", "important");
									}
									nodeMarkText.innerHTML = unknownText;
								} else {
									if (!get.character(name)) return console.error(name);
									var text = info.name.substr(0, 2);
									if (text.length == 2) nodeMarkText.classList.add("small-text");
									if (text && text.includes("☯")) {
										nodeMark.style.setProperty("display", "none", "important");
									}
									nodeMarkText.innerHTML = text;
								}
								nodeMark.name = name + "_charactermark";
								nodeMark.info = info;
								nodeMark.text = nodeMarkText;
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
											game.addVideo("changeMarkCharacter", player, {
												id: id,
												name: name,
												content: content,
												target: target,
											});
										} else {
											var nodeMark = ui.create.div(".card.mark");
											var nodeMarkText = ui.create.div(".mark-text", nodeMark);
											var skillName = get.translation(name);
											var text = skillName.substr(0, 2);
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
											nodeMark.classList.add("other-skill");
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
								if (animation == undefined) return console.error("playDynamic: 参数1不能为空");
								var dynamic = this.dynamic;
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
										animation.x = animation.x.concat();
										animation.x[1] += deputy ? 0.25 : -0.25;
									} else {
										if (animation.x == undefined) {
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
								var avatar = dynamic.play(animation);
								if (deputy === true) {
									dynamic.deputy = avatar;
								} else {
									dynamic.primary = avatar;
								}
								this.classList.add(deputy ? "d-skin2" : "d-skin");
							},
							stopDynamic(primary, deputy) {
								var dynamic = this.dynamic;
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
							say(str) {
								str = str.replace(/##assetURL##/g, lib.assetURL);
								if (!this.$chatBubble) {
									this.$chatBubble = decadeUI.element.create("chat-bubble");
								}
								var bubble = this.$chatBubble;
								bubble.innerHTML = str;
								if (this != bubble.parentNode) this.appendChild(bubble);
								bubble.classList.remove("removing");
								bubble.style.animation = "fade-in 0.3s";
								if (bubble.timeout) clearTimeout(bubble.timeout);
								bubble.timeout = setTimeout(
									function (bubble) {
										bubble.timeout = undefined;
										bubble.delete();
									},
									2000,
									bubble
								);
								var name = get.translation(this.name);
								var info = [name ? name + "[" + this.nickname + "]" : this.nickname, str];
								lib.chatHistory.push(info);
								if (_status.addChatEntry) {
									if (_status.addChatEntry._origin.parentNode) {
										_status.addChatEntry(info, false);
									} else {
										_status.addChatEntry = undefined;
									}
								}
								if (lib.config.background_speak && lib.quickVoice.indexOf(str) != -1) {
									game.playAudio("voice", this.sex == "female" ? "female" : "male", lib.quickVoice.indexOf(str));
								}
							},
							/*-----------------分割线-----------------*/
							updateMark(name, storage) {
								if (!this.marks[name]) {
									if (lib.skill[name] && lib.skill[name].intro && (this.storage[name] || lib.skill[name].intro.markcount)) {
										this.markSkill(name);
										if (!this.marks[name]) return this;
									} else {
										return this;
									}
								}
								var mark = this.marks[name];
								if (storage && this.storage[name]) this.syncStorage(name);
								if (lib.skill[name] && lib.skill[name].intro && !lib.skill[name].intro.nocount && (this.storage[name] || lib.skill[name].intro.markcount)) {
									var num = 0;
									if (typeof lib.skill[name].intro.markcount == "function") {
										num = lib.skill[name].intro.markcount(this.storage[name], this, name);
										/*-----------------分割线-----------------*/
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
									if (num && num !== 1) {
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
								if (!config.dynamicSkin_dieAfter) this.stopDynamic();
								this.node.gainSkill.innerHTML = null;
								if (!this.node.dieidentity) this.node.dieidentity = ui.create.div("died-identity", this);
								this.node.dieidentity.classList.add("died-identity");
								var that = this,
									image = new Image(),
									identity = decadeUI.getPlayerIdentity(this);
								const goon = decadeUI.config.newDecadeStyle === "on" || decadeUI.config.newDecadeStyle === "othersOff";
								// 为onlineUI样式设置单独的路径判断
								var url;
								if (decadeUI.config.newDecadeStyle === "onlineUI") {
									url = decadeUIPath + "image/decorationo/dead4_" + identity + ".png";
									that.node.dieidentity.style.left = "25px";
								} else if (decadeUI.config.newDecadeStyle === "babysha") {
									url = decadeUIPath + "image/decorationh/dead3_" + identity + ".png";
								} else {
									url = decadeUIPath + "image/decoration" + (goon ? "/dead" : "s/dead2") + "_" + identity + ".png";
								}
								image.onerror = function () {
									that.node.dieidentity.innerHTML = decadeUI.getPlayerIdentity(that, that.identity, true) + "<br>阵亡";
								};
								// 离开效果仅在移动版样式下启用
								if ((that._trueMe || that) != game.me && that != game.me && lib.config.extension_十周年UI_newDecadeStyle === "off") {
									that.node.dieidentity.innerHTML = '<div style="width:21px; height:81px; left:18px; top:-12px; position:absolute; background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/likai.png);background-size: 100% 100%;"></div>';
								} else {
									that.node.dieidentity.innerHTML = "";
								}
								that.node.dieidentity.style.backgroundImage = 'url("' + url + '")';
								image.src = url;
								setTimeout(function () {
									var rect = that.getBoundingClientRect();
									decadeUI.animation.playSpine("effect_zhenwang", {
										parent: that,
										scale: 0.8,
									});
								}, 250);
							},
							$skill(name, type, color, avatar) {
								var _this = this;
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
								//if (base.lib.element.player.$syncExpand) base.lib.element.player.$syncExpand.apply(this, arguments);
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
								//ui.equipSolts.back.innerHTML = new Array(5 + Object.values(this.expandedSlots).reduce((previousValue, currentValue) => previousValue + currentValue, 0)).fill('<div></div>').join('');
								let ele;
								while ((ele = ui.equipSolts.back.firstChild)) {
									ele.remove();
								}
								var storage = this.expandedSlots,
									equipSolts = ui.equipSolts;
								for (var repetition = 0; repetition < 5; repetition++) {
									if (storage && storage["equip" + (repetition + 1)]) {
										for (var adde = 0; adde < storage["equip" + (repetition + 1)]; adde++) {
											var addediv = decadeUI.element.create(null, equipSolts.back);
											addediv.dataset.type = repetition;
										}
									}
									var ediv = decadeUI.element.create(null, equipSolts.back);
									ediv.dataset.type = repetition;
								}
							},
							$init(character, character2) {
								base.lib.element.player.$init.apply(this, arguments);
								this.doubleAvatar = (character2 && lib.character[character2]) != undefined;
								// 在othersOff一将成名样式下，检查武将原画是否存在，如果不存在则添加•体验后缀
								if (lib.config.extension_十周年UI_newDecadeStyle === "othersOff") {
									this.checkAndAddExperienceSuffix(character);
									if (character2) {
										this.checkAndAddExperienceSuffix(character2);
									}
								}
								var CUR_DYNAMIC = decadeUI.CUR_DYNAMIC;
								var MAX_DYNAMIC = decadeUI.MAX_DYNAMIC;
								if (CUR_DYNAMIC == undefined) {
									CUR_DYNAMIC = 0;
									decadeUI.CUR_DYNAMIC = CUR_DYNAMIC;
								}
								if (MAX_DYNAMIC == undefined) {
									MAX_DYNAMIC = decadeUI.isMobile() ? 2 : 10;
									if (window.OffscreenCanvas) MAX_DYNAMIC += 8;
									decadeUI.MAX_DYNAMIC = MAX_DYNAMIC;
								}
								if (this.dynamic) this.stopDynamic();
								var showDynamic = (this.dynamic || CUR_DYNAMIC < MAX_DYNAMIC) && duicfg.dynamicSkin;
								if (showDynamic && _status.mode != null) {
									var skins;
									var dskins = decadeUI.dynamicSkin;
									var avatars = this.doubleAvatar ? [character, character2] : [character];
									var increased;
									for (var i = 0; i < avatars.length; i++) {
										skins = dskins[avatars[i]];
										if (skins == undefined) continue;
										var keys = Object.keys(skins);
										if (keys.length == 0) {
											console.error("player.init: " + avatars[i] + " 没有设置动皮参数");
											continue;
										}
										var skin = skins[Object.keys(skins)[0]];
										if (skin.speed == undefined) skin.speed = 1;
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
											i == 1
										);
										this.$dynamicWrap.style.backgroundImage = 'url("' + decadeUIPath + "assets/dynamic/" + skin.background + '")';
										if (!increased) {
											increased = true;
											decadeUI.CUR_DYNAMIC++;
										}
									}
								}
								//手牌可见
								if (!this.node.showCards) {
									const player = this;
									function createElement(tag, opts = {}) {
										const d = document.createElement(tag);
										for (const key in opts) {
											if (!Object.hasOwnProperty.call(opts, key)) continue;
											switch (key) {
												case "class":
													opts[key].forEach(v => d.classList.add(v));
													break;
												case "id":
													d.id = opts[key];
													break;
												case "innerHTML":
												case "innerText":
													d[key] = opts[key];
													break;
												case "parentNode":
													opts[key].appendChild(d);
													break;
												case "listen":
													for (const evt in opts[key]) {
														if (typeof opts[key][evt] == "function") d[evt] = opts[key][evt];
													}
													break;
												case "style":
													for (const s in opts[key]) d.style[s] = opts[key][s];
													break;
												case "children":
													opts[key].forEach(v => d.appendChild(v));
													break;
												case "insertBefore":
													opts[key][0].insertBefore(d, opts[key][1]);
													break;
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
										// 默认宽度，可根据实际调整
										const offset = 10;
										const showWidth = 120; // 预估显示区宽度
										// babysha样式下，武将牌靠左就左边显示，靠右就右边显示
										if (lib.config.extension_十周年UI_newDecadeStyle === "babysha") {
											if (rect.left < winWidth / 2) {
												// 靠左，显示在左侧
												showCards.style.left = "";
												showCards.style.right = player.offsetWidth + offset + "px";
											} else {
												// 靠右，显示在右侧
												showCards.style.left = player.offsetWidth + offset + "px";
												showCards.style.right = "";
											}
										} else {
											// 其他样式保持原有逻辑
											if (rect.left < winWidth / 2) {
												// 靠左，显示在右侧
												showCards.style.left = player.offsetWidth + offset + "px";
												showCards.style.right = "";
											} else {
												// 靠右，显示在左侧
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
										// babysha样式下，如果显示在左侧且超出边界，则调整到右侧
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
											player.node.showCards.onmouseleave = function () { };
										} else {
											ui.window.addEventListener("touchend", function touch() { }, { once: true });
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
								var campName = this.node.campWrap.node.campName;
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
											switch (prefix) {
												case "img":
													imgPrefixUrl = payload;
													break;
												case "ext":
													extimage = value;
													break;
												case "db":
													dbimage = value;
													break;
												case "mode":
													modeimage = payload;
													break;
												case "character":
													realName = payload;
													break;
												default:
													break;
											}
											if (imgPrefixUrl || extimage || dbimage || modeimage || realName !== name) break;
										}
									}
								}
								if (imgPrefixUrl) {
									src = imgPrefixUrl;
								} else if (extimage) {
									src = extimage.replace(/^ext:/, "extension/");
								} else if (dbimage) {
									game.getDB("image", dbimage.slice(3)).then(() => {
										return;
									}).catch(() => {
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
								//护甲显示修改
								let hujiat = this.node.hpWrap.querySelector(".hujia");
								if (this.hujia > 0) {
									if (!hujiat) {
										hujiat = ui.create.div(".hujia");
										this.node.hpWrap.appendChild(hujiat);
									}
									hujiat.innerText = this.hujia == Infinity ? "∞" : this.hujia;
								} else if (hujiat) hujiat.remove();
								//体力条显示修改
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
								//手牌数显示修改
								let count = this.countCards("h");
								if (count >= 10) this.node.count.innerHTML = count;
								//可见手牌显示刷新
								this.decadeUI_updateShowCards();
								return this;
							},
							directgain(cards, broadcast, gaintag) {
								if (!cards || !cards.length) return;
								var player = this;
								var handcards = player.node.handcards1;
								var fragment = document.createDocumentFragment();
								if (_status.event.name == "gameDraw") {
									player.$draw(cards.length);
								}
								var card;
								for (var i = 0; i < cards.length; i++) {
									card = cards[i];
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
								var s = player.getCards("s");
								if (s.length) handcards.insertBefore(fragment, s[0]);
								else handcards.appendChild(fragment);
								if (!_status.video) {
									game.addVideo("directgain", this, get.cardsInfo(cards));
									this.update();
								}
								if (broadcast !== false) {
									game.broadcast(
										function (player, cards) {
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
										//const suit = get.translation(cardx.suit);
										//const number = get.strNumber(cardx.number);
										cardx.classList.add("drawinghidden");
										if (isViewAsCard) {
											cardx.cards = cards || [];
											cardx.viewAs = VCard.name;
											const bgMark = lib.translate[cardx.viewAs + "_bg"] || get.translation(cardx.viewAs)[0];
											//cardx.node.name2.innerHTML = `${suit}${number} [${get.translation(VCard.name)}]`;
											if (cardx.classList.contains("fullskin") || cardx.classList.contains("fullborder")) {
												if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = bgMark;
												else cardx.node.background.innerHTML = bgMark;
											}
											cardx.classList.add("fakejudge");
										} else {
											delete cardx.viewAs;
											//cardx.node.name2.innerHTML = `${suit}${number} ${VCard.name}`;
											cardx.classList.remove("fakejudge");
											if (window.decadeUI) cardx.node.judgeMark.node.judge.innerHTML = lib.translate[cardx.name + "_bg"] || get.translation(cardx.name)[0];
										}
										player.node.judges.insertBefore(cardx, player.node.judges.firstChild);
										// 判定标记美化
										let map = ["bingliang", "lebu", "shandian", "fulei", "hongshui", "huoshan", "caomu", "jlsgqs_shuiyanqijun", "jydiy_zouhuorumo", "jydiy_yungongliaoshang", "xwjh_biguanqingxiu", "xwjh_wushisanke", "xumou_jsrg", "dczixi_bingliang", "dczixi_lebu", "dczixi_shandian"];
										if (map.includes(cardx.name)) {
											let imageName = cardx.name;
											const judgeText = (lib.translate[cardx.name + "_bg"] || get.translation(cardx.name) || "");
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
								var event = base.lib.element.player.useCard.apply(this, arguments);
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
								var next = base.lib.element.player.lose.apply(this, arguments);
								var event = _status.event;
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
									for (var i = 0; i < target.length; i++) {
										this.line(target[i], config);
									}
								} else if (get.itemtype(target) == "player") {
									if (target == this) return;
									var player = this;
									game.broadcast(
										function (player, target, config) {
											player.line(target, config);
										},
										player,
										target,
										config
									);
									game.addVideo("line", player, [target.dataset.position, config]);
									player.checkBoundsCache(true);
									target.checkBoundsCache(true);
									var x1, y1;
									var x2, y2;
									var hand = dui.boundsCaches.hand;
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
								var update;
								var refer = dui.boundsCaches.arena;
								refer.check();
								if (this.cacheReferW != refer.width || this.cacheReferH != refer.height || this.cachePosition != this.dataset.position) update = true;
								this.cacheReferW = refer.width;
								this.cacheReferH = refer.height;
								this.cachePosition = this.dataset.position;
								if (this.cacheLeft == null) update = true;
								if (update || forceUpdate) {
									this.cacheLeft = this.offsetLeft;
									this.cacheTop = this.offsetTop;
									this.cacheWidth = this.offsetWidth;
									this.cacheHeight = this.offsetHeight;
								}
							},
							queueCssAnimation(animation) {
								var current = this.style.animation;
								var animations = this._cssanimations;
								if (animations == undefined) {
									animations = [];
									this._cssanimations = animations;
									this.addEventListener("animationend", function (e) {
										if (this.style.animationName != e.animationName) return;
										var current = this.style.animation;
										var animations = this._cssanimations;
										while (animations.length) {
											this.style.animation = animations.shift();
											if (this.style.animation != current) return;
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
								var cards;
								var isDrawCard;
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
								var fragment = document.createDocumentFragment();
								var card;
								for (var i = 0; i < cards.length; i++) {
									card = cards[i];
									if (card == null) card = dui.element.create("card thrown drawingcard");
									else card = card.copy("thrown", "drawingcard", false);
									card.fixed = true;
									cards[i] = card;
									fragment.appendChild(card);
								}
								var player = this;
								dui.layoutDrawCards(cards, player, true);
								ui.arena.appendChild(fragment);
								dui.queueNextFrameTick(function () {
									dui.layoutDrawCards(cards, player);
									dui.delayRemoveCards(cards, 460, 220);
								});
							},
							$give(cards, target, log, record) {
								var itemtype;
								var duiMod = cards.duiMod && game.me == target;
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
									var cards2 = cards;
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
								var card;
								var hand = dui.boundsCaches.hand;
								hand.check();
								var draws = [];
								var player = this;
								var fragment = document.createDocumentFragment();
								for (var i = 0; i < cards.length; i++) {
									card = cards[i];
									if (card) {
										var cp = card.copy("card", "thrown", "gainingcard", false);
										var hs = player == game.me;
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
								var type = get.itemtype(cards);
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
								var gains = [];
								var draws = [];
								var card;
								var clone;
								for (var i = 0; i < cards.length; i++) {
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
								var player = this;
								var fragment = document.createDocumentFragment();
								for (var i = 0; i < cards.length; i++) fragment.appendChild(cards[i]);
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
								var itemtype;
								var duiMod = cards.duiMod && game.me == this && !nosource;
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
										var evt = _status.event;
										if (evt && evt.card && evt.cards === cards) {
											var card = ui.create.card().init([evt.card.suit, evt.card.number, evt.card.name, evt.card.nature]);
											if (evt.card.suit == "none") card.node.suitnum.style.display = "none";
											card.dataset.virtual = 1;
											cards = [card];
										}
									}
								}
								var card;
								var clone;
								var player = this;
								var hand = dui.boundsCaches.hand;
								hand.check();
								for (var i = 0; i < cards.length; i++) {
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
								cards.sort(function (a, b) {
									if (a.tx == undefined && b.tx == undefined) return 0;
									if (a.tx == undefined) return duicfg.rightLayout ? -1 : 1;
									if (b.tx == undefined) return duicfg.rightLayout ? 1 : -1;
									return a.tx - b.tx;
								});
								for (var i = 0; i < cards.length; i++) {
									(function (card) {
										player.$throwordered2(card, nosource);
									})(cards[i]);
								}
								if (game.chess) this.chessFocus();
								return cards[cards.length - 1];
							},
							$throwordered2(card, nosource) {
								if (_status.connectMode) ui.todiscard = [];
								if (card.throwordered == undefined) {
									var x, y;
									var bounds = dui.boundsCaches.arena;
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
								var tagNode = card.querySelector(".used-info");
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
										switch (key) {
											case "class":
												opts[key].forEach(v => d.classList.add(v));
												break;
											case "id":
												d.id = opts[key];
												break;
											case "innerHTML":
											case "innerText":
												d[key] = opts[key];
												break;
											case "parentNode":
												opts[key].appendChild(d);
												break;
											case "listen":
												for (const evt in opts[key]) {
													if (typeof opts[key][evt] == "function") d[evt] = opts[key][evt];
												}
												break;
											case "style":
												for (const s in opts[key]) d.style[s] = opts[key][s];
												break;
											case "children":
												opts[key].forEach(v => d.appendChild(v));
												break;
											case "insertBefore":
												opts[key][0].insertBefore(d, opts[key][1]);
												break;
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
							/*-------转换技，阴阳标记等----*/
							//修改changezhuanhuanji函数
							$changeZhuanhuanji(skill) {
								base.lib.element.player.$changeZhuanhuanji.apply(this, arguments);
								if (!get.is.zhuanhuanji(skill, this)) return;
								if (this.hiddenSkills.includes(skill) && this !== game.me) return;
								var mark = this.node.xSkillMarks.querySelector('[data-id="' + skill + '"]');
								var url = lib.assetURL + "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/" + skill + "_yang.png";
								function imageExists(url) {
									var xhr = new XMLHttpRequest();
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
								var style = lib.config.extension_十周年UI_newDecadeStyle;
								var yangUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/" + skill + "_yang.png";
								var yingUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/" + skill + "_ying.png";
								var defaultYangUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_yang.png";
								var defaultYingUrl = "extension/十周年UI/shoushaUI/skill/shousha/zhuanhuanji/ditu_ying.png";
								if (style == "on" || style == "othersOff" || style == "onlineUI" || style == "babysha") {
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
							//修改技能按钮
							//定义两个空集合阳按钮和阴按钮（别问为啥阴不是yin而是ying，问就是拿yang复制比较简单）
							//定义阴函数，将技能加入阴集合，并删除阳集合里的该技能。
							yangSkill(skill) {
								var player = this;
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
							//阳函数同理
							yingSkill(skill) {
								var player = this;
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
							//添加failskill函数
							//这是失败函数，添加到使命技的失败分支里，作用是为使命技的class样式添加一个后缀fail，这样在使命技失败的时候创建的标记就会是白底和一个x（类似限定技使用后），而使命技成功的标记就会是红底。
							failSkill(skill) {
								var player = this;
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
								var mark = this.node.xSkillMarks.querySelector('[data-id="' + skill + '"]');
								if (mark) mark.classList.add("fail");
							},
							//添加失效函数
							//构建一个失效技能的空集合
							//失效函数是为了给技能按钮上锁的，在技能失效时，补上shixiao函数，技能就会被加入失效集合里，十周年UI那里就会检测到技能失效，从而添加上锁图片。
							shixiaoSkill(skill) {
								var player = this;
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
							//添加解除失效函数
							//看名字就知道是干啥的
							unshixiaoSkill(skill) {
								var player = this;
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
								var that = this;
								//------AI技能提示条------------//
								if (lib.config["extension_十周年UI_enable"] && lib.config.extension_十周年UI_jindutiao == true) {
									if (that != game.me) {
										var cd = that.getElementsByClassName("tipshow"); //阶段，出牌提示条
										var ef = that.getElementsByClassName("tipskill"); //技能提示条
										//-------初始化-----//
										if (cd[0]) cd[0].parentNode.removeChild(cd[0]);
										if (ef[0]) ef[0].parentNode.removeChild(ef[0]);
										var tipbanlist = ["_recasting", "jiu"]; //过滤部分触发技能，可以自己添加
										if (!tipbanlist.includes(name) && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
											var tipskillbox = document.createElement("div"); //盒子
											var tipshow = document.createElement("img"); //图片思考中
											var tipskilltext = document.createElement("div"); //技能文本
											//------盒子样式--------//
											tipskillbox.classList.add("tipskill"); //盒子设置技能类名
											tipskillbox.style.cssText = "display:block;position:absolute;pointer-events:none;z-index:90;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:0px;";
											//--------技能文本-----//
											tipskilltext.innerHTML = get.skillTranslation(name, that).slice(0, 2);
											tipskilltext.style.cssText = "color:#ADC63A;text-shadow:#707852 0 0;font-size:11px;font-family:shousha;display:block;position:absolute;z-index:91;bottom:-22px;letter-spacing:1.5px;line-height:15px;left:15px;";
											//-----思考中底图------//
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
									var node;
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
										if (lib.config.extension_十周年UI_newDecadeStyle !== "onlineUI" && lib.config.extension_十周年UI_newDecadeStyle !== "othersOff" && lib.config.extension_十周年UI_newDecadeStyle !== "on" && lib.config.extension_十周年UI_newDecadeStyle !== "off") {
											if (num == Infinity) {
												num = "+∞";
											} else if (num == -Infinity) {
												num = "-∞";
											} else if (num > 0) {
												num = "+" + num;
											}
										} else num = "";
									} else {
										node.popupNumber = null;
									}
									node.innerHTML = num;
									node.dataset.text = node.textContent || node.innerText;
									node.nature = nature || "soil";
									this.damagepopups.push(node);
								}
								if (this.damagepopups.length && !this.damagepopLocked) {
									var node = this.damagepopups.shift();
									this.damagepopLocked = true;
									if (this != node.parentNode) this.appendChild(node);
									var player = this;
									if (typeof node.popupNumber == "number") {
										var popupNum = node.popupNumber;
										if (popupNum < 0) {
											switch (node.nature) {
												case "thunder":
													if (popupNum <= -2) {
														decadeUI.animation.playSpine(
															{
																name: "effect_shoujidonghua",
																action: "play6",
															},
															{
																scale: 0.8,
																parent: player,
															}
														);
													} else {
														decadeUI.animation.playSpine(
															{
																name: "effect_shoujidonghua",
																action: "play5",
															},
															{
																scale: 0.8,
																parent: player,
															}
														);
													}
													break;
												case "fire":
													if (popupNum <= -2) {
														decadeUI.animation.playSpine(
															{
																name: "effect_shoujidonghua",
																action: "play4",
															},
															{
																scale: 0.8,
																parent: player,
															}
														);
													} else {
														decadeUI.animation.playSpine(
															{
																name: "effect_shoujidonghua",
																action: "play3",
															},
															{
																scale: 0.8,
																parent: player,
															}
														);
													}
													break;
												case "water":
													break;
												default:
													if (popupNum <= -2) {
														decadeUI.animation.playSpine(
															{
																name: "effect_shoujidonghua",
																action: "play2",
															},
															{
																scale: 0.8,
																parent: player,
															}
														);
													} else {
														decadeUI.animation.playSpine(
															{
																name: "effect_shoujidonghua",
																action: "play1",
															},
															{
																scale: 0.8,
																parent: player,
															}
														);
													}
													break;
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
								var player = this;
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
								var player = this;
								for (var i = targets.length - 1; i >= 0; i--) {
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
									//game.log(player, '的护甲抵挡了' + get.cnNumber(event.hujia) + '点伤害');
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
									var evt = event.getParent("_save");
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
									var handcards = player.node.handcards1;
									var fragment = document.createDocumentFragment();
									for (var i = 0; i < cards.length; i++) {
										var card = cards[i];
										var sort = lib.config.sort_card(card);
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
										for (var j = 0; j < card.vanishtag.length; j++) {
											if (card.vanishtag[j][0] != "_") card.vanishtag.splice(j--, 1);
										}
									}
									var gainTo = function (cards, nodelay) {
										cards.duiMod = event.source;
										if (player == game.me) {
											dui.layoutHandDraws(cards);
											dui.queueNextFrameTick(dui.layoutHand, dui);
											game.addVideo("gain12", player, [get.cardsInfo(fragment.childNodes), gaintag]);
										}
										var s = player.getCards("s");
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
										var evtmap = event.losing_map;
										if (event.animate == "give") {
											for (var i in evtmap) {
												var source = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
												source.$give(evtmap[i][0], player, event.log);
											}
										} else {
											for (var i in evtmap) {
												var source = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
												if (evtmap[i][1].length) source.$giveAuto(evtmap[i][1], player, event.log);
												if (evtmap[i][2].length) source.$give(evtmap[i][2], player, event.log);
											}
										}
									} else if (typeof event.animate == "function") {
										var time = event.animate(event);
										game.pause();
										setTimeout(function () {
											gainTo(cards, true);
											game.resume();
										}, get.delayx(time, time));
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
								var judgestr = get.translation(player) + "的" + event.judgestr + "判定";
								event.videoId = lib.status.videoId++;
								var cardj = event.directresult;
								if (!cardj) {
									if (player.getTopCards) cardj = player.getTopCards()[0];
									else cardj = get.cards()[0];
								}
								var owner = get.owner(cardj);
								if (owner) {
									owner.lose(cardj, "visible", ui.ordering);
								} else {
									var nextj = game.cardsGotoOrdering(cardj);
									if (event.position != ui.discardPile) nextj.noOrdering = true;
								}
								player.judging.unshift(cardj);
								game.addVideo("judge1", player, [get.cardInfo(player.judging[0]), judgestr, event.videoId]);
								game.broadcastAll(
									function (player, card /*, str*/, id, cardid) {
										var event = game.online ? {} : _status.event;
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
								"step 1";
								event.result = {
									card: player.judging[0],
									name: player.judging[0].name,
									number: get.number(player.judging[0]),
									suit: get.suit(player.judging[0]),
									color: get.color(player.judging[0]),
									node: event.node,
								};
								if (event.fixedResult) {
									for (var i in event.fixedResult) {
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
									var judge2 = event.judge2(event.result);
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
									var next = game.createEvent("judgeCallback", false);
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
									var evt = event.getParent();
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
										//这玩意拿来存储假牌
										cards: [],
										es: [],
										js: [],
									};
									//这个拿来存储虚拟牌对应的实体牌
									event.vcard_cards = [];
									event.gaintag_map = {};
									var hs = [],
										es = [],
										js = [],
										ss = [],
										xs = [];
									var unmarks = [];
									if (event.insert_card && event.position == ui.cardPile) event.cards.reverse();
									var hej = player.getCards("hejsx");
									event.stockcards = cards.slice(0);
									for (var i = 0; i < cards.length; i++) {
										let cardx = [cards[i]];
										if (!hej.includes(cards[i])) {
											cards.splice(i--, 1);
											continue;
										} else if (cards[i].parentNode) {
											if (cards[i].parentNode.classList.contains("equips")) {
												cards[i].throwWith = cards[i].original = "e";
												const VEquip = cards[i][cards[i].cardSymbol];
												if (VEquip) {
													//判断是否是假牌
													if (cards[i].isViewAsCard) {
														let loseCards = VEquip.cards;
														//解体！
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
													//判断是否是假牌
													if (cards[i].isViewAsCard) {
														let loseCards = VJudge.cards;
														//解体！
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
										for (var j = 0; j < cardx.length; j++) {
											if (cardx[j].gaintag && cardx[j].gaintag.length) {
												event.gaintag_map[cardx[j].cardid] = cardx[j].gaintag.slice(0);
												//仅移除非永久标记
												const tags = cardx[j].gaintag.filter(tag => !tag.startsWith("eternal_"));
												tags.forEach(tag => cardx[j].removeGaintag(tag));
											}
											cardx[j].style.transform += " scale(0.2)";
											cardx[j].classList.remove("glow");
											cardx[j].classList.remove("glows");
											cardx[j].recheck();
											var info = lib.card[cardx[j].name];
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
											//if(ss.includes(cardx[j])) cards.splice(i--,1);
										}
									}
									if (player == game.me) dui.queueNextFrameTick(dui.layoutHand, dui);
									ui.updatej(player);
									game.broadcast(
										function (player, cards, num) {
											for (var i = 0; i < cards.length; i++) {
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
										var evt = event.getParent();
										evt.discardid = lib.status.videoId++;
										game.broadcastAll(
											function (player, cards, id, visible) {
												const cardx = cards
													.slice()
													.map(i => (i.cards ? i.cards : [i]))
													.flat();
												cardx.duiMod = true;
												if (visible) player.$throw(cardx, null, "nobroadcast");
												var cardnodes = [];
												cardnodes._discardtime = get.time();
												for (var i = 0; i < cardx.length; i++) {
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
												var waitingForTransition = get.time();
												evt.waitingForTransition = waitingForTransition;
												cards[0].clone.listenTransition(function () {
													if (_status.waitingForTransition == waitingForTransition && _status.paused) {
														game.resume();
													}
													delete evt.waitingForTransition;
												});
											} else if (evt.getParent().discardTransition) {
												delete evt.getParent().discardTransition;
												var waitingForTransition = get.time();
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
										var evt = event.relatedEvent || event.getParent();
										if (!evt.orderingCards) evt.orderingCards = [];
										if (!evt.noOrdering && !evt.cardsOrdered) {
											evt.cardsOrdered = true;
											var next = game.createEvent("orderingDiscard", false);
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
										for (var i of unmarks) {
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
							get chooseToGuanxing() {
								//联机禁用chhoseToGuanxing函数
								if (_status.connectMode) return base.lib.element.content.chooseToGuanxing;
								return function () {
									"step 0";
									if (player.isUnderControl()) game.swapPlayer(player);
									var cards = get.cards(num);
									var guanxing = decadeUI.content.chooseGuanXing(player, cards, cards.length, null, cards.length);
									guanxing.caption = event.getParent() && event.getParent().name && get.translation(event.getParent().name) != event.getParent().name ? "【" + get.translation(event.getParent().name) + "】" : "请按顺序排列牌";
									game.broadcast(
										function (player, cards, callback) {
											if (!window.decadeUI) return;
											var guanxing = decadeUI.content.chooseGuanXing(player, cards, cards.length, null, cards.length);
											guanxing.caption = "观星";
											guanxing.callback = callback;
											game.log(guanxing.callback);
										},
										player,
										cards,
										guanxing.callback
									);
									if (event.isOnline()) {
										event.player.send(function () {
											if (!window.decadeUI && decadeUI.eventDialog) _status.event.finish();
										}, event.player);
										event.player.wait();
										decadeUI.game.wait();
									} else if (!(typeof event.isMine == "function" && event.isMine())) {
										const processAI =
											event.processAI ||
											function (list) {
												let cards = list[0][1],
													player = _status.event.player,
													target = _status.currentPhase || player,
													name = _status.event.getTrigger()?.name,
													countWuxie = current => {
														let num = current.getKnownCards(player, card => {
															return get.name(card, current) === "wuxie";
														});
														if (num && current !== player) return num;
														let skills = current.getSkills("invisible").concat(lib.skill.global);
														game.expandSkills(skills);
														for (let i = 0; i < skills.length; i++) {
															let ifo = get.info(skills[i]);
															if (!ifo) continue;
															if (ifo.viewAs && typeof ifo.viewAs != "function" && ifo.viewAs.name == "wuxie") {
																if (!ifo.viewAsFilter || ifo.viewAsFilter(current)) {
																	num++;
																	break;
																}
															} else {
																let hiddenCard = ifo.hiddenCard;
																if (typeof hiddenCard == "function" && hiddenCard(current, "wuxie")) {
																	num++;
																	break;
																}
															}
														}
														return num;
													},
													top = [];
												switch (name) {
													case "phaseJieshu":
														target = target.next;
													case "phaseZhunbei":
														let att = get.sgn(get.attitude(player, target)),
															judges = target.getCards("j"),
															needs = 0,
															wuxie = countWuxie(target);
														for (let i = Math.min(cards.length, judges.length) - 1; i >= 0; i--) {
															let j = judges[i],
																cardj = j.viewAs
																	? {
																		name: j.viewAs,
																		cards: j.cards || [j],
																	}
																	: j;
															if (wuxie > 0 && get.effect(target, j, target, target) < 0) {
																wuxie--;
																continue;
															}
															let judge = get.judge(j);
															cards.sort((a, b) => {
																return (judge(b) - judge(a)) * att;
															});
															if (judge(cards[0]) * att < 0) {
																needs++;
																continue;
															} else {
																top.unshift(cards.shift());
															}
														}
														if (needs > 0 && needs >= judges.length) {
															return [top, cards];
														}
														cards.sort((a, b) => {
															return (get.value(b, target) - get.value(a, target)) * att;
														});
														while (needs--) {
															top.unshift(cards.shift());
														}
														while (cards.length) {
															if (get.value(cards[0], target) > 6 == att > 0) top.push(cards.shift());
															else break;
														}
														return [top, cards];
													default:
														cards.sort((a, b) => {
															return get.value(b, target) - get.value(a, target);
														});
														while (cards.length) {
															if (get.value(cards[0], target) > 6) top.push(cards.shift());
															else break;
														}
														return [top, cards];
												}
											};
										var [cards, cheats] = processAI([[" ", guanxing.cards[0].slice()]]),
											time = 500;
										for (var i = 0; i < cheats.length; i++) {
											setTimeout(
												function (card, index, finished) {
													guanxing.move(card, index, 0);
													if (finished) guanxing.finishTime(1000);
												},
												time,
												cheats[i],
												i,
												i >= cheats.length - 1 && cards.length == 0
											);
											time += 500;
										}
										for (var i = 0; i < cards.length; i++) {
											setTimeout(
												function (card, index, finished) {
													guanxing.move(card, index, 1);
													if (finished) guanxing.finishTime(1000);
												},
												time,
												cards[i],
												i,
												i >= cards.length - 1
											);
											time += 500;
										}
									}
									"step 1";
									var [top, bottom] = [event.cards1, event.cards2];
									event.result = {
										bool: true,
										moved: [top, bottom],
									};
									game.addCardKnower(top, player);
									game.addCardKnower(bottom, player);
									player.popup(get.cnNumber(event.num1) + "上" + get.cnNumber(event.num2) + "下");
									game.logv(player, "将" + get.cnNumber(event.num1) + "张牌置于牌堆顶，" + get.cnNumber(event.num2) + "张牌置于牌堆底");
								};
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
												dialog.caption = get.translation(eventName) + "拼点";
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
												var dialog = ui.create.dialog(str);
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
											var dialog = ui.dialogs[eventName];
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
												dialog.caption = get.translation(eventName) + "拼点";
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
												var dialog = ui.create.dialog(str);
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
											var dialog = ui.dialogs[eventName];
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
										var dialog = ui.dialogs[this.compareId];
										if (dialog) dialog.close();
									});
									game.broadcastAll(
										function (player, target, eventName, compareId) {
											if (!window.decadeUI) return;
											var dialog = decadeUI.create.compareDialog();
											dialog.caption = get.translation(eventName) + "拼点";
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
											var dialog = ui.dialogs[eventName];
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
												var dialog = ui.dialogs[eventName];
												if (!dialog && window.decadeUI) {
													dialog = decadeUI.create.compareDialog();
													var __captionName = typeof eventName === "string" ? eventName.split("_")[0] : "";
													dialog.caption = get.translation(__captionName) + "拼点";
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
												var dialog = ui.create.dialog(str);
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
											var dialog = ui.dialogs[eventName];
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
										var next = game.createEvent("compareMultiple");
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
							var temp = lib.config.glow_phase;
							lib.config.glow_phase = "";
							base.lib.init.cssstyles.call(this);
							lib.config.glow_phase = temp;
							ui.css.styles.sheet.insertRule('.avatar-name, .avatar-name-default { font-family: "' + (lib.config.name_font || "xinkai") + '", "xinwei" }', 0);
						},
					},
				},
				ui: {
					updatec() {
						var controls = ui.control.childNodes;
						var stayleft;
						var offsetLeft;
						for (var i = 0; i < controls.length; i++) {
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
						var judges = player.node.judges.childNodes;
						for (var i = 0; i < judges.length; i++) {
							if (judges[i].classList.contains("removing")) continue;
							judges[i].classList.remove("drawinghidden");
							if (_status.connectMode) {
								const bgMark = lib.translate[judges[i].name + "_bg"] || get.translation(judges[i].name)[0];
								judges[i].node.judgeMark.node.judge.innerHTML = bgMark;
							}
						}
					},
					updatem(player) { },
					updatez() {
						window.documentZoom = game.documentZoom;
						document.body.style.zoom = game.documentZoom;
						document.body.style.width = "100%";
						document.body.style.height = "100%";
						document.body.style.transform = "";
					},
					update() {
						for (var i = 0; i < ui.updates.length; i++) ui.updates[i]();
						if (ui.dialog == undefined || ui.dialog.classList.contains("noupdate")) return;
						if (game.chess) return base.ui.update();
						if ((!ui.dialog.buttons || !ui.dialog.buttons.length) && !ui.dialog.forcebutton && ui.dialog.classList.contains("fullheight") == false && get.mode() != "stone") {
							ui.dialog.classList.add("prompt");
						} else {
							ui.dialog.classList.remove("prompt");
							var height = ui.dialog.content.offsetHeight;
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
						for (var i = 0; i < nodes.childElementCount; i++) {
							var node = nodes.childNodes[i];
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
							var button = ui.create.div();
							button.style.display = "none";
							button.link = item;
							button.activate = function () {
								var node = ui.create.button(item, type, undefined, noclick, button);
								node.activate = undefined;
							};
							_status.prebutton.push(button);
							if (position) position.appendChild(button);
							return button;
						},
						rarity(button) {
							if (!lib.config.show_rarity) return;
							var rarity = game.getRarity(button.link);
							var intro = button.node.intro;
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
							var i, controls;
							var nozoom = false;
							if (Array.isArray(arguments[0])) {
								controls = arguments[0];
							} else {
								controls = arguments;
							}
							var control = document.createElement("div");
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
							var hidden = false;
							var notouchscroll = false;
							var forcebutton = false;
							var forcebutton = false;
							let peaceDialog = false;
							var dialog = decadeUI.element.create("dialog");
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
							if (forcebutton) {
								dialog.forcebutton = true;
								dialog.classList.add("forcebutton");
							}
							if (peaceDialog) dialog.peaceDialog = true;
							return dialog;
						},
						selectlist(list, init, position, onchange) {
							var select = document.createElement("select");
							for (var i = 0; i < list.length; i++) {
								var option = document.createElement("option");
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
							var result = base.ui.create.arena.apply(this, arguments);
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
							var dialog = base.ui.create.pause.call(this);
							dialog.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
							return dialog;
						},
						//发动技能函数
						//武将搜索代码摘抄至扩展ol
						characterDialog() {
							const dialog = base.ui.create.characterDialog.apply(this, arguments);
							const control = lib.config.extension_十周年UI_mx_decade_characterDialog || "default";
							if (control != "default") {
								const Searcher = dialog.querySelector(".searcher.caption");
								if (Searcher) Searcher.parentNode.removeChild(Searcher);
								if (control == "extension-OL-system") {
									var content_container = dialog.childNodes[0];
									var content = content_container.childNodes[0];
									var switch_con = content.childNodes[0];
									var buttons = content.childNodes[1];
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
								var doubleCamp = get.is.double(node._link, true);
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
									var infoitem = get.character(item);
									node.node.name.innerHTML = get.slimName(item);
									if (lib.config.buttoncharacter_style == "default" || lib.config.buttoncharacter_style == "simple") {
										if (lib.config.buttoncharacter_style == "simple") {
											node.node.group.style.display = "none";
										}
										node.classList.add("newstyle");
										node.node.name.dataset.nature = get.groupnature(get.bordergroup(infoitem));
										node.node.group.dataset.nature = get.groupnature(get.bordergroup(infoitem), "raw");
										ui.create.div(node.node.hp);
										var hp = get.infoHp(infoitem[2]),
											maxHp = get.infoMaxHp(infoitem[2]),
											hujia = get.infoHujia(infoitem[2]);
										const check =
											(get.mode() == "single" && _status.mode == "changban") ||
											((get.mode() == "guozhan" ||
												(function (config) {
													if (typeof config === "string") return config === "double";
													return Boolean(config) === true;
												})(_status.connectMode ? lib.configOL.double_character : get.config("double_character"))) &&
												(_status.connectMode || (_status.connectMode ? lib.configOL.double_hp : get.config("double_hp")) == "pingjun"));
										var str = get.numStr(hp / (check ? 2 : 1));
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
										var hp = get.infoHp(infoitem[2]);
										var maxHp = get.infoMaxHp(infoitem[2]);
										var shield = get.infoHujia(infoitem[2]);
										if (maxHp > 14) {
											if (typeof infoitem[2] == "string") node.node.hp.innerHTML = infoitem[2];
											else node.node.hp.innerHTML = get.numStr(infoitem[2]);
											node.node.hp.classList.add("text");
										} else {
											for (var i = 0; i < maxHp; i++) {
												var next = ui.create.div("", node.node.hp);
												if (i >= hp) next.classList.add("exclude");
											}
											for (var i = 0; i < shield; i++) {
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
										var doubleCamp = get.is.double(item, true);
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
										var intro = ui.create.div(".button.replaceButton", node);
										node.node.replaceButton = intro;
										intro.innerText = "切换";
										intro._node = node;
										intro.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
											_status.tempNoButton = true;
											var node = this._node;
											var list = lib.characterReplace[node._link];
											var link = node.link;
											var index = list.indexOf(link);
											if (index == list.length - 1) index = 0;
											else index++;
											link = list[index];
											node.link = link;
											node.refresh(node, link);
											setTimeout(
												function (_status) {
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
									var rect = this.getBoundingClientRect();
									e = {
										clientX: (rect.left + 10) * game.documentZoom,
										clientY: (rect.top + 10) * game.documentZoom,
									};
								}
								ui.click.touchpop();
								ui.click.intro.call(this, e);
								_status.clicked = false;
								return;
							}
							var custom = _status.event.custom;
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
							}
							if (game.chess && get.config("show_range") && !_status.event.skill && this.classList.contains("selected") && _status.event.isMine() && _status.event.name == "chooseToUse") {
								var player = _status.event.player;
								var range = get.info(this).range;
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
							if (lib.config.popequip && lib.config.phonelayout && arguments[0] != "popequip" && ui.arena && ui.arena.classList.contains("selecting") && this.parentNode.classList.contains("popequip")) {
								var rect = this.getBoundingClientRect();
								ui.click.touchpop();
								ui.click.intro.call(this.parentNode, {
									clientX: rect.left + 18,
									clientY: rect.top + 12,
								});
							}
						},
						intro() {
							if (this.classList.contains("infohidden")) return;
							return base.ui.click.intro.apply(this, arguments);
						},
						window() {
							var clicked = _status.clicked;
							var dialogtouched = false;
							if (_status.dialogtouched) {
								_status.dialogtouched = false;
								dialogtouched = true;
							}
							if (_status.dragged) {
								return;
							}
							if (_status.touchpopping) {
								return;
							}
							if (_status.reloading) {
								return;
							}
							if (_status.clicked || _status.clicked2) {
								_status.clicked = false;
								_status.clicked2 = false;
							} else {
								if (_status.clickingidentity) {
									for (var i = 0; i < _status.clickingidentity[1].length; i++) {
										_status.clickingidentity[1][i].delete();
										_status.clickingidentity[1][i].style.transform = "";
									}
									delete _status.clickingidentity;
								}
								if (!_status.event.isMine) {
									return;
								}
								if (ui.controls.length) {
									ui.updatec();
								}
								if (_status.editing) {
									if (_status.editing.innerHTML.length) {
										_status.editing.link = _status.editing.innerHTML;
									}
									_status.editing.innerHTML = get.translation(_status.editing.link);
									delete _status.editing;
								} else if (_status.choosing) {
									if (!_status.choosing.expand) {
										_status.choosing.parentNode.style.height = "";
										_status.choosing.nextSibling.delete();
										_status.choosing.previousSibling.show();
										delete _status.choosing;
									}
								} else if (ui.intro) {
									ui.intro.close();
									delete ui.intro;
									ui.control.show();
									game.resume2();
								} else if ((_status.event.isMine() || _status.event.forceMine) && !dialogtouched) {
									if (typeof _status.event.custom?.replace?.window == "function") {
										_status.event.custom.replace.window();
									}
								}
								if (!ui.shortcut.classList.contains("hidden")) {
									ui.click.shortcut(false);
								}
								if (get.is.phoneLayout() && ui.menuContainer && ui.menuContainer.classList.contains("hidden")) {
									if (ui.system2.classList.contains("shown")) {
										_status.removinground = true;
										setTimeout(function () {
											_status.removinground = false;
										}, 200);
									}
									ui.arena.classList.remove("phonetop");
									ui.system1.classList.remove("shown");
									ui.system2.classList.remove("shown");
								}
							}
							if (_status.tempunpop) {
								_status.tempunpop = false;
							} else {
								game.closePopped();
							}
							if (typeof _status.event.custom?.add?.window == "function") {
								_status.event.custom.add.window(clicked);
							}
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
									var avatar2;
									var target = targets[0];
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
					addOverDialog(dialog, result) {
						var sprite = decadeUI.backgroundAnimation.current;
						if (!(sprite && sprite.name == "skin_xiaosha_default")) return;
						decadeUI.backgroundAnimation.canvas.style.zIndex = 7;
						switch (result) {
							case "战斗胜利":
								sprite.scaleTo(1.8, 600);
								sprite.setAction("shengli");
								break;
							case "平局":
							case "战斗失败":
								if (!duicfg.rightLayout) sprite.flipX = true;
								sprite.moveTo([0, 0.5], [0, 0.25], 600);
								sprite.scaleTo(2.5, 600);
								sprite.setAction("gongji");
								break;
						}
					},
				},
				get: {
					//十周年UI技能排除
					skillState(player) {
						const skills = base.get.skillState.apply(this, arguments);
						if (game.me !== player) {
							var global = (skills.global = skills.global.concat());
							for (var i = global.length - 1; i >= 0; i--) {
								if (global[i].indexOf("decadeUI") >= 0) global.splice(i, 1);
							}
						}
						return skills;
					},
					objtype(obj) {
						obj = Object.prototype.toString.call(obj);
						switch (obj) {
							case "[object Array]":
								return "array";
							case "[object Object]":
								return "object";
							case "[object HTMLDivElement]":
								return "div";
							case "[object HTMLTableElement]":
								return "table";
							case "[object HTMLTableRowElement]":
								return "tr";
							case "[object HTMLTableCellElement]":
								return "td";
							case "[object HTMLBodyElement]":
								return "td";
						}
					},
				},
			};
			override(lib, ride.lib);
			override(ui, ride.ui);
			override(game, ride.game);
			override(get, ride.get);
			decadeUI.get.extend(decadeUI, duilib);
			if (decadeModule.modules) {
				for (var i = 0; i < decadeModule.modules.length; i++) {
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
				var identityList = game.getIdentityList(this.parentNode);
				if (!identityList) return;
				if (lib.config.mark_identity_style == "click") {
					var getNext = false;
					var theNext;
					var key;
					var current = this.firstChild.innerText;
					for (const key in identityList) {
						if (theNext == null || getNext) {
							theNext = key;
							if (getNext) break;
						}
						if (current == identityList[key]) getNext = true;
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
					var index = 0;
					var node;
					var nodes = dui.$identityMarkBox.childNodes;
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
				var setting = ui.create.dialog("hidden");
				setting.listen(function (e) {
					e.stopPropagation();
				});
				var backVolume = decadeUI.component.slider(0, 8, parseInt(lib.config.volumn_background));
				var gameVolume = decadeUI.component.slider(0, 8, parseInt(lib.config.volumn_audio));
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
				var nodes = document.getElementsByClassName("thrown");
				for (var i = nodes.length - 1; i >= 0; i--) {
					if (nodes[i].fixed) continue;
					if (nodes[i].classList.contains("card")) decadeUI.layout.clearout(nodes[i]);
					else nodes[i].delete();
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
				var equipSolts = (ui.equipSolts = decadeUI.element.create("equips-wrap"));
				equipSolts.back = decadeUI.element.create("equips-back", equipSolts);
				for (var repetition = 0; repetition < 5; repetition++) {
					var ediv = decadeUI.element.create(null, equipSolts.back);
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
				var player = ui.create.div(".player", position);
				var playerExtend = {
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
				var chainImg = new Image();
				chainImg.onerror = function () {
					var node = decadeUI.element.create("chain-back", player.node.chain);
					for (var i = 0; i < 40; i++) decadeUI.element.create("cardbg", node).style.transform = "translateX(" + (i * 5 - 5) + "px)";
					chainImg.onerror = undefined;
				};
				chainImg.src = decadeUIPath + "assets/image/tie_suo.png";
				var extend = {
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
				var realIdentity = ui.create.div(player.node.identity);
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
							var filename;
							var checked;
							var identity = this.parentNode.dataset.color;
							var gameMode = get.mode();
							switch (value) {
								case "猜":
									filename = "cai";
									if (_status.mode == "purple" && identity == "cai") {
										filename += "_blue";
										checked = true;
									}
									break;
								case "友":
									filename = "friend";
									break;
								case "敌":
									filename = "enemy";
									break;
								case "反":
									filename = "fan";
									if (get.mode() == "doudizhu") {
										filename = "nongmin";
										checked = true;
									}
									break;
								case "主":
									filename = "zhu";
									if (get.mode() == "versus" && get.translation(player.side + "Color") == "wei") {
										filename += "_blue";
										this.player.classList.add("opposite-camp");
										checked = true;
									} else if (get.mode() == "doudizhu") {
										filename = "dizhu";
										checked = true;
									}
									break;
								case "忠":
									filename = "zhong";
									if (gameMode == "identity" && _status.mode == "purple") {
										filename = "qianfeng";
									} else if (get.mode() == "versus" && get.translation(player.side + "Color") == "wei") {
										filename += "_blue";
										this.player.classList.add("opposite-camp");
										checked = true;
									}
									break;
								case "内":
									if (_status.mode == "purple") {
										filename = identity == "rNei" ? "xizuo" : "xizuo_blue";
										checked = true;
									} else {
										filename = "nei";
									}
									break;
								case "野":
									filename = "ye";
									break;
								case "首":
									filename = "zeishou";
									break;
								case "帅":
									filename = "zhushuai";
									break;
								case "将":
									filename = "dajiang";
									if (_status.mode == "three" || get.translation(player.side + "Color") == "wei") {
										filename = "zhushuai_blue";
										checked = true;
									}
									break;
								case "兵":
								case "卒":
									filename = this.player.side === false ? "qianfeng_blue" : "qianfeng";
									checked = true;
									break;
								case "师":
									filename = "junshi";
									break;
								case "盟":
									filename = "mengjun";
									break;
								case "神":
									filename = "boss";
									break;
								case "从":
									filename = "suicong";
									break;
								case "先":
									filename = "xianshou";
									break;
								case "后":
									filename = "houshou";
									break;
								case "民":
									filename = "commoner";
									break;
								default:
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
							var image = new Image();
							image.node = this;
							image.onerror = function () {
								this.node.style.visibility = "";
							};
							// -----------------分割线-----------------
							// 不同样式身份标记
							var style = lib.config.extension_十周年UI_newDecadeStyle;
							var srcMap = {
								onlineUI: "image/decorationo/identity2_",
								babysha: "image/decorationh/identity3_",
								on: "image/decoration/identity_",
								othersOff: "image/decoration/identity_",
							};
							var srcPrefix = srcMap[style] || "image/decorations/identity2_";
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
				var campWrap = decadeUI.element.create("camp-wrap");
				var hpWrap = decadeUI.element.create("hp-wrap");
				player.insertBefore(campWrap, player.node.name);
				player.insertBefore(hpWrap, player.node.hp);
				player.node.campWrap = campWrap;
				player.node.hpWrap = hpWrap;
				hpWrap.appendChild(player.node.hp);
				var campWrapExtend = {
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
				//结束
				var node = {
					mask: player.insertBefore(decadeUI.element.create("mask"), player.node.identity),
					gainSkill: decadeUI.element.create("gain-skill", player),
				};
				var properties = {
					gainSkill: {
						player: player,
						gain(skill) {
							var sender = this;
							if (!sender.skills) sender.skills = [];
							if (!sender.skills.includes(skill) && lib.translate[skill]) {
								//手杀样式下将获得技能显示在标记内
								if (lib.config.extension_十周年UI_newDecadeStyle == "off") {
									var info = lib.skill[skill];
									if (!info || info.charlotte || info.sub || (info.mark && !info.limited) || info.nopop || info.popup === false) return;
									if (info.onremove && game.me != this.player.storage[skill]) return;
									if (!info.intro)
										info.intro = {
											content() {
												return get.translation(skill + "_info");
											},
										};
									player.markSkill(skill);
								}
								sender.skills.push(skill);
								var html = "";
								for (var i = 0; i < sender.skills.length; i++) {
									/*-----------------分割线-----------------*/
									html += "" + lib.translate[sender.skills[i]] + " ";
									sender.innerHTML = html;
								}
							}
						},
						lose(skill) {
							var sender = this;
							var index = sender.skills.indexOf(skill);
							if (index >= 0) {
								sender.skills.splice(index, 1);
								var html = "";
								for (var i = 0; i < sender.skills.length; i++) {
									/*-----------------分割线-----------------*/
									html += "" + lib.translate[sender.skills[i]] + " ";
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
				var card = ui.create.div(".card");
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
				var extend = {
					$name: decadeUI.element.create("top-name", card),
					$vertname: card.node.name,
					$equip: card.node.name2,
					$suitnum: card.node.suitnum,
					$range: card.node.range,
					$gaintag: card.node.gaintag,
				};
				for (var i in extend) card[i] = extend[i];
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
				var result = base.ui.create.cards.apply(this, arguments);
				game.updateRoundNumber();
				return result;
			};
			lib.init.layout = function (layout, nosave) {
				if (!nosave) game.saveConfig("layout", layout);
				game.layout = layout;
				var relayout = function () {
					ui.arena.dataset.layout = game.layout;
					if (lib.config.phonelayout) {
						ui.css.phone.href = lib.assetURL + "layout/default/phone.css";
						ui.arena.classList.add("phone");
						ui.arena.setAttribute("data-phonelayout", "on"); // 新增
					} else {
						ui.css.phone.href = "";
						ui.arena.classList.remove("phone");
						ui.arena.setAttribute("data-phonelayout", "off"); // 新增
					}
					for (var i = 0; i < game.players.length; i++) {
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
					setTimeout(function () {
						if (game.me) game.me.update();
						setTimeout(function () {
							ui.updatex();
						}, 500);
						setTimeout(function () {
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
								if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
								else {
									const name = get.translation(this._finalGroup),
										str = get.plainText(name);
									if (str.length <= 2) this.node.campWrap.node.campName.innerHTML = name;
									else this.node.campWrap.node.campName.innerHTML = name.replaceAll(str, str[0]);
								}
							} else {
								this.node.campWrap.node.campName.innerHTML = "";
								this.node.campWrap.node.campName.style.backgroundImage = "";
								var image = new Image();
								var url = decadeUIPath + (decadeUI.config.newDecadeStyle == "off" ? "image/decorations/name2_" : decadeUI.config.newDecadeStyle == "babysha" ? "image/decorationh/hs_" : decadeUI.config.newDecadeStyle == "othersOff" ? (lib.config.extension_十周年UI_borderLevel == "one" ? "image/decoration/name_" : "image/decoration/group_") : "image/decoration/name_") + group + ".png";
								this._finalGroup = group;
								const create = () => {
									if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
									else {
										const name = get.translation(this._finalGroup),
											str = get.plainText(name);
										if (str.length <= 2) this.node.campWrap.node.campName.innerHTML = name;
										else this.node.campWrap.node.campName.innerHTML = name.replaceAll(str, str[0]);
									}
								};
								image.onerror = () => {
									create();
								};
								if (decadeUI.config.newDecadeStyle != "onlineUI") this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
								else create();
								image.src = url;
							}
						} else {
							if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
							else {
								const name = get.translation(this._finalGroup),
									str = get.plainText(name);
								if (str.length <= 1) this.node.campWrap.node.campName.innerHTML = name;
								else this.node.campWrap.node.campName.innerHTML = str[0];
							}
							if (decadeUI.config.newDecadeStyle == "off") {
								var image = new Image();
								var url = decadeUIPath + (decadeUI.config.newDecadeStyle == "off" ? "image/decorations/name2_" : decadeUI.config.newDecadeStyle == "babysha" ? "image/decorationh/hs_" : decadeUI.config.newDecadeStyle == "othersOff" ? (lib.config.extension_十周年UI_borderLevel == "one" ? "image/decoration/name_" : "image/decoration/group_") : "image/decoration/name_") + group + ".png";
								this._finalGroup = group;
								const create = () => {
									if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
									else {
										const name = get.translation(this._finalGroup),
											str = get.plainText(name);
										if (str.length <= 1) this.node.campWrap.node.campName.innerHTML = name;
										else this.node.campWrap.node.campName.innerHTML = str[0];
									}
								};
								image.onerror = () => {
									create();
								};
								this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
								image.src = url;
							} else {
								this._finalGroup = group;
								if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
								else {
									const name = get.translation(this._finalGroup),
										str = get.plainText(name);
									if (str.length <= 1) this.node.campWrap.node.campName.innerHTML = name;
									else this.node.campWrap.node.campName.innerHTML = str[0];
								}
							}
						}
					},
				},
			});
		},
		dialog: {
			create(className, parentNode, tagName) {
				var element = !tagName ? document.createElement("div") : document.createElement(tagName);
				for (var i in decadeUI.dialog) {
					if (decadeUI.dialog[i]) element[i] = decadeUI.dialog[i];
				}
				element.listens = {};
				for (var i in decadeUI.dialog.listens) {
					if (decadeUI.dialog.listens[i]) element.listens[i] = decadeUI.dialog.listens[i];
				}
				element.listens._dialog = element;
				element.listens._list = [];
				if (className) element.className = className;
				if (parentNode) parentNode.appendChild(element);
				return element;
			},
			open() {
				if (this == decadeUI.dialog) return console.error("undefined");
			},
			show() {
				if (this == decadeUI.dialog) return console.error("undefined");
				this.classList.remove("hidden");
			},
			hide() {
				if (this == decadeUI.dialog) return console.error("undefined");
				this.classList.add("hidden");
			},
			animate(property, duration, toArray, fromArrayOptional) {
				if (this == decadeUI.dialog) return console.error("undefined");
				if (property == null || duration == null || toArray == null) return console.error("arguments");
				var propArray = property.replace(/\s*/g, "").split(",");
				if (!propArray || propArray.length == 0) return console.error("property");
				var realDuration = 0;
				if (duration.lastIndexOf("s") != -1) {
					if (duration.lastIndexOf("ms") != -1) {
						duration = duration.replace(/ms/, "");
						duration = parseInt(duration);
						if (isNaN(duration)) return console.error("duration");
						realDuration = duration;
					} else {
						duration = duration.replace(/s/, "");
						duration = parseFloat(duration);
						if (isNaN(duration)) return console.error("duration");
						realDuration = duration * 1000;
					}
				} else {
					duration = parseInt(duration);
					if (isNaN(duration)) return console.error("duration");
					realDuration = duration;
				}
				if (fromArrayOptional) {
					for (var i = 0; i < propArray.length; i++) {
						this.style.setProperty(propArray[i], fromArrayOptional[i]);
					}
				}
				var duraBefore = this.style.transitionDuration;
				var propBefore = this.style.transitionProperty;
				this.style.transitionDuration = realDuration + "ms";
				this.style.transitionProperty = property;
				ui.refresh(this);
				for (var i = 0; i < propArray.length; i++) {
					this.style.setProperty(propArray[i], toArray[i]);
				}
				var restore = this;
				setTimeout(function () {
					restore.style.transitionDuration = duraBefore;
					restore.style.transitionProperty = propBefore;
				}, realDuration);
			},
			close(delayTime, fadeOut) {
				if (this == decadeUI.dialog) return console.error("undefined");
				this.listens.clear();
				if (!this.parentNode) return;
				if (fadeOut === true && delayTime) {
					this.animate("opacity", delayTime, 0);
				}
				if (delayTime) {
					var remove = this;
					delayTime = typeof delayTime == "number" ? delayTime : parseInt(delayTime);
					setTimeout(function () {
						if (remove.parentNode) remove.parentNode.removeChild(remove);
					}, delayTime);
					return;
				}
				this.parentNode.removeChild(this);
				return;
			},
			listens: {
				add(listenElement, event, func, useCapture) {
					if (!this._dialog || !this._list) return console.error("undefined");
					if (!(listenElement instanceof HTMLElement) || !event || typeof func !== "function") return console.error("arguments");
					this._list.push(new Array(listenElement, event, func));
					listenElement.addEventListener(event, func);
				},
				remove(listenElementOptional, eventOptional, funcOptional) {
					if (!this._dialog || !this._list) return console.error("undefined");
					var list = this._list;
					if (listenElementOptional && eventOptional && funcOptional) {
						var index = list.indexOf(new Array(listenElementOptional, eventOptional, funcOptional));
						if (index != -1) {
							list[index][0].removeEventListener(list[index][1], list[index][2]);
							list.splice(index, 1);
							return;
						}
					} else if (listenElementOptional && eventOptional) {
						for (var i = list.length - 1; i >= 0; i--) {
							if (list[i][0] == listenElementOptional && list[i][1] == eventOptional) {
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list.splice(i, 1);
							}
						}
					} else if (listenElementOptional && funcOptional) {
						for (var i = list.length - 1; i >= 0; i--) {
							if (list[i][0] == listenElementOptional && list[i][2] == funcOptional) {
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list.splice(i, 1);
							}
						}
					} else if (eventOptional && funcOptional) {
						for (var i = list.length - 1; i >= 0; i--) {
							if (list[i][1] == eventOptional && list[i][2] == funcOptional) {
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list.splice(i, 1);
							}
						}
					} else if (listenElementOptional) {
						for (var i = list.length - 1; i >= 0; i--) {
							if (list[i][0] == listenElementOptional) {
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list.splice(i, 1);
							}
						}
					} else if (eventOptional) {
						for (var i = list.length - 1; i >= 0; i--) {
							if (list[i][1] == eventOptional) {
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list.splice(i, 1);
							}
						}
					} else if (funcOptional) {
						for (var i = list.length - 1; i >= 0; i--) {
							if (list[i][2] == funcOptional) {
								list[i][0].removeEventListener(list[i][1], list[i][2]);
								list.splice(i, 1);
							}
						}
					}
				},
				clear() {
					if (!this._dialog || !this._list) return console.error("undefined");
					var list = this._list;
					for (var i = list.length - 1; i >= 0; i--) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list[i] = undefined;
					}
					list.length = 0;
				},
			},
		},
		animate: {
			check() {
				if (!ui.arena) return false;
				if (this.updates == undefined) this.updates = [];
				if (this.canvas == undefined) {
					this.canvas = ui.arena.appendChild(document.createElement("canvas"));
					this.canvas.id = "decadeUI-canvas-arena";
				}
				return true;
			},
			add(frameFunc) {
				if (typeof frameFunc != "function") return;
				if (!this.check()) return;
				var obj = {
					inits: [],
					update: frameFunc,
					id: decadeUI.getRandom(0, 100),
				};
				if (arguments.length > 2) {
					obj.inits = new Array(arguments.length - 2);
					for (var i = 2; i < arguments.length; i++) {
						obj.inits[i - 2] = arguments[i];
					}
				}
				this.updates.push(obj);
				if (this.frameId == undefined) this.frameId = requestAnimationFrame(this.update.bind(this));
			},
			update() {
				var frameTime = performance.now();
				var delta = frameTime - (this.frameTime == undefined ? frameTime : this.frameTime);
				this.frameTime = frameTime;
				var e = {
					canvas: this.canvas,
					context: this.canvas.getContext("2d"),
					deltaTime: delta,
					save() {
						this.context.save();
						return this.context;
					},
					restore() {
						this.context.restore();
						return this.context;
					},
					drawLine(x1, y1, x2, y2, color, lineWidth) {
						if (x1 == null || y1 == null) throw "arguments";
						var context = this.context;
						context.beginPath();
						if (color) context.strokeStyle = color;
						if (lineWidth) context.lineWidth = lineWidth;
						if (x2 == null || y2 == null) {
							context.lineTo(x1, y1);
						} else {
							context.moveTo(x1, y1);
							context.lineTo(x2, y2);
						}
						context.stroke();
					},
					drawRect(x, y, width, height, color, lineWidth) {
						if (x == null || y == null || width == null || height == null) throw "arguments";
						var ctx = this.context;
						ctx.beginPath();
						if (color) ctx.strokeStyle = color;
						if (lineWidth) ctx.lineWidth = lineWidth;
						ctx.rect(x, y, width, height);
						ctx.stroke();
					},
					drawText(text, font, color, x, y, textAlign, textBaseline, stroke) {
						if (!text) return;
						if (x == null || y == null) throw "x or y";
						var context = this.context;
						if (font) context.font = font;
						if (textAlign) context.textAlign = textAlign;
						if (textBaseline) context.textBaseline = textBaseline;
						if (color) {
							if (!stroke) context.fillStyle = color;
							else context.strokeStyle = color;
						}
						if (!stroke) context.fillText(text, x, y);
						else context.strokeText(text, x, y);
					},
					drawStrokeText(text, font, color, x, y, textAlign, textBaseline) {
						this.drawText(text, font, color, x, y, textAlign, textBaseline, true);
					},
					fillRect(x, y, width, height, color) {
						if (color) this.context.fillStyle = color;
						this.context.fillRect(x, y, width, height);
					},
				};
				if (!decadeUI.dataset.animSizeUpdated) {
					decadeUI.dataset.animSizeUpdated = true;
					e.canvas.width = e.canvas.parentNode.offsetWidth;
					e.canvas.height = e.canvas.parentNode.offsetHeight;
				}
				e.canvas.height = e.canvas.height;
				var args;
				var task;
				for (var i = 0; i < this.updates.length; i++) {
					task = this.updates[i];
					args = Array.from(task.inits);
					args.push(e);
					e.save();
					if (task.update.apply(task, args)) {
						this.updates.remove(task);
						i--;
					}
					e.restore();
				}
				if (this.updates.length == 0) {
					this.frameId = undefined;
					this.frameTime = undefined;
					return;
				}
				this.frameId = requestAnimationFrame(this.update.bind(this));
			},
		},
		ResizeSensor: (function () {
			function ResizeSensor(element) {
				this.element = element;
				this.width = element.clientWidth || 1;
				this.height = element.clientHeight || 1;
				this.maximumWidth = 10000 * this.width;
				this.maximumHeight = 10000 * this.height;
				this.events = [];
				var expand = document.createElement("div");
				expand.style.cssText = "position:absolute;top:0;bottom:0;left:0;right:0;z-index=-10000;overflow:hidden;visibility:hidden;transition:all 0s;";
				var shrink = expand.cloneNode(false);
				var expandChild = document.createElement("div");
				expandChild.style.cssText = "transition: all 0s !important; animation: none !important;";
				var shrinkChild = expandChild.cloneNode(false);
				expandChild.style.width = this.maximumWidth + "px";
				expandChild.style.height = this.maximumHeight + "px";
				shrinkChild.style.width = "250%";
				shrinkChild.style.height = "250%";
				expand.appendChild(expandChild);
				shrink.appendChild(shrinkChild);
				element.appendChild(expand);
				element.appendChild(shrink);
				if (expand.offsetParent != element) {
					element.style.position = "relative";
				}
				expand.scrollTop = shrink.scrollTop = this.maximumHeight;
				expand.scrollLeft = shrink.scrollLeft = this.maximumWidth;
				var sensor = this;
				sensor.onscroll = function (e) {
					sensor.w = sensor.element.clientWidth || 1;
					sensor.h = sensor.element.clientHeight || 1;
					if (sensor.w != sensor.width || sensor.h != sensor.height) {
						sensor.width = sensor.w;
						sensor.height = sensor.h;
						sensor.dispatchEvent();
					}
					expand.scrollTop = shrink.scrollTop = sensor.maximumHeight;
					expand.scrollLeft = shrink.scrollLeft = sensor.maximumWidth;
				};
				expand.addEventListener("scroll", sensor.onscroll);
				shrink.addEventListener("scroll", sensor.onscroll);
				sensor.expand = expand;
				sensor.shrink = shrink;
			}
			ResizeSensor.prototype.addListener = function (callback, capture) {
				if (this.events == undefined) this.events = [];
				this.events.push({
					callback: callback,
					capture: capture,
				});
			};
			ResizeSensor.prototype.dispatchEvent = function () {
				var capture = true;
				var evt;
				for (var i = 0; i < this.events.length; i++) {
					evt = this.events[i];
					if (evt.capture) {
						evt.callback();
					} else {
						capture = false;
					}
				}
				if (!capture) {
					requestAnimationFrame(this.dispatchFrameEvent.bind(this));
				}
			};
			ResizeSensor.prototype.dispatchFrameEvent = function () {
				var evt;
				for (var i = 0; i < this.events.length; i++) {
					evt = this.events[i];
					if (!evt.capture) evt.callback();
				}
			};
			ResizeSensor.prototype.close = function () {
				this.expand.removeEventListener("scroll", this.onscroll);
				this.shrink.removeEventListener("scroll", this.onscroll);
				if (!this.element) {
					this.element.removeChild(this.expand);
					this.element.removeChild(this.shrink);
				}
				this.events = null;
			};
			return ResizeSensor;
		})(),
		sheet: {
			init() {
				if (!this.sheetList) {
					this.sheetList = [];
					for (var i = 0; i < document.styleSheets.length; i++) {
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
				var sheetList = this.sheetList;
				var sheet;
				var shouldBreak = false;
				for (var j = sheetList.length - 1; j >= 0; j--) {
					if (typeof cssName == "string") {
						cssName = cssName.replace(/.css/, "") + ".css";
						for (var k = j; k >= 0; k--) {
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
						for (var i = 0; i < sheet.cssRules.length; i++) {
							if (!(sheet.cssRules[i] instanceof CSSMediaRule)) {
								if (sheet.cssRules[i].selectorText == selector) {
									this.cachedSheet[selector] = sheet.cssRules[i].style;
									return sheet.cssRules[i].style;
								}
							} else {
								var rules = sheet.cssRules[i].cssRules;
								for (var j = 0; j < rules.length; j++) {
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
				var sheet;
				if (typeof cssName == "string") {
					for (var j = sheetList.length - 1; j >= 0; j--) {
						cssName = cssName.replace(/.css/, "") + ".css";
						if (sheetList[j].href.indexOf(cssName) != -1) {
							sheet = sheetList[k];
						}
					}
					if (!sheet) throw "cssName not found";
				}
				if (!sheet) sheet = this.sheetList[this.sheetList.length - 1];
				var inserted = 0;
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
				var handNode = ui.handcards1;
				if (!handNode) return console.error("hand undefined");
				var card;
				var cards = [];
				var childs = handNode.childNodes;
				for (var i = 0; i < childs.length; i++) {
					card = childs[i];
					if (!card.classList.contains("removing")) {
						cards.push(card);
					} else {
						card.scaled = false;
					}
				}
				if (!cards.length) return;
				var bounds = dui.boundsCaches.hand;
				bounds.check();
				var pw = bounds.width;
				var ph = bounds.height;
				var cw = bounds.cardWidth;
				var ch = bounds.cardHeight;
				var cs = bounds.cardScale;
				var csw = cw * cs;
				var x;
				var y = Math.round((ch * cs - ch) / 2);
				var xMargin = csw + 2;
				var xStart = (csw - cw) / 2;
				var totalW = cards.length * csw + (cards.length - 1) * 2;
				var limitW = pw;
				var expand;
				if (totalW > limitW) {
					xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
					if (lib.config.fold_card) {
						var foldCardMinWidth = lib.config.extension_十周年UI_foldCardMinWidth;
						var min = cs;
						if (foldCardMinWidth == "cardWidth") {
							min *= cw;
						} else {
							min *= foldCardMinWidth && foldCardMinWidth.length ? parseInt(foldCardMinWidth) : 81;
						}
						if (xMargin < min) {
							expand = true;
							xMargin = min;
						}
					}
				} else {
					/*-----------------分割线-----------------*/
					// 手牌折叠方式
					if (get.is && typeof get.is.phoneLayout === "function" && lib.config.phonelayout) {
						xStart += 0; // 触屏模式靠左
					} else if (lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff") {
						xStart = (ui.arena.offsetWidth - totalW) / 2 - bounds.x;
					}
				}
				var card;
				for (var i = 0; i < cards.length; i++) {
					x = Math.round(xStart + i * xMargin);
					card = cards[i];
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
				for (var i = ui.thrown.length - 1; i >= 0; i--) {
					if (ui.thrown[i].classList.contains("drawingcard") || ui.thrown[i].classList.contains("removing") || ui.thrown[i].parentNode != ui.arena || ui.thrown[i].fixed) {
						ui.thrown.splice(i, 1);
					} else {
						ui.thrown[i].classList.remove("removing");
					}
				}
				if (!ui.thrown.length) return;
				var cards = ui.thrown;
				var bounds = dui.boundsCaches.arena;
				bounds.check();
				var pw = bounds.width;
				var ph = bounds.height;
				var cw = bounds.cardWidth;
				var ch = bounds.cardHeight;
				var discardScale = (lib && lib.config && lib.config.extension_十周年UI_discardScale) || 0.14;
				var bodySize = decadeUI.get.bodySize();
				var base = discardScale;
				var cs = Math.min((bodySize.height * base) / ch, 1);
				var csw = cw * cs;
				var x;
				var y = Math.round((ph - ch) / 2);
				var xMargin = csw + 2;
				var xStart = (csw - cw) / 2;
				var totalW = cards.length * csw + (cards.length - 1) * 2;
				var limitW = pw;
				if (totalW > limitW) {
					xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
				} else {
					xStart += (limitW - totalW) / 2;
				}
				var card;
				for (var i = 0; i < cards.length; i++) {
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
				var timestamp = config.defaultDelay;
				var nowTime = new Date().getTime();
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
				this[config.timeoutKey] = setTimeout(function () {
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
				var set = decadeUI.dataset;
				set.animSizeUpdated = false;
				set.bodySize.updated = false;
				var caches = decadeUI.boundsCaches;
				for (var key in caches) caches[key].updated = false;
				var buttonsWindow = decadeUI.sheet.getStyle("#window > .dialog.popped .buttons:not(.smallzoom)");
				if (!buttonsWindow) {
					buttonsWindow = decadeUI.sheet.insertRule("#window > .dialog.popped .buttons:not(.smallzoom) { zoom: 1; }");
				}
				var buttonsArena = decadeUI.sheet.getStyle("#arena:not(.choose-character) .buttons:not(.smallzoom)");
				if (!buttonsArena) {
					buttonsArena = decadeUI.sheet.insertRule("#arena:not(.choose-character) .buttons:not(.smallzoom) { zoom: 1; }");
				}
				decadeUI.zooms.card = decadeUI.getCardBestScale();
				if (ui.me) {
					var height = Math.round(decadeUI.getHandCardSize().height * decadeUI.zooms.card + 30.4) + "px";
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
				var hand = ui.handcards1Container;
				if (hand.scrollNum == void 0) hand.scrollNum = 0;
				if (hand.lastFrameTime == void 0) hand.lastFrameTime = performance.now();
				function handScroll() {
					var now = performance.now();
					var delta = now - hand.lastFrameTime;
					var num = Math.round((delta / 16) * 16);
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
		isMobile() {
			return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|OperaMini/i.test(navigator.userAgent);
		},
		delay(milliseconds) {
			if (typeof milliseconds != "number") throw "milliseconds is not number";
			if (_status.paused) return;
			game.pause();
			_status.timeout = setTimeout(game.resume, milliseconds);
		},
		queueNextTick(callback, ctx) {
			if (!dui._tickEntries) dui._tickEntries = [];
			dui._tickEntries.push({
				ctx: ctx,
				callback: callback,
			});
			if (dui._queueTick) return;
			dui._queueTick = Promise.resolve().then(function () {
				dui._queueTick = null;
				var entries = dui._tickEntries;
				dui._tickEntries = [];
				for (var i = 0; i < entries.length; i++) entries[i].callback.call(entries[i].ctx);
			});
		},
		queueNextFrameTick(callback, ctx) {
			if (!dui._frameTickEntries) dui._frameTickEntries = [];
			dui._frameTickEntries.push({
				ctx: ctx,
				callback: callback,
			});
			if (dui._queueFrameTick) return;
			dui._queueFrameTick = requestAnimationFrame(function () {
				dui._queueFrameTick = null;
				setTimeout(
					function (entries) {
						for (var i = 0; i < entries.length; i++) entries[i].callback.call(entries[i].ctx);
					},
					0,
					dui._frameTickEntries
				);
				dui._frameTickEntries = [];
			});
		},
		layoutHand() {
			dui.layout.updateHand();
		},
		layoutHandDraws(cards) {
			var bounds = dui.boundsCaches.hand;
			bounds.check();
			var x, y;
			var pw = bounds.width;
			var ph = bounds.height;
			var cw = bounds.cardWidth;
			var ch = bounds.cardHeight;
			var cs = bounds.cardScale;
			var csw = cw * cs;
			var xStart, xMargin;
			var draws = [];
			var card;
			var clone;
			var source = cards.duiMod;
			if (source && source != game.me) {
				source.checkBoundsCache();
				xMargin = 27;
				xStart = source.cacheLeft - bounds.x - csw / 2 - (cw - csw) / 2;
				var totalW = xMargin * cards.length + (csw - xMargin);
				var limitW = source.cacheWidth + csw;
				if (totalW > limitW) {
					xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
				} else {
					xStart += (limitW - totalW) / 2;
				}
				y = Math.round(source.cacheTop - bounds.y - 30 + (source.cacheHeight - ch) / 2);
				for (var i = 0; i < cards.length; i++) {
					x = Math.round(xStart + i * xMargin);
					card = cards[i];
					card.tx = x;
					card.ty = y;
					card.fixed = true;
					card.scaled = true;
					card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
				}
				return;
			} else {
				for (var i = 0; i < cards.length; i++) {
					card = cards[i];
					clone = card.clone;
					if (clone && !clone.fixed && clone.parentNode == ui.arena) {
						x = Math.round(clone.tx - bounds.x);
						y = Math.round(clone.ty - (bounds.y + 30));
						card.tx = x;
						card.ty = y;
						card.scaled = true;
						card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
					} else {
						draws.push(card);
					}
				}
			}
			y = Math.round(-ch * cs * 2);
			xMargin = csw * 0.5;
			xStart = (pw - xMargin * (draws.length + 1)) / 2 - (cw - csw) / 2;
			for (var i = 0; i < draws.length; i++) {
				x = Math.round(xStart + i * xMargin);
				card = draws[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transition = "transform 400ms ease-out";
				card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
			}
		},
		layoutDrawCards(cards, player, center) {
			var bounds = dui.boundsCaches.arena;
			if (!bounds.updated) bounds.update();
			player.checkBoundsCache();
			var playerX = player.cacheLeft;
			var playerY = player.cacheTop;
			var playerW = player.cacheWidth;
			var playerH = player.cacheHeight;
			var pw = bounds.width;
			var ph = bounds.height;
			var cw = bounds.cardWidth;
			var ch = bounds.cardHeight;
			var cs = bounds.cardScale;
			var csw = cw * cs;
			var xMargin = 27;
			var xStart = (center ? (pw - playerW) / 2 : playerX) - csw / 2 - (cw - csw) / 2;
			var totalW = xMargin * cards.length + (csw - xMargin);
			var limitW = playerW + csw;
			if (totalW > limitW) {
				xMargin = csw - Math.abs(limitW - csw * cards.length) / (cards.length - 1);
			} else {
				xStart += (limitW - totalW) / 2;
			}
			var x;
			var y;
			if (center) y = Math.round((ph - ch) / 2);
			else y = Math.round(playerY + (playerH - ch) / 2);
			var card;
			for (var i = 0; i < cards.length; i++) {
				x = Math.round(xStart + i * xMargin);
				card = cards[i];
				card.tx = x;
				card.ty = y;
				card.scaled = true;
				card.style.transform = "translate(" + x + "px," + y + "px) scale(" + cs + ")";
			}
		},
		layoutDiscard() {
			dui.layout.updateDiscard();
		},
		delayRemoveCards(cards, delay, delay2) {
			if (!Array.isArray(cards)) cards = [cards];
			setTimeout(
				function (cards, delay2) {
					var remove = function (cards) {
						for (var i = 0; i < cards.length; i++) cards[i].remove();
					};
					if (delay2 == null) {
						remove(cards);
						return;
					}
					for (var i = 0; i < cards.length; i++) {
						cards[i].classList.add("removing");
					}
					setTimeout(remove, delay2, cards);
				},
				delay,
				cards,
				delay2
			);
		},
		//虚拟卡牌花色点数显示
		cardTempSuitNum(card, cardsuit, cardnumber) {
			var remain = false;
			if (card._tempSuitNum) remain = true;
			let snnode = card._tempSuitNum || ui.create.div(".tempsuitnum", card);
			card._tempSuitNum = snnode;
			if (!remain) {
				snnode.$num = decadeUI.element.create("num", snnode, "span");
				snnode.$num.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
				snnode.$br = decadeUI.element.create(null, snnode, "br");
				snnode.$suit = decadeUI.element.create("suit", snnode, "span");
				snnode.$suit.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
			}
			if (cardnumber) snnode.$num.innerHTML = get.strNumber(cardnumber);
			else snnode.$num.innerHTML = "▣";
			if (cardsuit) snnode.$suit.innerHTML = get.translation(cardsuit);
			else snnode.$suit.innerHTML = "◈";
			card.dataset.tempsn = cardsuit;
		},
		tryAddPlayerCardUseTag(card, player, event) {
			if (!card || !player || !event) return;
			var tagNode = card.querySelector(".used-info");
			if (tagNode == null) tagNode = card.appendChild(dui.element.create("used-info"));
			card.$usedtag = tagNode;
			if (event.blameEvent) event = event.blameEvent;
			let tagText;
			switch (event.name) {
				case "judge":
					tagText = event.judgestr + "的判定牌";
					event.addMessageHook("judgeResult", function () {
						var event = this;
						var card = event.result.card.clone;
						var apcard = event.apcard;
						var tagText = "";
						var tagNode = card.querySelector(".used-info");
						if (tagNode == null) tagNode = card.appendChild(dui.element.create("used-info"));
						if (event.result.suit != get.suit(card) || event.result.number != get.number(card)) {
							dui.cardTempSuitNum(card, event.result.suit, event.result.number);
						}
						var action;
						var judgeValue;
						var getEffect = event.judge2;
						if (getEffect) {
							judgeValue = getEffect(event.result);
						} else {
							judgeValue = decadeUI.get.judgeEffect(event.judgestr, event.result.judge);
						}
						if (typeof judgeValue == "boolean") {
							judgeValue = judgeValue ? 1 : -1;
						} else {
							judgeValue = event.result.judge;
						}
						if (judgeValue >= 0) {
							action = "play4";
							tagText = "判定生效";
						} else {
							action = "play5";
							tagText = "判定失效";
						}
						if (apcard && apcard._ap) apcard._ap.stopSpineAll();
						if (apcard && apcard._ap && apcard == card) {
							apcard._ap.playSpine({
								name: "effect_panding",
								action: action,
							});
						} else {
							decadeUI.animation.cap.playSpineTo(card, {
								name: "effect_panding",
								action: action,
							});
						}
						event.apcard = undefined;
						tagNode.innerHTML = get.translation(event.judgestr) + tagText;
					});
					decadeUI.animation.cap.playSpineTo(card, {
						name: "effect_panding",
						action: "play",
						loop: true,
					});
					event.apcard = card;
					break;
				default:
					let evt = _status.event;
					_status.event = event;
					tagText = get.cardsetion(player);
					_status.event = evt;
					if (["useCard", "respond"].includes(event.name)) {
						const cardname = event.card.name,
							cardnature = get.nature(event.card);
						if (lib.config.cardtempname != "off" && (card.name != cardname || !get.is.sameNature(cardnature, card.nature, true))) {
							if (lib.config.extension_十周年UI_showTemp) {
								if (!card._tempName) card._tempName = ui.create.div(".temp-name", card);
								var tempname = "";
								var tempname2 = get.translation(cardname);
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
								var node = ui.create.cardTempName(event.card, card);
								var cardtempnameConfig = lib.config.cardtempname;
								if (cardtempnameConfig !== "default") node.classList.remove("vertical");
							}
						}
						const cardnumber = get.number(event.card),
							cardsuit = get.suit(event.card);
						if (card.dataset.views != 1 && event.card.cards && event.card.cards.length == 1 && (card.number != cardnumber || card.suit != cardsuit)) {
							dui.cardTempSuitNum(card, cardsuit, cardnumber);
						}
						if (event.card && (!event.card.cards || !event.card.cards.length || event.card.cards.length == 1)) {
							var name = event.card.name,
								nature = event.card.nature;
							switch (name) {
								case "effect_caochuanjiejian":
									decadeUI.animation.cap.playSpineTo(card, "effect_caochuanjiejian");
									break;
								case "sha":
									switch (nature) {
										case "thunder":
											decadeUI.animation.cap.playSpineTo(card, "effect_leisha");
											break;
										case "fire":
											decadeUI.animation.cap.playSpineTo(card, "effect_huosha");
											break;
										default:
											if (get.color(card) == "red") {
												decadeUI.animation.cap.playSpineTo(card, "effect_hongsha");
											} else {
												decadeUI.animation.cap.playSpineTo(card, "effect_heisha");
											}
											break;
									}
									break;
								case "shan":
									decadeUI.animation.cap.playSpineTo(card, "effect_shan");
									break;
								case "tao":
									decadeUI.animation.cap.playSpineTo(card, "effect_tao", {
										scale: 0.9,
									});
									break;
								case "tiesuo":
									decadeUI.animation.cap.playSpineTo(card, "effect_tiesuolianhuan", {
										scale: 0.9,
									});
									break;
								case "jiu":
									decadeUI.animation.cap.playSpineTo(card, "effect_jiu", {
										y: [-30, 0.5],
									});
									break;
								case "kaihua":
									decadeUI.animation.cap.playSpineTo(card, "effect_shushangkaihua");
									break;
								case "wuzhong":
									decadeUI.animation.cap.playSpineTo(card, "effect_wuzhongshengyou");
									break;
								case "wuxie":
									decadeUI.animation.cap.playSpineTo(card, "effect_wuxiekeji", {
										y: [10, 0.5],
										scale: 0.9,
									});
									break;
								case "juedou":
									decadeUI.animation.cap.playSpineTo(card, "SF_eff_jiangling_juedou", {
										x: [10, 0.4],
										scale: 1,
									});
									break;
								case "nanman":
									decadeUI.animation.cap.playSpineTo(card, "effect_nanmanruqin", {
										scale: 0.45,
									});
									break;
								case "wanjian":
									decadeUI.animation.cap.playSpineTo(card, "effect_wanjianqifa", {
										scale: 0.78,
									});
									break;
								case "wugu":
									decadeUI.animation.cap.playSpineTo(card, "effect_wugufengdeng", {
										y: [10, 0.5],
									});
									break;
								case "taoyuan":
									decadeUI.animation.cap.playSpineTo(card, "SF_kapai_eff_taoyuanjieyi", {
										y: [10, 0.5],
									});
									break;
								case "shunshou":
									decadeUI.animation.cap.playSpineTo(card, "effect_shunshouqianyang");
									break;
								case "huogong":
									decadeUI.animation.cap.playSpineTo(card, "effect_huogong", {
										x: [8, 0.5],
										scale: 0.5,
									});
									break;
								case "guohe":
									decadeUI.animation.cap.playSpineTo(card, "effect_guohechaiqiao", {
										y: [10, 0.5],
									});
									break;
								case "yuanjiao":
									decadeUI.animation.cap.playSpineTo(card, "effect_yuanjiaojingong");
									break;
								case "zhibi":
									decadeUI.animation.cap.playSpineTo(card, "effect_zhijizhibi");
									break;
								case "zhulu_card":
									decadeUI.animation.cap.playSpineTo(card, "effect_zhulutianxia");
									break;
							}
						}
					}
					break;
			}
			tagNode.innerHTML = tagText;
		},
		getRandom(min, max) {
			if (min == null) {
				min = -2147483648;
			}
			if (max == null) {
				max = 2147483648;
			}
			if (min > max) {
				min = min + max;
				max = min - max;
				min = min - max;
			}
			var diff = 0;
			if (min < 0) {
				diff = min;
				min = 0;
				max -= diff;
			}
			return Math.floor(Math.random() * (max + 1 - min)) + min + diff;
		},
		getCardBestScale(size) {
			if (!(size && size.height)) size = decadeUI.getHandCardSize();
			var bodySize = decadeUI.get.bodySize();
			// 读取用户配置的缩放基准，默认0.18；移动端和桌面端都使用配置的数值
			var cfg = (lib && lib.config && lib.config.extension_十周年UI_cardScale) || 0.18;
			var base = cfg;
			return Math.min((bodySize.height * base) / size.height, 1);
		},
		getHandCardSize(canUseDefault) {
			var style = decadeUI.sheet.getStyle(".media_defined > .card");
			if (style == null) style = decadeUI.sheet.getStyle(".hand-cards > .handcards > .card");
			if (style == null)
				return canUseDefault
					? {
						width: 108,
						height: 150,
					}
					: {
						width: 0,
						height: 0,
					};
			var size = {
				width: parseFloat(style.width),
				height: parseFloat(style.height),
			};
			return size;
		},
		getMapElementPos(elementFrom, elementTo) {
			if (!(elementFrom instanceof HTMLElement) || !(elementTo instanceof HTMLElement)) return console.error("arguments");
			var rectFrom = elementFrom.getBoundingClientRect();
			var rectTo = elementTo.getBoundingClientRect();
			var pos = {
				x: rectFrom.left - rectTo.left,
				y: rectFrom.top - rectTo.top,
			};
			pos.left = pos.x;
			pos.top = pos.y;
			return pos;
		},
		getPlayerIdentity(player, identity, chinese, isMark) {
			if (!(player instanceof HTMLElement && get.itemtype(player) == "player")) throw "player";
			if (!identity) identity = player.identity;
			var mode = get.mode();
			var translated = false;
			if (!chinese) {
				switch (mode) {
					case "identity":
						if (!player.isAlive() || player.identityShown || player == game.me) {
							identity = ((player.special_identity ? player.special_identity : identity) || "").replace(/identity_/, "");
						}
						break;
					case "guozhan":
						if (identity == "unknown") {
							identity = player.wontYe() ? lib.character[player.name1][1] : "ye";
						}
						if (get.is.jun(player)) identity += "jun";
						break;
					case "versus":
						if (!game.me) break;
						switch (_status.mode) {
							case "standard":
								switch (identity) {
									case "trueZhu":
										return "shuai";
									case "trueZhong":
										return "bing";
									case "falseZhu":
										return "jiang";
									case "falseZhong":
										return "zu";
								}
								break;
							case "three":
							case "four":
							case "guandu":
								if (get.translation(player.side + "Color") == "wei") identity += "_blue";
								break;
							case "two":
								var side = player.finalSide ? player.finalSide : player.side;
								identity = game.me.side == side ? "friend" : "enemy";
								break;
						}
						break;
					case "doudizhu":
						identity = identity == "zhu" ? "dizhu" : "nongmin";
						break;
					case "boss":
						switch (identity) {
							case "zhu":
								identity = "boss";
								break;
							case "zhong":
								identity = "cong";
								break;
							case "cai":
								identity = "meng";
								break;
						}
						break;
				}
			} else {
				switch (mode) {
					case "identity":
						if ((identity || "").indexOf("cai") < 0) {
							if (isMark) {
								if (player.special_identity) identity = player.special_identity + "_bg";
							} else {
								identity = player.special_identity ? player.special_identity : identity + "2";
							}
						}
						break;
					case "guozhan":
						if (identity == "unknown") {
							identity = player.wontYe() ? player.trueIdentity || lib.character[player.name1][1] : "ye";
						}
						if (get.is.jun(player)) {
							identity = isMark ? "君" : get.translation(identity) + "君";
						} else {
							identity = identity == "ye" ? "野心家" : identity == "qun" ? "群雄" : get.translation(identity) + "将";
						}
						translated = true;
						break;
					case "versus":
						translated = true;
						if (!game.me) break;
						switch (_status.mode) {
							case "three":
							case "standard":
							case "four":
							case "guandu":
								switch (identity) {
									case "zhu":
										identity = "主公";
										break;
									case "zhong":
										identity = "忠臣";
										break;
									case "fan":
										identity = "反贼";
										break;
									default:
										translated = false;
										break;
								}
								break;
							case "two":
								var side = player.finalSide ? player.finalSide : player.side;
								identity = game.me.side == side ? "友方" : "敌方";
								break;
							case "siguo":
							case "jiange":
								identity = get.translation(identity) + "将";
								break;
							default:
								translated = false;
								break;
						}
						break;
					case "doudizhu":
						identity += "2";
						break;
					case "boss":
						translated = true;
						switch (identity) {
							case "zhu":
								identity = "BOSS";
								break;
							case "zhong":
								identity = "仆从";
								break;
							case "cai":
								identity = "盟军";
								break;
							default:
								translated = false;
								break;
						}
						break;
				}
				if (!translated) identity = get.translation(identity);
				if (isMark) identity = identity[0];
			}
			return identity;
		},
		create: {
			skillDialog() {
				var dialog = document.createElement("div");
				dialog.className = "skill-dialog";
				var extend = {
					caption: undefined,
					tip: undefined,
					open(customParent) {
						if (!customParent) {
							var size = decadeUI.get.bodySize();
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
						var func = function (e) {
							if (e.animationName != "close-dialog") return;
							this.remove();
							this.removeEventListener("animationend", func);
						};
						var animation = "close-dialog";
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
						var control = document.createElement("div");
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
				var dialog = decadeUI.create.skillDialog();
				dialog.classList.add("compare");
				dialog.$content.classList.add("buttons");
				var extend = {
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
				decadeUI.element.create("image", dialog.$player),
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
					});
				if (player) dialog.player = player;
				if (target) dialog.target = target;
				return dialog;
			},
		},
		get: {
			judgeEffect(name, value) {
				switch (name) {
					case "caomu":
					case "草木皆兵":
					case "fulei":
					case "浮雷":
					case "shandian":
					case "闪电":
					case "bingliang":
					case "兵粮寸断":
					case "lebu":
					case "乐不思蜀":
						return value < 0 ? true : false;
				}
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
				var keys = Object.keys(source);
				var i = keys.length;
				while (i--) {
					target[keys[i]] = source[keys[i]];
				}
				return target;
			},
			bodySize() {
				var size = decadeUI.dataset.bodySize;
				if (!size.updated) {
					var body = document.body;
					size.updated = true;
					size.height = body.clientHeight;
					size.width = body.clientWidth;
				}
				return size;
			},
			bestValueCards(cards, player) {
				if (!player) player = _status.event.player;
				var matchs = [];
				var basics = [];
				var equips = [];
				var hasEquipSkill = player.hasSkill("xiaoji");
				cards.sort(function (a, b) {
					return get.value(b, player) - get.value(a, player);
				});
				for (var i = 0; i >= 0 && i < cards.length; i++) {
					var limited = false;
					switch (get.type(cards[i])) {
						case "basic":
							for (var j = 0; j < basics.length; j++) {
								if (!cards[i].toself && basics[j].name == cards[i].name) {
									limited = true;
									break;
								}
							}
							if (!limited) basics.push(cards[i]);
							break;
						case "equip":
							if (hasEquipSkill) break;
							for (var j = 0; j < equips.length; j++) {
								if (get.subtype(equips[j]) == get.subtype(cards[i])) {
									limited = true;
									break;
								}
							}
							if (!limited) equips.push(cards[i]);
							break;
					}
					if (!limited) {
						matchs.push(cards[i]);
						cards.splice(i--, 1);
					}
				}
				cards.sort(function (a, b) {
					return get.value(b, player) - get.value(a, player);
				});
				cards = matchs.concat(cards);
				return cards;
			},
			cheatJudgeCards(cards, judges, friendly) {
				if (!cards || !judges) throw arguments;
				var cheats = [];
				var judgeCost;
				for (var i = 0; i < judges.length; i++) {
					var judge = get.judge(judges[i]);
					cards.sort(function (a, b) {
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
				var left = element.offsetLeft;
				var current = element.offsetParent;
				while (current != null) {
					left += current.offsetLeft;
					current = current.offsetParent;
				}
				return left;
			},
			elementTopFromWindow(element) {
				var top = element.offsetTop;
				var current = element.offsetParent;
				while (current != null) {
					top += current.offsetTop;
					current = current.offsetParent;
				}
				return top;
			},
			handcardInitPos() {
				var hand = dui.boundsCaches.hand;
				if (!hand.updated) hand.update();
				var cardW = hand.cardWidth;
				var cardH = hand.cardHeight;
				var scale = hand.cardScale;
				var x = -Math.round((cardW - cardW * scale) / 2);
				var y = (cardH * scale - cardH) / 2;
				return {
					x: x,
					y: y,
					scale: scale,
				};
			},
		},
		set: (function (set) {
			set.activeElement = function (element) {
				var deactive = dui.$activeElement;
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
				var readFiles = function (files, entry) {
					var index, cardname, filename;
					var cards = dui.statics.cards;
					var format = duicfg.cardPrettify;
					var prefix = decadeUIPath + "image/card/";
					cards.READ_OK = true;
					if (typeof format != "string") format = "webp";
					if (format === "off") return;
					format = "." + format.toLowerCase();
					for (var i = 0; i < files.length; i++) {
						filename = entry ? files[i].name : files[i];
						index = filename.lastIndexOf(format);
						if (index == -1) continue;
						cardname = filename.substring(0, index);
						cards[cardname] = {
							url: prefix + filename,
							name: cardname,
							loaded: true,
						};
					}
				};
				if (window.fs) {
					fs.readdir(__dirname + "/" + decadeUIPath + "image/card/", function (err, files) {
						if (err) return;
						readFiles(files);
					});
				} else if (window.resolveLocalFileSystemURL) {
					resolveLocalFileSystemURL(decadeUIResolvePath + "image/card/", function (entry) {
						var reader = entry.createReader();
						reader.readEntries(function (entries) {
							readFiles(entries, true);
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
	};
	dui.showHandTip = function (text) {
		var tip;
		var tips = this.statics.handTips;
		for (var i = 0; i < tips.length; i++) {
			if (tip == undefined && tips[i].closed) {
				tip = tips[i];
				tip.closed = false;
			} else {
				tips[i].hide();
			}
		}
		if (tip == undefined) {
			tip = dui.element.create("hand-tip", ui.arena);
			tips.unshift(tip);
			tip.clear = function () {
				var nodes = this.childNodes;
				for (var i = 0; i < nodes.length; i++) nodes[i].textContent = "";
				this.dataset.text = "";
			};
			tip.setText = function (text, type) {
				this.clear();
				this.appendText(text, type);
			};
			tip.setInfomation = function (text) {
				if (this.$info == null) this.$info = dui.element.create("hand-tip-info", ui.arena);
				this.$info.innerHTML = text;
			};
			tip.appendText = function (text, type) {
				if (text == undefined || text === "") return;
				if (type == undefined) type = "";
				var nodes = this.childNodes;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].textContent == "") {
						nodes[i].textContent = text;
						nodes[i].dataset.type = type;
						return nodes[i];
					}
				}
				var span = document.createElement("span");
				span.textContent = text;
				span.dataset.type = type;
				return this.appendChild(span);
			};
			tip.strokeText = function () {
				this.dataset.text = this.innerText;
			};
			tip.show = function () {
				this.classList.remove("hidden");
				if (this.$info && this.$info.innerHTML) this.$info.show();
			};
			tip.hide = function () {
				this.classList.add("hidden");
				if (this.$info) this.$info.hide();
			};
			tip.close = function () {
				this.closed = true;
				this.hide();
				if (tip.$info) tip.$info.innerHTML = "";
				var tips = dui.statics.handTips;
				for (var i = 0; i < tips.length; i++) {
					if (tips[i].closed) continue;
					tips[i].show();
					return;
				}
			};
			tip.isEmpty = function () {
				var nodes = this.childNodes;
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].textContent != "") return false;
				}
				return true;
			};
		}
		tip.setText(text);
		tip.show();
		return tip;
	};
	decadeUI.BoundsCache = (function () {
		function BoundsCache(element, updateBefore) {
			this.element = element;
			this.updateBefore = updateBefore;
			this.updated = false;
			Object.defineProperties(this, {
				x: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._x;
					},
					set(value) {
						this._x == value;
					},
				},
				y: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._y;
					},
					set(value) {
						this._y == value;
					},
				},
				width: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._width;
					},
					set(value) {
						this._width == value;
					},
				},
				height: {
					configurable: true,
					get() {
						if (!this.updated) this.update();
						return this._height;
					},
					set(value) {
						this._height == value;
					},
				},
			});
		}
		BoundsCache.prototype.check = function () {
			if (!this.updated) this.update();
		};
		BoundsCache.prototype.update = function () {
			if (this.updateBefore) this.updateBefore();
			var element = this.element;
			this.updated = true;
			if (element == undefined) return;
			this._x = element.offsetLeft;
			this._y = element.offsetTop;
			this._width = element.offsetWidth;
			this._height = element.offsetHeight;
		};
		return BoundsCache;
	})();
	decadeUI.boundsCaches = (function (boundsCaches) {
		boundsCaches.window = new decadeUI.BoundsCache(null, function () {
			this.element = ui.window;
		});
		boundsCaches.arena = new decadeUI.BoundsCache(null, function () {
			this.element = ui.arena;
			if (ui.arena == null) return;
			this.cardScale = dui.getCardBestScale();
			if (this.cardWidth != null) return;
			var childs = ui.arena.childNodes;
			for (var i = 0; i < childs.length; i++) {
				if (childs[i].classList.contains("card")) {
					this.cardWidth = childs[i].offsetWidth;
					this.cardHeight = childs[i].offsetHeight;
					return;
				}
			}
			var card = dui.element.create("card");
			card.style.opacity = 0;
			ui.arena.appendChild(card);
			this.cardWidth = card.offsetWidth;
			this.cardHeight = card.offsetHeight;
			card.remove();
		});
		boundsCaches.hand = new decadeUI.BoundsCache(null, function () {
			this.element = ui.me;
			if (ui.handcards1 == null) return;
			this.cardScale = dui.getCardBestScale();
			if (this.cardWidth != null) return;
			var childs = ui.handcards1.childNodes;
			for (var i = 0; i < childs.length; i++) {
				if (childs[i].classList.contains("card")) {
					this.cardWidth = childs[i].offsetWidth;
					this.cardHeight = childs[i].offsetHeight;
					return;
				}
			}
			var card = dui.element.create("card");
			card.style.opacity = 0;
			ui.handcards1.appendChild(card);
			this.cardWidth = card.offsetWidth;
			this.cardHeight = card.offsetHeight;
			card.remove();
		});
		return boundsCaches;
	})({});
	decadeUI.element = {
		base: {
			removeSelf(milliseconds) {
				var remove = this;
				if (milliseconds) {
					milliseconds = typeof milliseconds == "number" ? milliseconds : parseInt(milliseconds);
					setTimeout(function () {
						if (remove.parentNode) remove.parentNode.removeChild(remove);
					}, milliseconds);
					return;
				}
				if (remove.parentNode) remove.parentNode.removeChild(remove);
				return;
			},
		},
		create(className, parentNode, tagName) {
			var tag = tagName == void 0 ? "div" : tagName;
			var element = document.createElement(tag);
			element.view = {};
			for (var key in this.base) {
				element[key] = this.base[key];
			}
			if (className) element.className = className;
			if (parentNode) parentNode.appendChild(element);
			return element;
		},
		clone(element) { },
	};
	decadeUI.game = {
		wait() {
			game.pause();
		},
		resume() {
			if (!game.loopLocked) {
				var ok = false;
				try {
					if (decadeUI.eventDialog && !decadeUI.eventDialog.finished && !decadeUI.eventDialog.finishing) {
						decadeUI.eventDialog.finish();
						decadeUI.eventDialog = undefined;
						ok = true;
					}
				} finally {
					if (!ok) game.resume();
				}
			} else {
				_status.paused = false;
			}
		},
		checkSkillOwnership(skillName, parentSkill) {
			// 特殊标记处理：这些标记是其他玩家给技能的方式实现的，应该显示为other-skill
			const otherPlayerMarks = ["xinzhaofu_effect", "reyanzhu2", "rewangzun2"];
			if (otherPlayerMarks.includes(skillName)) {
				return false;
			}
			// 其他标记走正常流程判断
			const skillTransformRules = [
				{
					name: "xin前缀",
					condition: name => name.startsWith("xin") && name.length > 3,
					transform: name => name.substring(3),
				},
				{
					name: "re前缀",
					condition: name => name.startsWith("re") && name.length > 2,
					transform: name => name.substring(2),
				},
				{
					name: "_mark后缀",
					condition: name => name.endsWith("_mark") && name.length > 5,
					transform: name => name.substring(0, name.length - 5),
				},
			];
			var effectiveSkill = parentSkill && parentSkill !== skillName ? parentSkill : skillName;
			if (this.hasSkill(effectiveSkill, null, null, false)) {
				return true;
			}
			if (this.hasSkill(skillName, null, null, false)) {
				return true;
			}
			var playerSkills = this.getSkills();
			for (var i = 0; i < playerSkills.length; i++) {
				var skill = playerSkills[i];
				if (skill.includes(skillName) || skillName.includes(skill)) {
					return true;
				}
			}
			var possibleSourceSkills = [];
			for (var i = 0; i < skillTransformRules.length; i++) {
				var rule = skillTransformRules[i];
				if (rule.condition(skillName)) {
					possibleSourceSkills.push(rule.transform(skillName));
				}
			}
			for (var i = 0; i < possibleSourceSkills.length; i++) {
				if (this.hasSkill(possibleSourceSkills[i], null, null, false)) {
					return true;
				}
			}

			return false;
		},
	};
	decadeUI.config = config;
	if (decadeUI.config.campIdentityImageMode === undefined) {
		decadeUI.config.campIdentityImageMode = true;
	}
	duicfg.update = function () {
		var menu = lib.extensionMenu["extension_" + decadeUIName];
		for (var key in menu) {
			if (menu[key] && typeof menu[key] == "object") {
				if (typeof menu[key].update == "function") {
					menu[key].update();
				}
			}
		}
	};
	decadeUI.init();
	console.timeEnd(decadeUIName);
	//手杀UI
	// ========== 工具函数统一挂载 ==========
	if (!lib.removeFirstByClass) {
		lib.removeFirstByClass = function (parent, className) {
			var el = parent.getElementsByClassName(className);
			if (el[0]) el[0].parentNode.removeChild(el[0]);
		};
	}
	if (!lib.createTipImg) {
		lib.createTipImg = function (className, src, style) {
			var img = document.createElement("img");
			img.classList.add("tipshow", className);
			img.src = src;
			img.style.cssText = style;
			return img;
		};
	}
	// ========== 思考提示技能模板 ==========
	function createThinkSkill({ card, tipClass, img, style }) {
		return {
			trigger: { player: ["useCardBegin", "respondBegin"] },
			silent: true,
			forced: true,
			charlotte: true,
			filter(event, player) {
				if (!event.card) return false;
				var cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
				return cname == card && _status.currentPhase != player && player != (_status.event.player || game.me) && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
			},
			async content(event, trigger, player) {
				lib.removeFirstByClass(player, "tipskill");
				if (player.getElementsByClassName(tipClass).length <= 0) {
					player.appendChild(lib.createTipImg(tipClass, lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/" + img, style));
				}
			},
		};
	}
	// ========== 清除提示技能模板 ==========
	function createClearSkill({ tipClass }) {
		return {
			trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
			silent: true,
			forced: true,
			charlotte: true,
			filter(event, player) {
				event.respondix = 0;
				for (var i = 0; i < game.players.length; i++) {
					if (game.players[i].getElementsByClassName(tipClass)[0]) event.respondix++;
				}
				return event.respondix > 0;
			},
			async content(event, trigger, player) {
				for (var i = 0; i < game.players.length; i++) {
					lib.removeFirstByClass(game.players[i], tipClass);
				}
			},
		};
	}
	//-------------AI进度条-----------//
	if (get.mode() != "connect") {
		lib.onover.push(function (bool) {
			if (document.getElementById("jindutiaoAI")) {
				document.getElementById("jindutiaoAI").remove();
			}
		});
		lib.skill._jindutiaoAI_operation = {
			trigger: {
				player: ["chooseToUseBegin", "chooseToRespondBegin", "chooseToDiscardBegin", "chooseToTargetBegin", "chooseToButtonBegin", "chooseToMoveBegin", "chooseToGainBegin", "chooseToLoseBegin", "chooseToExchangeBegin"],
			},
			silent: true,
			filter(event, player) {
				return player != game.me;
			},
			forced: true,
			async content(event, trigger, player) {
				lib.removeFirstByClass(player, "timeai");
				lib.removeFirstByClass(player, "timePhase");
				if (window.timerai) {
					clearInterval(window.timerai);
					delete window.timerai;
				}
				game.JindutiaoAIplayer();
				if (_status.currentPhase == player) {
					window.boxContentAI.classList.add("timePhase");
				} else {
					window.boxContentAI.classList.add("timeai");
				}

				player.appendChild(window.boxContentAI);
			},
			group: ["_jindutiaoAI_operation_end"],
			subSkill: {
				end: {
					trigger: {
						player: ["chooseToUseAfter", "chooseToRespondAfter", "chooseToDiscardAfter", "chooseToTargetAfter", "chooseToButtonAfter", "chooseToMoveAfter", "chooseToGainAfter", "chooseToLoseAfter", "chooseToExchangeAfter"],
					},
					forced: true,
					filter(event, player) {
						return player != game.me;
					},
					async content(event, trigger, player) {
						if (window.timerai) {
							clearInterval(window.timerai);
							delete window.timerai;
						}
						lib.removeFirstByClass(player, "timeai");
						lib.removeFirstByClass(player, "timePhase");

						if (document.getElementById("jindutiaoAI")) {
							document.getElementById("jindutiaoAI").remove();
						}
					},
				},
			},
		};
		//-------多目标-------//
		lib.skill._jindutiaoMB = {
			trigger: {
				player: "useCardToPlayered",
			},
			forced: true,
			silent: true,
			priority: -10,
			charlotte: true,
			filter(event, player) {
				return event.card && event.targets && event.targets.length;
			},
			async content(event, trigger, player) {
				var boxContent = document.createElement("div");
				var boxTime = document.createElement("div");
				var imgBg = document.createElement("img");
				boxContent.classList.add("timeai");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					//--------手杀样式-------------//
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *4/145);width: var(--w);height: var(--h);left:3.5px;bottom:-6.2px;";
					boxTime.data = 125;
					boxTime.style.cssText = "z-index:92;--w: 33px;--h: calc(var(--w) * 4/120);width: var(--w);height: var(--h);margin:1px;background-color: #dd9900;position: absolute;top: 0px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/time.png";
					imgBg.style.cssText = "position:absolute;z-index:91;--w: 122px;--h: calc(var(--w) * 4/145);width: var(--w);height: var(--h);top: 0;";
					//-------------------------//
				} else {
					//----------十周年样式--------//
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *8/162);width: var(--w);height: var(--h);left:1.5px;bottom:-8.2px;";
					boxTime.data = 120;
					boxTime.style.cssText = "z-index:91;width: 115px;height: 3.3px;margin:1px;background-color: #f2c84b;position: absolute;top: 0px;border-radius: 3px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/timeX.png";
					imgBg.style.cssText = "position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) * 8/162);width: var(--w);height: var(--h);top: 0;";
					//--------------------//
				}
				boxContent.appendChild(boxTime);
				boxContent.appendChild(imgBg);
				if (trigger.target != (_status.event.player || game.me)) {
					var ab = trigger.target.getElementsByClassName("timeai");
					if (!ab[0]) trigger.target.appendChild(boxContent);
				}
				window.timerix = setInterval(() => {
					boxTime.data--;
					boxTime.style.width = boxTime.data + "px";
					if (boxTime.data == 0) {
						clearInterval(window.timerix);
						delete window.timerix;
						boxContent.remove();
					}
				}, 150); //进度条时间
			},
			group: ["_jindutiaoMB_close"],
			subSkill: {
				//------容错清除 全场-------------//
				close: {
					trigger: {
						global: ["phaseEnd", "useCardAfter", "dieBegin"],
					},
					filter(event, player) {
						event.respondix = 0;
						for (var i = 0; i < game.players.length; i++) {
							var ab = game.players[i].getElementsByClassName("timeai");
							if (ab[0]) event.respondix++;
						}
						return event.respondix > 0;
					},
					forced: true,
					silent: true,
					priority: -1,
					charlotte: true,
					async content(event, trigger, player) {
						for (var i = 0; i < game.players.length; i++) {
							lib.removeFirstByClass(game.players[i], "timeai");
						}
					},
				},
			},
		};
		//---------游戏开场and响应类----------//
		lib.skill._jindutiaoKS = {
			trigger: {
				global: "gameStart",
			},
			silent: true,
			forced: true,
			priority: -1,
			charlotte: true,
			filter(event, player) {
				return true;
			},
			async content(event, trigger, player) {
				var boxContent = document.createElement("div");
				var boxTime = document.createElement("div");
				var imgBg = document.createElement("img");
				boxContent.classList.add("timeai");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					//--------手杀样式-------------//
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *4/145);width: var(--w);height: var(--h);left:3.5px;bottom:-6.2px;";
					boxTime.data = 125;
					boxTime.style.cssText = "z-index:92;--w: 33px;--h: calc(var(--w) * 4/120);width: var(--w);height: var(--h);margin:1px;background-color: #dd9900;position: absolute;top: 0px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/time.png";
					imgBg.style.cssText = "position:absolute;z-index:91;--w: 122px;--h: calc(var(--w) * 4/145);width: var(--w);height: var(--h);top: 0;";
					//-------------------------//
				} else {
					//----------十周年样式--------//
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *8/162);width: var(--w);height: var(--h);left:1.5px;bottom:-8.2px;";
					boxTime.data = 120;
					boxTime.style.cssText = "z-index:91;width: 115px;height: 3.3px;margin:1px;background-color: #f2c84b;position: absolute;top: 0px;border-radius: 3px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/timeX.png";
					imgBg.style.cssText = "position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) * 8/162);width: var(--w);height: var(--h);top: 0;";
					//--------------------//
				}
				boxContent.appendChild(boxTime);
				boxContent.appendChild(imgBg);
				if (player != game.me) player.appendChild(boxContent);
				window.timerx = setInterval(() => {
					boxTime.data--;
					boxTime.style.width = boxTime.data + "px";
					if (boxTime.data == 0) {
						clearInterval(window.timerx);
						delete window.timerx;
						boxContent.remove();
					}
				}, 150); //进度条时间
			},
			group: ["_jindutiaoKS_close"],
			subSkill: {
				close: {
					trigger: {
						global: "phaseBefore",
					},
					filter(event, player) {
						event.respondx = 0;
						for (var i = 0; i < game.players.length; i++) {
							var ab = game.players[i].getElementsByClassName("timeai");
							if (ab[0]) event.respondx++;
						}
						if (game.phaseNumber == 0) return event.respondx > 0;
						return false;
					},
					forced: true,
					silent: true,
					priority: -1,
					charlotte: true,
					async content(event, trigger, player) {
						for (var i = 0; i < game.players.length; i++) {
							lib.removeFirstByClass(game.players[i], "timeai");
						}
					},
				},
			},
		};
		//------------回合外进度条消失------------//
		lib.skill._jindutiao_close = {
			close: {
				silent: true,
				trigger: {
					player: ["phaseEnd", "useCardAfter", "gainEnd", "loseEnd", "damageAfter"],
				},
				filter(event, player) {
					return player != (_status.event.player || game.me) && _status.currentPhase != player;
				},
				forced: true,
				priority: -1,
				charlotte: true,
				async content(event, trigger, player) {
					lib.removeFirstByClass(player, "timeai");
				},
			},
		};
	}
	//玩家进度条
	if (get.mode() != "connect" && config.jindutiao == true) {
		lib.onover.push(function () {
			var bar = document.getElementById("jindutiaopl");
			if (bar) bar.remove();
		});
		lib.skill._jindutiao_operation = {
			trigger: {
				player: ["chooseToUseBegin", "chooseToRespondBegin", "chooseToDiscardBegin", "chooseToTargetBegin", "chooseToButtonBegin", "chooseToMoveBegin", "chooseToGainBegin", "chooseToLoseBegin", "chooseToExchangeBegin"],
			},
			silent: true,
			filter(event, player) {
				return player == game.me;
			},
			forced: true,
			async content(event, trigger, player) {
				var existingBar = document.getElementById("jindutiaopl");
				if (existingBar) {
					existingBar.remove();
				}
				if (window.timer) {
					clearInterval(window.timer);
					delete window.timer;
				}
				if (window.timer2) {
					clearInterval(window.timer2);
					delete window.timer2;
				}
				game.Jindutiaoplayer();
			},
			group: ["_jindutiao_operation_end"],
			subSkill: {
				end: {
					trigger: {
						player: ["chooseToUseAfter", "chooseToRespondAfter", "chooseToDiscardAfter", "chooseToTargetAfter", "chooseToButtonAfter", "chooseToMoveAfter", "chooseToGainAfter", "chooseToLoseAfter", "chooseToExchangeAfter"],
					},
					forced: true,
					filter(event, player) {
						return player == game.me;
					},
					async content(event, trigger, player) {
						if (window.timer) {
							clearInterval(window.timer);
							delete window.timer;
						}
						if (window.timer2) {
							clearInterval(window.timer2);
							delete window.timer2;
						}
						var bar = document.getElementById("jindutiaopl");
						if (bar) bar.remove();
					},
				},
			},
		};
	}
	// ========== 思考提示技能静态注册 ==========
	lib.skill._chupaiE = {
		trigger: { player: ["useCardBegin", "respondBegin"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			if (!event.card) return false;
			var cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
			return cname == "shan" && _status.currentPhase != player && player != (_status.event.player || game.me) && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			if (player.getElementsByClassName("playertipshan").length <= 0) {
				player.appendChild(lib.createTipImg("playertipshan", lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipshan.png", "display:block;position:absolute;z-index:91;--w:133px;--h:calc(var(--w)*50/431);width:var(--w);height:var(--h);bottom:-22px;"));
			}
		},
	};
	lib.skill._chupaiG = {
		trigger: { player: ["useCardBegin", "respondBegin"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			if (!event.card) return false;
			var cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
			return cname == "sha" && _status.currentPhase != player && player != (_status.event.player || game.me) && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			if (player.getElementsByClassName("playertipsha").length <= 0) {
				player.appendChild(lib.createTipImg("playertipsha", lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipsha.png", "display:block;position:absolute;z-index:91;--w:133px;--h:calc(var(--w)*50/431);width:var(--w);height:var(--h);bottom:-22px;"));
			}
		},
	};
	lib.skill._chupaiM = {
		trigger: { player: ["useCardBegin", "respondBegin"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			if (!event.card) return false;
			var cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
			return cname == "tao" && _status.currentPhase != player && player != (_status.event.player || game.me) && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			if (player.getElementsByClassName("playertiptao").length <= 0) {
				player.appendChild(lib.createTipImg("playertiptao", lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tiptao.png", "display:block;position:absolute;z-index:91;--w:133px;--h:calc(var(--w)*50/431);width:var(--w);height:var(--h);bottom:-22px;"));
			}
		},
	};
	lib.skill._chupaiO = {
		trigger: { player: ["useCardBegin", "respondBegin"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			if (!event.card) return false;
			var cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
			return cname == "jiu" && _status.currentPhase != player && player != (_status.event.player || game.me) && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			if (player.getElementsByClassName("playertipjiu").length <= 0) {
				player.appendChild(lib.createTipImg("playertipjiu", lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipjiu.png", "display:block;position:absolute;z-index:91;--w:133px;--h:calc(var(--w)*50/431);width:var(--w);height:var(--h);bottom:-22px;"));
			}
		},
	};
	// ========== 清除提示技能静态注册 ==========
	lib.skill._chupaiF = {
		trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertipshan")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertipshan");
			}
		},
	};
	lib.skill._chupaiH = {
		trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertipsha")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertipsha");
			}
		},
	};
	lib.skill._chupaiN = {
		trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertiptao")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertiptao");
			}
		},
	};
	lib.skill._chupaiP = {
		trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertipjiu")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertipjiu");
			}
		},
	};
	//--------------------其他特殊技能--------------------//
	lib.skill._chupaiA = {
		trigger: {
			player: ["phaseUseBegin", "useCardEnd", "loseEnd"],
		},
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			var a = player.getElementsByClassName("playertip");
			return player != (_status.event.player || game.me) && _status.currentPhase == player && player.isPhaseUsing() && a.length <= 0;
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			var a = player.getElementsByClassName("playertip");
			if (a.length <= 0) {
				var tipAB = document.createElement("img");
				tipAB.classList.add("tipshow", "playertip");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					tipAB.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tip.png";
					tipAB.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
				} else {
					tipAB.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/phasetip.png";
					tipAB.style.cssText = "display:block;position:absolute;z-index:92;--w: 129px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-9.2px;transform:scale(1.2);";
				}
				player.appendChild(tipAB);
			}
		},
	};
	lib.skill._chupaiB = {
		trigger: {
			global: ["phaseUseEnd", "dieBegin", "phaseBegin"],
		},
		silent: true,
		forced: true,
		priority: -1,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				var ab = game.players[i].getElementsByClassName("playertip");
				if (ab[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertip");
			}
		},
	};
	lib.skill._chupaiC = {
		trigger: {
			player: "phaseDiscardBegin",
		},
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			return player != (_status.event.player || game.me);
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			var a = player.getElementsByClassName("playertipQP");
			if (a.length <= 0) {
				var tipCD = document.createElement("img");
				tipCD.classList.add("tipshow", "playertipQP");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					tipCD.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipQP.png";
					tipCD.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
				} else {
					tipCD.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/discardtip.png";
					tipCD.style.cssText = "display:block;position:absolute;z-index:92;--w: 129px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-9.2px;transform:scale(1.2);";
				}
				player.appendChild(tipCD);
			}
		},
	};
	lib.skill._chupaiD = {
		trigger: {
			global: ["phaseDiscardEnd", "dieBegin"],
		},
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				var ab = game.players[i].getElementsByClassName("playertipQP");
				if (ab[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertipQP");
			}
		},
	};
	// 技能提示条（容错清除）
	lib.skill._skilltip_closeB = {
		trigger: {
			global: ["phaseUseEnd", "dieBegin", "dying", "phaseBegin", "useCardAfter", "loseAfter", "phaseEnd"],
		},
		silent: true,
		forced: true,
		priority: -2,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (var i = 0; i < game.players.length; i++) {
				var ab = game.players[i].getElementsByClassName("tipskill");
				if (ab[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (var i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "tipskill");
			}
		},
	};
	//狗托播报
	if (config.GTBB) {
		var gtbbUI = {};
		function showGTBB() {
			var playerLabel = "玩家";
			var nickname = lib.config.connect_nickname;
			var randomNames = [
				"氪金抽66",
				"卡宝真可爱",
				"蒸蒸日上",
				"√卡视我如父",
				"麒麟弓免疫枸杞",
				"坏可宣（老坏批）",
				"六千大败而归",
				"开局酒古锭",
				"遇事不决刷个乐",
				"见面两刀喜相逢",
				"改名出66",
				"时代的六万五",
				"韩旭",
				"司马长衫",
				"ogx",
				"狗卡不如无名杀",
				"王八万",
				"一拳兀突骨",
				"开局送神将",
				"丈八二桃",
				"装甲车车",
				"等我喝口酒",
				"Samuri",
				"马",
				"kimo鸡～木木",
				"Log-Frunki",
				"aoe银钱豹",
				"没有丈八就托管",
				"无中yyds",
				"给咸鱼鸽鸽打call",
				"小零二哟～",
				"长歌最帅了",
				"大猫有侠者之风",
				"布灵布灵❤️",
				"我爱～摸鱼🐠～",
				"小寻寻真棒",
				"呲牙哥超爱笑",
				"是俺杀哒",
				"阿七阿七",
				"祖安·灰晖是龙王",
				"吃颗桃桃好遗计",
				"好可宣✓良民",
				"藏海表锅好",
				"金乎？木乎？水乎！！",
				"无法也无天",
				"西风不识相",
				"神秘喵酱",
				"星城在干嘛？",
				"子鱼今天摸鱼了吗？",
				"阳光苞里有阳光",
				"诗笺的小裙裙",
				"轮回中的消逝",
				"乱踢jb的云野",
				"小一是不是...是不是...",
				"美羊羊爱瑟瑟",
				"化梦的星辰",
				"杰哥带你登dua郎",
				"世中君子人",
				"叹年华未央",
				"短咕咕",
				"若石",
				"很可爱的小白",
				"沉迷踢jb的云野",
				"厉不厉害你坤哥",
				"东方太白",
				"恶心的死宅",
				"风回太初",
				"隔壁的戴天",
				"林柒柒",
				"洛神",
				"ikun",
				"蒙娜丽喵",
				"只因无中",
				"女宝",
				"远道",
				"翘课吗？",
				"失败的man",
				"晚舟",
				"叙利亚野🐒",
				"幸运女神在微笑",
				"知天意，逆天寒",
				"明月栖木",
				"路卡利欧",
				"兔兔",
				"香蕉",
				"douyun",
				"启明星阿枫",
				"雨夜寒稠",
				"洛天依？！",
				"黄老板是好人～",
				"来点瑟瑟文和",
				"鲨鱼配辣椒",
				"萝卜～好萝卜",
				"废城君",
				"E佬细节鬼才",
				"感到棘手要怀念谁？",
				"半价小薯片",
				"JK欧拉欧拉欧拉",
				"新年快乐",
				"乔姐带你飞",
				"12345678？",
				"缘之空",
				"小小恐龙",
				"教主：杀我！",
				"才思泉涌的司马",
				"我是好人",
				"喜怒无常的大宝",
				"黄赌毒",
				"阴间杀～秋",
				"敢于劈瓜的关羽",
				"暮暮子",
				"潜龙在渊",
			];
			var suiji = randomNames.randomGet();
			var name = [suiji, nickname].randomGet();
			var action = ["通过", "使用", "开启"].randomGet();
			var stories = ["周年", "五一", "踏青", "牛年", "开黑", "冬至", "春分", "鼠年", "盛典", "魏魂", "群魂", "蜀魂", "吴魂", "猪年", "圣诞", "国庆", "狗年", "金秋", "奇珍", "元旦", "小雪", "冬日", "招募", "梦之回廊", "虎年", "新春", "七夕", "大雪", "端午", "武将", "中秋", "庆典"];
			var story = stories.randomGet();
			var boxTypes = ["盒子", "宝盒", "礼包", "福袋", "礼盒", "庆典", "盛典"];
			var box = boxTypes.randomGet();
			var getText = "获得了";
			//皮肤
			var skins = ["界钟会×1", "王朗×1", "马钧×1", "司马昭×1", "司马师×1", "王平×1", "诸葛瞻×1", "张星彩×1", "董允×1", "关索×1", "骆统×1", "周处*1", "界步练师*1", "界朱然*1", "贺齐*1", "苏飞*1", "公孙康×1", "杨彪×1", "刘璋×1", "张仲景×1", "司马徽×1", "曹婴×1", "徐荣×1", "史诗宝珠*66", "史诗宝珠*33", "麒麟生角·魏延*1", "史诗宝珠*10", "刘焉×1", "孙寒华×1", "戏志才×1", "界曹真×1", "曹婴×1", "王粲×1", "界于禁×1", "郝昭×1", "界黄忠×1", "鲍三娘×1", "周群×1", "赵襄×1", "马云禄×1", "孙皓×1", "留赞×1", "吴景×1", "界徐盛×1", "许攸×1", "杜预×1", "界李儒×1", "张让×1", "麹义×1", "司马徽×1", "界左慈×1", "鲍三娘×1", "界徐盛×1", "南华老仙×1", "韩旭の大饼*100", "神郭嘉×1", "吴景×1", "周处×1", "杜预×1", "司马师×1", "羊微瑜×1", "神曹操×1"];
			var skin = skins.randomGet();
			//武将
			var generals = [
				"谋定天下·陆逊*1（动+静）",
				"龙困于渊·刘协（动+静）*1",
				"星花柔矛·张星彩*1（动+静）",
				"呼啸生风·许褚*1（动+静）",
				"牛年立冬·司马懿*1（动+静）",
				"鹰视狼顾·司马懿*1（动+静）",
				"洛水神韵·甄姬*1（动+静）",
				"登锋陷阵·张辽*1（动+静）",
				"十胜十败·郭嘉*1（动+静）",
				"猪年端午·曹丕*1（动+静）",
				"背水一战·张郃*1（动+静）",
				"神兵天降·邓艾*1（动+静）",
				"独来固志·王基*1（动+静）",
				"猪年圣诞·刘备*1（动+静）",
				"哮风从龙·关羽*1（动+静）",
				"西凉雄狮·马超*1（动+静）",
				"鏖战赤壁·黄盖*1（动+静）",
				"星流霆击·孙尚香*1（动+静）",
				"猪年圣诞·陆逊*1（动+静）",
				"鼠年七夕·貂蝉*1（动+静）",
				"迅雷风烈·张角*1（动+静）",
				"一往无前·袁绍*1（动+静）",
				"盛气凌人·许攸*1（动+静）",
				"玄冥天通·神曹操*1（动+静）",
				"魂牵梦绕·灵雎*1（动+静）",
				"肝胆相照·⭐甘宁*1（动+静）",
				"超脱于世·庞德公*1（动+静）",
				"雄踞益州·刘焉*1（动+静）",
				"鼠年春节·兀突骨*1（动+静）",
				"牛年端午·孙鲁班*1（动+静）",
				"灵魂歌王·留赞*1（动+静）",
				"花容月貌·孙茹*1（动+静）",
				"猪年春节·孙鲁育*1（动+静）",
				"长沙桓王·孙笨*1（动+静）",
				"如花似朵·小乔*1（动+静）",
				"嫣然一笑·鲍三娘*1",
				"锐不可当·张翼*1（动+静）",
				"鼠年中秋·关索*1（动+静）",
				"花海舞枪·马云禄*1（动+静）",
				"木牛流马·黄月英*1（动+静）",
				"锋芒毕露·曹婴*1（动+静）",
				"长坂败备·曹纯*1（动+静）",
				"龙袭星落·王朗*1（动+静）",
				"举棋若定·戏志才*1（动+静）",
				"泰山捧日·程昱*1（动+静）",
				"冬日·王元姬（动态+静态）*1",
				"牛年七夕·步练师动态包*1（动+静）",
				"神甘宁×1",
				"巾帼花舞·马云禄*1（动+静）",
				"银币*66666",
				"将魂*66666",
				"琪花瑶草·徐氏*1（动+静）",
				"肝胆相照·星甘宁*1（动+静）",
				"星流霆击·孙尚香（动+静）*1",
				"锋芒毕露·曹婴*1（动+静）",
				"长衫の天牢令*100",
			];
			var general = generals.randomGet();
			//奖励颜色
			var reward = ['<font color="#56e4fa">' + skin + "</font>", '<font color="#f3c20f">' + general + "</font>"].randomGet();
			var tailMsgs = [",大家快恭喜TA吧！", ",大家快恭喜TA吧。无名杀是一款非盈利游戏(づ ●─● )づ", ",祝你新的一年天天开心，万事如意"];
			var tail = tailMsgs.randomGet();
			/*定义部分属性--默认手杀*/
			var fontset = "FZLBJW"; /*字体*/
			var colorA = "#efe8dc"; /*颜色a*/
			var colorB = "#22c622"; /*颜色b*/
			if (lib.config.extension_十周年UI_GTBBFont == "off") {
				fontset = "yuanli";
				colorA = "#86CC5B";
				colorB = "#B3E1EC";
			}
			gtbbUI.div.show();
			setTimeout(function () {
				gtbbUI.div.hide();
			}, 15500);
			gtbbUI.div2.innerHTML = '<marquee direction="left" behavior="scroll" scrollamount="9.8" loop="1" width="100%" height="50" align="absmiddle">' + '<font face="' + fontset + '">' + playerLabel + '<font color="' + colorA + '"><b>' + name + "</b></font>" + action + '<font color="' + colorB + '"><b>' + story + box + "</b></font>" + getText + "<b>" + reward + "</b>" + tail + "</font></marquee>";
		}
		gtbbUI.div = ui.create.div("");
		gtbbUI.div2 = ui.create.div("", gtbbUI.div);
		/*----------手杀样式-------*/
		if (config.GTBBYangshi == "on") {
			gtbbUI.div.style.cssText = "pointer-events:none;width:100%;height:25px;font-size:23px;z-index:6;";
			gtbbUI.div2.style.cssText = "pointer-events:none;background:rgba(0,0,0,0.5);width:100%;height:27px;";
			/*------------------------*/
		} else {
			/*-------十周年样式-------*/
			gtbbUI.div.style.cssText = "pointer-events:none;width:56%;height:35px;font-size:18px;z-index:20;background-size:100% 100%;background-repeat:no-repeat;left:50%;top:15%;transform:translateX(-50%);";
			gtbbUI.div.style["background-image"] = "url(" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/goutuo.png";
			gtbbUI.div2.style.cssText = "pointer-events:none;width:85.5%;height:35px;left:8%;line-height:35px;";
			/*------------------------*/
		}
		var id = setInterval(function () {
			if (!gtbbUI.div.parentNode && ui.window) {
				ui.window.appendChild(gtbbUI.div);
				clearInterval(id);
				showGTBB();
				setInterval(showGTBB, parseFloat(lib.config["extension_十周年UI_GTBBTime"]));
			}
		}, 5000);
	}
}
