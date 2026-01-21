/**
 * @fileoverview gskill 通用工具函数
 * 提供触屏布局下 gskill 缓存和状态更新的通用逻辑
 */

/**
 * 获取可用技能列表
 * @param {Object} ui - UI对象
 * @returns {Array} 可用技能ID列表
 */
export function getAvailableSkills(ui) {
	const skills = [];
	[ui.skills, ui.skills2, ui.skills3].forEach(s => {
		if (s?.skills) skills.addArray(s.skills);
	});
	return skills;
}

/**
 * 更新技能可用状态
 * @param {NodeList|Array} nodes 技能节点列表
 * @param {Array} availableSkills 可用技能ID列表
 * @param {Object} context { lib, game, ui, get, ai, _status }
 */
export function updateSkillUsability(nodes, availableSkills, context) {
	const { lib, game, ui, get, ai, _status } = context;

	Array.from(nodes).forEach(item => {
		const skillId = item.dataset.id;
		let isUsable = availableSkills.includes(skillId);
		if (isUsable && game.me && !lib.skill[skillId]?.enable && get.is.locked(skillId, game.me)) isUsable = false;

		item.classList.toggle("usable", isUsable);
		item.classList.toggle("select", _status.event.skill === skillId);
	});
}

/**
 * 检查 gskill 缓存是否需要更新
 * @param {Array} cachedSkills 当前缓存
 * @param {Array} newSkills 新技能列表
 * @returns {boolean} 是否相同
 */
export function isGSkillCacheSame(cachedSkills, newSkills) {
	if (!newSkills?.length) return !cachedSkills?.length;
	if (!cachedSkills?.length) return false;
	if (cachedSkills.length !== newSkills.length) return false;
	return cachedSkills.every((s, i) => s === newSkills[i]);
}

/**
 * 检查技能是否应该跳过（装备技能过滤）
 * @param {string} skillId 技能ID
 * @param {Array} eSkills 装备技能列表
 * @param {Object} context { lib, game, ui, get, ai, _status }
 * @returns {boolean}
 */
export function shouldSkipEquipSkill(skillId, eSkills, context) {
	const { lib, game, ui, get, ai, _status } = context;
	if (lib.config["extension_十周年UI_aloneEquip"] && eSkills?.length) {
		return game.expandSkills(eSkills.slice()).includes(skillId);
	}
	return false;
}

/**
 * 清理已失效的 gskill 节点
 * @param {HTMLElement} container 技能容器节点
 * @param {Object} ui UI对象
 * @param {Array} cachedGSkills 缓存的 gskill 列表（可选）
 */
export function cleanupInvalidGSkills(container, ui, cachedGSkills) {
	if (!container) return;

	// 获取当前有效的 gskill 列表
	const validGSkills = ui.skills2?.skills || [];

	// 查找所有标记为 gskill 的节点
	const gskillNodes = container.querySelectorAll('[data-gskill="true"]');

	gskillNodes.forEach(node => {
		const skillId = node.dataset.id;
		// 如果技能不在有效列表中，移除节点
		if (!validGSkills.includes(skillId)) {
			node.remove();
		}
	});

	// 同步更新缓存
	if (cachedGSkills && Array.isArray(cachedGSkills)) {
		const validSet = new Set(validGSkills);
		for (let i = cachedGSkills.length - 1; i >= 0; i--) {
			if (!validSet.has(cachedGSkills[i])) {
				cachedGSkills.splice(i, 1);
			}
		}
	}
}
