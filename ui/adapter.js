/**
 * 旧代码适配器
 * 用于将模块化代码适配到原有的app.import机制
 *
 * 使用方式：
 * 在原有的main*.js中，可以这样使用：
 *
 * import { createCharacterAdapter } from '../ui/adapter.js';
 * app.import(createCharacterAdapter());
 */

import { CONSTANTS, NICKNAMES, TITLES, GUANJIE, DUANWEI, VIP_TYPES } from "./constants.js";
import { Utils, generateRandomData, getGroupBackgroundImage, createStars, createLeftPane, calculateWinRate, numberToImages, createCharButton } from "./utils.js";
import { EnhancedInfoManager } from "./character/EnhancedInfoManager.js";

// Character插件适配器
export function createCharacterAdapter(skinConfig = {}) {
	return (lib, game, ui, get, ai, _status, app) => {
		// 获取势力背景图片
		function getName2BackgroundImage(group) {
			return getGroupBackgroundImage(group, skinConfig.imagePath);
		}

		const plugin = {
			name: "character",
			getName2BackgroundImage,

			filter: () => !["chess", "tafang"].includes(get.mode()),

			content(next) {},

			precontent() {
				app.reWriteFunction(lib, {
					setIntro: [
						function (args, node) {
							if (get.itemtype(node) !== "player") return;

							if (lib.config.touchscreen) {
								lib.setLongPress(node, plugin.click.playerIntro);
							} else if (lib.config.right_info) {
								node.oncontextmenu = function (e) {
									e?.preventDefault();
									e?.stopPropagation();
									plugin.click.playerIntro.call(this, e);
									return false;
								};
							}
							return node;
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
						const dialog = ui.create.div(".guessDialog", player);
						ui.create.div(dialog);
						lib.setScroll(dialog);
						player.node.guessDialog = dialog;
					}
				},

				playerIntro(e) {
					e?.preventDefault();
					e?.stopPropagation();

					if (plugin.playerDialog) {
						return plugin.playerDialog.show(this);
					}

					const container = ui.create.div(".popup-container.hidden", ui.window, e => {
						if (e.target === container) {
							container.hide();
							game.resume2();
						}
					});

					container.show = function (player) {
						const randomData = generateRandomData(player);
						const dialog = ui.create.div(".character-dialog.popped", container);

						// 创建基础布局
						const blackBg1 = ui.create.div(".blackBg.one", dialog);
						const blackBg2 = ui.create.div(".blackBg.two", dialog);
						const basicInfo = ui.create.div(".basicInfo", blackBg1);

						// 官阶
						const prefix = CONSTANTS.IMAGE_PATH_PREFIX;
						const officalbg = ui.create.div(".offical-bg", blackBg1);
						const officalIcon = ui.create.div(".offical-icon", officalbg);
						const isMe = player === game.me;
						const level = isMe ? 11 : randomData.guanjieLevel;
						const text = isMe ? "大元帅" : GUANJIE[level];

						officalIcon.setBackgroundImage(`${prefix}offical_icon_${level}.png`);
						ui.create.div(".offical-text", `<center>${text}`, officalbg);

						// 战绩
						const fightbg = ui.create.div(".fight-bg", blackBg1);
						const rightPane = ui.create.div(".right", blackBg2);
						const mingcheng = ui.create.div(".mingcheng", basicInfo);
						const dengji = ui.create.div(".dengji", basicInfo);

						// 胜率/逃率
						const winRate = isMe ? calculateWinRate().toFixed(2) : Utils.getRandomPercentage();
						const runRate = isMe ? "0.00" : Utils.getRandomPercentage();

						const shenglv = ui.create.div(".shenglv", fightbg);
						const taolv = ui.create.div(".shenglv", fightbg);
						shenglv.innerHTML = `<span>胜&nbsp;率：</span><div style="margin-top:-30px;margin-left:60px;display:flex;align-items:flex-start;">${numberToImages(winRate)}</div>`;
						taolv.innerHTML = `<span>逃&nbsp;率：</span><div style="margin-top:-30px;margin-left:60px;display:flex;align-items:flex-start;">${numberToImages(runRate)}</div>`;

						// 查看名片
						const viewCard = ui.create.div(".viewBusinessCard", "查看名片", blackBg1);
						viewCard.onclick = () => {
							container.hide();
							game.resume2();
							const manager = new EnhancedInfoManager();
							const popup = manager.createEnhancedDetailPopup(player, randomData);
							document.body.appendChild(popup);
							popup.style.display = "block";
							popup.addEventListener("click", e => {
								if (e.target === popup) {
									popup.style.display = "none";
									game.resume2();
								}
							});
						};

						// 武将卡片
						const createPane = parent => {
							const skin = lib.config["extension_十周年UI_outcropSkin"];
							const classMap = { shizhounian: ".left3", shousha: ".left2" };
							return ui.create.div(classMap[skin] || ".left", parent);
						};

						const isUnseen = cls => player.classList.contains(cls) && player !== game.me;

						if (!player.name2) {
							let name = player.name1 || player.name;
							if (isUnseen("unseen")) name = "unknown";

							const biankuang = ui.create.div(".biankuang", blackBg2);
							const leftPane = createPane(biankuang);

							if (isUnseen("unseen")) {
								biankuang.setBackgroundImage(getName2BackgroundImage("unknown"));
								leftPane.style.backgroundImage = "url('image/character/hidden_image.jpg')";
							} else {
								biankuang.setBackgroundImage(getName2BackgroundImage(player.group));
								leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;
							}

							createCharButton(name, leftPane);
							const nameDiv = ui.create.div(".biankuangname", biankuang);
							nameDiv.innerHTML = get.slimName(name);

							if (!isUnseen("unseen")) {
								const stars = ui.create.div(".xing", biankuang);
								createStars(stars, game.getRarity(player.name));
							}
						} else {
							rightPane.style.left = "280px";
							rightPane.style.width = "calc(100% - 300px)";

							let name1 = player.name1 || player.name;
							let name2 = player.name2;
							const group1 = lib.character[name1]?.[1];
							const group2 = lib.character[name2]?.[1];

							if (isUnseen("unseen")) name1 = "unknown";
							if (isUnseen("unseen2")) name2 = "unknown";

							const biankuang1 = ui.create.div(".biankuang", blackBg2);
							const biankuang2 = ui.create.div(".biankuang2", blackBg2);
							const leftPane1 = createPane(biankuang1);
							const leftPane2 = createPane(biankuang2);

							if (isUnseen("unseen")) {
								biankuang1.setBackgroundImage(getName2BackgroundImage("unknown"));
								leftPane1.style.backgroundImage = "url('image/character/hidden_image.jpg')";
							} else {
								biankuang1.setBackgroundImage(getName2BackgroundImage(group1));
								leftPane1.style.backgroundImage = player.node.avatar.style.backgroundImage;
							}

							if (isUnseen("unseen2")) {
								biankuang2.setBackgroundImage(getName2BackgroundImage("unknown"));
								leftPane2.style.backgroundImage = "url('image/character/hidden_image.jpg')";
							} else {
								biankuang2.setBackgroundImage(getName2BackgroundImage(group2));
								leftPane2.setBackground(name2, "character");
							}

							createCharButton(name1, leftPane1);
							createCharButton(name2, leftPane2);

							const nameDiv1 = ui.create.div(".biankuangname", biankuang1);
							const nameDiv2 = ui.create.div(".biankuangname2", biankuang2);
							nameDiv1.innerHTML = get.slimName(name1);
							nameDiv2.innerHTML = get.slimName(name2);

							if (!isUnseen("unseen")) {
								const stars1 = ui.create.div(".xing", biankuang1);
								createStars(stars1, game.getRarity(player.name));
							}
							if (!isUnseen("unseen2")) {
								const stars2 = ui.create.div(".xing", biankuang2);
								createStars(stars2, game.getRarity(player.name2));
							}
						}

						mingcheng.innerHTML = player.nickname || (isMe ? lib.config.connect_nickname : get.translation(player.name));
						dengji.innerText = `Lv：${isMe ? 220 : randomData.level}`;

						// 技能列表（简化版，完整版请参考character/plugin.js）
						rightPane.innerHTML = "<div></div>";
						lib.setScroll(rightPane.firstChild);

						dialog.classList.add("single");
						container.classList.remove("hidden");
						game.pause2();
					};

					plugin.characterDialog = container;
					container.show(this);
				},
			},
		};

		return plugin;
	};
}

// 导出常量和工具供外部使用
export { CONSTANTS, Utils, EnhancedInfoManager };
