import { lib, ui } from "../../../noname.js";

export const initializeDecadeUIEnvironment = ctx => {
	const sensorNode = ctx.element.create("sensor", document.body);
	sensorNode.id = "decadeUI-body-sensor";
	const bodySensor = new ctx.ResizeSensor(sensorNode);
	const SVG_NS = "http://www.w3.org/2000/svg";
	const svg = document.body.appendChild(document.createElementNS(SVG_NS, "svg"));
	const defs = svg.appendChild(document.createElementNS(SVG_NS, "defs"));
	const clipPaths = [
		{ id: "solo-clip", d: "M0 0 H1 Q1 0.05 0.9 0.06 Q1 0.06 1 0.11 V1 H0 V0.11 Q0 0.06 0.1 0.06 Q0 0.05 0 0 Z" },
		{ id: "duol-clip", d: "M1 0 H0 Q0 0.06 0.15 0.06 Q0 0.06 0 0.11 V1 H1 Z" },
		{ id: "duor-clip", d: "M0 0 H1 Q1 0.06 0.85 0.06 Q1 0.06 1 0.11 V1 H0 Z" },
		{ id: "dskin-clip", d: "M0 0 H1 Q1 0.1 0.94 0.1 Q0.985 0.1 1 0.13 V1 H0 V0.14 Q0 0.11 0.06 0.1 Q0 0.1 0 0 Z" },
	];
	clipPaths.forEach(({ id, d }) => {
		const cp = defs.appendChild(document.createElementNS(SVG_NS, "clipPath"));
		cp.id = id;
		cp.setAttribute("clipPathUnits", "objectBoundingBox");
		cp.appendChild(document.createElementNS(SVG_NS, "path")).setAttribute("d", d);
	});
	document.addEventListener(
		"click",
		e => {
			dui.set.activeElement(e.target);
		},
		true
	);
	const handTipHeight = lib.config["extension_十周年UI_handTipHeight"] || "20";
	document.documentElement.style.setProperty("--hand-tip-bottom", `calc(${handTipHeight}% + 10px)`);
	if (window.get && typeof window.get.cardsetion === "function") {
		const oldCardsetion = window.get.cardsetion;
		window.get.cardsetion = (...args) => {
			try {
				return oldCardsetion.apply(ctx, args);
			} catch (e) {
				if (e?.message?.includes("indexOf")) return "";
				throw e;
			}
		};
	}
	if (window.get && typeof window.get.getPlayerIdentity === "function") {
		const oldGetPlayerIdentity = window.get.getPlayerIdentity;
		window.get.getPlayerIdentity = (player, identity, chinese, isMark) => {
			if (!identity) identity = player.identity;
			if (typeof identity !== "string") identity = "";
			if (player && typeof player.special_identity !== "undefined" && typeof player.special_identity !== "string") {
				player.special_identity = "";
			}
			return oldGetPlayerIdentity.apply(ctx, arguments);
		};
	}
	return bodySensor;
};

