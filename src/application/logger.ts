import type { GlobalEventBusSubscriber } from "./values";

export interface TerminalPort {
	writeLine: (text: string) => void;
	clearPreviousLine: () => void;
}

interface Params {
	terminalPort: TerminalPort;
	subscriber: GlobalEventBusSubscriber;
}

export class Logger {
	#terminalPort;

	constructor({ terminalPort, subscriber }: Params) {
		this.#terminalPort = terminalPort;

		const state: { processedFiles: number; unprocessedFiles: 0 } = {
			processedFiles: 0,
			unprocessedFiles: 0,
		};

		subscriber.on("app:started", () => {
			this.#writeLine("Started");
		});

		subscriber.on("settings-preparation:started", () => {
			this.#writeLine("Options checking");
		});

		subscriber.on("settings-preparation:finished", () => {
			this.#writeLine("Options was successfully checked");
		});

		subscriber.on("program-files-loading:started", () => {
			this.#writeLine("Program files loading started");
		});

		subscriber.on("program-files-loading:finished", () => {
			this.#writeLine("Program files loading finished");
		});

		subscriber.on("program-files-processing:started", () => {
			this.#writeLine("Program files processing started");
		});

		subscriber.on("program-files-processing:program-file-processed", () => {
			if (state.processedFiles > 0) {
				this.#terminalPort.clearPreviousLine();
			}

			state.processedFiles += 1;

			this.#writeLine(`Program files processing. Processed ${state.processedFiles} file(s).`);
		});

		subscriber.on("program-files-processing:program-file-processing-failed", () => {
			state.unprocessedFiles += 1;
		});

		subscriber.on("program-files-processing:finished", () => {
			this.#writeLine(
				`Program files processing finished.${
					state.unprocessedFiles > 0 ? ` Unfortunately, ${state.unprocessedFiles} file(s) was/were not processed.` : ""
				}`,
			);
		});

		subscriber.on("report-generation:started", () => {
			this.#writeLine("Report generation started");
		});

		subscriber.on("report-generation:finished", ({ path }) => {
			this.#writeLine(`Report generation finished. Path to the report - ${path}`);
		});

		subscriber.on("app:finished", () => {
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
