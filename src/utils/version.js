/**
 * 版本工具模块
 */
import { lib, game } from "noname";

/**
 * 比较版本号
 * @returns 1(v1>v2), -1(v1<v2), 0(相等)
 */
export function compareVersions(v1, v2) {
	const parts1 = v1.split(".").map(Number);
	const parts2 = v2.split(".").map(Number);
	const maxLen = Math.max(parts1.length, parts2.length);

	for (let i = 0; i < maxLen; i++) {
		const p1 = parts1[i] || 0;
		const p2 = parts2[i] || 0;
		if (p1 !== p2) return p1 > p2 ? 1 : -1;
	}
	return 0;
}

/**
 * 检查版本兼容性
 */
export function checkVersionCompatibility() {
	const currentVersion = lib.version;
	const requiredVersion = lib.extensionPack.十周年UI.minNonameVersion;
	const comparison = compareVersions(currentVersion, requiredVersion);

	if (comparison === 0) return;

	const messages = {
		[-1]: `十周年UI要求无名杀版本：${requiredVersion}\n当前版本：${currentVersion}\n请更新无名杀。`,
		[1]: `当前无名杀版本：${currentVersion}\n十周年UI版本过低，请更新十周年UI。`,
	};

	const msg = messages[comparison];
	if (msg) {
		setTimeout(() => {
			if (confirm(`版本不匹配警告！\n\n${msg}\n\n点击确定继续游戏，但遇到的bug均不受理。`)) {
				game.print("已确认版本不匹配，继续游戏...");
			}
		}, 1000);
	}
}
