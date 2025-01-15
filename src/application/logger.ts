import type { GlobalEventBusSubscriber } from "../values";

interface TerminalPort {
	writeLine: (text: string) => void;
	clearPreviousLine: () => void;
}

interface Params {
	terminalPort: TerminalPort;
	globalEventBusSubscriber: GlobalEventBusSubscriber;
}

export class Logger {
	#terminalPort;

	constructor({ terminalPort }: Params) {
		this.#terminalPort = terminalPort;
	}

	acceptAppLevelError(_error: Error) {
		this.#terminalPort.writeLine("Oh. An error occured.");
	}
}
