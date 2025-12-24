"use strict";

/**
 * 动态皮肤配置模块
 *
 * 使用说明：
 * - 打开动态皮肤开关后直接替换原有武将皮肤
 * - 动态皮肤参数表：https://docs.qq.com/sheet/DS2Vaa0ZGWkdMdnZa
 * - 相关文件放到 十周年UI/assets/dynamic 目录下
 *
 * 配置格式：
 * 武将名: {
 *   皮肤名: {
 *     name: "xxx",           // 必填，骨骼名称（不带.skel后缀）
 *     action: "xxx",         // 播放动作，一般是 DaiJi
 *     x: [10, 0.5],          // left: calc(10px + 50%)，默认[0, 0.5]
 *     y: [10, 0.5],          // bottom: calc(10px + 50%)，默认[0, 0.5]
 *     scale: 0.5,            // 缩放大小，默认1
 *     angle: 0,              // 旋转角度，默认0
 *     speed: 1,              // 播放速度，默认1
 *     hideSlots: [],         // 隐藏的部件
 *     clipSlots: [],         // 裁剪的部件（仅露头动皮）
 *     background: "xxx.jpg", // 背景图片
 *   }
 * }
 *
 * 调试代码（控制台执行）：
 * game.me.stopDynamic();
 * game.me.playDynamic({
 *   name: 'xxx', loop: true,
 *   x: [0, 0.5], y: [0, 0.5], scale: 0.5, angle: 0, speed: 1,
 *   hideSlots: [], clipSlots: [],
 * });
 */

// 动态皮肤配置表
export const dynamicSkinConfig = {
	luyi: {
		姝丽风华: {
			name: "卢弈/姝丽风华/daiji2",
			shan: "play3",
			x: [0, 0.438],
			y: [0, 0.396],
			angle: -2,
			scale: 1.07,
			shizhounian: true,
			chuchang: {
				name: "卢弈/姝丽风华/chuchang",
				x: [0, 0.777],
				y: [0, 0.36],
				scale: 0.7,
				action: "play",
			},
			gongji: {
				name: "卢弈/姝丽风华/chuchang2",
				x: [0, 0.812],
				y: [0, 0.254],
				scale: 0.8,
				action: "gongji",
			},
			teshu: {
				name: "卢弈/姝丽风华/chuchang2",
				x: [0, 0.812],
				y: [0, 0.254],
				scale: 0.8,
				action: "jineng",
			},
			beijing: {
				name: "卢弈/姝丽风华/beijing",
				x: [0, 0.29],
				y: [0, 0.5],
				scale: 0.4,
			},
			zhishixian: {
				name: "卢弈/姝丽风华/shouji2",
				scale: 0.5,
				speed: 0.8,
				delay: 0.4,
				effect: {
					name: "卢弈/姝丽风华/shouji",
					scale: 0.5,
					speed: 0.8,
					delay: 0.25,
				},
			},
		},
	},
};

// 扩展配置（可由其他模块添加）
export const dynamicSkinExtend = {};

/**
 * 设置动态皮肤模块
 */
export function setupDynamicSkin() {
	if (!window.decadeUI) return;

	decadeUI.dynamicSkin = { ...dynamicSkinConfig };
	decadeUI.get.extend(decadeUI.dynamicSkin, dynamicSkinExtend);
}
