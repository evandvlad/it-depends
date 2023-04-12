const path = require("node:path");
const process = require("node:process");

const { ItDepends, AppError } = require("..");

const terminalPrinter = {
	writeStandardText(text) {
		console.log(text);
	},

	writeRedText(text) {
		console.log("\x1b[31m%s\x1b[0m", text);
	},

	writeGreenText(text) {
		console.log("\x1b[32m%s\x1b[0m", text);
	},

	clearLastLines(count) {
		process.stdout.moveCursor(0, -count);
		process.stdout.clearScreenDown();
	},
};

async function main() {
	try {
		let processedFiles = 0;

		const srcFiles = path.resolve(__dirname, "../src");

		const itDepends = new ItDepends({ paths: [srcFiles] });

		itDepends.on("file-processed", ({ path }) => {
			processedFiles += 1;

			terminalPrinter.clearLastLines(1);
			terminalPrinter.writeStandardText(`Processed files: ${processedFiles}`);
		});

		itDepends.on("file-processing-failed", ({ path, error }) => {
			terminalPrinter.writeRedText(`Can't process file ${path}: ${error.message}`);
			process.exit(1);
		});

		itDepends.on("files-processing-completed", () => {
			terminalPrinter.writeStandardText("=".repeat(60));
		});

		const { summary } = await itDepends.run();

		const incorrectImportFilePaths = Object.keys(summary.incorrectImports);

		if (incorrectImportFilePaths.length > 0) {
			terminalPrinter.writeRedText(`Incorrect imports in files: ${incorrectImportFilePaths.join(", ")}`);
			process.exit(1);
		}

		terminalPrinter.writeGreenText("Success");
	} catch (e) {
		if (e instanceof AppError) {
			terminalPrinter.writeRedText(e.message);
			process.exit(1);
		}

		throw e;
	}
}

main();
