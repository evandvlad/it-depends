const path = require("node:path");
const { ItDepends, AppError } = require("..");

async function main() {
	try {
		let processedFiles = 0;

		const itDepends = new ItDepends({
			paths: [path.resolve(__dirname, "../src")],
			report: {
				path: path.resolve(__dirname, "../report"),
			},
		});

		itDepends.on("file-item-processed", () => {
			processedFiles += 1;

			process.stdout.moveCursor(0, -1);
			process.stdout.clearScreenDown();
			console.log(`Processed files: ${processedFiles}`);
		});

		itDepends.on("report-generation-started", () => {
			console.log("Report generation started");
		});

		await itDepends.run();

		console.log("Done");
	} catch (e) {
		if (e instanceof AppError) {
			console.log(e.message);
			process.exit(1);
		}

		throw e;
	}
}

main();

