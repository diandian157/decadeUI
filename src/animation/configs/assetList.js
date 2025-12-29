"use strict";

/**
 * @fileoverview 预加载动画资源列表配置
 */

/**
 * 动画资源列表
 * @type {Array<{name: string, follow?: boolean, fileType?: string}>}
 */
export const assetList = [
	// 出牌指示动画
	{ name: "aar_chupaizhishiX" },
	{ name: "aar_chupaizhishi" },

	// 选中特效
	{ name: "SF_xuanzhong_eff_jiangjun" },
	{ name: "SF_xuanzhong_eff_weijiangjun" },
	{ name: "SF_xuanzhong_eff_cheqijiangjun" },
	{ name: "SF_xuanzhong_eff_biaoqijiangjun" },
	{ name: "SF_xuanzhong_eff_dajiangjun" },
	{ name: "SF_xuanzhong_eff_dasima" },

	// 游戏开始特效
	{ name: "effect_youxikaishi" },
	{ name: "effect_youxikaishi_shousha" },

	// 装备特效
	{ name: "effect_baguazhen" },
	{ name: "effect_baiyinshizi" },
	{ name: "effect_cixiongshuanggujian" },
	{ name: "effect_fangtianhuaji" },
	{ name: "effect_guanshifu" },
	{ name: "effect_gudingdao" },
	{ name: "effect_hanbingjian" },
	{ name: "effect_qilingong" },
	{ name: "effect_qinggangjian" },
	{ name: "effect_qinglongyanyuedao" },
	{ name: "effect_renwangdun" },
	{ name: "effect_shoujidonghua" },
	{ name: "effect_tengjiafangyu" },
	{ name: "effect_tengjiaranshao" },
	{ name: "effect_zhangbashemao" },
	{ name: "effect_zhiliao" },
	{ name: "effect_loseHp" },

	// 数字特效
	{ name: "globaltexiao/huifushuzi/shuzi2" },
	{ name: "globaltexiao/xunishuzi/SS_PaiJu_xunishanghai" },
	{ name: "globaltexiao/shanghaishuzi/shuzi" },
	{ name: "globaltexiao/shanghaishuzi/SZN_shuzi" },

	// 更多装备特效
	{ name: "effect_zhugeliannu" },
	{ name: "effect_zhuqueyushan" },
	{ name: "effect_jinhe" },
	{ name: "effect_numa" },
	{ name: "effect_nvzhuang" },
	{ name: "Ss_ZB_QiXingDao" },
	{ name: "effect_wufengjian" },
	{ name: "effect_yajiaoqiang" },
	{ name: "effect_yinfengjia" },
	{ name: "effect_zheji" },
	{ name: "effect_jisha1" },
	{ name: "effect_zhenwang" },

	// 延时锦囊特效
	{ name: "effect_lebusishu" },
	{ name: "effect_bingliangcunduan" },
	{ name: "effect_nanmanruqin" },
	{ name: "effect_taoyuanjieyi" },
	{ name: "effect_shandian" },
	{ name: "effect_wanjianqifa_full" },

	// 特殊装备
	{ name: "RWJGD_xiao" },
	{ name: "XRJXN_xiao" },
	{ name: "XTBGZ_xiao" },
	{ name: "ZYSZK_xiao" },
	{ name: "TYBLJ" },
	{ name: "SSHW_TX_chongyingshenfu" },
	{ name: "SSHW_TX_lingbaoxianhu" },
	{ name: "SSHW_TX_taijifuchen" },
	{ name: "taipingyaoshu" },
	{ name: "effect_taipingyaoshu_xiexia" },
	{ name: "qibaodao2" },
	{ name: "feilongduofeng" },
	{ name: "Ss_mgk_fire" },
	{ name: "Ss_mgk_tslh" },
	{ name: "Ss_Gz_WuLiuJian" },
	{ name: "Ss_Gz_SanJianLiangRenDao" },
	{ name: "Ss_ZB_YiTianJian" },
	{ name: "Ss_ZB_YinFengYi" },
	{ name: "Ss_ZB_ZhanXiang" },
	{ name: "SSHW_TX_chiyanzhenhun" },
	{ name: "SSHW_TX_xuwangzhimian" },
	{ name: "Ss_ZB_ZheJi" },
	{ name: "Ss_ZB_NvZhuang" },
	{ name: "effect_xianding", fileType: "json" },

	// 跟随特效（绑定到目标）
	{ name: "effect_caochuanjiejian", follow: true },
	{ name: "effect_guohechaiqiao", follow: true },
	{ name: "effect_leisha", follow: true },
	{ name: "effect_heisha", follow: true },
	{ name: "effect_huosha", follow: true },
	{ name: "effect_hongsha", follow: true },
	{ name: "effect_huogong", follow: true },
	{ name: "effect_panding", follow: true },
	{ name: "effect_shan", follow: true },
	{ name: "effect_tao", follow: true },
	{ name: "effect_tiesuolianhuan", follow: true },
	{ name: "effect_jiu", follow: true },
	{ name: "effect_shunshouqianyang", follow: true },
	{ name: "effect_shushangkaihua", follow: true },
	{ name: "effect_wanjianqifa", follow: true },
	{ name: "effect_wuzhongshengyou", follow: true },
	{ name: "effect_wuxiekeji", follow: true },
	{ name: "effect_wugufengdeng", follow: true },
	{ name: "effect_yuanjiaojingong", follow: true },
	{ name: "effect_zhijizhibi", follow: true },
	{ name: "effect_zhulutianxia", follow: true },
];
