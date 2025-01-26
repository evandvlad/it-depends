import { describe, expect, it, jest } from "@jest/globals";
import { EventBus } from "~/lib/event-bus";
import { Logger } from "../logger";
import type { GlobalEventBusRecord } from "../values";

function createSutComponents() {
	const params = {
		terminalPort: {
			writeLine: jest.fn(),
			clearPreviousLine() {},
		},
		subscriber: new EventBus<GlobalEventBusRecord>(),
	};

	const instance = new Logger(params);

	return { instance, params };
}

describe("logger", () => {
	it("should process events correctly", () => {
		const { params } = createSutComponents();

		params.subscriber.dispatch("app:started");
		params.subscriber.dispatch("settings-preparation:started");
		params.subscriber.dispatch("settings-preparation:finished");
		params.subscriber.dispatch("program-files-loading:started");
		params.subscriber.dispatch("program-files-loading:finished");
		params.subscriber.dispatch("program-files-processing:started");
		params.subscriber.dispatch("program-files-processing:program-file-processed", { path: "src/file1.ts" });
		params.subscriber.dispatch("program-files-processing:program-file-processed", { path: "src/file2.ts" });
		params.subscriber.dispatch("program-files-processing:program-file-processing-failed", {
			path: "src/file2.ts",
			error: new Error("Ooops"),
		});
		params.subscriber.dispatch("program-files-processing:program-file-processed", { path: "src/file4.ts" });
		params.subscriber.dispatch("program-files-processing:finished");
		params.subscriber.dispatch("report-generation:started");
		params.subscriber.dispatch("report-generation:finished", { path: "/report/index.html" });
		params.subscriber.dispatch("app:finished");

		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(1, expect.stringContaining("Started"));
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(2, expect.stringContaining("Options checking"));
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			3,
			expect.stringContaining("Options was successfully checked"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			4,
			expect.stringContaining("Program files loading started"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			5,
			expect.stringContaining("Program files loading finished"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			6,
			expect.stringContaining("Program files processing started"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			7,
			expect.stringContaining("Program files processing. Processed 1 file(s)."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			8,
			expect.stringContaining("Program files processing. Processed 2 file(s)."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			9,
			expect.stringContaining("Program files processing. Processed 3 file(s)."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			10,
			expect.stringContaining("Program files processing finished. Unfortunately, 1 file(s) was/were not processed."),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			11,
			expect.stringContaining("Report generation started"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(
			12,
			expect.stringContaining("Report generation finished. Path to the report - /report/index.html"),
		);
		expect(params.terminalPort.writeLine).toHaveBeenNthCalledWith(13, expect.stringContaining("Done"));
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
