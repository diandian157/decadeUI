/**
 * @fileoverview 宝宝杀风格角色弹窗
 * 特点：VIP系统、官阶、简化布局、可爱风格
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { createBaseCharacterPlugin } from "./base.js";

export function createBabyCharacterPlugin(lib, game, ui, get, ai, _status, app) {
	const base = createBaseCharacterPlugin(lib, game, ui, get, ai, _status, app);

	const IMAGE_PATH = "extension/十周年UI/ui/assets/character/baby/";
	const AUDIO_PATH = "../extension/十周年UI/ui/assets/lbtn/shousha/caidan.mp3";

	// 官阶翻译
	const GUANJIE_TRANSLATION = {
		1: ["骁卒", ["步卒", "伍长", "什长", "队率", "屯长", "部曲"]],
		2: ["校尉", ["县尉", "都尉", "步兵校尉", "典军校尉"]],
		3: ["郎将", ["骑郎将", "车郎将", "羽林中郎将", "虎贲中郎将"]],
		4: ["偏将军", ["折冲将军", "虎威将军", "征虏将军", "荡寇将军"]],
		5: ["将军", ["监军将军", "抚军将军", "典军将军", "领军将军"]],
		6: ["上将军", ["后将军", "左将军", "右将军", "前将军"]],
		7: ["国护军", ["护军", "左护军", "右护军", "中护军"]],
		8: ["国都护", ["都护", "左都护", "右都护", "中都护"]],
		9: ["大将军", ["大将军"]],
	};

	return {
		...base,
		skinName: "baby",

		// 获取边框背景
		getBabyBackgroundImage(group) {
			if (!this.validGroups.includes(group)) group = "default";
			return `${IMAGE_PATH}baby_${group}.png`;
		},

		// 获取势力背景
		getBabysBackgroundImage(group) {
			if (!this.validGroups.includes(group)) group = "default";
			return `${IMAGE_PATH}babys_${group}.png`;
		},

		// 获取稀有度图片
		getRarityImageUrl(name) {
			let rarity = game.getRarity(name) || "junk";
			if (lib.config["extension_千幻聆音_enable"] && typeof game.qhly_getSkinLevel === "function") {
				rarity = this.utils.getQhlyLevel(name);
			}
			return `${IMAGE_PATH}../pe_${rarity}.png`;
		},

		// 初始化玩家属性
		initPlayerProperties(player) {
			if (!player.guanjiejibie) player.guanjiejibie = Math.floor(Math.random() * 9 + 1);
			if (!player.dengji) player.dengji = [Math.floor(Math.random() * 21) + 180, 200, 200].randomGet();
			if (!player.xvipjibie) player.xvipjibie = Math.floor(Math.random() * 8 + 1);
			if (!player.xingxiangIndex) player.xingxiangIndex = Math.floor(Math.random() * 6);
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
				container.style.backgroundColor = "RGBA(0, 0, 0, 0.85)";

				const dialog = ui.create.div(".baby-character-dialog.popped", container);
				const blackBg1 = ui.create.div(".blackBg.one", dialog);
				const blackBg2 = ui.create.div(".blackBg.two", dialog);
				ui.create.div(".basicInfo", blackBg1);
				const rightPane = ui.create.div(".right", blackBg2);

				container.show = player => {
					let name = player.name1 || player.name;
					let name2 = player.name2;
					if (player.classList.contains("unseen") && player !== game.me) name = "unknown";
					if (player.classList.contains("unseen2") && player !== game.me) name2 = "unknown";

					// 初始化玩家属性
					plugin.initPlayerProperties(player);

					// 武将边框
					const biankuang = lib.config.extension_十周年UI_ZLLT === true ? ui.create.div(".biankuang", blackBg1) : ui.create.div(".biankuang2", blackBg1);
					const leftPane = lib.config.extension_十周年UI_ZLLT === true ? ui.create.div(".left", biankuang) : ui.create.div(".left2", biankuang);
					leftPane.style.backgroundImage = player.node.avatar.style.backgroundImage;

					// 装饰元素
					const biankuang3 = ui.create.div(".biankuang3", blackBg1);
					biankuang3.setBackgroundImage(plugin.getBabyBackgroundImage(player.group));

					const biankuang4 = ui.create.div(".biankuang4", blackBg1);
					biankuang4.setBackgroundImage(plugin.getBabysBackgroundImage(player.group));

					// 势力判断
					let group = player.group;
					if (!plugin.validGroups.includes(group)) group = "default";

					// 武将名
					const nametext = plugin.utils.getCharacterNameText(name, name2);
					const namestyle = ui.create.div(".name", nametext, dialog);
					namestyle.dataset.camp = group;
					if (name && name2) {
						namestyle.style.fontSize = "20px";
						namestyle.style.letterSpacing = "1px";
					}

					// 等阶
					const pe = ui.create.div(".pe1", dialog);
					pe.style.backgroundImage = `url("${plugin.getRarityImageUrl(name)}")`;

					// 玩家信息框
					const wjxin = ui.create.div(".wjxin", biankuang4);
					wjxin.setBackgroundImage(`${IMAGE_PATH}geren.png`);

					// 三国秀及名称
					const minixingxiang = ui.create.div(".minixingxiang", wjxin);

					// VIP框
					const xvip = ui.create.div(".minikuang", minixingxiang);
					xvip.setBackgroundImage(`${IMAGE_PATH}vip${player.xvipjibie}.png`);

					const xvipName = ui.create.div(".viptp", xvip);
					xvipName.setBackgroundImage(`${IMAGE_PATH}level${player.xvipjibie}.png`);

					ui.create.div(".nameX", player.nickname, minixingxiang);
					ui.create.div(".dengjiX", String(player.dengji), minixingxiang);

					minixingxiang.setBackgroundImage(`${IMAGE_PATH}xingxiang${player.xingxiangIndex}.png`);

					// 官阶信息
					const guanjie = ui.create.div(".guanjie", biankuang4);
					guanjie.setBackgroundImage(`${IMAGE_PATH}vip_icon_${player.guanjiejibie}.png`);

					ui.create.div(".guanjiewenzi", `<center>${GUANJIE_TRANSLATION[player.guanjiejibie][0]}`, biankuang4);
					ui.create.div(".guanjiewenziX", `<center>${GUANJIE_TRANSLATION[player.guanjiejibie][1][0]}`, biankuang4);

					// 星星
					const rarity = game.getRarity(name) || "junk";
					const xingxing = ui.create.div(".xingxing", biankuang4);
					xingxing.setBackgroundImage(`${IMAGE_PATH}${rarity}.png`);

					// 性别
					const sex = lib.character[player.name]?.sex || "male";
					const xingbie = ui.create.div(".xingbie", biankuang4);
					xingbie.setBackgroundImage(`${IMAGE_PATH}${sex}.png`);

					// 官阶气泡框
					const duihuak = ui.create.div(".duihuak", biankuang4);
					duihuak.setBackgroundImage(`${IMAGE_PATH}seatinfo.png`);

					// 分包
					ui.create.div(".pack", plugin.utils.getPack(name), biankuang4);

					// 关闭按钮
					const diaozhui = ui.create.div(".diaozhui", biankuang4);
					diaozhui.setBackgroundImage(`${IMAGE_PATH}basebtn.png`);
					diaozhui.style.cursor = "pointer";
					diaozhui.style.pointerEvents = "auto";
					diaozhui.style.zIndex = "1000";
					diaozhui.addEventListener("click", ev => {
						ev.stopPropagation();
						game.playAudio(AUDIO_PATH);
						container.hide();
						game.resume2();
					});

					// 技能信息
					dialog.classList.add("single");
					plugin.createSkillList(rightPane, player, container);

					container.classList.remove("hidden");
					game.pause2();
				};

				plugin.playerDialog = container;
				container.show(player);
			},
		},
	};
}
