import { describe, expect, it, jest } from "@jest/globals";
import { createProgramFileItemsGenerator } from "~/__test-utils__/entity-factories";
import { ProgramFileProcessor } from "~/adapters/program-file-processor";
import { Rec } from "~/lib/rec";
import { processProgramFileItems } from "..";
import { createProgramFileEntries } from "../../__test-utils__/domain-entity-factories";
import { ProgramFileExpert } from "../../program-file-expert";

const nullDispatcherPort = { dispatch() {} };
const programFileProcessorPort = new ProgramFileProcessor();

function createProgramFileExpert() {
	return new ProgramFileExpert({
		settings: {
			aliases: new Rec<string, string>(),
			extraPackageEntries: { fileNames: [], filePaths: [] },
		},
	});
}

describe("program-file-items-processor", () => {
	it.each([
		{
			name: "should be empty result from empty files list",
			fileItems: [],
			result: createProgramFileEntries([]),
		},

		{
			name: "should be correct file entries for several files",
			fileItems: [
				{
					path: "/tmp/file1.ts",
					content: `import a from "b";`,
				},
				{
					path: "/tmp/file2.tsx",
					content: "export const a = 5;",
				},
				{
					path: "/tmp/dir1/index.js",
					content: "export default function F() {};",
				},
			],
			result: createProgramFileEntries([
				{
					content: `import a from "b";`,
					path: "/tmp/file1.ts",
					language: "typescript",
					ieItems: [
						{
							type: "standard-import",
							source: "b",
							values: ["default"],
						},
					],
				},
				{
					content: "export const a = 5;",
					path: "/tmp/file2.tsx",
					language: "typescript",
					ieItems: [
						{
							type: "standard-export",
							values: ["a"],
						},
					],
				},
				{
					content: "export default function F() {};",
					path: "/tmp/dir1/index.js",
					language: "javascript",
					ieItems: [
						{
							type: "standard-export",
							values: ["default"],
						},
					],
				},
			]),
		},
	])("$name", async ({ fileItems, result }) => {
		const { entries } = await processProgramFileItems({
			items: createProgramFileItemsGenerator(fileItems),
			programFileExpert: createProgramFileExpert(),
			dispatcherPort: nullDispatcherPort,
			programFileProcessorPort,
		});

		expect(entries).toEqual(result);
	});

	it.each([
		{
			name: "should be error if syntax in module is incorrect",
			fileItem: {
				path: "C:/file.ts",
				content: "import foo from 123;",
			},
			errorMessage: "Unexpected token (1:16)",
		},

		{
			name: "should be error if JSX syntax exists in ts file",
			fileItem: {
				path: "C:/file.ts",
				content: `
					export default function Foo() {
						return <div></div>;
					}
				`,
			},
			errorMessage: "Unexpected token (3:19)",
		},

		{
			name: "should be error if types exist in js file",
			fileItem: {
				path: "C:/file.js",
				content: `
					export default function foo(a: string, b: string): string {
						return a + b;
					}
				`,
			},
			errorMessage: `Unexpected token, expected "," (2:34)`,
		},
	])("$name", async ({ fileItem, errorMessage }) => {
		const { processorErrors } = await processProgramFileItems({
			items: createProgramFileItemsGenerator([fileItem]),
			programFileExpert: createProgramFileExpert(),
			dispatcherPort: nullDispatcherPort,
			programFileProcessorPort,
		});

		expect(processorErrors.get(fileItem.path).message).toEqual(errorMessage);
	});

	it("should dispatch all events", async () => {
		const dispatcherPort = { dispatch: jest.fn() };

		await processProgramFileItems({
			items: createProgramFileItemsGenerator([
				{
					path: "/tmp/file1.ts",
					content: `import a from "b";`,
				},
				{
					path: "/tmp/file2.js",
					content: "incorrect content",
				},
			]),
			programFileExpert: createProgramFileExpert(),
			dispatcherPort,
			programFileProcessorPort,
		});

		expect(dispatcherPort.dispatch.mock.calls).toEqual([
			["program-files-processing:started"],
			["program-files-processing:program-file-processed", { path: "/tmp/file1.ts" }],
			["program-files-processing:program-file-processing-failed", { path: "/tmp/file2.js", error: expect.any(Error) }],
			["program-files-processing:finished"],
		]);
	});
});
