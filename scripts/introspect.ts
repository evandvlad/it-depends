const path = require("node:path");
const { ItDepends } = require("..");

async function main() {
	const srcPath = path.resolve(__dirname, "../src");

	const itDepends = new ItDepends({
		paths: [srcPath],
		aliases: {
			"~": srcPath,
		},
		report: {
			path: path.resolve(__dirname, "../report"),
		},
	});

	await itDepends.run();
}

main();

