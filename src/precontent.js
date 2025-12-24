import { lib, game, ui, get, ai, _status } from "noname";
import { prefixMarkModule } from "../js/prefixMark.js";
import { initPrecontentUI } from "./ui/progress-bar.js";
import { initCardAlternateNameVisible } from "./ui/cardAlternateName.js";

// 排除的游戏模式
const EXCLUDED_MODES = ["chess", "tafang", "hs_hearthstone"];

// 样式配置映射
const STYLE_OPTIONS = ["on", "off", "othersOff", "onlineUI", "babysha", "codename"];
const STYLE_MAP = { on: 2, off: 1, othersOff: 3, onlineUI: 4, babysha: 5, codename: 6 };

// 版本比较：返回 1(v1>v2), -1(v1<v2), 0(相等)
const compareVersions = (v1, v2) => {
	const parts1 = v1.split(".").map(Number);
	const parts2 = v2.split(".").map(Number);
	const maxLen = Math.max(parts1.length, parts2.length);
	for (let i = 0; i < maxLen; i++) {
		const p1 = parts1[i] || 0;
		const p2 = parts2[i] || 0;
		if (p1 !== p2) return p1 > p2 ? 1 : -1;
	}
	return 0;
};

// 检查版本兼容性
const checkVersionCompatibility = () => {
	const currentVersion = lib.version;
	const requiredVersion = lib.extensionPack.十周年UI.minNonameVersion;
	const comparison = compareVersions(currentVersion, requiredVersion);
	if (comparison === 0) return;

	const messages = {
		[-1]: `十周年UI要求无名杀版本：${requiredVersion}\n当前版本：${currentVersion}\n请更新无名杀。`,
		[1]: `当前无名杀版本：${currentVersion}\n十周年UI版本过低，请更新十周年UI。`,
	};

	const msg = messages[comparison];
	if (msg) {
		setTimeout(() => {
			if (confirm(`版本不匹配警告！\n\n${msg}\n\n点击确定继续游戏，但遇到的bug均不受理。`)) {
				game.print("已确认版本不匹配，继续游戏...");
			}
		}, 1000);
	}
};

// 创建脚本元素
const createScriptElement = (path, isAsync = false) => {
	if (document.querySelector(`script[src*="${path}"]`)) return;
	const version = lib.extensionPack.十周年UI.version;
	const script = document.createElement("script");
	if (isAsync) {
		script.async = true;
		script.defer = true;
	}
	script.src = `${path}?v=${version}&t=${Date.now()}`;
	script.onload = () => script.remove();
	script.onerror = () => script.remove();
	document.head.appendChild(script);
	return script;
};

// 创建样式链接元素
const createLinkElement = path => {
	if (document.querySelector(`link[href*="${path}"]`)) return;
	const version = lib.extensionPack.十周年UI.version;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `${path}?v=${version}&t=${Date.now()}`;
	document.head.appendChild(link);
	return link;
};

// 初始化decadeModule
const initDecadeModule = () => {
	checkVersionCompatibility();

	if (!ui.css.layout) return {};
	if (!ui.css.layout.href?.includes("long2")) {
		ui.css.layout.href = `${lib.assetURL}layout/long2/layout.css`;
	}

	const module = {
		js: path => path && createScriptElement(path, false),
		jsAsync: path => path && createScriptElement(path, true),
		css: path => path && createLinkElement(path),
		modules: [],
		import(mod) {
			if (typeof mod === "function") this.modules.push(mod);
		},
		prefixMark: prefixMarkModule,
	};

	// 初始化CSS和JS
	module.init = function () {
		const cssFiles = ["css/extension.css", "css/decadeLayout.css", "css/card.css", "css/meihua.css"];
		cssFiles.forEach(path => this.css(`${decadeUIPath}${path}`));

		const style = lib.config.extension_十周年UI_newDecadeStyle;
		const styleIndex = STYLE_OPTIONS.indexOf(style);
		this.css(`${decadeUIPath}css/player${styleIndex !== -1 ? styleIndex + 1 : 2}.css`);
		this.css(`${decadeUIPath}css/equip.css`);
		this.css(`${decadeUIPath}css/layout.css`);
		document.body.setAttribute("data-style", style ?? "on");

		if (lib.config.extension_十周年UI_meanPrettify) {
			this.css(`${decadeUIPath}css/menu.css`);
		}

		const jsFiles = ["js/spine.js", "js/meihua.js", "js/luckycard.js"];
		jsFiles.forEach(path => this.jsAsync(`${decadeUIPath}${path}`));

		// 加载样式相关资源
		const layoutPath = `${decadeUIPath}shoushaUI/`;
		const listmap = STYLE_MAP[style] ?? 2;
		const currentMode = get.mode();

		if (!EXCLUDED_MODES.includes(currentMode)) {
			["character", "lbtn", "skill"].forEach(pack => {
				const cssPath = pack === "character" ? `${layoutPath}${pack}/main${listmap}.css` : `${layoutPath}${pack}/main${listmap}${lib.config.phonelayout ? "" : "_window"}.css`;
				this.css(cssPath);
				this.jsAsync(`${layoutPath}${pack}/main${listmap}.js`);
			});
		}

		return this;
	};

	return module.init();
};

