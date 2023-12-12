
const path = require("path");
const fs = require("fs");

const bundlePath = path.join(__dirname, "..", "..", "card-sdk", "dist", "bundle.js");
const outputPath = path.join(__dirname, "..", "src", "view", "sdk", "v1.ts");

if (!fs.existsSync(bundlePath)){
	console.log(bundlePath + " does not exist. Please build bundle first");
	return;
}

const bundleFile = fs.readFileSync(bundlePath);
const fileString = bundleFile.toString("utf-8");

const JSVarStr = `
export const CARD_SDK_V1 = ${'`' + fileString + '`'};
`;

fs.writeFileSync(outputPath, JSVarStr);

