/**
 * 详细资料弹窗管理器
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { CONSTANTS } from "../constants.js";
import { createLeftPane, createStars, getGroupBackgroundImage } from "../utils.js";

export class EnhancedInfoManager {
	constructor() {
		this.playerDialog = null;
	}

	// 创建详细资料弹窗
	createEnhancedDetailPopup(player, randomData) {
		const container = ui.create.div(".popup-container", { background: "rgb(0,0,0,0.8)" }, ui.window);

		// 关闭按钮
		const closeBtn = ui.create.div(".guanbi", container);
		closeBtn.addEventListener("click", () => {
			container.style.display = "none";
			game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/caidan.mp3");
		});

		const dialog = ui.create.div(".bigdialog", container);

		this._createAvatarInfo(dialog, player, randomData);
		this._createRankInfo(dialog, player, randomData);
		this._createDuanweiInfo(dialog, player, randomData);
		this._createSkillInfo(dialog, player, randomData);

		return container;
	}

	// 头像信息
	_createAvatarInfo(dialog, player, randomData) {
		const avatar = ui.create.div(".minixingxiang", dialog);
		const avatarBg = ui.create.div(".minixingxiangdi", dialog);

		// 性别图标
		const gender = ui.create.div(".xingbie", avatarBg);
		const genderIcons = ["pubui_icon_male", "pubui_icon_female"];
		gender.setBackgroundImage(`extension/十周年UI/ui/assets/character/shousha/${genderIcons.randomGet()}.png`);

		// 昵称
		const nickname = player === game.me ? lib.config.connect_nickname : get.translation(CONSTANTS.NICKNAMES.randomGet(1));
		ui.create.div(".nameX", avatar, nickname);

		// 称号
		ui.create.div(".wanjiachenghao", dialog, get.translation(CONSTANTS.TITLES.randomGet(1)));

		// 头像背景
		avatar.setBackgroundImage(`extension/十周年UI/ui/assets/character/shousha/xingxiang${Math.floor(Math.random() * 6)}.png`);
	}

	// 官阶信息
	_createRankInfo(dialog, player, randomData) {
		const prefix = CONSTANTS.IMAGE_PATH_PREFIX;
		const level = player === game.me ? 11 : randomData.guanjieLevel;

		const icon = ui.create.div(".guanjie", dialog);
		const label = ui.create.div(".guanjieInfo", dialog);

		icon.setBackgroundImage(`${prefix}offical_icon_${level}.png`);
		label.setBackgroundImage(`${prefix}offical_label_${level}.png`);
	}

	// 段位信息
	_createDuanweiInfo(dialog, player, randomData) {
		const prefix = CONSTANTS.IMAGE_PATH_PREFIX;
		const paiwei = ui.create.div(".paiweiditu", dialog);
		const duanwei = ui.create.div(".duanwei", paiwei);

		const isMe = player === game.me;
		const rankLevel = isMe ? 6 : randomData.rankLevel;
		const rankText = isMe ? "绝世传说" : CONSTANTS.DUANWEI_TRANSLATION[rankLevel].randomGet();

		ui.create.div(".duanweishuzi", `<center>${rankText}`, paiwei);
		duanwei.setBackgroundImage(`${prefix}pwtx_${rankLevel}.png`);

		// 鲜花/鸡蛋
		ui.create.div(".xinyufen", `鲜花<br>${randomData.lucky}`, paiwei);
		ui.create.div(".renqizhi", `鸡蛋<br>${randomData.popularity}`, paiwei);
		ui.create.div(".paiweiType", "本赛季", paiwei);

		// 进度条
		ui.create.div(".typeleft", paiwei);
		const progress = ui.create.div(".typeright", paiwei);
		const width = isMe ? 0 : (randomData.gailevel / 100) * 75;
		progress.style.width = `${width}px`;

		// 等级
		ui.create.div(".dengjiX", isMe ? "0%" : `${randomData.gailevel}%`, paiwei);
		ui.create.div(".huiyuanX", isMe ? "220级" : `${randomData.level}级`, paiwei);

		// 公会
		ui.create.div(".gonghui", paiwei, `(${CONSTANTS.VIP_TYPES.randomGet(1)})`);
	}

	// 擅长武将信息
	_createSkillInfo(dialog, player, randomData) {
		// 按钮配置
		const buttons =
			player === game.me
				? [
						{ cls: "useless1", text: "分享", icon: "useless1.png" },
						{ cls: "useless2", text: "展示(诏令－1)", icon: "useless2.png" },
						{ cls: "useless3", text: "调整武将", icon: "useless1.png" },
						{ cls: "useless4", text: "我的家园", icon: "useless1.png" },
					]
				: [
						{ cls: "useless1", text: "拉黑名单", icon: "useless1.png" },
						{ cls: "useless2", text: "私聊", icon: "useless1.png" },
						{ cls: "useless3", text: "加为好友", icon: "useless1.png" },
						{ cls: "useless4", text: "教训他", icon: "useless1.png" },
					];

		this._createButtons(dialog, buttons);

		// 擅长武将展示
		const container = ui.create.div(".shanchangdialog", dialog);
		const chars = Object.keys(lib.character)
			.filter(k => !lib.filter.characterDisabled(k))
			.randomGets(4);

		chars.forEach(name => {
			const group = lib.character[name][1];
			const charDiv = ui.create.div(".shanchang", container);
			const frame = ui.create.div(".kuang", charDiv);

			frame.setBackgroundImage(getGroupBackgroundImage(group));

			const leftPane = createLeftPane(frame, name, player);
			const stars = ui.create.div(".xing", frame);
			createStars(stars, game.getRarity(name));

			const nameDiv = ui.create.div(".biankuangname", frame);
			nameDiv.innerHTML = get.slimName(name);

			// 换肤按钮
			if (window.zyile_charactercard) {
				const skinBtn = ui.create.div(".huanfu", charDiv);
				skinBtn.onclick = () => window.zyile_charactercard(name, charDiv, false);
			}
		});
	}

	// 创建按钮
	_createButtons(dialog, buttons) {
		buttons.forEach(btn => {
			const el = ui.create.div(`.${btn.cls}`, dialog, get.translation(btn.text));
			el.setBackgroundImage(`extension/十周年UI/ui/assets/character/shousha/${btn.icon}`);

			el.onclick = () => {
				el.style.transform = "scale(0.9)";
				setTimeout(() => (el.style.transform = "scale(1)"), 100);
				game.playAudio("../extension/十周年UI/ui/assets/lbtn/shousha/label.mp3");

				// 展示按钮特殊处理
				if (btn.text === "展示(诏令－1)" && window.dcdAnim?.loadSpine) {
					const spineData = {
						name: "../../../十周年UI/ui/assets/character/shousha/guge/SS_DaTing_zhounianqing_beijingyanhua",
					};
					dcdAnim.loadSpine(spineData.name, "skel", () => {
						dcdAnim.playSpine(
							{ name: spineData.name },
							{
								speed: 1,
								scale: 0.95,
								parent: dialog,
							}
						);
					});
				}
			};
		});
	}
}
