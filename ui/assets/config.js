/**
 * 资源路径配置
 * 定义各样式的图片资源映射
 */

const BASE_PATH = "extension/十周年UI/ui/assets";

// 样式资源映射
export const SKIN_ASSETS = {
	// 手杀风格
	shousha: {
		character: {
			dialog: "character/shousha/bigdialog.png",
			name2: group => `character/shousha/character/name2_${group}.png`,
			dengjie: level => `character/shousha/dengjie/offical_icon_${level}.png`,
			num: n => `character/shousha/num/${n}.png`,
			star: "character/shousha/pubui_starm.png",
			skillIcon: type => `character/shousha/sp_${type}.png`,
		},
		lbtn: {
			menu: "lbtn/shousha/SSCD/yemian.png",
			button: "lbtn/shousha/SSCD/button.png",
			shezhi: "lbtn/shousha/SSCD/shezhi.png",
			tuichu: "lbtn/shousha/SSCD/tuichu.png",
			taopao: "lbtn/shousha/SSCD/taopao.png",
			touxiang: "lbtn/shousha/SSCD/touxiang.png",
			tuoguan: "lbtn/shousha/SSCD/tuoguan.png",
		},
		skill: {
			xiandingji: "skill/shousha/xiandingji.png",
			juexingji: "skill/shousha/juexingji.png",
			zhuanhuanji: skill => `skill/shousha/zhuanhuanji/${skill}_yang.png`,
		},
	},

	// 十周年风格
	shizhounian: {
		character: {
			dialog: "character/shizhounian/dialog3.png",
			name2: group => `character/shizhounian/skt_${group}.png`,
			rarity: r => `character/shizhounian/rarity_${r}.png`,
		},
		lbtn: {
			menu: "lbtn/shizhounian/yemian.png",
		},
		skill: {
			xiandingji: "skill/shizhounian/xiandingji.png",
			juexingji: "skill/shizhounian/juexingji.png",
		},
	},

	// 新杀风格
	xinsha: {
		character: {
			dialog: "character/xinsha/dialog3.png",
			name2: group => `character/xinsha/${group}.png`,
			rarity: r => `character/xinsha/rarity_${r}.png`,
			vip: level => `character/xinsha/vip${level}.png`,
		},
		lbtn: {
			menu: "lbtn/xinsha/yemian.png",
		},
		skill: {
			xiandingji: "skill/xinsha/xiandingji.png",
			juexingji: "skill/xinsha/juexingji.png",
		},
	},

	// OL风格
	online: {
		character: {
			dialog: "character/online/dialog4.png",
			name2: group => `character/online/ol_${group}.png`,
			names: group => `character/online/ols_${group}.png`,
		},
		lbtn: {
			menu: "lbtn/online/yemian.png",
		},
		skill: {
			xiandingji: "skill/online/xiandingji.png",
			juexingji: "skill/online/juexingji.png",
		},
	},

	// 宝宝杀风格
	baby: {
		character: {
			dialog: "character/baby/dialog5.png",
			name2: group => `character/baby/baby_${group}.png`,
			names: group => `character/baby/babys_${group}.png`,
			vip: level => `character/baby/vip${level}.png`,
			duanwei: level => `character/baby/dw${level}.png`,
		},
		lbtn: {
			menu: "lbtn/baby/yemian.png",
		},
		skill: {
			xiandingji: "skill/baby/xiandingji.png",
			juexingji: "skill/baby/juexingji.png",
		},
	},

	// 代号风格
	codename: {
		character: {
			dialog: "character/codename/dialog.png",
		},
		lbtn: {
			menu: "lbtn/codename/yemian.png",
		},
		skill: {
			xiandingji: "skill/codename/xiandingji.png",
			juexingji: "skill/codename/juexingji.png",
		},
	},
};

// 共享资源（所有样式通用）
export const SHARED_ASSETS = {
	fonts: {
		ATLL: "fonts/ATLL.woff2",
		BKJT: "fonts/BKJT.ttf",
		FZLBJW: "fonts/FZLBJW.woff2",
		FZLSFT: "fonts/FZLSFT.woff2",
		HYZLSJ: "fonts/HYZLSJ.woff2",
		WDZLFT: "fonts/WDZLFT.woff2",
	},
	chat: {
		buttonsend: "chat/buttonsend.png",
		emoji: "chat/emoji.png",
		emotion: "chat/emotion.png",
		say: "chat/say.png",
		saydiv: "chat/saydiv.png",
	},
	identity: {
		dizhu: "identity/dizhu.png",
		fanzei: "identity/fanzei.png",
		neijian: "identity/neijian.png",
		zhongchen: "identity/zhongchen.png",
		zhugong: "identity/zhugong.png",
	},
};

// 获取资源完整路径
export function getAssetUrl(skinId, category, key, ...args) {
	const skinName = ["shousha", "shizhounian", "xinsha", "online", "baby", "codename"][skinId - 1] || "shousha";
	const skinAssets = SKIN_ASSETS[skinName];

	if (!skinAssets || !skinAssets[category]) return null;

	const asset = skinAssets[category][key];
	if (typeof asset === "function") {
		return `${BASE_PATH}/${asset(...args)}`;
	}
	return asset ? `${BASE_PATH}/${asset}` : null;
}

// 获取共享资源路径
export function getSharedAssetUrl(category, key) {
	const asset = SHARED_ASSETS[category]?.[key];
	return asset ? `${BASE_PATH}/${asset}` : null;
}

export default {
	SKIN_ASSETS,
	SHARED_ASSETS,
	getAssetUrl,
	getSharedAssetUrl,
};