// 初始化调试助手
const initEruda = () => {
	if (!lib.config[`extension_${decadeUIName}_eruda`]) return;
	const script = document.createElement("script");
	script.src = `${decadeUIPath}js/eruda.js`;
	script.onload = () => eruda.init();
	document.body.appendChild(script);
};

// 初始化Node.js文件系统
const initNodeFS = () => {
	if (window.require && !window.fs) {
		window.fs = require("fs");
	}
};

// 设置布局可视化菜单
const setupLayoutVisualMenu = () => {
	lib.configMenu.appearence.config.layout.visualMenu = (node, link) => {
		node.className = `button character themebutton ${lib.config.theme}`;
		node.classList.add(link);
		if (node.created) return;
		node.created = true;
		node.style.overflow = "scroll";
		const list = ["re_caocao", "re_liubei", "sp_zhangjiao", "sunquan"];
		while (list.length) {
			ui.create.div(".avatar", ui.create.div(".seat-player.fakeplayer", node)).setBackground(list.randomRemove(), "character");
		}
	};
};

// 设置联机模式监听
const setupConnectMode = () => {
	Object.defineProperties(_status, {
		connectMode: {
			configurable: true,
			get() {
				return this._connectMode;
			},
			set(value) {
				this._connectMode = value;
				if (!value || !lib.extensions) return;

				const decadeExtension = lib.extensions.find(ext => ext[0] === decadeUIName);
				if (!decadeExtension) return;

				const startBeforeFunction = lib.init.startBefore;
				lib.init.startBefore = function (...args) {
					try {
						_status.extension = decadeExtension[0];
						_status.evaluatingExtension = decadeExtension[3];
						decadeExtension[1](decadeExtension[2], decadeExtension[4]);
						delete _status.extension;
						delete _status.evaluatingExtension;
						console.log(`%c${decadeUIName}: 联机成功`, "color:blue");
					} catch (e) {
						console.error(e);
					}
					startBeforeFunction?.apply(this, args);
				};
			},
		},
		_connectMode: { value: false, writable: true },
	});
};

// 修复移动动画缩放问题
const fixMoveAnimZoom = () => {
	if (game._decadeUI_fixMoveAnimZoom) return;
	game._decadeUI_fixMoveAnimZoom = true;

	const normalizeZoom = () => {
		const z = game.documentZoom;
		if (typeof z !== "number" || !isFinite(z) || z <= 0) {
			game.documentZoom = 1;
		}
	};

	// 修复$swapElement
	if (typeof game.$swapElement === "function") {
		const _swap = game.$swapElement;
		game.$swapElement = function () {
			normalizeZoom();
			return _swap.apply(this, arguments);
		};
	}

	// 修复$elementGoto
	if (typeof game.$elementGoto === "function") {
		const _goto = game.$elementGoto;
		game.$elementGoto = function (element, parent, position, duration, timefun) {
			normalizeZoom();
			const fromParent = element?.parentElement;
			const toParent = parent;
			const restore = [];

			const forceVisible = p => {
				if (!p?.style) return;
				restore.push([p, p.style.overflow]);
				p.style.overflow = "visible";
			};
			forceVisible(fromParent);
			forceVisible(toParent);

			const restoreOverflow = () => {
				restore.forEach(([p, ov]) => {
					p.style.overflow = ov;
				});
			};

			try {
				const ret = _goto.call(this, element, parent, position, duration, timefun);
				if (ret?.then) return ret.finally(restoreOverflow);
				restoreOverflow();
				return ret;
			} catch (e) {
				restoreOverflow();
				throw e;
			}
		};
	}
};

