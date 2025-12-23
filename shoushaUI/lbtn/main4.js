app.import(function (lib, game, ui, get, ai, _status, app) {
	// 常量定义
	const CONSTANTS = {
		// 音频文件路径
		AUDIO: {
			CLICK: "../extension/十周年UI/shoushaUI/lbtn/images/CD/click.mp3",
			BACK: "../extension/十周年UI/shoushaUI/lbtn/images/CD/back.mp3",
			BUTTON: "../extension/十周年UI/shoushaUI/lbtn/images/CD/button.mp3",
			CAIDAN: "../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3",
		},
		// 图片路径
		IMAGES: {
			CAIDAN2: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/caidan2.png",
			SHEZHI: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/shezhi.png",
			BEIJING: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/beijing.png",
			TUOGUAN: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/tuoguan.png",
			LIKAI: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/likai.png",
			GIFT: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/gameview_tool_btn_prop.png",
			TALK: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/gameview_tool_btn_chat.png",
			CARDSORT: "extension/十周年UI/shoushaUI/lbtn/images/OL_line/uibutton/gameview_tool_btn_sort.png",
		},
		// 样式配置
		STYLES: {
			INPUT: {
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
			},
		},
		// 游戏模式配置
		MODE_CONFIGS: {
			single: {
				zhu: "击败对手",
				fan: "击败对手",
				undefined: "未选择阵营",
			},
			boss: {
				zhu: "击败盟军",
				cai: "击败神祇",
				undefined: "未选择阵营",
			},
			doudizhu: {
				zhu: "击败所有农民",
				fan: "击败地主",
				undefined: "未选择阵营",
			},
			identity: {
				rZhu: "击败冷方主公与所有野心家",
				rZhong: "保护暖方主公击败冷方主公与所有野心家",
				rYe: "联合冷方野心家击败其他角色",
				rNei: "协助冷方主公击败暖方主公与所有野心家",
				bZhu: "击败暖方主公与所有野心家",
				bZhong: "保护冷方主公击败暖方主公与所有野心家",
				bYe: "联合暖方野心家击败其他角色",
				bNei: "协助暖方主公击败冷方主公与所有野心家",
				zhu: "击败反贼和内奸",
				zhong: "保护主公，击败反贼内奸",
				fan: "击败主公",
				nei: "击败所有角色，最后击败主公",
				mingzhong: "保护主公，击败反贼内奸",
				commoner: "苟住，有一方获胜你就胜利",
				undefined: "击败所有敌方",
			},
		},
		// 身份颜色配置
		IDENTITY_COLORS: {
			unknown: "#FFFFDE",
			wei: "#0075FF",
			shu: "#FF0000",
			wu: "#00FF00",
			qun: "#FFFF00",
			jin: "#9E00FF",
			ye: "#9E00FF",
			key: "#9E00FF",
		},
		// 身份信息配置
		IDENTITY_INFO: {
			zhu: {
				color: "#AE5F35",
				aliases: ["zhu", "rZhu", "bZhu"],
			},
			zhong: {
				color: "#E9D765",
				aliases: ["zhong", "rZhong", "bZhong", "mingzhong"],
			},
			fan: {
				color: "#87A671",
				aliases: ["fan", "rYe", "bYe"],
			},
			nei: {
				color: "#9581C4",
				aliases: ["nei", "rNei", "bNei"],
			},
		},
	};
	// 工具函数
	const Utils = {
		// 播放音频
		playAudio(path) {
			game.playAudio(path);
		},
		// 创建元素并设置样式
		createElementWithStyle(className, content, parent, clickHandler) {
			const element = ui.create.div(className, content, parent, clickHandler);
			return element;
		},
		// 设置背景图片
		setBackgroundImage(element, path) {
			element.setBackgroundImage(path);
		},
		// 获取当前游戏模式
		getCurrentMode() {
			if (lib.configOL.doudizhu_mode || lib.config.mode === "doudizhu") return "doudizhu";
			if (lib.configOL.single_mode || lib.config.mode === "single") return "single";
			if (lib.configOL.boss_mode || lib.config.mode === "boss") return "boss";
			if (lib.configOL.guozhan_mode || lib.config.mode === "guozhan") return "guozhan";
			if (lib.configOL.versus_mode || lib.config.mode === "versus") return "versus";
			return "identity";
		},
		// 格式化时间
		formatTime(seconds) {
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds - hours * 3600) / 60);
			const secs = seconds - hours * 3600 - minutes * 60;
			const hoursStr = hours > 0 ? `${hours < 10 ? "0" : ""}${hours}:` : "";
			const minutesStr = `${minutes < 10 ? "0" : ""}${minutes}`;
			const secsStr = `${secs < 10 ? "0" : ""}${secs}`;
			return `${hoursStr}${minutesStr}:${secsStr}`;
		},
	};
	/*预留的接口
	ui.identityShow    左上角的牌局记录及胜利条件
	ui.caidanbutton       右上角的菜单按钮
	ui.anniubuttons       左下角的三个按钮
	ui.cardRoundTimeNode    右上角的牌堆数，计时器等
	ui.timeNode.starttime    计时器的时间
	*/
	const originalChat = lib.message.server.chat;
	lib.message.server.chat = function (id, str) {
		//修改本体的信息函数，使其可以在联机时发送快捷消息
		if (str.slice(0, 6) === "/audio") {
			game.broadcastAll(function (url) {
				if (lib.config.background_speak) {
					game.playAudio(url);
				}
			}, str.slice(6));
		} else originalChat.call(this, id, str);
	};
	// 拦截出牌阶段的取消：有选中时仅恢复选择而不结束回合
	(function () {
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
	ui.create.pause = function () {
		/*覆写历史记录*/
		if (_status.pausing) return;
		ui.click.shortcut(false);
		let node = ui.create.div(".pausedbg", ui.window);
		node.style.backgroundColor = "rgba(0,0,0,0.5)";
		node.style.backgroundSize = "100% 100%";
		let node_resume = ui.create.div(".resumedbg", node);
		node_resume.style.backgroundSize = "100% 100%";
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
		return node;
	};
	ui.click.pause = function () {
		/*覆写历史记录*/
		if (_status.paused2 || _status.pausing || _status.nopause || !ui.pause) return;
		if (!_status.video) {
			if (ui.pause.classList.contains("hidden")) return;
			if (!_status.gameStarted) return;
		}
		ui.system.hide();
		game.pause2();
		let clonedSidebar = ui.sidebar.cloneNode(false);
		let sidebarChildren = Array.from(ui.sidebar.childNodes);
		sidebarChildren.reverse();
		sidebarChildren.forEach(child => {
			let clonedChild = child.cloneNode(true);
			clonedSidebar.appendChild(clonedChild);
		});
		for (let element of clonedSidebar.children) {
			element.style.display = "block";
		}
		let node = ui.create.pause();
		if (!node) return;
		node.animate("start");
		let bigbg = ui.create.div(".bigbgjilu", node);
		let historybg = ui.create.div(".historybg", node);
		let columnbox = ui.create.div(".content", bigbg);
		// 获取场上所有角色
		let player_list = [];
		let click = [];
		for (let player of game.players) {
			player_list.add(player);
			if (player.getElementsByClassName("yinni").length > 0) {
				player.name = "yinni";
				lib.translate.yinni = "主将";
			}
		}
		if (game.dead.length > 0) {
			for (let player of game.dead) {
				player_list.add(player);
			}
		}
		player_list.sort(function (a, b) {
			return a.getSeatNum() - b.getSeatNum();
		});
		function changeall(event) {
			event.stopPropagation();
			document.querySelectorAll(".gou").forEach(gou => {
				gou.remove();
			});
			ui.create.div(".gou", allOptionAnniu);
			for (let element of clonedSidebar.children) {
				element.style.display = "block";
			}
			if (clonedSidebar.childNodes.length && clonedSidebar.scrollHeight > clonedSidebar.offsetHeight) {
				clonedSidebar.scrollTop = clonedSidebar.scrollHeight - clonedSidebar.clientHeight;
			}
		}
		let allOptionBg = ui.create.div(".namebg", columnbox);
		let namebgbg = ui.create.div(".namebgbg", allOptionBg);
		let allOptionAnniu = ui.create.div(".jiluanniu", allOptionBg, function (event) {
			changeall(event);
		});
		ui.create.div(".gou", allOptionAnniu);
		let name = ui.create.div(".name", "全部", namebgbg, function (event) {
			changeall(event);
		});
		for (let tar of player_list) {
			let namebg = ui.create.div(".namebg", columnbox);
			if (game.dead.includes(tar)) namebg.style.filter = "grayscale(0%)";
			let namebgbg = ui.create.div(".namebgbg", namebg);
			function change(event) {
				event.stopPropagation();
				document.querySelectorAll(".gou").forEach(gou => {
					gou.remove();
				});
				let gou = ui.create.div(".gou", anniu);
				let seat = tar.getSeatNum();
				const targets = game.players.concat(game.dead).filter(function (current) {
					return current.getSeatNum() === seat;
				});
				if (targets.length) {
					let current = targets[0];
					let names = [current.name, current.name1, current.name2];
					names = [...new Set(names)];
					names = names.map(name => get.translation(name)).filter(name => name.length > 0);
					let hasEmpty = false;
					for (let element of clonedSidebar.children) {
						let hasPlayer = false;
						let text = element.innerText || element.textContent || "";
						if (text.trim().length === 0) {
							if (!hasEmpty) {
								element.style.display = "block";
								hasEmpty = true;
							} else {
								element.style.display = "none";
							}
							continue;
						}
						hasEmpty = false;
						for (let name of names) {
							if (text.includes(name)) {
								hasPlayer = true;
								element.style.display = "block";
								break;
							}
						}
						if (!hasPlayer) {
							element.style.display = "none";
						}
					}
				}
				if (clonedSidebar.childNodes.length && clonedSidebar.scrollHeight > clonedSidebar.offsetHeight) {
					clonedSidebar.scrollTop = clonedSidebar.scrollHeight - clonedSidebar.clientHeight;
				}
			}
			const prefixName = get.slimNameHorizontal(tar.name);
			const seatnum = `(${tar.getSeatNum() === 2 ? "二" : get.cnNumber(tar.getSeatNum())}号位)`;
			const name = ui.create.div(".name", prefixName + seatnum, namebgbg, function (event) {
				change(event);
			});
			const anniu = ui.create.div(".jiluanniu", namebg, function (event) {
				change(event);
			});
		}
		ui.sidebar3.innerHTML = "";
		if (lib.config.show_discardpile) {
			for (let i = 0; i < ui.discardPile.childNodes.length; i++) {
				let div = ui.create.div(ui.sidebar3);
				div.innerHTML = get.translation(ui.discardPile.childNodes[i]);
				ui.sidebar3.insertBefore(div, ui.sidebar3.firstChild);
			}
		}
		historybg.appendChild(clonedSidebar);
		node.appendChild(ui.sidebar3);
		ui.historybar.classList.add("paused");
		ui.arena.classList.add("paused");
		ui.window.classList.add("touchinfohidden");
		ui.time.hide();
		if (game.onpause) {
			game.onpause();
		}
		if (clonedSidebar.childNodes.length && clonedSidebar.scrollHeight > clonedSidebar.offsetHeight) {
			clonedSidebar.scrollTop = clonedSidebar.scrollHeight - clonedSidebar.clientHeight;
		}
	};
	function shenfenrenwu() {
		//身份任务
		const setupModeConfigs = () => {
			const modeConfigs = {
				...CONSTANTS.MODE_CONFIGS,
				guozhan: () => {
					let config = {
						undefined: "未选择势力",
						unknown: "保持隐蔽",
						ye: "击败场上所有其他角色",
					};
					for (let i = 0; i < lib.group.length; i++) {
						config[lib.group[i]] = `击败所有非${get.translation(lib.group[i])}势力角色`;
					}
					return config;
				},
				versus: () => {
					let versusMode = get.config("versus_mode");
					if (versusMode === "standard") return {};
					if (versusMode === "two") {
						return {
							undefined: get.config("replace_character_two") ? "击败所有敌方" : "协同队友击败所有敌人",
						};
					}
					if (versusMode === "jiange") {
						return {
							wei: "击败所有蜀势力角色",
							shu: "击败所有魏势力角色",
						};
					}
					if (versusMode === "siguo") {
						const config = {};
						for (let i = 0; i < lib.group.length; i++) {
							config[lib.group[i]] = `获得龙船或击败非${get.translation(lib.group[i])}势力角色`;
						}
						return config;
					}
					return {};
				},
			};
			// 确定当前游戏模式
			const currentMode = Utils.getCurrentMode();
			// 设置翻译文本
			if (currentMode) {
				const config = typeof modeConfigs[currentMode] === "function" ? modeConfigs[currentMode]() : modeConfigs[currentMode];
				Object.keys(config).forEach(key => {
					lib.translate[`${key}_win_option`] = config[key];
				});
			}
		};
		const updatePlayerNicknames = () => {
			game.countPlayer(current => {
				const namex = current === game.me ? lib.config.connect_nickname : ["缘之空", "小小恐龙", "自然萌", "海边的ebao", "小云云", "点点", "猫猫虫", "小爱莉", "冰佬", "鹿鹿", "黎佬", "浮牢师", "U佬", "蓝宝", "影宝", "柳下跖", "无语", "小曦", "墨渊", "k9", "扶苏", "皇叔"].randomGet();
				if (!game.hasPlayer(current => {})) if (!current.nickname) current.nickname = namex;
			});
		};
		const buildIdentityString = () => {
			let str = "";
			if (lib.config.mode === "guozhan" || (lib.config.mode === "versus" && get.config("versus_mode") === "siguo") || (lib.config.mode === "versus" && get.config("versus_mode") === "jiange")) {
				const identities = ["unknown", "wei", "shu", "wu", "qun", "jin", "ye", "key"];
				const identityCounts = {};
				for (let identity of identities) {
					identityCounts[identity] = game.countPlayer(current => {
						return current.identity === identity;
					});
					str += `<font color="${CONSTANTS.IDENTITY_COLORS[identity]}">${get.translation(identity)}${identityCounts[identity]}</font> `;
				}
				str += "<br>";
			} else if ((lib.config.mode === "versus" && get.config("versus_mode") === "two") || lib.config.mode === "doudizhu") {
				// 空实现
			} else {
				for (let [key, info] of Object.entries(CONSTANTS.IDENTITY_INFO)) {
					const count = game.countPlayer(current => info.aliases.includes(current.identity));
					str += `<font color="${info.color}">${get.translation(key)}</font>${count}  `;
				}
				str += "<br>";
			}
			return str;
		};
		const updateIdentityShow = () => {
			updatePlayerNicknames();
			//左上角整体（身份任务及牌局记录）
			const identityShow = ui.identityShow;
			let str = buildIdentityString();
			if (game.me) str += `<span style="color: orange;"><center>${get.translation(game.me.identity + "_win_option")}</span>`;
			if (lib.config.mode === "taixuhuanjing") {
				game.gamePremise = function () {
					return;
				};
				str = `<span style="color: orange;"><center>${_status.TaiXuHuanJingGame.premise}</span>`;
			}
			identityShow.innerHTML = `<span style="font-family:shousha;font-size:16px;font-weight:500;text-align:right;line-height:20px;color:#C1AD92;text-shadow:none;max-width:20px;word-wrap:break-word;">${str}</span>`;
			const jiluShow = ui.create.div(".jiluButton", identityShow, ui.click.pause);
		};
		// 初始化
		setupModeConfigs();
		if (ui.identityShow === undefined) {
			ui.identityShow = ui.create.div(".identityShow", "身份加载中......", ui.window);
		}
		ui.identityShow_update = updateIdentityShow;
		setInterval(function () {
			//更新身份任务
			ui.identityShow_update();
		}, 1000);
	}
	function createcaidan() {
		//菜单按钮
		const createMenuButton = () => {
			ui.caidanbutton = ui.create.div(".ui.caidanbutton", ui.window);
			ui.caidanbutton.onclick = openMenuPopup;
		};
		const openMenuPopup = () => {
			Utils.playAudio(CONSTANTS.AUDIO.CLICK);
			const popuperContainer = ui.create.div(".popup-container", ui.window);
			popuperContainer.addEventListener("click", event => {
				Utils.playAudio(CONSTANTS.AUDIO.BACK);
				event.stopPropagation();
				popuperContainer.delete(200);
			});
			const caidanHOME = ui.create.div(".caidanopen", popuperContainer);
			createMenuItems(caidanHOME);
		};
		const createMenuItems = container => {
			// 展开后的菜单按钮
			const caidan2 = Utils.createElementWithStyle(".controls", container);
			Utils.setBackgroundImage(caidan2, CONSTANTS.IMAGES.CAIDAN2);
			// 设置按钮
			const SZ = Utils.createElementWithStyle(".controls", container);
			Utils.setBackgroundImage(SZ, CONSTANTS.IMAGES.SHEZHI);
			SZ.addEventListener("click", event => {
				Utils.playAudio(CONSTANTS.AUDIO.BUTTON);
				if (!ui.click.configMenu) return;
				game.closePopped();
				game.pause2();
				ui.click.configMenu();
				ui.system1.classList.remove("shown");
				ui.system2.classList.remove("shown");
			});
			// 背景按钮
			const BJ = Utils.createElementWithStyle(".controls", container);
			Utils.setBackgroundImage(BJ, CONSTANTS.IMAGES.BEIJING);
			BJ.addEventListener("click", event => {
				Utils.playAudio(CONSTANTS.AUDIO.BUTTON);
				openBackgroundSelector();
			});
			// 托管按钮
			const TG = Utils.createElementWithStyle(".controls", container);
			Utils.setBackgroundImage(TG, CONSTANTS.IMAGES.TUOGUAN);
			TG.addEventListener("click", event => {
				ui.click.auto();
			});
			// 离开按钮
			const TC = Utils.createElementWithStyle(".controls", container);
			Utils.setBackgroundImage(TC, CONSTANTS.IMAGES.LIKAI);
			TC.addEventListener("click", event => {
				window.location.reload();
			});
			// 动态添加系统菜单项
			addSystemMenuItems(container);
		};
		const openBackgroundSelector = () => {
			const popuperContainer = ui.create.div(
				".popup-container",
				{
					background: "rgba(0, 0, 0, 0.8)",
				},
				ui.window
			);
			const guanbi = ui.create.div(".bgback", popuperContainer, function (e) {
				Utils.playAudio(CONSTANTS.AUDIO.CAIDAN);
				popuperContainer.hide();
				game.resume2();
			});
			const bigdialog = ui.create.div(".bgdialog", popuperContainer);
			const bgbg = ui.create.div(".backgroundsbg", bigdialog);
			loadBackgroundImages(bgbg);
		};
		const loadBackgroundImages = container => {
			let backgroundItems = lib.configMenu.appearence.config.image_background.item;
			let hiddenBgs = lib.config.hiddenBackgroundPack || [];

			for (let fileName in backgroundItems) {
				if (fileName === "default" || hiddenBgs.includes(fileName)) continue;

				let img = ui.create.div(".backgrounds", container);
				img.dataset.name = fileName;

				if (fileName.startsWith("custom_")) {
					game.getDB("image", fileName, function (fileToLoad) {
						if (fileToLoad) {
							const fileReader = new FileReader();
							fileReader.onload = function (fileLoadedEvent) {
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
						Utils.playAudio(CONSTANTS.AUDIO.BUTTON);
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
									game.removeFile(`image/background/${fileName}.jpg`);
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
					allSelectedElements.forEach(function (selectedElement) {
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
			(function (container) {
				const addItem = ui.create.div(".backgrounds", container);
				ui.create.div(".buttontext", "添加背景", addItem);
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.multiple = true;
				input.style.display = "none";
				document.body.appendChild(input);
				addItem.addEventListener("click", function () {
					Utils.playAudio(CONSTANTS.AUDIO.BUTTON);
					input.click();
				});
				input.onchange = function (e) {
					const files = e.target.files;
					if (!files || files.length === 0) return;
					const fileList = Array.from(files);
					const totalFiles = fileList.length;
					let processedFiles = 0;
					fileList.forEach(function (file2, index) {
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
							const callback = function () {
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
					items.slice(0, Math.max(0, items.length - 2)).forEach(
						function (item) {
							const fname = item.dataset.name;
							if (!fname) return;
							const textDiv = item.querySelector(".buttontext");
							if (!textDiv) return;
							let str;
							if (this.classList.contains("active")) {
								if (fname.startsWith("custom_") || fname.startsWith("cdv_")) {
									str = "删除";
								} else {
									str = "隐藏";
								}
							} else {
								str = lib.configMenu.appearence.config.image_background.item[fname] || fname;
							}
							textDiv.innerHTML = str;
						}.bind(this)
					);
				};
				editItem.addEventListener("click", function () {
					Utils.playAudio(CONSTANTS.AUDIO.BUTTON);
					editbg.call(this);
				});
			})(container);
		};
		const addSystemMenuItems = container => {
			const excludedItems = ["聊天", "联机大厅", "最近连接", "投降", "重来", "选项", "暂停", "不询问无懈", "托管", "♫", "整理手牌", "收藏", "牌堆"];
			for (let i in game.system) {
				if (excludedItems.includes(game.system[i].name)) continue;
				let node = ui.create.div(".controls", game.system[i].name, container);
				if (game.system[i].click) {
					node.addEventListener(
						"click",
						(function (clickFunc) {
							return function (event) {
								clickFunc();
							};
						})(game.system[i].click)
					);
				}
			}
		};
		// 初始化菜单按钮
		createMenuButton();
	}
	function xiaopeijian() {
		//小配件
		const GIFT_CONFIG = {
			hua: {
				name: "鲜花",
				image: "xianhua.png",
				cost: "1",
				show: "flower",
			},
			jiu: {
				name: "青梅煮酒",
				image: "qingjiu.png",
				cost: "5",
				show: "wine",
			},
			dan: {
				name: "鸡蛋",
				image: "jidan.png",
				cost: "1",
				show: "egg",
			},
			xie: {
				name: "草鞋",
				image: "tuoxie.png",
				cost: "5",
				show: "shoe",
			},
		};
		const buttonConfigs = {
			gift: {
				//送花
				imageBg: CONSTANTS.IMAGES.GIFT,
				click: createGiftFunction,
			},
			talk: {
				//交流
				imageBg: CONSTANTS.IMAGES.TALK,
				click: createTalkFunction,
			},
			sortcard: {
				//牌序
				imageBg: CONSTANTS.IMAGES.CARDSORT,
				click: createSortCardFunction,
			},
		};
		function createGiftFunction() {
			let container = ui.create.div(".popup-container", ui.window, function (e) {
				if (e.target === container) container.hide();
			});
			let giftbg = ui.create.div(".giftbg", container);
			ui.create.div(".giftbgtext", "点击道具使用", giftbg);
			let giftes = ui.create.div(".giftes", giftbg);
			for (let i in GIFT_CONFIG) {
				let gift = ui.create.div(".gift", giftes, function (event) {
					giftbg.hide();
					createGiftSelection(container, GIFT_CONFIG[i], giftbg);
				});
				gift.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/OL_line/gift/" + GIFT_CONFIG[i].image);
				ui.create.div(".giftname", GIFT_CONFIG[i].name, gift);
				ui.create.div(".giftcost", GIFT_CONFIG[i].cost, gift);
			}
		}
		function createGiftSelection(container, giftType, giftbg) {
			let container2 = ui.create.div(".popup-container", ui.window, function (e) {
				if (e.target === container2) {
					container2.hide();
					giftbg2.hide();
					giftbg.show();
				}
			});
			let giftbg2 = ui.create.div(".giftbg2", container);
			ui.create.div(".giftbgtext", "点击框外区域可退出", giftbg2);
			let gift2 = ui.create.div(".gift2", giftbg2);
			gift2.setBackgroundImage("extension/十周年UI/shoushaUI/lbtn/images/OL_line/gift/" + giftType.image);
			game.countPlayer(current => {
				if (current !== game.me) {
					let player = current.node.avatar;
					let giftgive = ui.create.div(".giftgive", container2, function (event) {
						event.stopPropagation();
						if (game.online) {
							game.send("throwEmotion", current, giftType.show);
						} else game.me.throwEmotion(current, giftType.show);
					});
					const playerRect = player.getBoundingClientRect();
					const containerRect = container.getBoundingClientRect();
					giftgive.style.position = "absolute";
					giftgive.style.top = `${playerRect.top - containerRect.top}px`;
					giftgive.style.left = `${playerRect.left - containerRect.left}px`;
					giftgive.style.width = `${playerRect.width}px`;
					giftgive.style.height = `${playerRect.height}px`;
				}
			});
		}
		function createTalkFunction() {
			if (!game.me) return;
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
				quick: {
					name: "快捷",
					click: () => createQuickMessages(rightbg),
				},
				emoje: {
					name: "表情",
					click: () => createEmotionPanel(rightbg),
				},
				history: {
					name: "消息",
					click: () => createHistoryPanel(rightbg),
				},
			};
			createTypeChangeButtons(typechanges, typechange, rightbg);
			let dazi = ui.create.div(".dazi", "打字", bg);
			let shuru = null;
			setupInputHandler(dazi, shuru, rightbg, container);
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
			skillsx = skillsx.filter((item, index) => {
				return skillsx.indexOf(item) === index;
			});
			for (let name of skillsx) {
				if (!get.info(name)) continue;
				let textList = game.parseSkillText(name, game.me.name);
				let audioList = game.parseSkillAudio(name, game.me.name);
				for (let i = 0; i < textList.length; i++) {
					const text = ui.create.div(".talkquick", `[${get.skillTranslation(name)}]${textList[i]}`, rightbg, function () {
						let actualPath;
						if (audioList[i].slice(0, 4) === "ext:") actualPath = `../extension/${audioList[i].slice(4)}`;
						else actualPath = `../audio/${audioList[i]}`;
						if (game.online) {
							game.send("chat", game.onlineID, textList[i]);
							game.send("chat", game.onlineID, `/audio${actualPath}`);
						} else {
							game.me.chat(textList[i]);
							game.broadcastAll(function (receivedPath) {
								if (lib.config.background_speak) {
									game.playAudio(receivedPath);
								}
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
			const gridStyle = {
				display: "grid",
				gridTemplateColumns: "repeat(3, 1fr)",
				gridGap: "5px",
				width: "max-content",
				margin: "0 auto",
			};
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
				Object.assign(button.style, {
					width: "80px",
					height: "80px",
				});
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
				Object.assign(packDiv.style, {
					width: "80px",
					height: "80px",
				});
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
				const content = `<span style="color:${nameColor};">${chat[0]}：</span><br>${chat[1]}`;
				ui.create.div(".talkhistory", content, rightbg);
			}
			rightbg.scrollTop = rightbg.scrollHeight;
		}
		function createTypeChangeButtons(typechanges, typechange, rightbg) {
			let allButtons = [];
			for (let [buttonName, config] of Object.entries(typechange)) {
				let button = ui.create.div(".typechange", config.name, typechanges);
				allButtons.push(button);
				let originalClick = config.click;
				button.onclick = function () {
					allButtons.forEach(btn => {
						btn.classList.remove("typechangelight");
					});
					this.classList.add("typechangelight");
					while (rightbg.firstChild) {
						rightbg.removeChild(rightbg.firstChild);
					}
					if (originalClick) originalClick.call(this);
				};
			}
			typechange.quick.click();
			if (allButtons.length > 0) allButtons[0].classList.add("typechangelight");
		}
		function setupInputHandler(dazi, shuru, rightbg, container) {
			dazi.addEventListener("click", function (event) {
				event.stopPropagation();
				if (!shuru) {
					shuru = document.createElement("input");
					shuru.type = "text";
					shuru.placeholder = "请输入要说的话";
					Object.assign(shuru.style, CONSTANTS.STYLES.INPUT);
					ui.window.appendChild(shuru);
				}
				shuru.style.display = "block";
				shuru.focus();
			});
			ui.window.addEventListener("click", function (event) {
				if (shuru && shuru.style.display === "block") {
					if (!shuru.contains(event.target) && event.target !== dazi) {
						shuru.style.display = "none";
					}
				}
			});
			document.addEventListener("keydown", function (event) {
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
		function createSortCardFunction() {
			if (!game.me || game.me.hasSkillTag("noSortCard")) return;
			const cards = game.me.getCards("hs");
			const sort2 = function (b, a) {
				if (a.name !== b.name) return lib.sort.card(a.name, b.name);
				else if (a.suit !== b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
				else return a.number - b.number;
			};
			if (cards.length > 1) {
				cards.sort(sort2);
				cards.forEach(function (i, j) {
					game.me.node.handcards1.insertBefore(cards[j], game.me.node.handcards1.firstChild);
				});
				dui.queueNextFrameTick(dui.layoutHand, dui);
			}
		}
		// 创建按钮容器
		ui.anniubuttons = ui.create.div(lib.config["extension_十周年UI_rightLayout"] === "on" ? ".leftbuttons" : ".rightbuttons", ui.window);
		// 创建按钮
		for (let [buttonName, config] of Object.entries(buttonConfigs)) {
			let button = ui.create.div(".anniubutton", ui.anniubuttons);
			button.setBackgroundImage(config.imageBg);
			if (config.click) button.onclick = config.click;
		}
	}
	function createPolie() {
		//右上角计时器
		const createTimeNode = () => {
			if (ui.cardRoundTimeNode) {
				ui.cardRoundTimeNode.remove();
			}
			ui.cardRoundTimeNode = ui.create.div(".cardRoundNumber", ui.window);
			const cardPileNumberNode = ui.create.div(".cardPileNumber", ui.cardRoundTimeNode);
			const roundNumberNode = ui.create.div(".roundNumber", ui.cardRoundTimeNode);
			ui.timeNode = ui.create.div(".time", ui.cardRoundTimeNode);
			return { cardPileNumberNode, roundNumberNode };
		};
		const setupConfig = () => {
			lib.config.show_time3 = false;
			lib.config.show_time2 = false;
			lib.config.show_cardpile_number = false;
		};
		const setupRoundNumberUpdate = roundNumberNode => {
			game.updateRoundNum = function () {
				const roundNumber = Math.max(1, game.roundNumber || 1);
				roundNumberNode.innerHTML = `<span>第${get.cnNumber(roundNumber, true)}轮</span>`;
				ui.cardRoundTimeNode.style.display = "block";
			};
		};
		const setupCardNumberUpdate = cardPileNumberNode => {
			game.updateCardNum = function (num, step) {
				const item = cardPileNumberNode;
				clearTimeout(item.interval);
				if (!item._num) {
					item.innerHTML = `<span style="font-size: 16px;">${num}</span>`;
					item._num = num;
				} else {
					if (item._num !== num) {
						if (!step) step = 500 / Math.abs(item._num - num);
						if (item._num > num) item._num--;
						else item._num++;
						item.innerHTML = `<span style="font-size: 16px;">${item._num}</span>`;
						if (item._num !== num) {
							item.interval = setTimeout(function () {
								game.updateCardNum(num, step);
							}, step);
						}
					}
				}
			};
		};
		const setupTimeUpdate = () => {
			function updateTime() {
				if (!ui.timeNode.starttime) ui.timeNode.starttime = get.utc();
				const num = Math.round((get.utc() - ui.timeNode.starttime) / 1000);
				const timeString = Utils.formatTime(num);
				ui.timeNode.innerHTML = `<span><center>${timeString}</span>`;
			}
			updateTime();
			setInterval(updateTime, 1000);
		};
		const setupRoundNumberOverride = () => {
			const originupdateRoundNumber = game.updateRoundNumber;
			game.updateRoundNumber = function () {
				originupdateRoundNumber.apply(this, arguments);
				const cardNumber = ui.cardPile.childNodes.length || 0;
				game.broadcastAll(function (cardNumber) {
					if (game.updateCardNum) game.updateCardNum(cardNumber);
					if (game.updateRoundNum) game.updateRoundNum();
				}, cardNumber);
			};
		};
		const hideOriginalElements = () => {
			setTimeout(function () {
				// 隐藏本体左上角时间
				document.querySelectorAll(".touchinfo.left, .time").forEach(function (node) {
					if (!ui.cardRoundTimeNode || !ui.cardRoundTimeNode.contains(node)) {
						node.style.display = "none";
					}
				});
				// 隐藏本体右上角牌堆数
				document.querySelectorAll(".touchinfo.right").forEach(function (node) {
					if (!ui.cardRoundTimeNode || !ui.cardRoundTimeNode.contains(node)) {
						node.style.display = "none";
					}
				});
				// 隐藏本体的 .cardPileNumber（只隐藏不是你自己UI里的）
				document.querySelectorAll(".cardPileNumber").forEach(function (node) {
					if (!ui.cardRoundTimeNode || !ui.cardRoundTimeNode.contains(node)) {
						node.style.display = "none";
					}
				});
			}, 1000);
		};
		// 初始化
		const { cardPileNumberNode, roundNumberNode } = createTimeNode();
		setupConfig();
		setupRoundNumberUpdate(roundNumberNode);
		setupCardNumberUpdate(cardPileNumberNode);
		setupTimeUpdate();
		setupRoundNumberOverride();
		hideOriginalElements();
		if (game.updateCardNum) game.updateCardNum(0);
		if (game.updateRoundNum) game.updateRoundNum();
	}
	lib.arenaReady.push(function () {
		shenfenrenwu(); //身份任务按钮
		createcaidan(); //右上角菜单按钮
		xiaopeijian(); //左下角小配件
		createPolie(); //右上角牌堆数，计时器等配件
	});
	// 比较工具函数
	const CompareUtils = {
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
	};
	// 创建工具函数
	const CreateUtils = {
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
			confirm.custom = ClickUtils.confirm;
			app.reWriteFunction(confirm, {
				close: [
					function () {
						this.classList.add("closing");
					},
				],
			});
			this.setupConfirmEventListeners(confirm);
			this.setupSkills2(confirm);
			confirm.update = this.createUpdateFunction(confirm);
			return confirm;
		},
		setupConfirmEventListeners(confirm) {
			for (const k in confirm.node) {
				confirm.node[k].classList.add("disabled");
				confirm.node[k].removeEventListener(lib.config.touchscreen ? "touchend" : "click", ui.click.control);
				confirm.node[k].addEventListener(lib.config.touchscreen ? "touchend" : "click", function (e) {
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
		},
		setupSkills2(confirm) {
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
					if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
				}
			}
		},
		createUpdateFunction(confirm) {
			return function () {
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
				if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
			};
		},
	};
	// 点击工具函数
	const ClickUtils = {
		confirm(link, target) {
			if (link === "ok") {
				ui.click.ok(target);
			} else if (link === "cancel") {
				ui.click.cancel(target);
			} else if (target.custom) {
				target.custom(link);
			}
		},
	};
	const plugin = {
		name: "lbtn",
		filter() {
			return !["chess", "tafang"].includes(get.mode());
		},
		content(next) {
			lib.skill._uicardupdate = {
				trigger: {
					player: "phaseJieshuBegin",
				},
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
					if (ui.updateSkillControl) ui.updateSkillControl(game.me, true);
				},
			};
		},
		precontent() {
			app.reWriteFunction(ui.create, {
				me: [
					function () {
						plugin.create.control();
					},
					null,
				],
			});
			app.reWriteFunction(lib.configMenu.appearence.config, {
				update: [
					null,
					function (res, config, map) {
						map.control_style.hide();
						map.custom_button.hide();
						map.custom_button_system_top.hide();
						map.custom_button_system_bottom.hide();
						map.custom_button_control_top.hide();
						map.custom_button_control_bottom.hide();
						map.radius_size.hide();
					},
				],
			});
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
		},
		create: CreateUtils,
		click: ClickUtils,
		compare: CompareUtils,
	};
	lib.translate.zhong = "忠";
	lib.translate.nei = "内";
	return plugin;
});
