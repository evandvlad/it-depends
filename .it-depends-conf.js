const { resolve } = require("node:path");
const pkg = require("./package.json");

module.exports = {
	version: pkg.version,
	reportStaticAssetsPath: resolve(__dirname, "./report-static-assets"),
};