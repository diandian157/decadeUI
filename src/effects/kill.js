"use strict";

/**
 * 击杀特效模块
 */

import { game, ui } from "noname";
import { CONFIG } from "./config.js";
import { create, isPlayer, getAvatar, randomPosition } from "./utils.js";

/** 播放击杀特效 */
export function playKillEffect(source, target) {
	if (!isPlayer(source) || !isPlayer(target)) {
		throw new Error("source和target必须是有效的玩家对象");
	}
	if (source === target || source.isUnseen() || target.isUnseen()) return;

	const srcAvatar = getAvatar(source, source.isUnseen(0));
	const tgtAvatar = getAvatar(target, target.isUnseen(0));

	// 创建特效容器
	const effect = create("effect-window", null, {
		backgroundColor: "rgba(0,0,0,0.7)",
		transition: "all 4s",
		zIndex: 7,
	});

	// 击杀者
	const killerWrapper = create("killer-warpper", effect);
	killerWrapper.killer = create("killer", killerWrapper);
	killerWrapper.killer.style.backgroundImage = srcAvatar.style.backgroundImage;

	// 被击杀者
	const victim = create("victim", effect);
	victim.back = create("back", victim);
	victim.back.part1 = create("part1", victim.back);
	victim.back.part2 = create("part2", victim.back);
	const victimImg = tgtAvatar.style.backgroundImage;
	victim.back.part1.style.backgroundImage = victimImg;
	victim.back.part2.style.backgroundImage = victimImg;

	// 播放音效
	game.playAudio("../extension", decadeUI.extensionName, "audio/kill_effect_sound.mp3");

	// 播放Spine动画或降级效果
	const anim = decadeUI.animation;
	const bounds = anim.getSpineBounds("effect_jisha1");

	if (bounds) {
		const scale = (anim.canvas.width / bounds.size.x) * CONFIG.KILL_SCALE;
		anim.playSpine("effect_jisha1", { scale });
		ui.window.appendChild(effect);
		ui.refresh(effect);
	} else {
		fallbackKillEffect(effect, victim);
	}

	decadeUI.delay(CONFIG.KILL_DELAY);
	effect.style.backgroundColor = "rgba(0,0,0,0)";
	effect.close(CONFIG.KILL_CLOSE);
}

/** 降级击杀特效(无Spine时) */
function fallbackKillEffect(effect, victim) {
	create("li-big", effect);

	victim.rout = create("rout", victim);
	victim.rout2 = create("rout", victim);
	victim.rout.innerHTML = "破敌";
	victim.rout2.innerHTML = "破敌";
	victim.rout2.classList.add("shadow");

	ui.window.appendChild(effect);

	// 随机光效
	const height = ui.window.offsetHeight;
	for (let i = 0; i < CONFIG.KILL_LIGHT_COUNT; i++) {
		const { x, y, scale } = randomPosition(height);
		setTimeout(
			() => {
				const light = create("li", effect);
				light.style.transform = `translate(${x}, ${y}) scale(${scale})`;
			},
			decadeUI.getRandom(50, 300)
		);
	}
}
