import { nonameInitialized } from "../../noname/util/index.js";
import { lib, game, ui, get, ai, _status } from "noname";
import { config } from "./src/config.js";
import { content } from "./src/content.js";
import { precontent } from "./src/precontent.js";
import { mainpackage } from "./src/package.js";

export const type = "extension";

export default async function () {
	const infoUrl = `${lib.assetURL}extension/十周年UI/info.json`;
	const { name, ...otherInfo } = await lib.init.promises.json(infoUrl);

	const extensionName = name;
	const extensionPath = `${lib.assetURL}extension/${extensionName}/`;
	const extensionResolvePath = `${nonameInitialized}extension/${extensionName}/`;

	Object.assign(window, {
		decadeUIName: extensionName,
		decadeUIPath: extensionPath,
		decadeUIResolvePath: extensionResolvePath,
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
