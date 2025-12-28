"use strict";

/**
 * 技能特效模块
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { CONFIG, GENERAL_NAME_STYLE } from "./config.js";
import { isPlayer, getName, toKebab, getDefaultAvatar } from "./utils.js";

/** 播放技能特效 */
export function playSkillEffect(player, skillName, vice) {
	if (!isPlayer(player)) return;

	const anim = decadeUI.animation;
	const asset = anim.spine.assets.effect_xianding;

	if (!asset) {
		console.error("[effect_xianding]特效未加载");
		return;
	}
	if (!asset.ready) anim.prepSpine("effect_xianding");

	const isVice = vice === "vice";
	const camp = player.group;
	const playerName = getName(player, isVice);
	const characterName = isVice ? player.name2 : player.name;

	loadSkillAssets(characterName, camp, player, skillName, playerName);
}

/** 加载技能特效资源 */
async function loadSkillAssets(characterName, camp, player, skillName, playerName) {
	try {
		const imgPath = getCharacterImagePath(characterName);
		const [charImg, bgImg] = await Promise.all([loadImage(imgPath, player), loadBgImage(camp)]);
		renderSkillEffect(charImg, bgImg, camp, skillName, playerName);
	} catch (err) {
		console.error("技能特效加载失败:", err);
	}
}

/** 获取武将图片路径(优先立绘) */
function getCharacterImagePath(name) {
	if (!name) return null;

	const nameinfo = get.character(name);
	const mode = get.mode();

	// 处理国战模式武将名
	let realName = name;
	if (lib.characterPack[`mode_${mode}`]?.[name]) {
		if (mode === "guozhan") {
			realName = name.startsWith("gz_shibing") ? name.slice(3, 11) : name.slice(3);
		}
	}

	// 优先使用皮肤
	if (lib.config.skin[realName]) {
		return lib.config.skin[realName][1];
	}

	// 检查武将自定义图片
	if (nameinfo?.img) {
		return nameinfo.img;
	}

	// 检查trashBin中的图片配置
	if (nameinfo?.trashBin) {
		for (const value of nameinfo.trashBin) {
			if (value.startsWith("img:")) return value.slice(4);
			if (value.startsWith("ext:")) return value.replace(/^ext:/, "extension/");
		}
	}

	return `${lib.assetURL}image/lihui/${realName}.jpg`;
}

/** 加载角色图片 */
function loadImage(src, player) {
	return new Promise((resolve, reject) => {
		if (!src) {
			reject(new Error("图片路径为空"));
			return;
		}

		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = async () => {
			const fallback = await getFallbackSrc(src, player);
			if (fallback && fallback !== src) {
				img.onload = () => resolve(img);
				img.onerror = () => reject(new Error("图片加载失败"));
				img.src = fallback;
			} else {
				reject(new Error("图片加载失败"));
			}
		};
		img.src = src.startsWith("http") || src.startsWith("data:") ? src : `${lib.assetURL}${src.replace(lib.assetURL, "")}`;
	});
}

/** 获取备用图片路径 */
async function getFallbackSrc(src, player) {
	if (src.includes("image/lihui")) {
		return src.replace(/image\/lihui/, "image/character");
	}
	return getDefaultAvatar(player);
}

/** 加载势力背景图 */
function loadBgImage(camp) {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => {
			img.onload = () => resolve(img);
			img.src = `${decadeUIPath}image/ui/misc/bg_xianding_qun.png`;
		};
		img.src = `${decadeUIPath}image/ui/misc/bg_xianding_${camp}.png`;
	});
}

/** 渲染技能特效 */
function renderSkillEffect(charImg, bgImg, camp, skillName, playerName) {
	const anim = decadeUI.animation;
	const sprite = anim.playSpine("effect_xianding");

	if (!sprite?.skeleton) {
		console.error("Spine动画加载失败");
		return;
	}

	const skeleton = sprite.skeleton;

	// 设置势力背景
	setAttachment(skeleton, "shilidipan", bgImg, anim, camp);

	// 设置武将图片
	setGeneralAttachment(skeleton, charImg, anim);

	// 计算缩放
	const size = skeleton.bounds.size;
	sprite.scale = Math.max(anim.canvas.width / size.x, anim.canvas.height / size.y);

	// 创建UI元素
	createSkillUI(skillName, playerName, sprite.scale);
}

/** 设置Spine附件(带缓存) */
function setAttachment(skeleton, slotName, img, anim, cacheKey) {
	const slot = skeleton.findSlot(slotName);
	const attachment = slot.getAttachment();

	if (attachment.camp === cacheKey) return;

	attachment.cached = attachment.cached || {};
	if (!attachment.cached[cacheKey]) {
		attachment.cached[cacheKey] = anim.createTextureRegion(img);
	}

	const region = attachment.cached[cacheKey];
	attachment.width = region.width;
	attachment.height = region.height;
	attachment.setRegion(region);
	attachment.updateOffset();
	attachment.camp = cacheKey;
}

/** 设置武将附件 */
function setGeneralAttachment(skeleton, img, anim) {
	const slot = skeleton.findSlot("wujiang");
	const attachment = slot.getAttachment();
	const region = anim.createTextureRegion(img);

	const scale = Math.min(CONFIG.SKILL_MAX_W / region.width, CONFIG.SKILL_MAX_H / region.height);

	attachment.width = region.width * scale;
	attachment.height = region.height * scale;
	attachment.setRegion(region);
	attachment.updateOffset();
}

/** 创建技能UI */
function createSkillUI(skillName, playerName, spriteScale) {
	// 技能名
	const skillEl = decadeUI.element.create("skill-name");
	skillEl.innerHTML = skillName;
	skillEl.style.top = `calc(50% + ${CONFIG.SKILL_NAME_Y * spriteScale}px)`;

	// 武将名
	const nameEl = decadeUI.element.create("general-name");
	nameEl.innerHTML = playerName;

	const styles = {
		...GENERAL_NAME_STYLE,
		right: `calc(50% - ${CONFIG.GENERAL_X * spriteScale}px)`,
		top: `calc(50% - ${CONFIG.GENERAL_Y * spriteScale}px)`,
	};

	nameEl.style.cssText = Object.entries(styles)
		.map(([k, v]) => `${toKebab(k)}: ${v}`)
		.join("; ");

	ui.arena.appendChild(skillEl);
	ui.arena.appendChild(nameEl);

	skillEl.removeSelf(CONFIG.EFFECT_DURATION);
	nameEl.removeSelf(CONFIG.EFFECT_DURATION);
}