export const createDecadeUIDialogModule = () => ({
	create(className, parentNode, tagName) {
		const element = !tagName ? document.createElement("div") : document.createElement(tagName);
		for (const i in decadeUI.dialog) {
			if (decadeUI.dialog[i]) element[i] = decadeUI.dialog[i];
		}
		element.listens = {};
		for (const i in decadeUI.dialog.listens) {
			if (decadeUI.dialog.listens[i]) element.listens[i] = decadeUI.dialog.listens[i];
		}
		element.listens._dialog = element;
		element.listens._list = [];
		if (className) element.className = className;
		if (parentNode) parentNode.appendChild(element);
		return element;
	},
	open() {
		if (this == decadeUI.dialog) return console.error("undefined");
	},
	show() {
		if (this == decadeUI.dialog) return console.error("undefined");
		this.classList.remove("hidden");
	},
	hide() {
		if (this == decadeUI.dialog) return console.error("undefined");
		this.classList.add("hidden");
	},
	animate(property, duration, toArray, fromArrayOptional) {
		if (this == decadeUI.dialog) return console.error("undefined");
		if (property == null || duration == null || toArray == null) return console.error("arguments");
		const propArray = property.replace(/\s*/g, "").split(",");
		if (!propArray || propArray.length == 0) return console.error("property");
		let realDuration = 0;
		if (duration.lastIndexOf("s") != -1) {
			if (duration.lastIndexOf("ms") != -1) {
				duration = duration.replace(/ms/, "");
				duration = parseInt(duration);
				if (isNaN(duration)) return console.error("duration");
				realDuration = duration;
			} else {
				duration = duration.replace(/s/, "");
				duration = parseFloat(duration);
				if (isNaN(duration)) return console.error("duration");
				realDuration = duration * 1000;
			}
		} else {
			duration = parseInt(duration);
			if (isNaN(duration)) return console.error("duration");
			realDuration = duration;
		}
		if (fromArrayOptional) {
			for (let i = 0; i < propArray.length; i++) {
				this.style.setProperty(propArray[i], fromArrayOptional[i]);
			}
		}
		const duraBefore = this.style.transitionDuration;
		const propBefore = this.style.transitionProperty;
		this.style.transitionDuration = realDuration + "ms";
		this.style.transitionProperty = property;
		ui.refresh(this);
		for (let i = 0; i < propArray.length; i++) {
			this.style.setProperty(propArray[i], toArray[i]);
		}
		const restore = this;
		setTimeout(() => {
			restore.style.transitionDuration = duraBefore;
			restore.style.transitionProperty = propBefore;
		}, realDuration);
	},
	close(delayTime, fadeOut) {
		if (this == decadeUI.dialog) return console.error("undefined");
		this.listens.clear();
		if (!this.parentNode) return;
		if (fadeOut === true && delayTime) {
			this.animate("opacity", delayTime, 0);
		}
		if (delayTime) {
			const remove = this;
			delayTime = typeof delayTime == "number" ? delayTime : parseInt(delayTime);
			setTimeout(() => {
				if (remove.parentNode) remove.parentNode.removeChild(remove);
			}, delayTime);
			return;
		}
		this.parentNode.removeChild(this);
		return;
	},
	listens: {
		add(listenElement, event, func, useCapture) {
			if (!this._dialog || !this._list) return console.error("undefined");
			if (!(listenElement instanceof HTMLElement) || !event || typeof func !== "function") return console.error("arguments");
			this._list.push(new Array(listenElement, event, func));
			listenElement.addEventListener(event, func);
		},
		remove(listenElementOptional, eventOptional, funcOptional) {
			if (!this._dialog || !this._list) return console.error("undefined");
			const list = this._list;
			if (listenElementOptional && eventOptional && funcOptional) {
				const index = list.indexOf(new Array(listenElementOptional, eventOptional, funcOptional));
				if (index != -1) {
					list[index][0].removeEventListener(list[index][1], list[index][2]);
					list.splice(index, 1);
					return;
				}
			} else if (listenElementOptional && eventOptional) {
				for (let i = list.length - 1; i >= 0; i--) {
					if (list[i][0] == listenElementOptional && list[i][1] == eventOptional) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list.splice(i, 1);
					}
				}
			} else if (listenElementOptional && funcOptional) {
				for (let i = list.length - 1; i >= 0; i--) {
					if (list[i][0] == listenElementOptional && list[i][2] == funcOptional) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list.splice(i, 1);
					}
				}
			} else if (eventOptional && funcOptional) {
				for (let i = list.length - 1; i >= 0; i--) {
					if (list[i][1] == eventOptional && list[i][2] == funcOptional) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list.splice(i, 1);
					}
				}
			} else if (listenElementOptional) {
				for (let i = list.length - 1; i >= 0; i--) {
					if (list[i][0] == listenElementOptional) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list.splice(i, 1);
					}
				}
			} else if (eventOptional) {
				for (let i = list.length - 1; i >= 0; i--) {
					if (list[i][1] == eventOptional) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list.splice(i, 1);
					}
				}
			} else if (funcOptional) {
				for (let i = list.length - 1; i >= 0; i--) {
					if (list[i][2] == funcOptional) {
						list[i][0].removeEventListener(list[i][1], list[i][2]);
						list.splice(i, 1);
					}
				}
			}
		},
		clear() {
			if (!this._dialog || !this._list) return console.error("undefined");
			const list = this._list;
			for (let i = list.length - 1; i >= 0; i--) {
				list[i][0].removeEventListener(list[i][1], list[i][2]);
				list[i] = undefined;
			}
			list.length = 0;
		},
	},
});

