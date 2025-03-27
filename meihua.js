"use strict";
decadeModule.import(function (lib, game, ui, get, ai, _status) {
	//=========获取立绘路径函数=========//
	Object.assign(game, {
		LiHuiFileExist(url) {
			if (window.XMLHttpRequest) {
				var http = new XMLHttpRequest();
			} else {
				var http = new ActiveXObject("Microsoft.XMLHTTP");
			}
			http.open("HEAD", url, false);
			try {
				http.send();
			} catch (err) {
				return false;
			}
			return http.status != 404;
		},
		getLiHuiPath: function (player, assetURL) {
			var LiHuiMapping = lib.qhly_skinShare;
			var SkinName = game.getFileName2(player.node.avatar.style.backgroundImage);
			var OriginName = player.name == "" ? player.name2 : player.name;
			var Name = OriginName;
			var MapName = LiHuiMapping[OriginName] == undefined ? undefined : LiHuiMapping[OriginName].name;
			if (MapName) Name = MapName;
			var LihuiPath = assetURL + "lihui/" + Name + "/" + SkinName + ".png";
			if (game.LiHuiFileExist(LihuiPath)) {
				return LihuiPath;
			} else {
				if (MapName) {
					LihuiPath = assetURL + "lihui/" + Name + "/" + OriginName + ".png";
					if (game.LiHuiFileExist(LihuiPath)) return LihuiPath;
				} else LihuiPath = assetURL + "lihui/" + Name + "/" + Name + ".png";
				if (game.LiHuiFileExist(LihuiPath)) {
					return LihuiPath;
				} else {
					return "noLihui";
					// return assetURL + "lihui/" + "未知.png";
				}
			}
		},
		getYuanHuaPath: function (player, assetURL) {
			var YuanHuaMapping = lib.qhly_skinShare;
			var SkinName = game.getFileName2(player.node.avatar.style.backgroundImage);
			var OriginName = player.name == "" ? player.name2 : player.name;
			var Name = OriginName;
			var MapName = YuanHuaMapping[OriginName] == undefined ? undefined : YuanHuaMapping[OriginName].name;
			if (MapName) Name = MapName;
			var YuanHuaPath = assetURL + Name + "/" + SkinName + ".jpg";
			if (game.LiHuiFileExist(YuanHuaPath)) {
				return YuanHuaPath;
			} else {
				if (MapName) {
					YuanHuaPath = assetURL + OriginName + "/" + OriginName + ".jpg";
					if (game.LiHuiFileExist(YuanHuaPath)) return YuanHuaPath;
					else {
						YuanHuaPath = assetURL + Name + "/" + Name + ".jpg";
						return YuanHuaPath;
					}
				} else YuanHuaPath = assetURL + Name + "/" + Name + ".jpg";
				if (game.LiHuiFileExist(YuanHuaPath)) {
					return YuanHuaPath;
				} else {
					YuanHuaPath = player.node.avatar.style.backgroundImage;
					YuanHuaPath = YuanHuaPath.split('("')[1].split('")')[0];
					return YuanHuaPath;
				}
			}
		},
		getFileName2: function (path) {
			var pos1 = path.lastIndexOf("/");
			var pos2 = path.lastIndexOf("\\");
			var pos = Math.max(pos1, pos2);
			if (pos < 0) {
				return path;
			} else {
				let tempPath = path.substring(pos + 1);
				return tempPath.substring(0, tempPath.lastIndexOf("."));
			}
		},
	});
	if (lib.config["extension_十周年UI_pauseJiLu"] != "off") {
		ui.create.pause = function () {
			if (_status.pausing) return;
			ui.click.shortcut(false);
			var node = ui.create.div(".pausedbg", ui.window);
			var jilu = ui.create.div(".jilu", node);
			var liwu = ui.create.div(".liwu", node);
			var all = ui.create.div(".all", node);
			var wj = document.getElementsByClassName("player");
			var tiao = ui.create.div(".tiao", node);
			var mini = ui.create.div(".mini", node);

			for (var i = 0; i < wj.length; i++) {
				var avatar = ui.create.div(".wjt", mini);
				var wjpic = document.createElement("div");
				var m_mask = document.createElement("div");
				m_mask.classList.add("m_mask");
				wjpic.style.width = "40px";
				wjpic.style.height = "36px";
				wjpic.style.margin = "2px 3px";
				wjpic.style.backgroundSize = "100% 100%";
				wjpic.style.backgroundRepeat = "no-repeat";
				m_mask.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/border.png')";
				avatar.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/mini.png')";
				wjpic.style.backgroundImage = wj[i].node.avatar.style.backgroundImage;
				console.log(wjpic.style.backgroundImage);
				avatar.appendChild(m_mask);
				m_mask.appendChild(wjpic);
			}
			tiao.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/tiao.png')";
			node.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/bg.png')";
			jilu.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/jilu.png')";
			liwu.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/liwu.png')";
			all.style.backgroundImage = "url('" + lib.assetURL + "extension/十周年UI/image/pause/all.png')";

			_status.pausing = true;
			setTimeout(function () {
				_status.pausing = false;
			}, 500);
			if (lib.config.touchscreen) {
				setTimeout(function () {
					node.addEventListener("touchend", ui.click.resume);
				}, 500);
			} else {
				node.addEventListener("click", ui.click.resume);
			}
			if (!lib.config.touchscreen) {
				node.oncontextmenu = ui.click.resume;
			}

			var node2 = ui.create.div(node);
			if (_status.connectMode) {
				node2.innerHTML = "";
			} else {
				node2.innerHTML = "";
			}

			return node;
		};
		const style = document.createElement("style");
		style.type = "text/css";
		style.textContent = `/*暂停记录栏*/
.jilu {

	background-repeat: no-repeat;
	background-size: contain;
	position: absolute;
	width: 34%;
	height: 9%;
	z-index: 100;

}

.liwu {

	background-repeat: no-repeat;
	background-size: contain;
	z-index: 100;
	position: absolute;
	top: 8%;
	left: 60%;
	width: 36%;
	height: 9%;
}

.all {
	position: absolute;
	left: 99.4%;
	width: 22%;
	height: 8%;
	background-size: contain;
	background-repeat: no-repeat;
	top: 2%;
}

.wjt {

	width: 100px;
	height: 60px;
	background-repeat: no-repeat;
	position: relative;
	margin-bottom: 8px;

	background-repeat: no-repeat;
	background-size: contain;


}

.m_mask {
	background-repeat: no-repeat;
	background-size: contain;
	width: 44px;
	height: 44px;
	margin: 7px;
}

.m_mask>div {
	background-size: cover !important;
}
	.tiao {
		width: 99.6%;
		height: 10px;
		top: 20%;
		left: 1px;
		background-repeat: no-repeat;
		background-size: contain;
	}

	.mini {
		display: flex;
		justify-self: center;
		align-items: center;
		top: 12%;
		left: 98.6%;
		position: absolute;
		flex-wrap: nowrap;
		flex-direction: column;
		height: 100%;
	}

	.pausedbg {
		left: 2%;
		top: 0;
		width: 100%;
		height: 100%;
		background-position: 0% 0%;
		background-repeat: no-repeat;
		background-size: 100% 100%;
		opacity: 1;
		width: 35%;
		left: 3%;
		height: 100%;
		z-index: 8;
		background-color: transparent !important;
	}

	/* .pausedbg>div:first-child {
	font-size: 30px;
	top: calc(50% - 17px);
	left: calc(50% - 45px);
} */
	#sidebar,
	#sidebar3 {
		left: 0;
		top: 126px;
		width: 200px;
		height: calc(100% - 40px);
		text-align: left;
		padding: 20px;
		overflow-y: scroll;
		z-index: 6;
	}

	.pausedbg>div:first-child {
		font-size: 30px;
		top: 8.14%;
		left: 25%;
	}

	/*暂停记录栏end*/`;
		(document.head || document.body).appendChild(style);
	}
	if (lib.config["extension_十周年UI_chupaizhishi"] != "off") {
		//目标指示特效
		lib.element.player.inits = [].concat(lib.element.player.inits || []).concat(player => {
			if (player.ChupaizhishiXObserver) return;

			const ChupaizhishiX = {
				attributes: true,
				attributeFilter: ["class"],
			};

			let timer = null;
			const animations = {
				jiangjun: { name: "SF_xuanzhong_eff_jiangjun" },
				weijiangjun: { name: "SF_xuanzhong_eff_weijiangjun" },
				cheqijiangjun: { name: "SF_xuanzhong_eff_cheqijiangjun" },
				biaoqijiangjun: { name: "SF_xuanzhong_eff_biaoqijiangjun" },
				dajiangjun: { name: "SF_xuanzhong_eff_dajiangjun" },
				dasima: { name: "SF_xuanzhong_eff_dasima" },
				shoushajiangjun: { name: "aar_chupaizhishi" },
				shoushaxianfengjiangjun: { name: "aar_chupaizhishiX" },
			};

			const ChupaizhishiXObserver = new globalThis.MutationObserver(mutationRecords => {
				for (let mutationRecord of mutationRecords) {
					if (mutationRecord.attributeName !== "class") continue;
					const targetElement = mutationRecord.target;

					if (targetElement.classList.contains("selectable")) {
						if (!targetElement.ChupaizhishiXid) {
							if (!window.chupaiload) {
								window.chupaiload = true;
							}
							if (timer) return;

							timer = setTimeout(() => {
								const config = decadeUI.config.chupaizhishi;
								if (config !== "off" && animations[config]) {
									dcdAnim.loadSpine(animations[config].name, "skel", function () {
										targetElement.ChupaizhishiXid = dcdAnim.playSpine(animations[config], {
											parent: targetElement,
											loop: true,
											scale: config === "biaoqijiangjun" ? 0.65 : 0.8,
										});
									});
								}
								timer = null;
							}, 300);
						}
					} else {
						if (targetElement.ChupaizhishiXid) {
							dcdAnim.stopSpine(targetElement.ChupaizhishiXid);
							delete targetElement.ChupaizhishiXid;
							if (timer) {
								clearTimeout(timer);
								timer = null;
							}
						}
					}
				}
			});
			ChupaizhishiXObserver.observe(player, ChupaizhishiX);
			player.ChupaizhishiXObserver = ChupaizhishiXObserver;
		});
	}
	if (lib.config["extension_十周年UI_MoNiEquip"] != "off") {
		if (lib.config["extension_十周年UI_MoNiEquip"] == "shousha") {
			lib.init.css(lib.assetURL + "extension/十周年UI/equip_shousha.css");
		} else {
			lib.init.css(lib.assetURL + "extension/十周年UI/equip_mbdecade.css");
		}
		/*装备牌dom操作*/
		lib.element.player.$addVirtualEquip = function (card, cards) {
			const player = this;
			const isViewAsCard = cards.length !== 1 || cards[0].name !== card.name,
				info = get.info(card, false);
			let cardShownName = get.translation(card.name);
			/* if (info.subtype === "equip3") {
							cardShownName += "+";
						} else if (info.subtype === "equip4") {
							cardShownName += "-";
						} */
			const cardx = isViewAsCard ? game.createCard(card.name, cards.length == 1 ? get.suit(cards[0]) : "none", cards.length == 1 ? get.number(cards[0]) : 0) : cards[0];
			cardx.fix();
			const cardSymbol = Symbol("card");
			cardx.cardSymbol = cardSymbol;
			cardx[cardSymbol] = card;
			if (card.subtypes) cardx.subtypes = card.subtypes;
			cardx.style.transform = "";
			cardx.classList.remove("drawinghidden");
			delete cardx._transform;
			const suit = get.translation(cardx.suit),
				number = get.strNumber(cardx.number);
			if (isViewAsCard) {
				cardx.cards = cards || [];
				cardx.viewAs = card.name;
				cardx.node.name2.innerHTML = `${suit}${number} [${cardShownName}]`;
				cardx.classList.add("fakeequip");
			} else {
				delete cardx.viewAs;
				cardx.node.name2.innerHTML = `${suit}${number} ${cardShownName}`;
				cardx.classList.remove("fakeequip");
			}
			let equipped = false,
				equipNum = get.equipNum(cardx);

			/* 十周年装备 */
			cardx.node.name2.innerHTML = "";

			if (!nameH) var nameH = document.createElement("span");
			if (!suitH) var suitH = document.createElement("span");
			nameH.textContent = cardShownName;
			suitH.textContent = `${suit}${number}`;
			cardx.node.name2.appendChild(suitH);
			cardx.node.name2.appendChild(nameH);
			//装备花色	//手杀装备栏       //十周年装备栏

			if (lib.config["extension_十周年UI_MoNiEquip"] == "shousha") {
				var SSEquip = {
					木牛流马: "木牛",
					吴六剑: "吴六剑2",
					机关弩: "机关弩1",
					雌雄双股剑: "雌雄剑2",
					方天画戟: "方天戟4",
					贯石斧: "贯石斧3",
					寒冰剑: "寒冰剑2",
					麒麟弓: "麒麟弓5",
					青釭剑: "青釭剑2",
					青龙偃月刀: "青龙刀3",
					丈八蛇矛: "丈八矛3",
					古锭刀: "古锭刀2",
					朱雀羽扇: "朱雀扇4",
					七宝刀: "七宝刀2",
					银月枪: "银月枪3",
					衠钢槊: "衠钢槊3",
					飞龙夺凤: "飞龙刀2",
					三尖两刃刀: "三尖刀3",
					诸葛连弩: "诸葛弩1",
					倚天剑: "倚天剑2",
					七星宝刀: "七星刀2",
					折戟: "折戟0",
					无锋剑: "无锋剑1",
					涯角枪: "涯角枪3",
					五行鹤翎扇: "五行扇4",
					断剑: "断剑0",
					霹雳车: "霹雳车9",
					水波剑: "水波剑2",
					红缎枪: "红缎枪3",
					天雷刃: "天雷刃4",
					混毒弯匕: "混毒匕1",
					元戎精械弩: "精械弩3",
					乌铁锁链: "铁锁链3",
					太极拂尘: "太极拂5",
					灵宝仙壶: "灵宝壶3",
					冲应神符: "冲应符",
					先天八卦阵: "先天八卦",
					照月狮子盔: "狮子盔",
					白银狮子: "白银狮",
					仁王金刚盾: "金刚盾",
					桐油百韧甲: "百韧甲",
					定澜夜明珠: "夜明珠",
					镔铁双戟: "镔铁戟3",
					玲珑狮蛮带: "狮蛮带",
					束发紫金冠: "束发金冠",
					红棉百花袍: "百花袍",
					虚妄之冕: "虚妄之冕",
					无双方天戟: "无双戟4",
					鬼龙斩月刀: "斩月刀3",
					赤焰镇魂琴: "镇魂琴4",
				};
				if (!ele) var ele = cardx.node.name2;

				if (!(ele.length > 1)) {
					var e = ele.children;
					var subtype = cardx.getAttribute("data-card-subtype");
					var cardName = cardx.getAttribute("data-card-name");
					if (!(e[0].nodeName == "IMG")) {
						var colour = cardx.getAttribute("data-suit");
						if (subtype) {
							for (var i = 0; i < e.length; i++) {
								//  this.style.top = "";
								if (i == 0) {
									if (colour == "heart" || colour == "diamond") e[i].style.color = "#ef1806";
									else e[i].style.color = "#8dbede";
									e[i].style.fontSize = "13px";
									e[i].style.position = "absolute";
									e[i].style.left = "11%";
									e[i].style.top = "1px";
								} else {
									if (subtype == "equip3" || subtype == "equip4") {
										var b = subtype == "equip3" ? "+" : "-";
										var newele = document.createElement("img");
										newele.setAttribute("src", decadeUIPath + "/images/ass/" + b + "1.png");
										newele.style.height = "90%";
										newele.style.left = "0%";
										newele.style.position = "absolute";
										newele.onerror = function () {
											this.src = decadeUIPath + "/images/ass/weizhi.png";
											this.onerror = null;
										};
										e[0].style.left = "18%";
										e[0].parentNode.insertBefore(newele, e[0]);
										e[i].parentNode.removeChild(e[i + 1]);
										continue;
									} else {
										e[i].style.color = "#e9e8e3";
										e[i].style.left = "30%";
										e[i].style.position = "absolute";
									}
									e[i].style.fontSize = "16px";
								}
								e[i].style.textShadow = "1px 0 0 black, 0 1px 0 black, -1px 0 0 black, 0 -1px 0 black";
							}
							if (!(subtype == "equip3" || subtype == "equip4")) {
								var newele = document.createElement("img");
								newele.setAttribute("src", decadeUIPath + "/images/ass/" + cardName + ".png");
								newele.style.height = "80%";
								newele.style.left = "0%";
								newele.style.position = "absolute";
								newele.onerror = function () {
									this.src = decadeUIPath + "/images/ass/weizhi.png";
									this.onerror = null;
								};
								if (SSEquip) {
									var t = e[1].textContent;
									if (SSEquip[t]) {
										e[1].textContent = SSEquip[t];
									}
								}
								e[0].parentNode.insertBefore(newele, e[0]);
							}
						}
					} else {
						if (subtype) {
							if (SSEquip) {
								var t = e[2].textContent;
								if (SSEquip[t]) {
									e[2].textContent = SSEquip[t];

									if (!(subtype == "equip3" || subtype == "equip4")) {
										e[0].setAttribute("src", decadeUIPath + "/images/ass/" + cardName + ".png");
									}
								}
							}
						}
					}
				}
			} else if (lib.config["extension_十周年UI_MoNiEquip"] == "moileDecade") {
				var SSEquip = {
					如意金箍棒: "金箍棒",
					木牛流马: "木牛",
					爪黄飞电: "爪黄",
					吴六剑: "吴六剑2",
					机关弩: "机关弩1",
					雌雄双股剑: "2雌雄劍",
					方天画戟: "4方天戟",
					贯石斧: "3贯石斧",
					寒冰剑: "2寒冰剑",
					麒麟弓: "5麒麟弓",
					青釭剑: "2青釭剑",
					青龙偃月刀: "3青龙刀",
					丈八蛇矛: "3丈八矛",
					古锭刀: "2古锭刀",
					朱雀羽扇: "4朱雀扇",
					七宝刀: "2七宝刀",
					银月枪: "3银月枪",
					衠钢槊: "3衠钢槊",
					飞龙夺凤: "2飞龙刀",
					三尖两刃刀: "3三尖刀",
					诸葛连弩: "1諸葛弩",
					倚天剑: "2倚天剑",
					七星宝刀: "2七星刀",
					折戟: "0折戟",
					无锋剑: "1无锋剑",
					涯角枪: "3涯角枪",
					五行鹤翎扇: "4五行扇",
					断剑: "0断剑",
					霹雳车: "9霹雳车",
					水波剑: "2水波剑",
					红缎枪: "3红缎枪",
					天雷刃: "4天雷刃",
					混毒弯匕: "1混毒匕",
					元戎精械弩: "3精械弩",
					乌铁锁链: "3铁锁链",
					太极拂尘: "5太极拂",
					灵宝仙壶: "3灵宝壶",
					冲应神符: "冲应符",
					先天八卦阵: "先天八卦",
					照月狮子盔: "狮子盔",
					白银狮子: "白银狮",
					仁王金刚盾: "金剛盾",
					桐油百韧甲: "百韧甲",
					定澜夜明珠: "夜明珠",
				};
				/*十周年装备*/ if (!ele) var ele = cardx.node.name2;

				if (!lib.config["extension_Epix_SSEquip"]) {
					if (!(ele.length > 1)) {
						var e = ele.children;
						var cardType = cardx.getAttribute("data-card-type");
						var subtype = cardx.getAttribute("data-card-subtype");
						var cardName = cardx.getAttribute("data-card-name");
						if (!(e[0].nodeName == "IMG")) {
							var colour = cardx.getAttribute("data-suit");
							var nature = cardx.getAttribute("data-nature");
							if (subtype) {
								for (var i = 0; i < e.length; i++) {
									//2个武器，覆盖 判断拓展装备
									//  this.style.top = "";
									if (i == 0) {
										if (colour == "heart" || colour == "diamond") {
											e[i].style.color = "#ef1806";
											//    e[i].style.fontFamily = "suits";
											e[i].style.position = "absolute";
											// e[i].style.transform = "scale(0.7,1.1)";
											e[i].style.direction = "rtl";
											e[i].style.marginLeft = "68px"; //装备花色字体整体右移
											e[i].style.marginTop = "2px"; //花色字体上下
											e[i].style.fontSize = "11px"; //花色大小
											e[i].style.letterSpacing = "-1px";
										} else {
											e[i].style.color = "#181818";
											e[i].style.fontSize = "12px"; //花色大小
											//    e[i].style.fontFamily = "suits";
											e[i].style.position = "absolute";
											// e[i].style.transform = "scale(0.7,1.1)";
											e[i].style.direction = "rtl";
											e[i].style.letterSpacing = "-1px";
											e[i].style.marginLeft = "68px"; //装备花色字体整体右移
											e[i].style.marginTop = "2px"; //花色字体上下
											if (colour == "none") e[i].style.color = "#482a0a";
										}
									} else {
										if (cardName.indexOf("feichu_") == -1) {
											e[i].style.direction = "rtl";
											e[i].style.color = "#482a0a";
											e[i].style.marginLeft = "-7px";
											e[i].style.letterSpacing = "1px";

											e[i].style.fontSize = "14px"; //装备字体大小
											e[i].style.fontFamily = "yuanli";
											e[i].style.position = "absolute";
											e[i].style.marginTop = "2px"; //装备字体上下
										} else {
											e[i].style.display = "none";
										}
									}
									//	e[i].style.textShadow = "-1.3px 0px 2.2px #fff3d6, 0px -1.3px 2.2px #fff3d6, 1.3px 0px 2.2px #fff3d6 ,0px 1.3px 2.2px #fff3d6"; // 装备字体描边显示
								}
								var newele = document.createElement("img");

								if (cardName != "liulongcanjia" && cardName != "mengchong" && cardName.indexOf("qiexie") == "-1") {
									newele.setAttribute("src", decadeUIPath + "/images/ass/decade/" + subtype + ".png");
								} else if (cardName.indexOf("qiexie") != "-1") {
									e[0].innerHTML = "";
									newele.setAttribute("src", decadeUIPath + "/images/ass/decade/qiexie.png");
								} else {
									newele.setAttribute("src", decadeUIPath + "/images/ass/decade/liulongcanjia.png");
								}
								if (cardName.indexOf("feichu_") != -1) newele.setAttribute("src", decadeUIPath + "/images/ass/decade/" + cardName + ".png");

								newele.style.opacity = "0.83"; //图标透明度
								newele.style.width = "120%";
								// newele.style.borderRadius = "5px";
								newele.style.height = "112%";
								/*装备栏宽度*/
								if (lib.config.mode != "guozhan") {
									newele.style.marginLeft = " -2px"; /*-7.5*/
									//newele.style.marginRight = "-10px";
								} else {
									newele.style.marginLeft = "4px"; /*-5.5*/
									// newele.style.marginRight = "-1px";
								}

								if (SSEquip) {
									var t = e[1].textContent;
									if (SSEquip[t]) {
										e[1].textContent = SSEquip[t];
									}
								}
								if (lib.config.extension_十周年UI_aloneEquip) {
									if (get.player() != game.me) {
										e[0].parentNode.insertBefore(newele, e[0]);
									}
								} else {
									e[0].parentNode.insertBefore(newele, e[0]);
								}
							} else if (cardType) {
								for (var i = 0; i < e.length; i++) {
									if (i == 0) e[i].innerHTML = "";
									else {
										if (cardType == "basic") e[i].innerHTML = "基本牌";
										else if (cardType == "trick" || cardType == "delay") e[i].innerHTML = "锦囊牌";
										else if (cardType == "equip") e[i].innerHTML = "装备牌";
										e[i].style.direction = "rtl";
										e[i].style.color = "#482a0a";
										e[i].style.marginLeft = "-8.5px";
										e[i].style.letterSpacing = "1px";

										e[i].style.fontSize = "15px"; //装备字体大小
										e[i].style.fontFamily = "yuanli";
										e[i].style.position = "absolute";
									}
								}

								var newele = document.createElement("img");
								newele.setAttribute("src", decadeUIPath + "/images/ass/decade/bg.png");
								newele.style.opacity = "0.83"; //图标透明度
								newele.style.width = "100%";
								newele.style.height = "112%";
								if (cardx.subtypes) e[0].parentNode.parentNode.classList.add(cardx.subtypes[0]);
								e[0].parentNode.style.setProperty("width", "90px", "important");
								e[0].parentNode.style.left = "-8px";
								if (lib.config.extension_十周年UI_aloneEquip) {
									if (get.player() != game.me) {
										e[0].parentNode.insertBefore(newele, e[0]);
									}
								} else {
									e[0].parentNode.insertBefore(newele, e[0]);
								}
							}
						} else {
							if (subtype) {
								if (SSEquip) {
									var t = e[2].textContent;
									if (SSEquip[t]) {
										e[2].textContent = SSEquip[t];
									}
								}
							}
						}
					}
				}
			}
			//分割

			if (player.node.equips.childNodes.length) {
				for (let i = 0; i < player.node.equips.childNodes.length; i++) {
					if (get.equipNum(player.node.equips.childNodes[i]) >= equipNum) {
						equipped = true;
						player.node.equips.insertBefore(cardx, player.node.equips.childNodes[i]);
						break;
					}
				}
			}
			if (equipped === false) {
				player.node.equips.appendChild(cardx);
				if (cards?.length && _status.discarded) _status.discarded.removeArray(cards);
			}
		};
	}
	//等阶边框
	if (lib.config["extension_十周年UI_borderLevel"] == "kill") {
		/*-----------------备注分割线-----------------*/
		//击杀人数升级边框
		lib.skill._kill_framebg = {
			trigger: {
				global: ["gameStart", "showCharacterEnd"],
			},
			forced: true,
			filter: function (event, player) {
				return lib.config["extension_十周年UI_newDecadeStyle"] == "on";
			},
			direct: true,
			charlotte: true,
			content: function () {
				if (lib.rank.rarity && game.getRarity(player.name) == "junk") {
					player.node.campWrap.dataset.borderLevel = "one";
					player.node.hpWrap.dataset.borderLevel = "one";
					player.node.cardWrap.dataset.borderLevel = "one";
				}
				if (lib.rank.rarity && game.getRarity(player.name) == "common") {
					player.node.campWrap.dataset.borderLevel = "two";
					player.node.hpWrap.dataset.borderLevel = "two";
					player.node.cardWrap.dataset.borderLevel = "two";
				}
				if (lib.rank.rarity && game.getRarity(player.name) == "rare") {
					player.node.campWrap.dataset.borderLevel = "three";
					player.node.hpWrap.dataset.borderLevel = "three";
					player.node.cardWrap.dataset.borderLevel = "three";
				}
				if (lib.rank.rarity && game.getRarity(player.name) == "epic") {
					player.node.campWrap.dataset.borderLevel = "four";
					player.node.hpWrap.dataset.borderLevel = "four";
					player.node.cardWrap.dataset.borderLevel = "four";
				}
				if (lib.rank.rarity && game.getRarity(player.name) == "legend") {
					player.node.campWrap.dataset.borderLevel = "five";
					player.node.hpWrap.dataset.borderLevel = "five";
					player.node.cardWrap.dataset.borderLevel = "five";
				}
			},
		};
		//战功边框
		lib.skill._kill_framebg = {
			trigger: {
				global: ["gameStart", "showCharacterEnd"],
			},
			forced: true,

			direct: true,
			charlotte: true,
			content: function () {
				if (lib.config.mode == "doudizhu" && player == game.zhu) {
					if (player.storage.biankuang == 1) {
						player.node.cardWrap.dataset.borderLevel = "one";
					}
					if (player.storage.biankuang == 2) {
						player.node.cardWrap.dataset.borderLevel = "two";
					}
					if (player.storage.biankuang == 3) {
						player.node.cardWrap.dataset.borderLevel = "three";
					}
					if (player.storage.biankuang == 4) {
						player.node.cardWrap.dataset.borderLevel = "four";
					}
					if (player.storage.biankuang == 5 && player.sex != "female") {
						var num = [1, 2].randomGet();
						if (num == 1) {
							player.node.cardWrap.dataset.borderLevel = "five";
						} else {
							player.node.cardWrap.dataset.borderLevel = "five_long";
						}
					}
					if (player.storage.biankuang == 5 && player.sex == "female") {
						player.node.cardWrap.dataset.borderLevel = "five_feng";
					}
				}
				if (lib.config.mode == "doudizhu" ? (player == game.zhu ? false : true) : true) {
					if (lib.rank.rarity && game.getRarity(player.name) == "junk") {
						player.node.campWrap.dataset.borderLevel = "one";
						player.node.hpWrap.dataset.borderLevel = "one";
						player.node.cardWrap.dataset.borderLevel = "one";
					}
					if (lib.rank.rarity && game.getRarity(player.name) == "common") {
						player.node.campWrap.dataset.borderLevel = "two";
						player.node.hpWrap.dataset.borderLevel = "two";
						player.node.cardWrap.dataset.borderLevel = "two";
					}
					if (lib.rank.rarity && game.getRarity(player.name) == "rare") {
						player.node.campWrap.dataset.borderLevel = "three";
						player.node.hpWrap.dataset.borderLevel = "three";
						player.node.cardWrap.dataset.borderLevel = "three";
					}
					if (lib.rank.rarity && game.getRarity(player.name) == "epic") {
						player.node.campWrap.dataset.borderLevel = "four";
						player.node.hpWrap.dataset.borderLevel = "four";
						player.node.cardWrap.dataset.borderLevel = "four";
					}
					if (lib.rank.rarity && game.getRarity(player.name) == "legend") {
						var num = [1, 2, 3].randomGet();
						if (num == 1) {
							player.node.campWrap.dataset.borderLevel = "five";
							player.node.hpWrap.dataset.borderLevel = "five";
							player.node.cardWrap.dataset.borderLevel = "five";
						} else if (num == 2) {
							player.node.campWrap.dataset.borderLevel = "five_long";
							player.node.hpWrap.dataset.borderLevel = "five_long";
							player.node.cardWrap.dataset.borderLevel = "five_long";
						} else {
							//if(player.storage.biankuang==5&&player.sex=="female"){
							player.node.campWrap.dataset.borderLevel = "five_feng";
							player.node.hpWrap.dataset.borderLevel = "five_feng";
							player.node.cardWrap.dataset.borderLevel = "five_feng";
						}
					}
				}
			},
		};
		/*边框升级*/
		lib.skill._yishifenghua_bk = {
			trigger: {
				global: "gameStart",
			},
			silent: true,
			forced: true,
			unique: true,
			popup: false,
			charlotte: true,
			superCharlotte: true,
			filter: function (event, player) {
				return lib.config["extension_十周年UI_borderLevel"] == "kill";
			},
			content: function () {
				if (game.getRarity(player.name) == "junk") {
					player.addSkill("yishifenghua_junk");
				}
				if (game.getRarity(player.name) == "common") {
					player.addSkill("yishifenghua_common");
				}
				if (game.getRarity(player.name) == "rare") {
					player.addSkill("yishifenghua_rare");
				}
				if (game.getRarity(player.name) == "epic") {
					player.addSkill("yishifenghua_epic");
				}
				if (game.getRarity(player.name) == "legend") {
					player.node.kuang.style.bottom = "-6px";
					player.addSkill("yishifenghua_legend");
				}
			},
		};
		lib.skill._yishifenghua_bksj = {
			trigger: {
				source: "dieBegin",
			},
			filter: function (event, player) {
				return lib.config["extension_十周年UI_borderLevel"] == "kill" && player.storage.biankuang < 5 && player.storage.biankuang < 5 && lib.config.mode === "doudizhu" ? (player === game.zhu ? false : true) : true;
			},
			forced: true,
			unique: true,
			popup: false,
			charlotte: true,
			superCharlotte: true,
			content: function () {
				"step 0";
				player.storage.biankuang += 1;
				("step 1");
				if (player.storage.biankuang == 1) {
					player.node.campWrap.dataset.borderLevel = "one";
					player.node.hpWrap.dataset.borderLevel = "one";
					player.node.cardWrap.dataset.borderLevel = "one";
				}
				if (player.storage.biankuang == 2) {
					player.node.campWrap.dataset.borderLevel = "two";
					player.node.hpWrap.dataset.borderLevel = "two";
					player.node.cardWrap.dataset.borderLevel = "two";
				}
				if (player.storage.biankuang == 3) {
					player.node.campWrap.dataset.borderLevel = "three";
					player.node.hpWrap.dataset.borderLevel = "three";
					player.node.cardWrap.dataset.borderLevel = "three";
				}
				if (player.storage.biankuang == 4) {
					player.node.campWrap.dataset.borderLevel = "four";
					player.node.hpWrap.dataset.borderLevel = "four";
					player.node.cardWrap.dataset.borderLevel = "four";
				}
				if (player.storage.biankuang == 5) {
					var num = [1, 2, 3].randomGet();
					if (num == 1) {
						player.node.campWrap.dataset.borderLevel = "five";
						player.node.hpWrap.dataset.borderLevel = "five";
						player.node.cardWrap.dataset.borderLevel = "five";
					} else if (num == 2) {
						player.node.campWrap.dataset.borderLevel = "five_long";
						player.node.hpWrap.dataset.borderLevel = "five_long";
						player.node.cardWrap.dataset.borderLevel = "five_long";
					} else {
						//if(player.storage.biankuang==5&&player.sex=="female"){
						player.node.campWrap.dataset.borderLevel = "five_feng";
						player.node.hpWrap.dataset.borderLevel = "five_feng";
						player.node.cardWrap.dataset.borderLevel = "five_feng";
					}
				}
			},
		};
		lib.skill.yishifenghua_junk = {
			forced: true,
			unique: true,
			popup: false,
			silent: true,
			charlotte: true,
			superCharlotte: true,
			init: function (player) {
				player.storage.biankuang = 1;
			},
		};
		lib.skill.yishifenghua_common = {
			forced: true,
			unique: true,
			popup: false,
			silent: true,
			charlotte: true,
			superCharlotte: true,
			init: function (player) {
				player.storage.biankuang = 2;
			},
		};
		lib.skill.yishifenghua_rare = {
			forced: true,
			unique: true,
			popup: false,
			silent: true,
			charlotte: true,
			superCharlotte: true,
			init: function (player) {
				player.storage.biankuang = 3;
			},
		};
		lib.skill.yishifenghua_epic = {
			forced: true,
			unique: true,
			popup: false,
			silent: true,
			charlotte: true,
			superCharlotte: true,
			init: function (player) {
				player.storage.biankuang = 4;
			},
		};
		lib.skill.yishifenghua_legend = {
			forced: true,
			unique: true,
			popup: false,
			silent: true,
			charlotte: true,
			superCharlotte: true,
			init: function (player) {
				player.storage.biankuang = 5;
			},
		};
		//边框
	}
	//刀剑斧
	if (lib.config["extension_十周年UI_daojianfu"] != "off") {
		lib.skill._yjshoujispine_ = {
			trigger: {
				player: "damageBegin4",
			},
			charlotte: true,
			forced: true,
			content: function () {
				const animationModes = {
					fu: {
						scale: 0.6,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/lei_daojianfu", actions: [3, 4] },
							fire: { name: "../../../十周年UI/assets/animation/huo_daojianfu", actions: [3, 4] },
							default: { name: "../../../十周年UI/assets/animation/fuzi", actions: [null, 2] },
						},
					},
					yjfu: {
						scale: 0.8,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/shoujidonghua_fuzi1", actions: [5, 6] },
							fire: { name: "../../../十周年UI/assets/animation/shoujidonghua_fuzi1", actions: [3, 4] },
							default: { name: "../../../十周年UI/assets/animation/shoujidonghua_fuzi1", actions: [1, 2] },
						},
					},
					jian: {
						scale: 0.6,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/SSXF_SX_guanjielei", actions: [5, 6] },
							fire: { name: "../../../十周年UI/assets/animation/huo_daojianfu", actions: [5, 6] },
							default: { name: "../../../十周年UI/assets/animation/jian", actions: [null, 2] },
						},
					},
					yjjian: {
						scale: 0.8,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/shoujidonghua_jian", actions: [5, 6] },
							fire: { name: "../../../十周年UI/assets/animation/shoujidonghua_jian", actions: [3, 4] },
							default: { name: "../../../十周年UI/assets/animation/shoujidonghua_jian", actions: [1, 2] },
						},
					},
					yjchuizi: {
						scale: 0.7,
						version: "4.0",
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/shoujidonghua_chuizi", actions: [5, 6] },
							fire: { name: "../../../十周年UI/assets/animation/shoujidonghua_chuizi", actions: [3, 4] },
							default: { name: "../../../十周年UI/assets/animation/shoujidonghua_chuizi", actions: [1, 2] },
						},
					},
					yjdefault: {
						scale: 0.7,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/shoujidonghua", actions: [5, 6] },
							fire: { name: "../../../十周年UI/assets/animation/shoujidonghua", actions: [3, 4] },
							default: { name: "../../../十周年UI/assets/animation/shoujidonghua", actions: [1, 2] },
						},
					},
					dao: {
						scale: 0.6,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/SSXF_SX_guanjielei", actions: [null, 2] },
							fire: { name: "../../../十周年UI/assets/animation/huo_daojianfu", actions: [null, 2] },
							default: { name: "../../../十周年UI/assets/animation/dao", actions: [null, 2] },
						},
					},
					no: {
						scale: 0.8,
						animations: {
							thunder: { name: "../../../十周年UI/assets/animation/effect_shoujidonghua", actions: [5, 6] },
							fire: { name: "../../../十周年UI/assets/animation/effect_shoujidonghua", actions: [3, 4] },
							default: { name: "../../../十周年UI/assets/animation/effect_shoujidonghua", actions: [1, 2] },
						},
					},
				};
				const mode = lib.config.extension_十周年UI_daojianfu;
				if (["fu", "jian", "dao", "no", "yjchuizi", "yjjian", "yjfu", "yjdefault"].includes(mode)) {
					if (trigger.nature !== "water") {
						const { scale, animations, version } = animationModes[mode];
						const { name, actions } = animations[trigger.nature] || animations.default;
						const actionIdx = trigger.num >= 2 ? 1 : 0;
						const action = actions[actionIdx] ? `play${actions[actionIdx]}` : "play";
						const params = { name, actions };
						if (action) params.action = action;
						if (version != undefined && version == "4.0") {
							skinSwitch.chukuangWorkerApi.playEffect(
								{
									name: params.name,
									version: version,
									action: params.action,
								},
								{ scale: scale, speed: 1, parent: player }
							);
						} else {
							dcdAnim.loadSpine(params.name, "skel", function () {
								dcdAnim.playSpine(params, {
									scale,
									parent: player,
								});
							});
						}
					}
				} else if (trigger.nature === "wood") {
					decadeUI.animation.playSpine("effect_zhiliao", { scale: 0.7, parent: player });
				}
			},
		};
	}
	if (lib.config["extension_十周年UI_rarityLong"] != "off") {
		//龙头
		lib.skill._rarity = {
			trigger: {
				global: "gameStart",
			},
			forced: true,
			filter: function (event, player) {
				return lib.config["extension_十周年UI_rarityLong"];
			},
			content: function () {
				if (lib.config.extension_十周年UI_rarityLong == "on" && game.getRarity(player.name) != "junk") {
					var rarity = game.getRarity(player.name);
					var yh = document.createElement("img");
					yh.src = decadeUIPath + "/assets/image/long1_" + rarity + ".png";
					yh.style.cssText = "pointer-events:none";
					yh.style.position = "absolute";
					yh.style.display = "block";
					yh.style.zIndex = "71";

					yh.style.top = "-38px";
					yh.style.left = "-6.3px";
					yh.style.height = "134%";
					yh.style.width = "134%";
					yh.style.zIndex = "71";
					player.appendChild(yh);
				}

				if (lib.config.extension_十周年UI_rarityLong == "off") {
					var rarity = ["epic", "legend", "rare"].randomGet();
					var yh = document.createElement("img");
					yh.src = decadeUIPath + "/assets/image/long1_" + rarity + ".png";
					yh.style.cssText = "pointer-events:none";
					yh.style.position = "absolute";
					yh.style.display = "block";

					yh.style.top = "-38px";
					yh.style.left = "-6.3px";
					yh.style.height = "134%";
					yh.style.width = "134%";
					yh.style.zIndex = "71";

					player.appendChild(yh);
				}

				if (lib.config.extension_十周年UI_rarityLong == "xinon" && game.getRarity(player.name) != "junk") {
					var rarity = game.getRarity(player.name);
					var yh = document.createElement("img");
					yh.src = decadeUIPath + "/assets/image/long_" + rarity + ".png";
					yh.style.cssText = "pointer-events:none";
					yh.style.position = "absolute";
					yh.style.display = "block";

					yh.style.top = "-118px";
					yh.style.left = "-28px";
					yh.style.height = "222%";
					yh.style.width = "175%";
					yh.style.zIndex = "71";
					player.appendChild(yh);
				}

				if (lib.config.extension_十周年UI_rarityLong == "xinoff") {
					var rarity = ["common", "epic", "legend", "rare"].randomGet();
					var yh = document.createElement("img");
					yh.src = decadeUIPath + "/assets/image/long_" + rarity + ".png";
					yh.style.cssText = "pointer-events:none";
					yh.style.position = "absolute";
					yh.style.display = "block";

					yh.style.top = "-118px";
					yh.style.left = "-27px";
					yh.style.height = "222%";
					yh.style.width = "175%";
					yh.style.zIndex = "71";
					player.appendChild(yh);
				}
			},
		};
	}
	//势力选择
	if (lib.config["extension_十周年UI_shiliyouhua"]) {
		Object.defineProperty(lib, "group", {
			get: () => ["wei", "shu", "wu", "qun", "jin"],
			set: () => {},
		});
		lib.skill._slyh = {
			trigger: {
				global: "gameStart",
				player: "enterGame",
			},
			forced: true,
			popup: false,
			silent: true,
			priority: Infinity,
			filter: (_, player) => player.group && !lib.group.includes(player.group),
			async content(event, trigger, player) {
				const list = lib.group.slice(0, 5);
				const result = await player
					.chooseControl(list)
					.set("ai", () => get.event().controls.randomGet())
					.set("prompt", "请选择你的势力")
					.forResult();
				if (result?.control) {
					player.group = result.control;
					player.node.name.dataset.nature = get.groupnature(result.control);
				}
			},
		};
	}

	//武将背景
	if (lib.config["extension_十周年UI_wujiangbeijing"]) {
		lib.skill._wjBackground = {
			charlotte: true,
			forced: true,
			popup: false,
			trigger: {
				global: ["gameStart", "modeSwitch"],
				player: ["enterGame", "showCharacterEnd"],
			},
			priority: 100,
			content() {
				const setBackground = player => {
					if (!player) return;
					// 检查游戏模式和双将设置
					const mode = get.mode();
					const isDoubleCharacter = lib.config.mode_config[mode] && lib.config.mode_config[mode].double_character;
					if (mode === "guozhan" || isDoubleCharacter) {
						// 国战模式或开启双将时使用bj2
						player.setAttribute("data-mode", "guozhan");
					} else {
						// 其他情况使用bj1
						player.setAttribute("data-mode", "normal");
					}
				};
				// 为所有玩家设置背景
				game.players.forEach(setBackground);
				game.dead.forEach(setBackground);
			},
		};
		// 添加全局技能
		if (!_status.connectMode) {
			game.addGlobalSkill("_wjBackground");
		}
		// 在游戏开始时检查并设置背景
		lib.arenaReady.push(function () {
			const mode = get.mode();
			const isDoubleCharacter = lib.config.mode_config[mode] && lib.config.mode_config[mode].double_character;
			if (mode === "guozhan" || isDoubleCharacter) {
				document.body.setAttribute("data-mode", "guozhan");
			} else {
				document.body.setAttribute("data-mode", "normal");
			}
		});
	}

	// 全选按钮功能 by奇妙工具做修改
	lib.hooks.checkBegin.add("Selectall", () => {
		const event = get.event();
		if (!event?.isMine) return;
		const needMultiSelect = event.selectCard?.[1] > 1;
		// 创建或移除全选按钮
		if (needMultiSelect && !ui.Selectall) {
			ui.Selectall = ui.create.control("全选", () => {
				// 选择所有手牌
				ai.basic.chooseCard(card => (get.position(card) === "h" ? 114514 : 0));
				// 执行自定义添加卡牌函数
				event.custom?.add?.card?.();
				// 更新选中卡牌显示
				ui.selected.cards?.forEach(card => card.updateTransform(true));
			});
		} else if (!needMultiSelect) {
			if (ui.Selectall) {
				ui.Selectall.remove();
				delete ui.Selectall;
			}
		}
	});
	lib.hooks.uncheckBegin.add("Selectall", () => {
		if (get.event().result?.bool) {
			if (ui.Selectall) {
				ui.Selectall.remove();
				delete ui.Selectall;
			}
		}
	});

	// 局内交互优化
	if (lib.config["extension_十周年UI_jiaohuyinxiao"]) {
		lib.skill._useCardAudio = {
			trigger: {
				player: "useCard",
			},
			forced: true,
			popup: false,
			priority: -10,
			content() {
				let card = trigger.card;
				let cardType = get.type(card);
				let cardName = get.name(card);
				let cardNature = get.nature(card);
				if (cardType == "basic") {
					switch (cardName) {
						case "sha":
							if (cardNature == "fire") {
								game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
							} else if (cardNature == "thunder") {
								game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
							} else {
								game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
							}
							break;
						case "shan":
							game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
							break;
						case "tao":
							game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
							break;
						case "jiu":
							game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
							break;
						default:
							game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
					}
				} else if (cardType == "trick") {
					if (get.tag(card, "damage")) {
						game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
					} else if (get.tag(card, "recover")) {
						game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
					} else {
						game.playAudio("..", "extension", "十周年UI", "audio/GameShowCard");
					}
				} else if (cardType == "equip") {
					let equipType = get.subtype(card);
					switch (equipType) {
						case "equip1": // 武器
							game.playAudio("..", "extension", "十周年UI", "audio/weapon_equip");
							break;
						case "equip2": // 防具
							game.playAudio("..", "extension", "十周年UI", "audio/horse_equip");
							break;
						case "equip3": // -1马
							game.playAudio("..", "extension", "十周年UI", "audio/armor_equip");
							break;
						case "equip4": // +1马
							game.playAudio("..", "extension", "十周年UI", "audio/armor_equip");
							break;
						case "equip5": // 宝物
							game.playAudio("..", "extension", "十周年UI", "audio/horse_equip");
							break;
					}
				}
			},
		};
		if (!_status.connectMode) {
			game.addGlobalSkill("_useCardAudio");
		}
		if (!_status.connectMode) {
			game.addGlobalSkill("_phaseStartAudio");
		}
		// 处理按钮点击音效
		document.body.addEventListener("mousedown", function (e) {
			const target = e.target;
			if (target.closest("#dui-controls")) {
				if (target.classList.contains("control") || target.parentElement.classList.contains("control")) {
					game.playAudio("..", "extension", "十周年UI", "audio/BtnSure");
				}
			}
			if (target.classList.contains("menubutton") || target.classList.contains("button")) {
				game.playAudio("..", "extension", "十周年UI", "audio/card_click");
			}
			if (target.classList.contains("card")) {
				game.playAudio("..", "extension", "十周年UI", "audio/card_click");
			}
		});
		// 处理按钮缩放效果
		document.body.addEventListener("mousedown", function (e) {
			const control = e.target.closest(".control");
			if (control && !control.classList.contains("disabled")) {
				control.style.transform = "scale(0.95)";
				control.style.filter = "brightness(0.9)";
				setTimeout(() => {
					control.style.transform = "";
					control.style.filter = "";
				}, 100);
			}
		});
	}
});
