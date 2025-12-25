/**
 * 十周年风格角色弹窗
 * 特点：立绘显示、分包信息、简洁布局、千幻聆音样式支持
 */

import { createBaseCharacterPlugin } from "./base.js";

export function createShizhounianCharacterPlugin(lib, game, ui, get, ai, _status, app) {
	const base = createBaseCharacterPlugin(lib, game, ui, get, ai, _status, app);

	const IMAGE_PATH = "extension/十周年UI/ui/assets/character/shizhounian/";

	return {
		...base,
		skinName: "shizhounian",

		// 获取势力背景图
		getGroupBackgroundImage(group) {
			if (!this.validGroups.includes(group)) group = "default";
			return `${IMAGE_PATH}skt_${group}.png`;
		},

		// 获取等阶图标
		getRarityIcon(rarity) {
			return `${IMAGE_PATH}rarity_${rarity}.png`;
		},

		// 获取等阶背景
		getPeIcon(rarity) {
			return `${IMAGE_PATH}pe_${rarity}.png`;
		},

		click: {
			...base.click,

			playerIntro(e, node) {
				e?.preventDefault();
				e?.stopPropagation();
				const plugin = this;
				const player = node || this;

				// 每次都重新创建对话框
				if (plugin.playerDialog) {
					plugin.playerDialog.remove();
					plugin.playerDialog = null;
				}

				const container = ui.create.div(".popup-container.hidden", ui.window, ev => {
					if (ev.target === container) {
						container.hide();
						game.resume2();
					}
				});

				const dialog = ui.create.div(".shizhounian-character-dialog.popped", container);
				const leftPane = ui.create.div(".left", dialog);
				const rightPane = ui.create.div(".right", dialog);

				// 势力背景
				const group = player.group;
				dialog.style.backgroundImage = `url("${plugin.getGroupBackgroundImage(group)}")`;

				// 立绘
				const skin1 = ui.create.div(".skin1", dialog);
				const skin2 = ui.create.div(".skin2", dialog);

				// 姓名处理
				let name = player.name1 || player.name;
				let name2 = player.name2;
				// 安全检查：确保player有classList属性
				if (player.classList?.contains("unseen") && player !== game.me) name = "unknown";
				if (player.classList?.contains("unseen2") && player !== game.me) name2 = "unknown";

				// 主将立绘
				if (name !== "unknown") {
					const playerSkin = player.style.backgroundImage || player.childNodes[0]?.style.backgroundImage;
					plugin.utils.setLihuiDiv(skin1, playerSkin);
				} else {
					skin1.style.backgroundImage = `url("${IMAGE_PATH}../unknown.png")`;
				}

				// 副将立绘
				if (name2) {
					if (name2 !== "unknown") {
						const playerSkin2 = player.childNodes[1]?.style.backgroundImage;
						plugin.utils.setLihuiDiv(skin2, playerSkin2);
					} else {
						skin2.style.backgroundImage = `url("${IMAGE_PATH}../unknown.png")`;
					}
				}

				// 等阶
				let rarity = game.getRarity(name) || "junk";
				const pe = ui.create.div(".pe1", dialog);
				const peUrl = lib.config["extension_千幻聆音_enable"] ? plugin.getPeIcon(plugin.utils.getQhlyLevel(name)) : plugin.getPeIcon(rarity);
				pe.style.backgroundImage = `url("${peUrl}")`;

				// 样式名
				let value = `${plugin.utils.getQhlySkinTranslation(name)}*${get.translation(name)}`;
				if (name2) {
					value += `<br>${plugin.utils.getQhlySkinTranslation(name2)}*${get.translation(name2)}`;
				}
				const pn = ui.create.div(".pn1", value);
				pe.appendChild(pn);

				// 武将姓名
				const nametext = plugin.utils.getCharacterNameText(name, name2);
				const namestyle = ui.create.div(".name", nametext, dialog);
				namestyle.dataset.camp = group;
				if (name && name2) {
					namestyle.style.fontSize = "18px";
					namestyle.style.letterSpacing = "1px";
				}

				// 等阶图标
				const head = ui.create.node("img");
				head.src = plugin.getRarityIcon(rarity);
				head.style.cssText = "display:inline-block;width:61.6px;height:53.2px;top:-13px;position:absolute;background-color:transparent;z-index:1;margin-left:5px;";
				namestyle.appendChild(head);

				// 分包
				ui.create.div(".pack", plugin.utils.getPack(name), dialog);

				leftPane.innerHTML = "<div></div>";
				rightPane.innerHTML = "<div></div>";
				lib.setScroll(rightPane.firstChild);

				// 技能区
				let oSkills = player.getSkills(null, false, false).slice(0);
				if (player === game.me) oSkills = oSkills.concat(player.hiddenSkills);

				if (oSkills.length) {
					oSkills.forEach(skillName => {
						const translation = lib.translate[skillName];
						if (!translation || !lib.translate[skillName + "_info"]) return;

						const isAwakened = !player.getSkills().includes(skillName) || player.awakenedSkills.includes(skillName);
						let skillContent = `<div data-color>${isAwakened ? '<span style="opacity:0.5">' + translation + "： </span>" : translation + "： "}</div><div>${isAwakened ? '<span style="opacity:0.5;text-indent:10px">' + get.skillInfoTranslation(skillName, player, false) + "</span>" : '<span style="text-indent:10px">' + get.skillInfoTranslation(skillName, player, false) + "</span>"}`;

						if (lib.skill[skillName].clickable && player === game.me) {
							skillContent += '<br><div class="menubutton skillbutton" style="position:relative;margin-top:5px">点击发动</div>';
						}
						skillContent += "</div>";

						const skillDiv = ui.create.div(".xskill", skillContent, rightPane.firstChild);

						if (lib.skill[skillName].clickable && player === game.me) {
							const skillButton = skillDiv.querySelector(".skillbutton");
							if (skillButton) {
								if (!_status.gameStarted || (lib.skill[skillName].clickableFilter && !lib.skill[skillName].clickableFilter(player))) {
									skillButton.classList.add("disabled");
									skillButton.style.opacity = 0.5;
								} else {
									skillButton.link = player;
									skillButton.func = lib.skill[skillName].clickable;
									skillButton.classList.add("pointerdiv");
									skillButton.listen(() => {
										container.hide();
										game.resume2();
									});
									skillButton.listen(ui.click.skillbutton);
								}
							}
						}

						// 自动发动
						if (lib.skill[skillName].frequent || lib.skill[skillName].subfrequent) {
							const underlinenode = ui.create.div(".underlinenode on gray", `【${translation}】自动发动`, rightPane.firstChild);
							underlinenode.style.position = "relative";
							underlinenode.style.paddingLeft = "0";
							underlinenode.style.paddingBottom = "3px";

							if (lib.skill[skillName].frequent && lib.config.autoskilllist.includes(skillName)) {
								underlinenode.classList.remove("on");
							}
							if (lib.skill[skillName].subfrequent) {
								lib.skill[skillName].subfrequent.forEach(sub => {
									if (lib.config.autoskilllist.includes(`${skillName}_${sub}`)) {
										underlinenode.classList.remove("on");
									}
								});
							}
							underlinenode.link = skillName;
							underlinenode.listen(ui.click.autoskill2);
						}
					});
				}

				// 手牌区
				plugin.showHandCards(rightPane.firstChild, player);

				// 装备区
				plugin.showEquipmentArea(rightPane.firstChild, player);

				// 判定区
				plugin.showJudgeArea(rightPane.firstChild, player);

				container.classList.remove("hidden");
				game.pause2();
				plugin.playerDialog = container;
			},
		},
	};
}
