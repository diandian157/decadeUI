import { lib, game, ui, get, ai, _status } from "noname";
import { initGTBB } from "./gtbb.js";

export function initPrecontentUI() {
	const PROGRESS_BAR_ID = "jindutiaopl";
	const AI_PROGRESS_BAR_ID = "jindutiaoAI";
	const DEFAULT_POS = [0, 0, 100, 100];
	const ANIMATION_DURATION = 1000;
	const AI_TIMER_INTERVAL = 150;
	const RED_THRESHOLD = 395 / 3;
	const DEFAULT_TEXT_FONT = "shousha";
	const DEFAULT_TEXT_SIZE = 16;
	const DEFAULT_TEXT_COLOR = "#ffffff";
	const DEFAULT_TIME = 3;
	const ANIMATION_DELAY = 1;

	const clearTimer = timerName => {
		if (window[timerName]) {
			clearInterval(window[timerName]);
			delete window[timerName];
		}
	};

	const removeElementById = id => {
		document.getElementById(id)?.remove();
	};

	const getProgressBarConfig = () => {
		const styleType = lib.config.extension_十周年UI_jindutiaoYangshi;
		const bottomPosition = parseFloat(lib.config["extension_十周年UI_jindutiaoSet"]) + "%";
		const timerInterval = parseFloat(lib.config.extension_十周年UI_jindutiaoST);

		const configs = {
			1: {
				name: "手杀进度条样式",
				container: {
					backgroundColor: "rgba(0,0,0,0.4)",
					width: "620px",
					height: "12.3px",
					borderRadius: "1000px",
					boxShadow: "0px 0px 9px #2e2b27 inset,0px 0px 2.1px #FFFFD5",
					overflow: "hidden",
					border: "1.2px solid #000000",
					position: "fixed",
					left: "calc(50% - 300px)",
					bottom: bottomPosition,
				},
				progressBar: {
					data: 620,
					style: "background-image: linear-gradient(#fccc54 15%, #d01424 30%, #cc6953 90%);height:12.8px;",
				},
				clearSpecial: true,
			},
			2: {
				name: "十周年PC端进度条样式",
				container: {
					width: "400px",
					height: "24px",
					display: "block",
					left: "calc(50% - 197px)",
					position: "fixed",
					bottom: bottomPosition,
				},
				progressBar: {
					data: 300,
					style: "width:280px;height:4.3px;margin:14px 0 0 85px;background-color: #E2E20A;border-right:5px solid #FFF;position: absolute;top: -3.5px;",
				},
				backgroundImage: {
					src: "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao.png",
					style: "--w:400px;--h:calc(var(--w)*44/759);width: var(--w);height:var(--h);position: absolute;top: 0;",
				},
				clearSpecial: true,
			},
			3: {
				name: "十周年客户端进度条样式",
				container: {
					width: "400px",
					height: "13px",
					display: "block",
					boxShadow: "0 0 4px #000000",
					margin: "0 0 !important",
					position: "fixed",
					left: "calc(50% - 197px)",
					bottom: bottomPosition,
				},
				progressBar: {
					data: 395,
					style: "z-index:1;width:399px;height:8px;margin:0 0 0 1px;background-color: #F4C336;border-top:3px solid #EBE1A7;border-bottom:2px solid #73640D;border-left:1px solid #73640D;position: absolute;top: 0px;border-radius:3px;",
				},
				secondaryBar: {
					data: 395,
					style: "width:399px;height:0.1px;margin:0 0 0 0.5px;background-color: #fff; opacity:0.8 ;border-top:1px solid #FFF;border-bottom:1px solid #FFF;border-left:1px solid #FFF;position: absolute;top: 17px;border-radius: 2px;",
				},
				backgroundImages: [
					{
						src: "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao2.1.png",
						style: "width: 400px;height:4px;position: absolute;top: 16px;z-index: -1;",
					},
					{
						src: "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao2.png",
						style: "width: 400px;height:13px;position: absolute;top: 0;opacity:0;",
					},
					{
						src: "extension/十周年UI/shoushaUI/lbtn/images/uibutton/jindutiao2.1.png",
						style: "width: 400px;height:14px;position: absolute;top: 0;z-index: -1;",
					},
				],
				setSpecial: true,
			},
			4: {
				name: "新样式",
				container: {
					width: "450px",
					height: "13px",
					display: "block",
					margin: "0 0 !important",
					position: "fixed",
					left: "calc(50% - 220px)",
					bottom: bottomPosition,
					backgroundColor: "#4B3621",
					borderRadius: "6px",
				},
				progressBar: {
					data: 449,
					style: "z-index:1;width:449px;height:12px;margin:0 0 0 0px;background-color:rgb(230, 151, 91);position: absolute;top: 1px;border-radius:6px;",
				},
				clearSpecial: true,
			},
		};

		return configs[styleType] ?? configs[1];
	};

	const createImageElement = imgConfig => {
		const img = document.createElement("img");
		img.src = `${lib.assetURL}${imgConfig.src}`;
		img.style.cssText = imgConfig.style;
		return img;
	};

	const createProgressBarElement = (data, style) => {
		const element = document.createElement("div");
		element.data = data;
		element.style.cssText = style;
		return element;
	};

	const removeTextElement = () => {
		if (_status.as_showText) {
			_status.as_showText.remove();
			delete _status.as_showText;
		}
		if (_status.as_showImage) {
			_status.as_showImage.show();
		}
	};

	const removeImageElement = () => {
		if (_status.as_showImage) {
			const outdiv = _status.as_showImage;
			_status.as_showImage.style.animation = "left-to-right-out 1s";
			delete _status.as_showImage;
			setTimeout(() => {
				outdiv.remove();
			}, ANIMATION_DURATION);
		}
	};

	const normalizeTime = time => {
		return time === true || (typeof time === "number" && !isNaN(time)) ? time : DEFAULT_TIME;
	};

	game.Jindutiaoplayer = () => {
		clearTimer("timer");
		clearTimer("timer2");
		removeElementById(PROGRESS_BAR_ID);

		const container = document.createElement("div");
		container.id = PROGRESS_BAR_ID;

		const config = getProgressBarConfig();

		if (config.clearSpecial && window.jindutiaoTeshu) {
			delete window.jindutiaoTeshu;
		}
		if (config.setSpecial && !window.jindutiaoTeshu) {
			window.jindutiaoTeshu = true;
		}

		Object.keys(config.container).forEach(key => {
			container.style[key] = config.container[key];
		});

		const boxTime = createProgressBarElement(config.progressBar.data, config.progressBar.style);
		container.appendChild(boxTime);

		let boxTime2 = null;
		let imgBg3 = null;

		if (config.secondaryBar) {
			boxTime2 = createProgressBarElement(config.secondaryBar.data, config.secondaryBar.style);
			container.appendChild(boxTime2);
		}

		if (config.backgroundImage) {
			const imgBg = createImageElement(config.backgroundImage);
			container.appendChild(imgBg);
		}

		if (config.backgroundImages) {
			config.backgroundImages.forEach((imgConfig, index) => {
				const img = createImageElement(imgConfig);
				if (index === 0) imgBg3 = img;
				container.appendChild(img);
			});
		}

		document.body.appendChild(container);

		const timerInterval = parseFloat(lib.config.extension_十周年UI_jindutiaoST);
		window.timer = setInterval(() => {
			boxTime.style.width = `${boxTime.data}px`;
			boxTime.style.backgroundColor = boxTime.data <= RED_THRESHOLD ? "rgba(230, 56, 65, 0.88)" : "rgb(230, 151, 91)";
			boxTime.data--;

			if (boxTime.data === 0) {
				clearInterval(window.timer);
				delete window.timer;
				container.remove();
				if (lib.config.extension_十周年UI_jindutiaotuoguan === true && _status.auto === false) {
					ui.click.auto();
				}
			}
		}, timerInterval);

		if (window.jindutiaoTeshu === true && boxTime2 && imgBg3) {
			window.timer2 = setInterval(() => {
				boxTime2.data--;
				boxTime2.style.width = `${boxTime2.data}px`;
				if (boxTime2.data === 0) {
					clearInterval(window.timer2);
					delete window.timer2;
					delete window.jindutiaoTeshu;
					boxTime2.remove();
					imgBg3.remove();
				}
			}, timerInterval / 2);
		}
	};

	game.JindutiaoAIplayer = () => {
		clearTimer("timerai");
		removeElementById(AI_PROGRESS_BAR_ID);

		const container = document.createElement("div");
		const boxTime = document.createElement("div");
		container.id = AI_PROGRESS_BAR_ID;

		const style = lib.config.extension_十周年UI_newDecadeStyle;
		const isShousha = style !== "on" && style !== "othersOff";

		if (isShousha) {
			container.style.cssText = "display:block;position:absolute;z-index:90;--w:122px;--h:calc(var(--w)*4/145);width:var(--w);height:var(--h);left:3.5px;bottom:-6.2px;";
			boxTime.data = 125;
			boxTime.style.cssText = "z-index:92;--w:33px;--h:calc(var(--w)*4/120);width:var(--w);height:var(--h);margin:1px;background-color:#dd9900;position:absolute;top:0px;";
		} else {
			container.style.cssText = "display:block;position:absolute;z-index:90;--w:122px;--h:calc(var(--w)*8/162);width:var(--w);height:var(--h);left:1.5px;bottom:-14px;";
			boxTime.data = 120;
			boxTime.style.cssText = "z-index:91;width:115px;height:3.3px;margin:1px;background-color:#f2c84b;position:absolute;top:0px;border-radius:3px;";
		}

		container.appendChild(boxTime);

		const imgBg = document.createElement("img");
		const timeImagePath = isShousha ? "extension/十周年UI/shoushaUI/lbtn/images/uibutton/time.png" : "extension/十周年UI/shoushaUI/lbtn/images/uibutton/timeX.png";
		imgBg.src = `${lib.assetURL}${timeImagePath}`;
		imgBg.style.cssText = isShousha ? "position:absolute;z-index:91;--w:122px;--h:calc(var(--w)*4/145);width:var(--w);height:var(--h);top:0;" : "position:absolute;z-index:90;--w:122px;--h:calc(var(--w)*8/162);width:var(--w);height:var(--h);top:0;";
		container.appendChild(imgBg);

		window.boxContentAI = container;
		document.body.appendChild(container);

		window.timerai = setInterval(() => {
			boxTime.data--;
			boxTime.style.width = `${boxTime.data}px`;
			if (boxTime.data === 0) {
				clearInterval(window.timerai);
				delete window.timerai;
				container.remove();
			}
		}, AI_TIMER_INTERVAL);
	};

	game.as_removeText = removeTextElement;

	game.as_showText = (str, pos, time, font, size, color) => {
		if (!str) return false;

		pos = Array.isArray(pos) ? pos : DEFAULT_POS;
		time = normalizeTime(time);
		font = font ?? DEFAULT_TEXT_FONT;
		size = size ?? DEFAULT_TEXT_SIZE;
		color = color ?? DEFAULT_TEXT_COLOR;

		removeTextElement();

		const div = ui.create.div("", str, ui.window);
		div.style.cssText = `z-index:-3; pointer-events:none; font-family:${font}; font-size:${size}px; color:${color}; line-height:${size * 1.2}px; text-align:center; left:${pos[0] + pos[2] / 2}%; top:${pos[1]}%; width:0%; height:${pos[3]}%; position:absolute; transition-property:all; transition-duration:1s`;
		_status.as_showText = div;

		if (_status.as_showImage) {
			_status.as_showImage.hide();
		}

		setTimeout(() => {
			div.style.left = `${pos[0]}%`;
			div.style.width = `${pos[2]}%`;
		}, ANIMATION_DELAY);

		if (time === true) return true;

		setTimeout(() => {
			removeTextElement();
		}, time * 1000);

		return true;
	};

	game.as_removeImage = removeImageElement;

	game.as_showImage = (url, pos, time) => {
		if (!url) return false;

		pos = Array.isArray(pos) ? pos : DEFAULT_POS;
		time = normalizeTime(time);

		removeImageElement();

		const div = ui.create.div("", "", ui.window);
		div.style.cssText = `z-index:-1; pointer-events:none; left:${pos[0]}%; top:${pos[1]}%; width:8%; height:${pos[3]}%; position:absolute; background-size:100% 100%; background-position:center center; background-image:url(${lib.assetURL}${url}); transition-property:all; transition-duration:1s`;
		_status.as_showImage = div;

		if (_status.as_showText) {
			_status.as_showImage.hide();
		}

		if (time === true) return true;

		setTimeout(() => {
			removeImageElement();
		}, time * 1000);

		return true;
	};
}

