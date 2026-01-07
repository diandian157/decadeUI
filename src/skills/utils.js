/**
 * @fileoverview 技能模块工具函数
 * @description 提供画布操作等通用工具函数
 * @module skills/utils
 */

import { lib } from "noname";

/**
 * 创建画布样式配置
 * @returns {Object} 画布CSS样式对象
 */
export const createCanvasStyle = () => ({
	position: "absolute",
	width: "249px",
	height: "249px",
	borderRadius: "6px",
	left: "calc(50% - 125px)",
	top: "calc(50% - 125px)",
	border: "3px solid",
});

/**
 * 初始化画布
 * @param {HTMLCanvasElement} canvas - 画布元素
 * @param {number} [size=249] - 画布尺寸
 * @returns {CanvasRenderingContext2D} 画布2D上下文
 */
export const initCanvas = (canvas, size = 249) => {
	canvas.width = size;
	canvas.height = size;
	Object.assign(canvas.style, createCanvasStyle());
	return canvas.getContext("2d");
};

/**
 * 加载图片到画布
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {HTMLCanvasElement} canvas - 画布元素
 * @param {string} name - 卡牌图片名称
 * @returns {void}
 */
export const loadImageToCanvas = (ctx, canvas, name) => {
	const img = new Image();
	img.src = `${lib.assetURL}image/card/${name}.png`;
	img.onload = () => ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
};