export const createDecadeUIAnimateModule = () => ({
	check() {
		if (!ui.arena) return false;
		if (this.updates == undefined) this.updates = [];
		if (this.canvas == undefined) {
			this.canvas = ui.arena.appendChild(document.createElement("canvas"));
			this.canvas.id = "decadeUI-canvas-arena";
		}
		return true;
	},
	add(frameFunc) {
		if (typeof frameFunc != "function") return;
		if (!this.check()) return;
		const obj = {
			inits: [],
			update: frameFunc,
			id: decadeUI.getRandom(0, 100),
		};
		if (arguments.length > 2) {
			obj.inits = new Array(arguments.length - 2);
			for (let i = 2; i < arguments.length; i++) {
				obj.inits[i - 2] = arguments[i];
			}
		}
		this.updates.push(obj);
		if (this.frameId == undefined) this.frameId = requestAnimationFrame(this.update.bind(this));
	},
	update() {
		const frameTime = performance.now();
		const delta = frameTime - (this.frameTime == undefined ? frameTime : this.frameTime);
		this.frameTime = frameTime;
		const e = {
			canvas: this.canvas,
			context: this.canvas.getContext("2d"),
			deltaTime: delta,
			save() {
				this.context.save();
				return this.context;
			},
			restore() {
				this.context.restore();
				return this.context;
			},
			drawLine(x1, y1, x2, y2, color, lineWidth) {
				if (x1 == null || y1 == null) throw "arguments";
				const context = this.context;
				context.beginPath();
				if (color) context.strokeStyle = color;
				if (lineWidth) context.lineWidth = lineWidth;
				if (x2 == null || y2 == null) {
					context.lineTo(x1, y1);
				} else {
					context.moveTo(x1, y1);
					context.lineTo(x2, y2);
				}
				context.stroke();
			},
			drawRect(x, y, width, height, color, lineWidth) {
				if (x == null || y == null || width == null || height == null) throw "arguments";
				const ctx = this.context;
				ctx.beginPath();
				if (color) ctx.strokeStyle = color;
				if (lineWidth) ctx.lineWidth = lineWidth;
				ctx.rect(x, y, width, height);
				ctx.stroke();
			},
			drawText(text, font, color, x, y, textAlign, textBaseline, stroke) {
				if (!text) return;
				if (x == null || y == null) throw "x or y";
				const context = this.context;
				if (font) context.font = font;
				if (textAlign) context.textAlign = textAlign;
				if (textBaseline) context.textBaseline = textBaseline;
				if (color) {
					if (!stroke) context.fillStyle = color;
					else context.strokeStyle = color;
				}
				if (!stroke) context.fillText(text, x, y);
				else context.strokeText(text, x, y);
			},
			drawStrokeText(text, font, color, x, y, textAlign, textBaseline) {
				this.drawText(text, font, color, x, y, textAlign, textBaseline, true);
			},
			fillRect(x, y, width, height, color) {
				if (color) this.context.fillStyle = color;
				this.context.fillRect(x, y, width, height);
			},
		};
		if (!decadeUI.dataset.animSizeUpdated) {
			decadeUI.dataset.animSizeUpdated = true;
			e.canvas.width = e.canvas.parentNode.offsetWidth;
			e.canvas.height = e.canvas.parentNode.offsetHeight;
		}
		e.canvas.height = e.canvas.height;
		let args;
		let task;
		for (let i = 0; i < this.updates.length; i++) {
			task = this.updates[i];
			args = Array.from(task.inits);
			args.push(e);
			e.save();
			if (task.update.apply(task, args)) {
				this.updates.remove(task);
				i--;
			}
			e.restore();
		}
		if (this.updates.length == 0) {
			this.frameId = undefined;
			this.frameTime = undefined;
			return;
		}
		this.frameId = requestAnimationFrame(this.update.bind(this));
	},
});

