app.import((lib, game, ui, get, ai, _status, app) => {
	const extensionPath = `${lib.assetURL}extension/十周年UI/shoushaUI/`;

	// 获取势力背景图片路径接口
	function getGroupBackgroundImage(group) {
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key", "Han", "qin"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `${extensionPath}character/images/xinsha/yemian.png`;
	}

	// 获取龙框背景图片路径接口
	function getLongkuangBackgroundImage(group) {
		const validGroups = ["wei", "shu", "wu", "qun", "ye", "jin", "daqin", "western", "shen", "key", "Han", "qin"];
		if (!validGroups.includes(group)) {
			group = "default";
		}
		return `extension/十周年UI/shoushaUI/character/images/xinsha/${group}.png`;
	}

	const plugin = {
		name: "character",
		// 对话框背景接口，外部可通过覆盖此方法自定义背景逻辑
		getGroupBackgroundImage(group) {
			return getGroupBackgroundImage(group);
		},
		// 龙框背景接口，外部可通过覆盖此方法自定义龙框背景逻辑
		getLongkuangBackgroundImage(group) {
			return getLongkuangBackgroundImage(group);
		},
		filter() {
			return !["chess", "tafang", "stone", "connect"].includes(get.mode());
		},
		content(next) {
			app.waitAllFunction(
				[
					next => {
						next();
					},
					next => {
						lib.init.css(`${lib.assetURL}extension/${app.name}/${plugin.name}`, "main2", next);
					},
				],
				next
			);
		},
		precontent() {
			app.reWriteFunction(lib, {
				setIntro: [
					function (args, node) {
						if (get.itemtype(node) === "player") {
							if (lib.config.touchscreen) {
								lib.setLongPress(node, plugin.click.playerIntro);
							} else if (lib.config.right_info) {
								node.oncontextmenu = function (e) {
									if (e && e.preventDefault) e.preventDefault();
									if (e && e.stopPropagation) e.stopPropagation();
									plugin.click.playerIntro.call(this, e);
									return false;
								};
							}
							return node;
						}
					},
				],
			});
		},
		click: {
			identity(e) {
				e.stopPropagation();
				const player = this.parentNode;
				if (!game.getIdentityList) return;
				if (player.node.guessDialog) {
					player.node.guessDialog.classList.toggle("hidden");
				} else {
					const list = game.getIdentityList(player);
					if (!list) return;
					const guessDialog = ui.create.div(".guessDialog", player);
					const container = ui.create.div(guessDialog);
					lib.setScroll(guessDialog);
					player.node.guessDialog = guessDialog;
				}
			},
			playerIntro(e) {
				if (e && e.preventDefault) e.preventDefault();
				if (e && e.stopPropagation) e.stopPropagation();
				if (plugin.playerDialog) {
					return plugin.playerDialog.show(this);
				}
				const container = ui.create.div(".popup-container.hidden", ui.window, e => {
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});
				const player = this;
				const playname = player === game.me ? lib.config.connect_nickname : get.translation(["缘之空", "小小恐龙", "自然萌", "海边的ebao", "小云云", "无语", "点点", "猫猫虫", "小爱莉", "冰佬", "鹿鹿", "黎佬", "小曦", "墨渊", "浮牢师", "U佬", "蓝宝", "影宝", "柳下跖", "k9", "扶苏", "皇叔"].randomGet(1));
				// 创建对话框结构
				const dialog = ui.create.div(".character-dialog.popped", container);
				const leftPane = ui.create.div(".left", dialog);
				const rightPane = ui.create.div(".right", dialog);
				const xing = ui.create.div(".xing", dialog);
				const biankuangname = ui.create.div(".biankuangname", dialog);
				const mingcheng = ui.create.div(".mingcheng", dialog);
				const dengji = ui.create.div(".dengji", dialog);
				// 技能按钮
				const skill = ui.create.div(".skillx", dialog);
				skill.addEventListener("click", event => {
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
					clearRightPane();
					container.show(player, true);
					if (equip) equip.classList.remove("active");
					if (skill) skill.classList.add("active");
				});
				// 装备按钮
				const equip = ui.create.div(".equip", dialog);
				equip.addEventListener("click", event => {
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
					clearRightPane();
					if (skill) skill.classList.remove("active");
					if (equip) equip.classList.add("active");
					container.show(player);
				});
				// 清空右侧面板
				function clearRightPane() {
					if (rightPane.firstChild) {
						while (rightPane.firstChild.firstChild) {
							rightPane.firstChild.removeChild(rightPane.firstChild.firstChild);
						}
					}
				}
				// 创建资料页面
				const createProfilePage = () => {
					const zbdialog = ui.create.div(".zbdialog", dialog);
					const caizhu = ui.create.div(".caizhu", dialog);
					const shanchang = get.config("recentCharacter");
					const leftPane = ui.create.div(lib.config.extension_十周年UI_ZLLT ? ".left" : ".left2", dialog);
					leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
					// 装备对话框
					zbdialog.onclick = () => {
						const popuperContainer = ui.create.div(
							".popup-container",
							{
								background: "rgb(0,0,0,0)",
							},
							ui.window
						);
						game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
						const zbbigdialog = ui.create.div(".zbbigdialog", popuperContainer);
						const guanbi = ui.create.div(".guanbi", popuperContainer, get.translation("   "));
						guanbi.addEventListener("click", event => {
							game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
							popuperContainer.delete(200);
							event.stopPropagation();
						});
					};
					// 资料对话框
					caizhu.onclick = () => {
						const popuperContainer = ui.create.div(
							".popup-container",
							{
								background: "rgb(0,0,0,0)",
							},
							ui.window
						);
						game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/label.mp3");
						const bigdialog = ui.create.div(".bigdialog", popuperContainer);
						const useless = ui.create.div(".useless", bigdialog);
						const nameshutiao = ui.create.div(".nameshutiao", bigdialog);
						const rarity = game.getRarity(player.name) || "junk";
						nameshutiao.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${rarity}.png`);
						const useless2 = ui.create.div(".useless2", bigdialog);
						useless2.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/xinsha/InfoBg2.png");
						// 皮肤框
						const pifuk = ui.create.div(".pifuk", bigdialog);
						pifuk.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/xinsha/pifuk.png");
						// 皮肤名
						const pos1 = player.node.avatar.style.backgroundImage.lastIndexOf("/");
						const pos2 = player.node.avatar.style.backgroundImage.lastIndexOf("\\");
						const pos = Math.max(pos1, pos2);
						const skinname = pos < 0 ? player.node.avatar.style.backgroundImage : player.node.avatar.style.backgroundImage.substring(pos + 1).substring(0, player.node.avatar.style.backgroundImage.substring(pos + 1).lastIndexOf("."));
						const pfzwm = skinname === player["name"] || skinname === player["name"] + "_shadow" || skinname === player["name"] + "2" || skinname === player["name"] + "3" || skinname === "default_silhouette_male" || skinname === "default_silhouette_female" || skinname === "default_silhouette_double" ? "经典形象" : skinname;
						const pifuming = ui.create.div(".pifuming", bigdialog, get.translation(pfzwm));
						// 武将名
						const wujiangming = ui.create.div(".wujiangming", bigdialog, get.translation(player["name"]));
						// 玩家名
						const wanjiaming = ui.create.div(".wanjiaming", bigdialog, playname);
						// VIP图标
						const vipimg = document.createElement("div");
						vipimg.id = "vip-img";
						vipimg.style.cssText = `
							width:60px;
							top:2px;
							height:20px;
							left:3px;
							position:relative;
							background-size: 100% 100%;
						`;
						const viptuji = ["vip0", "vip1", "vip2", "vip3", "vip4", "vip5", "vip6", "vip7"];
						const vipPath = player._vipCache || (player._vipCache = viptuji.randomGet());
						vipimg.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${vipPath}.png`);
						wanjiaming.appendChild(vipimg);
						// 公会信息
						const gonghui = ui.create.div(
							".gonghui",
							bigdialog,
							get.translation(
								"公会：" +
									(
										player._guildInfo ||
										(player._guildInfo = {
											name: ["武将美化群", "活动武将群", "😋精致小杀", "萌新花园", "😋精致小酒", "小爱莉の动物园", "Ciallo～(∠・ω< )⌒★", "美图交流群", "无名杀主题样式", "💎备用💎", "无名杀琉璃版", "圣杯战争"].randomGet(1),
											icon: ["c1", "c2", "c3"].randomGet(),
										})
									).name
							)
						);
						const gonghuiimg = document.createElement("div");
						gonghuiimg.id = "gonghui-img";
						gonghuiimg.style.cssText = `
							width:40px;
							top:2px;
							height:15px;
							left:20px;
							position:relative;
							background-size: 100% 100%;
						`;
						gonghuiimg.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player._guildInfo.icon}.png`);
						gonghui.appendChild(gonghuiimg);
						// 玩家数据
						if (!player.profileData) {
							player.profileData = {
								xinyu: Math.floor(Math.random() * (999 - 99 + 1)) + 99,
								meili: Math.floor(Math.random() * (999 - 99 + 1)) + 99,
								shouhu: Math.floor(Math.random() * (999 - 999 + 1)) + 999,
								wujiang1: Math.floor(Math.random() * (999 - 1 + 1)) + 1000,
								pifu1: Math.floor(Math.random() * (999 - 1 + 1)) + 3000,
								jiangling: Math.floor(Math.random() * (99 - 10 + 1)) + 10,
							};
						}
						// 创建数据组件
						const xinyu = ui.create.div(".xinyu", bigdialog, get.translation(`${player.profileData.xinyu}<br>信誉`));
						const meili = ui.create.div(".meili", bigdialog, get.translation(`${player.profileData.meili}<br>魅力`));
						const shouhu = ui.create.div(".shouhu", bigdialog, get.translation(`${player.profileData.shouhu}<br>守护`));
						const wujiang1 = ui.create.div(".wujiang1", bigdialog, get.translation(`${player.profileData.wujiang1}<br>武将`));
						const pifu1 = ui.create.div(".pifu1", bigdialog, get.translation(`${player.profileData.pifu1}<br>皮肤`));
						const jiangling = ui.create.div(".jiangling", bigdialog, get.translation(`${player.profileData.jiangling}<br>将灵`));
						const changyongwujiang = ui.create.div(".changyongwujiang", bigdialog, get.translation("武将展示"));
						// 称号
						const minichenghao = ui.create.div(".minichenghao", bigdialog);
						const chenghaotu = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "ch8", "ch9", "ch10", "ch11", "ch12", "ch13", "ch14", "ch15", "ch16", "ch17", "ch18", "ch19", "ch20", "ch21", "ch22", "ch23", "ch24", "ch25", "ch26"];
						if (!player.chenghaoData) {
							player.chenghaoData = {
								img: chenghaotu.randomGet(),
							};
						}
						minichenghao.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player.chenghaoData.img}.png`);
						// 拜师
						const baishi = ui.create.div(".baishi", bigdialog);
						const baishitu = ["b1", "b2", "b3"];
						if (!player.baishiData) {
							player.baishiData = {
								img: baishitu.randomGet(),
							};
						}
						baishi.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player.baishiData.img}.png`);
						// 历史最高
						const wngs = ui.create.div(".wngs", bigdialog);
						const wngstu = ["s1", "s2", "s3", "s4", "s5", "s6"];
						if (!player.historyData) {
							player.historyData = {
								img: wngstu.randomGet(),
							};
						}
						wngs.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player.historyData.img}.png`);
						// 将灯
						const deng = ui.create.div(".deng", bigdialog);
						const dengto = ["d1", "d2", "d3", "d4", "d5", "d6", "d7"];
						if (!player.lampData) {
							player.lampData = {
								img: dengto.randomGet(),
							};
						}
						deng.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player.lampData.img}.png`);
						// 关闭按钮
						const haoyou3 = ui.create.div(".haoyou3", bigdialog, get.translation("   "));
						haoyou3.addEventListener("click", event => {
							game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
							popuperContainer.delete(200);
							event.stopPropagation();
						});
						const shanchang4 = ui.create.div(".shanchang4", bigdialog);
						shanchang4.style.backgroundImage = player.node.avatar.style.backgroundImage;
						// 迷你头像
						const minixingxiang = ui.create.div(".minixingxiang", bigdialog);
						const xingxiangtu = ["xingxiang0", "xingxiang1", "xingxiang2", "xingxiang3", "xingxiang4", "xingxiang5"];
						if (!player.miniXingxiangData) {
							player.miniXingxiangData = {
								img: xingxiangtu.randomGet(),
							};
						}
						minixingxiang.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player.miniXingxiangData.img}.png`);
					};
				};
				// 设置背景
				const group = player.group;
				const bgImagePath = plugin.getGroupBackgroundImage(group);
				dialog.style.backgroundImage = `url("${bgImagePath}")`;
				// 创建皮肤区域
				const skin1 = ui.create.div(".skin1", dialog);
				const skin2 = ui.create.div(".skin2", dialog);
				// 获取武将名称
				let name = player.name1 || player.name;
				let name2 = player.name2;
				if (player.classList.contains("unseen") && player !== game.me) {
					name = "unknown";
				}
				if (player.classList.contains("unseen2") && player !== game.me) {
					name2 = "unknown";
				}
				// 设置主将立绘
				if (name !== "unknown") {
					let playerSkin = player.style.backgroundImage;
					if (!playerSkin) playerSkin = player.childNodes[0]?.style.backgroundImage;
					let originalPath = "";
					if (playerSkin?.indexOf('url("') === 0) {
						originalPath = playerSkin.slice(5, playerSkin.indexOf('")'));
					} else if (playerSkin?.indexOf("url('") === 0) {
						originalPath = playerSkin.slice(5, playerSkin.indexOf("')"));
					}
					// 先尝试lihui路径
					if (originalPath) {
						const lihuiPath = originalPath.replace(/image\/character/, "image/lihui");
						const testImg = new Image();
						testImg.onerror = () => {
							// lihui路径不存在，使用原始路径
							skin1.style.backgroundImage = playerSkin;
						};
						testImg.onload = () => {
							// lihui路径存在，使用lihui路径
							skin1.style.backgroundImage = `url("${lihuiPath}")`;
						};
						testImg.src = lihuiPath;
					} else {
						skin1.style.backgroundImage = playerSkin;
					}
				} else {
					const unknownUrl = `${extensionPath}character/images/unknown.png`;
					skin1.style.backgroundImage = `url("${unknownUrl}")`;
				}
				// 设置副将立绘
				if (name2) {
					if (name2 !== "unknown") {
						const playerSkin2 = player.childNodes[1]?.style.backgroundImage;
						let originalPath = "";
						if (playerSkin2?.indexOf('url("') === 0) {
							originalPath = playerSkin2.slice(5, playerSkin2.indexOf('")'));
						} else if (playerSkin2?.indexOf("url('") === 0) {
							originalPath = playerSkin2.slice(5, playerSkin2.indexOf("')"));
						}
						// 先尝试lihui路径
						if (originalPath) {
							const lihuiPath = originalPath.replace(/image\/character/, "image/lihui");
							const testImg = new Image();
							testImg.onerror = () => {
								// lihui路径不存在，使用原始路径
								skin2.style.backgroundImage = playerSkin2;
							};
							testImg.onload = () => {
								// lihui路径存在，使用lihui路径
								skin2.style.backgroundImage = `url("${lihuiPath}")`;
							};
							testImg.src = lihuiPath;
						} else {
							skin2.style.backgroundImage = playerSkin2;
						}
					} else {
						const unknownUrl = `${extensionPath}character/images/unknown.png`;
						skin2.style.backgroundImage = `url("${unknownUrl}")`;
					}
				}
				// 设置等阶
				let rarity = game.getRarity(name);
				if (!rarity) rarity = "junk";
				const pe = ui.create.div(".pe1", dialog);
				let peUrl;
				if (lib.config["extension_千幻聆音_enable"] && typeof game.qhly_getSkin === "function" && typeof game.qhly_getSkinInfo === "function") {
					try {
						const level = game.qhly_getSkinLevel(name, game.qhly_getSkin(name), true, false);
						const levelToRarity = {
							xiyou: "rare",
							shishi: "epic",
							chuanshuo: "legend",
							putong: "common",
							dongtai: "legend",
							jueban: "unique",
							xianding: "restrictive",
						};
						const temp = levelToRarity[level] || "junk";
						peUrl = `${extensionPath}character/images/xinsha/pe_${temp}.png`;
					} catch (e) {
						console.error("千幻聆音扩展函数调用出错:", e);
						peUrl = `${extensionPath}character/images/xinsha/pe_${rarity}.png`;
					}
				} else {
					peUrl = `${extensionPath}character/images/xinsha/pe_${rarity}.png`;
				}
				pe.style.backgroundImage = `url("${peUrl}")`;
				// 设置武将名称显示
				let value = "";
				let value2, value3;
				if (lib.config["extension_千幻聆音_enable"] && typeof game.qhly_getSkin === "function" && typeof game.qhly_getSkinInfo === "function") {
					try {
						value2 = game.qhly_getSkinInfo(name, game.qhly_getSkin(name), null).translation || "经典形象";
					} catch (e) {
						console.error("千幻聆音扩展获取皮肤信息出错:", e);
						value2 = "经典形象";
					}
				} else {
					value2 = "经典形象";
				}
				value += `${value2}*${get.translation(name)}`;
				if (name2) {
					value += "<br>";
					if (lib.config["extension_千幻聆音_enable"] && typeof game.qhly_getSkin === "function" && typeof game.qhly_getSkinInfo === "function") {
						try {
							value3 = game.qhly_getSkinInfo(name2, game.qhly_getSkin(name2), null).translation || "经典形象";
						} catch (e) {
							console.error("千幻聆音扩展获取副将皮肤信息出错:", e);
							value3 = "经典形象";
						}
					} else {
						value3 = "经典形象";
					}
					value += `${value3}*${get.translation(name2)}`;
				}
				const pn = ui.create.div(".pn1");
				pe.appendChild(pn);
				// 关闭按钮
				const diaozhui = ui.create.div(".diaozhui", dialog);
				diaozhui.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/xinsha/guanbi.png");
				diaozhui.addEventListener("click", event => {
					game.playAudio("../extension/十周年UI/shoushaUI/lbtn/images/SSCD/caidan.mp3");
					container.hide();
					game.resume2();
				});
				// 龙框
				const longkuang = ui.create.div(".longkuang", dialog);
				const longkuangBgPath = plugin.getLongkuangBackgroundImage(group);
				longkuang.setBackgroundImage(longkuangBgPath);
				// 等级标识
				const level = ui.create.div(".level", dialog);
				const leveltu = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
				if (!player.levelData) {
					player.levelData = {
						img: leveltu.randomGet(),
					};
				}
				level.setBackgroundImage(`extension/十周年UI/shoushaUI/character/images/xinsha/${player.levelData.img}.png`);
				// 技能框
				const wjkuang = ui.create.div(".wjkuang", dialog);
				wjkuang.setBackgroundImage("extension/十周年UI/shoushaUI/character/images/xinsha/jineng.png");
				// 武将技能展示
				const jineng = ui.create.div(".jineng", dialog, get.translation("武将技能"));
				// 武将姓名
				const wjname = ui.create.div(".wjname", dialog, get.translation(player["name"]));
				// 玩家名
				const wanjiaming2 = ui.create.div(".wanjiaming2", dialog, playname);
				leftPane.innerHTML = "<div></div>";
				rightPane.innerHTML = "<div></div>";
				lib.setScroll(rightPane.firstChild);
				// 显示函数
				container.show = (player, bool, under) => {
					if (under) {
						createProfilePage();
					}
					let oSkills = player.getSkills(null, false, false).slice(0);
					oSkills = oSkills.filter(skill => {
						if (!lib.skill[skill] || skill === "jiu") return false;
						if (lib.skill[skill].nopop || lib.skill[skill].equipSkill) return false;
						return lib.translate[skill + "_info"] && lib.translate[skill + "_info"] !== "";
					});
					if (player === game.me && player.hiddenSkills.length) oSkills.addArray(player.hiddenSkills);
					const allShown = player.isUnderControl() || (!game.observe && game.me && game.me.hasSkillTag("viewHandcard", null, player, true));
					const shownHs = player.getShownCards();
					if (bool) {
						if (skill) skill.classList.add("active");
						// 显示武将技能
						if (oSkills.length) {
							oSkills.forEach(name => {
								if (player.forbiddenSkills[name]) {
									if (player.forbiddenSkills[name].length) {
										ui.create.div(".xskill", `<div data-color><span style="opacity:0.5">${lib.translate[name]}</span></div><div><span style="opacity:0.5">（与${get.translation(player.forbiddenSkills[name])}冲突）${get.skillInfoTranslation(name, player, false)}</span></div>`, rightPane.firstChild);
									} else {
										ui.create.div(".xskill", `<div data-color><span style="opacity:0.5">${lib.translate[name]}</span></div><div><span style="opacity:0.5">（双将禁用）${get.skillInfoTranslation(name, player, false)}</span></div>`, rightPane.firstChild);
									}
								} else if (player.hiddenSkills.includes(name)) {
									if (lib.skill[name].preHidden && get.mode() === "guozhan") {
										const id = ui.create.div(".xskill", `<div data-color><span style="opacity:0.5">${lib.translate[name]}</span></div><div><span style="opacity:0.5">${get.skillInfoTranslation(name, player, false)}</span><br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">预亮技能</div></div>`, rightPane.firstChild);
										const underlinenode = id.querySelector(".underlinenode");
										if (_status.prehidden_skills.includes(name)) underlinenode.classList.remove("on");
										underlinenode.link = name;
										underlinenode.listen(ui.click.hiddenskill);
									} else {
										ui.create.div(".xskill", `<div data-color><span style="opacity:0.5">${lib.translate[name]}</span></div><div><span style="opacity:0.5">${get.skillInfoTranslation(name, player, false)}</span></div>`, rightPane.firstChild);
									}
								} else if (!player.getSkills().includes(name) || player.awakenedSkills.includes(name)) {
									ui.create.div(".xskill", `<div data-color><span style="opacity:0.5">${lib.translate[name]}</span></div><div><span style="opacity:0.5">${get.skillInfoTranslation(name, player, false)}</span></div>`, rightPane.firstChild);
								} else if (lib.skill[name].frequent || lib.skill[name].subfrequent) {
									const id = ui.create.div(".xskill", `<div data-color>${lib.translate[name]}</div><div>${get.skillInfoTranslation(name, player, false)}<br><div class="underlinenode on gray" style="position:relative;padding-left:0;padding-top:7px">自动发动</div></div>`, rightPane.firstChild);
									const underlinenode = id.querySelector(".underlinenode");
									if (lib.skill[name].frequent) {
										if (lib.config.autoskilllist.includes(name)) {
											underlinenode.classList.remove("on");
										}
									}
									if (lib.skill[name].subfrequent) {
										for (let j = 0; j < lib.skill[name].subfrequent.length; j++) {
											if (lib.config.autoskilllist.includes(name + "_" + lib.skill[name].subfrequent[j])) {
												underlinenode.classList.remove("on");
											}
										}
									}
									if (lib.config.autoskilllist.includes(name)) underlinenode.classList.remove("on");
									underlinenode.link = name;
									underlinenode.listen(ui.click.autoskill2);
								} else if (lib.skill[name].clickable && player.isIn() && player.isUnderControl(true) && player === game.me) {
									const id = ui.create.div(".xskill", `<div data-color>${lib.translate[name]}</div><div>${get.skillInfoTranslation(name, player, false)}<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div></div>`, rightPane.firstChild);
									const intronode = id.querySelector(".skillbutton");
									if (!_status.gameStarted || (lib.skill[name].clickableFilter && !lib.skill[name].clickableFilter(player))) {
										intronode.classList.add("disabled");
										intronode.style.opacity = 0.5;
									} else {
										intronode.link = player;
										intronode.func = lib.skill[name].clickable;
										intronode.classList.add("pointerdiv");
										intronode.listen(() => {
											container.hide();
											game.resume2();
										});
										intronode.listen(ui.click.skillbutton);
									}
								} else {
									ui.create.div(".xskill", `<div data-color>${lib.translate[name]}</div><div>${get.skillInfoTranslation(name, player, false)}</div>`, rightPane.firstChild);
								}
							});
						}
					} else {
						// 显示装备区域
						const eSkills = player.getVCards("e");
						if (eSkills.length) {
							ui.create.div(".xcaption", "装备区域", rightPane.firstChild);
							eSkills.forEach(card => {
								const cardx = game.createCard(get.name(card, false), get.suit(card, false), get.number(card, false), get.nature(card, false));
								cardx.style.zoom = "0.7";
								rightPane.firstChild.appendChild(cardx);
							});
							eSkills.forEach(card => {
								const str = [get.translation(card), get.translation(card.name + "_info")];
								const cards = card.cards;
								if (cards?.length && (cards?.length !== 1 || cards[0].name !== card.name)) {
									str[0] += `（${get.translation(card.cards)}）`;
								}
								const special = card.cards?.find(item => item.name === card.name && lib.card[item.name]?.cardPrompt);
								if (special) str[1] = lib.card[special.name].cardPrompt(special);
								ui.create.div(".xskillx", `<div data-color>${str[0]}</div><div>${str[1]}</div>`, rightPane.firstChild);
							});
						}
						// 显示手牌区域
						if (shownHs.length) {
							ui.create.div(".xcaption", player.hasCard(card => !shownHs.includes(card), "h") ? "明置的手牌" : "手牌区域", rightPane.firstChild);
							shownHs.forEach(item => {
								const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
								card.style.zoom = "0.6";
								rightPane.firstChild.appendChild(card);
							});
							if (allShown) {
								const hs = player.getCards("h");
								hs.removeArray(shownHs);
								if (hs.length) {
									ui.create.div(".xcaption", "其他手牌", rightPane.firstChild);
									hs.forEach(item => {
										const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
										card.style.zoom = "0.6";
										rightPane.firstChild.appendChild(card);
									});
								}
							}
						} else if (allShown) {
							const hs = player.getCards("h");
							if (hs.length) {
								ui.create.div(".xcaption", "手牌区域", rightPane.firstChild);
								hs.forEach(item => {
									const card = game.createCard(get.name(item, false), get.suit(item, false), get.number(item, false), get.nature(item, false));
									card.style.zoom = "0.6";
									rightPane.firstChild.appendChild(card);
								});
							}
						}
						// 显示判定区域
						const judges = player.getVCards("j");
						if (judges.length) {
							ui.create.div(".xcaption", "判定区域", rightPane.firstChild);
							judges.forEach(card => {
								const cardx = game.createCard(get.name(card, false), get.suit(card, false), get.number(card, false), get.nature(card, false));
								cardx.style.zoom = "0.8";
								rightPane.firstChild.appendChild(cardx);
							});
						}
						if (!shownHs.length && !allShown && !judges.length && !eSkills.length) {
							ui.create.div(".noxcaption", rightPane.firstChild);
						}
					}
					container.classList.remove("hidden");
					game.pause2();
				};
				plugin.characterDialog = container;
				container.show(player, true, true);
			},
		},
	};
	return plugin;
});
