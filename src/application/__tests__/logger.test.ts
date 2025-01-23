import { describe, expect, it, jest } from "@jest/globals";
import { EventBus } from "~/lib/event-bus";
import type { GlobalEventBusRecord } from "~/values";
import { Logger } from "../logger";

function createSutComponents() {
	const params = {
		terminalPort: {
			writeLine: jest.fn(),
			clearPreviousLine() {},
		},
		subscriberPort: new EventBus<GlobalEventBusRecord>(),
	};

	const instance = new Logger(params);

	return { instance, params };
}

describe("logger", () => {
	it("should process events correctly", () => {
		const { params } = createSutComponents();

		params.subscriberPort.dispatch("app:started");
		params.subscriberPort.dispatch("settings-preparation:started");
		params.subscriberPort.dispatch("settings-preparation:finished");
		params.subscriberPort.dispatch("program-files-processing:started");
		params.subscriberPort.dispatch("program-files-processing:program-file-processed", { path: "src/file1.ts" });
		params.subscriberPort.dispatch("program-files-processing:program-file-processed", { path: "src/file2.ts" });
		params.subscriberPort.dispatch("program-files-processing:program-file-processing-failed", {
			path: "src/file2.ts",
			error: new Error("Ooops"),
		});
		params.subscriberPort.dispatch("program-files-processing:program-file-processed", { path: "src/file4.ts" });
		params.subscriberPort.dispatch("program-files-processing:finished");
		params.subscriberPort.dispatch("report-generation:started");
		params.subscriberPort.dispatch("report-generation:finished", { path: "/report/index.html" });
		params.subscriberPort.dispatch("app:finished");

		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(1, expect.stringContaining("Started"));
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(2, expect.stringContaining("Options checking"));
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("Options was successfully checked"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			4,
			expect.stringContaining("Program files processing started"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			5,
			expect.stringContaining("Program files processing. Processed 1 file(s)."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			6,
			expect.stringContaining("Program files processing. Processed 2 file(s)."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			7,
			expect.stringContaining("Program files processing. Processed 3 file(s)."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			8,
			expect.stringContaining("Program files processing finished. Unfortunately, 1 file(s) was/were not processed."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			9,
			expect.stringContaining("Report generation started"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			10,
			expect.stringContaining("Report generation finished. Path to the report - /report/index.html"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(11, expect.stringContaining("Done"));
	});

	it("should write down about accepted error", () => {
		const { instance, params } = createSutComponents();

		instance.acceptAppLevelError(new Error("Oh("));

		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining("Oh. An error occured: 'Oh('"),
		);
	});
});
