import { ChildNodesWatcher } from "../../noname/library/cache/childNodesWatcher.js";
import { nonameInitialized } from "../../noname/util/index.js";
import { lib, game, ui, get, ai, _status } from "../../noname.js";
export const type = "extension";
export default async function () {
	const { name, ...otherInfo } = await lib.init.promises.json(`${lib.assetURL}extension/十周年UI/info.json`);
	const decadeUIName = (window.decadeUIName = name);
	const decadeUIPath = (window.decadeUIPath = `${lib.assetURL}extension/${decadeUIName}/`);
	const decadeUIResolvePath = (window.decadeUIResolvePath = `${nonameInitialized}extension/${decadeUIName}/`);
	return {
		name,
		editable: false,
		content(config, pack) {
			if (get.mode() === "chess" || get.mode() === "tafang" || get.mode === "hs_hearthstone") return;
			//菜单栏错位bugfix
			game.menuZoom = 1;
			//单独装备栏
			_status.nopopequip = lib.config.extension_十周年UI_aloneEquip;
			//布局
			switch (lib.config.layout) {
				case "long2":
				case "nova":
				case "mobile":
					break;
				default:
					alert("十周年UI提醒您，请使用<默认>、<手杀>、<新版>布局以获得良好体验（在选项-外观-布局中调整）。");
					break;
			}

			console.time(decadeUIName);

			window.duicfg = config;
			window.dui = window.decadeUI = {
				init() {
					this.extensionName = decadeUIName;

					var sensor = decadeUI.element.create("sensor", document.body);
					sensor.id = "decadeUI-body-sensor";
					this.bodySensor = new decadeUI.ResizeSensor(sensor);

					var SVG_NS = "http://www.w3.org/2000/svg";
					var svg = document.body.appendChild(document.createElementNS(SVG_NS, "svg"));
					var defs = svg.appendChild(document.createElementNS(SVG_NS, "defs"));
					var solo = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
					var duol = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
					var duor = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
					var dskin = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));

					solo.id = "solo-clip";
					duol.id = "duol-clip";
					duor.id = "duor-clip";
					dskin.id = "dskin-clip";

					solo.setAttribute("clipPathUnits", "objectBoundingBox");
					duol.setAttribute("clipPathUnits", "objectBoundingBox");
					duor.setAttribute("clipPathUnits", "objectBoundingBox");
					dskin.setAttribute("clipPathUnits", "objectBoundingBox");

					var soloPath = solo.appendChild(document.createElementNS(SVG_NS, "path"));
					var duoLPath = duol.appendChild(document.createElementNS(SVG_NS, "path"));
					var duoRPath = duor.appendChild(document.createElementNS(SVG_NS, "path"));
					var dskinPath = dskin.appendChild(document.createElementNS(SVG_NS, "path"));
					soloPath.setAttribute("d", "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z");
					duoLPath.setAttribute("d", "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z");
					duoRPath.setAttribute("d", "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z");
					dskinPath.setAttribute("d", "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z");

					document.addEventListener(
						"click",
						function (e) {
							dui.set.activeElement(e.target);
						},
						true
					);
					this.initOverride();
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
							},
							update: ui.update,
						},
						get: {
							skillState: get.skillState,
						},
						game: {
							gameDraw: game.gameDraw,
							swapSeat: game.swapSeat,
						},
						lib: {
							element: {
								card: {
									$init: lib.element.card.$init,
								},
								player: {
									getState: lib.element.player.getState,
									setModeState: lib.element.player.setModeState,
									$dieAfter: lib.element.player.$dieAfter,
									$skill: lib.element.player.$skill,
									//$syncExpand: lib.element.player.$syncExpand,
									markSkill: lib.element.player.markSkill,
									unmarkSkill: lib.element.player.unmarkSkill,
									$init: lib.element.player.$init,
									$uninit: lib.element.player.$uninit,
									setSeatNum: lib.element.player.setSeatNum,
									$update: lib.element.player.$update,
									useCard: lib.element.player.useCard,
									lose: lib.element.player.lose,
									$draw: lib.element.player.$draw,
									$handleEquipChange: lib.element.player.$handleEquipChange,
									removeVirtualEquip: lib.element.player.removeVirtualEquip,
								},
								dialog: {
									close: lib.element.dialog.close,
								},
							},
						},
					};

					const ride = {};
					ride.lib = {
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
										if (ui.dialogs[i].static) ui.dialogs[i].unfocus();
										else ui.dialogs[i].hide();
									}
									ui.dialog = this;
									ui.arena.appendChild(this);
									ui.dialogs.unshift(this);
									ui.update();
									if (!this.classList.contains("prompt")) {
										this.style.animation = "open-dialog 0.5s";
									}
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
								$init(card) {
									base.lib.element.card.$init.apply(this, arguments);

									this.node.range.innerHTML = "";
									var tags = [];
									if (Array.isArray(card[4])) {
										tags.addArray(card[4]);
									}
									if (this.cardid) {
										if (!_status.cardtag) {
											_status.cardtag = {};
										}
										for (var i in _status.cardtag) {
											if (_status.cardtag[i].includes(this.cardid)) {
												tags.add(i);
											}
										}
										if (tags.length) {
											var tagstr = ' <span class="cardtag">';
											for (var i = 0; i < tags.length; i++) {
												var tag = tags[i];
												if (!_status.cardtag[tag]) {
													_status.cardtag[tag] = [];
												}
												_status.cardtag[tag].add(this.cardid);
												tagstr += lib.translate[tag + "_tag"];
											}
											tagstr += "</span>";
											this.node.range.innerHTML += tagstr;
										}
									}

									const verticalName = this.$vertname;
									this.$name.innerHTML = verticalName.innerHTML;
									let cardNumber = this.number;
									this.$suitnum.$num.innerHTML = (cardNumber !== 0 ? get.strNumber(cardNumber) : false) || cardNumber || "";
									this.$suitnum.$suit.innerHTML = get.translation((this.dataset.suit = this.suit));

									const equip = this.$equip;
									const innerHTML = equip.innerHTML;
									equip.$suitnum.innerHTML = innerHTML.slice(0, innerHTML.indexOf(" "));
									equip.$name.innerHTML = innerHTML.slice(innerHTML.indexOf(" "));
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

									var imgFormat = decadeUI.config.cardPrettify;
									if (imgFormat != "off") {
										let filename = card[2];
										this.classList.add("decade-card");
										if (!this.classList.contains("infohidden")) {
											//不同属性的【杀】的图片素材
											//仅针对单一属性【杀】
											if (Array.isArray(card) && card[2] == "sha" && card[3] && !Array.isArray(card[3])) {
												filename += "_";
												filename += get.natureList(card[3]).sort(lib.sort.nature).join("_");
											}
											var res = dui.statics.cards;
											var asset = res[filename];
											if (res.READ_OK) {
												if (asset == undefined) {
													this.classList.remove("decade-card");
												} else {
													this.style.background = 'url("' + asset.url + '")';
												}
											} else {
												var url = lib.assetURL + "extension/" + decadeUIName + "/image/card/" + filename + "." + imgFormat;
												if (!asset) {
													res[filename] = asset = {
														name: filename,
														url: undefined,
														loaded: undefined,
														rawUrl: undefined,
													};
												}

												if (asset.loaded !== false) {
													if (asset.loaded == undefined) {
														var image = new Image();
														image.onload = function () {
															asset.loaded = true;
															image.onload = undefined;
														};

														var card = this;
														image.onerror = function () {
															asset.loaded = false;
															image.onerror = undefined;
															card.style.background = asset.rawUrl;
															card.classList.remove("decade-card");
														};

														asset.url = url;
														asset.rawUrl = this.style.background || this.style.backgroundImage;
														asset.image = image;
														image.src = url;
													}

													this.style.background = 'url("' + url + '")';
												} else {
													this.classList.remove("decade-card");
												}
											}
										}
									} else {
										this.classList.remove("decade-card");
									}
									if (lib.config["extension_十周年UI_MoNiEquip"] != "off") {
										this.$equip.innerHTML = "";

										var cardName = this.getAttribute("data-card-name");
										/*十周年装备*/ if (!ele) var ele = this.getElementsByClassName("name2");

										if (!(ele.length > 1)) {
											var e = ele[0].children;
											var subype = this.getAttribute("data-card-subtype");
											var cardName = this.getAttribute("data-card-name");
											if (cardName.indexOf("feichu_") != -1) {
												if (lib.config["extension_十周年UI_MoNiEquip"] == "moileDecade") {
													if (!e[0]) {
														var newele = document.createElement("img");
														newele.setAttribute("src", decadeUIPath + "/images/ass/decade/" + cardName + ".png");
														newele.style.opacity = "0.83"; //图标透明度
														newele.style.width = "120%";
														newele.style.height = "112%";
														//    newele.style.borderRadius='5px';
													}
													ele[0].appendChild(newele);
												} else {
													if (!e[0]) {
														var newele = document.createElement("img");
														newele.setAttribute("src", decadeUIPath + "/images/ass/feichuma.png");
														if (subype != "equip3" && subype != "equip4") {
															newele.style.cssText = `
                zoom:1.7;
                width:30px;
                height:10px;
                position:relative;
                left:4px;
                `;
														} else {
															newele.style.cssText = `
                zoom:1.7;
                width:30px;
                height:10px;
                position:relative;
                left:-4px;
                `;
														}
													}
													ele[0].appendChild(newele);
												}
											}
										}
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
								mark(item, info, skill) {
									if (item && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
										const info = get.info(item);
										if (info && (info.zhuanhuanji || info.limited)) return;
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
										mark.text.innerHTML = markText;
									}

									mark.name = item;
									mark.skill = skill || item;
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
									if (name && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
										const info = get.info(name);
										if (info && (info.zhuanhuanji || info.limited)) return;
									}
									return base.lib.element.player.markSkill.apply(this, arguments);
								},
								unmarkSkill(name, info, card, nobroadcast) {
									if (name && lib.config.extension_十周年UI_newDecadeStyle != "othersOff" && lib.config.extension_十周年UI_newDecadeStyle != "on") {
										const info = get.info(name);
										if (info && (info.zhuanhuanji || info.limited)) return;
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
										nodeMarkText.innerHTML = get.translation(name)[0];
									} else {
										if (!get.character(name)) return console.error(name);
										var text = info.name.substr(0, 2);
										if (text.length == 2) nodeMarkText.classList.add("small-text");
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
												player.marks[id].name = name + "_charactermark";
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
												player.marks[id] = player.markCharacter(target, {
													name: name,
													content: content,
													id: id,
												});
												game.addVideo("markCharacter", player, {
													name: name,
													content: content,
													id: id,
													target: target,
												});
											}
											player.marks[id].setBackground(target, "character");
											player.marks[id]._name = target;
											player.marks[id].style.setProperty("background-size", "cover", "important");
											player.marks[id].text.style.setProperty("font-size", "0px", "important");
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
											num = lib.skill[name].intro.markcount(this.storage[name], this);
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
										if (num) {
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

									if (!decadeUI.config.playerDieEffect) {
										if (base.lib.element.player.$dieAfter) base.lib.element.player.$dieAfter.apply(this, arguments);
										return;
									}

									if (!this.node.dieidentity) this.node.dieidentity = ui.create.div("died-identity", this);
									this.node.dieidentity.classList.add("died-identity");

									var that = this,
										image = new Image(),
										identity = decadeUI.getPlayerIdentity(this);

									const goon = decadeUI.config.newDecadeStyle === "on" || decadeUI.config.newDecadeStyle === "othersOff";

									// 为onlineUI样式设置单独的路径判断
									var url;
									if (decadeUI.config.newDecadeStyle === "onlineUI") {
										url = decadeUIPath + "image/decoration/dead_" + identity + ".png";
									} else if (decadeUI.config.newDecadeStyle === "babysha") {
										url = decadeUIPath + "image/decorationh/dead3_" + identity + ".png";
									} else {
										url = decadeUIPath + "image/decoration" + (goon ? "/dead" : "s/dead2") + "_" + identity + ".png";
									}

									image.onerror = function () {
										that.node.dieidentity.innerHTML = decadeUI.getPlayerIdentity(that, that.identity, true) + "<br>阵亡";
									};

									// 随机离开效果
									if ((that._trueMe || that) != game.me && that != game.me && Math.random() < 0.5) {
										if (lib.config.extension_十周年UI_newDecadeStyle == "onlineUI" || lib.config.extension_十周年UI_newDecadeStyle == "babysha") {
											// onlineUI样式固定使用第一个路径
											that.node.dieidentity.innerHTML = '<div style="width:40.2px; height:20px; left:0px; top:-32px; position:absolute; background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/likai_1.png);background-size: 100% 100%;"></div>';
										} else {
											// 其他样式保持随机
											if (goon) {
												that.node.dieidentity.innerHTML = '<div style="width:40.2px; height:20px; left:0px; top:-32px; position:absolute; background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/likai_1.png);background-size: 100% 100%;"></div>';
											} else {
												that.node.dieidentity.innerHTML = '<div style="width:21px; height:81px; left:18px; top:-12px; position:absolute; background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/likai_2.png);background-size: 100% 100%;"></div>';
											}
										}
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
									if (!decadeUI.config.gameAnimationEffect || !decadeUI.animation.gl) return base.lib.element.player.$skill.apply(this, arguments);
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
									return this;
								},
								$uninit() {
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
									base.lib.element.player.$uninit.apply(this, arguments);
									return this;
								},
								setSeatNum() {
									base.lib.element.player.setSeatNum.apply(this, arguments);
									this.seat = this.getSeatNum();
									game.broadcastAll(function (player) {
										if (!player.node.seat) player.node.seat = decadeUI.element.create("seat", player);
										player.node.seat.innerHTML = get.cnNumber(player.seat, true);
									}, this);
								},
								$update() {
									base.lib.element.player.$update.apply(this, arguments);
									const hidden = this.classList.contains("unseen_show") || this.classList.contains("unseen2_show");
									let hujiat = this.node.hpWrap.querySelector(".hujia");
									let hp = this.hp,
										hpMax = hidden ? 1 : this.maxHp,
										hpNode = this.node.hp;
									/*-----------------分割线-----------------*/
									if (lib.config["extension_十周年UI_newDecadeStyle"] == "off") {
										if (!this.storage.nohp) {
											if (hpNode.classList.contains("room")) {
												hpNode.dataset.condition = "high";
											} else if (hp > Math.round(hpMax / 2) || hp === hpMax) {
												hpNode.dataset.condition = "high";
											} else if (hp > Math.floor(hpMax / 3)) {
												hpNode.dataset.condition = "mid";
											} else {
												hpNode.dataset.condition = "low";
											}
											var str = get.rawName(this.name);
											//萌新修改，名字长度♣️
											if (/*(hpMax > 5 || (this.hujia && hpMax > 3))*/ hpMax > 5 || this.hujia || ([...str].length >= 5 && hpMax === 5)) {
												let strhp = "",
													strhpmax = "";
												if (!isNaN(hp) && hp != Infinity && hp >= 0)
													for (let i = 0; i < hp.toString().length; i++) {
														strhp += "<img src='" + lib.assetURL + "extension/十周年UI/image/hp/" + hpNode.dataset.condition + "/" + hp.toString()[i] + ".png'" + "/>";
													}
												else if (hp < 0) strhp += "<img src='" + lib.assetURL + "extension/十周年UI/image/hp/" + hpNode.dataset.condition + "/0.png'" + "/>";
												if (!isNaN(hpMax) && hpMax != Infinity && hpMax >= 0)
													for (let i = 0; i < hpMax.toString().length; i++) {
														strhpmax += "<img src='" + lib.assetURL + "extension/十周年UI/image/hp/" + hpNode.dataset.condition + "/" + hpMax.toString()[i] + ".png'" + "/>";
													}
												else if (hpMax < 0) strhpmax += "<img src='" + lib.assetURL + "extension/十周年UI/image/hp/" + hpNode.dataset.condition + "/0.png'" + "/>";

												hpNode.innerHTML = "<span><span>" + (isNaN(hp) ? "×" : hp === Infinity ? "∞" : strhp) + "</span>" + "<img src='" + lib.assetURL + "extension/十周年UI/image/hp/" + hpNode.dataset.condition + "/xie.png" + "'/>" + "<span>" + (isNaN(hpMax) ? "×" : hpMax === Infinity ? "∞" : strhpmax) + "</span></span>" + "<div></div>";
												if (hp === 0) hpNode.lastChild.classList.add("lost");
												hpNode.classList.add("textstyle");
											} else {
												hpNode.innerHTML = "";
												hpNode.classList.remove("textstyle");
												while (hpMax > hpNode.childNodes.length) ui.create.div(hpNode);
												while (Math.max(0, hpMax) < hpNode.childNodes.length) hpNode.lastChild.remove();

												for (var i = 0; i < Math.max(0, hpMax); i++) {
													var index = i;

													if (i < hp) {
														hpNode.childNodes[index].classList.remove("lost");
													} else {
														hpNode.childNodes[index].classList.add("lost");
													}
												}
											}
											if (hpNode.classList.contains("room")) {
												hpNode.dataset.condition = "high";
											} else if (hp === 0) {
												hpNode.dataset.condition = "";
											} else if (hp > Math.round(hpMax / 2) || hp === hpMax) {
												hpNode.dataset.condition = "high";
											} else if (hp > Math.floor(hpMax / 3)) {
												hpNode.dataset.condition = "mid";
											} else {
												hpNode.dataset.condition = "low";
											}
										}
									}
									//护甲显示修改
									if (this.hujia > 0) {
										if (!hujiat) {
											hujiat = ui.create.div(".hujia");
											this.node.hpWrap.appendChild(hujiat);
										}
										hujiat.innerText = this.hujia == Infinity ? "∞" : this.hujia;
										hujiat.style.setProperty("top", hpNode.offsetTop - hpNode.offsetHeight + 50 + "px");
									} else if (hujiat) hujiat.remove();
									//体力条显示修改

									if (["on", "decade", "othersOff"].includes(lib.config["extension_十周年UI_newDecadeStyle"])) {
										const goon = hpMax > 5 || (this.hujia && hpMax > 3);

										if (!this.storage.nohp) {
											if (goon) {
												hpNode.innerHTML = (isNaN(hp) ? "×" : hp == Infinity ? "∞" : hp) + "<br>/<br>" + (isNaN(hpMax) ? "×" : hpMax == Infinity ? "∞" : hpMax) + "<div></div>";
												if (hp == 0) hpNode.lastChild.classList.add("lost");
												hpNode.classList.add("textstyle");
											}
										}
										this.dataset.maxHp = goon ? 4 : hpMax;
									}
									//手牌数显示修改
									let count = this.countCards("h");
									if (count >= 10) this.node.count.innerHTML = count;
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

										fragment.insertBefore(card, fragment.firstChild);
									}

									if (player == game.me) {
										dui.layoutHandDraws(cards.reverse());
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
									const player = this;
									const isViewAsCard = cards.length !== 1 || cards[0].name !== VCard.name,
										info = get.info(VCard, false);
									cards.forEach(card => {
										card.fix();
										card.style.transform = "";
										card.classList.remove("drawinghidden");
										delete card._transform;
										if (isViewAsCard) {
											card.viewAs = VCard.name;
											if (card.classList.contains("fullskin") || card.classList.contains("fullborder")) {
												card.classList.add("fakejudge");
											}
										} else {
											delete card.viewAs;
											card.classList.remove("fakejudge");
										}
										var jdpai = ["乐", "舍", "兵", "闪", "草", "言", "火", "洪", "蓄", "浮"];
										var cardJ = isViewAsCard ? card.viewAs : card.dataset.cardName;
										card.node.judgeMark.style.opacity = "1";
										var cardJ = isViewAsCard ? card.viewAs : card.dataset.cardName;
										card.node.judgeMark.style.opacity = "1";
										if (jdpai.indexOf(get.translation(cardJ)[0]) != -1) {
											card.node.judgeMark.display = "block";
											card.node.judgeMark.style.width = "50px";
											card.node.judgeMark.style.height = "50px";
											card.node.judgeMark.style.position = "relative";
											card.node.judgeMark.style.top = "-20px";
											card.node.judgeMark.style.right = "100px";
											card.node.judgeMark.style.marginLeft = "4px";
											card.node.judgeMark.style.backgroundPosition = "center";
											card.node.judgeMark.style.backgroundRepeat = "no-repeat";
											card.node.judgeMark.style.backgroundSize = "100% 100%";
											card.node.judgeMark.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/assets/image/" + cardJ + ".png')";
											card.node.background.remove();
											card.node.judgeMark.node.back.remove();
											card.node.judgeMark.node.mark.remove();
											card.node.judgeMark.node.judge.remove();
											if (lib.config["extension_十周年UI_newDecadeStyle"] in ["off", "otherson"]) {
												card.node.judgeMark.style.top = "-6px";
												card.node.judgeMark.style.right = "10px";
												if (["乐", "兵", "闪"].indexOf(get.translation(cardJ)[0]) != -1) card.node.judgeMark.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/assets/image/" + cardJ + "2.png')";
											}
										}
										if (card.viewAs) {
											card.node.judgeMark.node.judge.innerHTML = lib.translate[card.viewAs + "_bg"] || get.translation(card.viewAs)[0];
										} else {
											card.node.judgeMark.node.judge.innerHTML = get.translation(card.dataset.cardName)[0];
										}

										card.classList.add("drawinghidden");
										player.node.judges.insertBefore(card, player.node.judges.firstChild);
									});
									ui.updatej(player);
								},
								useCard() {
									var event = base.lib.element.player.useCard.apply(this, arguments);
									event.finish = function () {
										this.finished = true;
										var targets = this.targets;
										for (var i = 0; i < targets.length; i++) {
											targets[i].classList.remove("target");
										}
									};
									event.pushHandler("decadeUI_LineAnimation", (event, option) => {
										if (event.step === 1 && option.state === "begin" && !event.hideTargets) {
											const player = event.player;
											for (var i = 0; i < targets.length; i++) {
												if (targets[i] != player) targets[i].classList.add("target");
											}
										}
									});
									return event;
								},
								lose() {
									var next = base.lib.element.player.lose.apply(this, arguments);
									var event = _status.event;
									if (event.name == "useCard") {
										next.animate = true;
										next.blameEvent = event;
										if (next.cards.length) event.throw = false;
									}
									return next;
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
											x1 = hand.x + hand.width / 2;
											y1 = hand.y;
										} else {
											x1 = player.cacheLeft + player.cacheWidth / 2;
											y1 = player.cacheTop + player.cacheHeight / 2;
										}

										if (target == game.me) {
											hand.check();
											x2 = hand.x + hand.width / 2;
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
								removeVirtualEquip() {
									base.lib.element.player.removeVirtualEquip.apply(this, arguments);
									if (!lib.config.equip_span) this.$handleEquipChange();
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
								//扔牌函数，改动较多，转化，虚拟都在这个地方
								//关于转化，现在在转化牌上额外创建一个相同的原牌，然后定时闪光，删除原牌
								$throw: function (cards, time, record, nosource) {
									//meihua
									var itemtype;
									var card;
									var duiMod = cards.duiMod && game.me === this && !nosource;
									if (typeof cards === "number") {
										itemtype = "number";
										cards = new Array(cards);
									} else {
										itemtype = get.itemtype(cards);
										if (itemtype === "cards") {
											cards = cards.concat();
										} else if (itemtype === "card") {
											cards = [cards];
										} else {
											//虚拟牌相关
											var evt = _status.event;
											if (evt && evt.card && evt.cards === cards) {
												var card = ui.create.card().init([evt.card.suit, evt.card.number, evt.card.name, evt.card.nature]);
												if (evt.card.suit === "none") card.node.suitnum.style.display = "none";
												card.dataset.virtualCard = true;
												cards = [card];
												card.virtualMark = ui.create.div(".virtualMark", card);
											}
										}
									}
									var clone;
									var player = this;
									var hand = dui.boundsCaches.hand;
									hand.check();
									//对应的事件的上级事件的卡牌，一般情况这是达成实际效果的卡牌而不是卡牌实例
									if (_status.event.parent) var cardk = _status.event.parent.card;
									for (var i = 0; i < cards.length; i++) {
										card = cards[i];
										if (card) {
											//这里与手牌显示装备区有关，删掉实体卡牌映射的虚假卡牌
											if (card.falsecard) {
												card.falsecard.fix();
												card.falsecard.remove();
												card.falsecard.destroyed = true;
												delete card.falsecard;
												//刷新手牌
												dui.queueNextFrameTick(dui.layoutHand, dui);
											}
											//清除打出去的牌的横tag，以免进入弃牌堆里有tag，洗牌后tag跟着牌一起回来
											if (card._tempName) card._tempName.remove();
											//如果没有bianhua（主动）和bianhua2（被动））且没有cardk或者有cardk但card和cardk完全相同
											if (card.bianhua !== true && card.bianhua2 !== true && (!cardk || (card.name === cardk.name && card.nature === cardk.nature && card.number === cardk.number))) clone = card.copy("thrown");
											//否则的话如果此时是usecard事件和respond事件就从克隆卡牌变为创建新卡牌
											else if ((_status.event.parent.name === "useCard" || _status.event.parent.name === "respond") && _status.event.type !== "card") {
												clone = ui.create.card().init([cardk.suit, cardk.number, cardk.name, cardk.nature]);
												//添加thrown类名才能正确显示
												clone.classList.add("thrown");
												//转标记
												clone._tempNamed = ui.create.div(".temp-name", clone);
												clone._tempNamed.innerHTML = '<div style="width:33px; height:31px; left:71px; top:2px; z-index:5;position:absolute; background-image: url(' + lib.assetURL + 'extension/十周年UI/image/vcard/zhuan.png);background-size: 100% 100%;"></div>';
												//无色有点数
												if (cardk.suit === "none" && cardk.number) clone.querySelector(".suit-num").querySelectorAll("span.suit")[0].innerHTML = "<img src='" + lib.assetURL + "extension/十周年UI/image/vcard/none.png" + "' style='position:relative;width:20px;height:35px;bottom:0px;left:3px;'/>";
												//颜色变化
												//无点数且牌数大于1
												else if (get.color(cardk) === "none" && cardk.cards && cardk.cards.length > 1 && get.suit(cardk) === "none") clone.getElementsByClassName("suit-num")[0].innerHTML = "<img src='" + lib.assetURL + "extension/十周年UI/image/vcard/none.png" + "' style='position:relative;width:20px;height:35px;bottom:0px;left:3px;'/>";
												else if (get.color(cardk) === "red" && cardk.cards && cardk.cards.length > 1) clone.getElementsByClassName("suit-num")[0].innerHTML = "<img src='" + lib.assetURL + "extension/十周年UI/image/vcard/red.png" + "' style='position:relative;width:20px;height:35px;bottom:0px;left:3px;'/>";
												else if (get.color(cardk) === "black" && cardk.cards && cardk.cards.length > 1) clone.getElementsByClassName("suit-num")[0].innerHTML = "<img src='" + lib.assetURL + "extension/十周年UI/image/vcard/black.png" + "' style='position:relative;width:20px;height:35px;bottom:0px;left:3px;'/>";
												//试试添加一个原牌皮
												let cheats = card.copy("thrown");
												clone.appendChild(cheats);
												clone.cheats = cheats;
											} else clone = card.copy("thrown");
											//这里添加一个从装备区扔牌的位置，还有火攻展示事件的牌的位置
											if ((duiMod && (card.throwWith === "h" || card.throwWith === "s")) || (_status.event.name === "useSkill" && player === game.me && card.throwWith !== "e") || (_status.event.type === "card" && player === game.me)) {
												clone.tx = Math.round(hand.x + 10 + card.tx);
												clone.ty = Math.round(hand.y + 30 + card.ty);
												clone.scaled = true;
												clone.throwordered = true;
												clone.style.transform = "translate(" + clone.tx + "px," + clone.ty + "px)" + "scale(" + hand.cardScale + ")";

												//装备区和虚拟牌从底下仍
											} else if ((card.throwWith === "e" || card.dataset.virtualCard) && player === game.me && _status.event.getParent(2).name !== "discardPlayerCard") {
												clone.tx = Math.round(hand._width * 0.6);
												clone.ty = Math.round(hand.y + 60);
												clone.scaled = true;
												clone.throwordered = true;
												clone.style.transform = "translate(" + clone.tx + "px," + clone.ty + "px) scale(" + hand.cardScale + ")";
												/* if (decadeUI.getExtensionConfig('EpicFX', 'cardPhantom')) {
                            EpicFX.card.phantom4(clone);
                        }*/
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

									if (duiMod && cards.length > 2) {
										cards.sort(function (a, b) {
											if (a.tx === undefined && b.tx === undefined) return 0;

											if (a.tx === undefined) return duicfg.rightLayout ? -1 : 1;

											if (b.tx === undefined) return duicfg.rightLayout ? 1 : -1;

											return b.tx - a.tx;
										});
									}
									//调换i的顺序
									for (var i = cards.length - 1; i >= 0; i--) player.$throwordered2(cards[i], nosource);

									if (game.chess) this.chessFocus();
									return cards[cards.length - 1];
								},
								$throwordered2: function (card, nosource) {
									//同样的，这里处理因为其他方式仍牌的横向转化tag
									//于吉老骗子的tag似乎不太正确，因为不是通过这个函数仍的
									if (card._tempName) card._tempName.remove();
									//明伐删假牌
									//     if (ui.cardDialog) ui.cardDialog.remove();
									//     if (_status.event.handTip) _status.event.handTip.show();
									let cardsob = game.me.getCards("hes");
									for (i = 0; i < cardsob.length; i++) {
										if (cardsob[i].falsecard) {
											cardsob[i].falsecard.fix();
											cardsob[i].falsecard.remove();
											cardsob[i].falsecard.destroyed = true;
											delete cardsob[i].falsecard;
											//刷新手牌
											dui.queueNextFrameTick(dui.layoutHand, dui);
										}
									}
									if (card.cheats) {
										var params = { name: "../../../十周年UI/assets/animation/kapaizhuanhuan" };
										card.listenTransition(function () {
											dcdAnim.loadSpine(params.name, "skel", function () {
												decadeUI.animation.playSpine(params, {
													scale: 0.6,
													parent: card,
												});
												setTimeout(function () {
													card.cheats.remove();
												}, 200);
											});
										});
									}
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

									var before;
									for (var i = 0; i < ui.thrown; i++) {
										if (ui.thrown[i].parentNode == ui.arena) {
											before = ui.thrown[i];
											break;
										}
									}

									//牌面信息添加
									if (1) {
										let node = card;
										const player = this;
										let event = _status.event.blameEvent ? _status.event.blameEvent : _status.event;
										let eventInfo;
										const playername = get.translation(player);
										//事件名称
										let getName = function (card, player, event) {
											if (!card || !player || !event) return;
											if (event.blameEvent) event = event.blameEvent;
											let tagText;
											const playername = get.slimName(player?.name);
											let border = get.groupnature(get.bordergroup(player?.name), "raw");
											let eventInfo = `<span style="font-weight:700"><span data-nature=${border}>${playername}</span><br/><span style="color:#FFD700">`;
											switch (event.name) {
												case "usecard":
													tagText = "使用";
													if (!event.player.hasSkillTag("ignoreLogAI", null, { card: event.card }) && !event.hideTargets && event.targets.length == 1) {
														if (!["off", "othersOn"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
															if (event.targets[0] == event.player) tagText = "对自己";
															else tagText = "对" + get.translation(event.targets[0]);
														} else {
															if (event.targets[0] === player) {
																tagText = `<br/><span class="colorText">对 </span><span style="white-space: nowrap;">${get.translation(player)}</span>`;
															} else {
																tagText = `<br/><span class="colorText">对 </span><span style="white-space: nowrap;">${get.translation(event.targets[0])}</span>`;
															}
														}
													} else {
														if (!["off", "othersOn"].includes(lib.config.extension_十周年UI_newDecadeStyle)) tagText = "使用";
														else tagText = `<span class="colorText warpAndBigger">使用</span>`;
													}
													break;
												case "respond":
													if (tagText == "") {
														if (!["off", "othersOn"].includes(lib.config.extension_十周年UI_newDecadeStyle)) tagText = "打出";
														else tagText = `<span class="colorText warpAndBigger">打出</span>`;
													}
													break;
												default:
													if (!["off", "othersOn"].includes(lib.config.extension_十周年UI_newDecadeStyle)) tagText = get.cardsetion(player);
													else tagText = `<span class="colorText warpAndBigger">${get.cardsetion(player)}</span>`;
													break;
											}
											return tagText;
										};
										eventInfo = getName(node, player, event);
										if (node && node.node) {
											const cardInfo = {
												name: get.name(node),
												number: get.number(node),
												suit: get.suit(node),
											};
											game.broadcastAll(
												(node, eventInfo, { name, number, suit }, event) => {
													let card = node;
													if (!node.node) {
														node = [...ui.arena.childNodes].find(c => {
															if (c.classList.contains("thrown") && c.classList.contains("card")) {
																const n = get.number(c);
																const na = get.name(c);
																const s = get.suit(c);
																if (n === number && na === name && s === suit && !c.selectedt) {
																	c.selectedt = true;
																	return true;
																}
															}
														});
													}
													if (!node.node) return;
													const no = ["image", "info", "name", "name2", "background", "intro", "range", "gaintag"];
													const some = [...node.childNodes].some(n => {
														if (n.innerText && eventInfo.includes && eventInfo.includes(n.innerText) && !no.includes(n.classList[0])) {
															n.innerHTML = eventInfo;
															return true;
														}
													});
													if (some) return;
													if (!node.node.cardsetion) {
														node.node.cardsetion = ui.create.div(".used-info", eventInfo, node);
													} else {
														node.node.cardsetion.innerHTML = eventInfo || playername;
													}
												},
												node,
												eventInfo,
												cardInfo,
												event
											);
											const addStyle = () => {
												const style = document.createElement("style");
												style.innerHTML = /*css*/ `
												.card .tempname.tempimage {
													opacity:1 !important;
												}   
												`;
												document.head.appendChild(style);
											};
											if (!game.throwCardStyle) {
												addStyle();
												game.throwCardStyle = true;
											}
											if (lib.node && lib.node.clients) {
												lib.node.clients.forEach(c => {
													if (!c.gameOptions) {
														c.gameOptions = {};
													}
													if (!c.gameOptions.Cardstyle) {
														c.send(addStyle);
														c.gameOptions.Cardstyle = true;
													}
												});
											}
											game.addVideo("cardInfo", null, {
												eventInfo,
												cardInfo,
											});
										}
										//播放动画骨骼
										switch (event.name) {
											//使用打出牌
											case "useCard":
											case "respond":
												const cardname = event.card.name,
													cardnature = get.nature(event.card);
												if (lib.config.cardtempname != "off" && (card.name != cardname || !get.is.sameNature(cardnature, card.nature, true))) {
													if (lib.config.extension_十周年UI_showTemp) {
														let vname2 = cardname;
														if (cardnature && cardname == "sha") vname2 = cardname + "_" + cardnature;
														let path = "extension/十周年UI/image/vcard/" + vname2 + ".png";
														if (_status.connectMode) {
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
														} else
															game.checkFile(path, function (a) {
																if (a) {
																	if (!card._tempName) card._tempName = ui.create.div(".temp-name2", card);
																	card._tempName.innerHTML = "";
																	card._tempName.tempname = "";
																	card._tempName.setBackgroundImage(path);
																	card._tempName.style.top = "calc(50% - 18px)";
																	card._tempName.style.height = "30px";
																} else {
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
																}
															});
													} else {
														var node0 = ui.create.cardTempName(event.card, card);
														var cardtempnameConfig = lib.config.cardtempname;
														if (cardtempnameConfig !== "default") node0.classList.remove("vertical");
													}
												}
												const cardnumber = get.number(event.card),
													cardsuit = get.suit(event.card);
												if (card.dataset && card.dataset.views != 1 && event.card.cards && event.card.cards.length == 1 && (card.number != cardnumber || card.suit != cardsuit)) {
													dui.cardTempSuitNum(card, cardsuit, cardnumber);
												}
												if (duicfg.cardUseEffect && event.card && (!event.card.cards || !event.card.cards.length || event.card.cards.length == 1)) {
													var name0 = event.card.name,
														nature = event.card.nature;

													switch (name0) {
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
																// case "ice":
																//     decadeUI.animation.cap.playSpineTo(card, "effect_bingsha");
																//     break;
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
												break;
											//判定
											case "judge":
												event.addMessageHook("judgeResult", function () {
													var event = this;
													var card = event.result.card.clone;
													var apcard = event.apcard;
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
													} else {
														action = "play5";
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
												});
												if (duicfg.cardUseEffect) {
													decadeUI.animation.cap.playSpineTo(card, {
														name: "effect_panding",
														action: "play",
														loop: true,
													});
													event.apcard = card;
												}
												break;
										}
									}
									ui.thrown.unshift(card);
									if (before) ui.arena.insertBefore(before, card);
									else ui.arena.appendChild(card);
									dui.queueNextFrameTick(dui.layoutDiscard, dui);
									return card;
								},
								$phaseJudge(card) {
									game.addVideo("phaseJudge", this, get.cardInfo(card));
									if (card.cards?.length) {
										const cards = card.cards;
										this.$throw(cards);
									} else {
										const VCard = game.createCard(card.name, "虚拟", "");
										this.$throw(VCard);
									}
									dui.delay(451);
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
								gain() {
									"step 0";
									if (event.animate == "give") event.visible = true;
									if (get.itemtype(cards) == "cards") {
										var map = {};
										for (var i of cards) {
											var owner = get.owner(i, "judge");
											if (owner && (owner != player || get.position(i) != "h")) {
												var id = owner.playerid;
												if (!map[id]) map[id] = [[], [], []];
												map[id][0].push(i);
												var position = get.position(i);
												if (position == "h") map[id][1].push(i);
												else map[id][2].push(i);
												if (event.visible) i.addKnower("everyone");
											} else if (!event.updatePile && get.position(i) == "c") event.updatePile = true;
										}
										event.losing_map = map;
										for (var i in map) {
											var owner = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
											var next = owner.lose(map[i][0], ui.special).set("type", "gain").set("forceDie", true).set("getlx", false);
											if (event.visible == true) next.visible = true;

											event.relatedLose = next;
										}
									} else {
										event.finish();
									}
									("step 1");
									event.cards = cards = cards.map(i => (i.cards ? i.cards : [i])).flat();
									for (var i = 0; i < cards.length; i++) {
										if (cards[i].willBeDestroyed("handcard", player, event)) {
											cards[i].selfDestroy(event);
											cards.splice(i--, 1);
										} else if (event.losing_map) {
											for (var id in event.losing_map) {
												if (event.losing_map[id][0].includes(cards[i])) {
													var source = (_status.connectMode ? lib.playerOL : game.playerMap)[id];
													var hs = source.getCards("hejsx");
													if (hs.includes(cards[i])) {
														cards.splice(i--, 1);
													} else {
														cards[i].addKnower(event.visible ? "everyone" : source);
													}
												}
											}
										}
									}
									if (cards.length == 0) {
										event.finish();
										return;
									}
									player.getHistory("gain").push(event);
									("step 2");
									if (player.getStat().gain == undefined) {
										player.getStat().gain = cards.length;
									} else {
										player.getStat().gain += cards.length;
									}
									("step 3");
									var gaintag = event.gaintag;
									var handcards = player.node.handcards1;
									var fragment = document.createDocumentFragment();

									var card;
									for (var i = 0; i < cards.length; i++) {
										card = cards[i];
										sort = lib.config.sort_card(cards[num]);
										if (lib.config.reverse_sort) sort = -sort;
										if (["o", "d"].includes(get.position(card, true))) {
											card.addKnower("everyone");
										}
										card.fix();
										if (card.parentNode == handcards) {
											cards.splice(i--, 1);
											continue;
										}

										if (gaintag) card.addGaintag(gaintag);

										if (event.knowers) card.addKnower(event.knowers);

										fragment.insertBefore(card, fragment.firstChild);
										if (_status.discarded) _status.discarded.remove(card);

										for (var j = 0; j < card.vanishtag.length; j++) {
											if (card.vanishtag[j][0] != "_") card.vanishtag.splice(j--, 1);
										}
									}
									var gainTo = function (cards, nodelay) {
										cards.duiMod = event.source;
										if (player == game.me) {
											dui.layoutHandDraws(cards.reverse());
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
									("step 4");
									if (event.updatePile) game.updateRoundNumber();
								},
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

									//event.dialog.close();
									game.broadcast(
										function (/*id*/) {
											/*
					var dialog = get.idDialog(id);
					if (dialog) dialog.close();
					*/
											if (!window.decadeUI) ui.arena.classList.remove("thrownhighlight");
										} /*, event.videoId*/
									);

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
								lose() {
									"step 0";
									var evt = event.getParent();
									if ((evt.name != "discard" || event.type != "discard") && (evt.name != "loseToDiscardpile" || event.type != "loseToDiscardpile")) {
										event.delay = false;
										if (event.blameEvent == undefined) event.animate = false;
									} else {
										if (evt.delay === false) event.delay = false;
										if (event.blameEvent && event.animate == undefined) event.animate = evt.animate;
									}
									("step 1");
									event.gaintag_map = {};
									if (event.insert_card && event.position == ui.cardPile) event.cards.reverse();
									event.stockcards = event.cards.slice(0);
									var hs = [],
										es = [],
										js = [],
										ss = [],
										xs = [],
										unmarks = [];
									var evt = event.getParent(),
										card,
										pileNode,
										hej = player.getCards("hejsx");
									for (var i = 0; i < cards.length; i++) {
										card = cards[i];
										var cardx = [card];
										pileNode = card.parentNode;
										if (!hej.includes(card)) {
											cards.splice(i--, 1);
											continue;
										} else if (pileNode) {
											if (pileNode.classList.contains("equips")) {
												card.throwWith = card.original = "e";
												let loseCards = card.cards ? card.cards : [card];
												cardx.addArray(loseCards);
												loseCards.forEach(cardi => {
													es.push(cardi);
													event.vcard_map.set(cardi, card.card || get.autoViewAs(card, void 0, false));
												});
											} else if (pileNode.classList.contains("judges")) {
												card.throwWith = card.original = "j";
												js.push(card);
												const VJudge = player.getVCards("j").find(card => card.cards?.includes(card));
												if (VJudge) event.vcard_map.set(card, VJudge);
												else event.vcard_map.set(card, get.autoViewAs(card, void 0, false));
											} else if (pileNode.classList.contains("expansions")) {
												card.throwWith = card.original = "x";
												xs.push(card);
												event.vcard_map.set(card, get.autoViewAs(card, void 0, false));
												if (card.gaintag && card.gaintag.length) unmarks.addArray(card.gaintag);
											} else if (pileNode.classList.contains("handcards")) {
												if (card.classList.contains("glows")) {
													card.throwWith = card.original = "s";
													ss.push(card);
													event.vcard_map.set(card, get.autoViewAs(card, void 0, false));
												} else {
													card.throwWith = card.original = "h";
													hs.push(card);
													event.vcard_map.set(card, get.autoViewAs(card, void 0, player));
												}
											} else {
												card.throwWith = card.original = null;
											}
										}
										for (var j = 0; j < cardx.length; j++) {
											if (cardx[j].gaintag && cardx[j].gaintag.length) {
												event.gaintag_map[cardx[j].cardid] = cardx[j].gaintag.slice(0);
												cardx[j].removeGaintag(true);
											}

											cardx[j].recheck();
											cardx[j].classList.remove("glow");
											cardx[j].classList.remove("glows");

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
												} else {
													if (event.position == ui.cardPile) cardx[j].fix();
													event.position.appendChild(cardx[j]);
												}
											} else {
												cardx[j].remove();
											}
										}
									}
									if (player == game.me) dui.queueNextFrameTick(dui.layoutHand, dui);
									ui.updatej(player);
									game.broadcast(
										function (player, cards, num) {
											for (var i = 0; i < cards.length; i++) {
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
										cards,
										ui.cardPile.childNodes.length
									);
									if (event.animate != false) {
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
									game.addVideo("lose", player, [get.cardsInfo(hs), get.cardsInfo(es), get.cardsInfo(js), get.cardsInfo(ss), get.cardsInfo(xs)]);
									event.cards2 = hs.concat(es);
									player.getHistory("lose").push(event);
									game.getGlobalHistory().cardMove.push(event);
									player.update();
									game.addVideo("loseAfter", player);
									event.num = 0;
									if (event.position == ui.ordering) {
										var evt = event.relatedEvent || event.getParent();
										if (!evt.orderingCards) evt.orderingCards = [];
										if (!event.noOrdering && !event.cardsOrdered) {
											event.cardsOrdered = true;
											var next = game.createEvent("orderingDiscard", false);
											event.next.remove(next);
											evt.after.push(next);
											next.relatedEvent = evt;
											next.setContent("orderingDiscard");
										}
										if (!event.noOrdering) {
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
										player.getCards("h").forEach(hcard => hcard.clearKnowers());
									}
									("step 2");
									if (num < cards.length) {
										if (event.es.includes(cards[num]) || cards[num].cards?.some(i => event.es.includes(i))) {
											event.loseEquip = true;
											const VEquip = cards[num][cards[num].cardSymbol];
											if (VEquip) {
												player.removeVirtualEquip(VEquip);
												//player.removeEquipTrigger(cards[num]);
												var info = get.info(VEquip, false);
												if (info.onLose && (!info.filterLose || info.filterLose(VEquip, player))) {
													event.goto(3);
													event.currentVEquip = VEquip;
													return;
												}
											}
										} else if (event.js.includes(cards[num])) {
											const VJudge = player.getVCards("j").find(card => {
												return card.cards?.includes(cards[num]);
											});
											if (VJudge) {
												player.removeVirtualJudge(VJudge);
											}
										}
										event.num++;
										event.redo();
									} else {
										if (event.loseEquip) {
											player.addEquipTrigger();
										}
										event.goto(4);
									}
									("step 3");
									const VEquip = event.currentVEquip;
									var info = get.info(VEquip, false);
									if (info.loseDelay != false && (player.isAlive() || info.forceDie)) {
										player.popup(VEquip.name);
										game.delayx();
									}
									if (Array.isArray(info.onLose)) {
										for (var i = 0; i < info.onLose.length; i++) {
											var next = game.createEvent("lose_" + VEquip.name);
											next.setContent(info.onLose[i]);
											if (info.forceDie) next.forceDie = true;
											next.player = player;
											next.card = VEquip;
											next.cards = VEquip.cards;
										}
									} else {
										var next = game.createEvent("lose_" + VEquip.name);
										next.setContent(info.onLose);
										next.player = player;
										if (info.forceDie) next.forceDie = true;
										next.card = VEquip;
										next.cards = VEquip.cards;
									}
									event.num++;
									event.goto(2);
									("step 4");
									event.cards = cards.map(i => (i.cards ? i.cards : [i])).flat();
									if (event.toRenku) {
										_status.renku.addArray(
											cards.filter(function (card) {
												return !card.willBeDestroyed("renku", null, event);
											})
										);
										if (_status.renku.length > 6) {
											var cards = _status.renku.splice(0, _status.renku.length - 6);
											game.log(cards, "从仁库进入了弃牌堆");
											game.cardsDiscard(cards).set("outRange", true).fromRenku = true;
										}
										game.updateRenku();
									}
									("step 5");
									var evt = event.getParent();
									if (evt.name != "discard" && event.type != "discard" && evt.name != "loseToDiscardpile" && event.type != "loseToDiscardpile") return;
									if (event.animate === false || event.delay === false) return;
									if (evt.delay != false) {
										if (evt.waitingForTransition) {
											_status.waitingForTransition = evt.waitingForTransition;
											game.pause();
										} else {
											game.delayx();
										}
									}
								},
								/*-----------------分割线-----------------*/
								turnOver() {
									game.log(player, "翻面");
									player.classList.toggle("turnedover");
									game.broadcast(function (player) {
										player.classList.toggle("turnedover");
									}, player);
									game.addVideo("turnOver", player, player.classList.contains("turnedover"));
									player.queueCssAnimation("turned-over 0.5s linear");
								},
							},
						},
					};

					ride.ui = {
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
						},
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

						updatem(player) {},

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

						create: {
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

							dialog() {
								var hidden = false;
								var notouchscroll = false;
								var forcebutton = false;
								var dialog = decadeUI.element.create("dialog");
								dialog.supportsPagination = false;
								dialog.paginationMap = new Map();
								dialog.paginationMaxCount = new Map();
								dialog.contentContainer = decadeUI.element.create("content-container", dialog);
								dialog.content = decadeUI.element.create("content", dialog.contentContainer);
								dialog.buttons = [];
								//for (let i in lib.element.dialog) dialog[i] = lib.element.dialog[i];
								Object.setPrototypeOf(dialog, lib.element.Dialog.prototype);
								for (let i = 0; i < arguments.length; i++) {
									if (typeof arguments[i] == "boolean") dialog.static = arguments[i];
									else if (arguments[i] == "hidden") hidden = true;
									else if (arguments[i] == "notouchscroll") notouchscroll = true;
									else if (arguments[i] == "forcebutton") forcebutton = true;
									else dialog.add(arguments[i]);
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
											if (doubleCamp) {
												var text = "";
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
												if (!this._tempName) this._tempName = ui.create.div(".temp-handCard", this);
												let cardname2 = vname,
													cardsuit = get.suit(this);
												let tempname = "",
													tempname2 = get.translation(vname);
												if (vnature) {
													this._tempName.dataset.nature = vnature;
													if (vname == "sha") {
														cardname2 += "_" + vnature;
														tempname2 = get.translation(vnature) + tempname2;
													}
												}
												if (cardsuit == "none" && vname == "sha") {
													cardname2 += "_" + cardsuit;
													tempname = get.translation(cardsuit) + tempname;
												}

												tempname += tempname2;
												this._tempName.style.backgroundImage = 'url("' + lib.assetURL + "extension/十周年UI/image/vcard/" + cardname2 + ".png" + '")';
												//card._tempName.innerHTML = tempname;
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

								if (lib.config.popequip && get.is.phoneLayout() && arguments[0] != "popequip" && ui.arena && ui.arena.classList.contains("selecting") && this.parentNode.classList.contains("popequip")) {
									var rect = this.getBoundingClientRect();
									ui.click.touchpop();
									ui.click.intro.call(this.parentNode, {
										clientX: rect.left + 18,
										clientY: rect.top + 12,
									});
								}
							},
						},
					};

					ride.game = {
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
					};

					ride.get = {
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

					var gameLinexyFunction = game.linexy;
					var swapControlFunction = game.swapControl;
					var swapPlayerFunction = game.swapPlayer;
					var createArenaFunction = ui.create.arena;
					var createPauseFunction = ui.create.pause;
					var initCssstylesFunction = lib.init.cssstyles;

					var cardCopyFunction = lib.element.card.copy;
					var playerAddSkillFunction = lib.element.player.addSkill;
					var playerRemoveSkillFunction = lib.element.player.removeSkill;
					var playerDieFlipFunction = lib.element.player.$dieflip;

					ui.updatejm = function (player, nodes, start, inv) {
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
					};

					ui.updatexr = duilib.throttle(ui.updatex, 100, ui);
					document.body.onresize = ui.updatexr;

					//十周年UI技能排除
					get.skillState = function (player) {
						var skills = base.get.skillState.apply(this, arguments);
						if (game.me != player) {
							var global = (skills.global = skills.global.concat());
							for (var i = global.length - 1; i >= 0; i--) {
								if (global[i].indexOf("decadeUI") >= 0) global.splice(i, 1);
							}
						}
						return skills;
					};

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
								if (!card._tempName) card._tempName = ui.create.div(".temp-handCard", card);
								let cardname2 = cardname,
									cardsuit = get.suit(card);
								let tempname = "",
									tempname2 = get.translation(cardname);
								if (cardnature) {
									card._tempName.dataset.nature = cardnature;
									if (cardname == "sha") {
										cardname2 += "_" + cardnature;
										tempname2 = get.translation(cardnature) + tempname2;
									}
								}
								if (cardsuit == "none" && cardname == "sha") {
									cardname2 += "_" + cardsuit;
									tempname = get.translation(cardsuit) + tempname;
								}

								tempname += tempname2;
								card._tempName.style.backgroundImage = 'url("' + lib.assetURL + "extension/十周年UI/image/vcard/" + cardname2 + ".png" + '")';
								//card._tempName.innerHTML = tempname;
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
					lib.hooks["checkEnd"].push(function decadeUI_UIconfirm() {
						if (ui.confirm && ui.confirm.lastChild.link == "cancel") {
							if (_status.event.type == "phase") {
								if (lib.config["extension_十周年UI_newDecadeStyle"] == "off") {
									var innerHTML;
									if (_status.event.skill) innerHTML = "<image style=width: 80px height 15px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/QX.png>";
									else innerHTML = "<img style='width: 140px;height: 36px' src=" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jscp.png >";
									ui.confirm.lastChild.innerHTML = innerHTML;
								} else {
									const innerHTML = ["on", "decade", "othersOff"].includes(lib.config["extension_十周年UI_newDecadeStyle"]) ? "回合结束" : "结束出牌";
									ui.confirm.lastChild.innerHTML = _status.event.skill ? "取消" : innerHTML;
								}
							}
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

					game.swapPlayer = function (player, player2) {
						var result = swapPlayerFunction.call(this, player, player2);
						/*-----------------分割线-----------------*/
						// 单独装备栏
						if (lib.config.extension_十周年UI_aloneEquip) {
							if (game.me && game.me != ui.equipSolts.me) {
								ui.equipSolts.me.appendChild(ui.equipSolts.equips);
								ui.equipSolts.me = game.me;
								ui.equipSolts.equips = game.me.node.equips;
								ui.equipSolts.appendChild(game.me.node.equips);
								game.me.$syncExpand();
							}
						}

						return result;
					};

					game.swapControl = function (player) {
						var result = swapControlFunction.call(this, player);
						/*-----------------分割线-----------------*/
						// 单独装备栏
						if (lib.config.extension_十周年UI_aloneEquup) {
							if (game.me && game.me != ui.equipSolts.me) {
								ui.equipSolts.me.appendChild(ui.equipSolts.equips);
								ui.equipSolts.me = game.me;
								ui.equipSolts.equips = game.me.node.equips;
								ui.equipSolts.appendChild(game.me.node.equips);
								game.me.$syncExpand();
							}
						}

						return result;
					};

					// game.linexy = function(path) {
					// 	if (!decadeUI.config.playerLineEffect) return gameLinexyFunction.apply(this,
					// 		arguments);
					// 	decadeUI.effect.line(path);
					// };

					ui.click.intro = function (e) {
						if (this.classList.contains("infohidden") || _status.dragged) return;
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

						var uiintro = uiintro || get.nodeintro(this, false, e);
						if (!uiintro) return;
						uiintro.classList.add("popped");
						uiintro.classList.add("static");
						ui.window.appendChild(uiintro);
						var layer = ui.create.div(".poplayer", ui.window);
						var clicklayer = function (e) {
							if (_status.touchpopping) return;
							delete _status.removePop;
							uiintro.delete();
							this.remove();
							ui.historybar.style.zIndex = "";
							delete _status.currentlogv;
							if (!ui.arena.classList.contains("menupaused") && !uiintro.noresume) game.resume2();
							if (e && e.stopPropagation) e.stopPropagation();
							if (uiintro._onclose) {
								uiintro._onclose();
							}
							return false;
						};

						layer.addEventListener(lib.config.touchscreen ? "touchend" : "click", clicklayer);
						if (!lib.config.touchscreen) layer.oncontextmenu = clicklayer;
						if (this.parentNode == ui.historybar && lib.config.touchscreen) {
							var rect = this.getBoundingClientRect();
							e = {
								clientX: 0,
								clientY: rect.top + 30,
							};
						}

						lib.placePoppedDialog(uiintro, e, this);
						if (this.parentNode == ui.historybar) {
							if (lib.config.show_history == "right") {
								uiintro.style.left = ui.historybar.offsetLeft - 230 + "px";
							} else {
								uiintro.style.left = ui.historybar.offsetLeft + 60 + "px";
							}
						}

						uiintro.style.zIndex = 21;
						var clickintro = function () {
							if (_status.touchpopping) return;
							delete _status.removePop;
							layer.remove();
							this.delete();
							ui.historybar.style.zIndex = "";
							delete _status.currentlogv;
							if (!ui.arena.classList.contains("menupaused") && !uiintro.noresume) game.resume2();
							if (uiintro._onclose) {
								uiintro._onclose();
							}
						};
						var currentpop = this;
						_status.removePop = function (node) {
							if (node == currentpop) return false;
							layer.remove();
							uiintro.delete();
							_status.removePop = null;
							return true;
						};
						if (uiintro.clickintro) {
							uiintro.listen(function () {
								_status.clicked = true;
							});
							uiintro._clickintro = clicklayer;
						} else if (!lib.config.touchscreen) {
							uiintro.addEventListener("mouseleave", clickintro);
							uiintro.addEventListener("click", clickintro);
						} else if (uiintro.touchclose) {
							uiintro.listen(clickintro);
						}
						uiintro._close = clicklayer;

						game.pause2();
						return uiintro;
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

							if (["on", "othersOff", "decade"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
								if (lib.config.mode === "identity" && get.config("identity_mode") === "normal") {
									identityList = {
										cai: "猜",
										nei: "内",
										fan: "反",
										zhong: "忠",
									};
								}
								if (!dui.$identityMarkBox) {
									if (lib.config.mode === "identity" && get.config("identity_mode") === "normal") {
										dui.$identityMarkBox = decadeUI.element.create("identity-mark-box2");
									} else {
										dui.$identityMarkBox = decadeUI.element.create("identity-mark-box");
									}
									dui.$identityMarkBox.ondeactive = function () {
										dui.$identityMarkBox.remove();
										_status.clicked = false;
										if (!ui.arena.classList.contains("menupaused")) game.resume2();
									};
								}

								var index = 0;
								var node;
								var nodes = dui.$identityMarkBox.childNodes;
								for (key in identityList) {
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
								//以下萌老没有，可以注释
							} else if (["off", "othersOn"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
								if (!dui.$identityMarkBox) {
									dui.$identityMarkBox = decadeUI.element.create("identity-mark-box");
									//身份场身份标记框位置调整
									if (get.mode() == "identity") {
										dui.$identityMarkBox.style.width = "100%";
										dui.$identityMarkBox.style.height = "100%";
										dui.$identityMarkBox.style.top = "0%";
										dui.$identityMarkBox.style.left = "1%";
									}
									// 国战势力标记框位置调整
									if (get.mode() == "guozhan") {
										dui.$identityMarkBox.style.width = "100%";
										dui.$identityMarkBox.style.height = "100%";
										dui.$identityMarkBox.style.top = "0%";
										dui.$identityMarkBox.style.left = "1%";
									}
									// 谋攻篇模式身份标记框位置调整（预更新）
									if (get.mode() == "th_mougong") {
										dui.$identityMarkBox.style.width = "100%";
										dui.$identityMarkBox.style.height = "100%";
										dui.$identityMarkBox.style.top = "0%";
										dui.$identityMarkBox.style.left = "1%";
									}

									dui.$identityMarkBox.ondeactive = function () {
										dui.$identityMarkBox.remove();
										_status.clicked = false;
										if (!ui.arena.classList.contains("menupaused")) game.resume2();
									};
								}

								var index = 0;
								var node;
								var nodes = dui.$identityMarkBox.childNodes;
								for (key in identityList) {
									node = nodes[index];
									if (!node) {
										node = decadeUI.element.create("identity-mark-item", dui.$identityMarkBox);
										if (get.mode() == "guozhan") {
											node.style.width = "30%";
											node.style.height = "25%";
											node.style.margin = "5% 5%";
										}
										if (lib.config.mode == "identity" && get.config("identity_mode") != "zhong") {
											node.style.width = "30%";
											node.style.height = "25%";
											node.style.margin = "16.5% 7%";
										}
										if (lib.config.mode == "identity" && get.config("identity_mode") == "zhong") {
											node.style.width = "30%";
											node.style.height = "25%";
											node.style.margin = "5.5% 7%";
										}
										if (get.mode() == "th_mougong") {
											node.style.width = "30%";
											node.style.height = "25%";
											node.style.margin = "0% 5%";
										}
										node.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
											this.player.setIdentity(this.link);
											dui.$identityMarkBox.remove();
											_status.clicked = false;
										});
									} else {
										node.style.display = "";
									}

									var extensionPath = lib.assetURL + "extension/十周年UI/";
									var url = extensionPath + "image/decorations/identity2_" + key + ".png";
									if (get.mode() == "guozhan") url = extensionPath + "image/decorations/name_" + key + ".png";
									node.style.backgroundImage = 'url("' + url + '")';
									node.link = key;
									node.player = this.parentNode;
									//	node.innerText = identityList[key];
									index++;
									//萌老结束
								}
								//同上
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
						} //注释结束
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

					ui.create.pause = function () {
						var dialog = createPauseFunction.call(this);
						dialog.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
						return dialog;
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

					ui.create.arena = function () {
						ui.updatez();
						var result = createArenaFunction.apply(this, arguments);
						ui.arena.classList.remove("slim_player");
						ui.arena.classList.remove("uslim_player");
						ui.arena.classList.remove("mslim_player");
						ui.arena.classList.remove("lslim_player");
						ui.arena.classList.remove("oldlayout");
						ui.arena.classList.remove("mobile");
						ui.arena.classList.add("decadeUI");
						ui.control.id = "dui-controls";

						decadeUI.config.update();
						return result;
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
						/*
			decadeUI.element.create('icon icon-treasure', decadeUI.element.create('equip0', equipSolts.back));
			decadeUI.element.create('icon icon-saber', decadeUI.element.create('equip1', equipSolts.back));
			decadeUI.element.create('icon icon-shield', decadeUI.element.create('equip2', equipSolts.back));
			decadeUI.element.create('icon icon-mount', decadeUI.element.create('equip3', equipSolts.back));
			decadeUI.element.create('icon icon-mount', decadeUI.element.create('equip4', equipSolts.back));
			*/
						for (var repetition = 0; repetition < 5; repetition++) {
							var ediv = decadeUI.element.create(null, equipSolts.back);
							ediv.dataset.type = repetition;
						}

						ui.arena.insertBefore(equipSolts, ui.me);
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
							storage: {},
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

						//if (lib.config.equip_span) {
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
						//}

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
									if (decadeUI.config.campIdentityImageMode) {
										this.style.visibility = "hidden";
										var image = new Image();
										image.node = this;
										image.onerror = function () {
											this.node.style.visibility = "";
										};

										/*-----------------分割线-----------------*/
										// 不同样式身份标记
										if (lib.config.extension_十周年UI_newDecadeStyle == "onlineUI") {
											image.src = decadeUIPath + "image/decorations/identity2_" + filename + ".png";
										} else if (lib.config.extension_十周年UI_newDecadeStyle == "babysha") {
											image.src = decadeUIPath + "image/decorationh/identity3_" + filename + ".png";
										} else if (["on", "othersOff", "decade"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
											image.src = decadeUIPath + "image/decoration/identity_" + filename + ".png";
										} else if (["off", "othersOn"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
											image.src = decadeUIPath + "image/decorations/identity2_" + filename + ".png";
											if (lib.config.mode === "versus") {
												var first2four = _status.firstAct == player || _status.firstAct.previous == player;
												var two2three = _status.firstAct.next == player || _status.firstAct.next.next == player;
												if (two2three) {
													if (document.getElementsByClassName("DragonTigerframe")[player.dataset.position]) document.getElementsByClassName("DragonTigerframe")[player.dataset.position].src = decadeUIPath + "/assets/image/game_tiger_frame.png";
													else {
														var yh = document.createElement("img");
														yh.classList.add("DragonTigerframe");
														yh.src = decadeUIPath + "/assets/image/game_tiger_frame.png";
														yh.style.cssText = "pointer-events:none";
														yh.style.display = "block";
														yh.style.position = "absolute";
														yh.style.top = "-10px";
														yh.style.left = "0px";
														yh.style.height = "184px";
														yh.style.width = "139px";
														yh.style.zIndex = "71";
														player.appendChild(yh);
													}
												}
												if (first2four) {
													if (document.getElementsByClassName("DragonTigerframe")[player.dataset.position]) document.getElementsByClassName("DragonTigerframe")[player.dataset.position].src = decadeUIPath + "/assets/image/game_dragon_frame.png";
													else {
														var yh = document.createElement("img");
														yh.classList.add("DragonTigerframe");
														yh.src = decadeUIPath + "/assets/image/game_dragon_frame.png";
														yh.style.cssText = "pointer-events:none";
														yh.style.display = "block";
														yh.style.position = "absolute";
														yh.style.top = "-10px";
														yh.style.left = "-1px";
														yh.style.height = "184px";
														yh.style.width = "139px";
														yh.style.zIndex = "71";
														player.appendChild(yh);
													}
												}
												if (first2four) image.src = decadeUIPath + "image/decorations/identity2_dragon.png";
												else if (two2three) image.src = decadeUIPath + "image/decorations/identity2_tiger.png";
												else image.src = decadeUIPath + "image/decorations/identity2_" + filename + ".png";
											}
										} else {
											image.src = decadeUIPath + "image/decorations/identity2_" + filename + ".png";
										}
										this.parentNode.style.backgroundImage = 'url("' + image.src + '")';
									} else {
										this.style.visibility = "";
									}
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

						if (["on", "othersOff", "decade"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
							var cardWrap = player.$cardCount;
						}

						player.insertBefore(campWrap, player.node.name);
						player.insertBefore(hpWrap, player.node.hp);

						player.node.campWrap = campWrap;
						player.node.hpWrap = hpWrap;
						if (["on", "othersOff", "decade"].includes(lib.config.extension_十周年UI_newDecadeStyle)) {
							player.node.cardWrap = cardWrap;
						}

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
										//var info = lib.skill[skill];
										//if (!info || info.charlotte || info.sub || (info.mark && !info.limited) || (info.nopop || info.popup === false)) return;
										//if (info.onremove && game.me != this.player.storage[skill]) return;

										sender.skills.push(skill);
										var html = "";
										for (var i = 0; i < sender.skills.length; i++) {
											/*-----------------分割线-----------------*/
											if (lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff") {
												html += "[" + lib.translate[sender.skills[i]] + "]";
											} else {
												html += "" + lib.translate[sender.skills[i]] + " ";
											}
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
											if (lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff") {
												html += "[" + lib.translate[sender.skills[i]] + "]";
											} else {
												html += "" + lib.translate[sender.skills[i]] + " ";
											}
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
						//	card.$suitnum.$num.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
						card.$suitnum.$br = decadeUI.element.create(null, card.$suitnum, "br");
						card.$suitnum.$suit = decadeUI.element.create("suit", card.$suitnum, "span");
						//	card.$suitnum.$suit.style.fontFamily = '"STHeiti","SimHei","Microsoft JhengHei","Microsoft YaHei","WenQuanYi Micro Hei",Helvetica,Arial,sans-serif';
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

					lib.init.cssstyles = function () {
						var temp = lib.config.glow_phase;
						lib.config.glow_phase = "";
						initCssstylesFunction.call(this);
						lib.config.glow_phase = temp;
						ui.css.styles.sheet.insertRule('.avatar-name, .avatar-name-default { font-family: "' + (lib.config.name_font || "xinkai") + '", "xinwei" }', 0);
					};

					lib.init.layout = function (layout, nosave) {
						if (!nosave) game.saveConfig("layout", layout);
						game.layout = layout;

						var relayout = function () {
							ui.arena.dataset.layout = game.layout;
							if (get.is.phoneLayout()) {
								ui.css.phone.href = lib.assetURL + "layout/default/phone.css";
								ui.arena.classList.add("phone");
							} else {
								ui.css.phone.href = "";
								ui.arena.classList.remove("phone");
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

					lib.element.content.chooseToCompare = function () {
						"step 0";
						if (((!event.fixedResult || !event.fixedResult[player.playerid]) && player.countCards("h") == 0) || ((!event.fixedResult || !event.fixedResult[target.playerid]) && target.countCards("h") == 0)) {
							event.result = {
								cancelled: true,
								bool: false,
							};
							event.finish();
							return;
						}
						game.log(player, "对", target, "发起拼点");
						if (!event.filterCard) event.filterCard = lib.filter.all;
						// 更新拼点框
						event.compareName = event.getParent()?.name === "trigger" ? event.name : event.getParent().name;
						event.addMessageHook("finished", function () {
							var dialog = ui.dialogs[this.compareName];
							if (dialog) dialog.close();
						});
						game.broadcastAll(
							function (player, target, eventName) {
								if (!window.decadeUI) return;
								var dialog = decadeUI.create.compareDialog();
								dialog.caption = get.translation(eventName) + "拼点";
								dialog.player = player;
								dialog.target = target;
								dialog.open();
								decadeUI.delay(400);
								ui.dialogs[eventName] = dialog;
							},
							player,
							target,
							event.compareName
						);
						("step 1");
						event.list = [player, target].filter(function (current) {
							return !event.fixedResult || !event.fixedResult[current.playerid];
						});
						if (event.list.length) {
							player.chooseCardOL(event.list, "请选择拼点牌", true).set("filterCard", event.filterCard).set("type", "compare").set("ai", event.ai).set("source", player).aiCard = function (target) {
								var hs = target.getCards("h");
								var event = _status.event;
								event.player = target;
								hs.sort(function (a, b) {
									return event.ai(b) - event.ai(a);
								});
								delete event.player;
								return {
									bool: true,
									cards: [hs[0]],
								};
							};
						}
						("step 2");
						const lose_list = [];
						if (event.fixedResult && event.fixedResult[player.playerid]) {
							lose_list.push([player, [event.fixedResult[player.playerid]]]);
						} else {
							if (result[0].skill && lib.skill[result[0].skill] && lib.skill[result[0].skill].onCompare) {
								player.logSkill(result[0].skill);
								result[0].cards = lib.skill[result[0].skill].onCompare(player);
							}
							lose_list.push([player, result[0].cards]);
						}
						event.card1 = lose_list[0][1][0];
						// 更新拼点框
						game.broadcastAll(function (eventName) {
							if (!window.decadeUI) return;
							var dialog = ui.dialogs[eventName];
							dialog.$playerCard.classList.add("infohidden");
							dialog.$playerCard.classList.add("infoflip");
						}, event.compareName);
						if (event.list.includes(target)) {
							let index = event.list.indexOf(target);
							if (result[index].skill && lib.skill[result[index].skill] && lib.skill[result[index].skill].onCompare) {
								target.logSkill(result[index].skill);
								result[index].cards = lib.skill[result[index].skill].onCompare(target);
							}
							lose_list.push([target, result[index].cards]);
						} else if (event.fixedResult && event.fixedResult[target.playerid]) {
							lose_list.push([target, [event.fixedResult[target.playerid]]]);
						}
						event.card2 = lose_list[1][1][0];
						// 更新拼点框
						game.broadcastAll(function (eventName) {
							if (!window.decadeUI) return;
							var dialog = ui.dialogs[eventName];
							dialog.$playerCard.classList.add("infohidden");
							dialog.$playerCard.classList.add("infoflip");
						}, event.compareName);
						event.lose_list = lose_list;
						("step 3");
						if (event.card2.number >= 10 || event.card2.number <= 4) {
							if (target.countCards("h") > 2) event.addToAI = true;
						}
						("step 4");
						if (event.lose_list.length) {
							game.loseAsync({
								lose_list: event.lose_list,
							}).setContent("chooseToCompareLose");
						}
						("step 5");
						event.trigger("compareCardShowBefore");
						("step 6");
						// 更新拼点框
						game.broadcastAll(
							function (eventName, player, target, playerCard, targetCard) {
								ui.arena.classList.add("thrownhighlight");
								if (!window.decadeUI) {
									ui.arena.classList.add("thrownhighlight");
									player.$compare(playerCard, target, targetCard);
									return;
								}
								var dialog = ui.dialogs[eventName];
								dialog.playerCard = playerCard.copy();
								dialog.targetCard = targetCard.copy();
							},
							event.compareName,
							player,
							target,
							event.card1,
							event.card2
						);
						game.addVideo("thrownhighlight1");
						game.log(player, "的拼点牌为", event.card1);
						game.log(target, "的拼点牌为", event.card2);
						var getNum = function (card) {
							for (var i of event.lose_list) {
								if (i[1].includes(card)) return get.number(card, i[0]);
							}
							return get.number(card, false);
						};
						event.num1 = getNum(event.card1);
						event.num2 = getNum(event.card2);
						event.trigger("compare");
						decadeUI.delay(400);
						("step 7");
						event.result = {
							player: event.card1,
							target: event.card2,
							num1: event.num1,
							num2: event.num2,
						};
						event.trigger("compareFixing");
						("step 8");
						var str;
						if (event.forceWinner === player || (event.forceWinner !== target && event.num1 > event.num2)) {
							event.result.bool = true;
							event.result.winner = player;
							str = get.translation(player) + "拼点成功";
							player.popup("胜");
							target.popup("负");
						} else {
							event.result.bool = false;
							str = get.translation(player) + "拼点失败";
							if (event.forceWinner !== target && event.num1 == event.num2) {
								event.result.tie = true;
								player.popup("平");
								target.popup("平");
							} else {
								event.result.winner = target;
								player.popup("负");
								target.popup("胜");
							}
						}
						// 更新拼点框
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
							str,
							event.compareName,
							event.result.bool
						);
						decadeUI.delay(1800);
						("step 9");
						if (typeof event.target.ai.shown == "number" && event.target.ai.shown <= 0.85 && event.addToAI) {
							event.target.ai.shown += 0.1;
						}
						game.broadcastAll(function () {
							ui.arena.classList.remove("thrownhighlight");
						});
						game.addVideo("thrownhighlight2");
						if (event.clear !== false) {
							game.broadcastAll(ui.clear);
						}
						if (typeof event.preserve == "function") {
							event.preserve = event.preserve(event.result);
						} else if (event.preserve == "win") {
							event.preserve = event.result.bool;
						} else if (event.preserve == "lose") {
							event.preserve = !event.result.bool;
						}
					};

					lib.element.content.chooseToCompareMultiple = function () {
						"step 0";
						event.forceDie = true;
						if (player.countCards("h") == 0) {
							event.result = {
								cancelled: true,
								bool: false,
							};
							event.finish();
							return;
						}
						for (var i = 0; i < targets.length; i++) {
							if (targets[i].countCards("h") == 0) {
								event.result = {
									cancelled: true,
									bool: false,
								};
								event.finish();
								return;
							}
						}
						if (!event.multitarget) {
							targets.sort(lib.sort.seat);
						}
						game.log(player, "对", targets, "发起拼点");
						if (!event.filterCard) event.filterCard = lib.filter.all;
						// 更新拼点框
						event.compareName = event.getParent()?.name === "trigger" ? event.name : event.getParent().name;
						event.addMessageHook("finished", function () {
							var dialog = ui.dialogs[this.compareName];
							if (dialog) dialog.close();
						});
						game.broadcastAll(
							function (player, target, eventName) {
								if (!window.decadeUI) return;
								var dialog = decadeUI.create.compareDialog();
								dialog.caption = get.translation(eventName) + "拼点";
								dialog.player = player;
								dialog.target = target;
								dialog.open();
								decadeUI.delay(400);
								ui.dialogs[eventName] = dialog;
							},
							player,
							targets[0],
							event.compareName
						);
						("step 1");
						event._result = [];
						event.list = targets.filter(function (current) {
							return !event.fixedResult || !event.fixedResult[current.playerid];
						});
						if (event.list.length || !event.fixedResult || !event.fixedResult[player.playerid]) {
							if (!event.fixedResult || !event.fixedResult[player.playerid]) event.list.unshift(player);
							player.chooseCardOL(event.list, "请选择拼点牌", true).set("filterCard", event.filterCard).set("type", "compare").set("ai", event.ai).set("source", player).aiCard = function (target) {
								var hs = target.getCards("h");
								var event = _status.event;
								event.player = target;
								hs.sort(function (a, b) {
									return event.ai(b) - event.ai(a);
								});
								delete event.player;
								return {
									bool: true,
									cards: [hs[0]],
								};
							};
						}
						("step 2");
						var cards = [];
						var lose_list = [];
						event.lose_list = lose_list;
						event.getNum = function (card) {
							for (var i of event.lose_list) {
								if (i[1].includes(card)) return get.number(card, i[0]);
							}
							return get.number(card, false);
						};
						if (event.fixedResult && event.fixedResult[player.playerid]) {
							event.list.unshift(player);
							result.unshift({
								bool: true,
								cards: [event.fixedResult[player.playerid]],
							});
							lose_list.push([player, [event.fixedResult[player.playerid]]]);
						} else {
							if (result[0].skill && lib.skill[result[0].skill] && lib.skill[result[0].skill].onCompare) {
								player.logSkill(result[0].skill);
								result[0].cards = lib.skill[result[0].skill].onCompare(player);
							} else lose_list.push([player, result[0].cards]);
						}
						for (var j = 0; j < targets.length; j++) {
							if (event.list.includes(targets[j])) {
								var i = event.list.indexOf(targets[j]);
								if (result[i].skill && lib.skill[result[i].skill] && lib.skill[result[i].skill].onCompare) {
									event.list[i].logSkill(result[i].skill);
									result[i].cards = lib.skill[result[i].skill].onCompare(event.list[i]);
								} else lose_list.push([targets[j], result[i].cards]);
								cards.push(result[i].cards[0]);
							} else if (event.fixedResult && event.fixedResult[targets[j].playerid]) {
								cards.push(event.fixedResult[targets[j].playerid]);
								lose_list.push([targets[j], [event.fixedResult[targets[j].playerid]]]);
							}
						}
						if (lose_list.length) {
							game.loseAsync({
								lose_list: lose_list,
							}).setContent("chooseToCompareLose");
						}
						event.cardlist = cards;
						event.cards = cards;
						event.card1 = result[0].cards[0];
						event.num1 = event.getNum(event.card1);
						event.iwhile = 0;
						event.result = {
							player: event.card1,
							targets: event.cardlist.slice(0),
							num1: [],
							num2: [],
						};
						("step 3");
						event.trigger("compareCardShowBefore");
						("step 4");
						game.log(player, "的拼点牌为", event.card1);
						// 更新拼点框
						game.broadcastAll(
							function (eventName, playerCard) {
								if (!window.decadeUI) return;
								var dialog = ui.dialogs[eventName];
								dialog.playerCard = playerCard.copy();
							},
							event.compareName,
							event.card1
						);
						("step 5");
						if (event.iwhile < targets.length) {
							event.target = targets[event.iwhile];
							event.card2 = event.cardlist[event.iwhile];
							event.num2 = event.getNum(event.card2);
							game.log(event.target, "的拼点牌为", event.card2);
							player.line(event.target);
							// 更新拼点框
							game.broadcastAll(
								function (eventName, player, target, playerCard, targetCard) {
									if (!window.decadeUI) {
										player.$compare(playerCard, target, targetCard);
										return;
									}
									var dialog = ui.dialogs[eventName];
									dialog.show();
									dialog.target = target;
									dialog.targetCard = targetCard.copy();
								},
								event.compareName,
								player,
								event.target,
								event.card1,
								event.card2
							);
							event.trigger("compare");
							decadeUI.delay(400);
						} else {
							// 更新拼点框
							game.broadcastAll(function (eventName) {
								if (!window.decadeUI) return;

								var dialog = ui.dialogs[eventName];
								dialog.close();
								setTimeout(
									function (dialog) {
										dialog.player.$throwordered2(dialog.playerCard, true);
									},
									110,
									dialog
								);
							}, event.compareName);
							event.goto(10);
						}
						("step 6");
						event.iiwhile = event.iwhile;
						delete event.iwhile;
						event.trigger("compareFixing");
						("step 7");
						event.result.num1[event.iiwhile] = event.num1;
						event.result.num2[event.iiwhile] = event.num2;
						var str, result;
						if (event.forceWinner === player || (event.forceWinner !== target && event.num1 > event.num2)) {
							result = true;
							event.winner = player;
							str = get.translation(player) + "拼点成功";
							player.popup("胜");
							target.popup("负");
						} else {
							result = false;
							str = get.translation(player) + "拼点失败";
							if (event.forceWinner !== target && event.num1 == event.num2) {
								player.popup("平");
								target.popup("平");
							} else {
								event.winner = target;
								player.popup("负");
								target.popup("胜");
							}
						}
						// 更新拼点框
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
										dialog.hide();
										dialog.$playerCard.dataset.result = "";
										setTimeout(
											function (dialog) {
												dialog.target.$throwordered2(dialog.targetCard, true);
											},
											180,
											dialog
										);
									},
									1400,
									dialog,
									eventName
								);
							},
							str,
							event.compareName,
							result
						);
						decadeUI.delay(1800);
						("step 8");
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
						("step 9");
						delete event.winner;
						delete event.forceWinner;
						event.iwhile = event.iiwhile + 1;
						event.goto(5);
						("step 10");
						game.broadcastAll(ui.clear);
						event.cards.add(event.card1);
					};

					lib.element.content.chooseToGuanxing = function () {
						"step 0";
						if (player.isUnderControl()) game.modeSwapPlayer(player);
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
						("step 1");
						var [top, bottom] = [event.cards1, event.cards2];
						event.result = {
							bool: true,
							moved: [top, bottom],
						};
						game.addCardKnower(top, player);
						game.addCardKnower(bottom, player);
						player.popup(get.cnNumber(event.num1) + "上" + get.cnNumber(event.num2) + "下");
						game.logv(player, "将" + get.cnNumber(event.num1) + "张牌置于牌堆顶，" + get.cnNumber(event.num2) + "张牌置于牌堆底");
						game.updateRoundNumber();
					};

					lib.element.player.setIdentity = function (identity) {
						if (!identity) identity = this.identity;

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
					};

					lib.element.player.addSkill = function (skill) {
						var skill = playerAddSkillFunction.apply(this, arguments);
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
						return skill;
					};

					lib.element.player.removeSkill = function (skill) {
						var skill = playerRemoveSkillFunction.apply(this, arguments);
						if (!Array.isArray(skill)) {
							if (this.node.gainSkill.skills && this.node.gainSkill.skills.includes(skill)) {
								this.node.gainSkill.lose(skill);
							}
						}
						return skill;
					};

					lib.element.player.getState = function () {
						var state = base.lib.element.player.getState.apply(this, arguments);
						state.seat = this.seat;
						return state;
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
								if (!decadeUI.config.campIdentityImageMode) {
									if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
									else {
										const name = get.translation(this._finalGroup),
											str = get.plainText(name);
										if (str.length <= 2) this.node.campWrap.node.campName.innerHTML = name;
										else this.node.campWrap.node.campName.innerHTML = name.replaceAll(str, str[0]);
									}
									return;
								}
								var image = new Image();
								var url = decadeUIPath + (decadeUI.config.newDecadeStyle == "off" ? "image/decorations/name2_" : "image/decoration/name_") + group + ".png";
								this._finalGroup = group;
								image.onerror = () => {
									if (!this._finalGroup) this.node.campWrap.node.campName.innerHTML = "";
									else {
										const name = get.translation(this._finalGroup),
											str = get.plainText(name);
										if (str.length <= 2) this.node.campWrap.node.campName.innerHTML = name;
										else this.node.campWrap.node.campName.innerHTML = name.replaceAll(str, str[0]);
									}
								};
								this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
								image.src = url;
							},
						},
					});

					lib.element.player.setModeState = function (info) {
						if (info && info.seat) {
							if (!this.node.seat) this.node.seat = decadeUI.element.create("seat", this);
							this.node.seat.innerHTML = get.cnNumber(info.seat, true);
						}

						if (base.lib.element.player.setModeState) {
							return base.lib.element.player.setModeState.apply(this, arguments);
						} else {
							return this.init(info.name, info.name2);
						}
					};

					lib.element.player.$damagepop = function (num, nature, font, nobroadcast) {
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
								if (num == Infinity) {
									num = "+∞";
								} else if (num == -Infinity) {
									num = "-∞";
								} else if (num > 0) {
									num = "";
								} else if (num < 0) {
									num = "";
								}
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
					};

					lib.element.player.$dieflip = function () {
						if (!decadeUI.config.playerDieEffect && playerDieFlipFunction) playerDieFlipFunction.apply(this, arguments);
					};

					lib.element.player.$compare = function (card1, target, card2) {
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
					};

					lib.element.player.$compareMultiple = function (card1, targets, cards) {
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
					};

					lib.element.card.copy = function () {
						var clone = cardCopyFunction.apply(this, arguments);
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
					};
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
							// xStart += (limitW - totalW) / 2; //居中
							// xStart += (limitW - totalW) / 1; //靠右
							xStart += 0; //靠左
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
						var cs = bounds.cardScale;

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
					delayClear() {
						var timestamp = 500;
						var nowTime = new Date().getTime();
						if (this._delayClearTimeout) {
							clearTimeout(this._delayClearTimeout);
							timestamp = nowTime - this._delayClearTimeoutTime;
							if (timestamp > 1000) {
								this._delayClearTimeout = null;
								this._delayClearTimeoutTime = null;
								ui.clear();
								return;
							}
						} else {
							this._delayClearTimeoutTime = nowTime;
						}

						this._delayClearTimeout = setTimeout(function () {
							decadeUI.layout._delayClearTimeout = null;
							decadeUI.layout._delayClearTimeoutTime = null;
							ui.clear();
						}, timestamp);
					},
					invalidate() {
						this.invalidateHand();
						this.invalidateDiscard();
					},
					invalidateHand(debugName) {
						//和上下面的有点重复，有空合并
						var timestamp = 40;
						var nowTime = new Date().getTime();
						if (this._handcardTimeout) {
							clearTimeout(this._handcardTimeout);
							timestamp = nowTime - this._handcardTimeoutTime;
							if (timestamp > 180) {
								this._handcardTimeout = null;
								this._handcardTimeoutTime = null;
								this.updateHand();
								return;
							}
						} else {
							this._handcardTimeoutTime = nowTime;
						}

						this._handcardTimeout = setTimeout(function () {
							decadeUI.layout._handcardTimeout = null;
							decadeUI.layout._handcardTimeoutTime = null;
							decadeUI.layout.updateHand();
						}, timestamp);
					},
					invalidateDiscard() {
						var timestamp = ui.thrown && ui.thrown.length > 15 ? 80 : 40;
						var nowTime = new Date().getTime();
						if (this._discardTimeout) {
							clearTimeout(this._discardTimeout);
							timestamp = nowTime - this._discardTimeoutTime;
							if (timestamp > 180) {
								this._discardTimeout = null;
								this._discardTimeoutTime = null;
								this.updateDiscard();
								return;
							}
						} else {
							this._discardTimeoutTime = nowTime;
						}

						this._discardTimeout = setTimeout(function () {
							decadeUI.layout._discardTimeout = null;
							decadeUI.layout._discardTimeoutTime = null;
							decadeUI.layout.updateDiscard();
						}, timestamp);
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
					return Math.min((bodySize.height * (decadeUI.isMobile() ? 0.23 : 0.18)) / size.height, 1);
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
									identity = (player.special_identity ? player.special_identity : identity).replace(/identity_/, "");
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
								if (identity.indexOf("cai") < 0) {
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
				clone(element) {},
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
			};

			decadeUI.config = config;
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
			//发动技能函数
			var shoushaUI = lib.element.player.trySkillAnimate;
			lib.element.player.trySkillAnimate = function (name, popname, checkShow) {
				shoushaUI.apply(this, arguments);
				var that = this;
				//------技能进度条------------//
				if (lib.config["extension_十周年UI_enable"] && lib.config.extension_十周年UI_jindutiao == true) {
					if (!document.querySelector("#jindutiaopl") && that == game.me) {
						game.Jindutiaoplayer();
					} else if (that != game.me) {
						var ab = that.getElementsByClassName("timeai"); //进度条
						var cd = that.getElementsByClassName("tipshow"); //阶段，出牌提示条
						var ef = that.getElementsByClassName("tipskill"); //技能提示条

						//-------初始化-----//
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
						if (cd[0]) cd[0].parentNode.removeChild(cd[0]);
						if (ef[0]) ef[0].parentNode.removeChild(ef[0]);

						game.JindutiaoAIplayer();
						window.boxContentAI.classList.add("timeai");
						that.appendChild(window.boxContentAI);

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
			};
			//武将搜索代码摘抄至扩展ol
			var kzol_create_characterDialog = ui.create.characterDialog;
			ui.create.characterDialog = function () {
				var dialog = kzol_create_characterDialog.apply(this, arguments);
				const control = lib.config.extension_十周年UI_mx_decade_characterDialog || "default";
				if (control != "default") {
					const Searcher = dialog.querySelector(".searcher.caption");
					if (Searcher) Searcher.parentNode.removeChild(Searcher);
					if (control == "extension-OL-system") {
						var content_container = dialog.childNodes[0];
						var content = content_container.childNodes[0];
						var switch_con = content.childNodes[0];
						var buttons = content.childNodes[1];
						var div = ui.create.div("extension-OL-system");
						div.style.height = "35px";
						div.style.width = "calc(100%)";
						div.style.top = "-2px";
						div.style.left = "0px";
						div.style["white-space"] = "nowrap";
						div.style["text-align"] = "center";
						div.style["line-height"] = "26px";
						div.style["font-size"] = "24px";
						div.style["font-family"] = "xinwei";
						div.innerHTML = "搜索：" + '<select size="1" style="width:75px;height:21px;">' + '<option value="name">名称翻译</option>' + '<option value="name1">名称ID</option>' + '<option value="name2">名称ID(精确匹配)</option>' + '<option value="skill">技能翻译</option>' + '<option value="skill1">技能ID</option>' + '<option value="skill2">技能ID(精确匹配)</option>' + '<option value="skill3">技能描述/翻译</option>' + "→" + '<input type="text" style="width:150px;"></input>' + "</select>";
						var input = div.querySelector("input");
						input.placeholder = "非精确匹配支持正则搜索";
						input.onkeydown = function (e) {
							e.stopPropagation();
							if (e.keyCode == 13) {
								var value = this.value;
								if (value == "") {
									game.alert("搜索不能为空");
									input.focus();
									return;
								}
								var choice = div.querySelector("select").options[div.querySelector("select").selectedIndex].value;
								if (value) {
									for (var i = 0; i < buttons.childNodes.length; i++) {
										buttons.childNodes[i].classList.add("nodisplay");
										var name = buttons.childNodes[i].link;
										var skills = get.character(name).skills || [];
										if (
											(function (choice, value, name, skills) {
												if (choice.endsWith("2")) return choice === "name2" ? value === name : skills.includes(value);
												value = new RegExp(value, "g");
												const goon = (value, text) => text && value.test(text);
												if (choice == "name1") return goon(value, name);
												else if (choice == "name") return goon(value, get.translation(name)) || goon(value, get.translation(name + "_ab"));
												else if (choice == "skill1") return skills.some(skill => goon(value, skill));
												else if (choice == "skill") return skills.some(skill => goon(value, get.translation(skill)));
												else return skills.some(skill => goon(value, get.translation(skill + "_info")));
											})(choice, value, name, skills)
										) {
											buttons.childNodes[i].classList.remove("nodisplay");
										}
									}
								}
								if (dialog.paginationMaxCount.get("character")) {
									const buttons = dialog.content.querySelector(".buttons");
									const p = dialog.paginationMap.get(buttons);
									if (p) {
										const array = dialog.buttons.filter(item => !item.classList.contains("nodisplay"));
										p.state.data = array;
										p.setTotalPageCount(Math.ceil(array.length / dialog.paginationMaxCount.get("character")));
									}
								}
							}
						};
						input.onmousedown = function (e) {
							e.stopPropagation();
						};
						switch_con.insertBefore(div, switch_con.firstChild);
					}
				}
				return dialog;
			};
			/*-------转换技，阴阳标记等----*/
			//修改changezhuanhuanji函数
			var originchangeZhuanhuanji = lib.element.player.$changeZhuanhuanji;
			lib.element.player.$changeZhuanhuanji = function (skill) {
				originchangeZhuanhuanji.apply(this, arguments);
				if (!get.is.zhuanhuanji(skill, this)) return;
				var mark = this.node.xSkillMarks.querySelector('[data-id="' + skill + '"]');
				var num = this.countMark(skill);
				var url = lib.assetURL + "extension/十周年UI/shoushaUI/skill/images/" + skill + "_yang.png";

				function ImageIsExist(url) {
					let xmlHttp = new XMLHttpRequest();
					xmlHttp.open("Get", url, false);
					xmlHttp.send();
					if (xmlHttp.status === 404) return false;
					else return true;
				}
				try {
					var a = ImageIsExist(url);
					if (a) mark.dk = true;
				} catch (err) {
					if (mark) mark.dk = false;
				}
				if (mark) {
					if (lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff" || lib.config.extension_十周年UI_newDecadeStyle == "onlineUI" || lib.config.extension_十周年UI_newDecadeStyle == "babysha") {
						if (mark.classList.contains("yin")) {
							mark.classList.remove("yin");
							mark.classList.toggle("yang");
						} else {
							if (mark.classList.contains("yang")) mark.classList.remove("yang");
							mark.classList.toggle("yin");
						}
					} else {
						if (mark.dd == true) {
							this.yingSkill(skill);
							mark.dd = false;
							if (mark.dk) {
								mark.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/" + skill + "_yang.png");
							} else {
								mark.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/ditu_yang.png");
							}
						} else {
							this.yangSkill(skill);
							mark.dd = true;
							if (mark.dk) {
								mark.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/" + skill + "_ying.png");
							} else {
								mark.setBackgroundImage("extension/十周年UI/shoushaUI/skill/images/ditu_ying.png");
							}
						}
					}
				}
			};
			//修改技能按钮
			//定义两个空集合阳按钮和阴按钮（别问为啥阴不是yin而是ying，问就是拿yang复制比较简单）
			lib.element.player.yangedSkills = [];
			lib.element.player.yingedSkills = [];
			//定义阴函数，将技能加入阴集合，并删除阳集合里的该技能。
			lib.element.player.yangSkill = function (skill) {
				var player = this;
				game.broadcastAll(
					function (player, skill) {
						player.$yangSkill(skill);
					},
					player,
					skill
				);
			};
			lib.element.player.$yangSkill = function (skill) {
				this.yangedSkills.add(skill);
				this.yingedSkills.remove(skill);
			};
			//阳函数同理
			lib.element.player.yingSkill = function (skill) {
				var player = this;
				game.broadcastAll(
					function (player, skill) {
						player.$yingSkill(skill);
					},
					player,
					skill
				);
			};
			lib.element.player.$yingSkill = function (skill) {
				this.yingedSkills.add(skill);
				this.yangedSkills.remove(skill);
			};
			//添加failskill函数
			//这是失败函数，添加到使命技的失败分支里，作用是为使命技的class样式添加一个后缀fail，这样在使命技失败的时候创建的标记就会是白底和一个x（类似限定技使用后），而使命技成功的标记就会是红底。
			lib.element.player.failSkill = function (skill) {
				var player = this;
				game.broadcastAll(
					function (player, skill) {
						player.$failSkill(skill);
					},
					player,
					skill
				);
			};
			lib.element.player.$failSkill = function (skill) {
				var mark = this.node.xSkillMarks.querySelector('[data-id="' + skill + '"]');
				if (mark) mark.classList.add("fail");
			};
			//添加失效函数
			//构建一个失效技能的空集合
			//失效函数是为了给技能按钮上锁的，在技能失效时，补上shixiao函数，技能就会被加入失效集合里，十周年UI那里就会检测到技能失效，从而添加上锁图片。
			lib.element.player.shixiaoedSkills = [];
			(lib.element.player.shixiaoSkill = function (skill) {
				var player = this;
				game.broadcastAll(
					function (player, skill) {
						player.$shixiaoSkill(skill);
					},
					player,
					skill
				);
			}),
				(lib.element.player.$shixiaoSkill = function (skill) {
					if (!this.shixiaoedSkills) this.shixiaoedSkills = [];
					this.shixiaoedSkills.add(skill);
				}),
				//添加解除失效函数
				//看名字就知道是干啥的
				(lib.element.player.unshixiaoSkill = function (skill) {
					var player = this;
					game.broadcastAll(
						function (player, skill) {
							player.$unshixiaoSkill(skill);
						},
						player,
						skill
					);
				}),
				(lib.element.player.$unshixiaoSkill = function (skill) {
					this.shixiaoedSkills.remove(skill);
				});
			/*选项条分离*/
			/*分离选项条 修改选项函数*/
			lib.element.content.chooseControl = function () {
				"step 0";
				if (event.controls.length == 0) {
					if (event.sortcard) {
						var sortnum = 2;
						if (event.sorttop) {
							sortnum = 1;
						}
						for (var i = 0; i < event.sortcard.length + sortnum; i++) {
							event.controls.push(get.cnNumber(i, true));
						}
					} else if (event.choiceList) {
						for (var i = 0; i < event.choiceList.length; i++) {
							event.controls.push("选项" + get.cnNumber(i + 1, true));
						}
					} else {
						event.finish();
						return;
					}
				} else if (event.choiceList && event.controls.length == 1 && event.controls[0] == "cancel2") {
					event.controls.shift();
					for (var i = 0; i < event.choiceList.length; i++) {
						event.controls.push("选项" + get.cnNumber(i + 1, true));
					}
					event.controls.push("cancel2");
				}
				if (event.isMine()) {
					if (event.arrangeSkill) {
						var hidden = player.hiddenSkills.slice(0);
						game.expandSkills(hidden);
						if (hidden.length) {
							for (var i of event.controls) {
								if (_status.prehidden_skills.includes(i) && hidden.includes(i)) {
									event.result = {
										bool: true,
										control: i,
									};
									return;
								}
							}
						}
					} else if (event.hsskill && _status.prehidden_skills.includes(event.hsskill) && event.controls.includes("cancel2")) {
						event.result = {
							bool: true,
							control: "cancel2",
						};
						return;
					}
					if (event.sortcard) {
						var prompt = event.prompt || "选择一个位置";
						if (event.tosort) {
							prompt += "放置" + get.translation(event.tosort);
						}
						event.dialog = ui.create.dialog(prompt, "hidden");
						if (event.sortcard && event.sortcard.length) {
							event.dialog.addSmall(event.sortcard);
						} else {
							event.dialog.buttons = [];
							event.dialog.add(ui.create.div(".buttons"));
						}
						var buttons = event.dialog.content.lastChild;
						var sortnum = 2;
						if (event.sorttop) {
							sortnum = 1;
						}
						for (var i = 0; i < event.dialog.buttons.length + sortnum; i++) {
							var item = ui.create.div(".button.card.pointerdiv.mebg");
							item.style.width = "50px";
							buttons.insertBefore(item, event.dialog.buttons[i]);
							item.innerHTML = '<div style="font-family: xinwei;font-size: 25px;height: 75px;line-height: 25px;top: 8px;left: 10px;width: 30px;">第' + get.cnNumber(i + 1, true) + "张</div>";
							if (i == event.dialog.buttons.length + 1) {
								item.firstChild.innerHTML = "牌堆底";
							}
							item.link = get.cnNumber(i, true);
							item.listen(ui.click.dialogcontrol);
						}

						event.dialog.forcebutton = true;
						event.dialog.classList.add("forcebutton");
						event.dialog.open();
					} else if (event.dialogcontrol) {
						event.dialog = ui.create.dialog(event.prompt || "选择一项", "hidden");
						for (var i = 0; i < event.controls.length; i++) {
							var item = event.dialog.add('<div class="popup text pointerdiv" style="width:calc(100% - 10px);display:inline-block">' + event.controls[i] + "</div>");
							item.firstChild.listen(ui.click.dialogcontrol);
							item.firstChild.link = event.controls[i];
						}
						event.dialog.forcebutton = true;
						event.dialog.classList.add("forcebutton");
						if (event.addDialog) {
							for (var i = 0; i < event.addDialog.length; i++) {
								if (get.itemtype(event.addDialog[i]) == "cards") {
									event.dialog.addSmall(event.addDialog[i]);
								} else {
									event.dialog.add(event.addDialog[i]);
								}
							}
							event.dialog.add(ui.create.div(".placeholder.slim"));
						}
						event.dialog.open();
					} else {
						if (event.seperate || lib.config.seperate_control) {
							var controls = event.controls.slice(0);
							var num = 0;
							controls.remove("cancel2");
							if ((event.direct && controls.length == 1) || event.forceDirect) {
								event.result = {
									control: event.controls[0],
									links: get.links([event.controls[0]]),
								};
								return;
							} else {
								event.controlbars = [];
								for (var i = 0; i < event.controls.length; i++) {
									event.controlbars.push(ui.create.control([event.controls[i]]));
								}
							}
						} else {
							var controls = event.controls.slice(0);
							var num = 0;
							controls.remove("cancel2");
							if ((event.direct && controls.length == 1) || event.forceDirect) {
								event.result = {
									control: event.controls[0],
									links: get.links([event.controls[0]]),
								};
								return;
							}
							event.controlbar = ui.create.control(event.controls);
						}
						if (event.dialog) {
							if (Array.isArray(event.dialog)) {
								event.dialog = ui.create.dialog.apply(this, event.dialog);
							}
							event.dialog.open();
						} else if (event.choiceList) {
							event.dialog = ui.create.dialog(event.prompt || "选择一项", "hidden");
							event.dialog.forcebutton = true;
							var list = ui.control.childNodes;
							for (var i = 0; i < list.length; i++) {
								list[i].childNodes[0].classList.add("choice"); /*添加类名*/
								//--------背水-----//
								if (list[i].childNodes[0].innerText.indexOf("背水") != -1 && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
									/*list[i].childNodes[0].setBackgroundImage('extension/无名补丁/image/beishui.png');*/
									list[i].childNodes[0].setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/uibutton/beishui.png");
									list[i].childNodes[0].innerText = "背水";
								}
								//--------------//
							}

							event.dialog.open();
							for (var i = 0; i < event.choiceList.length; i++) {
								event.dialog.add('<div class="popup text" style="width:calc(100% - 10px);display:inline-block">' + (event.displayIndex !== false ? "选项" + get.cnNumber(i + 1, true) + "：" : "") + event.choiceList[i] + "</div>");
							}
						} else if (event.prompt) {
							event.dialog = ui.create.dialog(event.prompt);
							if (event.prompt2) {
								event.dialog.addText(event.prompt2, event.prompt2.length <= 20 || event.centerprompt2);
							}
						}
					}
					game.pause();
					game.countChoose();
					event.choosing = true;
				} else if (event.isOnline()) {
					event.send();
				} else {
					event.result = "ai";
				}
				("step 1");
				if (event.result == "ai") {
					event.result = {};
					if (event.ai) {
						var result = event.ai(event.getParent(), player);
						if (typeof result == "number") event.result.control = event.controls[result];
						else event.result.control = result;
					} else event.result.control = event.controls[event.choice];
				}
				event.result.index = event.controls.indexOf(event.result.control);
				event.choosing = false;
				_status.imchoosing = false;
				if (event.dialog && event.dialog.close) event.dialog.close();
				if (event.controlbar) event.controlbar.close();
				if (event.controlbars) {
					for (var i = 0; i < event.controlbars.length; i++) {
						event.controlbars[i].close();
					}
				}
				event.resume();
			};
			//-------------AI进度条-----------//
			if (get.mode() != "connect") {
				lib.onover.push(function (bool) {
					if (document.getElementById("jindutiaoAI")) {
						document.getElementById("jindutiaoAI").remove();
					}
				});
				//--------AI回合内进度条-------类名timePhase------//
				lib.skill._jindutiaoO = {
					trigger: {
						player: ["phaseZhunbeiBegin", "phaseBegin", "phaseJudgeBegin", "phaseDrawBegin", "useCardAfter", "phaseDiscardBegin", "useSkillBefore", "loseAfter"],
					},
					filter(event, player) {
						if (document.querySelector("#jindutiaoAI") && lib.config.extension_十周年UI_jindutiaoaiUpdata == false) return false;
						return player != game.me && _status.currentPhase == player;
					},
					forced: true,
					silent: true,
					charlotte: true,
					content() {
						var ab = player.getElementsByClassName("timePhase");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
						game.JindutiaoAIplayer();
						window.boxContentAI.classList.add("timePhase");
						player.appendChild(window.boxContentAI);
					},
					group: ["_jindutiaoO_jieshuA"],
					subSkill: {
						//进度条消失
						jieshuA: {
							trigger: {
								player: ["phaseEnd", "dieBegin", "phaseJieshuBegin"],
							},
							filter(event, player) {
								return player != game.me && _status.currentPhase == player;
							},
							forced: true,
							charlotte: true,
							content() {
								if (window.timerai) {
									clearInterval(window.timerai);
									delete window.timerai;
								}
								if (document.getElementById("jindutiaoAI")) {
									document.getElementById("jindutiaoAI").remove();
								}
								var ab = player.getElementsByClassName("timePhase");
								if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
							},
						},
					},
				};
				//------------AI回合外进度条-----类名timeai 以下都是-----//
				lib.skill._jindutiaoA = {
					trigger: {
						player: ["useCardBegin", "respondBegin", "chooseToRespondBegin", "damageEnd", "judgeEnd"],
					},
					silent: true,
					forced: true,
					charlotte: true,
					filter(event, player) {
						if (document.querySelector("#jindutiaoAI") && lib.config.extension_十周年UI_jindutiaoaiUpdata == false) return false;
						return _status.currentPhase != player && player != game.me;
					},
					content() {
						var ab = player.getElementsByClassName("timeai");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
						game.JindutiaoAIplayer();
						window.boxContentAI.classList.add("timeai");
						player.appendChild(window.boxContentAI);
					},
					group: ["_jindutiaoA_jieshuB"],
					subSkill: {
						jieshuB: {
							trigger: {
								player: ["useCardEnd", "respondEnd", "dieBegin"],
							},
							forced: true,
							charlotte: true,
							filter(event, player) {
								return player != game.me && _status.currentPhase != player;
							},
							content() {
								if (window.timerai) {
									clearInterval(window.timerai);
									delete window.timerai;
								}
								var ab = player.getElementsByClassName("timeai");
								if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
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
					content() {
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
						if (trigger.target != game.me) {
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
							priority: -1,
							charlotte: true,
							content() {
								for (var i = 0; i < game.players.length; i++) {
									var ab = game.players[i].getElementsByClassName("timeai");
									if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
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
					content() {
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
							priority: -1,
							charlotte: true,
							content() {
								for (var i = 0; i < game.players.length; i++) {
									var ab = game.players[i].getElementsByClassName("timeai");
									if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
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
							return player != game.me && _status.currentPhase != player;
						},
						forced: true,
						priority: -1,
						charlotte: true,
						content() {
							var ab = player.getElementsByClassName("timeai");
							if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
						},
					},
				};
			}
			//-------出牌中提示(手杀/十周年)---------//
			lib.skill._chupaiA = {
				trigger: {
					player: ["phaseUseBegin", "useCardEnd", "loseEnd"],
				},
				silent: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					var a = player.getElementsByClassName("playertip");
					return player != game.me && _status.currentPhase == player && player.isPhaseUsing() && a.length <= 0;
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);

					var a = player.getElementsByClassName("playertip");
					if (a.length <= 0) {
						var tipAB = document.createElement("img");
						tipAB.classList.add("tipshow"); //设置统一类名
						if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
							tipAB.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tip.png";
							tipAB.classList.add("playertip");
							tipAB.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
						} else {
							tipAB.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/phasetip.png";
							tipAB.classList.add("playertip");
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
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertip");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//----弃牌提示-----//
			lib.skill._chupaiC = {
				trigger: {
					player: "phaseDiscardBegin",
				},
				silent: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					return player != game.me;
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var a = player.getElementsByClassName("playertipQP");
					if (a.length <= 0) {
						var tipCD = document.createElement("img");
						tipCD.classList.add("tipshow"); //设置统一类名
						if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
							tipCD.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipQP.png";
							tipCD.classList.add("playertipQP");
							tipCD.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
						} else {
							tipCD.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/discardtip.png";
							tipCD.classList.add("playertipQP");
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
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipQP");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//-----闪思考----//
			lib.skill._chupaiE = {
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				silent: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					// if(!player.countCards('h','shan')) return false;
					return event.card.name == "shan" && _status.currentPhase != player && player != game.me && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var d = player.getElementsByClassName("playertipshan");
					if (d.length <= 0) {
						var tipEF = document.createElement("img");
						tipEF.classList.add("tipshow"); //设置统一类名
						tipEF.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipshan.png";
						tipEF.classList.add("playertipshan");
						tipEF.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
						player.appendChild(tipEF);
					}
				},
			};
			lib.skill._chupaiF = {
				trigger: {
					global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"],
				},
				silent: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					event.respondix = 0;
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipshan");
						if (ab[0]) event.respondix++;
					}
					return event.respondix > 0;
				},
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipshan");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//-----杀思考----//
			lib.skill._chupaiG = {
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				silent: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					// if(!player.countCards('h','sha')) return false;
					return event.card.name == "sha" && _status.currentPhase != player && player != game.me && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var e = player.getElementsByClassName("playertipsha");
					if (e.length <= 0) {
						var tipGH = document.createElement("img");
						tipGH.classList.add("tipshow"); //设置统一类名
						tipGH.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipsha.png";
						tipGH.classList.add("playertipsha");
						tipGH.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";

						player.appendChild(tipGH);
					}
				},
			};
			lib.skill._chupaiH = {
				trigger: {
					global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"],
				},
				forced: true,
				silent: true,
				charlotte: true,
				filter(event, player) {
					event.respondix = 0;
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipsha");
						if (ab[0]) event.respondix++;
					}
					return event.respondix > 0;
				},
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipsha");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//-----桃思考----//
			lib.skill._chupaiM = {
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				silent: true,
				forced: true,
				charlotte: true,
				filter(event, player) {
					// if(!player.countCards('h','sha')) return false;
					return event.card.name == "tao" && _status.currentPhase != player && player != game.me && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var k = player.getElementsByClassName("playertiptao");
					if (k.length <= 0) {
						var tipMN = document.createElement("img");
						tipMN.classList.add("tipshow"); //设置统一类名
						tipMN.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tiptao.png";
						tipMN.classList.add("playertiptao");
						tipMN.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";

						player.appendChild(tipMN);
					}
				},
			};
			lib.skill._chupaiN = {
				trigger: {
					global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"],
				},
				forced: true,
				silent: true,
				charlotte: true,
				filter(event, player) {
					event.respondix = 0;
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertiptao");
						if (ab[0]) event.respondix++;
					}
					return event.respondix > 0;
				},
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertiptao");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//-----酒思考----//
			lib.skill._chupaiO = {
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				forced: true,
				charlotte: true,
				silent: true,
				filter(event, player) {
					// if(!player.countCards('h','sha')) return false;
					return event.card.name == "jiu" && _status.currentPhase != player && player != game.me && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var n = player.getElementsByClassName("playertipjiu");
					if (n.length <= 0) {
						var tipOP = document.createElement("img");
						tipOP.classList.add("tipshow"); //设置统一类名
						tipOP.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipjiu.png";
						tipOP.classList.add("playertipjiu");
						tipOP.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";

						player.appendChild(tipOP);
					}
				},
			};
			lib.skill._chupaiP = {
				trigger: {
					global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"],
				},
				forced: true,
				charlotte: true,
				silent: true,
				filter(event, player) {
					event.respondix = 0;
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipjiu");
						if (ab[0]) event.respondix++;
					}
					return event.respondix > 0;
				},
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("playertipjiu");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//----无懈思考----//
			lib.skill._chupaiI = {
				trigger: {
					player: ["useCardBegin", "respondBegin", "phaseJudge"],
				},
				forced: true,
				charlotte: true,
				silent: true,
				filter(event, player) {
					if (event.card.storage && event.card.storage.nowuxie) return false;
					var card = event.card;
					if (event.name == "phaseJudge" && card.viewAs)
						card = {
							name: card.viewAs,
						};
					var info = get.info(card);
					if (info.wuxieable === false) return false;

					return event.card.name == "wuxie" && _status.currentPhase != player && player != game.me && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var g = player.getElementsByClassName("playertipwuxie");
					if (g.length <= 0) {
						var tipIJ = document.createElement("img");
						tipIJ.classList.add("tipshow"); //设置统一类名
						tipIJ.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipwuxie.png";
						tipIJ.classList.add("playertipwuxie");
						tipIJ.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";

						player.appendChild(tipIJ);
					}
				},
			};
			lib.skill._chupaiJ = {
				trigger: {
					player: ["useCardEnd", "respondEnd", "dieBegin", "phaseEnd"],
				},
				forced: true,
				silent: true,
				charlotte: true,
				filter(event, player) {
					var h = event.player.getElementsByClassName("playertipwuxie");
					return h.length > 0 && player != game.me && _status.currentPhase != player;
				},
				content() {
					var h = trigger.player.getElementsByClassName("playertipwuxie");
					h[0].parentNode.removeChild(h[0]);
				},
			};
			lib.skill._chupaiK = {
				trigger: {
					player: ["phaseJudgeBegin", "phaseDrawBegin"],
				},
				forced: true,
				silent: true,
				charlotte: true,
				filter(event, player) {
					return player != game.me;
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var l = player.getElementsByClassName("playertipplay");
					if (l.length <= 0) {
						var tipKL = document.createElement("img");
						tipKL.classList.add("tipshow"); //设置统一类名
						if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
							tipKL.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipplay.png";
							tipKL.classList.add("playertipplay");
							tipKL.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
						} else {
							tipKL.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/thinktip.png";
							tipKL.classList.add("playertipplay");
							tipKL.style.cssText = "display:block;position:absolute;z-index:92;--w: 129px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-9.2px;transform:scale(1.2);";
						}
						player.appendChild(tipKL);
					}
				},
			};
			lib.skill._chupaiL = {
				trigger: {
					player: ["phaseJudgeEnd", "phaseDrawEnd", "phaseEnd", "dieBegin"],
				},
				forced: true,
				charlotte: true,
				silent: true,
				filter(event, player) {
					var m = event.player.getElementsByClassName("playertipplay");
					return m.length > 0 && player != game.me;
				},
				content() {
					var m = trigger.player.getElementsByClassName("playertipplay");
					m[0].parentNode.removeChild(m[0]);
				},
			};
			//-----思考中十周年----//
			lib.skill._chupaiMX = {
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				forced: true,
				silent: true,
				charlotte: true,
				filter(event, player) {
					return _status.currentPhase != player && player != game.me && (lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff");
				},
				content() {
					var tipss = player.getElementsByClassName("tipskill");
					if (tipss[0]) tipss[0].parentNode.removeChild(tipss[0]);
					var d = player.getElementsByClassName("playertipthink");
					if (d.length <= 0) {
						var tipMNX = document.createElement("img");
						tipMNX.classList.add("tipshow"); //设置统一类名
						tipMNX.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/thinktip.png";
						tipMNX.classList.add("playertipthink");
						tipMNX.style.cssText = "display:block;position:absolute;z-index:92;--w: 129px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-9.2px;transform:scale(1.2);";

						player.appendChild(tipMNX);
					}
				},
			};
			lib.skill._chupaiNX = {
				trigger: {
					player: ["useCardEnd", "respondEnd", "dieBegin"],
				},
				forced: true,
				silent: true,
				charlotte: true,
				filter(event, player) {
					var e = event.player.getElementsByClassName("playertipthink");
					return e.length > 0 && player != game.me && _status.currentPhase != player;
				},
				content() {
					var e = trigger.player.getElementsByClassName("playertipthink");
					e[0].parentNode.removeChild(e[0]);
				},
			};
			//-------技能提示条（容错清除）-------//
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
				content() {
					for (var i = 0; i < game.players.length; i++) {
						var ab = game.players[i].getElementsByClassName("tipskill");
						if (ab[0]) ab[0].parentNode.removeChild(ab[0]);
					}
				},
			};
			//狗托播报
			if (config.GTBB) {
				var txcsanm = {};
				var gddf = function () {
					var player = "玩家";
					var my = lib.config.connect_nickname;
					var suiji = [
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
					].randomGet();
					var name = [suiji, my].randomGet();
					var v = ["通过", "使用", "开启"].randomGet();
					var story = ["周年", "五一", "踏青", "牛年", "开黑", "冬至", "春分", "鼠年", "盛典", "魏魂", "群魂", "蜀魂", "吴魂", "猪年", "圣诞", "国庆", "狗年", "金秋", "奇珍", "元旦", "小雪", "冬日", "招募", "梦之回廊", "虎年", "新春", "七夕", "大雪", "端午", "武将", "中秋", "庆典"].randomGet();
					var box = ["盒子", "宝盒", "礼包", "福袋", "礼盒", "庆典", "盛典"].randomGet();
					var a = "获得了";
					//皮肤
					var pifu = ["界钟会×1", "王朗×1", "马钧×1", "司马昭×1", "司马师×1", "王平×1", "诸葛瞻×1", "张星彩×1", "董允×1", "关索×1", "骆统×1", "周处*1", "界步练师*1", "界朱然*1", "贺齐*1", "苏飞*1", "公孙康×1", "杨彪×1", "刘璋×1", "张仲景×1", "司马徽×1", "曹婴×1", "徐荣×1", "史诗宝珠*66", "史诗宝珠*33", "麒麟生角·魏延*1", "史诗宝珠*10", "刘焉×1", "孙寒华×1", "戏志才×1", "界曹真×1", "曹婴×1", "王粲×1", "界于禁×1", "郝昭×1", "界黄忠×1", "鲍三娘×1", "周群×1", "赵襄×1", "马云禄×1", "孙皓×1", "留赞×1", "吴景×1", "界徐盛×1", "许攸×1", "杜预×1", "界李儒×1", "张让×1", "麹义×1", "司马徽×1", "界左慈×1", "鲍三娘×1", "界徐盛×1", "南华老仙×1", "韩旭の大饼*100", "神郭嘉×1", "吴景×1", "周处×1", "杜预×1", "司马师×1", "羊微瑜×1", "神曹操×1"].randomGet();
					//武将
					var wujiang = [
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
					].randomGet();
					//更改对应播报颜色
					var gold = ['<font color="#56e4fa">' + pifu + "</font>", '<font color="#f3c20f">' + wujiang + "</font>"].randomGet();
					var d = [",大家快恭喜TA吧！", ",大家快恭喜TA吧。无名杀是一款非盈利游戏(づ ●─● )づ", ",祝你新的一年天天开心，万事如意"].randomGet();
					/*定义部分属性--默认手杀*/
					var fontset = "FZLBJW"; /*字体*/
					var colorA = "#efe8dc"; /*颜色a*/
					var colorB = "#22c622"; /*颜色b*/
					if (lib.config.extension_十周年UI_GTBBFont == "off") {
						fontset = "yuanli";
						colorA = "#86CC5B";
						colorB = "#B3E1EC";
					}
					txcsanm.div.show();
					setTimeout(function () {
						txcsanm.div.hide();
					}, 15500);
					txcsanm.div2.innerHTML = '<marquee direction="left" behavior="scroll" scrollamount=9.8" loop="1" width="100%" height="50" align="absmiddle" >' + "<font  face=" + fontset + ">" + player + "<font color=" + colorA + ">" + "<b>" + name + "</b>" + "</font>" + v + "<font color=" + colorB + ">" + "<b>" + story + box + "</b>" + "</font>" + a + "<b>" + gold + "</b>" + d + "</font>" + "</marquee>";
				};

				txcsanm.div = ui.create.div("");
				txcsanm.div2 = ui.create.div("", txcsanm.div);
				/*----------手杀样式-------*/
				if (config.GTBBYangshi == "on") {
					txcsanm.div.style.cssText = "pointer-events:none;width:100%;height:25px;font-size:23px;z-index:6;";
					txcsanm.div2.style.cssText = "pointer-events:none;background:rgba(0,0,0,0.5);width:100%;height:27px;";
					/*------------------------*/
				} else {
					/*-------十周年样式-------*/
					txcsanm.div.style.cssText = "pointer-events:none;width:56%;height:35px;font-size:18px;z-index:20;background-size:100% 100%;background-repeat:no-repeat;left:50%;top:15%;transform:translateX(-50%);";
					txcsanm.div.style["background-image"] = "url(" + lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/goutuo.png";
					txcsanm.div2.style.cssText = "pointer-events:none;width:85.5%;height:35px;left:8%;line-height:35px;";
					/*------------------------*/
				}

				var id = setInterval(function () {
					if (!txcsanm.div.parentNode && ui.window) {
						ui.window.appendChild(txcsanm.div);
						clearInterval(id);
						gddf();
						setInterval(gddf, parseFloat(lib.config["extension_十周年UI_GTBBTime"]));
					}
				}, 5000);
			}
			//阶段提示
			if (lib.config.extension_十周年UI_JDTS) {
				//游戏结束消失
				lib.onover.push(function (bool) {
					game.as_removeImage();
				});
				//等待响应
				lib.skill._jd_ddxyA = {
					trigger: {
						player: ["chooseToRespondBegin"],
					},
					silent: true,
					direct: true,
					filter(event, player) {
						return player == game.me && _status.auto == false;
					},
					content() {
						trigger._jd_ddxy = true;
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.jpg", [10, 58, 7, 6], 10);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.jpg", [3, 58, 7, 6], 10);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.png", [18, 65, 8, 4.4], 10);
						}
					},
				};
				//成为杀的目标开始
				lib.skill._jd_ddxyB = {
					trigger: {
						target: "shaBegin",
					},
					silent: true,
					filter(event, player) {
						return game.me == event.target;
					},
					charlotte: true,
					forced: true,
					content() {
						trigger._jd_ddxy = true;
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.png", [18, 65, 8, 4.4], true);
						}
					},
				};
				lib.skill._jd_ddxyC = {
					trigger: {
						player: ["useCardToBegin", "phaseJudge"],
					},
					silent: true,
					filter(event, player) {
						if (event.card.storage && event.card.storage.nowuxie) return false;
						var card = event.card;
						var info = get.info(card);
						if (info.wuxieable === false) return false;
						if (event.name != "phaseJudge") {
							if (event.getParent().nowuxie) return false;
							if (!event.target) {
								if (info.wuxieable) return true;
								return false;
							}
							if (event.player.hasSkillTag("playernowuxie", false, event.card)) return false;
							if (get.type(event.card) != "trick" && !info.wuxieable) return false;
						}
						return player == game.me && _status.auto == false;
					},
					charlotte: true,
					forced: true,
					content() {
						trigger._jd_ddxy = true;
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/ddxy.png", [18, 65, 8, 4.4], true);
						}
					},
				};
				//使用或打出闪后
				lib.skill._jd_shiyongshanD = {
					forced: true,
					charlotte: true,
					trigger: {
						player: ["useCard", "respondAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && event.card.name == "shan";
					},
					content() {
						trigger._jd_ddxy = true;
						game.as_removeImage();
						if (_status.as_showImage_phase) {
							if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
								if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
									game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/" + _status.as_showImage_phase + ".jpg", [10, 58, 7, 6], true);
								} else {
									game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/" + _status.as_showImage_phase + ".jpg", [3, 58, 7, 6], true);
								}
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/" + _status.as_showImage_phase + ".png", [18, 65, 8, 4.4], true);
							}
						}
					},
				};
				//等待响应及游戏结束
				lib.skill._jd_ddxyE = {
					trigger: {
						player: ["chooseToRespondEnd", "useCardToEnd", "phaseJudgeEnd", "respondSha", "shanBegin"],
					},
					silent: true,
					filter(event, player) {
						if (!event._jd_ddxy) return false;
						return player == game.me && _status.auto == false;
					},
					direct: true,
					content() {
						game.as_removeImage();
						if (_status.as_showImage_phase) {
							if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
								if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
									game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/" + _status.as_showImage_phase + ".jpg", [10, 58, 7, 6], true);
								} else {
									game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/" + _status.as_showImage_phase + ".jpg", [3, 58, 7, 6], true);
								}
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/" + _status.as_showImage_phase + ".png", [18, 65, 8, 4.4], true);
							}
						}
					},
				};
				//对方正在思考
				lib.skill._jd_dfsk = {
					trigger: {
						global: ["phaseBegin", "phaseEnd", "phaseJudgeBegin", "phaseDrawBegin", "phaseUseBegin", "phaseDiscardBegin"],
					},
					silent: true,
					charlotte: true,
					forced: true,
					filter(event, player) {
						//剩余人数两人时
						if (game.players.length == 2 && _status.currentPhase != game.me) return true;
					},
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/dfsk.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/dfsk.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/dfsk.png", [18, 65, 8, 4.4], true);
						}
					},
				};
				//死亡或回合结束消失
				lib.skill._jd_wjsw = {
					trigger: {
						global: ["phaseEnd", "useCardAfter"],
					},
					silent: true,
					filter(event, player) {
						return _status.currentPhase != game.me && player != game.me;
					},
					forced: true,
					charlotte: true,
					content() {
						game.as_removeImage();
					},
				};
				lib.skill._jd_swxs = {
					trigger: {
						global: ["dieAfter"],
					},
					silent: true,
					forced: true,
					charlotte: true,
					filter(event, player) {
						return player == game.me && _status.auto == false;
					},
					content() {
						game.as_removeImage();
					},
				};
				//回合开始
				lib.skill._jd_hhks = {
					trigger: {
						player: ["phaseBegin"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/hhks.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/hhks.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/hhks.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "hhks";
					},
				};
				//准备阶段
				lib.skill._jd_zbjdb = {
					trigger: {
						player: ["phaseZhunbeiBefore"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/zbjd.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "zbjd";
					},
				};
				lib.skill._jd_zbjde = {
					trigger: {
						player: ["phaseZhunbeiAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "zbjd") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
				//判定阶段
				lib.skill._jd_pdjdb = {
					trigger: {
						player: ["phaseJudgeBefore"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "pdjd";
					},
				};
				lib.skill._jd_pdjde = {
					trigger: {
						player: ["phaseJudgeAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "pdjd") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
				//摸牌阶段
				lib.skill._jd_mpjdb = {
					trigger: {
						player: ["phaseDrawBefore"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/mpjd.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/mpjd.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/mpjd.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "mpjd";
					},
				};
				lib.skill._jd_mpjde = {
					trigger: {
						player: ["phaseDrawAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "mpjd") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
				//出牌阶段
				lib.skill._jd_cpjdb = {
					trigger: {
						player: ["phaseUseBefore"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/cpjd.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/cpjd.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/cpjd.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "cpjd";
					},
				};
				lib.skill._jd_cpjde = {
					trigger: {
						player: ["phaseUseAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "cpjd") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
				//弃牌阶段
				lib.skill._jd_qpjdb = {
					trigger: {
						player: ["phaseDiscardBefore"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/qpjd.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/qpjd.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/qpjd.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "qpjd";
					},
				};
				lib.skill._jd_qpjde = {
					trigger: {
						player: ["phaseDiscardAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "qpjd") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
				//结束阶段
				lib.skill._jd_jsjdb = {
					trigger: {
						player: ["phaseJieshuBefore"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/pdjd.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/jsjd.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "jsjd";
					},
				};
				lib.skill._jd_jsjde = {
					trigger: {
						player: ["phaseJieshuAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "jsjd") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
				//回合结束
				lib.skill._jd_hhjsb = {
					trigger: {
						player: ["phaseEnd"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: Infinity,
					firstDo: true,
					content() {
						if (lib.config.extension_十周年UI_JDTSYangshi == "1") {
							if (get.mode() == "taixuhuanjing" || lib.config["extension_EngEX_SSServant"]) {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/hhjs.jpg", [10, 58, 7, 6], true);
							} else {
								game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/hhjs.jpg", [3, 58, 7, 6], true);
							}
						} else {
							game.as_showImage("extension/十周年UI/shoushaUI/lbtn/images/JDTS/hhjs.png", [18, 65, 8, 4.4], true);
						}
						_status.as_showImage_phase = "hhjs";
					},
				};
				lib.skill._jd_hhjse = {
					trigger: {
						player: ["phaseAfter"],
					},
					silent: true,
					filter(event, player) {
						return player == game.me && _status.currentPhase == player;
					},
					charlotte: true,
					ruleSkill: true,
					direct: true,
					priority: -Infinity,
					lastDo: true,
					content() {
						if (_status.as_showImage_phase && _status.as_showImage_phase == "hhjs") {
							game.as_removeImage();
							delete _status.as_showImage_phase;
						}
					},
				};
			}
			//玩家进度条
			if (get.mode() != "connect" && config.jindutiao == true) {
				lib.onover.push(function (bool) {
					if (document.getElementById("jindutiaopl")) {
						document.getElementById("jindutiaopl").remove();
					}
				});
				//玩家回合内进度条
				lib.skill._jindutiao = {
					trigger: {
						player: ["phaseZhunbeiBegin", "phaseBegin", "phaseJudgeBegin", "phaseDrawBegin", "useCardAfter", "phaseDiscardBegin", "useSkillBefore", "loseAfter"],
					},
					silent: true,
					filter(event, player) {
						if (document.querySelector("#jindutiaopl") && lib.config.extension_十周年UI_jindutiaoUpdata == false) return false;
						return player == game.me && _status.currentPhase == player;
					},
					forced: true,
					content() {
						game.Jindutiaoplayer();
					},
					group: ["_jindutiao_jieshu"],
					subSkill: {
						jieshu: {
							trigger: {
								player: ["phaseEnd", "phaseJieshuBegin"],
							},
							forced: true,
							filter(event, player) {
								return player == game.me;
							},
							content() {
								if (window.timer) {
									clearInterval(window.timer);
									delete window.timer;
								}

								if (window.timer2) {
									clearInterval(window.timer2);
									delete window.timer2;
								}

								if (document.getElementById("jindutiaopl")) {
									document.getElementById("jindutiaopl").remove();
								}
							},
						},
					},
				};
				/*------回合外进度条玩家----*/
				lib.skill._jindutiaopl = {
					trigger: {
						global: ["gameStart"],
						player: ["useCardToBegin", "respondBegin", "chooseToRespondBegin", "damageEnd", "damageAfter", "judgeEnd"],
						target: "useCardToTargeted",
					},
					silent: true,
					forced: true,
					charlotte: true,
					filter(event, player) {
						if (document.querySelector("#jindutiaopl") && lib.config.extension_十周年UI_jindutiaoUpdata == false) return false;
						if (event.name == "gameStart" && lib.config["extension_无名补丁_enable"]) return false;
						return _status.currentPhase != player && player == game.me;
					},
					content() {
						game.Jindutiaoplayer();
					},
					group: ["_jindutiaopl_jieshu"],
					subSkill: {
						jieshu: {
							trigger: {
								global: ["useCardAfter", "useCardBefore", "phaseBefore", "loseEnd", "phaseBegin", "phaseDradBegin", "phaseUseBegin", "phaseUseEnd", "phaseEnd", "phaseDiscardAfter", "phaseDiscardBegin", "useSkillBefore", "judgeAfter"],
							},
							forced: true,
							charlotte: true,
							filter(event, player) {
								if (document.querySelector("#jindutiaopl")) return _status.currentPhase != game.me;
								return false;
							},
							content() {
								if (window.timer) {
									clearInterval(window.timer);
									delete window.timer;
								}
								if (window.timer2) {
									clearInterval(window.timer2);
									delete window.timer2;
								}
								if (document.getElementById("jindutiaopl")) {
									document.getElementById("jindutiaopl").remove();
								}
							},
						},
					},
				};
			}
			//手杀UI
		},
		precontent() {
			if (get.mode() === "chess" || get.mode() === "tafang" || get.mode === "hs_hearthstone") return;
			if (lib.config["extension_" + decadeUIName + "_eruda"]) {
				var script = document.createElement("script");
				script.src = decadeUIPath + "eruda.js";
				document.body.appendChild(script);
				script.onload = function () {
					eruda.init();
				};
			}

			if (window.require && !window.fs) window.fs = require("fs");

			lib.configMenu.appearence.config.layout.visualMenu = (node, link) => {
				node.className = `button character themebutton ${lib.config.theme}`;
				node.classList.add(link);
				if (node.created) return;
				node.created = true;
				node.style.overflow = "scroll";

				const list = ["re_caocao", "re_liubei", "sp_zhangjiao", "sunquan"];
				while (list.length) {
					ui.create.div(".avatar", ui.create.div(".seat-player.fakeplayer", node)).setBackground(list.randomRemove(), "character");
				}
			};

			window.decadeModule = (function (decadeModule) {
				var version = lib.extensionPack.十周年UI.version;
				if (ui.css.layout) {
					if (!ui.css.layout.href || ui.css.layout.href.indexOf("long2") < 0) ui.css.layout.href = lib.assetURL + "layout/long2/layout.css";
				}
				var moniEquipBool = lib.config["extension_十周年UI_MoNiEquip"] == "off";
				decadeModule.init = function () {
					//原十周年UI内容加载

					this.css(decadeUIPath + "extension.css");
					this.css(decadeUIPath + "decadeLayout.css");
				if(!["on","othersOff","decade","off"].includes(lib.config.extension_十周年UI_newDecadeStyle))	this.css(decadeUIPath + "card.css");
					// 当且仅当初次载入时，newDecadeStyle == void 0
					if (lib.config.extension_十周年UI_newDecadeStyle != void 0) {
						this.css(decadeUIPath + "player" + parseFloat(["on", "off", "othersOn", "othersOff", "onlineUI", "babysha", "decade"].indexOf(lib.config.extension_十周年UI_newDecadeStyle) + 1) + ".css");
					} else {
						this.css(decadeUIPath + "player2.css");
					}
					if (lib.config.extension_十周年UI_newDecadeStyle == "othersOff") {
						if (moniEquipBool) this.css(decadeUIPath + "equip_new_new.css");
						this.css(decadeUIPath + "layout6.css");
					} else if (lib.config.extension_十周年UI_newDecadeStyle == "decade") {
						if (moniEquipBool) this.css(decadeUIPath + "equip_new_new.css");
						this.css(decadeUIPath + "decadeLayout6.css");
						this.css(decadeUIPath + "layout6.css");
					} else if (lib.config.extension_十周年UI_newDecadeStyle == "on") {
						if (moniEquipBool) this.css(decadeUIPath + "equip_new_new.css");
						this.css(decadeUIPath + "decadeLayout6.css");
						this.css(decadeUIPath + "layout6.css");
					} 
					else if (lib.config.extension_十周年UI_newDecadeStyle == "onlineUI") {
						if (moniEquipBool) this.css(decadeUIPath + "equipOL.css");
						this.css(decadeUIPath + "layout_new.css");
					} else if (lib.config.extension_十周年UI_newDecadeStyle == "babysha") {
						if (moniEquipBool) this.css(decadeUIPath + "equiphs.css");
						this.css(decadeUIPath + "layout_new.css");
					} else if (lib.config.extension_十周年UI_newDecadeStyle == "off") {
						this.css(decadeUIPath + "player2.css");
						if (moniEquipBool) this.css(decadeUIPath + "equip_new.css");
						this.css(decadeUIPath + "layout_off.css");
						this.css(decadeUIPath + "decadeLayout_ss.css");
					} else {
						if (moniEquipBool) this.css(decadeUIPath + "equip_new.css");
						this.css(decadeUIPath + "layout.css");
					}

					if (lib.config.extension_十周年UI_meanPrettify) {
						this.css(decadeUIPath + "menu.css");
					}
					if (lib.config["extension_十周年UI_choosecharboder"]) {
						this.css(decadeUIPath + "style.css");
					}
					this.js(decadeUIPath + "spine.js");
					this.js(decadeUIPath + "component.js");
					this.js(decadeUIPath + "skill.js");
					this.js(decadeUIPath + "content.js");
					this.js(decadeUIPath + "effect.js");
					this.js(decadeUIPath + "meihua.js");
					this.js(decadeUIPath + "animation.js");
					this.js(decadeUIPath + "dynamicSkin.js");

					//原手杀UI内容加载
					//避免提示是否下载图片和字体素材
					if (!lib.config.asset_version) game.saveConfig("asset_version", "无");
					var layoutPath = decadeUIPath + "shoushaUI/";
					if (lib.config.extension_十周年UI_KGMH == "1") this.css(layoutPath + "KGMH/" + "kaiguan.css");
					if (lib.config.extension_十周年UI_KGMH == "2") this.css(layoutPath + "KGMH/" + "kaiguan_new.css");

					var listmap =
						{
							on: 2,
							off: 1,
							othersOn: 1,
							othersOff: 3,
							onlineUI: 4,
							babysha: 5,
							decade: 6,
						}[lib.config.extension_十周年UI_newDecadeStyle] || 2;

					if (!(get.mode() == "chess" || get.mode() == "tafang" || get.mode == "hs_hearthstone")) {
						var list = ["character", "lbtn", "skill"];
						list.forEach(pack => {
							//css加载
							switch (pack) {
								case "character":
									this.css(layoutPath + pack + "/main" + listmap + ".css");
									break;

								default:
									this.css(layoutPath + pack + "/main" + listmap + (lib.config.touchscreen ? "" : "_window") + ".css");
									break;
							}
							//js加载
							this.js(
								layoutPath + pack + "/" + pack + "/main" + listmap + ".js",
								null,
								function () {},
								function () {}
							);
						});
					}
					return this;
				};
				decadeModule.js = function (path) {
					if (!path) return console.error("path");

					const script = document.createElement("script");
					script.onload = function () {
						this.remove();
					};
					script.onerror = function () {
						this.remove();
						console.error(`${this.src}not found`);
					};
					script.src = `${path}?v=${version}`;
					document.head.appendChild(script);
					return script;
				};
				decadeModule.css = function (path) {
					if (!path) return console.error("path");
					const link = document.createElement("link");
					link.rel = "stylesheet";
					link.href = `${path}?v=${version}`;
					document.head.appendChild(link);
					return link;
				};
				decadeModule.import = function (module) {
					if (!this.modules) this.modules = [];
					if (typeof module != "function") return console.error("import failed");
					this.modules.push(module);
				};
				return decadeModule.init();
			})({});

			Object.defineProperties(_status, {
				connectMode: {
					configurable: true,
					get() {
						return this._connectMode;
					},
					set(value) {
						this._connectMode = value;
						if (!value || !lib.extensions) return;
						const decadeExtension = lib.extensions.find(value => value[0] == decadeUIName);
						if (!decadeExtension) return;

						const startBeforeFunction = lib.init.startBefore;
						lib.init.startBefore = function () {
							try {
								_status.extension = decadeExtension[0];
								_status.evaluatingExtension = decadeExtension[3];
								decadeExtension[1](decadeExtension[2], decadeExtension[4]);
								delete _status.extension;
								delete _status.evaluatingExtension;
								console.log(`%c${decadeUIName}: 联机成功`, "color:blue");
							} catch (e) {
								console.log(e);
							}

							if (startBeforeFunction) startBeforeFunction.apply(this, arguments);
						};
					},
				},
				_connectMode: {
					value: false,
					writable: true,
				},
			});
			//手杀UI
			window.app = {
				each(obj, fn, node) {
					if (!obj) return node;
					if (typeof obj.length === "number") {
						for (var i = 0; i < obj.length; i++) {
							if (fn.call(node, obj[i], i) === false) {
								break;
							}
						}
						return node;
					}
					for (var i in obj) {
						if (fn.call(node, obj[i], i) === false) {
							break;
						}
					}
					return node;
				},
				isFunction(fn) {
					return typeof fn === "function";
				},
				event: {
					listens: {},
					on(name, listen, remove) {
						if (!this.listens[name]) {
							this.listens[name] = [];
						}
						this.listens[name].push({
							listen: listen,
							remove: remove,
						});
						return this;
					},
					off(name, listen) {
						return app.each(
							this.listens[name],
							function (item, index) {
								if (listen === item || listen === item.listen) {
									this.listens[name].splice(index, 1);
								}
							},
							this
						);
					},
					emit(name) {
						var args = Array.from(arguments).slice(1);
						return app.each(
							this.listens[name],
							function (item) {
								item.listen.apply(null, args);
								item.remove && this.off(name, item);
							},
							this
						);
					},
					once(name, listen) {
						return this.on(name, listen, true);
					},
				},
				create: {},
				listens: {},
				plugins: [],
				pluginsMap: {},
				path: {
					ext(path, ext) {
						ext = ext || app.name;
						return lib.assetURL + "extension/" + ext + "/" + path;
					},
				},
				on(event, listen) {
					if (!app.listens[event]) {
						app.listens[event] = [];
					}
					app.listens[event].add(listen);
				},
				once(event, listen) {
					if (!app.listens[event]) {
						app.listens[event] = [];
					}
					app.listens[event].push({
						listen: listen,
						remove: true,
					});
				},
				off(event, listen) {
					var listens = app.listens[event] || [];
					var filters = listen
						? listens.filter(function (item) {
								return item === listen || item.listen === listen;
						  })
						: listens.slice(0);
					filters.forEach(function (item) {
						listens.remove(item);
					});
				},
				emit(event) {
					var args = Array.from(arguments).slice(1);
					var listens = app.listens[event] || [];
					listens.forEach(function (item) {
						if (typeof item === "function") {
							item.apply(null, args);
						} else if (typeof item.listen === "function") {
							item.listen.apply(null, args);
							item.remove && listens.remove(item);
						}
					});
				},
				import(fn) {
					var obj = fn(lib, game, ui, get, ai, _status, app);
					if (obj) {
						if (obj.name) app.pluginsMap[obj.name] = obj;
						if (obj.precontent && (!obj.filter || obj.filter())) obj.precontent();
					}
					app.plugins.push(obj);
				},

				importPlugin(data, setText) {
					if (!window.JSZip) {
						var args = arguments;
						lib.init.js(lib.assetURL + "game", "jszip", function () {
							app.importPlugin.apply(app, args);
						});
						return;
					}
					setText = typeof setText === "function" ? setText() : function () {};
					var zip = new JSZip(data);
					var dirList = [],
						fileList = [];
					for (var i in zip.files) {
						if (/\/$/.test(i)) {
							dirList.push("extension/" + app.name + "/" + i);
						} else if (!/^extension\.(js|css)$/.test(i)) {
							fileList.push({
								id: i,
								path: "extension/" + app.name + "/" + i.split("/").reverse().slice(1).reverse().join("/"),
								name: i.split("/").pop(),
								target: zip.files[i],
							});
						}
					}

					var total = dirList.length + fileList.length;
					var finish = 0;
					var isNode = lib.node && lib.node.fs;

					var writeFile = function () {
						var file = fileList.shift();
						if (file) {
							setText("正在导入(" + ++finish + "/" + total + ")...");
							game.writeFile(isNode ? file.target.asNodeBuffer() : file.target.asArrayBuffer(), file.path, file.name, writeFile);
						} else {
							alert("导入完成");
							setText("导入插件");
						}
					};
					var ensureDir = function () {
						if (dirList.length) {
							setText("正在导入(" + ++finish + "/" + total + ")...");
							game.ensureDirectory(dirList.shift(), ensureDir);
						} else {
							writeFile();
						}
					};
					ensureDir();
				},
				loadPlugins(callback) {
					game.getFileList("extension/" + app.name, function (floders) {
						var total = floders.length;
						var current = 0;
						if (total === current) {
							callback();
							return;
						}
						var loaded = function () {
							if (++current === total) {
								callback();
							}
						};
						floders.forEach(function (dir) {
							switch (lib.config.extension_十周年UI_newDecadeStyle) {
								case "on":
									game.readFile(
										"extension/" + app.name + "/" + dir + "/main1.js",
										function (data) {
											var binarry = new Uint8Array(data);
											var blob = new Blob([binarry]);
											var reader = new FileReader();
											reader.readAsText(blob);
											reader.onload = function () {
												eval(reader.result);
												loaded();
											};
										},
										function (e) {
											console.info(e);
											loaded();
										}
									);
									break;
								case "othersOff":
									game.readFile(
										"extension/" + app.name + "/" + dir + "/main3.js",
										function (data) {
											var binarry = new Uint8Array(data);
											var blob = new Blob([binarry]);
											var reader = new FileReader();
											reader.readAsText(blob);
											reader.onload = function () {
												eval(reader.result);
												loaded();
											};
										},
										function (e) {
											console.info(e);
											loaded();
										}
									);
									break;
								default:
									game.readFile(
										"extension/" + app.name + "/" + dir + "/main2.js",
										function (data) {
											var binarry = new Uint8Array(data);
											var blob = new Blob([binarry]);
											var reader = new FileReader();
											reader.readAsText(blob);
											reader.onload = function () {
												eval(reader.result);
												loaded();
											};
										},
										function (e) {
											console.info(e);
											loaded();
										}
									);
									break;
							}
						});
					});
				},
				reWriteFunction(target, name, replace, str) {
					if (name && typeof name === "object") {
						return app.each(
							name,
							function (item, index) {
								app.reWriteFunction(target, index, item[0], item[1]);
							},
							target
						);
					}

					var plugins = app.pluginsMap;
					if ((typeof replace === "string" || replace instanceof RegExp) && (typeof str === "string" || str instanceof RegExp)) {
						var funcStr = target[name].toString().replace(replace, str);
						eval("target." + name + " = " + funcStr);
					} else {
						var func = target[name];
						target[name] = function () {
							var result, cancel;
							var args = Array.from(arguments);
							var args2 = Array.from(arguments);
							if (typeof replace === "function") cancel = replace.apply(this, [args].concat(args));
							if (typeof func === "function" && !cancel) result = func.apply(this, args);
							if (typeof str === "function") str.apply(this, [result].concat(args2));
							return cancel || result;
						};
					}
					return target[name];
				},
				reWriteFunctionX(target, name, replace, str) {
					if (name && typeof name === "object") {
						return app.each(
							name,
							function (item, index) {
								app.reWriteFunction(target, index, item);
							},
							target
						);
					}

					if (Array.isArray(replace)) {
						var item1 = replace[0];
						var item2 = replace[1];
						var item3 = replace[2];
						if (item3 === "append") {
							item2 = item1 + item2;
						} else if (item3 === "insert") {
							item2 = item2 + item1;
						}
						if (typeof item1 === "string") {
							item1 = RegExp(item1);
						}
						if (item1 instanceof RegExp && typeof item2 === "string") {
							var funcStr = target[name].toString().replace(item1, item2);
							eval("target." + name + " = " + funcStr);
						} else {
							var func = target[name];
							target[name] = function () {
								var arg1 = Array.from(arguments);
								var arg2 = Array.from(arguments);
								var result;
								if (app.isFunction(item1)) result = item1.apply(this, [arg1].concat(arg1));
								if (app.isFunction(func) && !result) result = func.apply(this, arg1);
								if (app.isFunction(item2)) item2.apply(this, [result].concat(arg2));
								return result;
							};
						}
					} else {
						console.info(arguments);
					}
					return target[name];
				},
				waitAllFunction(fnList, callback) {
					var list = fnList.slice(0);
					var runNext = function () {
						var item = list.shift();
						if (typeof item === "function") {
							item(runNext);
						} else if (list.length === 0) {
							callback();
						} else {
							runNext();
						}
					};
					runNext();
				},
				element: {
					runNext: {
						setTip(tip) {
							console.info(tip);
						},
					},
				},
				get: {
					playerSkills(node, arg1, arg2) {
						var skills = node.getSkills(arg1, arg2).slice(0);
						skills.addArray(Object.keys(node.forbiddenSkills));
						skills.addArray(
							Object.keys(node.disabledSkills).filter(function (k) {
								return !node.hiddenSkills.includes(k) && node.disabledSkills[k].length && node.disabledSkills[k][0] === k + "_awake";
							})
						);
						return skills;
					},
					skillInfo(skill, node) {
						var obj = {};
						obj.id = skill;
						if (lib.translate[skill + "_ab"]) {
							obj.name = lib.translate[skill + "_ab"];
							obj.nameSimple = lib.translate[skill + "_ab"];
						} else if (lib.translate[skill]) {
							obj.name = lib.translate[skill];
							obj.nameSimple = lib.translate[skill].slice(0, 2);
						}
						obj.info = lib.skill[skill];
						if (node) {
							if (node.forbiddenSkills[skill]) obj.forbidden = true;
							if (node.disabledSkills[skill]) obj.disabled = true;
							if (obj.info.temp || !node.skills.includes(skill)) obj.temp = true;
							if (obj.info.frequent || obj.info.subfrequent) obj.frequent = true;
							if (obj.info.clickable && node.isIn() && node.isUnderControl(true)) obj.clickable = true;
							if (obj.info.nobracket) obj.nobracket = true;
						}
						obj.translation = get.skillInfoTranslation(skill);
						obj.translationSource = lib.translate[skill + "_info"];
						obj.translationAppend = lib.translate[skill + "_append"];
						if (obj.info && obj.info.enable) {
							obj.type = "enable";
						} else {
							obj.type = "trigger";
						}
						return obj;
					},
				},
				listen(node, func) {
					node.addEventListener(lib.config.touchscreen ? "touchend" : "click", func);
					return function () {
						node.removeEventLisnter(lib.config.touchscreen ? "touchend" : "click", func);
					};
				},
				mockTouch(node) {
					var event = new Event(lib.config.touchscreen ? "touchend" : "click");
					node.dispatchEvent(event);
					return node;
				},
				nextTick(func, time) {
					var funcs;
					if (Array.isArray(func)) funcs = func;
					else funcs = [func];
					var next = function () {
						var item = funcs.shift();
						if (item) {
							setTimeout(function () {
								item();
								next();
							}, time || 0);
						}
					};
					next();
				},
			};
			//避免提示是否下载图片和字体素材
			if (!lib.config.asset_version) game.saveConfig("asset_version", "无");
			//函数加载
			var layoutPath = lib.assetURL + "extension/十周年UI/shoushaUI/";
			if (lib.config.extension_十周年UI_KGMH == "1") lib.init.css(layoutPath, "KGMH/kaiguan");
			if (lib.config.extension_十周年UI_KGMH == "2") lib.init.css(layoutPath, "KGMH/kaiguan_new");
			if (!(get.mode() == "chess" || get.mode() == "tafang" || get.mode == "hs_hearthstone")) {
				for (var pack of [/*'card',*/ "character", "lbtn", "skill"]) {
					var listmap =
						{
							on: 2,
							off: 1,
							othersOn: 1,
							othersOff: 3,
							onlineUI: 4,
							babysha: 5,
							decade: 6,
						}[lib.config.extension_十周年UI_newDecadeStyle] || 2;
					lib.init.js(
						layoutPath + pack + "/main" + listmap + ".js",
						null,
						function () {},
						function () {}
					);
					switch (pack) {
						case "character":
							lib.init.css(layoutPath + pack + "/main" + listmap + ".css");

							break;
						default:
							lib.init.css(layoutPath + pack + "/main" + listmap + (get.is.phoneLayout() ? "" : "_window") + ".css");
							break;
					}
				}
			}
			//函数框架
			/*进度条框架*/
			game.Jindutiaoplayer = function () {
				//----------------进度条主体---------------------//
				if (window.timer) {
					clearInterval(window.timer);
					delete window.timer;
				}
				if (window.timer2) {
					clearInterval(window.timer2);
					delete window.timer2;
				}
				if (document.getElementById("jindutiaopl")) {
					document.getElementById("jindutiaopl").remove();
				}
				var boxContent = document.createElement("div");
				boxContent.setAttribute("id", "jindutiaopl");
				//-------样式1-------//
				if (lib.config.extension_十周年UI_jindutiaoYangshi == "1") {
					//手杀进度条样式
					if (window.jindutiaoTeshu) {
						delete window.jindutiaoTeshu;
					}
					boxContent.style.backgroundColor = "rgba(0,0,0,0.4)";
					boxContent.style.width = "620px";
					boxContent.style.height = "12.3px";
					boxContent.style.borderRadius = "1000px";
					boxContent.style["boxShadow"] = "0px 0px 9px #2e2b27 inset,0px 0px 2.1px #FFFFD5";
					boxContent.style.overflow = "hidden";
					boxContent.style.border = "1.2px solid #000000";
					boxContent.style.position = "fixed";
					boxContent.style.left = "calc(50% - 300px)";
					boxContent.style.bottom = parseFloat(lib.config["extension_十周年UI_jindutiaoSet"]) + "%";

					var boxTime = document.createElement("div");
					boxTime.data = 620;
					boxTime.style.cssText = "background-image: linear-gradient(#fccc54 15%, #d01424 30%, #cc6953 90%);height:12.8px;";
					boxContent.appendChild(boxTime);
				}
				//-------样式2-----//
				if (lib.config.extension_十周年UI_jindutiaoYangshi == "2") {
					//十周年PC端进度条样式
					if (window.jindutiaoTeshu) {
						delete window.jindutiaoTeshu;
					}
					boxContent.style.width = "400px";
					boxContent.style.height = "24px";
					boxContent.style.display = "block";
					boxContent.style.left = "calc(50% - 197px)";
					boxContent.style.position = "fixed";
					boxContent.style.bottom = parseFloat(lib.config["extension_十周年UI_jindutiaoSet"]) + "%";

					var boxTime = document.createElement("div");
					boxTime.data = 300;
					boxTime.style.cssText = "width:280px;height:4.3px;margin:14px 0 0 85px;background-color: #E2E20A;border-right:5px solid #FFF;position: absolute;top: -3.5px;";
					boxContent.appendChild(boxTime);

					var imgBg = document.createElement("img");
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao.png";
					imgBg.style.cssText = "--w:400px;--h:calc(var(--w)*44/759);width: var(--w);height:var(--h);position: absolute;top: 0;";
					boxContent.appendChild(imgBg);
				}
				//-------样式3-----//
				if (lib.config.extension_十周年UI_jindutiaoYangshi == "3") {
					//十周年客户端进度条样式
					if (!window.jindutiaoTeshu) {
						window.jindutiaoTeshu = true;
					}
					boxContent.style.width = "400px";
					boxContent.style.height = "13px";
					boxContent.style.display = "block";
					boxContent.style["boxShadow"] = "0 0 4px #000000";
					boxContent.style.margin = "0 0 !important";
					boxContent.style.position = "fixed";
					boxContent.style.left = "calc(50% - 197px)";
					boxContent.style.bottom = parseFloat(lib.config["extension_十周年UI_jindutiaoSet"]) + "%";

					var boxTime = document.createElement("div");
					boxTime.data = 395; /*黄色条长度*/
					/*boxTime.style.cssText =
			"width:399px;height:10px;margin:0 0 0 0;background-color: #F4C336;border-radius:2px; border-top:0px solid #000000;border-bottom:0px solid #000000;position: absolute;top: 1px;border-radius: 0.5px;"*/
					boxTime.style.cssText = "z-index:1;width:399px;height:8px;margin:0 0 0 1px;background-color: #F4C336;border-top:3px solid #EBE1A7;border-bottom:2px solid #73640D;border-left:1px solid #73640D;position: absolute;top: 0px;border-radius:3px;";
					boxContent.appendChild(boxTime);

					var boxTime2 = document.createElement("div");
					boxTime2.data = 395; /*白色条长度*/
					boxTime2.style.cssText = "width:399px;height:0.1px;margin:0 0 0 0.5px;background-color: #fff; opacity:0.8 ;border-top:1px solid #FFF;border-bottom:1px solid #FFF;border-left:1px solid #FFF;position: absolute;top: 17px;border-radius: 2px;";
					boxContent.appendChild(boxTime2);
					//白条底图
					var imgBg3 = document.createElement("img");
					imgBg3.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao2.1.png";
					imgBg3.style.cssText = "width: 400px;height:4px;position: absolute;top: 16px;z-index: -1;";
					boxContent.appendChild(imgBg3);

					var imgBg = document.createElement("img");
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao2.png";
					imgBg.style.cssText = "width: 400px;height:13px;position: absolute;top: 0;opacity:0;";
					boxContent.appendChild(imgBg);
					/*底图*/
					var imgBg2 = document.createElement("img");
					imgBg2.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao2.1.png";
					imgBg2.style.cssText = "width: 400px;height:14px;position: absolute;top: 0;z-index: -1;";
					boxContent.appendChild(imgBg2);
				}
				if (lib.config.extension_十周年UI_jindutiaoYangshi == "4") {
					if (window.jindutiaoTeshu) {
						delete window.jindutiaoTeshu;
					}
					boxContent.style.width = "400px";
					boxContent.style.height = "13px";
					boxContent.style.display = "block";
					boxContent.style["boxShadow"] = "0 0 4px #000000";
					boxContent.style.margin = "0 0 !important";
					boxContent.style.position = "fixed";
					boxContent.style.left = "calc(50% - 197px)";
					boxContent.style.bottom = parseFloat(lib.config["extension_十周年UI_jindutiaoSet"]) + "%";

					var boxTime = document.createElement("div");
					boxTime.data = 395; /*黄色条长度*/
					boxTime.style.cssText = "z-index:1;width:399px;height:10px;margin:0 0 0 0px;background-color: #A56C41;position: absolute;top: 1px;";
					boxContent.appendChild(boxTime);
					/*底图*/
					var imgBg2 = document.createElement("img");
					imgBg2.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/newTimeBarBg.png";
					imgBg2.style.cssText = "width: 400px;height:12px;position: absolute;top: -3;z-index: -1;";
					boxContent.appendChild(imgBg2);
				}
				document.body.appendChild(boxContent);
				window.timer = setInterval(function () {
					boxTime.style.width = boxTime.data + "px";
					boxTime.data--;
					if (boxTime.data == 0) {
						clearInterval(window.timer);
						delete window.timer;
						boxContent.remove();
						if (lib.config.extension_十周年UI_jindutiaotuoguan == true && _status.auto == false) {
							ui.click.auto();
						}
					}
				}, parseFloat(lib.config["extension_十周年UI_jindutiaoST"])); //进度条间隔时间100
				//-------------//
				if (window.jindutiaoTeshu == true) {
					window.timer2 = setInterval(() => {
						boxTime2.data--;
						boxTime2.style.width = boxTime2.data + "px";
						if (boxTime2.data == 0) {
							clearInterval(window.timer2);
							delete window.timer2;
							delete window.jindutiaoTeshu;
							boxTime2.remove();
							imgBg3.remove();
							//ui.click.cancel();//结束回合
							//点击托管ui.click.auto();
						}
					}, parseFloat(lib.config["extension_十周年UI_jindutiaoST"]) / 2); //进度条时间
				}
			};
			//-----AI进度条框架----//
			game.JindutiaoAIplayer = function () {
				if (window.timerai) {
					clearInterval(window.timerai);
					delete window.timerai;
				}
				if (document.getElementById("jindutiaoAI")) {
					document.getElementById("jindutiaoAI").remove();
				}
				window.boxContentAI = document.createElement("div");
				window.boxTimeAI = document.createElement("div");
				window.boxContentAI.setAttribute("id", "jindutiaoAI");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					//--------手杀样式-------------//
					window.boxContentAI.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *4/145);width: var(--w);height: var(--h);left:3.5px;bottom:-6.2px;";
					window.boxTimeAI.data = 125;
					window.boxTimeAI.style.cssText = "z-index:92;--w: 33px;--h: calc(var(--w) * 4/120);width: var(--w);height: var(--h);margin:1px;background-color: #dd9900;position: absolute;top: 0px;";
					window.boxContentAI.appendChild(boxTimeAI);

					var imgBg = document.createElement("img");
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/time.png";
					imgBg.style.cssText = "position:absolute;z-index:91;--w: 122px;--h: calc(var(--w) * 4/145);width: var(--w);height: var(--h);top: 0;";
					boxContentAI.appendChild(imgBg);

					//-------------------------//
				} else {
					//----------十周年样式--------//
					window.boxContentAI.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *8/162);width: var(--w);height: var(--h);left:1.5px;bottom:-8.2px;";
					window.boxTimeAI.data = 120;
					window.boxTimeAI.style.cssText = "z-index:91;width: 115px;height: 3.3px;margin:1px;background-color: #f2c84b;position: absolute;top: 0px;border-radius: 3px;";
					window.boxContentAI.appendChild(boxTimeAI);

					var imgBg = document.createElement("img");
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/timeX.png";
					imgBg.style.cssText = "position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) * 8/162);width: var(--w);height: var(--h);top: 0;";
					window.boxContentAI.appendChild(imgBg);
					//--------------------//
				}
				window.timerai = setInterval(() => {
					window.boxTimeAI.data--;
					window.boxTimeAI.style.width = boxTimeAI.data + "px";
					if (window.boxTimeAI.data == 0) {
						clearInterval(window.timerai);
						delete window.timerai;
						window.boxContentAI.remove();
					}
				}, 150); //进度条时间
			};
			if (!window.chatRecord) window.chatRecord = [];
			game.addChatWord = function (strx) {
				if (window.chatRecord.length > 30) {
					//设置一下上限30条，不设也行，把这个if删除即可
					window.chatRecord.remove(window.chatRecord[0]);
				}
				if (strx) {
					window.chatRecord.push(strx);
				}
				var str = (window.chatRecord[0] || "") + "<br>";
				if (window.chatRecord.length > 1) {
					for (var i = 1; i < window.chatRecord.length; i++) {
						str += "<br>" + window.chatRecord[i] + "<br>";
					}
				}
				if (window.chatBackground2 != undefined) game.updateChatWord(str);
			};
			//这里
			game.showChatWordBackgroundX = function () {
				if (window.chatBg != undefined && window.chatBg.show) {
					//控制面板打开，首次调用此函数时打开面板，再次调用时关闭
					window.chatBg.hide();
					//关闭砸表情
					if (window.jidan.thrownn) window.jidan.thrownn = false;
					if (window.tuoxie.thrownn) window.tuoxie.thrownn = false;
					if (window.xianhua.thrownn) window.xianhua.thrownn = false;
					if (window.meijiu.thrownn) window.meijiu.thrownn = false;
					if (window.cailan.thrownn) window.cailan.thrownn = false;
					if (window.qicai.thrownn) window.qicai.thrownn = false;
					window.chatBg.show = false;
					if (window.dialog_lifesay) {
						if (window.dialog_lifesay.show) window.dialog_lifesay.style.left = "-" + window.dialog_lifesay.style.width;
						setTimeout(function () {
							window.dialog_lifesay.hide();
							window.dialog_lifesay.show = false;
						}, 100);
					}
					if (window.dialog_emoji) {
						if (window.dialog_emoji.show) window.dialog_emoji.style.top = "100%";
						setTimeout(function () {
							window.dialog_emoji.hide();
							window.dialog_emoji.show = false;
						}, 1000);
					}
					if (window.chatBackground) {
						if (window.chatBackground.show) window.chatBackground.style.left = "100%";
						setTimeout(function () {
							window.chatBackground.hide();
							window.chatBackground.show = false;
						}, 1000);
					}
					return;
				}
				var dialogChat = {};
				//聊天框整体
				window.chatBg = ui.create.div("hidden");
				window.chatBg.classList.add("popped");
				window.chatBg.classList.add("static");
				window.chatBg.show = true;
				window.chatBg.style.cssText = "display: block;--w: 420px;--h: calc(var(--w) * 430/911);width: var(--w);height: var(--h);position: fixed;left:30%;bottom:5%;opacity: 1;background-size: 100% 100%;background-color: transparent;z-index:99;";
				window.chatBg.style.transition = "all 1.5s";
				/*window.chatBg.style.height='170px';//调整对话框背景大小，位置
		window.chatBg.style.width='550px';
		  window.chatBg.style.left='calc(50%-130px)';
		window.chatBg.style.top='calc(100% - 470px)';
		window.chatBg.style.opacity=1;*/
				window.chatBg.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/chat.png");
				/*window.chatBg.style.backgroundSize="100% 100%";
		window.chatBg.style.transition='all 0.5s';
		window.chatBg.style['box-shadow']='none';*/
				ui.window.appendChild(window.chatBg);

				var clickFK = function (div) {
					div.style.transition = "opacity 0.5s";
					div.addEventListener(lib.config.touchscreen ? "touchstart" : "mousedown", function () {
						this.style.transform = "scale(0.95)";
					});
					div.addEventListener(lib.config.touchscreen ? "touchend" : "mouseup", function () {
						this.style.transform = "";
					});
					div.onmouseout = function () {
						this.style.transform = "";
					};
				};
				//--------------------------------//
				game.open_lifesay = function () {
					//打开常用语函数
					if (window.dialog_emoji) {
						if (window.dialog_emoji.show) window.dialog_emoji.style.top = "100%";
						setTimeout(function () {
							window.dialog_emoji.hide();
							window.dialog_emoji.show = false;
						}, 1000);
					}
					if (window.chatBackground) {
						if (window.chatBackground.show) window.chatBackground.style.left = "100%";
						setTimeout(function () {
							window.chatBackground.hide();
							window.chatBackground.show = false;
						}, 1000);
					}
					if (window.dialog_lifesay != undefined && window.dialog_lifesay.show) {
						//控制面板打开，首次调用此函数时打开面板，再次调用时关闭
						window.dialog_lifesay.hide();
						window.dialog_lifesay.show = false;
						return;
					}
					var dialogLife = {};
					window.dialog_lifesay = ui.create.div("hidden");
					window.dialog_lifesay.style["z-index"] = 999999999;
					window.dialog_lifesay.classList.add("popped");
					window.dialog_lifesay.classList.add("static");
					window.dialog_lifesay.show = true;
					window.dialog_lifesay.style.height = "300px"; //整个常用语对话框的宽高
					window.dialog_lifesay.style.width = "600px"; //对话框的宽度，由每一条的内容字数决定，可自行调整，使用固定大小避免手机和电脑像素不同导致冲突
					window.dialog_lifesay.style.left = "-" + window.dialog_lifesay.style.width; //这里弄一个右移的动画
					setTimeout(function () {
						window.dialog_lifesay.style.left = "calc( 50% - 300px)"; //整个对话框的位置
					}, 100);
					window.dialog_lifesay.style.top = "calc( 20% - 100px)"; //整个对话框的位置
					window.dialog_lifesay.style.transition = "all 1s";
					window.dialog_lifesay.style.opacity = 1;
					window.dialog_lifesay.style.borderRadius = "8px";
					window.dialog_lifesay.style.backgroundSize = "100% 100%";
					window.dialog_lifesay.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png"); //把背景dialog设置为透明
					window.dialog_lifesay.style["box-shadow"] = "none";
					ui.window.appendChild(window.dialog_lifesay);
					dialogLife.background = window.dialog_lifesay;
					window.dialog_lifesayBgPict = ui.create.div("hidden"); //这是现在的背景颜色的div，外层div
					window.dialog_lifesayBgPict.style.height = "100%";
					window.dialog_lifesayBgPict.style.width = "100%";
					window.dialog_lifesayBgPict.style.left = "0%";
					window.dialog_lifesayBgPict.style.top = "0%";
					window.dialog_lifesayBgPict.style.borderRadius = "8px";
					window.dialog_lifesayBgPict.style.backgroundSize = "100% 100%";
					window.dialog_lifesayBgPict.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/saydiv.png");
					window.dialog_lifesayBgPict.style["box-shadow"] = "none";
					window.dialog_lifesay.appendChild(window.dialog_lifesayBgPict);
					window.dialog_lifesayBgColor = ui.create.div("hidden"); //这是原来的背景颜色的div，内层div
					window.dialog_lifesayBgColor.style.height = "70%";
					window.dialog_lifesayBgColor.style.width = "80%";
					window.dialog_lifesayBgColor.style.left = "10%";
					window.dialog_lifesayBgColor.style.top = "10%";
					window.dialog_lifesayBgColor.style.borderRadius = "8px";
					window.dialog_lifesayBgColor.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png"); //把背景设置为透明
					//window.dialog_lifesayBgColor.style.backgroundColor='black';
					window.dialog_lifesayBgColor.style["overflow-y"] = "scroll";
					lib.setScroll(window.dialog_lifesayBgColor);
					window.dialog_lifesay.appendChild(window.dialog_lifesayBgColor);
					window.lifesayWord = ["能不能快点呀，兵贵神速啊", "主公，别开枪，自己人", "小内再不跳，后面还怎么玩啊", "你们怎么忍心就这么让我酱油了", "我，我惹你们了吗", "姑娘，你真是条汉子", "三十六计，走为上，容我去去便回", "人心散了，队伍不好带啊", "昏君，昏君啊", "风吹鸡蛋壳，牌去人安乐", "小内啊，您老悠着点儿", "不好意思，刚才卡了", "你可以打得再烂一点吗", "哥们儿，给力点行吗", "哥，交个朋友吧", "妹子，交个朋友吧"];
					for (var i = 0; i < window.lifesayWord.length; i++) {
						window["dialog_lifesayContent_" + i] = ui.create.div("hidden", "", function () {
							game.me.say(this.content);
							window.dialog_lifesay.delete();
							delete window.dialog_lifesay;
							window.dialog_lifesay = undefined;
							game.playAudio("..", "extension", "十周年UI/shoushaUI/sayplay/audio", this.pos + "_" + game.me.sex);
						});
						window["dialog_lifesayContent_" + i].style.height = "10%"; //每一条内容的高度，可以用px也可以用百分比，由你喜欢
						window["dialog_lifesayContent_" + i].style.width = "100%"; //每一条内容的宽度，默认与整个对话框宽度挂钩以美观，具体百分比可自己调整
						window["dialog_lifesayContent_" + i].style.left = "0%";
						window["dialog_lifesayContent_" + i].style.top = "0%";
						window["dialog_lifesayContent_" + i].style.position = "relative";
						window["dialog_lifesayContent_" + i].pos = i;
						window["dialog_lifesayContent_" + i].content = window.lifesayWord[i];
						window["dialog_lifesayContent_" + i].innerHTML = "<font color=white>" + window.lifesayWord[i] + "</font>"; //显示的字体可以自己改
						window.dialog_lifesayBgColor.appendChild(window["dialog_lifesayContent_" + i]);
						clickFK(window["dialog_lifesayContent_" + i]);
					}
				};
				//常用语按钮
				window.chatButton1 = ui.create.div("hidden", "", game.open_lifesay);
				window.chatButton1.style.cssText = "display: block;--w: 80px;--h: calc(var(--w) * 82/98);width: var(--w);height: var(--h);left:40px;bottom:25px;transition:none;background-size:100% 100%";
				/*window.chatButton1.style.height='70px';
				window.chatButton1.style.width='80px';
				window.chatButton1.style.left='40px';
				window.chatButton1.style.bottom='10px';
				window.chatButton1.style.transition='none';
				window.chatButton1.style.backgroundSize="100% 100%";*/
				window.chatButton1.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/lifesay.png");

				lib.setScroll(window.chatButton1);
				window.chatBg.appendChild(window.chatButton1);
				clickFK(window.chatButton1);
				//-----------------------------------//
				//-----------互动框---------//
				game.open_hudong = function () {
					//打开互动框函数
					if (window.dialog_hudong != undefined && dialog_hudong.show) {
						//控制面板打开，首次调用此函数时打开面板，再次调用时关闭
						window.dialog_hudong.hide();
						window.dialog_hudong.show = false;
						return;
					}
				};
				//------菜篮子框------//
				window.hudongkuang = ui.create.div("hidden", "", game.open_hudong);
				window.hudongkuang.style.cssText = "display: block;--w: 315px;--h: calc(var(--w) * 135/142);width: var(--w);height: var(--h);left:-280px;bottom:-30px;transition:none;background-size:100% 100%;pointer-events:none;";
				window.hudongkuang.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/hudong.png");
				window.chatBg.appendChild(window.hudongkuang);
				//------1--美酒-------//
				game.open_meijiu = function () {
					//打开美酒函数
					//这里
					var list = game.players;
					for (let i = 0; i < game.players.length; i++) {
						list[i].onclick = function () {
							var target = this;
							if (window.meijiu.thrownn == true) {
								for (let i = 0; i < 10; i++) {
									setTimeout(() => {
										if (i <= 8) game.me.throwEmotion(this, "flower");
										else game.me.throwEmotion(this, "wine");
										window.shuliang.innerText = window.shuliang.innerText - 1;
									}, 100 * i);
									setTimeout(() => {
										if (i <= 8) target.throwEmotion(game.me, "flower");
										else target.throwEmotion(game.me, "wine");
									}, 100 * i + 500);
								}
							}
						};
					}
				};
				window.meijiu = ui.create.div("hidden", "", game.open_meijiu);
				window.meijiu.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-155px;bottom:173px;transition:none;background-size:100% 100%";

				window.meijiu.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/meijiu.png");
				//这里
				window.meijiu.onclick = function () {
					window.meijiu.thrownn = true;
				};
				window.chatBg.appendChild(window.meijiu);
				lib.setScroll(window.meijiu);
				clickFK(window.meijiu);
				//---2-----鲜花-------//
				game.open_xianhua = function () {
					//打开鲜花函数
					//这里
					var list = game.players;
					for (let i = 0; i < game.players.length; i++) {
						list[i].onclick = function () {
							if (window.xianhua.thrownn == true) game.me.throwEmotion(this, "flower");
							window.shuliang.innerText = window.shuliang.innerText - 1;
						};
					}
				};
				window.xianhua = ui.create.div("hidden", "", game.open_xianhua);
				window.xianhua.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-230px;bottom:173px;transition:none;background-size:100% 100%";

				window.xianhua.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/xianhua.png");
				//这里
				window.xianhua.onclick = function () {
					window.xianhua.thrownn = true;
				};
				window.chatBg.appendChild(window.xianhua);
				lib.setScroll(window.xianhua);
				clickFK(window.xianhua);
				//-----3---拖鞋-------//
				game.open_tuoxie = function () {
					//打开拖鞋函数
					//这里
					var list = game.players;
					var num = 10;
					for (let i = 0; i < game.players.length; i++) {
						list[i].onclick = function () {
							var target = this;
							if (window.tuoxie.thrownn == true) {
								for (let i = 0; i < num; i++) {
									setTimeout(() => {
										if (i <= 8) {
											game.me.throwEmotion(this, "egg");
											window.shuliang.innerText = window.shuliang.innerText - 1;
										} else {
											game.me.throwEmotion(this, "shoe");
											window.shuliang.innerText = window.shuliang.innerText - 1;
										}
									}, 100 * i);
									setTimeout(() => {
										if (i <= 8) target.throwEmotion(game.me, "egg");
										else target.throwEmotion(game.me, "shoe");
									}, 100 * i + 1000);
								}
							}
						};
					}
				};
				window.tuoxie = ui.create.div("hidden", "", game.open_tuoxie);
				window.tuoxie.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-155px;bottom:105px;transition:none;background-size:100% 100%";

				window.tuoxie.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/tuoxie.png");
				//这里
				window.tuoxie.onclick = function () {
					window.tuoxie.thrownn = true;
				};

				window.chatBg.appendChild(window.tuoxie);
				lib.setScroll(window.tuoxie);
				clickFK(window.tuoxie);

				game.open_jidan = function () {
					//打开鸡蛋函数
					//这里
					var list = game.players;
					for (let i = 0; i < game.players.length; i++) {
						list[i].onclick = function () {
							if (window.jidan.thrownn == true) {
								game.me.throwEmotion(this, "egg");
								window.shuliang.innerText = window.shuliang.innerText - 1;
							}
						};
					}
				};

				window.jidan = ui.create.div("hidden", "", game.open_jidan);
				window.jidan.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-230px;bottom:105px;transition:none;background-size:100% 100%";
				window.jidan.onclick = function () {
					window.jidan.thrownn = true;
				};

				//这里
				window.jidan.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/jidan.png");
				window.chatBg.appendChild(window.jidan);
				lib.setScroll(window.jidan);
				clickFK(window.jidan);

				//-----5--菜篮-------//
				game.open_cailan = function () {
					//打开菜篮函数
					var list = game.players;
					for (let i = 0; i < game.players.length; i++) {
						list[i].onclick = function () {
							var target = this;
							if (window.cailan.thrownn == true) {
								for (let i = 0; i < 101; i++) {
									setTimeout(() => {
										if (i <= 99) game.me.throwEmotion(this, "flower");
										else game.me.throwEmotion(this, "wine");
										window.shuliang.innerText = window.shuliang.innerText - 1;
									}, 100 * i);
									setTimeout(() => {
										if (i <= 99) target.throwEmotion(game.me, "flower");
										else target.throwEmotion(game.me, "wine");
									}, 100 * i + 1000);
								}
							}
						};
					}
				};

				window.cailan = ui.create.div("hidden", "", game.open_cailan);
				window.cailan.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-80px;bottom:173px;transition:none;background-size:100% 100%";

				window.cailan.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/cailan.png");
				window.cailan.onclick = function () {
					window.cailan.thrownn = true;
				};
				window.chatBg.appendChild(window.cailan);
				lib.setScroll(window.cailan);
				clickFK(window.cailan);
				//------6--七彩-------//
				game.open_qicai = function () {
					//打开七彩函数
					var list = game.players;
					for (let i = 0; i < game.players.length; i++) {
						list[i].onclick = function () {
							var target = this;
							if (window.qicai.thrownn == true) {
								for (let i = 0; i < 101; i++) {
									setTimeout(() => {
										if (i <= 99) game.me.throwEmotion(this, "egg");
										else game.me.throwEmotion(this, "shoe");
										window.shuliang.innerText = window.shuliang.innerText - 1;
									}, 100 * i);
									setTimeout(() => {
										if (i <= 99) target.throwEmotion(game.me, "egg");
										else target.throwEmotion(game.me, "shoe");
									}, 100 * i + 1000);
								}
							}
						};
					}
				};

				window.qicai = ui.create.div("hidden", "", game.open_qicai);
				window.qicai.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-80px;bottom:105px;transition:none;background-size:100% 100%";

				window.qicai.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/qicai.png");

				window.qicai.onclick = function () {
					window.qicai.thrownn = true;
				};
				window.chatBg.appendChild(window.qicai);
				lib.setScroll(window.qicai);
				clickFK(window.qicai);
				//-----7---小酒-------//
				game.open_xiaojiu = function () {};
				window.xiaojiu = ui.create.div("hidden", "", game.open_xiaojiu);
				window.xiaojiu.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-230px;bottom:36px;transition:none;background-size:100% 100%";

				window.xiaojiu.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/xiaojiu.png");
				window.chatBg.appendChild(window.xiaojiu);
				lib.setScroll(window.xiaojiu);
				clickFK(window.xiaojiu);
				//-----8---雪球------//

				game.open_xueqiu = function () {
					//打开雪球函数
				};
				window.xueqiu = ui.create.div("hidden", "", game.open_xueqiu);
				window.xueqiu.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-155px;bottom:36px;transition:none;background-size:100% 100%";

				window.xueqiu.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/xueqiu.png");

				window.chatBg.appendChild(window.xueqiu);
				lib.setScroll(window.xueqiu);
				clickFK(window.xueqiu);

				//-------------------//

				//------9-虚无-------//

				game.open_xuwu = function () {
					//打开虚无函数
				};

				window.xuwu = ui.create.div("hidden", "", game.open_xuwu);
				window.xuwu.style.cssText = "display: block;--w: 63px;--h: calc(var(--w) * 50/50);width: var(--w);height: var(--h);left:-80px;bottom:36px;transition:none;background-size:100% 100%";

				window.xuwu.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/xuwu.png");

				window.chatBg.appendChild(window.xuwu);
				lib.setScroll(window.xuwu);
				clickFK(window.xuwu);

				//-------------------//

				//--------菜篮子-------//

				window.cailanzi = ui.create.div("hidden", "");
				window.cailanzi.style.cssText = "display: block;--w: 100px;--h: calc(var(--w) * 59/150);width: var(--w);height: var(--h);left:-230px;bottom:250px;transition:none;background-size:100% 100%";

				window.cailanzi.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/cailanzi.png");

				window.chatBg.appendChild(window.cailanzi);

				window.shuliang = ui.create.node("div");
				window.shuliang.innerText = Math.floor(Math.random() * (999 - 100 + 1) + 100);
				window.shuliang.style.cssText = "display: block;left:-180px;bottom:260px;font-family:'shousha';color:#97856a;font-weight: 900; text-shadow:none;transition:none;background-size:100% 100%";

				window.chatBg.appendChild(window.shuliang);

				game.open_emoji = function () {
					//打开emoji函数
					if (window.dialog_lifesay) {
						if (window.dialog_lifesay.show) window.dialog_lifesay.style.left = "-" + window.dialog_lifesay.style.width;
						setTimeout(function () {
							window.dialog_lifesay.hide();
							window.dialog_lifesay.show = false;
						}, 1000);
					}
					if (window.chatBackground) {
						if (window.chatBackground.show) window.chatBackground.style.left = "100%";
						setTimeout(function () {
							window.chatBackground.hide();
							window.chatBackground.show = false;
						}, 1000);
					}
					if (window.dialog_emoji != undefined && window.dialog_emoji.show) {
						//控制面板打开，首次调用此函数时打开面板，再次调用时关闭
						window.dialog_emoji.hide();
						window.dialog_emoji.show = false;
						return;
					}
					var dialogEmoji = {};
					window.dialog_emoji = ui.create.div("hidden");
					window.dialog_emoji.style["z-index"] = 999999999;
					window.dialog_emoji.classList.add("popped");
					window.dialog_emoji.classList.add("static");
					window.dialog_emoji.show = true;
					window.dialog_emoji.style.height = "280px"; //整个选择emoji对话框的宽高
					window.dialog_emoji.style.width = "360px";
					window.dialog_emoji.style.left = "calc( 50% - 180px)";
					window.dialog_emoji.style.top = "100%"; //这里弄一个上移的动画
					window.dialog_emoji.style.transition = "all 1s";
					setTimeout(function () {
						window.dialog_emoji.style.top = "calc( 25% - 50px )"; //上移后的位置
					}, 100);
					window.dialog_emoji.style.opacity = 1;
					window.dialog_emoji.style.borderRadius = "8px";
					window.dialog_emoji.style.backgroundSize = "100% 100%";
					window.dialog_emoji.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png"); //把背景dialog设置为透明
					window.dialog_emoji.style["box-shadow"] = "none";
					ui.window.appendChild(window.dialog_emoji);
					dialogEmoji.background = window.dialog_emoji;
					window.dialog_emojiBgPict = ui.create.div("hidden"); //这是现在外层div
					window.dialog_emojiBgPict.style.height = "100%";
					window.dialog_emojiBgPict.style.width = "100%";
					window.dialog_emojiBgPict.style.left = "0%";
					window.dialog_emojiBgPict.style.top = "0%";
					window.dialog_emojiBgPict.style.borderRadius = "8px";
					window.dialog_emojiBgPict.style.backgroundSize = "100% 100%";
					window.dialog_emojiBgPict.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/saydiv.png");
					window.dialog_emojiBgPict.style["box-shadow"] = "none";
					window.dialog_emoji.appendChild(window.dialog_emojiBgPict);
					window.dialog_emojiBgColor = ui.create.div("hidden"); //这是内层div
					window.dialog_emojiBgColor.style.height = "70%";
					window.dialog_emojiBgColor.style.width = "80%";
					window.dialog_emojiBgColor.style.left = "10%";
					window.dialog_emojiBgColor.style.top = "10%";
					window.dialog_emojiBgColor.style.borderRadius = "8px";
					window.dialog_emojiBgColor.style.backgroundSize = "100% 100%";
					window.dialog_emojiBgColor.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png"); //把背景设置为透明
					window.dialog_emojiBgColor.style["overflow-y"] = "scroll";
					lib.setScroll(window.dialog_emojiBgColor);
					window.dialog_emoji.appendChild(window.dialog_emojiBgColor);
					for (var i = 0; i < 50; i++) {
						window["dialog_emojiContent_" + i] = ui.create.div("hidden", "", function () {
							game.me.say('<img style=width:34px height:34px src="' + lib.assetURL + "extension/十周年UI/shoushaUI/sayplay/emoji/" + this.pos + '.png">');
							window.dialog_emoji.delete();
							delete window.dialog_emoji;
							window.dialog_emoji = undefined;
						});
						window["dialog_emojiContent_" + i].style.height = "34px"; //单个表情的宽高
						window["dialog_emojiContent_" + i].style.width = "34px";
						window["dialog_emojiContent_" + i].style.left = "0px";
						window["dialog_emojiContent_" + i].style.top = "0px";
						window["dialog_emojiContent_" + i].style.position = "relative";
						window["dialog_emojiContent_" + i].pos = i;
						window["dialog_emojiContent_" + i].setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/emoji/" + i + ".png");
						window["dialog_emojiContent_" + i].style.backgroundSize = "100% 100%";
						window.dialog_emojiBgColor.appendChild(window["dialog_emojiContent_" + i]);
						clickFK(window["dialog_emojiContent_" + i]);
					}
				};
				window.chatButton2 = ui.create.div("hidden", "", game.open_emoji);
				window.chatButton2.style.cssText = "display: block;--w: 80px;--h: calc(var(--w) * 82/98);width: var(--w);height: var(--h);left:150px;bottom:25px;transition:none;background-size:100% 100%";
				/*window.chatButton2.style.height='70px';
				window.chatButton2.style.width='80px';
				window.chatButton2.style.left='150px';
				window.chatButton2.style.bottom='10px';
				window.chatButton2.style.transition='none';
				window.chatButton2.style.backgroundSize="100% 100%";*/
				window.chatButton2.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/emoji.png");

				lib.setScroll(window.chatButton2);
				window.chatBg.appendChild(window.chatButton2);
				clickFK(window.chatButton2);

				game.open_jilu = function () {
					//打开记录函数
					game.showChatWord();
				};
				window.chatButton3 = ui.create.div("hidden", "", game.open_jilu);
				window.chatButton3.style.cssText = "display: block;--w: 80px;--h: calc(var(--w) * 82/98);width: var(--w);height: var(--h);left:260px;bottom:25px;transition:none;background-size:100% 100%";
				/*window.chatButton3.style.height='70px';
				window.chatButton3.style.width='80px';
				window.chatButton3.style.left='260px';
				window.chatButton3.style.bottom='10px';
				window.chatButton3.style.transition='none';
				window.chatButton3.style.backgroundSize="100% 100%";*/
				window.chatButton3.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/jilu.png");

				lib.setScroll(window.chatButton3);
				window.chatBg.appendChild(window.chatButton3);
				clickFK(window.chatButton3);

				window.chatSendBottom = ui.create.div("", "", function () {
					//发送按钮
					if (!window.input) return;
					if (window.input.value == undefined) return;
					window.sendInfo(window.input.value);
				});
				window.chatSendBottom.style.cssText = "display: block;--w: 91px;--h: calc(var(--w) * 62/160);width: var(--w);height: var(--h);left:70%;top:33px;transition:none;background-size:100% 100%;text-align:center;border-randius:8px;";
				/*window.chatSendBottom.style.height='50px';
				window.chatSendBottom.style.width='25%';
				window.chatSendBottom.style.left='calc( 60% + 62px )';
				window.chatSendBottom.style.top='23px';
				window.chatSendBottom.style.transition='none';
				window.chatSendBottom.style['text-align']='center';
				window.chatSendBottom.style.borderRadius='8px';
				window.chatSendBottom.style.backgroundSize="100% 100%";*/

				window.chatSendBottom.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/buttonsend.png");
				window.chatSendBottom.innerHTML = '<span style="color:white;font-size:22px;line-height:32px;font-weight:400;font-family:shousha">发送</span>';
				window.chatBg.appendChild(window.chatSendBottom);
				clickFK(window.chatSendBottom);
				game.updateChatWord = function (str) {
					window.chatBackground2.innerHTML = str;
				};
				game.addChatWord();

				window.sendInfo = function (content) {
					game.me.say(content);
					window.input.value = "";
				};
				//房间
				window.chatInputOut = ui.create.div("hidden");
				window.chatInputOut.style.cssText = "display: block;--w: 265px;--h: calc(var(--w) * 50/280);width: var(--w);height: var(--h);left:30px;top:30px;transition:none;background-size:100% 100%;pointer-events:none;z-index:6;";
				/*window.chatInputOut.style.height='22px';
				window.chatInputOut.style.width='60%';
				window.chatInputOut.style.left='40px';
				window.chatInputOut.style.top='40px';
				window.chatInputOut.style.transition='none';
				window.chatInputOut.style.backgroundSize="100% 100%";*/
				window.chatInputOut.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/shoushaUI/sayplay/sayX.png')";

				window.chatBg.appendChild(window.chatInputOut);
				//输入框
				window.chatInput = ui.create.dialog("hidden");
				window.chatInput.style.height = "22px";
				window.chatInput.style.width = "42%"; //设置输入框宽度
				window.chatInput.style.left = "27%";
				window.chatInput.style.top = "42px";
				window.chatInput.style.transition = "none";
				window.chatBg.appendChild(window.chatInput);
				window.ipt = ui.create.div();
				window.ipt.style.height = "22px";
				window.ipt.style.width = "100%";
				window.ipt.style.top = "0px";
				window.ipt.style.left = "0px";
				window.ipt.style.margin = "0px";
				window.ipt.style.borderRadius = "0px";
				window.ipt.style["background-image"] = "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4))";
				//window.ipt.style['box-shadow']='rgba(0, 0, 0, 0.4) 0 0 0 1px, rgba(0, 0, 0, 0.2) 0 3px 10px';
				if (window.input && window.input.value) window.input_value = window.input.value;
				window.ipt.innerHTML = '<input type="text" value=' + (window.input_value || "请输入文字") + ' style="color:white;font-family:shousha;width:calc(100% - 10px);text-align:left;"></input>';
				window.input = window.ipt.querySelector("input");
				window.input.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/shoushaUI/sayplay/say.png')";
				window.input.style.backgroundSize = "120% 120%";
				window.input.style["box-shadow"] = "none";
				window.input.onclick = function (e) {
					e.stopPropagation();
				};
				window.input.onfocus = function () {
					if (this.value == "请输入文字") this.value = "";
				};
				window.input.onkeydown = function (e) {
					e.stopPropagation();
					if (e.keyCode == 13) {
						var value = this.value;
						if (!value) return;
						if (typeof value != "string") value = "" + value;
						window.sendInfo(value);
					}
				};
				window.chatInput.add(window.ipt);
			};

			//聊天记录栏
			game.showChatWord = function () {
				if (window.dialog_lifesay) {
					if (window.dialog_lifesay.show) window.dialog_lifesay.style.left = "-" + window.dialog_lifesay.style.width;
					setTimeout(function () {
						window.dialog_lifesay.hide();
						window.dialog_lifesay.show = false;
					}, 1000);
				}
				if (window.dialog_emoji) {
					if (window.dialog_emoji.show) window.dialog_emoji.style.top = "100%";
					setTimeout(function () {
						window.dialog_emoji.hide();
						window.dialog_emoji.show = false;
					}, 1000);
				}
				if (window.chatBackground != undefined && window.chatBackground.show) {
					//控制面板打开，首次调用此函数时打开面板，再次调用时关闭
					window.chatBackground.hide();
					window.chatBackground.show = false;
					return;
				}
				window.chatBackground = ui.create.div("hidden");
				window.chatBackground.style["z-index"] = 999999999;
				//window.chatBackground.classList.add('popped');
				window.chatBackground.classList.add("static");
				window.chatBackground.show = true;
				window.chatBackground.style.transition = "all 1s";
				window.chatBackground.style.height = "330px"; //调整对话框背景大小，位置
				window.chatBackground.style.width = "600px";
				window.chatBackground.style.top = "calc( 20% - 100px )"; //这里弄一个左移的动画
				window.chatBackground.style.left = "100%"; //这里弄一个左移的动画
				setTimeout(function () {
					window.chatBackground.style.left = "calc( 50% - 300px)"; //左移后的位置
				}, 100);
				window.chatBackground.style.bottom = "calc( " + window.chatBg.style.height + " + " + "5px )";
				window.chatBackground.style.opacity = 1;
				window.chatBackground.style.borderRadius = "10px";
				game.mouseChatDiv = function (div) {
					//查看时显示，不查看时，对话框虚化
					if (lib.device == undefined) {
						div.onmouseover = function () {
							this.style.opacity = 1.0;
						};
						div.onmouseout = function () {
							this.style.opacity = 0.25;
						};
					} else {
						div.onclick = function () {
							if (div.style.opacity == 0.25) this.style.opacity = 0.75;
							else this.style.opacity = 0.25;
						};
					}
				};
				game.mouseChatDiv(window.chatBackground);
				window.chatBackground.style.backgroundSize = "100% 100%";
				window.chatBackground.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png"); //把背景dialog设置为透明
				window.chatBackground.style["box-shadow"] = "none";
				ui.window.appendChild(window.chatBackground);

				window.chatBackgroundPict = ui.create.div("hidden"); //外层div
				window.chatBackgroundPict.style.height = "100%";
				window.chatBackgroundPict.style.width = "100%";
				window.chatBackgroundPict.style.left = "0%";
				window.chatBackgroundPict.style.bottom = "0%";
				window.chatBackgroundPict.style.transition = "none";
				window.chatBackgroundPict.style.backgroundColor = "none";
				window.chatBackgroundPict.style.borderRadius = "8px";
				window.chatBackgroundPict.style.backgroundSize = "100% 100%";
				window.chatBackgroundPict.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/saydiv.png");
				window.chatBackgroundPict.style["box-shadow"] = "none";
				window.chatBackground.appendChild(window.chatBackgroundPict);

				window.chatBackgroundColor = ui.create.div("hidden"); //内层div
				window.chatBackgroundColor.style.height = "70%";
				window.chatBackgroundColor.style.width = "80%";
				window.chatBackgroundColor.style.left = "10%";
				window.chatBackgroundColor.style.top = "10%";
				window.chatBackgroundColor.style.transition = "none";
				window.chatBackgroundColor.style.borderRadius = "8px";
				window.chatBackgroundColor.style.backgroundSize = "100% 100%";
				window.chatBackgroundColor.setBackgroundImage("extension/十周年UI/shoushaUI/sayplay/nobg.png"); //把背景设置为透明
				window.chatBackground.appendChild(window.chatBackgroundColor);

				window.chatBackground2 = ui.create.div("hidden");
				window.chatBackground2.style.height = "100%";
				window.chatBackground2.style.width = "100%";
				window.chatBackground2.style.left = "0%";
				window.chatBackground2.style.bottom = "0%";
				window.chatBackground2.style.transition = "none";
				window.chatBackground2.style["text-align"] = "left";
				window.chatBackground2.innerHTML = "";
				window.chatBackground2.style["overflow-y"] = "scroll";
				lib.setScroll(window.chatBackground2);
				window.chatBackgroundColor.appendChild(window.chatBackground2);
				game.addChatWord();
			};

			lib.skill._wmkzSayChange = {
				trigger: {
					global: ["gameStart", "phaseBegin", "phaseAfter", "useCardAfter"],
				},
				forced: true,
				silent: true,
				filter(event, player) {
					return player.change_sayFunction != true;
				},
				content() {
					player.change_sayFunction = true;
					player.sayTextWord = player.say;
					player.say = function (str) {
						//对应上面函数，把其他player的发言记录到框里
						game.addChatWord("<font color=yellow>" + get.translation("" + player.name) + "</font><font color=white>：" + str + "</font>");
						player.sayTextWord(str);
					};
				},
			};
			//阶段提示框架（俺杀）
			//自定义播放图片
			game.as_removeText = function () {
				if (_status.as_showText) {
					_status.as_showText.remove();
					delete _status.as_showText;
				}
				if (_status.as_showImage) {
					_status.as_showImage.show();
				}
			};
			game.as_showText = function (str, pos, time, font, size, color) {
				if (!str) return false;
				if (!pos || !Array.isArray(pos)) {
					pos = [0, 0, 100, 100];
				}
				if (!time || (isNaN(time) && time !== true)) time = 3;
				if (!font) font = "shousha";
				if (!size) size = 16;
				if (!color) color = "#ffffff";
				if (_status.as_showText) {
					_status.as_showText.remove();
					delete _status.as_showText;
				}

				var div = ui.create.div("", str, ui.window);
				div.style.cssText = "z-index:-3; pointer-events:none; font-family:" + font + "; font-size:" + size + "px; color:" + color + "; line-height:" + size * 1.2 + "px; text-align:center; left:" + (pos[0] + pos[2] / 2) + "%; top:" + pos[1] + "%; width:0%; height:" + pos[3] + "%; position:absolute; transition-property:all; transition-duration:1s";
				_status.as_showText = div;

				if (_status.as_showImage) {
					_status.as_showImage.hide();
				}

				setTimeout(function () {
					div.style.left = pos[0] + "%";
					div.style.width = pos[2] + "%";
				}, 1);

				if (time === true) return true;
				setTimeout(function () {
					if (_status.as_showText) {
						_status.as_showText.remove();
						delete _status.as_showText;
					}
					if (_status.as_showImage) {
						_status.as_showImage.show();
					}
				}, time * 1000);

				return true;
			};
			game.as_removeImage = function () {
				if (_status.as_showImage) {
					var outdiv = _status.as_showImage;
					_status.as_showImage.style.animation = "left-to-right-out 1s";
					delete _status.as_showImage;
					setTimeout(function () {
						outdiv.remove();
					}, 1000);
				}
			};
			game.as_showImage = function (url, pos, time) {
				if (!url) return false;
				if (!pos || !Array.isArray(pos)) {
					pos = [0, 0, 100, 100];
				}
				if (!time || (isNaN(time) && time !== true)) time = 3;
				if (_status.as_showImage) {
					var outdiv = _status.as_showImage;
					_status.as_showImage.style.animation = "left-to-right-out 1s";
					delete _status.as_showImage;
					setTimeout(function () {
						outdiv.remove();
					}, 1000);
				}

				var div = ui.create.div("", "", ui.window);
				div.style.cssText = "z-index:-1; pointer-events:none; left:" + pos[0] + "%; top:" + pos[1] + "%; width:8%; height:" + pos[3] + "%; position:absolute; background-size:100% 100%; background-position:center center; background-image:url(" + lib.assetURL + url + "); transition-property:all; transition-duration:1s";
				_status.as_showImage = div;

				if (_status.as_showText) {
					_status.as_showImage.hide();
				}
				if (time === true) return true;
				setTimeout(function () {
					if (_status.as_showImage) {
						_status.as_showImage.remove();
						delete _status.as_showImage;
					}
				}, time * 1000);

				return true;
			};

			if (lib.config.dev) {
				window.app = app;
			}
			//手杀UI
		},
		help: {},
		config: {
			FL0: {
				name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
				intro: "",
				init: true,
				clear: true,
			},
			eruda: {
				name: "调试助手(开发用)",
				init: false,
			},
			rightLayout: {
				name: '<b><font color="#E600FD">左右布局',
				init: "on",
				intro: "切换完以后自动重启游戏",
				item: {
					off: "左手",
					on: "右手",
				},
				update() {
					if (lib.config["extension_十周年UI_rightLayout"] == "on" || lib.config["extension_十周年UI_rightLayout"] == "off") {
						ui.arena.dataset.rightLayout = lib.config["extension_十周年UI_rightLayout"];
					}
				},
				onclick(item) {
					lib.config["extension_十周年UI_rightLayout"] = item || "off";
					game.saveConfig("extension_十周年UI_rightLayout", item);
					game.reload();
				},
			},
			cardPrettify: {
				name: "卡牌美化(需重启)",
				init: "webp",
				item: {
					off: "关闭",
					webp: "WEBP素材",
					png: "PNG 素材",
				},
			},
			//菜单美化
			meanPrettify: {
				name: "菜单美化",
				intro: "开启全屏的菜单样式",
				init: false,
				onclick(bool) {
					game.saveConfig("extension_十周年UI_meanPrettify", bool);
					if (bool) lib.init.css(lib.assetURL + "extension/十周年UI", "menu");
					else {
						for (const link of document.head.querySelectorAll("link")) {
							if (link.href.includes("menu.css")) {
								link.remove();
								break;
							}
						}
					}
				},
			},
			jiaohuyinxiao: {
				name: "交互音效",
				intro: "开启后，对局内点击卡牌或按钮会有交互音效",
				init: false,
			},
			dynamicBackground: {
				name: "动态背景",
				init: "skin_xiaosha_default",
				item: {
					off: "关闭",
					skin_xiaosha_default: "小杀",
					skin_chengzhu_城主边框: "城主边框(自行调参数)",
					skin_caojinyu_惊鸿: "曹金玉-惊鸿倩影-1",
					skin_caojinyu_倩影: "曹金玉-惊鸿倩影-2",
					skin_wangrong_云裳花容: "王蓉-云裳花容",
					skin_baosanniang_漫花剑俏: "鲍三娘-漫花剑俏",
					skin_baosanniang_舞剑铸缘: "鲍三娘-舞剑铸缘",
					skin_caiwenji_才颜双绝: "蔡文姬-才颜双绝",
					skin_caojie_凤历迎春: "曹　节-凤历迎春",
					skin_caojie_战场绝版: "曹　节-战场绝版",
					skin_caoying_巾帼花舞: "曹　婴-巾帼花舞",
					skin_daqiao_清萧清丽: "大　乔-清萧清丽",
					skin_daqiao_衣垂绿川: "大　乔-衣垂绿川",
					skin_daqiao_战场绝版: "大　乔-战场绝版",
					skin_daqiaoxiaoqiao_战场绝版: "大乔小乔-战场绝版",
					skin_diaochan_玉婵仙子: "貂　蝉-玉婵仙子",
					skin_diaochan_战场绝版: "貂　蝉-战场绝版",
					skin_dongbai_娇俏伶俐: "董　白-娇俏伶俐",
					skin_fuhuanghou_万福千灯: "伏皇后-万福千灯",
					skin_fanyufeng_斟酒入情: "樊玉凤-斟酒入情",
					skin_guozhao_雍容尊雅: "郭　照-雍容尊雅",
					skin_huaman_花俏蛮娇: "花　鬘-花俏蛮娇",
					skin_huaman_经典形象: "花　鬘-经典形象",
					skin_hetaihou_鸩毒除患: "何太后-鸩毒除患",
					skin_hetaihou_蛇蝎为心: "何太后-蛇蝎为心",
					skin_hetaihou_耀紫迷幻: "何太后-耀紫迷幻",
					skin_lukang_毁堰破晋: "陆　抗-毁堰破晋",
					skin_luxun_谋定天下: "陆　逊-谋定天下",
					skin_luxunlvmeng_清雨踏春: "陆逊吕蒙-清雨踏春",
					skin_mayunlu_战场绝版: "马云騄-战场绝版",
					skin_sundengzhoufei_鹊星夕情: "孙登周妃-鹊星夕情",
					skin_sunluban_宵靥谜君: "孙鲁班-宵靥谜君",
					skin_sunluyu_娇俏伶俐: "孙鲁育-娇俏伶俐",
					skin_shuxiangxiang_花好月圆: "蜀香香-花好月圆",
					skin_shuxiangxiang_花曳心牵: "蜀香香-花曳心牵",
					skin_wangrong_云裳花容: "王　荣-云裳花容",
					skin_wangyi_绝色异彩: "王　异-绝色异彩",
					skin_wangyi_战场绝版: "王　异-战场绝版",
					skin_wolongzhuge_隆中陇亩: "卧龙诸葛-隆中陇亩",
					skin_wuxian_锦运福绵: "吴　苋-锦运福绵",
					skin_wuxian_金玉满堂: "吴　苋-金玉满堂",
					skin_xiahoushi_端华夏莲: "夏侯氏-端华夏莲",
					skin_xiahoushi_战场绝版: "夏侯氏-战场绝版",
					skin_xiaoqiao_花好月圆: "小　乔-花好月圆",
					skin_xiaoqiao_采莲江南: "小　乔-采莲江南",
					skin_xinxianying_英装素果: "辛宪英-英装素果",
					skin_xushi_拈花思君: "徐　氏-拈花思君",
					skin_xushi_为夫弑敌: "徐　氏-为夫弑敌",
					skin_zhangchangpu_钟桂香蒲: "张昌蒲-钟桂香蒲",
					skin_zhangchunhua_花好月圆: "张春华-花好月圆",
					skin_zhangchunhua_战场绝版: "张春华-战场绝版",
					skin_zhoufei_晴空暖鸢: "周　妃-晴空暖鸢",
					skin_zhangqiying_逐鹿天下: "张琪瑛-逐鹿天下",
					skin_zhangqiying_岁稔年丰: "张琪瑛-岁稔年丰",
					skin_zhenji_才颜双绝: "甄　姬-才颜双绝",
					skin_zhenji_洛神御水: "甄　姬-洛神御水",
					skin_zhugeguo_兰荷艾莲: "诸葛果-兰荷艾莲",
					skin_zhugeguo_仙池起舞: "诸葛果-仙池起舞",
					skin_zhugeguo_英装素果: "诸葛果-英装素果",
					skin_zhugeliang_空城退敌: "诸葛亮-空城退敌",
					skin_zhouyi_剑舞浏漓: "周　夷-剑舞浏漓",
					skin_zhangxingcai_凯旋星花: "张星彩-凯旋星花",
				},
				update() {
					if (!window.decadeUI) return;

					var item = lib.config["extension_十周年UI_dynamicBackground"];
					if (!item || item == "off") {
						decadeUI.backgroundAnimation.stopSpineAll();
					} else {
						var name = item.split("_");
						var skin = name.splice(name.length - 1, 1)[0];
						name = name.join("_");
						decadeUI.backgroundAnimation.play(name, skin);
					}
				},
			},
			dynamicSkin: {
				name: "动态皮肤",
				init: false,
			},
			dynamicSkinOutcrop: {
				name: "动皮露头",
				init: true,
				update() {
					if (window.decadeUI) {
						var enable = lib.config["extension_十周年UI_dynamicSkinOutcrop"];
						ui.arena.dataset.dynamicSkinOutcrop = enable ? "on" : "off";
						var players = game.players;
						if (!players) return;
						for (var i = 0; i < players.length; i++) {
							if (players[i].dynamic) {
								players[i].dynamic.outcropMask = enable;
								players[i].dynamic.update(false);
							}
						}
					}
				},
			},
			dynamicSkin_dieAfter: {
				name: "阵亡保留动皮",
				intro: "阵亡后依旧显示动态皮肤",
				init: true,
			},
			cardAlternateNameVisible: {
				name: "牌名辅助显示",
				init: false,
				update() {
					if (window.decadeUI) ui.window.dataset.cardAlternateNameVisible = lib.config["extension_十周年UI_cardAlternateNameVisible"] ? "on" : "off";
				},
			},
			campIdentityImageMode: {
				name: "势力身份美化",
				init: true,
			},
			playerKillEffect: {
				name: "玩家击杀特效",
				init: true,
				onclick(value) {
					game.saveConfig("extension_十周年UI_playerKillEffect", value);
					if (window.decadeUI) decadeUI.config.playerKillEffect = value;
				},
			},
			gameAnimationEffect: {
				name: "游戏动画特效",
				init: true,
			},
			playerDieEffect: {
				name: "玩家阵亡特效",
				init: true,
				onclick(value) {
					game.saveConfig("extension_十周年UI_playerDieEffect", value);
					if (window.decadeUI) decadeUI.config.playerDieEffect = value;
				},
			},
			cardUseEffect: {
				name: "卡牌使用特效",
				init: true,
				onclick(value) {
					game.saveConfig("extension_十周年UI_cardUseEffect", value);
					if (window.decadeUI) decadeUI.config.cardUseEffect = value;
				},
			},
			// playerLineEffect: {
			// 	name: "玩家指示线特效",
			// 	init: true,
			// 	onclick(value) {
			// 		game.saveConfig("extension_十周年UI_playerLineEffect", value);
			// 		if (window.decadeUI) decadeUI.config.playerLineEffect = value;
			// 	},
			// },
			showTemp: {
				name: "视为卡牌显示",
				init: false,
				intro: "开启此选项后，视为卡牌显示将会替换为十周年UI内置替换显示",
				onclick(bool) {
					game.saveConfig("extension_十周年UI_showTemp", bool);
					if (game.me && lib.config.cardtempname != "off") {
						let cards = game.me.getCards("h", card => card._tempName);
						const skill = _status.event.skill,
							goon = skill && get.info(skill) && get.info(skill).viewAs && !get.info(skill).ignoreMod && cards.some(card => (ui.selected.cards || []).includes(card));
						if (cards.length) {
							for (let j = 0; j < cards.length; j++) {
								const card = cards[j];
								card._tempName.delete();
								delete card._tempName;
								let cardname, cardnature, cardskb;
								if (!goon) {
									cardname = get.name(card);
									cardnature = get.nature(card);
								} else {
									cardskb = typeof get.info(skill).viewAs == "function" ? get.info(skill).viewAs([card], game.me) : get.info(skill).viewAs;
									cardname = get.name(cardskb);
									cardnature = get.nature(cardskb);
								}
								if (card.name != cardname || !get.is.sameNature(card.nature, cardnature, true)) {
									if (bool) {
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
								}
							}
							//game.uncheck();
							//game.check();
						}
					}
				},
			},
			aloneEquip: {
				name: '<b><font color="#99FF75">单独装备栏',
				intro: '<b><font color="#99FF75">切换玩家装备栏为单独装备栏或非单独装备栏，初始为单独装备栏，根据个人喜好调整',
				init: true,
				update() {
					const config = lib.config["extension_十周年UI_aloneEquip"];
					if (window.decadeUI) ui.arena.dataset.aloneEquip = config ? "on" : "off";
					_status.nopopequip = config;
					if (_status.gameStarted && ui && ui.equipSolts) {
						if (config && game.me != ui.equipSolts.me) {
							if (ui.equipSolts.me) {
								ui.equipSolts.me.appendChild(ui.equipSolts.equips);
							}
							ui.equipSolts.me = game.me;
							ui.equipSolts.equips = game.me.node.equips;
							ui.equipSolts.appendChild(game.me.node.equips);
							game.me.$syncExpand();
						}
						if (!config && game.me == ui.equipSolts.me) {
							ui.equipSolts.me.appendChild(ui.equipSolts.equips);
							ui.equipSolts.me = undefined;
						}
					}
				},
			},
			wujiangbeijing: {
				name: "武将背景",
				init: false,
				intro: "开启后，单双将和国战模式将用设置好的武将背景",
			},
			shiliyouhua: {
				name: "势力优化",
				init: false,
				intro: "开启后，非魏蜀吴群晋势力的角色将会重新选择势力",
			},
			outcropSkin: {
				name: "露头皮肤(需对应素材)",
				init: "off",
				item: {
					shizhounian: "十周年露头",
					shousha: "手杀露头",
					off: "关闭",
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.outcropSkin = lib.config["extension_十周年UI_outcropSkin"];
				},
			},

			borderLevel: {
				name: "玩家边框等阶",
				init: "five",
				item: {
					one: "一阶",
					two: "二阶",
					three: "三阶",
					four: "四阶",
					five: "五阶",
					five_long: "五阶·金龙(从此开始可能需自行设置)",
					five_feng: "五阶·凤(同5阶)",
					kill: "战功",
				},
				update: function () {
					if (window.decadeUI) ui.arena.dataset.borderLevel = lib.config["extension_十周年UI_borderLevel"];
				},
			},
			MoNiEquip: {
				name: "模拟装备栏",
				init: "off",
				item: {
					shousha: "手杀",
					moileDecade: "移动端十周年",
					off: "关闭",
				},
				update: function () {
					if (window.decadeUI) ui.arena.dataset.MoNiEquip = lib.config["extension_十周年UI_MoNiEquip"];
				},
			},

			rarityLong: {
				name: "动静龙头美化",
				intro: "仅适用于手杀样式",
				init: "on",
				item: {
					x: "关闭",
					dynamic: "动态龙头",
					on: "经典龙头武将评级",
					off: "经典龙头随机",
					xinon: "新版龙头武将评级",
					xinoff: "新版龙头随机",
				},
				update: function () {
					if (window.decadeUI) ui.arena.dataset.rarityLong = lib.config["extension_十周年UI_rarityLong"];
				},
			},

			pauseJiLu: {
				name: "暂停记录栏",
				intro: "重启生效",
				init: "off",
				item: {
					off: "关闭",
					on: "开启",
				},
				update: function () {
					if (window.decadeUI) ui.arena.dataset.pauseJiLu = lib.config["extension_十周年UI_pauseJiLu"];
				},
			},
			chupaizhishi: {
				name: "出牌指示特效",
				intro: "此选项可以切换目标指示特效，根据个人喜好自行切换，重启生效",
				init: "off",
				item: {
					jiangjun: "将军",
					weijiangjun: "卫将军",
					cheqijiangjun: "车骑将军",
					biaoqijiangjun: "骠骑将军",
					dajiangjun: "大将军",
					dasima: "大司马",
					shoushajiangjun: "手杀将军",
					shoushaxianfengjiangjun: "手杀先锋将军",
					off: "关闭",
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.chupaizhishi = lib.config["extension_十周年UI_chupaizhishi"];
				},
			},
			daojianfu: {
				name: "刀剑斧特效",
				intro: "重启生效",
				init: "off",
				item: {
					fu: "斧子",
					yjfu: "新斧子",
					dao: "刀",
					yjchuizi: "锤子",
					jian: "剑",
					yjjian: "新剑",
					yjdefault: "一将成名默认",
					no: "原十周年",
					off: "关闭",
				},
				update: function () {
					if (window.decadeUI) ui.arena.dataset.daojianfu = lib.config["extension_十周年UI_daojianfu"];
				},
			},

			gainSkillsVisible: {
				name: "获得技能显示",
				init: "on",
				item: {
					on: "显示",
					off: "不显示",
					othersOn: "显示他人",
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.gainSkillsVisible = lib.config["extension_十周年UI_gainSkillsVisible"];
				},
			},
			foldCardMinWidth: {
				name: "折叠手牌最小宽度",
				intro: "设置当手牌过多时，折叠手牌露出部分的最小宽度（默认值为81）",
				init: "81",
				item: {
					9: "9",
					18: "18",
					27: "27",
					36: "36",
					45: "45",
					54: "54",
					63: "63",
					72: "72",
					81: "81",
					90: "90",
					cardWidth: "卡牌宽度",
				},
				update: () => {
					if (window.decadeUI) decadeUI.layout.updateHand();
				},
			},
			playerMarkStyle: {
				name: "人物标记样式",
				init: "decade",
				item: {
					red: "红灯笼",
					yellow: "黄灯笼",
					decade: "十周年",
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.playerMarkStyle = lib.config["extension_十周年UI_playerMarkStyle"];
				},
			},
			newDecadeStyle: {
				name: '<b><font color="#FF0000">边框样式/界面布局',
				intro: '<b><font color="#FF0000">切换武将边框样式和界面布局，初始为十周年样式，根据个人喜好自行切换，选择不同的设置后游戏会自动重启以生效新的设置',
				init: "off",
				item: {
					on: "十周年",
					off: "新手杀",
					decade: "十周年2",
					othersOn: "旧手杀",
					othersOff: "一将成名",
					onlineUI: "online",
					babysha: "欢乐三国杀",
				},
				onclick(control) {
					const origin = lib.config.extension_十周年UI_newDecadeStyle;
					game.saveConfig("extension_十周年UI_newDecadeStyle", control);
					if (origin != control) {
						setTimeout(() => game.reload(), 100);
					}
				},
				update() {
					if (window.decadeUI) {
						ui.arena.dataset.newDecadeStyle = lib.config.extension_十周年UI_newDecadeStyle;
						ui.arena.dataset.decadeLayout = lib.config.extension_十周年UI_newDecadeStyle == "on" || lib.config.extension_十周年UI_newDecadeStyle == "othersOff" || lib.config.extension_十周年UI_newDecadeStyle == "decade" || lib.config.extension_十周年UI_newDecadeStyle == "onlineUI" || lib.config.extension_十周年UI_newDecadeStyle == "babysha" ? "on" : "off";
					}
				},
			},
			shadowStyle: {
				name: '<b><font color="#FF9000">特效切换(新手杀有效)',
				intro: '<b><font color="#FF9000">可根据个人喜好切换局内阴影动态特效与人物弹出文字的样式，目前只有新手杀样式可用',
				init: "on",
				item: {
					on: "原样式",
					off: "新样式",
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.shadowStyle = lib.config["extension_十周年UI_shadowStyle"];
				},
			},
			longLevel: {
				name: '<b><font color="#FF0FF0">龙头框等阶',
				init: "eight",
				item: {
					one: "银龙",
					two: "金龙",
					three: "玉龙",
					four: "冰龙",
					five: "炎龙",
					sex: "随机",
					seven: "评级",
					eight: "关闭",
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.longLevel = lib.config["extension_十周年UI_longLevel"];
				},
			},
			loadingStyle: {
				name: '<b><font color="#FF6020">更换光标+loading框',
				intro: '<b><font color="#FF6020">可以更换局内选项框以及光标',
				init: "on",
				item: {
					off: "关闭",
					on: '<div style="width:60px;height:40px;position:relative;background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/dialog2.png);background-size: 100% 100%;"></div>',
					On: '<div style="width:60px;height:40px;position:relative;background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/dialog1.png);background-size: 100% 100%;"></div>',
					othersOn: '<div style="width:60px;height:40px;position:relative;background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/dialog3.png);background-size: 100% 100%;"></div>',
					othersOff: '<div style="width:60px;height:40px;position:relative;background-image: url(' + lib.assetURL + 'extension/十周年UI/assets/image/dialog4.png);background-size: 100% 100%;"></div>',
				},
				update() {
					if (window.decadeUI) ui.arena.dataset.loadingStyle = lib.config["extension_十周年UI_loadingStyle"];
				},
			},
			//手杀UI
			FL1: {
				name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
				intro: "",
				init: true,
				clear: true,
			},
			/*进度条说明*/
			JDTSM: {
				name: '<div class="shousha_menu">进度条·查看</div>',
				clear: true,
				onclick() {
					if (this.JDTSM == undefined) {
						var more = ui.create.div(".JDTSM", '<div class="shousha_text"><li><b>进度条</b>:完善时机包括玩家回合内、人机回合内、玩家回合外、人机回合外。<li><b>进度条时间间隔</b>:设置玩家进度条的时间间隔，默认100毫秒/次<li><b>时间间隔</b>：通俗点说，就是进度条刷新的自定义时间单位/次。时间间隔越小，进度条总时间越少，反之亦然。<li><b>切换不生效？</b>:在游戏里切换时间间隔后不会马上生效，会在下一次进度条出现时生效。<li><b>进度条高度百分比</b>:现在可以在游戏里动态调节进度条高度了，变化发生在每次刷新时，建议开启<b>进度条刷新</b>功能搭配使用。可调节的范围在10%-40%左右。<li><b>进度条刷新</b>:在游戏里开启后，进度条会在每个节点进行刷新（也就是大伙说的旧版进度条）。</div>');
						this.parentNode.insertBefore(more, this.nextSibling);
						this.JDTSM = more;
						this.innerHTML = '<div class="shousha_menu">进度条·关闭</div>';
					} else {
						this.parentNode.removeChild(this.JDTSM);
						delete this.JDTSM;
						this.innerHTML = '<div class="shousha_menu">进度条·查看</div>';
					}
				},
			},
			/*-----进度条-------*/
			jindutiao: {
				init: false,
				intro: "自己回合内显示进度条带素材",
				name: "进度条",
			},
			jindutiaoYangshi: {
				name: "进度条样式",
				init: "1",
				intro: "切换进度条样式，可根据个人喜好切换手杀进度条或十周年进度条，切换后重启生效",
				item: {
					1: "手杀进度条",
					2: "十周年PC端进度条",
					3: "十周年客户端进度条",
					4: "一将成名进度条",
				},
			},
			jindutiaotuoguan: {
				name: "托管效果",
				init: false,
				intro: "开启进度条的情况下，开启此选项后，当玩家的进度条时间走完时，将自动托管。",
			},
			jindutiaoST: {
				name: "进度条时间间隔",
				init: "100",
				intro: "<li>设置玩家进度条的时间间隔。",
				item: {
					10: "10毫秒/次",
					50: "50毫秒/次",
					100: "100毫秒/次",
					200: "200毫秒/次",
					500: "500毫秒/次",
					800: "800毫秒/次",
					1000: "1秒/次",
					2000: "2秒/次",
				},
			},
			jindutiaoUpdata: {
				name: "玩家进度条刷新",
				init: false,
				intro: "开启进度条的情况下，开启此选项后，玩家进度条将会进行刷新",
			},
			jindutiaoaiUpdata: {
				name: "人机进度条刷新",
				init: false,
				intro: "开启进度条的情况下，开启此选项后，ai的进度条将会进行刷新",
			},
			jindutiaoSet: {
				name: "进度条高度",
				init: "20",
				intro: "<li>设置玩家进度条的高度百分比。",
				item: {
					10: "10%",
					15: "15%",
					20: "20%",
					21: "21%",
					22: "22%",
					23: "23%",
					24: "24%",
					25: "25%",
					26: "26%",
					27: "27%",
					28: "28%",
					29: "29%",
					30: "30%",
					31: "31%",
					32: "32%",
					33: "33%",
					34: "34%",
					35: "35%",
					36: "36%",
					37: "37%",
					38: "38%",
					39: "39%",
				},
			},
			FL2: {
				name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
				intro: "",
				init: true,
				clear: true,
			},
			/*阶段提示说明*/
			JDTSSM: {
				name: '<div class="shousha_menu">阶段提示·查看</div>',
				clear: true,
				onclick() {
					if (this.JDTSSM == undefined) {
						var more = ui.create.div(".JDTSSM", '<div class="shousha_text"><li><b>阶段提示</b>:回合开始、判定阶段、摸牌阶段、出牌阶段、弃牌阶段、等待响应、对方思考中，其中[对方思考中]，在游戏人数不大于两人时才会出现。<li><b>位置微调</b>：在游玩太虚幻境模式或者使用Eng侍灵扩展时，为避免遮挡，会自动判断并调整阶段提示位置<li><b>人机也有？</b>:人机做了进度条美化和阶段提示美化，样式跟随UI切换。</div>');
						this.parentNode.insertBefore(more, this.nextSibling);
						this.JDTSSM = more;
						this.innerHTML = '<div class="shousha_menu">阶段提示·关闭</div>';
					} else {
						this.parentNode.removeChild(this.JDTSSM);
						delete this.JDTSSM;
						this.innerHTML = '<div class="shousha_menu">阶段提示·查看</div>';
					}
				},
			},
			/*----阶段提示----*/
			JDTS: {
				init: false,
				intro: "自己回合内显示对应阶段图片提示",
				name: "阶段提示",
			},
			JDTSYangshi: {
				name: "阶段提示样式",
				init: "1",
				intro: "切换阶段提示样式，可根据个人喜好切换",
				item: {
					1: "手杀阶段提示",
					2: "十周年阶段提示",
				},
			},
			FL3: {
				name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
				intro: "",
				init: true,
				clear: true,
			},
			/*狗托播报说明*/
			GTBBSM: {
				name: '<div class="shousha_menu">狗托播报·查看</div>',
				clear: true,
				onclick() {
					if (this.GTBBSM == undefined) {
						var more = ui.create.div(".GTBBSM", '<div class="shousha_text"><li><b>狗托播报</b>:开启后，顶部会出现滚动播报栏。PS:狗托误我啊!<li><b>播报样式</b>：新增一种样式，可选择切换，需重启。【手杀/十周年】<li><b>播报时间间隔</b>:需重启，调整每条播报的出现频率。</div>');
						this.parentNode.insertBefore(more, this.nextSibling);
						this.GTBBSM = more;
						this.innerHTML = '<div class="shousha_menu">狗托播报·关闭</div>';
					} else {
						this.parentNode.removeChild(this.GTBBSM);
						delete this.GTBBSM;
						this.innerHTML = '<div class="shousha_menu">狗托播报·查看</div>';
					}
				},
			},
			/*-------狗托播报-----*/
			GTBB: {
				init: false,
				intro: "开启后，顶部会出现滚动播报栏。",
				name: "狗托播报",
			},
			GTBBYangshi: {
				name: "播报样式(需重启)",
				init: "on",
				intro: "切换狗托播报样式",
				item: {
					on: "手杀",
					off: "十周年",
				},
			},
			GTBBFont: {
				name: "播报字体",
				init: "on",
				intro: "切换狗托播报字体，可根据个人喜好切换（即时生效）",
				item: {
					on: '<font face="shousha">手杀',
					off: '<font face="yuanli">十周年',
				},
			},
			GTBBTime: {
				name: "时间间隔(重启生效)",
				init: "60000",
				intro: "更改狗托播报出现的时间间隔，可根据个人喜好调整频率",
				item: {
					30000: "0.5min/次",
					60000: "1min/次",
					120000: "2min/次",
					300000: "5min/次",
				},
			},
			/*其它美化*/
			FL4: {
				name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
				intro: "",
				init: true,
				clear: true,
			},
			XPJ: {
				name: "小配件（十周年）",
				init: "off",
				intro: "十周年样式下，选择切换左下角小配件",
				item: {
					on: "原版",
					off: "新版",
				},
			},
			LTAN: {
				init: false,
				intro: "<li>手杀样式下在游戏中，隐藏左下角的聊天按钮<li>需重启",
				name: "聊天按钮隐藏",
			},
			KGMH: {
				init: "0",
				intro: "开启后可以美化游戏的选项开关，需要重启",
				name: "开关美化",
				item: {
					0: "关闭",
					1: "手杀",
					2: "十周年",
				},
			},
			mx_decade_characterDialog: {
				name: "自由选将筛选框",
				init: "default",
				intro: "更改自由选将筛选框",
				item: {
					default: "默认本体框",
					"extension-OL-system": "扩展内置框",
					offDialog: "关闭筛选框",
				},
			},
			//手杀UI
			FL5: {
				name: "<img style=width:240px src=" + lib.assetURL + "extension/十周年UI/shoushaUI/line.png>",
				intro: "",
				init: true,
				clear: true,
			},
		},
		package: (() => {
			const pkg = {
				character: {
					character: {},
					translate: {},
				},
				card: {
					card: {},
					translate: {},
					list: [],
				},
				skill: {
					skill: {},
					translate: {},
				},
			};
			const pack = {
				...pkg,
				...otherInfo,
			};
			pack.intro = (pack => {
				let log = [`魔改十周年UI ${pack.version}`, "最低适配：v1.10.18 暂定", "添加全选按钮 by咪咪狗奇妙工具", "修复手杀UI自动整理，UI显示问题", "新增OLUI&欢杀UI，感谢群友提供的素材", "整合U、凌梦、@19950219、小爱莉的UI细节调整", "整合小爱莉、柳下跖、扬、U提供的武将详情界面", "整合活动群群主lp提供的$throw函数优化"];
				return `<a href=${pack.diskURL}>点击前往十周年Github仓库</a><br><p style="color:rgb(210,210,000); font-size:12px; line-height:14px; text-shadow: 0 0 2px black;">${log.join("<br>•")}</p>`;
			})(pack);
			return pack;
		})(),
		files: {
			character: [],
			card: [],
			skill: [],
			audio: [],
		},
	};
}
