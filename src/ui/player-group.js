/**
 * 玩家势力属性模块
 */
import { lib, game, get } from "noname";

/** 处理势力样式V2 */
function handleGroupStyleV2(group) {
	if (!decadeUI.config.campIdentityImageMode) {
		if (!this._finalGroup) {
			this.node.campWrap.node.campName.innerHTML = "";
		} else {
			const name = get.translation(this._finalGroup);
			const str = get.plainText(name);
			this.node.campWrap.node.campName.innerHTML = str.length <= 2 ? name : name.replaceAll(str, str[0]);
		}
	} else {
		this._lastCampTask = this._lastCampTask || Promise.resolve();
		this._lastCampTask = this._lastCampTask.then(async () => {
			this.node.campWrap.node.campName.innerHTML = "";
			this.node.campWrap.node.campName.style.backgroundImage = "";
			this._finalGroup = group;

			const create = () => {
				if (decadeUI.config.newDecadeStyle === "codename" || !this._finalGroup) {
					this.node.campWrap.node.campName.innerHTML = "";
				} else {
					const name = get.translation(this._finalGroup);
					const str = get.plainText(name);
					this.node.campWrap.node.campName.innerHTML = str.length <= 2 ? name : name.replaceAll(str, str[0]);
				}
			};

			const loadImage = url =>
				new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(url);
					img.onerror = () => reject(url);
					img.src = url;
				});

			if (decadeUI.config.newDecadeStyle === "onlineUI") {
				create();
				return;
			}

			try {
				const prefix = decadeUI.config.newDecadeStyle === "off" ? "image/decorations/name2_" : decadeUI.config.newDecadeStyle === "babysha" ? "image/decorationh/hs_" : "image/decoration/name_";
				const url = decadeUIPath + prefix + group + ".png";
				await loadImage(url);
				this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
				return;
			} catch {}

			try {
				const imageName = `group_${group}`;
				const info = lib.card[imageName];
				if (!info?.image) throw new Error();
				let src;
				if (info.image.startsWith("db:")) src = await game.getDB("image", info.image.slice(3));
				else if (info.image.startsWith("ext:")) src = `${lib.assetURL}${info.image.replace(/^ext:/, "extension/")}`;
				else src = `${lib.assetURL}${info.image}`;
				await loadImage(src);
				this.node.campWrap.node.campName.style.backgroundImage = `url("${src}")`;
				return;
			} catch {}

			create();
		});
	}
}

/** 处理势力样式默认 */
function handleGroupStyleDefault(group) {
	if (decadeUI.config.newDecadeStyle === "codename") {
		this.node.campWrap.node.campName.innerHTML = "";
	} else if (!this._finalGroup) {
		this.node.campWrap.node.campName.innerHTML = "";
	} else {
		const name = get.translation(this._finalGroup);
		const str = get.plainText(name);
		this.node.campWrap.node.campName.innerHTML = str.length <= 1 ? name : str[0];
	}

	if (decadeUI.config.newDecadeStyle === "off") {
		const prefix = "image/decorations/name2_";
		const url = decadeUIPath + prefix + group + ".png";
		this._finalGroup = group;

		const image = new Image();
		image.onerror = () => {
			if (decadeUI.config.newDecadeStyle === "codename" || !this._finalGroup) {
				this.node.campWrap.node.campName.innerHTML = "";
			} else {
				const name = get.translation(this._finalGroup);
				const str = get.plainText(name);
				this.node.campWrap.node.campName.innerHTML = str.length <= 1 ? name : str[0];
			}
		};
		this.node.campWrap.node.campName.style.backgroundImage = `url("${url}")`;
		image.src = url;
	} else {
		this._finalGroup = group;
		if (decadeUI.config.newDecadeStyle === "codename" || !this._finalGroup) {
			this.node.campWrap.node.campName.innerHTML = "";
		} else {
			const name = get.translation(this._finalGroup);
			const str = get.plainText(name);
			this.node.campWrap.node.campName.innerHTML = str.length <= 1 ? name : str[0];
		}
	}
}

/** 定义player.group属性 */
export function definePlayerGroupProperty() {
	Object.defineProperties(lib.element.player, {
		group: {
			configurable: true,
			get() {
				return this._group;
			},
			set(group) {
				if (!group) return;
				this._group = group;
				this.node.campWrap.dataset.camp = get.character(this.name)?.groupBorder || group;

				if (lib.config.extension_十周年UI_forcestyle === "2") {
					handleGroupStyleV2.call(this, group);
				} else {
					handleGroupStyleDefault.call(this, group);
				}
			},
		},
	});
}
