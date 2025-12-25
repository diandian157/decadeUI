/**
 * Skill模块入口
 * 加载ES模块
 */
(function () {
	const script = document.createElement("script");
	script.type = "module";
	script.src = window.decadeUIPath + "ui/skill/loader.js";
	document.head.appendChild(script);
})();
