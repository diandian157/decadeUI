/**
 * @fileoverview App全局对象模块，提供事件系统、插件管理和工具函数
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * 初始化app全局对象
 */
export function initApp() {
	/**
	 * 确保监听器数组存在
	 * @param {Object} obj - 目标对象
	 * @param {string} key - 键名
	 */
	const ensureListenersArray = (obj, key) => {
		if (!obj[key]) obj[key] = [];
	};

	window.app = {
		/**
		 * 遍历对象或数组
		 * @param {Object|Array} obj - 要遍历的对象
		 * @param {Function} fn - 回调函数
		 * @param {*} node - 上下文
		 * @returns {*} 上下文
		 */
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

		/**
		 * 判断是否为函数
		 * @param {*} fn - 要判断的值
		 * @returns {boolean} 是否为函数
		 */
		isFunction: fn => typeof fn === "function",

		/** 事件系统 */
		event: {
			/** @type {Object} 事件监听器映射 */
			listens: {},
			/**
			 * 注册事件监听
			 * @param {string} name - 事件名
			 * @param {Function} listen - 监听函数
			 * @param {boolean} remove - 是否单次触发后移除
			 * @returns {Object} this
			 */
			on(name, listen, remove) {
				ensureListenersArray(this.listens, name);
				this.listens[name].push({ listen, remove });
				return this;
			},
			/**
			 * 移除事件监听
			 * @param {string} name - 事件名
			 * @param {Function} listen - 监听函数
			 * @returns {Object} this
			 */
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
			/**
			 * 触发事件
			 * @param {string} name - 事件名
			 * @param {...*} args - 参数
			 * @returns {Object} this
			 */
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
			/**
			 * 注册单次事件监听
			 * @param {string} name - 事件名
			 * @param {Function} listen - 监听函数
			 * @returns {Object} this
			 */
			once(name, listen) {
				return this.on(name, listen, true);
			},
		},

		create: {},
		listens: {},
		plugins: [],
		pluginsMap: {},

		path: {
			/**
			 * 获取扩展资源路径
			 * @param {string} path - 相对路径
			 * @param {string} ext - 扩展名
			 * @returns {string} 完整路径
			 */
			ext: (path, ext) => `${lib.assetURL}extension/${ext || app.name}/${path}`,
		},

		/**
		 * 注册事件监听
		 * @param {string} event - 事件名
		 * @param {Function} listen - 监听函数
		 */
		on(event, listen) {
			ensureListenersArray(this.listens, event);
			this.listens[event].push(listen);
		},

		/**
		 * 注册单次事件监听
		 * @param {string} event - 事件名
		 * @param {Function} listen - 监听函数
		 */
		once(event, listen) {
			ensureListenersArray(this.listens, event);
			this.listens[event].push({ listen, remove: true });
		},

		/**
		 * 移除事件监听
		 * @param {string} event - 事件名
		 * @param {Function} listen - 监听函数
		 */
		off(event, listen) {
			const listens = this.listens[event] || [];
			const filters = listen ? listens.filter(item => item === listen || item.listen === listen) : listens.slice();
			filters.forEach(item => {
				const idx = listens.indexOf(item);
				if (idx > -1) listens.splice(idx, 1);
			});
		},

		/**
		 * 触发事件
		 * @param {string} event - 事件名
		 * @param {...*} args - 参数
		 */
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

		/**
		 * 导入插件
		 * @param {Function} fn - 插件工厂函数
		 */
		import(fn) {
			const obj = fn(lib, game, ui, get, ai, _status, app);
			if (obj) {
				if (obj.name) this.pluginsMap[obj.name] = obj;
				if (obj.precontent && (!obj.filter || obj.filter())) obj.precontent();
			}
			this.plugins.push(obj);
		},

		/**
		 * 导入插件文件
		 * @param {ArrayBuffer} data - 文件数据
		 * @param {Function} setText - 进度回调
		 */
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

		/**
		 * 加载插件
		 * @param {Function} callback - 完成回调
		 */
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

		/**
		 * 重写函数
		 * @param {Object} target - 目标对象
		 * @param {string|Object} name - 函数名或配置对象
		 * @param {Function|string|RegExp} replace - 替换内容
		 * @param {string|Function} str - 替换字符串或后置回调
		 * @returns {Function} 重写后的函数
		 */
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

		/**
		 * 扩展版函数重写
		 * @param {Object} target - 目标对象
		 * @param {string|Object} name - 函数名或配置对象
		 * @param {Array} replace - 替换配置数组
		 * @returns {Function} 重写后的函数
		 */
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

		/**
		 * 等待所有函数执行完成
		 * @param {Array<Function>} fnList - 函数列表
		 * @param {Function} callback - 完成回调
		 */
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

		get: {
			/**
			 * 获取技能信息
			 * @param {string} skill - 技能ID
			 * @param {Object} node - 玩家节点
			 * @returns {Object} 技能信息对象
			 */
			skillInfo(skill, node) {
				const obj = { id: skill };
				const info = lib.skill[skill];
				obj.info = info;
				obj.name = lib.translate[`${skill}_ab`] || lib.translate[skill];
				obj.nameSimple = lib.translate[`${skill}_ab`] || lib.translate[skill]?.slice(0, 2);

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

		/**
		 * 添加事件监听
		 * @param {HTMLElement} node - DOM节点
		 * @param {Function} func - 回调函数
		 * @returns {Function} 移除监听的函数
		 */
		listen(node, func) {
			const eventType = lib.config.touchscreen ? "touchend" : "click";
			node.addEventListener(eventType, func);
			return () => node.removeEventListener(eventType, func);
		},

		/**
		 * 模拟触摸/点击事件
		 * @param {HTMLElement} node - DOM节点
		 * @returns {HTMLElement} 节点
		 */
		mockTouch(node) {
			const eventType = lib.config.touchscreen ? "touchend" : "click";
			node.dispatchEvent(new Event(eventType));
			return node;
		},

		/**
		 * 延迟执行函数
		 * @param {Function|Array<Function>} func - 函数或函数数组
		 * @param {number} time - 延迟时间(ms)
		 */
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
}