export const createResizeSensorClass = () => {
	function ResizeSensor(element) {
		this.element = element;
		this.width = element.clientWidth || 1;
		this.height = element.clientHeight || 1;
		this.maximumWidth = 10000 * this.width;
		this.maximumHeight = 10000 * this.height;
		this.events = [];
		const expand = document.createElement("div");
		expand.style.cssText = "position:absolute;top:0;bottom:0;left:0;right:0;z-index:-10000;overflow:hidden;visibility:hidden;transition:all 0s;";
		const shrink = expand.cloneNode(false);
		const expandChild = document.createElement("div");
		expandChild.style.cssText = "transition: all 0s !important; animation: none !important;";
		const shrinkChild = expandChild.cloneNode(false);
		expandChild.style.width = this.maximumWidth + "px";
		expandChild.style.height = this.maximumHeight + "px";
		shrinkChild.style.width = "250%";
		shrinkChild.style.height = "250%";
		expand.appendChild(expandChild);
		shrink.appendChild(shrinkChild);
		element.appendChild(expand);
		element.appendChild(shrink);
		if (expand.offsetParent != element) {
			element.style.position = "relative";
		}
		expand.scrollTop = shrink.scrollTop = this.maximumHeight;
		expand.scrollLeft = shrink.scrollLeft = this.maximumWidth;
		const sensor = this;
		sensor.onscroll = function (e) {
			sensor.w = sensor.element.clientWidth || 1;
			sensor.h = sensor.element.clientHeight || 1;
			if (sensor.w != sensor.width || sensor.h != sensor.height) {
				sensor.width = sensor.w;
				sensor.height = sensor.h;
				sensor.dispatchEvent();
			}
			expand.scrollTop = shrink.scrollTop = sensor.maximumHeight;
			expand.scrollLeft = shrink.scrollLeft = sensor.maximumWidth;
		};
		expand.addEventListener("scroll", sensor.onscroll);
		shrink.addEventListener("scroll", sensor.onscroll);
		sensor.expand = expand;
		sensor.shrink = shrink;
	}
	ResizeSensor.prototype.addListener = function (callback, capture) {
		if (this.events == undefined) this.events = [];
		this.events.push({
			callback: callback,
			capture: capture,
		});
	};
	ResizeSensor.prototype.dispatchEvent = function () {
		let capture = true;
		let evt;
		for (let i = 0; i < this.events.length; i++) {
			evt = this.events[i];
			if (evt.capture) {
				evt.callback();
			} else {
				capture = false;
			}
		}
		if (!capture) {
			requestAnimationFrame(this.dispatchFrameEvent.bind(this));
		}
	};
	ResizeSensor.prototype.dispatchFrameEvent = function () {
		let evt;
		for (let i = 0; i < this.events.length; i++) {
			evt = this.events[i];
			if (!evt.capture) evt.callback();
		}
	};
	ResizeSensor.prototype.close = function () {
		this.expand.removeEventListener("scroll", this.onscroll);
		this.shrink.removeEventListener("scroll", this.onscroll);
		if (!this.element) {
			this.element.removeChild(this.expand);
			this.element.removeChild(this.shrink);
		}
		this.events = null;
	};
	return ResizeSensor;
};
