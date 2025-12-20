app.import((lib, game, ui, get, ai, _status, app) => {
	// 常量定义
	const MODES = {
		IDENTITY: "identity",
		DOUDIZHU: "doudizhu",
		GUOZHAN: "guozhan",
		VERSUS: "versus",
		SINGLE: "single",
		MARTIAL: "martial",
	};
	const IDENTITIES = {
		ZHU: "zhu",
		ZHONG: "zhong",
		FAN: "fan",
		NEI: "nei",
	};
	const GROUPS = {
		UNKNOWN: "unknown",
		UNDEFINED: "undefined",
		WEI: "wei",
		SHU: "shu",
		WU: "wu",
		QUN: "qun",
		JIN: "jin",
		YE: "ye",
	};
	const BACKGROUNDS = ["人间安乐", "兵临城下", "兵荒马乱", "三国开黑节", "华灯初上", "天书乱斗", "朝堂之上", "校园行", "桃园风格", "汉室当兴", "游卡桌游", "十周年"];
	// 工具函数
	const utils = {
		playAudio(path) {
			game.playAudio(path);
		},
		createImage(src, style) {
			const img = ui.create.node("img");
			img.src = lib.assetURL + src;
			img.style.cssText = style;
			return img;
		},
		createDiv(className, container, clickHandler) {
			const div = ui.create.div(className, container);
			if (clickHandler) {
				div.addEventListener("click", clickHandler);
			}
			return div;
		},
		getButtonStyle(width, height, top, left, zIndex = 1) {
			return `display: block;--w: ${width}px;--h: calc(var(--w) * ${height});width: var(--w);height: var(--h);position: absolute;top: ${top};left: ${left};background-color: transparent;z-index:${zIndex}`;
		},
	};
	// 身份提示映射
	const identityTips = {
		[IDENTITIES.ZHU]: ".Tipzhugong",
		[IDENTITIES.ZHONG]: ".Tipzhongchen",
		[IDENTITIES.FAN]: ".Tipfanzei",
		[IDENTITIES.NEI]: ".Tipneijian",
	};
	// 斗地主身份提示映射
	const doudizhuTips = {
		[IDENTITIES.ZHU]: ".Tipdizhu",
		[IDENTITIES.FAN]: ".Tipnongmin",
	};
	// 国战势力提示映射
	const groupTips = {
		[GROUPS.UNKNOWN]: ".Tipundefined",
		[GROUPS.UNDEFINED]: ".Tipundefined",
		[GROUPS.WEI]: ".Tipweiguo",
		[GROUPS.SHU]: ".Tipshuguo",
		[GROUPS.WU]: ".Tipwuguo",
		[GROUPS.QUN]: ".Tipqunxiong",
		[GROUPS.JIN]: ".Tipjinguo",
		[GROUPS.YE]: ".Tipyexinjia",
	};
	// 创建问号按钮
	function createQuestionButton() {
		const isTouch = lib.config.phonelayout;
		const bottomOffset = isTouch ? "calc(100% - 55px)" : "calc(100% - 105px)"; // 非触屏布局往下移动20px
		const questionBtn = utils.createImage("extension/十周年UI/shoushaUI/lbtn/images/CD/wenhao.png", `display: block;width: 40px;height: 29px;position: absolute;bottom: ${bottomOffset};left: calc(100% - 159.5px);background-color: transparent;z-index:3`);
		questionBtn.onclick = () => {
			const popupContainer = ui.create.div(".popup-container", ui.window);
			utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
			// 根据游戏模式显示不同提示
			if (lib.config.mode === MODES.IDENTITY) {
				const tipClass = identityTips[game.me.identity];
				if (tipClass) {
					ui.create.div(tipClass, popupContainer);
				}
			} else if (lib.config.mode === MODES.DOUDIZHU) {
				const tipClass = doudizhuTips[game.me.identity];
				if (tipClass) {
					ui.create.div(tipClass, popupContainer);
				}
			} else if (lib.config.mode === MODES.VERSUS) {
				ui.create.div(".Tiphu", popupContainer);
			} else if (lib.config.mode === MODES.GUOZHAN) {
				const tipClass = groupTips[game.me.group] || ".Tipweizhi";
				ui.create.div(tipClass, popupContainer);
			}
			popupContainer.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
				popupContainer.delete(200);
			});
		};
		document.body.appendChild(questionBtn);
	}
	function createQuickMessages(rightbg) {
		let skills = game.me.getSkills(null, false, false).filter(skill => {
			let info = get.info(skill);
			return !info || !info.charlotte;
		});
		let skillsx = skills;
		for (let skill of skills) {
			let info = get.info(skill);
			if (info.derivation) {
				if (Array.isArray(info.derivation)) {
					for (let name of info.derivation) {
						skillsx.push(name);
					}
				} else {
					skillsx.push(info.derivation);
				}
			}
		}
		skillsx = skillsx.filter((item, index) => skillsx.indexOf(item) === index);
		for (let name of skillsx) {
			if (!get.info(name)) continue;
			let textList = game.parseSkillText(name, game.me.name);
			let audioList = game.parseSkillAudio(name, game.me.name);
			for (let i = 0; i < textList.length; i++) {
				ui.create.div(".talkquick", `[${get.skillTranslation(name)}]${textList[i]}`, rightbg, function () {
					let actualPath;
					if (audioList[i].slice(0, 4) === "ext:") actualPath = `../extension/${audioList[i].slice(4)}`;
					else actualPath = `../audio/${audioList[i]}`;
					if (game.online) {
						game.send("chat", game.onlineID, textList[i]);
						game.send("chat", game.onlineID, `/audio${actualPath}`);
					} else {
						game.me.chat(textList[i]);
						game.broadcastAll(function (receivedPath) {
							if (lib.config.background_speak) game.playAudio(receivedPath);
						}, actualPath);
					}
				});
			}
		}
		for (let i = 0; i < lib.quickVoice.length; i++) {
			let chat = lib.quickVoice[i];
			ui.create.div(".talkquick", chat, rightbg, function () {
				if (game.online) game.send("chat", game.onlineID, chat);
				else game.me.chat(chat);
			});
		}
	}
	function createEmotionPanel(rightbg) {
		const gridStyle = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridGap: "5px", width: "max-content", margin: "0 auto" };
		let list1, list2;
		function createDivWithStyle(className, content, style) {
			const div = ui.create.div(className, content);
			Object.assign(div.style, style);
			return div;
		}
		function createEmotionButton(pack, emotionID) {
			const button = ui.create.div(".card.fullskin", `<img src="${lib.assetURL}image/emotion/${pack}/${emotionID}.gif" width="80" height="80">`, () => {
				if (game.online) game.send("emotion", game.onlineID, pack, emotionID);
				else game.me.emotion(pack, emotionID);
			});
			button.emotionID = emotionID;
			button.pack = pack;
			Object.assign(button.style, { width: "80px", height: "80px" });
			return button;
		}
		function createEmotionPack(pack) {
			const packDiv = ui.create.div(".card.fullskin", `<img src="${lib.assetURL}image/emotion/${pack}/1.gif" width="80" height="80">`, () => {
				list2.innerHTML = "";
				const count = lib.emotionList[pack];
				for (let j = 1; j <= count; j++) {
					const emotionButton = createEmotionButton(pack, j);
					list2.appendChild(emotionButton);
				}
				list1.style.display = "none";
				list2.style.display = "grid";
			});
			packDiv.pack = pack;
			Object.assign(packDiv.style, { width: "80px", height: "80px" });
			return packDiv;
		}
		if (!list1) list1 = createDivWithStyle(".emotionbg", rightbg, gridStyle);
		else list1.style.display = "grid";
		if (!list2) list2 = createDivWithStyle(".emotionbg", rightbg, gridStyle);
		list1.innerHTML = "";
		list2.innerHTML = "";
		for (const pack in lib.emotionList) {
			const emotionPack = createEmotionPack(pack);
			list1.appendChild(emotionPack);
		}
	}
	function createHistoryPanel(rightbg) {
		const nameColor = "rgb(220, 170, 50)";
		for (let chat of lib.chatHistory) {
			let displayName = chat[0] || "";
			displayName = displayName.replace(/\[undefined\]/g, "");
			const content = `<span style="color:${nameColor};">${displayName}：</span><br>${chat[1]}`;
			ui.create.div(".talkhistory", content, rightbg);
		}
		rightbg.scrollTop = rightbg.scrollHeight;
	}
	function createTypeChangeButtons(typechanges, typechange, rightbg, defaultTab) {
		let allButtons = [];
		for (let [buttonName, config] of Object.entries(typechange)) {
			let button = ui.create.div(".typechange", config.name, typechanges);
			allButtons.push(button);
			let originalClick = config.click;
			button.onclick = function () {
				allButtons.forEach(btn => btn.classList.remove("typechangelight"));
				this.classList.add("typechangelight");
				while (rightbg.firstChild) {
					rightbg.removeChild(rightbg.firstChild);
				}
				if (originalClick) originalClick.call(this);
			};
		}
		typechange.quick.click();
		if (allButtons.length > 0) allButtons[0].classList.add("typechangelight");
		if (defaultTab) {
			const order = ["quick", "emoje", "history"];
			const idx = order.indexOf(defaultTab);
			if (idx >= 0 && allButtons[idx]) allButtons[idx].onclick();
		}
	}
	function setupInputHandler(dazi, getShuru, setShuru, rightbg, container) {
		dazi.addEventListener("click", function (event) {
			event.stopPropagation();
			let shuru = getShuru();
			if (!shuru) {
				shuru = document.createElement("input");
				shuru.type = "text";
				shuru.placeholder = "请输入要说的话";
				Object.assign(shuru.style, {
					position: "absolute",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: "1000",
					top: "5%",
					width: "60%",
					height: "10%",
					fontSize: "30px",
					backgroundColor: "rgba(255, 255, 255, 0.9)",
					border: "2px solid #C1AD92",
					borderRadius: "5px",
					padding: "5px",
					outline: "none",
					pointerEvents: "auto",
				});
				ui.window.appendChild(shuru);
				setShuru(shuru);
			}
			shuru.style.display = "block";
			shuru.focus();
		});
		ui.window.addEventListener("click", function (event) {
			let shuru = getShuru();
			if (shuru && shuru.style.display === "block") {
				if (!shuru.contains(event.target) && event.target !== dazi) {
					shuru.style.display = "none";
				}
			}
		});
		document.addEventListener("keydown", function (event) {
			let shuru = getShuru();
			if (shuru && shuru.style.display === "block" && event.key === "Enter") {
				let inputValue = shuru.value.trim();
				if (inputValue) {
					if (game.online) game.send("chat", game.onlineID, inputValue);
					else game.me.chat(inputValue);
					while (rightbg.firstChild) {
						rightbg.removeChild(rightbg.firstChild);
					}
					createHistoryPanel(rightbg);
				}
				shuru.value = "";
				shuru.style.display = "none";
			}
		});
	}
	// 创建手牌整理按钮
	function createSortButton() {
		const isRightLayout = lib.config["extension_十周年UI_rightLayout"] === "on";
		const isTouch = lib.config.phonelayout;
		const sortImg = isTouch ? "zhengli.png" : "zhenglix.png";
		let sortBtnStyle;
		if (isTouch) {
			sortBtnStyle = isRightLayout ? utils.getButtonStyle(88, "81/247", "calc(100% - 35px)", "calc(100% - 380px)", 7) : utils.getButtonStyle(88, "81/247", "calc(100% - 35px)", "calc(100% - 1260px)", 7);
		} else {
			sortBtnStyle = isRightLayout ? utils.getButtonStyle(45, "110/170", "calc(100% - 45px)", "calc(100% - 295px)", 7) : utils.getButtonStyle(88, "81/247", "calc(100% - 33px)", "right: calc(100% - 367.2px)", 4);
		}
		const sortBtn = utils.createImage(`extension/十周年UI/shoushaUI/lbtn/images/uibutton/${sortImg}`, sortBtnStyle);
		sortBtn.onclick = () => {
			if (!game.me || game.me.hasSkillTag("noSortCard")) return;
			const cards = game.me.getCards("hs");
			const sortFunction = (b, a) => {
				if (a.name !== b.name) return lib.sort.card(a.name, b.name);
				if (a.suit !== b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
				return a.number - b.number;
			};
			if (cards.length > 1) {
				cards.sort(sortFunction);
				cards.forEach((card, index) => {
					game.me.node.handcards1.insertBefore(cards[index], game.me.node.handcards1.firstChild);
				});
				dui.queueNextFrameTick(dui.layoutHand, dui);
			}
		};
		// 定时检测手牌数，动态显示/隐藏整理按钮
		sortBtn.style.display = "none";
		document.body.appendChild(sortBtn);
		function updateSortButtonVisibility() {
			sortBtn.style.display = game.me && game.me.getCards("hs").length >= 4 ? "block" : "none";
		}
		setInterval(updateSortButtonVisibility, 1000);
		updateSortButtonVisibility();
	}
	// 创建右上角菜单
	function createTopRightMenu() {
		const isTouch = lib.config.phonelayout;
		const topOffset = isTouch ? "10px" : "60px"; // 非触屏布局往下移动50px
		// 背景阴影
		const shadow = utils.createImage("extension/十周年UI/shoushaUI/lbtn/images/uibutton/yinying.png", "display: block;width: 100%;height: 30%;position: absolute;bottom: 0px;background-color: transparent;z-index:-4");
		document.body.appendChild(shadow);
		// 菜单按钮
		const menuBtn = utils.createImage("extension/十周年UI/shoushaUI/lbtn/images/CD/button3.png", `display: block;--w: 56px;--h: calc(var(--w) * 74/71);width: var(--w);height: var(--h);position: absolute;top: ${topOffset};right: 55px;background-color: transparent;z-index:5`);
		document.body.appendChild(menuBtn);
		let menuPopup = null;
		function openMenu() {
			if (menuPopup) return;
			utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/click.mp3");
			menuPopup = ui.create.div(".popup-container", { background: "rgb(0,0,0,0)" }, ui.window);
			menuPopup.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/back.mp3");
				event.stopPropagation();
				closeMenu();
			});
			// 创建菜单项
			const home = ui.create.div(".HOME", menuPopup);
			const settingsBtn = ui.create.div(".SZ", menuPopup);
			settingsBtn.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				if (!ui.click.configMenu) return;
				game.closePopped();
				game.pause2();
				ui.click.configMenu();
				ui.system1.classList.remove("shown");
				ui.system2.classList.remove("shown");
				closeMenu();
			});
			const leaveBtn = ui.create.div(".LK", menuPopup);
			leaveBtn.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				window.location.reload();
			});
			const bgBtn = ui.create.div(".BJ", menuPopup);
			bgBtn.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				openBackgroundSelector();
			});
			const surrenderBtn = ui.create.div(".TX", menuPopup);
			surrenderBtn.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				game.over();
			});
			const autoBtn = ui.create.div(".TG", menuPopup);
			autoBtn.addEventListener("click", event => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
				ui.click.auto();
			});
		}
		function openBackgroundSelector() {
			const popuperContainer = ui.create.div(
				".popup-container",
				{
					background: "rgba(0, 0, 0, 0.8)",
				},
				ui.window
			);
			const guanbi = ui.create.div(".bgback", popuperContainer, e => {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
				popuperContainer.hide();
				game.resume2();
			});
			const bigdialog = ui.create.div(".bgdialog", popuperContainer);
			const bgbg = ui.create.div(".backgroundsbg", bigdialog);
			loadBackgroundImages(bgbg);
		}
		function loadBackgroundImages(container) {
			let backgroundItems = lib.configMenu.appearence.config.image_background.item;
			let hiddenBgs = lib.config.hiddenBackgroundPack || [];

			for (let fileName in backgroundItems) {
				if (fileName === "default" || hiddenBgs.includes(fileName)) continue;

				let img = ui.create.div(".backgrounds", container);
				img.dataset.name = fileName;

				if (fileName.startsWith("custom_")) {
					game.getDB("image", fileName, fileToLoad => {
						if (fileToLoad) {
							const fileReader = new FileReader();
							fileReader.onload = fileLoadedEvent => {
								const data = fileLoadedEvent.target.result;
								img.style.backgroundImage = `url(${data})`;
								img.style.backgroundSize = "cover";
							};
							fileReader.readAsDataURL(fileToLoad, "UTF-8");
						}
					});
				} else {
					img.setBackgroundImage(`image/background/${fileName}.jpg`);
				}

				if (fileName === lib.config.image_background) ui.create.div(".bgxuanzhong", img);

				img.addEventListener("click", function () {
					const editItem = container.querySelector(".backgrounds:last-child");
					const isEditMode = editItem && editItem.classList.contains("active");
					if (isEditMode) {
						utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
						const textDiv = this.querySelector(".buttontext");
						if (textDiv && textDiv.innerHTML === "隐藏") {
							container.parentNode.noclose = true;
							this.remove();
							if (!lib.config.prompt_hidebg) {
								alert("隐藏的背景可通过选项-其它-重置隐藏内容恢复");
								game.saveConfig("prompt_hidebg", true);
							}
							lib.config.hiddenBackgroundPack.add(fileName);
							game.saveConfig("hiddenBackgroundPack", lib.config.hiddenBackgroundPack);
							delete lib.configMenu.appearence.config.image_background.item[fileName];
							if (lib.config.image_background === fileName) {
								game.saveConfig("image_background", "default");
								lib.init.background();
								game.updateBackground();
							}
							while (container.firstChild) {
								container.removeChild(container.firstChild);
							}
							loadBackgroundImages(container);
							return;
						} else if (textDiv && textDiv.innerHTML === "删除") {
							container.parentNode.noclose = true;
							if (confirm("是否删除此背景？（此操作不可撤销）")) {
								this.remove();
								lib.config.customBackgroundPack.remove(fileName);
								game.saveConfig("customBackgroundPack", lib.config.customBackgroundPack);
								if (fileName.startsWith("cdv_")) {
									game.removeFile("image/background/" + fileName + ".jpg");
								} else {
									game.deleteDB("image", fileName);
								}
								delete lib.configMenu.appearence.config.image_background.item[fileName];
								if (lib.config.image_background === fileName) {
									game.saveConfig("image_background", "default");
									lib.init.background();
									game.updateBackground();
								}
								while (container.firstChild) {
									container.removeChild(container.firstChild);
								}
								loadBackgroundImages(container);
							}
							return;
						}
					}
					let allSelectedElements = document.querySelectorAll(".bgxuanzhong");
					allSelectedElements.forEach(selectedElement => {
						selectedElement.parentNode.removeChild(selectedElement);
					});
					ui.create.div(".bgxuanzhong", img);
					game.saveConfig("image_background", fileName);
					lib.init.background();
					game.updateBackground();
				});

				let backgroundName = backgroundItems[fileName];
				ui.create.div(".buttontext", backgroundName, img);
			}
			(container => {
				const addItem = ui.create.div(".backgrounds", container);
				ui.create.div(".buttontext", "添加背景", addItem);
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.multiple = true;
				input.style.display = "none";
				document.body.appendChild(input);
				addItem.addEventListener("click", () => {
					utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
					input.click();
				});
				input.onchange = e => {
					const files = e.target.files;
					if (!files || files.length === 0) return;
					const fileList = Array.from(files);
					const totalFiles = fileList.length;
					let processedFiles = 0;
					fileList.forEach((file2, index) => {
						if (file2) {
							let name2 = file2.name;
							if (name2.includes(".")) {
								name2 = name2.slice(0, name2.indexOf("."));
							}
							let link = `${game.writeFile ? "cdv_" : "custom_"}${name2}`;
							if (lib.configMenu.appearence.config.image_background.item[link]) {
								for (let i = 1; i < 1e3; i++) {
									if (!lib.configMenu.appearence.config.image_background.item[`${link}_${i}`]) {
										link = `${link}_${i}`;
										break;
									}
								}
							}
							lib.configMenu.appearence.config.image_background.item[link] = name2;
							const callback = () => {
								lib.config.customBackgroundPack.add(link);
								game.saveConfig("customBackgroundPack", lib.config.customBackgroundPack);
								processedFiles++;
								if (processedFiles === totalFiles && editItem.classList.contains("active")) {
									editbg.call(editItem);
								}
								while (container.firstChild) {
									container.removeChild(container.firstChild);
								}
								loadBackgroundImages(container);
							};
							if (game.writeFile) {
								game.writeFile(file2, "image/background", `${link}.jpg`, callback);
							} else {
								game.putDB("image", link, file2, callback);
							}
						}
					});
				};
				const editItem = ui.create.div(".backgrounds", container);
				ui.create.div(".buttontext", "编辑背景", editItem);
				const editbg = function () {
					this.classList.toggle("active");
					const items = Array.from(container.querySelectorAll(".backgrounds"));
					const self = this;
					items.slice(0, Math.max(0, items.length - 2)).forEach(item => {
						const fname = item.dataset.name;
						if (!fname) return;
						const textDiv = item.querySelector(".buttontext");
						if (!textDiv) return;
						let str;
						if (self.classList.contains("active")) {
							if (fname.startsWith("custom_") || fname.startsWith("cdv_")) {
								str = "删除";
							} else {
								str = "隐藏";
							}
						} else {
							str = lib.configMenu.appearence.config.image_background.item[fname] || fname;
						}
						textDiv.innerHTML = str;
					});
				};
				editItem.addEventListener("click", function () {
					utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3");
					editbg.call(this);
				});
			})(container);
		}
		function closeMenu() {
			if (menuPopup) {
				menuPopup.delete(200);
				menuPopup = null;
			}
		}
		menuBtn.onclick = () => {
			if (menuPopup) {
				closeMenu();
			} else {
				openMenu();
			}
		};
	}
	// 初始化
	lib.arenaReady.push(() => {
		// 更新轮次
		const originUpdateRoundNumber = game.updateRoundNumber;
		game.updateRoundNumber = function () {
			originUpdateRoundNumber.apply(this, arguments);
			if (ui.cardRoundTime) {
				ui.cardRoundTime.updateRoundCard();
			}
		};
		// 创建UI元素
		const supportedModes = [MODES.IDENTITY, MODES.DOUDIZHU, MODES.GUOZHAN, MODES.VERSUS, MODES.SINGLE, MODES.MARTIAL];
		if (supportedModes.includes(lib.config.mode)) {
			createQuestionButton();
		}
		createSortButton();
		createTopRightMenu();
	});
	// 插件定义
	const plugin = {
		name: "lbtn",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {
			lib.skill._uicardupdate = {
				trigger: { player: "phaseJieshuBegin" },
				forced: true,
				unique: true,
				popup: false,
				silent: true,
				noLose: true,
				noGain: true,
				noDeprive: true,
				priority: -Infinity,
				filter(event, player) {
					return player === game.me;
				},
				content() {
					if (ui.updateSkillControl) {
						ui.updateSkillControl(game.me, true);
					}
				},
			};
		},
		precontent() {
			// 扩展视频内容
			Object.assign(game.videoContent, {
				createCardRoundTime() {
					ui.cardRoundTime = plugin.create.cardRoundTime();
				},
				createhandcardNumber() {
					ui.handcardNumber = plugin.create.handcardNumber();
				},
				updateCardRoundTime(opts) {
					if (!ui.cardRoundTime) return;
					const roundNumber = Math.max(1, game.roundNumber || 1);
					ui.cardRoundTime.node.roundNumber.innerHTML = `<span>第${roundNumber}轮</span>`;
					ui.cardRoundTime.setNumberAnimation(opts.cardNumber);
				},
				updateCardnumber(opts) {
					if (!ui.handcardNumber) return;
				},
			});
			// 重写UI创建函数
			app.reWriteFunction(ui.create, {
				me: [
					function () {
						plugin.create.control();
					},
					null,
				],
				arena: [
					null,
					function () {
						if (ui.time3) {
							clearInterval(ui.time3.interval);
							ui.time3.delete();
						}
						if (ui.cardPileNumber) ui.cardPileNumber.delete();
						ui.cardRoundTime = plugin.create.cardRoundTime();
						ui.handcardNumber = plugin.create.handcardNumber();
					},
				],
				cards: [
					null,
					function () {
						if (ui.cardRoundTime) {
							ui.cardRoundTime.updateRoundCard();
						}
					},
				],
			});
			// 重写配置菜单
			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					function (res, config, map) {
						const hiddenItems = ["control_style", "custom_button", "custom_button_system_top", "custom_button_system_bottom", "custom_button_control_top", "custom_button_control_bottom", "radius_size"];
						hiddenItems.forEach(item => map[item].hide());
					},
				],
			});
			// 重写确认对话框
			ui.create.confirm = function (str, func) {
				let confirm = ui.confirm;
				if (!confirm) {
					confirm = ui.confirm = plugin.create.confirm();
				}
				confirm.node.ok.classList.add("disabled");
				confirm.node.cancel.classList.add("disabled");
				if (_status.event.endButton) {
					ui.confirm.node.cancel.classList.remove("disabled");
				}
				if (str) {
					if (str.indexOf("o") !== -1) {
						confirm.node.ok.classList.remove("disabled");
					}
					if (str.indexOf("c") !== -1) {
						confirm.node.cancel.classList.remove("disabled");
					}
					confirm.str = str;
				}
				if (func) {
					confirm.custom = func;
				}
				ui.updatec();
				confirm.update();
			};
			// 拦截出牌阶段的取消：有选中时仅恢复选择而不结束回合
			(() => {
				const originalCancel = ui.click.cancel;
				ui.click.cancel = function (node) {
					const event = _status.event;
					if (event && _status.event.type === "phase" && ui.confirm && !event.skill && (ui.selected.cards.length !== 0 || ui.selected.targets.length !== 0)) {
						ui.confirm.classList.add("removing");
						event.restore();
						const cards = event.player.getCards("hej");
						for (let i = 0; i < cards.length; i++) {
							cards[i].recheck("useSkill");
						}
						game.uncheck();
						game.check();
						return;
					}
					return originalCancel.call(this, node);
				};
			})();
		},
		create: {
			control() {},
			confirm() {
				const confirm = ui.create.control("<span>确定</span>", "cancel");
				confirm.classList.add("lbtn-confirm");
				confirm.node = {
					ok: confirm.firstChild,
					cancel: confirm.lastChild,
				};
				if (_status.event.endButton) {
					_status.event.endButton.close();
				}
				confirm.node.ok.link = "ok";
				confirm.node.ok.classList.add("primary");
				confirm.node.cancel.classList.add("primary2");
				confirm.custom = plugin.click.confirm;
				app.reWriteFunction(confirm, {
					close: [
						function () {
							this.classList.add("closing");
						},
					],
				});
				// 绑定事件
				for (const key in confirm.node) {
					const node = confirm.node[key];
					node.classList.add("disabled");
					node.removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
					node.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
						e.stopPropagation();
						if (this.classList.contains("disabled")) {
							if (this.link === "cancel" && this.dataset.type === "endButton" && _status.event.endButton) {
								_status.event.endButton.custom();
								ui.confirm.close();
							}
							return;
						}
						if (this.parentNode.custom) {
							this.parentNode.custom(this.link, this);
						}
					});
				}
				// 处理技能按钮
				if (ui.skills2 && ui.skills2.skills.length) {
					const skills = ui.skills2.skills;
					confirm.skills2 = [];
					for (let i = 0; i < skills.length; i++) {
						const item = document.createElement("div");
						item.link = skills[i];
						item.innerHTML = get.translation(skills[i]);
						item.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
							e.stopPropagation();
							ui.click.skill(this.link);
						});
						item.dataset.type = "skill2";
						if (ui.updateSkillControl) {
							ui.updateSkillControl(game.me, true);
						}
					}
				}
				confirm.update = function () {
					if (confirm.skills2) {
						if (_status.event.skill && _status.event.skill !== confirm.dataset.skill) {
							confirm.dataset.skill = _status.event.skill;
							confirm.skills2.forEach(function (item) {
								item.remove();
							});
							ui.updatec();
						} else if (!_status.event.skill && confirm.dataset.skill) {
							delete confirm.dataset.skill;
							confirm.skills2.forEach(function (item) {
								confirm.insertBefore(item, confirm.firstChild);
							});
							ui.updatec();
						}
					}
					if (ui.updateSkillControl) {
						ui.updateSkillControl(game.me, true);
					}
				};
				return confirm;
			},
			handcardNumber() {
				const isRightLayout = lib.config["extension_十周年UI_rightLayout"] === "on";
				const isXPJ = lib.config.extension_十周年UI_XPJ === "on";
				const isTouch = lib.config.phonelayout;
				// 创建设置按钮
				ui.create.div(".settingButton", ui.arena, plugin.click.setting);
				// 仅触屏布局下加载功能按钮
				if (isTouch) {
					if (isRightLayout) {
						if (isXPJ) {
							ui.create.div(".huanfuButton", ui.arena, plugin.click.huanfu);
							ui.create.div(".jiluButton", ui.arena, plugin.click.talk);
						} else {
							ui.create.div(".huanfuButton_new", ui.arena, plugin.click.huanfu);
							ui.create.div(".jiluButton_new", ui.arena, plugin.click.talk);
							ui.create.div(".meiguiButton_new", ui.arena, ui.click.pause);
							ui.create.div(".xiaolianButton_new", ui.arena, plugin.click.xiaolian);
						}
					} else {
						if (isXPJ) {
							ui.create.div(".huanfuButton1", ui.arena, plugin.click.huanfu);
							ui.create.div(".jiluButton1", ui.arena, plugin.click.talk);
						} else {
							ui.create.div(".huanfuButton_new1", ui.arena, plugin.click.huanfu);
							ui.create.div(".jiluButton_new1", ui.arena, plugin.click.talk);
							ui.create.div(".meiguiButton_new1", ui.arena, ui.click.pause);
							ui.create.div(".xiaolianButton_new1", ui.arena, plugin.click.xiaolian);
						}
					}
				}
				// 创建托管按钮
				ui.create.div(".tuoguanButton", ui.arena, ui.click.auto);
				// 创建手牌数量显示
				const className = isRightLayout ? ".handcardNumber" : ".handcardNumber1";
				const node = ui.create.div(className, ui.arena).hide();
				node.node = {
					cardPicture: ui.create.div(".cardPicture", node),
					cardNumber: ui.create.div(".cardNumber", node),
				};
				node.updateCardnumber = function () {
					if (!game.me) return;
					const currentCards = game.me.countCards("h") || 0;
					const cardLimit = game.me.getHandcardLimit() || 0;
					const numberColor = currentCards > cardLimit ? "red" : "white";
					const displayLimit = cardLimit === Infinity ? "∞" : cardLimit;
					this.node.cardNumber.innerHTML = `<span><font color="${numberColor}">${currentCards}</font>` + `<sp style="font-size:15px; font-family:yuanli; color:#FFFCF5;">/</sp>${displayLimit}</span>`;
					this.show();
					game.addVideo("updateCardnumber", null, {
						cardNumber: cardLimit,
					});
				};
				node.node.cardNumber.interval = setInterval(function () {
					ui.handcardNumber.updateCardnumber();
				}, 1000);
				game.addVideo("createhandcardNumber");
				return node;
			},
			cardRoundTime() {
				const node = ui.create.div(".cardRoundNumber", ui.arena).hide();
				node.node = {
					cardPileNumber: ui.create.div(".cardPileNumber", node),
					roundNumber: ui.create.div(".roundNumber", node),
					time: ui.create.div(".time", node),
				};
				node.updateRoundCard = function () {
					const cardNumber = ui.cardPile.childNodes.length || 0;
					const roundNumber = Math.max(1, game.roundNumber || 1);
					this.node.roundNumber.innerHTML = `<span>第${roundNumber}轮</span>`;
					this.setNumberAnimation(cardNumber);
					this.show();
					game.addVideo("updateCardRoundTime", null, {
						cardNumber: cardNumber,
						roundNumber: roundNumber,
					});
				};
				node.setNumberAnimation = function (num, step) {
					const item = this.node.cardPileNumber;
					clearTimeout(item.interval);
					if (!item._num) {
						item.innerHTML = `<span>${num}</span>`;
						item._num = num;
					} else if (item._num !== num) {
						if (!step) step = 500 / Math.abs(item._num - num);
						if (item._num > num) item._num--;
						else item._num++;
						item.innerHTML = `<span>${item._num}</span>`;
						if (item._num !== num) {
							item.interval = setTimeout(() => {
								node.setNumberAnimation(num, step);
							}, step);
						}
					}
				};
				// 时间显示
				ui.time4 = node.node.time;
				ui.time4.starttime = get.utc();
				ui.time4.interval = setInterval(function () {
					const totalSeconds = Math.round((get.utc() - ui.time4.starttime) / 1000);
					if (totalSeconds >= 3600) {
						const hours = Math.floor(totalSeconds / 3600);
						const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
						const seconds = totalSeconds - hours * 3600 - minutes * 60;
						const formatTime = num => (num < 10 ? `0${num}` : num.toString());
						ui.time4.innerHTML = `<span>${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}</span>`;
					} else {
						const minutes = Math.floor(totalSeconds / 60);
						const seconds = totalSeconds - minutes * 60;
						const formatTime = num => (num < 10 ? `0${num}` : num.toString());
						ui.time4.innerHTML = `<span>${formatTime(minutes)}:${formatTime(seconds)}</span>`;
					}
				}, 1000);
				game.addVideo("createCardRoundTime");
				return node;
			},
		},
		click: {
			huanfu() {
				utils.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/CD/huanfu.mp3");
				window.zyile_charactercard ? window.zyile_charactercard(player, false) : ui.click.charactercard(game.me.name, game.zhu, lib.config.mode === "mode_guozhan" ? "guozhan" : true);
			},
			confirm(link, target) {
				if (link === "ok") {
					ui.click.ok(target);
				} else if (link === "cancel") {
					ui.click.cancel(target);
				} else if (target.custom) {
					target.custom(link);
				}
			},
			meigui() {
				// 玫瑰按钮点击处理
			},
			xiaolian() {
				plugin.click.talk("emoje");
			},
			talk(defaultTab) {
				if (!game.me) return;
				let shuru = null;
				let container = ui.create.div(".popup-container", ui.window, function (e) {
					if (e.target === container) container.hide();
					if (shuru) {
						shuru.value = "";
						shuru.style.display = "none";
					}
				});
				let bg = ui.create.div(".talkbg", container);
				let typechanges = ui.create.div(".typechanges", bg);
				let rightbg = ui.create.div(".talkrightbg", bg);
				const typechange = {
					quick: { name: "快捷", click: () => createQuickMessages(rightbg) },
					emoje: { name: "表情", click: () => createEmotionPanel(rightbg) },
					history: { name: "消息", click: () => createHistoryPanel(rightbg) },
				};
				createTypeChangeButtons(typechanges, typechange, rightbg, defaultTab);
				let dazi = ui.create.div(".dazi", "打字", bg);
				setupInputHandler(
					dazi,
					() => shuru,
					val => {
						shuru = val;
					},
					rightbg,
					container
				);
			},
			setting() {
				// 设置按钮点击处理
			},
		},
		compare: {
			type(a, b) {
				if (a === b) return 0;
				const types = ["basic", "trick", "delay", "equip"].addArray([a, b]);
				return types.indexOf(a) - types.indexOf(b);
			},
			name(a, b) {
				if (a === b) return 0;
				return a > b ? 1 : -1;
			},
			nature(a, b) {
				if (a === b) return 0;
				const nature = [undefined, "fire", "thunder"].addArray([a, b]);
				return nature.indexOf(a) - nature.indexOf(b);
			},
			suit(a, b) {
				if (a === b) return 0;
				const suit = ["diamond", "heart", "club", "spade"].addArray([a, b]);
				return suit.indexOf(a) - suit.indexOf(b);
			},
			number(a, b) {
				return a - b;
			},
		},
	};
	return plugin;
});
