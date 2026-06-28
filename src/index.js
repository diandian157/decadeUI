import { lib, _status } from "noname";
import { config } from "./config.js";
import { content } from "./content.js";
import { precontent } from "./precontent.js";
import { mainpackage } from "./package.js";

export const type = "extension";

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
