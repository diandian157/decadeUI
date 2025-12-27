"use strict";

/**
 * 技能动画配置
 */

export const skillDefines = {
	// 重制版装备
	rw_bagua_skill: { name: "XTBGZ_xiao", scale: 1 },
	rw_renwang_skill: { name: "RWJGD_xiao", scale: 1 },
	rw_baiyin_skill: { name: "ZYSZK_xiao", scale: 1 },
	rw_zhuge_skill: { name: "XRJXN_xiao", scale: 1 },
	rw_tengjia1: { name: "TYBLJ", action: "TYBLJ_dang", scale: 1 },
	rw_tengjia2: { name: "TYBLJ", action: "TYBLJ_huo", scale: 1 },
	rw_tengjia3: { name: "TYBLJ", action: "TYBLJ_dang", scale: 1 },

	// 神话装备
	gx_lingbaoxianhu: { name: "SSHW_TX_lingbaoxianhu", scale: 0.5 },
	gx_taijifuchen: { name: "SSHW_TX_taijifuchen", scale: 0.5 },
	gx_chongyingshenfu: { name: "SSHW_TX_chongyingshenfu", scale: 0.5 },
	taipingyaoshu: { name: "taipingyaoshu", scale: 0.75 },
	taipingyaoshu_lose: { name: "effect_taipingyaoshu_xiexia", scale: 0.55 },
	qibaodao: { name: "qibaodao2", scale: 1 },
	yitianjian: { name: "Ss_ZB_YiTianJian", scale: 0.5 },
	yinfengyi: { name: "Ss_ZB_YinFengYi", scale: 0.5 },
	zhanxiang: { name: "Ss_ZB_ZhanXiang", scale: 0.5 },
	minguangkai_cancel: { name: "Ss_mgk_fire", scale: 0.5 },
	minguangkai_link: { name: "Ss_mgk_tslh", scale: 0.5 },
	wuliu: { name: "Ss_Gz_WuLiuJian", scale: 0.5 },
	sanjian_skill: { name: "Ss_Gz_SanJianLiangRenDao", scale: 0.4 },
	feilongduofeng: { name: "feilongduofeng", scale: 0.5 },
	ty_feilongduofeng_skill: { name: "feilongduofeng", scale: 0.5 },
	xuwangzhimian: { name: "SSHW_TX_xuwangzhimian", scale: 0.5 },
	chiyanzhenhunqin: { name: "SSHW_TX_chiyanzhenhun", scale: 0.5 },
	duanjian: { name: "Ss_ZB_ZheJi", scale: 0.5 },
	serafuku: { name: "Ss_ZB_NvZhuang", scale: 0.5 },
	qixingbaodao: { name: "Ss_ZB_QiXingDao", scale: 0.5 },
	yonglv: { name: "effect_numa", scale: 0.4 },

	// 标准装备
	bagua_skill: { name: "effect_baguazhen", scale: 0.6 },
	baiyin_skill: { name: "effect_baiyinshizi", scale: 0.5 },
	bazhen_bagua: { name: "effect_baguazhen", scale: 0.6 },
	cixiong_skill: { name: "effect_cixiongshuanggujian", scale: 0.5 },
	fangtian_skill: { name: "effect_fangtianhuaji", scale: 0.7 },
	guanshi_skill: { name: "effect_guanshifu", scale: 0.7 },
	guding_skill: { name: "effect_gudingdao", scale: 0.6 },
	hanbing_skill: { name: "effect_hanbingjian", scale: 0.5 },
	linglong_bagua: { name: "effect_baguazhen", scale: 0.5 },
	qilin_skill: { name: "effect_qilingong", scale: 0.5 },
	qinggang_skill: { name: "effect_qinggangjian", scale: 0.7 },
	qinglong_skill: { name: "effect_qinglongyanyuedao", scale: 0.6 },
	renwang_skill: { name: "effect_renwangdun", scale: 0.5 },
	tengjia1: { name: "effect_tengjiafangyu", scale: 0.6 },
	tengjia2: { name: "effect_tengjiaranshao", scale: 0.6 },
	tengjia3: { name: "effect_tengjiafangyu", scale: 0.6 },
	zhangba_skill: { name: "effect_zhangbashemao", scale: 0.7 },
	zhuge_skill: { name: "effect_zhugeliannu", scale: 0.5 },
	zhuque_skill: { name: "effect_zhuqueyushan", scale: 0.6 },
	jinhe_lose: { name: "effect_jinhe", scale: 0.4 },
	numa: { name: "effect_numa", scale: 0.4 },
	nvzhuang: { name: "effect_nvzhuang", scale: 0.5 },
	wufengjian_skill: { name: "effect_wufengjian", scale: 0.4 },
	yajiaoqiang_skill: { name: "effect_yajiaoqiang", scale: 0.5 },
	yinfengjia_skill: { name: "effect_yinfengjia", scale: 0.5 },
	zheji: { name: "effect_zheji", scale: 0.35 },

	// 延时锦囊
	lebu: { name: "effect_lebusishu", scale: 0.7 },
	bingliang: { name: "effect_bingliangcunduan", scale: 0.7 },
	shandian: { name: "effect_shandian", scale: 0.7 },
};

/**
 * 卡牌动画配置
 */
export const cardDefines = {
	nanman: { name: "effect_nanmanruqin", scale: 0.6 },
	wanjian: { name: "effect_wanjianqifa_full", scale: 1.5 },
	taoyuan: { name: "effect_taoyuanjieyi" },
};

/**
 * 出牌指示动画配置
 */
export const chupaiAnimations = {
	jiangjun: { name: "SF_xuanzhong_eff_jiangjun", scale: 0.6 },
	weijiangjun: { name: "SF_xuanzhong_eff_weijiangjun", scale: 0.6 },
	cheqijiangjun: { name: "SF_xuanzhong_eff_cheqijiangjun", scale: 0.6 },
	biaoqijiangjun: { name: "SF_xuanzhong_eff_biaoqijiangjun", scale: 0.5 },
	dajiangjun: { name: "SF_xuanzhong_eff_dajiangjun", scale: 0.6 },
	dasima: { name: "SF_xuanzhong_eff_dasima", scale: 0.6 },
	shoushaX: { name: "aar_chupaizhishiX", scale: 0.55 },
	shousha: { name: "aar_chupaizhishi", scale: 0.55 },
};
