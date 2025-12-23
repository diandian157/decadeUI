import { lib, game, ui, get, ai, _status } from "noname";
import { prefixMarkModule } from "../js/prefixMark.js";
import { initPrecontentUI } from "../js/jindutiao.js";
import { initCardAlternateNameVisible } from "../js/cardname.js";

export async function precontent() {
	const mode = get.mode();
	const EXCLUDED_MODES = ["chess", "tafang", "hs_hearthstone"];
	if (EXCLUDED_MODES.includes(mode)) return;

	if (lib.config[`extension_${decadeUIName}_eruda`]) {
		const script = document.createElement("script");
		script.src = `${decadeUIPath}js/eruda.js`;
		document.body.appendChild(script);
		script.onload = () => {
			eruda.init();
		};
	}

	if (window.require && !window.fs) {
		window.fs = require("fs");
	}

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

	window.decadeModule = (decadeModule => {
		const version = lib.extensionPack.十周年UI.version;
		const VERSION_CHECK_DELAY = 1000;
		const STYLE_OPTIONS = ["on", "off", "othersOff", "onlineUI", "babysha", "codename"];
		const STYLE_MAP = {
			on: 2,
			off: 1,
			othersOff: 3,
			onlineUI: 4,
			babysha: 5,
			codename: 6,
		};
		const DEFAULT_STYLE_INDEX = 2;

		const compareVersions = (v1, v2) => {
			const parts1 = v1.split(".").map(Number);
			const parts2 = v2.split(".").map(Number);
			const maxLen = Math.max(parts1.length, parts2.length);
			for (let i = 0; i < maxLen; i++) {
				const p1 = parts1[i] || 0;
				const p2 = parts2[i] || 0;
				if (p1 > p2) return 1;
				if (p1 < p2) return -1;
			}
			return 0;
		};

		const checkVersionCompatibility = () => {
			const currentVersion = lib.version;
			const requiredVersion = lib.extensionPack.十周年UI.minNonameVersion;
			const comparison = compareVersions(currentVersion, requiredVersion);
			if (comparison === 0) return;

			const versionMessages = {
				[-1]: {
					title: "版本不匹配警告！",
					content: `十周年UI要求无名杀版本：${requiredVersion}\n当前无名杀版本：${currentVersion}\n\n请更新无名杀到 ${requiredVersion} 版本以确保十周年UI正常运行。`,
				},
				[1]: {
					title: "版本不匹配警告！",
					content: `当前无名杀版本：${currentVersion}\n十周年UI版本：${requiredVersion}\n\n当前十周年UI版本过低，请更新十周年UI到 ${currentVersion} 版本以确保十周年UI正常运行。`,
				},
			};

			const messageConfig = versionMessages[comparison];
			if (!messageConfig) return;

			const message = `${messageConfig.title}\n\n${messageConfig.content}\n\n点击确定继续游戏，但是所遇到的bug均不受理。`;
			setTimeout(() => {
				if (confirm(message)) {
					game.print("已确认版本不匹配，继续游戏...");
				}
			}, VERSION_CHECK_DELAY);
		};

		checkVersionCompatibility();

		if (!ui.css.layout) return;
		if (!ui.css.layout.href?.includes("long2")) {
			ui.css.layout.href = `${lib.assetURL}layout/long2/layout.css`;
		}

		const createScriptElement = (path, isAsync = false) => {
			const existingScript = document.querySelector(`script[src*="${path}"]`);
			if (existingScript) return existingScript;

			const script = document.createElement("script");
			if (isAsync) {
				script.async = true;
				script.defer = true;
			}
			script.src = `${path}?v=${version}&t=${Date.now()}`;
			script.onload = () => {
				console.log(`JS${isAsync ? " (async)" : ""} loaded: ${path}`);
				script.remove();
			};
			script.onerror = () => {
				console.error(`Failed to load JS${isAsync ? " (async)" : ""}: ${path}`);
				script.remove();
			};
			document.head.appendChild(script);
			return script;
		};

		const createLinkElement = path => {
			const existingLink = document.querySelector(`link[href*="${path}"]`);
			if (existingLink) return existingLink;

			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = `${path}?v=${version}&t=${Date.now()}`;
			link.onerror = () => {
				console.warn(`Failed to load CSS: ${path}`);
			};
			document.head.appendChild(link);
			return link;
		};

		decadeModule.init = function () {
			const cssFiles = ["css/extension.css", "css/decadeLayout.css", "css/card.css", "css/meihua.css"];
			cssFiles.forEach(path => this.css(`${decadeUIPath}${path}`));

			const style = lib.config.extension_十周年UI_newDecadeStyle;
			const styleIndex = STYLE_OPTIONS.indexOf(style);
			const playerCssIndex = style !== undefined ? styleIndex + 1 : 2;
			this.css(`${decadeUIPath}css/player${playerCssIndex}.css`);

			this.css(`${decadeUIPath}css/equip.css`);
			document.body.setAttribute("data-style", style ?? "on");
			this.css(`${decadeUIPath}css/layout.css`);

			if (lib.config.extension_十周年UI_meanPrettify) {
				this.css(`${decadeUIPath}css/menu.css`);
			}

			const jsFiles = ["js/spine.js", "js/component.js", "js/skill.js", "js/effect.js", "js/meihua.js", "js/luckycard.js", "js/jdts.js", "js/equipHand.js", "js/audioHooks.js", "js/cardPrompt.js", "js/animation.js", "js/dynamicSkin.js", "js/skillDieAudio.js", "js/autoSelect.js"];
			jsFiles.forEach(path => this.jsAsync(`${decadeUIPath}${path}`));

			if (!lib.config.asset_version) {
				game.saveConfig("asset_version", "无");
			}

			const layoutPath = `${decadeUIPath}shoushaUI/`;
			const listmap = STYLE_MAP[style] ?? DEFAULT_STYLE_INDEX;
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

		decadeModule.js = path => {
			if (!path) {
				console.error("path is required");
				return;
			}
			return createScriptElement(path, false);
		};

		decadeModule.jsAsync = path => {
			if (!path) {
				console.error("path is required");
				return;
			}
			return createScriptElement(path, true);
		};

		decadeModule.css = path => {
			if (!path) {
				console.error("path is required");
				return;
			}
			return createLinkElement(path);
		};

		decadeModule.import = function (module) {
			if (!this.modules) this.modules = [];
			if (typeof module !== "function") {
				console.error("import failed: module must be a function");
				return;
			}
			this.modules.push(module);
		};

		decadeModule.prefixMark = prefixMarkModule;

		decadeModule.hotReloadCSS = path => {
			const existingLink = document.querySelector(`link[href*="${path}"]`);
			if (existingLink) {
				existingLink.href = `${path}?v=${version}&t=${Date.now()}`;
				return existingLink;
			}
			return this.css(path);
		};

		decadeModule.hotReloadJS = (path, isAsync = false) => {
			const existingScript = document.querySelector(`script[src*="${path}"]`);
			if (existingScript) {
				existingScript.remove();
			}
			return isAsync ? this.jsAsync(path) : this.js(path);
		};

		return decadeModule.init();
	})({});

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
					if (startBeforeFunction) {
						startBeforeFunction.apply(this, args);
					}
				};
			},
		},
		_connectMode: {
			value: false,
			writable: true,
		},
	});

	const ensureListenersArray = (obj, key) => {
		if (!obj[key]) {
			obj[key] = [];
		}
	};

	window.app = {
		each(obj, fn, node) {
			if (!obj) return node;
			if (typeof obj.length === "number") {
				for (let i = 0; i < obj.length; i++) {
					if (fn.call(node, obj[i], i) === false) {
						break;
					}
				}
				return node;
			}
			for (const i in obj) {
				if (fn.call(node, obj[i], i) === false) {
					break;
				}
			}
			return node;
		},

		isFunction(fn) {
			return typeof fn === "function";
		},

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
			ext(path, ext) {
				return `${lib.assetURL}extension/${ext || app.name}/${path}`;
			},
		},

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
			const listens = this.listens[event] || [];
			listens.forEach(item => {
				if (typeof item === "function") {
					item.apply(null, args);
				} else if (typeof item.listen === "function") {
					item.listen.apply(null, args);
					if (item.remove) {
						const idx = listens.indexOf(item);
						if (idx > -1) listens.splice(idx, 1);
					}
				}
			});
		},

		import(fn) {
			const obj = fn(lib, game, ui, get, ai, _status, app);
			if (obj) {
				if (obj.name) this.pluginsMap[obj.name] = obj;
				if (obj.precontent && (!obj.filter || obj.filter())) {
					obj.precontent();
				}
			}
			this.plugins.push(obj);
		},

		importPlugin(data, setText) {
			if (!window.JSZip) {
				const args = Array.from(arguments);
				lib.init.js(`${lib.assetURL}game`, "jszip", () => {
					app.importPlugin.apply(app, args);
				});
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

		loadPlugins(callback) {
			game.getFileList(`extension/${app.name}`, folders => {
				const total = folders.length;
				let current = 0;

				if (total === current) {
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
						e => {
							console.info(e);
							loaded();
						}
					);
				};

				const styleFileMap = {
					on: "main1.js",
					othersOff: "main3.js",
				};
				const fileName = styleFileMap[lib.config.extension_十周年UI_newDecadeStyle] ?? "main2.js";

				folders.forEach(dir => {
					readAndEval(dir, fileName);
				});
			});
		},

		reWriteFunction(target, name, replace, str) {
			if (name && typeof name === "object") {
				return app.each(name, (item, index) => app.reWriteFunction(target, index, item[0], item[1]), target);
			}

			if ((typeof replace === "string" || replace instanceof RegExp) && (typeof str === "string" || str instanceof RegExp)) {
				const funcStr = target[name].toString().replace(replace, str);
				eval(`target.${name} = ${funcStr}`);
			} else {
				const func = target[name];
				target[name] = function (...args) {
					let result;
					let cancel;
					if (typeof replace === "function") {
						cancel = replace.apply(this, [args, ...args]);
					}
					if (typeof func === "function" && !cancel) {
						result = func.apply(this, args);
					}
					if (typeof str === "function") {
						str.apply(this, [result, ...args]);
					}
					return cancel ?? result;
				};
			}
			return target[name];
		},

		reWriteFunctionX(target, name, replace) {
			if (name && typeof name === "object") {
				return app.each(name, (item, index) => app.reWriteFunction(target, index, item), target);
			}

			if (Array.isArray(replace)) {
				let [item1, item2, item3] = replace;
				if (item3 === "append") {
					item2 = item1 + item2;
				} else if (item3 === "insert") {
					item2 = item2 + item1;
				}

				if (typeof item1 === "string") {
					item1 = new RegExp(item1);
				}

				if (item1 instanceof RegExp && typeof item2 === "string") {
					const funcStr = target[name].toString().replace(item1, item2);
					eval(`target.${name} = ${funcStr}`);
				} else {
					const func = target[name];
					target[name] = function (...args) {
						let result;
						if (app.isFunction(item1)) {
							result = item1.apply(this, [args, ...args]);
						}
						if (app.isFunction(func) && !result) {
							result = func.apply(this, args);
						}
						if (app.isFunction(item2)) {
							item2.apply(this, [result, ...args]);
						}
						return result;
					};
				}
			} else {
				console.info(arguments);
			}
			return target[name];
		},

		waitAllFunction(fnList, callback) {
			const list = fnList.slice();
			const runNext = () => {
				const item = list.shift();
				if (typeof item === "function") {
					item(runNext);
				} else if (list.length === 0) {
					callback();
				} else {
					runNext();
				}
			};
			runNext();
		},

		element: {
			runNext: {
				setTip(tip) {
					console.info(tip);
				},
			},
		},

		get: {
			skillInfo(skill, node) {
				const obj = { id: skill };
				if (lib.translate[`${skill}_ab`]) {
					obj.name = lib.translate[`${skill}_ab`];
					obj.nameSimple = lib.translate[`${skill}_ab`];
				} else if (lib.translate[skill]) {
					obj.name = lib.translate[skill];
					obj.nameSimple = lib.translate[skill].slice(0, 2);
				}

				obj.info = lib.skill[skill];
				if (node) {
					if (node.forbiddenSkills?.[skill]) obj.forbidden = true;
					if (node.disabledSkills?.[skill]) obj.disabled = true;
					if (obj.info?.temp || !node.skills?.includes(skill)) obj.temp = true;
					if (obj.info?.frequent || obj.info?.subfrequent) obj.frequent = true;
					if (obj.info?.clickable && node.isIn() && node.isUnderControl(true)) obj.clickable = true;
					if (obj.info?.nobracket) obj.nobracket = true;
				}

				obj.translation = get.skillInfoTranslation(skill, undefined, false);
				obj.translationSource = lib.translate[`${skill}_info`];
				obj.translationAppend = lib.translate[`${skill}_append`];
				obj.type = obj.info?.enable ? "enable" : "trigger";
				return obj;
			},
		},

		listen(node, func) {
			const eventType = lib.config.touchscreen ? "touchend" : "click";
			node.addEventListener(eventType, func);
			return () => {
				node.removeEventListener(eventType, func);
			};
		},

		mockTouch(node) {
			const eventType = lib.config.touchscreen ? "touchend" : "click";
			const event = new Event(eventType);
			node.dispatchEvent(event);
			return node;
		},

		nextTick(func, time) {
			const funcs = Array.isArray(func) ? func.slice() : [func];
			const next = () => {
				const item = funcs.shift();
				if (item) {
					setTimeout(() => {
						item();
						next();
					}, time || 0);
				}
			};
			next();
		},
	};

	if (!lib.config.asset_version) {
		game.saveConfig("asset_version", "无");
	}

	if (lib.config.dev) {
		window.app = app;
	}

	if (!game._decadeUI_fixMoveAnimZoom) {
		game._decadeUI_fixMoveAnimZoom = true;
		const normalizeZoom = () => {
			const z = game.documentZoom;
			if (typeof z !== "number" || !isFinite(z) || z <= 0) {
				game.documentZoom = 1;
			}
		};
		if (typeof game.$swapElement === "function") {
			const _swap = game.$swapElement;
			game.$swapElement = function () {
				normalizeZoom();
				return _swap.apply(this, arguments);
			};
		}
		if (typeof game.$elementGoto === "function") {
			const _goto = game.$elementGoto;
			game.$elementGoto = function (element, parent, position, duration, timefun) {
				normalizeZoom();
				const fromParent = element && element.parentElement;
				const toParent = parent;
				const restore = [];
				const forceVisible = p => {
					if (!p || !p.style) return;
					restore.push([p, p.style.overflow]);
					p.style.overflow = "visible";
				};
				forceVisible(fromParent);
				forceVisible(toParent);
				try {
					const ret = _goto.call(this, element, parent, position, duration, timefun);
					if (ret && typeof ret.then === "function") {
						return ret.finally(() => {
							for (let i = restore.length - 1; i >= 0; i--) {
								const [p, ov] = restore[i];
								p.style.overflow = ov;
							}
						});
					}
					for (let i = restore.length - 1; i >= 0; i--) {
						const [p, ov] = restore[i];
						p.style.overflow = ov;
					}
					return ret;
				} catch (e) {
					for (let i = restore.length - 1; i >= 0; i--) {
						const [p, ov] = restore[i];
						p.style.overflow = ov;
					}
					throw e;
				}
			};
		}
	}

	initPrecontentUI();
	initCardAlternateNameVisible();
}
