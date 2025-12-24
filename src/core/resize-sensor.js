/**
 * 尺寸监听器
 */

/** 创建ResizeSensor类 */
export const createResizeSensorClass = () => {
	class ResizeSensor {
		constructor(element) {
			this.element = element;
			this.width = element.clientWidth || 1;
			this.height = element.clientHeight || 1;
			this.maxSize = 10000;
			this.events = [];
			this.initScrollElements();
		}

		initScrollElements() {
			const containerStyle = "position:absolute;top:0;bottom:0;left:0;right:0;z-index:-10000;overflow:hidden;visibility:hidden;transition:all 0s;";
			const childStyle = "transition:all 0s!important;animation:none!important;";

			this.expand = this.createContainer(containerStyle);
			this.shrink = this.createContainer(containerStyle);

			const expandChild = document.createElement("div");
			expandChild.style.cssText = childStyle;
			expandChild.style.width = this.maxSize * this.width + "px";
			expandChild.style.height = this.maxSize * this.height + "px";

			const shrinkChild = document.createElement("div");
			shrinkChild.style.cssText = childStyle;
			shrinkChild.style.width = "250%";
			shrinkChild.style.height = "250%";

			this.expand.appendChild(expandChild);
			this.shrink.appendChild(shrinkChild);
			this.element.appendChild(this.expand);
			this.element.appendChild(this.shrink);

			if (this.expand.offsetParent !== this.element) {
				this.element.style.position = "relative";
			}

			this.resetScroll();
			this.onscroll = this.handleScroll.bind(this);
			this.expand.addEventListener("scroll", this.onscroll);
			this.shrink.addEventListener("scroll", this.onscroll);
		}

		createContainer(style) {
			const div = document.createElement("div");
			div.style.cssText = style;
			return div;
		}

		resetScroll() {
			const maxW = this.maxSize * this.width;
			const maxH = this.maxSize * this.height;
			this.expand.scrollTop = this.shrink.scrollTop = maxH;
			this.expand.scrollLeft = this.shrink.scrollLeft = maxW;
		}

		handleScroll() {
			const w = this.element.clientWidth || 1;
			const h = this.element.clientHeight || 1;
			if (w !== this.width || h !== this.height) {
				this.width = w;
				this.height = h;
				this.dispatchEvent();
			}
			this.resetScroll();
		}

		addListener(callback, capture = true) {
			this.events.push({ callback, capture });
		}

		dispatchEvent() {
			let hasDeferred = false;
			this.events.forEach(evt => {
				if (evt.capture) evt.callback();
				else hasDeferred = true;
			});
			if (hasDeferred) requestAnimationFrame(() => this.dispatchDeferredEvents());
		}

		dispatchDeferredEvents() {
			this.events.forEach(evt => {
				if (!evt.capture) evt.callback();
			});
		}

		close() {
			this.expand.removeEventListener("scroll", this.onscroll);
			this.shrink.removeEventListener("scroll", this.onscroll);
			if (this.element) {
				this.element.removeChild(this.expand);
				this.element.removeChild(this.shrink);
			}
			this.events = null;
		}
	}
	return ResizeSensor;
};
