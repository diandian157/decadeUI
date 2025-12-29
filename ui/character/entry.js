/**
 * @fileoverview Character模块入口
 * 负责加载ES模块
 */
(function () {
	const script = document.createElement("script");
	script.type = "module";
	script.src = window.decadeUIPath + "ui/character/loader.js";
	document.head.appendChild(script);
})();
