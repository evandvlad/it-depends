import type { GlobalEventBusSubscriber } from "../values";

interface TerminalPort {
	writeLine: (text: string) => void;
	clearPreviousLine: () => void;
}

interface Params {
	terminalPort: TerminalPort;
	subscriberPort: GlobalEventBusSubscriber;
}

export class Logger {
	#terminalPort;

	constructor({ terminalPort, subscriberPort }: Params) {
		this.#terminalPort = terminalPort;

		const state: { processedFiles: number; unprocessedFiles: 0 } = {
			processedFiles: 0,
			unprocessedFiles: 0,
		};

		subscriberPort.on("app:started", () => {
			this.#writeLine("Started");
		});

		subscriberPort.on("settings-preparation:started", () => {
			this.#writeLine("Options checking");
		});

		subscriberPort.on("settings-preparation:finished", () => {
			this.#writeLine("Options was successfully checked");
		});

		subscriberPort.on("program-files-processing:started", () => {
			this.#writeLine("Program files processing started");
		});

		subscriberPort.on("program-files-processing:program-file-processed", () => {
			if (state.processedFiles > 0) {
				this.#terminalPort.clearPreviousLine();
			}

			state.processedFiles += 1;

			this.#writeLine(`Program files processing. Processed ${state.processedFiles} file(s).`);
		});

		subscriberPort.on("program-files-processing:program-file-processing-failed", () => {
			state.unprocessedFiles += 1;
		});

		subscriberPort.on("program-files-processing:finished", () => {
			this.#writeLine(
				`Program files processing finished.${
					state.unprocessedFiles > 0 ? ` Unfortunately, ${state.unprocessedFiles} file(s) was/were not processed.` : ""
				}`,
			);
		});

		subscriberPort.on("report-generation:started", () => {
			this.#writeLine("Report generation started");
		});

		subscriberPort.on("report-generation:finished", ({ path }) => {
			this.#writeLine(`Report generation finished. Path to the report - ${path}`);
		});

		subscriberPort.on("app:finished", () => {
			this.#writeLine("Done");
		});
	}

	acceptAppLevelError(error: Error) {
		this.#writeLine(`Oh. An error occured: '${error.message}'`);
	}

	#writeLine(text: string) {
		const timeMark = new Date().toLocaleTimeString();
		this.#terminalPort.writeLine(`[${timeMark}] ${text}`);
	}
}
