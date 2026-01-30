/**
 * @fileoverview 卡牌提示模块，为玩家操作提供上下文提示（出牌阶段、响应、弃牌、无懈可击等）
 */
import { lib, game, ui, get, ai, _status } from "noname";

// ==================== 常量 ====================

/** @type {number} 浅层父事件遍历深度 */
const MAX_PARENT_DEPTH_SHALLOW = 5;

/** @type {number} 深层父事件遍历深度 */
const MAX_PARENT_DEPTH_DEEP = 10;

/** @type {string[]} 拼点事件名称列表 */
const COMPARE_EVENT_NAMES = ["compareMultiple", "chooseToCompare", "chooseToCompareMultiple"];

// ==================== 卡牌提示文本映射 ====================

/**
 * 卡牌出牌阶段提示文本映射表
 * @type {Object.<string, string>}
 */
const cardPhasePrompts = {
	// 基本牌
	sha: "选择1名角色，作为杀的目标",
	tao: "你可以回复1点体力",
	jiu: "使用酒，令自己的下1张使用的【杀】伤害+1",
	// 普通锦囊
	wuzhong: "使用后你可再摸2张牌",
	juedou: "任意1名决斗目标，你们轮流出杀，出不下去的人受1伤害",
	guohe: "选择1名目标，弃掉他1张牌",
	shunshou: "选择1名距离为1的目标，获得其1张牌",
	wugu: "使用后所有人轮流拿1张牌",
	taoyuan: "所有受伤的角色将恢复1点体力",
	nanman: "使用南蛮入侵，每个人都要出杀，否则掉血",
	wanjian: "使用万箭齐发，每个人都要出闪，否则掉血",
	jiedao: "选择2名角色，借角色1的武器杀角色2，若角色1不出杀则将武器给你",
	huogong: "选择1名有手牌的目标火攻，他给你看1张牌，你弃掉同花色则他掉1血",
	tiesuo: "直接重铸，或选择1至2个角色作为连环的目标",
	// 延时锦囊
	lebu: "选择你要使用乐不思蜀的目标，他可能被跳过出牌",
	shandian: "挂上闪电，所有人轮流判定，可能掉3血",
	bingliang: "选择1个目标兵粮寸断，让他可能摸不了牌",
	// 防具
	bagua: "装备效果，需要出闪时可以判定，如果是红色则免费出闪",
	renwang: "装备效果，黑杀对你无效",
	tengjia: "装备效果，普通杀、南蛮入侵、万箭齐发对你无效；但受到火焰伤害+1",
	baiyin: "装备效果，不会受到超过1的伤害；失去装备时可以回1血",
	huxinjing: "装备效果，受到致命伤害时可弃置此牌防止伤害",
	lanyinjia: "装备效果，可将手牌当闪，受杀伤害时弃置此牌",
	heiguangkai: "装备效果，多目标的杀或伤害锦囊对你无效",
	minguangkai: "装备效果，免疫火攻火杀火烧连营，小势力不会被横置",
	// 武器
	zhuge: "装备效果，可以无限出杀",
	qinggang: "装备效果，无视对方防具",
	qinglong: "装备效果，杀被闪后可以继续追杀",
	zhangba: "装备效果，把任意2张手牌当杀",
	guanshi: "装备效果，可以弃2张牌强制命中",
	fangtian: "装备效果，如果最后1张手牌是杀，可以额外杀2个人",
	qilin: "装备效果，杀中后可以弃置目标1匹马",
	cixiong: "装备效果，如果杀的是异性，则他弃1张牌或你摸1张牌",
	hanbing: "装备效果，杀中后可以不造成伤害改为弃他2张牌",
	guding: "装备效果，如果目标没牌则杀伤害+1",
	zhuque: "装备效果，可以将普通杀转化为火焰杀",
	qibaodao: "装备效果，杀无视防具，目标满血时伤害+1",
	zhungangshuo: "装备效果，杀指定目标后互相弃1张手牌",
	yinyueqiang: "装备效果，回合外使用或打出黑色手牌后可出杀",
	meiyingqiang: "装备效果，其他角色回合内首次失去牌时可使用杀",
	liuyedao: "装备效果，杀造成伤害时可弃2张手牌令伤害+1",
	baipidao: "装备效果，杀造成伤害后可获得目标1张手牌",
	yitianjian: "装备效果，杀造成伤害后可弃1手牌回复1点体力",
	qixingbaodao: "装备效果，进入装备区后弃置其他装备和判定牌",
	sanjian: "装备效果，杀造成伤害后可弃1牌对距离1的另一角色造成1伤",
	feilongduofeng: "装备效果，杀指定目标后令其弃1牌，令其濒死时获得其1手牌",
	ty_feilongduofeng: "装备效果，杀指定目标后可摸1牌或令其弃1牌",
	tiejili: "装备效果，准备阶段可将攻击范围改为体力值",
	wutiesuolian: "装备效果，杀指定目标后令其横置",
	wuxinghelingshan: "装备效果，使用属性杀后可改变属性",
	// 坐骑
	jueying: "装备绝影，防守时与其他玩家的距离+1",
	dilu: "装备的卢马，防守时与其他玩家的距离+1",
	zhuahuang: "装备爪黄飞电马，防守时与其他玩家的距离+1",
	hualiu: "装备骅骝，防守时与其他玩家的距离+1",
	chitu: "装备赤兔马，攻击时与其他玩家的距离-1",
	dawan: "装备大宛马，攻击时与其他玩家的距离-1",
	zixin: "装备紫骍马，攻击时与其他玩家的距离-1",
	jingfanma: "装备惊帆，攻击时与其他玩家的距离-1",
	liulongcanjia: "装备效果，占用双马位，攻击距离-1防守距离+1",
	// 宝物
	muniu: "装备效果，你可以将卡牌放在木牛里当作手牌使用或者移动到一名玩家装备区",
	jinhe: "装备锦盒给其他角色，观看牌堆顶2张牌选1张作为「礼」",
	tongque: "装备效果，每回合首张应变牌无视条件生效",
	tianjitu: "装备效果，进入时弃1张牌，离开时摸至5张手牌",
	taigongyinfu: "装备效果，出牌阶段开始横置/重置1人，结束可重铸1牌",
	dinglanyemingzhu: "装备效果，获得或增强制衡技能",
	yuxi: "装备效果，视为大势力，摸牌+1，出牌阶段视为使用知己知彼",
	taipingyaoshu: "装备效果，免疫属性伤害，手牌上限+势力数，失去时摸2牌",
	// 负面装备
	yexingyi: "装备效果，你不是黑色锦囊牌的合法目标",
	zj_yexingyi: "装备效果，红色杀对你无效",
	nvzhuang: "装备女装给其他角色，男性装备或失去时弃1张牌",
	yinfengjia: "装备引蜂甲给其他角色，受到锦囊伤害+1",
	yinfengyi: "装备引蜂衣给其他角色，受锦囊伤害+1，毒失去体力+1",
	zheji: "装备折戟给其他角色，这是一把坏掉的武器",
	wufengjian: "装备无锋剑给其他角色，使用杀时需弃1张牌",
	duanjian: "装备断剑给其他角色，这是一把坏掉的武器",
	serafuku: "装备水手服给其他角色，男性被杀时判定黑色伤害+1",
	yajiaoqiang: "装备效果，他人回合首次使用黑牌后可获得此牌",
	numa: "装备驽马给其他角色，进入装备区时弃其他装备",
	yonglv: "装备庸驴给其他角色，攻击距离-1但其他人到你距离为1",
	zhanxiang: "装备战象给其他角色，防守距离+1且无法被赠予",
	// 特殊锦囊
	caochuan: "抵消伤害牌效果并获得此牌",
	jiejia: "选择1名有装备的角色，令其收回所有装备",
	kaihua: "选择1名角色，弃1-2张牌再摸等量牌，弃装备多摸1张",
	zhulu_card: "所有角色从亮出的装备牌中选1张装备",
	du: "毒牌，正面离开手牌或拼点亮出时失去1点体力",
	guaguliaodu: "选择1名已受伤角色，回复1点体力并可弃1张毒",
	chenghuodajie: "选择1名有手牌的角色，展示其1张牌，其交给你或受1伤",
	tuixinzhifu: "选择距离1的角色，获得其至多2张牌再还等量牌",
	xinge: "出牌阶段限一次，将1张手牌交给其他角色",
	suijiyingbian: "此牌视为你上一张使用的基本牌或普通锦囊",
	zhujinqiyuan: "选择1名有牌的角色，距离>1弃其牌，距离=1获得其牌",
	dongzhuxianji: "选择1名角色，卜算2然后摸2张牌",
	chuqibuyi: "选择1名有手牌的角色，展示其1张牌，花色不同则造成1伤",
	lx_huoshaolianying: "选择1名角色，展示其1牌，弃同花色牌造成1点火伤",
	suibozhuliu: "置于判定区，判定为方块则移动1张装备给下家",
	yidugongdu: "选择1名已受伤角色，若双方都有毒则弃毒各摸2张，否则各受1伤",
	dajunyajing: "选择1名角色，其他角色可对其使用杀",
	yushijiesui: "选择1名角色，对其造成1伤然后你失去1点体力",
	jinchan: "抵消对你生效的基本牌或普通锦囊并摸2张牌",
	fulei: "置于判定区，判定为黑桃则受到累计次数的雷伤",
	shengdong: "选择1名角色，交给其1张牌，其将2张牌交给另一人",
	zengbin: "选择1名角色，摸3张牌然后弃1张非基本牌或2张牌",
	caomu: "选择1名角色，判定非梅花则少摸1牌，距离1的角色各摸1牌",
	jianhao: "展示牌堆顶牌，猜下张点数大小，猜对可继续或获得所有展示牌",
	wangmei: "选择1名角色，其本回合梅花手牌视为桃",
	zhisi: "对自己使用，体力上限减至1，每减1点可视为使用1张火杀",
	qingsuan: "选择1名对你造成过伤害的角色，随机造成0-2点伤害",
	jiaoyou: "对所有角色使用，展示手牌中的伤害牌，这些牌伤害+1",
	haoyun: "选择颜色后判定，猜对获得此牌并可继续",
	liehuo: "对所有其他角色使用，暗选手牌，颜色相同的角色受1点火伤",
	shenbing: "对所有角色使用，弃所有装备或从牌堆装备各类型装备",
	jinnao: "选择1名角色，你和目标获得「金」标记可防止1次伤害",
	yinglang: "对所有角色使用，本轮使用牌指定目标后获得其1张牌",
	youfu: "选择1名角色，本阶段对自己使用基本牌或锦囊可额外指定其",
	fugui: "选择1名角色，其下次获得牌后你摸等量牌",
	tangying: "选择1名角色，结束回合并翻面托管，其下回合多执行1个阶段",
	dashi: "选择2名其他角色，令他们交换手牌",
	guilai: "选择1名已死亡的角色，令其复活",
	// 国战锦囊
	xietianzi: "对自己使用，结束出牌阶段，弃牌阶段后可弃1牌获得额外回合",
	shuiyanqijunx: "选择1名角色，令其弃所有装备或受1点雷伤",
	shuiyanqijuny: "选择1-2名角色，造成1点雷伤，第1个目标弃牌，第2个目标摸牌",
	lulitongxin: "直接重铸，或对所有大势力或小势力角色使用，未横置则横置，已横置则摸1牌",
	lianjunshengyan: "选择你和另一势力所有角色，你摸牌回血，其他人摸牌并重置",
	zj_lianjunshengyan: "选择你和1名其他角色，选择摸牌或回复体力",
	chiling: "对所有未确定势力角色使用，明置武将摸牌或弃装备或失去1点体力",
	diaohulishan: "选择至多2名角色，令其本回合视为移出游戏",
	huoshaolianying: "对距离最近的横置角色使用，造成1点火伤",
	yuanjiao: "选择1名不同势力角色，其摸1牌然后你摸3牌",
	zhibi: "直接重铸，或选择1名角色，观看其手牌或1张暗置武将牌",
	yiyi: "选择至多3名角色，各摸2张牌然后弃2张牌",
	qizhengxiangsheng: "选择1名角色标记奇兵或正兵，其打出杀或闪，否则受伤或被拿牌",
	dz_mantianguohai: "选择1-2名有牌的角色，获得其各1张牌再还各1张牌",
	qijia: "选择1名有装备的角色，令其弃武器和-1马或防具和+1马",
	wuliu: "装备效果，同势力其他角色攻击范围+1",
	shangfangbaojian: "装备效果，同势力角色出杀后可交换手牌",
	qingmingjian: "装备效果，回合内首次弃至少2张牌可对1人造成1伤",
	mengchong: "装备效果，使用牌后选择与其他角色距离+1或-1",
	zhaoshu: "置于武将牌上，同势力角色可放置手牌，集齐4花色可召唤势力锦囊",
	mb_qingnangshu: "装备效果，准备阶段加1点体力上限并回复1点体力",
	mb_chuanguoyuxi: "装备效果，弃牌阶段摸1牌且手牌上限+2，非主公失去1点体力",
	jilinqianyi: "装备效果，攻击范围为已损失体力值，杀结算时范围内其他人不能用牌",
	// 仙侠/活动锦囊
	khquanjiux: "所有角色手牌变酒并轮流打出，不打出的受所有人各1伤",
	nisiwohuo: "所有其他角色轮流对最近的人出杀或失去1点体力，直到有人死亡",
	wutian: "对自己使用，从3个伤害技能中选1个获得至下回合",
	qixin: "选择1名角色，令其重新分配你们的手牌，手牌少的摸1张",
	chadao: "选择1名角色，令其获得2张伤害牌",
	chadaox: "令场上获得两肋插刀效果，受伤时转移给队友",
	khquanjiu: "对所有角色使用，使用酒或点数9的牌，否则失去1点体力",
	luojing: "对濒死角色使用，结束其濒死，其死亡后你摸1张牌",
	hongyun: "选择你和1名有手牌的角色，各弃至多2张牌获得等量红桃牌",
	shengsi: "对濒死角色使用，令其回复2点体力，其死亡后你立即死亡",
	younan: "对所有未横置角色使用，令其横置",
	leigong: "对所有角色使用，各进行闪电判定，每有人受伤你摸1张牌",
	tianlei: "对所有角色使用，各放置1张闪电到判定区",
	yifu: "选择1名角色，双方选择是否成为对方义父，义子准备阶段交1张牌",
	// 特殊装备
	gx_lingbaoxianhu: "装备效果，造成大于1的伤害或有人死亡后加1点体力上限并回血",
	gx_taijifuchen: "装备效果，杀指定目标后令其弃牌或不可响应此杀",
	gx_chongyingshenfu: "装备效果，受到牌造成的伤害后记录牌名，再受同名牌伤害-1",
	cheliji_sichengliangyu: "装备效果，回合结束时手牌少于体力值可摸2牌然后弃此牌",
	cheliji_tiejixuanyu: "装备效果，其他角色回合结束时若其未造成伤害可令其弃2牌",
	cheliji_feilunzhanyu: "装备效果，其他角色回合结束时若其用过非基本牌可获得其1牌",
	pyzhuren_heart: "装备效果，杀造成伤害后判定，红色回血，黑色摸2牌",
	pyzhuren_diamond: "装备效果，杀造成伤害时可弃1牌令伤害+1，杀次数+1",
	pyzhuren_club: "装备效果，使用锦囊或杀时可增加1个目标，失去时回血",
	pyzhuren_spade: "装备效果，杀指定目标后可令其失去X点体力",
	pyzhuren_shandian: "装备效果，杀指定目标后令其判定，黑桃受3点雷伤，梅花受1点雷伤并回血摸牌",
	dagongche: "装备效果，出牌阶段开始时可视为使用杀并弃目标1牌",
	changandajian_equip1: "装备效果，失去时销毁并选择场上1牌，字母点数获得否则弃置",
	changandajian_equip2: "装备效果，失去时销毁并回血，选择场上1牌处理",
	changandajian_equip3: "装备效果，其他角色到你距离+2，失去时销毁并选择场上1牌处理",
	changandajian_equip4: "装备效果，你到其他角色距离-2，失去时销毁并选择场上1牌处理",
	changandajian_equip5: "装备效果，手牌上限+2，失去时销毁并选择场上1牌处理",
};