export function registerLegacyModules(config) {
	if (!lib.removeFirstByClass) {
		lib.removeFirstByClass = function (parent, className) {
			const el = parent.getElementsByClassName(className);
			if (el[0]) el[0].parentNode.removeChild(el[0]);
		};
	}
	if (!lib.createTipImg) {
		lib.createTipImg = function (className, src, style) {
			const img = document.createElement("img");
			img.classList.add("tipshow", className);
			img.src = src;
			img.style.cssText = style;
			return img;
		};
	}
	function createThinkSkill({ card, tipClass, img, style }) {
		return {
			trigger: { player: ["useCardBegin", "respondBegin"] },
			silent: true,
			forced: true,
			charlotte: true,
			filter(event, player) {
				if (!event.card) return false;
				const cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
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
	function createClearSkill({ tipClass }) {
		return {
			trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
			silent: true,
			forced: true,
			charlotte: true,
			filter(event, player) {
				event.respondix = 0;
				for (let i = 0; i < game.players.length; i++) {
					if (game.players[i].getElementsByClassName(tipClass)[0]) event.respondix++;
				}
				return event.respondix > 0;
			},
			async content(event, trigger, player) {
				for (let i = 0; i < game.players.length; i++) {
					lib.removeFirstByClass(game.players[i], tipClass);
				}
			},
		};
	}
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
		lib.skill._jindutiaoMB = {
			trigger: {
				player: "useCardToPlayered",
			},
			forced: true,
			silent: true,
			priority: -10,
			charlotte: true,
			filter(event, player) {
				return event.card && event.targets && event.targets.length && event.target != game.me;
			},
			async content(event, trigger, player) {
				const boxContent = document.createElement("div");
				const boxTime = document.createElement("div");
				const imgBg = document.createElement("img");
				boxContent.classList.add("timeai");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *4/145);width: var(--w);height: var(--h);left:3.5px;bottom:-6.2px;";
					boxTime.data = 125;
					boxTime.style.cssText = "z-index:92;--w: 33px;--h: calc(var(--w) * 4/120);width: var(--w);height: var(--h);margin:1px;background-color: #dd9900;position: absolute;top: 0px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/time.png";
					imgBg.style.cssText = "position:absolute;z-index:91;--w: 122px;--h: calc(var(--w) * 4/145);width: var(--w);height: var(--h);top: 0;";
				} else {
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *8/162);width: var(--w);height: var(--h);left:1.5px;bottom:-14px;";
					boxTime.data = 120;
					boxTime.style.cssText = "z-index:91;width: 115px;height: 3.3px;margin:1px;background-color: #f2c84b;position: absolute;top: 0px;border-radius: 3px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/timeX.png";
					imgBg.style.cssText = "position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) * 8/162);width: var(--w);height: var(--h);top: 0;";
				}
				boxContent.appendChild(boxTime);
				boxContent.appendChild(imgBg);
				const ab = trigger.target.getElementsByClassName("timeai");
				if (!ab[0]) trigger.target.appendChild(boxContent);
				window.timerix = setInterval(() => {
					boxTime.data--;
					boxTime.style.width = boxTime.data + "px";
					if (boxTime.data == 0) {
						clearInterval(window.timerix);
						delete window.timerix;
						boxContent.remove();
					}
				}, 150);
			},
			group: ["_jindutiaoMB_close"],
			subSkill: {
				close: {
					trigger: {
						global: ["phaseEnd", "useCardAfter", "dieBegin"],
					},
					filter(event, player) {
						event.respondix = 0;
						for (let i = 0; i < game.players.length; i++) {
							if (game.players[i] == game.me) continue;
							const ab = game.players[i].getElementsByClassName("timeai");
							if (ab[0]) event.respondix++;
						}
						return event.respondix > 0;
					},
					forced: true,
					silent: true,
					priority: -1,
					charlotte: true,
					async content(event, trigger, player) {
						for (let i = 0; i < game.players.length; i++) {
							if (game.players[i] == game.me) continue;
							lib.removeFirstByClass(game.players[i], "timeai");
						}
					},
				},
			},
		};
		lib.skill._jindutiaoKS = {
			trigger: {
				global: "gameStart",
			},
			silent: true,
			forced: true,
			priority: -1,
			charlotte: true,
			filter(event, player) {
				return player != game.me;
			},
			async content(event, trigger, player) {
				const boxContent = document.createElement("div");
				const boxTime = document.createElement("div");
				const imgBg = document.createElement("img");
				boxContent.classList.add("timeai");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *4/145);width: var(--w);height: var(--h);left:3.5px;bottom:-6.2px;";
					boxTime.data = 125;
					boxTime.style.cssText = "z-index:92;--w: 33px;--h: calc(var(--w) * 4/120);width: var(--w);height: var(--h);margin:1px;background-color: #dd9900;position: absolute;top: 0px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/time.png";
					imgBg.style.cssText = "position:absolute;z-index:91;--w: 122px;--h: calc(var(--w) * 4/145);width: var(--w);height: var(--h);top: 0;";
				} else {
					boxContent.style.cssText = "display:block;position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) *8/162);width: var(--w);height: var(--h);left:1.5px;bottom:-14px;";
					boxTime.data = 120;
					boxTime.style.cssText = "z-index:91;width: 115px;height: 3.3px;margin:1px;background-color: #f2c84b;position: absolute;top: 0px;border-radius: 3px;";
					imgBg.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/uibutton/timeX.png";
					imgBg.style.cssText = "position:absolute;z-index:90;--w: 122px;--h: calc(var(--w) * 8/162);width: var(--w);height: var(--h);top: 0;";
				}
				boxContent.appendChild(boxTime);
				boxContent.appendChild(imgBg);
				player.appendChild(boxContent);
				window.timerx = setInterval(() => {
					boxTime.data--;
					boxTime.style.width = boxTime.data + "px";
					if (boxTime.data == 0) {
						clearInterval(window.timerx);
						delete window.timerx;
						boxContent.remove();
					}
				}, 150);
			},
			group: ["_jindutiaoKS_close"],
			subSkill: {
				close: {
					trigger: {
						global: "phaseBefore",
					},
					filter(event, player) {
						event.respondx = 0;
						for (let i = 0; i < game.players.length; i++) {
							if (game.players[i] == game.me) continue;
							const ab = game.players[i].getElementsByClassName("timeai");
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
						for (let i = 0; i < game.players.length; i++) {
							if (game.players[i] == game.me) continue;
							lib.removeFirstByClass(game.players[i], "timeai");
						}
					},
				},
			},
		};
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
	if (get.mode() != "connect" && config.jindutiao == true) {
		lib.onover.push(function () {
			const bar = document.getElementById("jindutiaopl");
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
				const existingBar = document.getElementById("jindutiaopl");
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
						const bar = document.getElementById("jindutiaopl");
						if (bar) bar.remove();
					},
				},
			},
		};
	}
	lib.skill._chupaiE = {
		trigger: { player: ["useCardBegin", "respondBegin"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			if (!event.card) return false;
			const cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
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
			const cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
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
			const cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
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
			const cname = event.card.name || (event.card.viewAs ? event.card.viewAs : undefined);
			return cname == "jiu" && _status.currentPhase != player && player != (_status.event.player || game.me) && lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff";
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			if (player.getElementsByClassName("playertipjiu").length <= 0) {
				player.appendChild(lib.createTipImg("playertipjiu", lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipjiu.png", "display:block;position:absolute;z-index:91;--w:133px;--h:calc(var(--w)*50/431);width:var(--w);height:var(--h);bottom:-22px;"));
			}
		},
	};
	lib.skill._chupaiF = {
		trigger: { global: ["useCardEnd", "respondEnd", "dieBegin", "phaseBegin", "phaseEnd"] },
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			event.respondix = 0;
			for (let i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertipshan")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (let i = 0; i < game.players.length; i++) {
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
			for (let i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertipsha")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (let i = 0; i < game.players.length; i++) {
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
			for (let i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertiptao")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (let i = 0; i < game.players.length; i++) {
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
			for (let i = 0; i < game.players.length; i++) {
				if (game.players[i].getElementsByClassName("playertipjiu")[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (let i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertipjiu");
			}
		},
	};
	lib.skill._chupaiA = {
		trigger: {
			player: ["phaseUseBegin", "useCardEnd", "loseEnd"],
		},
		silent: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			const a = player.getElementsByClassName("playertip");
			return player != (_status.event.player || game.me) && _status.currentPhase == player && player.isPhaseUsing() && a.length <= 0;
		},
		async content(event, trigger, player) {
			lib.removeFirstByClass(player, "tipskill");
			const a = player.getElementsByClassName("playertip");
			if (a.length <= 0) {
				const tipAB = document.createElement("img");
				tipAB.classList.add("tipshow", "playertip");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					tipAB.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tip.png";
					tipAB.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
				} else {
					tipAB.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/phasetip.png";
					tipAB.style.cssText = "display:block;position:absolute;z-index:92;--w: 129px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-20px;transform:scale(1.2);";
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
			for (let i = 0; i < game.players.length; i++) {
				const ab = game.players[i].getElementsByClassName("playertip");
				if (ab[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (let i = 0; i < game.players.length; i++) {
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
			const a = player.getElementsByClassName("playertipQP");
			if (a.length <= 0) {
				const tipCD = document.createElement("img");
				tipCD.classList.add("tipshow", "playertipQP");
				if (lib.config.extension_十周年UI_newDecadeStyle != "on" && lib.config.extension_十周年UI_newDecadeStyle != "othersOff") {
					tipCD.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/tipQP.png";
					tipCD.style.cssText = "display:block;position:absolute;z-index:91;--w: 133px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-22px;";
				} else {
					tipCD.src = lib.assetURL + "extension/十周年UI/shoushaUI/lbtn/images/shoushatip/discardtip.png";
					tipCD.style.cssText = "display:block;position:absolute;z-index:92;--w: 129px;--h: calc(var(--w) * 50/431);width: var(--w);height: var(--h);bottom:-20px;transform:scale(1.2);";
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
			for (let i = 0; i < game.players.length; i++) {
				const ab = game.players[i].getElementsByClassName("playertipQP");
				if (ab[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (let i = 0; i < game.players.length; i++) {
				lib.removeFirstByClass(game.players[i], "playertipQP");
			}
		},
	};
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
			for (const player of game.players) {
				const ab = player.getElementsByClassName("tipskill");
				if (ab[0]) event.respondix++;
			}
			return event.respondix > 0;
		},
		async content(event, trigger, player) {
			for (const player of game.players) {
				lib.removeFirstByClass(player, "tipskill");
			}
		},
	};
	initGTBB(config);
}
