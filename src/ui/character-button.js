/**
 * 角色按钮预设模块
 */
import { lib, game, ui, get, ai, _status } from "noname";
import { element } from "../utils/element.js";

/** 创建角色按钮预设 */
export function createCharacterButtonPreset() {
	return function (item, type, position, noclick, node) {
		if (node) {
			node.classList.add("button", "character", "decadeUI");
			node.style.display = "";
		} else {
			node = ui.create.div(".button.character.decadeUI");
		}
		node._link = item;

		if (type === "characterx") {
			if (_status.noReplaceCharacter) type = "character";
			else if (lib.characterReplace[item]?.length) item = lib.characterReplace[item].randomGet();
		}
		if (type === "characterx" && lib.characterReplace[item]?.length) {
			item = lib.characterReplace[item].randomGet();
		}

		node.link = item;
		decadeUI.element.create("character", node);

		const doubleCamp = get.is.double(node._link, true);
		if (doubleCamp) node._changeGroup = true;
		if (type === "characterx" && lib.characterReplace[node._link]?.length > 1) {
			node._replaceButton = true;
		}

		node.refresh = function (node, item, intersection) {
			if (intersection) {
				node.awaitItem = item;
				intersection.observe(node);
			} else {
				node.setBackground(item, "character");
			}

			if (node.node) {
				node.node.name.remove();
				node.node.hp.remove();
				node.node.group.remove();
				node.node.intro.remove();
				if (node.node.replaceButton) node.node.replaceButton.remove();
			}

			node.node = {
				name: element.create("name", node),
				hp: element.create("hp", node),
				group: element.create("identity", node),
				intro: element.create("intro", node),
				info: element.create("info", node),
			};

			const infoitem = get.character(item);
			node.node.name.innerHTML = get.slimName(item);

			if (lib.config.buttoncharacter_style === "default" || lib.config.buttoncharacter_style === "simple") {
				if (lib.config.buttoncharacter_style === "simple") node.node.group.style.display = "none";
				node.classList.add("newstyle");
				node.node.name.dataset.nature = get.groupnature(get.bordergroup(infoitem));
				node.node.group.dataset.nature = get.groupnature(get.bordergroup(infoitem), "raw");
				ui.create.div(node.node.hp);

				const hp = get.infoHp(infoitem[2]);
				const maxHp = get.infoMaxHp(infoitem[2]);
				const hujia = get.infoHujia(infoitem[2]);
				const check = (get.mode() === "single" && _status.mode === "changban") || ((get.mode() === "guozhan" || (cfg => (typeof cfg === "string" ? cfg === "double" : Boolean(cfg)))(_status.connectMode ? lib.configOL.double_character : get.config("double_character"))) && (_status.connectMode || (_status.connectMode ? lib.configOL.double_hp : get.config("double_hp")) === "pingjun"));

				let str = get.numStr(hp / (check ? 2 : 1));
				if (hp !== maxHp) str += "/" + get.numStr(maxHp / (check ? 2 : 1));
				ui.create.div(".text", str, node.node.hp);

				if (infoitem[2] === 0) node.node.hp.hide();
				else if (get.infoHp(infoitem[2]) <= 3) node.node.hp.dataset.condition = "mid";
				else node.node.hp.dataset.condition = "high";

				if (hujia > 0) {
					ui.create.div(node.node.hp, ".shield");
					ui.create.div(".text", get.numStr(hujia), node.node.hp);
				}
			} else {
				const hp = get.infoHp(infoitem[2]);
				const maxHp = get.infoMaxHp(infoitem[2]);
				const shield = get.infoHujia(infoitem[2]);
				if (maxHp > 14) {
					node.node.hp.innerHTML = typeof infoitem[2] === "string" ? infoitem[2] : get.numStr(infoitem[2]);
					node.node.hp.classList.add("text");
				} else {
					for (let i = 0; i < maxHp; i++) {
						const next = ui.create.div("", node.node.hp);
						if (i >= hp) next.classList.add("exclude");
					}
					for (let i = 0; i < shield; i++) ui.create.div(node.node.hp, ".shield");
				}
			}

			if (!node.node.hp.childNodes.length) node.node.name.style.top = "8px";
			if (node.node.name.querySelectorAll("br").length >= 4) {
				node.node.name.classList.add("long");
				if (lib.config.buttoncharacter_style === "old") {
					node.addEventListener("mouseenter", ui.click.buttonnameenter);
					node.addEventListener("mouseleave", ui.click.buttonnameleave);
				}
			}

			node.node.intro.innerText = lib.config.intro;
			if (!noclick) lib.setIntro(node);

			if (infoitem[1]) {
				const doubleCamp = get.is.double(item, true);
				if (doubleCamp) {
					node.node.group.innerHTML = doubleCamp.reduce((prev, cur) => `${prev}<div data-nature="${get.groupnature(cur)}">${get.translation(cur)}</div>`, "");
					if (doubleCamp.length > 4) {
						node.node.group.style.height = new Set([5, 6, 9]).has(doubleCamp.length) ? "48px" : "64px";
					}
				} else {
					node.node.group.innerHTML = `<div>${get.translation(infoitem[1])}</div>`;
				}
				node.node.group.style.backgroundColor = get.translation(`${get.bordergroup(infoitem)}Color`);
			} else {
				node.node.group.style.display = "none";
			}

			if (node._replaceButton) {
				const intro = ui.create.div(".button.replaceButton", node);
				node.node.replaceButton = intro;
				intro.innerText = "切换";
				intro._node = node;
				intro.addEventListener(lib.config.touchscreen ? "touchend" : "click", function () {
					_status.tempNoButton = true;
					const n = this._node;
					const list = lib.characterReplace[n._link];
					let link = n.link;
					let index = list.indexOf(link);
					index = index === list.length - 1 ? 0 : index + 1;
					n.link = list[index];
					n.refresh(n, list[index]);
					setTimeout(() => {
						_status.tempNoButton = undefined;
					}, 200);
				});
			}
		};

		node.refresh(node, item, position?.intersection);
		if (position) position.appendChild(node);
		return node;
	};
}
