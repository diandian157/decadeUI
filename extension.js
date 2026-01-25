import { lib, _status } from "noname";
import { config } from "./src/config.js";
import { content } from "./src/content.js";
import { precontent } from "./src/precontent.js";
import { mainpackage } from "./src/package.js";

/** @type {Noname.ExtensionType} */
export const type = "extension";

/**
 * 十周年UI扩展入口
 * @returns {Promise<Noname.ExtensionInfo>} 扩展配置对象
 */
export default async function () {
	const infoUrl = `${lib.assetURL}extension/十周年UI/info.json`;
	const { name, ...otherInfo } = await lib.init.promises.json(infoUrl);

	const extensionName = name;
	const extensionPath = `${lib.assetURL}extension/${extensionName}/`;

	Object.assign(window, {
		decadeUIName: extensionName,
		decadeUIPath: extensionPath,
	});

	const packageData = mainpackage(otherInfo);

	return {
		name: extensionName,
		editable: false,
		content,
		precontent,
		config,
		package: packageData,
		mainpackage: packageData,
	};
}
