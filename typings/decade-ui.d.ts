/**
 * 十周年UI扩展内部类型定义
 */

/**
 * 动画配置
 */
interface AnimationConfig {
	name: string;
	action?: string;
	speed?: number;
	scale?: number;
	loop?: boolean;
	[key: string]: any;
}

/**
 * 皮肤配置
 */
interface SkinConfig {
	name: string;
	x?: number[];
	y?: number[];
	scale?: number;
	angle?: number;
	speed?: number;
	beijing?: string;
	[key: string]: any;
}

/**
 * 卡牌皮肤元数据
 */
interface CardSkinMeta {
	[skinKey: string]: {
		name: string;
		path: string;
		prefix?: string;
		[key: string]: any;
	};
}

/**
 * 卡牌资源
 */
interface CardResources {
	[cardName: string]: {
		[skinKey: string]: {
			asset?: HTMLImageElement;
			loaded?: boolean;
			loading?: boolean;
		};
	};
}

/**
 * UI插件接口
 */
interface UIPlugin {
	name?: string;
	precontent?: () => void;
	filter?: () => boolean;
	[key: string]: any;
}

/**
 * 应用对象
 */
interface AppObject {
	plugins: UIPlugin[];
	pluginsMap: Record<string, UIPlugin>;
	[key: string]: any;
}

/**
 * 扩展配置项定义
 */
interface ExtensionConfigItem {
	name: string;
	intro?: string;
	init?: any;
	item?: Record<string, string>;
	type?: string;
	onclick?: () => void;
	update?: () => void;
	[key: string]: any;
}

/**
 * 模块导出类型
 */
declare module "*/config.js" {
	export const config: Record<string, ExtensionConfigItem>;
	export const cardSkinPresets: any;
	export const cardSkinMeta: CardSkinMeta;
}

declare module "*/content.js" {
	export function content(config: any, pack?: any): Promise<void>;
	export function finalizeDecadeUICore(decadeUI: DecadeUI, config: any): DecadeUI;
}

declare module "*/precontent.js" {
	export function precontent(config?: any, pack?: any): Promise<void>;
}

declare module "*/package.js" {
	export function mainpackage(otherInfo: any): Noname.ExtensionPackage;
}

export {};
