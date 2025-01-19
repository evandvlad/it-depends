import { describe, expect, it, jest } from "@jest/globals";
import { EventBus } from "~/lib/event-bus";
import type { GlobalEventBusRecord } from "~/values";
import { Logger } from "../logger";

function createTerminalPort() {
	return {
		writeLine: jest.fn(),
		clearPreviousLine() {},
	};
}

describe("logger", () => {
	it("should process events correctly", () => {
		const eventBus = new EventBus<GlobalEventBusRecord>();
		const terminalPort = createTerminalPort();

		new Logger({ subscriberPort: eventBus, terminalPort });

		eventBus.dispatch("app:started");
		eventBus.dispatch("settings-preparation:started");
		eventBus.dispatch("settings-preparation:finished");
		eventBus.dispatch("files-transformation:started");
		eventBus.dispatch("files-transformation:file-processed", { path: "src/file1.ts" });
		eventBus.dispatch("files-transformation:file-processed", { path: "src/file2.ts" });
		eventBus.dispatch("files-transformation:file-processing-failed", {
			path: "src/file2.ts",
			error: new Error("Ooops"),
		});
		eventBus.dispatch("files-transformation:file-processed", { path: "src/file4.ts" });
		eventBus.dispatch("files-transformation:finished");
		eventBus.dispatch("report-generation:started");
		eventBus.dispatch("report-generation:finished", { path: "/report/index.html" });
		eventBus.dispatch("app:finished");

		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(1, expect.stringContaining("Started"));
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(2, expect.stringContaining("Options checking"));
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("Options was successfully checked"),
		);
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(4, expect.stringContaining("File processing started"));
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(
			5,
			expect.stringContaining("File processing. Processed 1 file(s)."),
		);
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(
			6,
			expect.stringContaining("File processing. Processed 2 file(s)."),
		);
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(
			7,
			expect.stringContaining("File processing. Processed 3 file(s)."),
		);
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(
			8,
			expect.stringContaining("File processing finished. Unfortunately, 1 file(s) was/were not processed."),
		);
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(9, expect.stringContaining("Report generation started"));
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(
			10,
			expect.stringContaining("Report generation finished. Path to the report - /report/index.html"),
		);
		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(11, expect.stringContaining("Done"));
	});

	it("should write down about accepted error", () => {
		const eventBus = new EventBus<GlobalEventBusRecord>();
		const terminalPort = createTerminalPort();

		const logger = new Logger({ subscriberPort: eventBus, terminalPort });

		logger.acceptAppLevelError(new Error("Oh("));

		expect(terminalPort.writeLine).toHaveBeenNthCalledWith(1, expect.stringContaining("Oh. An error occured: 'Oh('"));
	});
});