// ==================== 工具函数 ====================

/**
 * 获取卡牌的出牌阶段提示
 * @param {object|string} card - 卡牌对象或卡牌名称
 * @returns {string|null} 提示文本
 */
export const getCardPhasePrompt = card => {
	if (!card) return null;
	const cardName = typeof card === "string" ? card : card.name;
	return cardPhasePrompts[cardName];
};

/**
 * 移除文本中的特殊标记符号
 * @param {string} text - 原始文本
 * @returns {string} 处理后的文本
 */
export const decPrompt = text => (typeof text === "string" ? text.replace(/＃/g, "") : text);

/**
 * 移除HTML标签
 * @param {string} text - 原始文本
 * @returns {string} 处理后的文本
 */
export const stripTags = text => (typeof text === "string" ? text.replace(/<\/?.+?\/?>/g, "") : "");

/**
 * 清理提示文本（移除HTML标签和特殊符号）
 * @param {string} text - 原始文本
 * @returns {string} 处理后的文本
 */
export const sanitizePrompt = text => stripTags(decPrompt(text ?? "")).replace(/#/g, "");

/**
 * 获取单个目标
 * @param {object|Array} target - 目标对象或数组
 * @returns {object|null} 单个目标
 */
const getSingleTarget = target => {
	if (!target) return null;
	return Array.isArray(target) ? (target[0] ?? null) : target;
};

/**
 * 解析角色名称
 * @param {object|string} target - 目标对象或名称
 * @returns {string|null} 角色名称
 */
const resolveName = target => {
	if (!target) return null;
	const name = typeof target === "object" && target.name ? target.name : target;
	return name ? get.slimNameHorizontal(name) : null;
};

/**
 * 清理技能名称后缀
 * @param {string} name - 技能名称
 * @returns {string} 清理后的名称
 */
const cleanSkillName = name => name?.replace(/_cost$/, "").replace(/_backup$/, "");

// ==================== 对话框管理 ====================

/**
 * 关闭对话框
 * @param {object} dialog - 对话框对象
 * @returns {void}
 */
const closeDialog = dialog => dialog?.close?.();

/**
 * 关闭卡牌对话框
 * @returns {void}
 */
const closeCardDialog = () => {
	closeDialog(ui.cardDialog);
	delete ui.cardDialog;
};

/**
 * 重置所有手牌提示
 * @returns {void}
 */
const resetHandTips = () => {
	closeCardDialog();
	const tips = decadeUI?.statics?.handTips;
	if (!Array.isArray(tips)) return;
	tips.forEach(tip => {
		if (!tip) return;
		tip.clear?.();
		tip.hide?.();
		if (tip.$info) tip.$info.innerHTML = "";
		tip.closed = true;
	});
};

/**
 * 创建新的提示框
 * @returns {object} 提示框对象
 */
const ensureTip = () => {
	closeCardDialog();
	return (ui.cardDialog = decadeUI.showHandTip());
};

// ==================== 提示内容构建 ====================

/**
 * 向提示框追加HTML内容
 * @param {HTMLElement} tipNode - 提示框节点
 * @param {string} html - HTML内容
 * @param {string} [style] - 样式类型
 * @returns {HTMLElement|void} 创建的节点
 */
const appendTipHTML = (tipNode, html, style) => {
	if (!html) return;
	for (const node of tipNode.childNodes) {
		if (node.textContent === "") {
			node.innerHTML = html;
			if (style) node.dataset.type = style;
			return node;
		}
	}
	const span = document.createElement("span");
	span.innerHTML = html;
	if (style) span.dataset.type = style;
	return tipNode.appendChild(span);
};

/**
 * 向提示框追加文本内容
 * @param {HTMLElement} tipNode - 提示框节点
 * @param {string|Array} content - 文本内容或内容数组
 * @returns {void}
 */
const appendTipText = (tipNode, content) => {
	if (!content) return;
	if (Array.isArray(content)) {
		content.forEach(segment => {
			if (!segment?.text) return;
			if (segment.text.includes("<") || segment.text.includes("&lt;")) {
				appendTipHTML(tipNode, segment.text, segment.style);
			} else {
				tipNode.appendText(segment.text, segment.style);
			}
		});
		return;
	}
	if (typeof content === "string" && (content.includes("<") || content.includes("&lt;"))) {
		appendTipHTML(tipNode, content);
	} else {
		tipNode.appendText(content);
	}
};

/**
 * 追加技能名称到提示框
 * @param {HTMLElement} tipNode - 提示框节点
 * @param {string} skillName - 技能名称
 * @param {object} player - 玩家对象
 * @returns {void}
 */
const appendSkillName = (tipNode, skillName, player) => {
	const resolvedSkill = get.sourceSkillFor ? get.sourceSkillFor(cleanSkillName(skillName)) : cleanSkillName(skillName);
	tipNode.appendText(get.skillTranslation(resolvedSkill, player), "phase");
};

/**
 * 显示提示框
 * @param {object} tip - 提示框对象
 * @param {string|Array} content - 提示内容
 * @returns {void}
 */
const showTip = (tip, content) => {
	appendTipText(tip, content);
	tip.strokeText();
	tip.show();
};

// ==================== 事件遍历工具 ====================

/**
 * 向上遍历父事件查找匹配项
 * @param {object} event - 事件对象
 * @param {number} maxDepth - 最大遍历深度
 * @param {Function} predicate - 匹配条件函数
 * @returns {object|null} 匹配的父事件
 */
const traverseParent = (event, maxDepth, predicate) => {
	if (typeof event.getParent !== "function") return null;
	let parent = event.getParent();
	for (let depth = 0; depth < maxDepth && parent; depth++) {
		if (predicate(parent)) return parent;
		parent = parent.getParent?.();
	}
	return null;
};

/**
 * 检查是否在弃牌阶段
 * @param {object} event - 事件对象
 * @returns {boolean} 是否在弃牌阶段
 */
const markPhaseDiscard = event => traverseParent(event, MAX_PARENT_DEPTH_SHALLOW, p => p.name === "phaseDiscard") !== null;

/**
 * 获取拼点父事件
 * @param {object} event - 事件对象
 * @returns {object|null} 拼点父事件
 */
const getCompareParent = event => traverseParent(event, MAX_PARENT_DEPTH_DEEP, p => COMPARE_EVENT_NAMES.includes(p.name));

/**
 * 获取触发拼点的技能名
 * @param {object} event - 事件对象
 * @returns {string|null} 技能名称
 */
const getCompareSkill = event => {
	const compareParent = getCompareParent(event);
	if (!compareParent) return null;

	let parent = compareParent.getParent();
	for (let depth = 0; depth < MAX_PARENT_DEPTH_DEEP && parent; depth++) {
		if (parent.skill) return parent.skill;
		if (parent.name && !COMPARE_EVENT_NAMES.includes(parent.name)) return parent.name;
		parent = parent.getParent?.();
	}
	return null;
};

// ==================== 无懈可击处理 ====================

/**
 * 检查是否为无懈可击请求
 * @param {object} event - 事件对象
 * @returns {boolean} 是否为无懈可击请求
 */
const isAskWuxie = event => {
	if (!event) return false;
	if (event.type === "wuxie" || event.card?.name === "wuxie") return true;
	return sanitizePrompt(event.prompt).includes("无懈可击");
};

/**
 * 追溯到最初的锦囊牌
 * @param {object} event - 事件对象
 * @returns {{card: object|null, source: object|null, target: object|null}} 最初的牌信息
 */
const traceOriginalCard = event => {
	let current = event;
	let depth = 0;
	const maxDepth = MAX_PARENT_DEPTH_DEEP;

	while (depth < maxDepth && current) {
		if (Array.isArray(current.respondTo)) {
			const [source, card] = current.respondTo;
			const cardName = card?.name || card;

			if (cardName && cardName !== "wuxie") {
				return {
					card,
					source,
					target: card?.target || card?.targets || current.target,
				};
			}
		}

		current = current.getParent?.();
		depth++;
	}

	return { card: null, source: null, target: null };
};

/**
 * 解析无懈可击的目标名称
 * @param {object} event - 事件对象
 * @param {object} parentMap - 父事件信息映射
 * @returns {string|undefined} 目标名称
 */
const resolveWuxieTarget = (event, parentMap) => {
	// 优先处理延时锦囊判定
	const judgeParent = traverseParent(event, MAX_PARENT_DEPTH_DEEP, p => p.name === "judge" || p.name === "phaseJudge");
	if (judgeParent?.player) {
		return resolveName(judgeParent.player);
	}

	// 追溯到最初的锦囊牌
	const { card, target } = traceOriginalCard(event);

	// 尝试从最初的牌获取目标
	const candidates = [target, card?.target, card?.targets, event.target, parentMap?.target, parentMap?.targets, parentMap?.isJudge ? parentMap?.player : null];

	for (const candidate of candidates) {
		const name = resolveName(getSingleTarget(candidate));
		if (name) return name;
	}
};

/**
 * 获取无懈可击状态词
 * @param {object} event - 事件对象
 * @param {object} parentMap - 父事件信息映射
 * @returns {string} 状态词（生效/失效）
 */
const getWuxieStateWord = (event, parentMap) => {
	if (typeof parentMap?.state === "number") {
		return parentMap.state > 0 ? "生效" : "失效";
	}
	const match = sanitizePrompt(event.prompt).match(/即将(生|失)效/);
	return match ? (match[1] === "生" ? "生效" : "失效") : "生效或失效";
};

/**
 * 构建无懈可击提示文本
 * @param {object} event - 事件对象
 * @returns {Array} 提示文本数组
 */
const buildWuxieTipText = event => {
	const parentEvent = event.getParent?.();
	const parentMap = parentEvent?._info_map;
	const judgeParent = traverseParent(event, MAX_PARENT_DEPTH_DEEP, p => p.name === "judge" || p.name === "phaseJudge");
	const judgeCard = judgeParent?.card;
	const delayCardName = judgeCard?.viewAs || judgeCard?.name;
	const isDelayTrick = judgeParent && delayCardName && lib.card[delayCardName]?.type === "delay";

	const stateWord = getWuxieStateWord(event, parentMap);
	const s = text => decPrompt(sanitizePrompt(text));

	// 延时锦囊判定
	if (isDelayTrick) {
		const judgePlayer = judgeParent?.player;
		const playerName = judgePlayer ? get.slimNameHorizontal(judgePlayer.name) : "未知角色";
		const cardName = get.translation(delayCardName);
		return [{ text: playerName, style: "phase" }, { text: s("的") }, { text: s(cardName), style: "phase" }, { text: s("即将") }, { text: s(stateWord) }, { text: s("，是否使用") }, { text: s("无懈可击"), style: "phase" }, { text: s("？") }];
	}

	// 普通锦囊：追溯到最初的牌
	const { card: originalCard, source: originalSource } = traceOriginalCard(event);
	const cardName = originalCard ? get.translation(originalCard.name || originalCard) : "该牌";
	const targetName = resolveWuxieTarget(event, parentMap);
	const sourceName = resolveName(originalSource) ?? "未知角色";

	return [{ text: s(sourceName), style: "phase" }, { text: s("对") }, { text: s(targetName), style: "phase" }, { text: s("使用的") }, { text: s(cardName), style: "phase" }, { text: s("即将") }, { text: s(stateWord) }, { text: s("，是否使用") }, { text: s("无懈可击"), style: "phase" }, { text: s("？") }];
};

// ==================== 借刀杀人处理 ====================

/**
 * 检查是否为借刀杀人事件
 * @param {object} event - 事件对象
 * @returns {boolean} 是否为借刀杀人事件
 */
const isJiedaoEvent = event => {
	if (!event?.respondTo) return false;
	const card = Array.isArray(event.respondTo) ? event.respondTo[1] : null;
	return card?.name === "jiedao";
};

/**
 * 构建借刀杀人提示文本
 * @param {object} event - 事件对象
 * @returns {Array} 提示文本数组
 */
const buildJiedaoTipText = event => {
	const [sourcePlayer] = event.respondTo;
	const sourceName = resolveName(sourcePlayer) ?? "未知角色";
	const targetName = resolveName(event.sourcex) ?? "目标";
	const s = text => decPrompt(sanitizePrompt(text));

	return [{ text: s("请对") }, { text: s(targetName), style: "phase" }, { text: s("使用") }, { text: s("杀"), style: "phase" }, { text: s("，或令") }, { text: s(sourceName), style: "phase" }, { text: s("获得你的武器") }];
};

// ==================== 响应牌处理 ====================

/**
 * 解析响应牌信息
 * @param {Array} respondCard - 响应卡牌数组
 * @returns {{actionWord: string, cardName: string}} 响应信息
 */
const parseRespondCardInfo = respondCard => {
	const defaultResult = { actionWord: "打出", cardName: "" };
	if (!Array.isArray(respondCard) || !respondCard[1]) return defaultResult;

	const card = respondCard[1];
	const cardName = card?.name || card;
	if (!cardName || typeof cardName !== "string") return defaultResult;

	const cardInfo = lib.translate?.[cardName + "_info"] || get.translation(cardName + "_info");
	if (!cardInfo || typeof cardInfo !== "string") return defaultResult;

	const plainInfo = get.plainText ? get.plainText(cardInfo) : stripTags(cardInfo);
	const match = plainInfo.match(/(?:需|须)(打出|使用)(?:.*?张|一张)【?(.+?)】?|打出(?:.*?张|一张)【?(.+?)】?/);

	if (!match) return defaultResult;
	return match[1] ? { actionWord: match[1], cardName: match[2] } : { actionWord: "打出", cardName: match[3] };
};

/**
 * 解析响应目标名称
 * @param {object} event - 事件对象
 * @returns {string} 目标名称
 */
const resolveRespondTargetName = event => {
	if (Array.isArray(event.respondTo) && event.respondTo[1]) {
		const respondCard = event.respondTo[1];
		const respondName = respondCard?.name || respondCard;
		if (respondName) return get.translation(respondName);
	}
	const parent = event.getParent?.();
	const parentName = parent?.skill || parent?.name;
	return parentName ? get.skillTranslation(parentName, event.player) : "当前请求";
};

/**
 * 从事件中提取实际需要的牌数量（通用方法）
 * @param {object} event - 事件对象
 * @param {number} defaultCount - 默认数量
 * @returns {number} 实际需要的牌数量
 */
const extractRequiredCardCount = (event, defaultCount = 1) => {
	if (event.prompt2 && typeof event.prompt2 === "string") {
		const match = event.prompt2.match(/共需.*?(\d+)张/);
		if (match?.[1]) {
			const count = parseInt(match[1], 10);
			if (!isNaN(count) && count > 0) return count;
		}
	}

	const parent = event.getParent?.();
	const sources = [parent, event].filter(Boolean);

	for (const source of sources) {
		for (const key in source) {
			if (key.endsWith("Required") && typeof source[key] === "number" && source[key] > 1) {
				return source[key];
			}
		}
	}

	return defaultCount;
};

/**
 * 构建响应提示文本
 * @param {object} event - 事件对象
 * @returns {Array|null} 提示文本数组
 */
const buildRespondTipText = event => {
	if (!event) return null;
	if (isAskWuxie(event)) return buildWuxieTipText(event);
	if (isJiedaoEvent(event)) return buildJiedaoTipText(event);

	const s = text => decPrompt(sanitizePrompt(text));
	const [min = 1, max = min] = get.select(event.selectCard) ?? [];
	const defaultCount = max >= 0 ? max : min;

	const needCount = extractRequiredCardCount(event, defaultCount);

	const { actionWord, cardName } = parseRespondCardInfo(event.respondTo);
	const targetName = resolveRespondTargetName(event);

	if (!cardName && !targetName) return null;

	return [{ text: s(`请${actionWord}${needCount}张`) }, { text: s(cardName || "牌"), style: "phase" }, { text: s("响应") }, { text: s(targetName), style: "phase" }];
};

// ==================== 弃牌处理 ====================

/**
 * 获取位置描述词
 * @param {string} position - 位置标识
 * @returns {string} 位置描述词
 */
const getPositionWord = position => {
	if (!position || position === "h") return "手";
	if (position === "e") return "装备";
	return "";
};

/**
 * 构建弃牌提示文本
 * @param {object} event - 事件对象
 * @param {number} selectedCount - 已选择数量
 * @param {number} needCount - 需要数量
 * @param {number} min - 最小数量
 * @returns {string} 提示文本
 */
const buildDiscardTipText = (event, selectedCount, needCount, min) => {
	const positionWord = getPositionWord(event.position);
	const prefix = event.forced ? "请" : "是否";
	const suffix = event.forced ? "" : "？";
	const minText = min !== needCount ? `（至少${min}张）` : "";
	return `${prefix}弃置${selectedCount}/${needCount}张${positionWord}牌${minText}${suffix}`;
};

/**
 * 追加弃牌技能前缀
 * @param {object} tip - 提示框对象
 * @param {object} event - 事件对象
 * @param {string} compareSkill - 拼点技能名
 * @returns {void}
 */
const appendDiscardSkillPrefix = (tip, event, compareSkill) => {
	const skillName = compareSkill || event.getParent?.()?.skill || event.getParent?.()?.name || "";
	if (!skillName) return;
	appendSkillName(tip, skillName, event.player);
	tip.appendText("：");
};

/**
 * 处理弃牌事件
 * @param {object} event - 事件对象
 * @returns {void}
 */
const handleDiscard = event => {
	closeCardDialog();
	closeDialog(event.dialog);
	event.dialog = false;
	event.prompt = false;

	const discardTip = ensureTip();
	const compareSkill = getCompareSkill(event);
	const showPhase = markPhaseDiscard(event);

	if (showPhase) {
		discardTip.appendText("弃牌阶段", "phase");
	} else {
		appendDiscardSkillPrefix(discardTip, event, compareSkill);
	}

	const selectedCount = (ui.selected?.cards ?? []).length;
	const [min = 0, max = min] = get.select(event.selectCard) ?? [];
	const needCount = max >= 0 ? max : min;
	const prefix = showPhase ? "，" : "";
	const tipText = decPrompt(stripTags(prefix + buildDiscardTipText(event, selectedCount, needCount, min)));

	discardTip.appendText(tipText);
	showTip(discardTip);

	// 步骤结束时清理对话框
	event.filterStop = function () {
		if (this.step > 1 && ui.cardDialog) closeCardDialog();
	};
};

// ==================== 使用牌处理 ====================

/**
 * 处理响应使用
 * @param {object} event - 事件对象
 * @param {string} compareSkill - 拼点技能名
 * @returns {boolean} 是否处理成功
 */
const handleRespondUse = (event, compareSkill) => {
	if (!event.respondTo) return false;

	event.prompt = false;
	const respondTip = ensureTip();

	if (compareSkill) {
		appendSkillName(respondTip, compareSkill, event.player);
		respondTip.appendText("，");
	}

	const respondTipText = buildRespondTipText(event);
	if (!respondTipText) return false;

	showTip(respondTip, respondTipText);
	return true;
};

/**
 * 处理濒死使用
 * @param {object} event - 事件对象
 * @returns {boolean} 是否处理成功
 */
const handleDyingUse = event => {
	if (event.type !== "dying" || !event.dying) return false;

	closeDialog(event.dialog);
	event.dialog = false;
	event.prompt = false;

	const dyingTip = ensureTip();
	const dyingName = resolveName(event.dying) ?? get.translation(event.dying);

	appendTipHTML(dyingTip, dyingName, "phase");
	dyingTip.appendText(decPrompt(stripTags(`濒死，需要${1 - event.dying.hp}个桃，是否帮助？`)));
	showTip(dyingTip);
	return true;
};

/**
 * 显示出牌阶段默认提示
 * @param {object} tip - 提示框对象
 * @returns {void}
 */
const showPhaseDefaultTip = tip => {
	tip.appendText("出牌阶段", "phase");
	tip.appendText(decPrompt(stripTags("，请选择一张卡牌")));
};

/**
 * 显示选中卡牌的提示
 * @param {object} tip - 提示框对象
 * @param {string} cardName - 卡牌名称
 * @returns {void}
 */
const showCardTip = (tip, cardName) => {
	const customPrompt = getCardPhasePrompt(cardName);
	if (customPrompt) {
		tip.appendText(decPrompt(stripTags(customPrompt)));
	} else {
		const cardInfo = get.translation(`${cardName}_info`);
		const plainText = get.plainText ? get.plainText(cardInfo) : stripTags(cardInfo);
		tip.appendText(decPrompt(stripTags(plainText)));
	}
};

/**
 * 处理出牌阶段
 * @param {object} event - 事件对象
 * @returns {boolean} 是否处理成功
 */
const handlePhaseUse = event => {
	if (event.type !== "phase") return false;

	const selectedCards = ui.selected?.cards ?? [];
	const tip = ensureTip();

	if (selectedCards.length === 1) {
		showCardTip(tip, get.name(selectedCards[0]));
	} else {
		showPhaseDefaultTip(tip);
	}
	showTip(tip);
	return true;
};

/**
 * 处理无懈可击使用
 * @param {object} event - 事件对象
 * @returns {boolean} 是否处理成功
 */
const handleWuxieUse = event => {
	if (event.type !== "wuxie") return false;

	closeDialog(event.dialog);
	event.dialog = false;
	event.prompt = false;

	const wuxieTip = ensureTip();
	showTip(wuxieTip, buildWuxieTipText(event));
	return true;
};

/**
 * 统一处理使用牌事件
 * @param {object} event - 事件对象
 * @returns {void}
 */
const handleUse = event => {
	const compareSkill = getCompareSkill(event);

	if (handleWuxieUse(event)) return;
	if (handleRespondUse(event, compareSkill)) return;
	if (handleDyingUse(event)) return;
	handlePhaseUse(event);
};

/**
 * 处理响应事件
 * @param {object} event - 事件对象
 * @returns {void}
 */
const handleRespond = event => {
	closeDialog(event.dialog);
	event.dialog = false;
	event.prompt2 = false;
	event.prompt = false;

	const tip = ensureTip();
	const compareSkill = getCompareSkill(event);

	if (compareSkill) {
		appendSkillName(tip, compareSkill, event.player);
		tip.appendText("，");
	}

	const tipText = buildRespondTipText(event);
	if (tipText) {
		showTip(tip, tipText);
	} else {
		tip.appendText("请打出响应牌");
		showTip(tip);
	}
};

// ==================== 初始化入口 ====================

/**
 * 初始化卡牌提示模块
 * @param {object} context - 游戏上下文 { game, ui }
 */
export function initCardPrompt({ game, ui }) {
	if (!lib.config["extension_十周年UI_cardPrompt"]) return;

	// 暴露工具函数到全局
	window.getDecPrompt = decPrompt;

	// 检查开始钩子：预处理事件
	lib.hooks.checkBegin.add(event => {
		if (event.player !== game.me) return;
		if (event.name === "chooseToUse") {
			if ((event.type === "dying" && event.dying) || event.respondTo) {
				event.prompt = false;
				event.prompt2 = false; // 防止本体尝试访问不存在的dialog
			}
		}
		if (event.name === "chooseToDiscard") {
			event.prompt = false;
			event.prompt2 = false;
		}
		if (event.name === "chooseToRespond") {
			event.prompt = false;
			event.prompt2 = false;
		}
	});

	// 按钮检查钩子：处理按钮选择状态
	lib.hooks.checkButton.add(event => {
		const dialog = event.dialog;
		if (!dialog?.buttons) return;

		const range = get.select(event.selectButton);
		const maxSelect = range[1];
		const isUnlimited = maxSelect === -1;
		let selectableButtons = false;

		dialog.buttons.forEach(button => {
			if (button.classList.contains("unselectable")) return;

			const isFiltered = event.filterButton(button, event.player) && lib.filter.buttonIncluded(button);
			const isSelected = button.classList.contains("selected");

			if (isFiltered) {
				if (ui.selected.buttons.length < maxSelect) {
					button.classList.add("selectable");
				} else if (isUnlimited) {
					button.classList.add("selected");
					ui.selected.buttons.add(button);
				} else {
					button.classList.remove("selectable");
				}
			} else {
				button.classList.remove("selectable");
				if (isUnlimited && isSelected) {
					button.classList.remove("selected");
					ui.selected.buttons.remove(button);
				}
			}

			if (isSelected) {
				button.classList.add("selectable");
			} else if (!selectableButtons && button.classList.contains("selectable")) {
				selectableButtons = true;
			}
		});

		event.custom?.add?.button?.();
	});

	// 检查结束钩子：根据事件类型显示对应提示
	lib.hooks.checkEnd.add(event => {
		if (event.player !== game.me) {
			closeCardDialog();
			return;
		}

		// 延迟执行，避免被其他钩子的关闭逻辑覆盖
		setTimeout(() => {
			if (ui.cardDialog?._isLuckyCardTip) return;

			switch (event.name) {
				case "chooseToDiscard":
					handleDiscard(event);
					break;
				case "chooseToUse":
					handleUse(event);
					break;
				case "chooseToRespond":
					handleRespond(event);
					break;
				default:
					closeCardDialog();
			}
		}, 0);
	});

	// 游戏结束清理钩子
	if (!game.__decadePromptCleanupInstalled && typeof game.over === "function") {
		game.__decadePromptCleanupInstalled = true;
		const originalGameOver = game.over;
		game.over = function (...args) {
			try {
				resetHandTips();
			} catch (e) {}
			return originalGameOver.apply(this, args);
		};
	}
}
