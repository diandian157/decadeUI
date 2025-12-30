"use strict";

/**
 * @fileoverview 技能特效模块，处理技能发动时的视觉效果
 */

import { lib, game, ui, get, ai, _status } from "noname";
import { CONFIG, GENERAL_NAME_STYLE } from "./config.js";
import { isPlayer, getName, toKebab, getDefaultAvatar } from "./utils.js";
import { getOutcropStyle, getOutcropImagePath, checkImageExists } from "../ui/outcropAvatar.js";

/**
 * 播放技能特效
 * @param {Object} player - 玩家对象
 * @param {string} skillName - 技能名称
 * @param {string} [vice] - 是否为副将，值为"vice"表示副将
 * @returns {void}
 */
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

/**
 * 加载技能特效资源
 * @param {string} characterName - 武将名称
 * @param {string} camp - 势力
 * @param {Object} player - 玩家对象
 * @param {string} skillName - 技能名称
 * @param {string} playerName - 显示名称
 * @returns {Promise<void>}
 */
async function loadSkillAssets(characterName, camp, player, skillName, playerName) {
	try {
		const imgPath = await getCharacterImagePath(characterName);
		const [charImg, bgImg] = await Promise.all([loadImage(imgPath, player, characterName), loadBgImage(camp)]);
		renderSkillEffect(charImg, bgImg, camp, skillName, playerName);
	} catch (err) {
		console.error("技能特效加载失败:", err);
	}
}

/**
 * 获取武将图片顺序
 * @param {string} name - 武将名称
 * @returns {Promise<string|null>} 图片路径
 */
async function getCharacterImagePath(name) {
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

	// 使用皮肤
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

	// 优先扩展lihui立绘目录
	const lihuiPath = `${lib.assetURL}extension/十周年UI/image/character/lihui/${realName}.jpg`;
	if (await checkImageExists(lihuiPath)) {
		return lihuiPath;
	}

	// 其次露头图
	const outcropStyle = getOutcropStyle();
	if (outcropStyle !== "off") {
		const outcropPath = getOutcropImagePath(realName, outcropStyle);
		if (outcropPath && (await checkImageExists(outcropPath))) {
			return outcropPath;
		}
	}

	// 最后都没有扔给本体处理
	return `${lib.assetURL}image/character/${realName}.jpg`;
}

/**
 * 加载角色图片
 * @param {string} src - 图片路径
 * @param {Object} player - 玩家对象(用于获取备用图片)
 * @param {string} characterName - 武将名称
 * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
 */
function loadImage(src, player, characterName) {
	return new Promise((resolve, reject) => {
		if (!src) {
			reject(new Error("图片路径为空"));
			return;
		}

		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = async () => {
			const fallback = await getFallbackSrc(src, player, characterName);
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

/**
 * 获取备用图片路径
 * @param {string} src - 原图片路径
 * @param {Object} player - 玩家对象
 * @param {string} characterName - 武将名称
 * @returns {Promise<string>} 备用图片路径
 */
async function getFallbackSrc(src, player, characterName) {
	return getDefaultAvatar(player);
}

/**
 * 加载势力背景图
 * @param {string} camp - 势力名称
 * @returns {Promise<HTMLImageElement>} 加载完成的背景图片
 */
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

/**
 * 渲染技能特效
 * @param {HTMLImageElement} charImg - 武将图片
 * @param {HTMLImageElement} bgImg - 背景图片
 * @param {string} camp - 势力
 * @param {string} skillName - 技能名称
 * @param {string} playerName - 玩家显示名
 * @returns {void}
 */
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

/**
 * 设置Spine附件(带缓存)
 * @param {Object} skeleton - Spine骨骼对象
 * @param {string} slotName - 插槽名称
 * @param {HTMLImageElement} img - 图片元素
 * @param {Object} anim - 动画对象
 * @param {string} cacheKey - 缓存键
 * @returns {void}
 */
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

/**
 * 设置武将附件
 * @param {Object} skeleton - Spine骨骼对象
 * @param {HTMLImageElement} img - 武将图片
 * @param {Object} anim - 动画对象
 * @returns {void}
 */
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

/**
 * 创建技能UI元素
 * @param {string} skillName - 技能名称
 * @param {string} playerName - 玩家显示名
 * @param {number} spriteScale - 精灵缩放比例
 * @returns {void}
 */
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
