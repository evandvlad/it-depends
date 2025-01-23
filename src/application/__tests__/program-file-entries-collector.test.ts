import { describe, expect, it, jest } from "@jest/globals";
import { AppError } from "~/lib/errors";
import { ProgramFileEntriesCollector } from "../program-file-entries-collector";

async function* createProgramFileItems(items: Array<{ content: string; path: string }>) {
	for await (const item of items) {
		yield Promise.resolve(item);
	}
}

function createSutComponents() {
	const params = {
		dispatcherPort: {
			dispatch() {},
		},
		programFileProcessorPort: {
			process: jest.fn(({ path, content, details }) => ({
				path,
				content,
				language: details.language,
				ieItems: [],
			})),
		},
		programFileDetailsGetter: () => ({ language: "typescript" as const, allowedJSXSyntax: false }),
	};

	const instance = new ProgramFileEntriesCollector(params);

	return { params, instance };
}

describe("program-file-entries-collector", () => {
	it("should throw error if no one file was processed", async () => {
		const { instance } = createSutComponents();

		await expect(instance.collect(createProgramFileItems([]))).rejects.toThrow(
			new AppError("No files have been found for processing. It seems like a problem with the configuration."),
		);
	});

	it("should process one file correctly", async () => {
		const events: string[] = [];
		const { instance, params } = createSutComponents();

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		params.dispatcherPort.dispatch = (...args: any[]) => {
			events.push(args[0]);
		};

		const { entries, processorErrors } = await instance.collect(
			createProgramFileItems([{ path: "/src/file.ts", content: "" }]),
		);

		expect(entries.size).toEqual(1);
		expect(entries.get("/src/file.ts")).toEqual({
			path: "/src/file.ts",
			content: "",
			language: "typescript",
			ieItems: [],
		});
		expect(processorErrors.size).toEqual(0);

		expect(events).toEqual([
			"program-files-processing:started",
			"program-files-processing:program-file-processed",
			"program-files-processing:finished",
		]);
	});

	it("should process error from processor correctly", async () => {
		const events: string[] = [];
		const { instance, params } = createSutComponents();

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		params.dispatcherPort.dispatch = (...args: any[]) => {
			events.push(args[0]);
		};

		params.programFileProcessorPort.process.mockImplementation(({ path, content, details }) => {
			if (path === "/src/file1.ts") {
				throw new Error("error");
			}

			return {
				path,
				content,
				language: details.language,
				ieItems: [],
			};
		});

		const { entries, processorErrors } = await instance.collect(
			createProgramFileItems([
				{ path: "/src/file1.ts", content: "" },
				{ path: "/src/file2.ts", content: "" },
			]),
		);

		expect(entries.size).toEqual(1);
		expect(entries.get("/src/file2.ts")).toEqual({
			path: "/src/file2.ts",
			content: "",
			language: "typescript",
			ieItems: [],
		});
		expect(processorErrors.size).toEqual(1);

		expect(events).toEqual([
			"program-files-processing:started",
			"program-files-processing:program-file-processing-failed",
			"program-files-processing:program-file-processed",
			"program-files-processing:finished",
		]);
	});
});
