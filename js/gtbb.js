import { lib, ui, get } from "noname";

export function initGTBB(config) {
	if (!config.GTBB) return;

	const gtbbUI = {};
	function getCharactersFromPacks(filterFn) {
		const results = [];
		for (const packName of lib.config.characters) {
			const pack = lib.characterPack[packName];
			if (!pack) continue;
			for (const [charName, characterInfo] of Object.entries(pack)) {
				if (characterInfo.isUnseen) continue;
				if (lib.filter.characterDisabled(charName)) continue;
				const result = filterFn(charName, characterInfo);
				if (result) results.push(result);
			}
		}
		for (const packName of Object.keys(lib.characterPack)) {
			if (!packName.startsWith("mode_extension_")) continue;
			const extName = packName.slice(15);
			if (lib.config[`extension_${extName}_characters_enable`] !== true) continue;
			const pack = lib.characterPack[packName];
			if (!pack) continue;
			for (const [charName, characterInfo] of Object.entries(pack)) {
				if (characterInfo.isUnseen) continue;
				if (lib.filter.characterDisabled(charName)) continue;
				const result = filterFn(charName, characterInfo);
				if (result) results.push(result);
			}
		}
		return results;
	}
	function showGTBB() {
		const playerLabel = "玩家";
		const nickname = lib.config.connect_nickname;
		const randomNames = getCharactersFromPacks(charName => {
			const displayName = get.translation(charName);
			return displayName && displayName !== charName ? displayName : null;
		});
		const skins = getCharactersFromPacks(charName => {
			const displayName = get.translation(charName);
			return displayName && displayName !== charName ? `${displayName}×1` : null;
		});
		const generals = getCharactersFromPacks(charName => {
			let title = lib.characterTitle[charName] || "";
			if (title.startsWith("#")) title = title.slice(2);
			title = get.plainText(title);
			const displayName = get.translation(charName);
			if (title && displayName && displayName !== charName) {
				return `${title}·${displayName}*1（动+静）`;
			}
			return null;
		});
		const suiji = randomNames.randomGet();
		const name = [suiji, nickname].randomGet();
		const action = ["通过", "使用", "开启"].randomGet();
		const stories = ["周年", "五一", "踏青", "牛年", "开黑", "冬至", "春分", "鼠年", "盛典", "魏魂", "群魂", "蜀魂", "吴魂", "猪年", "圣诞", "国庆", "狗年", "金秋", "奇珍", "元旦", "小雪", "冬日", "招募", "梦之回廊", "虎年", "新春", "七夕", "大雪", "端午", "武将", "中秋", "庆典"];
		const story = stories.randomGet();
		const boxTypes = ["盒子", "宝盒", "礼包", "福袋", "礼盒", "庆典", "盛典"];
		const box = boxTypes.randomGet();
		const getText = "获得了";
		const skin = skins.randomGet();
		const general = generals.randomGet();
		const reward = [`<font color="#56e4fa">${skin}</font>`, `<font color="#f3c20f">${general}</font>`].randomGet();
		const tailMsgs = [",大家快恭喜TA吧！", ",大家快恭喜TA吧。无名杀是一款非盈利游戏(づ ●─● )づ", ",祝你新的一年天天开心，万事如意"];
		const tail = tailMsgs.randomGet();
		let fontset = "FZLBJW";
		let colorA = "#efe8dc";
		let colorB = "#22c622";
		if (lib.config.extension_十周年UI_GTBBFont === "off") {
			fontset = "yuanli";
			colorA = "#86CC5B";
			colorB = "#B3E1EC";
		}
		gtbbUI.div.show();
		setTimeout(() => {
			gtbbUI.div.hide();
		}, 15500);
		gtbbUI.div2.innerHTML = `
			<marquee direction="left" behavior="scroll" scrollamount="9.8" loop="1" width="100%" height="50" align="absmiddle">
				<font face="${fontset}">
					${playerLabel}
					<font color="${colorA}"><b>${name}</b></font>
					${action}
					<font color="${colorB}"><b>${story}${box}</b></font>
					${getText}<b>${reward}</b>${tail}
				</font>
			</marquee>
		`;
	}
	gtbbUI.div = ui.create.div("");
	gtbbUI.div2 = ui.create.div("", gtbbUI.div);
	if (config.GTBBYangshi === "on") {
		gtbbUI.div.style.cssText = "pointer-events:none;width:100%;height:25px;font-size:23px;z-index:6;";
		gtbbUI.div2.style.cssText = "pointer-events:none;background:rgba(0,0,0,0.5);width:100%;height:27px;";
	} else {
		gtbbUI.div.style.cssText = "pointer-events:none;width:56%;height:35px;font-size:18px;z-index:20;background-size:100% 100%;background-repeat:no-repeat;left:50%;top:15%;transform:translateX(-50%);";
		gtbbUI.div.style["background-image"] = `url(${lib.assetURL}extension/十周年UI/shoushaUI/lbtn/images/uibutton/goutuo.png`;
		gtbbUI.div2.style.cssText = "pointer-events:none;width:85.5%;height:35px;left:8%;line-height:35px;";
	}
	const id = setInterval(() => {
		if (!gtbbUI.div.parentNode && ui.window) {
			ui.window.appendChild(gtbbUI.div);
			clearInterval(id);
			showGTBB();
			setInterval(showGTBB, parseFloat(lib.config["extension_十周年UI_GTBBTime"]));
		}
	}, 5000);
}
