/**
 * 无名杀核心类型定义（十周年UI扩展专用）
 * 这是简化版本，仅包含扩展中常用的类型
 */

declare module "noname" {
	export const lib: NonameLib;
	export const game: NonameGame;
	export const ui: NonameUI;
	export const get: NonameGet;
	export const ai: NonameAI;
	export const _status: NonameStatus;
}

interface NonameLib {
	assetURL: string;
	config: Record<string, any>;
	extensionMenu: Record<string, any>;
	init: {
		promises: {
			json: (url: string) => Promise<any>;
		};
	};
	element: {
		player: typeof HTMLDivElement;
		card: typeof HTMLDivElement;
		button: typeof HTMLDivElement;
		control: typeof HTMLDivElement;
		dialog: typeof HTMLDivElement;
	};
	skill: Record<string, any>;
	card: Record<string, any>;
	character: Record<string, any>;
	translate: Record<string, string>;
	arenaReady?: boolean;
	onresize?: () => void;
	[key: string]: any;
}

interface NonameGame {
	saveConfig: (key: string, value: any) => void;
	getExtensionConfig: (extension: string, key: string) => any;
	[key: string]: any;
}

interface NonameUI {
	arena?: HTMLDivElement;
	window?: HTMLDivElement;
	create: {
		div: (className?: string, innerHTML?: string, parent?: HTMLElement) => HTMLDivElement;
		node: (name: string, innerHTML?: string, parent?: HTMLElement) => HTMLElement;
		[key: string]: any;
	};
	[key: string]: any;
}

interface NonameGet {
	mode: () => string;
	config: (key: string) => any;
	[key: string]: any;
}

interface NonameAI {
	[key: string]: any;
}

interface NonameStatus {
	[key: string]: any;
}

/**
 * 扩展类型定义
 */
declare namespace Noname {
	interface ExtensionType {
		type: "extension";
	}

	interface ExtensionInfo {
		name: string;
		editable?: boolean;
		content?: (config: any, pack: any) => void | Promise<void>;
		precontent?: (config: any, pack: any) => void | Promise<void>;
		config?: Record<string, any>;
		package?: ExtensionPackage;
		mainpackage?: ExtensionPackage;
	}

	interface ExtensionPackage {
		character?: {
			character: Record<string, any>;
			translate: Record<string, string>;
		};
		card?: {
			card: Record<string, any>;
			translate: Record<string, string>;
			list: any[];
		};
		skill?: {
			skill: Record<string, any>;
			translate: Record<string, string>;
		};
		intro?: string;
		author?: string;
		diskURL?: string;
		forumURL?: string;
		version?: string;
	}
}

/**
 * 全局变量声明
 */
declare global {
	const lib: NonameLib;
	const game: NonameGame;
	const ui: NonameUI;
	const get: NonameGet;
	const ai: NonameAI;
	const _status: NonameStatus;

	// 十周年UI全局变量
	var decadeUI: DecadeUI;
	var decadeUIName: string;
	var decadeUIPath: string;
	var decadeModule: any;
	var app: any;

	interface Window {
		decadeUI: DecadeUI;
		decadeUIName: string;
		decadeUIPath: string;
		decadeModule: any;
		app: any;
	}
}

/**
 * 十周年UI核心对象类型
 */
interface DecadeUI {
	config: DecadeUIConfig;
	init: () => void;
	updateCardStyles?: () => void;
	[key: string]: any;
}

interface DecadeUIConfig {
	dynamicSkin?: boolean;
	newDecadeStyle?: string;
	dynamicSkinOutcrop?: boolean;
	rightLayout?: boolean;
	campIdentityImageMode?: boolean;
	update?: () => void;
	[key: string]: any;
}

export {};
