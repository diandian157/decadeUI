/**
 * @fileoverview 全局常量定义
 * @description 消除魔法数字，集中管理常量
 * @module constants
 */

/**
 * 卡牌动画相关时间（毫秒）
 */
export const CARD_ANIMATION = {
	/** 卡牌移动删除延迟 */
	MOVE_DELETE_DELAY: 460,
	/** 卡牌过渡动画时长 */
	TRANSITION_DURATION: 400,
	/** 幻影效果清理延迟 */
	GHOST_CLEANUP_DELAY: 100,
};

/**
 * UI动画相关时间（毫秒）
 */
export const UI_ANIMATION = {
	/** 游戏重载延迟 */
	RELOAD_DELAY: 100,
	/** 布局初始化延迟 */
	LAYOUT_INIT_DELAY: 500,
	/** UI更新延迟 */
	UI_UPDATE_DELAY: 1000,
	/** 阶段提示动画时长 */
	PHASE_ANIMATION_DURATION: 1000,
};

/**
 * 初始化相关延迟（毫秒）
 */
export const INIT_DELAY = {
	/** 卡牌拖拽初始化延迟 */
	CARD_DRAG_INIT: 1000,
	/** 游戏开始特效延迟 */
	GAME_START_EFFECT: 51,
	/** 空闲回调超时 */
	IDLE_CALLBACK_TIMEOUT: 8000,
	/** 低优先级资源加载延迟 */
	LOW_PRIORITY_LOAD: 3000,
};

/**
 * 进度条相关常量
 */
export const PROGRESS_BAR = {
	/** 红色警告阈值 */
	RED_THRESHOLD: 30,
	/** 手杀样式初始宽度 */
	SHOUSHA_INITIAL_WIDTH: 125,
	/** 十周年样式初始宽度 */
	DECADE_INITIAL_WIDTH: 120,
};

/**
 * 布局相关常量
 */
export const LAYOUT = {
	/** 卡牌选中偏移量（桌面端） */
	CARD_SELECT_OFFSET_DESKTOP: 12,
	/** 卡牌选中偏移量（移动端） */
	CARD_SELECT_OFFSET_MOBILE: 10,
	/** 显示卡牌面板偏移 */
	SHOW_CARDS_OFFSET: 10,
	/** 显示卡牌面板顶部位置 */
	SHOW_CARDS_TOP: 90,
};

/**
 * 配置默认值
 */
export const CONFIG_DEFAULTS = {
	/** 手牌提示高度百分比 */
	HAND_TIP_HEIGHT: 20,
	/** 进度条高度百分比 */
	PROGRESS_BAR_HEIGHT: 22,
	/** 手牌缩放比例 */
	CARD_SCALE: 0.18,
	/** 弃牌堆卡牌缩放比例 */
	DISCARD_SCALE: 0.14,
};

/**
 * 输入值范围
 */
export const INPUT_RANGE = {
	/** 百分比最小值 */
	PERCENT_MIN: 0,
	/** 百分比最大值 */
	PERCENT_MAX: 100,
	/** 缩放最小值 */
	SCALE_MIN: 0.1,
	/** 缩放最大值 */
	SCALE_MAX: 1,
};