// 初始化app全局对象
const initApp = () => {
	const ensureListenersArray = (obj, key) => {
		if (!obj[key]) obj[key] = [];
	};

	window.app = {
		// 遍历工具
		each(obj, fn, node) {
			if (!obj) return node;
			if (typeof obj.length === "number") {
				for (let i = 0; i < obj.length; i++) {
					if (fn.call(node, obj[i], i) === false) break;
				}
			} else {
				for (const i in obj) {
					if (fn.call(node, obj[i], i) === false) break;
				}
			}
			return node;
		},

		isFunction: fn => typeof fn === "function",

		// 事件系统
		event: {
			listens: {},
			on(name, listen, remove) {
				ensureListenersArray(this.listens, name);
				this.listens[name].push({ listen, remove });
				return this;
			},
			off(name, listen) {
				return app.each(
					this.listens[name],
					(item, index) => {
						if (listen === item || listen === item.listen) {
							this.listens[name].splice(index, 1);
						}
					},
					this
				);
			},
			emit(name, ...args) {
				return app.each(
					this.listens[name],
					item => {
						item.listen(...args);
						if (item.remove) this.off(name, item);
					},
					this
				);
			},
			once(name, listen) {
				return this.on(name, listen, true);
			},
		},

		create: {},
		listens: {},
		plugins: [],
		pluginsMap: {},

		path: {
			ext: (path, ext) => `${lib.assetURL}extension/${ext || app.name}/${path}`,
		},

		// 事件监听
		on(event, listen) {
			ensureListenersArray(this.listens, event);
			this.listens[event].push(listen);
		},
		once(event, listen) {
			ensureListenersArray(this.listens, event);
			this.listens[event].push({ listen, remove: true });
		},
		off(event, listen) {
			const listens = this.listens[event] || [];
			const filters = listen ? listens.filter(item => item === listen || item.listen === listen) : listens.slice();
			filters.forEach(item => {
				const idx = listens.indexOf(item);
				if (idx > -1) listens.splice(idx, 1);
			});
		},
		emit(event, ...args) {
			(this.listens[event] || []).forEach(item => {
				if (typeof item === "function") {
					item(...args);
				} else if (typeof item.listen === "function") {
					item.listen(...args);
					if (item.remove) {
						const idx = this.listens[event].indexOf(item);
						if (idx > -1) this.listens[event].splice(idx, 1);
					}
				}
			});
		},

		// 插件导入
		import(fn) {
			const obj = fn(lib, game, ui, get, ai, _status, app);
			if (obj) {
				if (obj.name) this.pluginsMap[obj.name] = obj;
				if (obj.precontent && (!obj.filter || obj.filter())) obj.precontent();
			}
			this.plugins.push(obj);
		},

		// 插件文件导入
		importPlugin(data, setText) {
			if (!window.JSZip) {
				lib.init.js(`${lib.assetURL}game`, "jszip", () => app.importPlugin(data, setText));
				return;
			}

			setText = typeof setText === "function" ? setText : () => {};
			const zip = new JSZip(data);
			const dirList = [];
			const fileList = [];

			for (const i in zip.files) {
				if (/\/$/.test(i)) {
					dirList.push(`extension/${app.name}/${i}`);
				} else if (!/^extension\.(js|css)$/.test(i)) {
					const pathParts = i.split("/");
					pathParts.pop();
					fileList.push({
						id: i,
						path: `extension/${app.name}/${pathParts.join("/")}`,
						name: pathParts[pathParts.length - 1] || i.split("/").pop(),
						target: zip.files[i],
					});
				}
			}

			const total = dirList.length + fileList.length;
			let finish = 0;
			const isNode = lib.node?.fs;

			const writeFile = () => {
				const file = fileList.shift();
				if (file) {
					setText(`正在导入(${++finish}/${total})...`);
					const buffer = isNode ? file.target.asNodeBuffer() : file.target.asArrayBuffer();
					game.writeFile(buffer, file.path, file.name, writeFile);
				} else {
					alert("导入完成");
					setText("导入插件");
				}
			};

			const ensureDir = () => {
				if (dirList.length) {
					setText(`正在导入(${++finish}/${total})...`);
					game.ensureDirectory(dirList.shift(), ensureDir);
				} else {
					writeFile();
				}
			};
			ensureDir();
		},

		// 加载插件
		loadPlugins(callback) {
			game.getFileList(`extension/${app.name}`, folders => {
				const total = folders.length;
				let current = 0;
				if (total === 0) {
					callback();
					return;
				}

				const loaded = () => {
					if (++current === total) callback();
				};

				const readAndEval = (dir, file) => {
					game.readFile(
						`extension/${app.name}/${dir}/${file}`,
						data => {
							const binary = new Uint8Array(data);
							const blob = new Blob([binary]);
							const reader = new FileReader();
							reader.readAsText(blob);
							reader.onload = () => {
								eval(reader.result);
								loaded();
							};
						},
						() => loaded()
					);
				};

				const styleFileMap = { on: "main1.js", othersOff: "main3.js" };
				const fileName = styleFileMap[lib.config.extension_十周年UI_newDecadeStyle] ?? "main2.js";
				folders.forEach(dir => readAndEval(dir, fileName));
			});
		},

		// 函数重写工具
		reWriteFunction(target, name, replace, str) {
			if (name && typeof name === "object") {
				return app.each(name, (item, index) => app.reWriteFunction(target, index, item[0], item[1]), target);
			}

			if ((typeof replace === "string" || replace instanceof RegExp) && (typeof str === "string" || str instanceof RegExp)) {
				eval(`target.${name} = ${target[name].toString().replace(replace, str)}`);
			} else {
				const func = target[name];
				target[name] = function (...args) {
					let cancel = typeof replace === "function" ? replace.apply(this, [args, ...args]) : undefined;
					let result = typeof func === "function" && !cancel ? func.apply(this, args) : undefined;
					if (typeof str === "function") str.apply(this, [result, ...args]);
					return cancel ?? result;
				};
			}
			return target[name];
		},

		reWriteFunctionX(target, name, replace) {
			if (name && typeof name === "object") {
				return app.each(name, (item, index) => app.reWriteFunction(target, index, item), target);
			}

			if (!Array.isArray(replace)) return target[name];

			let [item1, item2, item3] = replace;
			if (item3 === "append") item2 = item1 + item2;
			else if (item3 === "insert") item2 = item2 + item1;

			if (typeof item1 === "string") item1 = new RegExp(item1);

			if (item1 instanceof RegExp && typeof item2 === "string") {
				eval(`target.${name} = ${target[name].toString().replace(item1, item2)}`);
			} else {
				const func = target[name];
				target[name] = function (...args) {
					let result = app.isFunction(item1) ? item1.apply(this, [args, ...args]) : undefined;
					if (app.isFunction(func) && !result) result = func.apply(this, args);
					if (app.isFunction(item2)) item2.apply(this, [result, ...args]);
					return result;
				};
			}
			return target[name];
		},

		// 等待所有函数执行完成
		waitAllFunction(fnList, callback) {
			const list = fnList.slice();
			const runNext = () => {
				const item = list.shift();
				if (typeof item === "function") item(runNext);
				else if (list.length === 0) callback();
				else runNext();
			};
			runNext();
		},

		element: { runNext: { setTip: tip => console.info(tip) } },

		// 获取技能信息
		get: {
			skillInfo(skill, node) {
				const obj = { id: skill };
				const info = lib.skill[skill];
				obj.info = info;

				// 名称
				obj.name = lib.translate[`${skill}_ab`] || lib.translate[skill];
				obj.nameSimple = lib.translate[`${skill}_ab`] || lib.translate[skill]?.slice(0, 2);

				// 状态
				if (node) {
					obj.forbidden = !!node.forbiddenSkills?.[skill];
					obj.disabled = !!node.disabledSkills?.[skill];
					obj.temp = info?.temp || !node.skills?.includes(skill);
					obj.frequent = !!(info?.frequent || info?.subfrequent);
					obj.clickable = !!(info?.clickable && node.isIn() && node.isUnderControl(true));
					obj.nobracket = !!info?.nobracket;
				}

				obj.translation = get.skillInfoTranslation(skill, undefined, false);
				obj.translationSource = lib.translate[`${skill}_info`];
				obj.translationAppend = lib.translate[`${skill}_append`];
				obj.type = info?.enable ? "enable" : "trigger";
				return obj;
			},
		},

		// 事件监听工具
		listen(node, func) {
			const eventType = lib.config.touchscreen ? "touchend" : "click";
			node.addEventListener(eventType, func);
			return () => node.removeEventListener(eventType, func);
		},

		mockTouch(node) {
			const eventType = lib.config.touchscreen ? "touchend" : "click";
			node.dispatchEvent(new Event(eventType));
			return node;
		},

		// 延迟执行
		nextTick(func, time) {
			const funcs = Array.isArray(func) ? func.slice() : [func];
			const next = () => {
				const item = funcs.shift();
				if (item)
					setTimeout(() => {
						item();
						next();
					}, time || 0);
			};
			next();
		},
	};

	if (lib.config.dev) window.app = app;
};

// 主入口
export async function precontent() {
	const mode = get.mode();
	if (EXCLUDED_MODES.includes(mode)) return;

	initEruda();
	initNodeFS();
	setupLayoutVisualMenu();

	window.decadeModule = initDecadeModule();

	setupConnectMode();
	initApp();

	if (!lib.config.asset_version) {
		game.saveConfig("asset_version", "无");
	}

	fixMoveAnimZoom();
	initPrecontentUI();
	initCardAlternateNameVisible();
}
