/**
 * 无名杀 API Mock
 * 用于单元测试的最小化模拟
 */

// 模拟 lib 对象
export const lib = {
	device: "pc",
	version: "1.10.0",
	character: {
		test_character: ["male", "wei", 3, ["skill1"]],
		zhangliao: ["male", "wei", 4, ["tuxi"]],
	},
	extensionPack: {
		十周年UI: {
			minNonameVersion: "1.10.0",
		},
	},
	config: {},
	assetURL: "",
};

// 模拟 game 对象
export const game = {
	me: null,
	print: console.log,
	saveConfig: (key, value) => {
		lib.config[key] = value;
	},
};

// 模拟 ui 对象
export const ui = {
	arena: null,
	window: null,
	handcards1: null,
	me: null,
};

// 模拟 get 对象
export const get = {
	mode: () => "identity",
	itemtype: obj => {
		if (obj?._isPlayer) return "player";
		if (obj?._isCard) return "card";
		return "unknown";
	},
	translation: key => {
		const translations = {
			wei: "魏",
			shu: "蜀",
			wu: "吴",
			qun: "群",
			jin: "晋",
			ye: "野",
			zhu: "主公",
			zhong: "忠臣",
			nei: "内奸",
			fan: "反贼",
			cai: "菜",
			weiColor: "wei",
			shuColor: "shu",
			friend: "友方",
			enemy: "敌方",
		};
		return translations[key] || key;
	},
	is: {
		jun: player => player?.isJun === true,
	},
	slimNameHorizontal: name => name,
	judge: card => () => 0,
	value: card => 5,
	type: card => card?.type || "basic",
	subtype: card => card?.subtype || "",
};

// 模拟 ai 对象
export const ai = {
	get: {
		attitude: () => 0,
	},
};

// 模拟 _status 对象
export const _status = {
	mode: "standard",
	event: {
		player: null,
	},
};

// 创建模拟玩家对象的工厂函数
export function createMockPlayer(options = {}) {
	// 创建一个继承自 HTMLElement 的模拟对象
	const player = Object.create(HTMLElement.prototype);

	Object.assign(player, {
		_isPlayer: true,
		name: options.name || "test_player",
		name1: options.name1 || options.name || "test_player",
		name2: options.name2 || null,
		identity: options.identity || "zhu",
		special_identity: options.special_identity || null,
		trueIdentity: options.trueIdentity || null,
		side: options.side || "me",
		finalSide: options.finalSide || null,
		sex: options.sex || "male",
		isJun: options.isJun || false,
		identityShown: options.identityShown !== undefined ? options.identityShown : false,
		isAlive: () => (options.isAlive !== undefined ? options.isAlive : true),
		wontYe: () => (options.wontYe !== undefined ? options.wontYe : false),
		hasSkill: skill => options.skills?.includes(skill) || false,
	});

	return player;
}

// 创建模拟卡牌对象的工厂函数
export function createMockCard(options = {}) {
	return {
		_isCard: options._isCard !== undefined ? options._isCard : true,
		name: options.name || "sha",
		type: options.type || "basic",
		subtype: options.subtype || "",
		toself: options.toself || false,
	};
}
