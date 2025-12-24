export const mainpackage = otherInfo => {
	const pkg = {
		character: {
			character: {},
			translate: {},
		},
		card: {
			card: {},
			translate: {},
			list: [],
		},
		skill: {
			skill: {},
			translate: {},
		},
	};

	const pack = {
		...pkg,
		...otherInfo,
	};

	const logItems = [`十周年UI版本号：${pack.version}`, `适配本体：${otherInfo.minNonameVersion}`, "bugfix", "函数跟进", "UI界面调整", "可以自由调整卡牌大小", "添加版本检测功能", "移除旧手杀样式，新手杀改名为移动版"];

	const githubUrl = "https://github.com/diandian157/decadeUI";
	const copyHandler = `navigator.clipboard.writeText('${githubUrl}').then(() => alert('已成功复制，粘贴到浏览器打开，部分进不去需要翻墙')).catch(() => alert('复制失败，请手动复制'))`;

	pack.intro = `<a href="javascript:void(0)" onclick="${copyHandler}">点击复制十周年UIGithub仓库地址</a><br><p style="color:rgb(210,210,000); font-size:12px; line-height:14px; text-shadow: 0 0 2px black;">${logItems.join("<br>•")}</p>`;

	return pack;
};
