import { describe, it, expect, jest } from "@jest/globals";

import { EventHub } from "../event-hub";

describe("event-hub", () => {
	it.each([
		{
			name: "file-processed event",
			eventName: "file-processed" as const,
			eventData: { path: "C:/dir/file.ts" },
		},

		{
			name: "file-processing-failed event",
			eventName: "file-processing-failed" as const,
			eventData: { path: "C:/dir/file.ts", error: new Error("Error") },
		},

		{
			name: "files-processing-completed event",
			eventName: "files-processing-completed" as const,
			eventData: null,
		}
	])("$name", ({ eventName, eventData }) => {
		const fn = jest.fn();
		const hub = new EventHub();

		hub.on("file-processed", fn);
		hub.on("file-processing-failed", fn);
		hub.on("files-processing-completed", fn);

		hub.send(eventName, eventData);

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(eventData);
	});
});
