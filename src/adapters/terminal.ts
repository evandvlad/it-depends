export class Terminal {
	writeLine(text: string) {
		// biome-ignore lint/suspicious/noConsole: <explanation>
		// biome-ignore lint/suspicious/noConsoleLog: <explanation>
		console.log(text);
	}

	clearPreviousLine() {
		process.stdout.moveCursor(0, -1);
		process.stdout.clearScreenDown();
	}
}
