import { describe, expect, it, jest } from "@jest/globals";
import { createFileItemsGenerator } from "~/__test-utils__/entity-factories";
import { Rec } from "~/lib/rec";
import { transformFileItems } from "..";
import { createFileEntries } from "../../__test-utils__/domain-entity-factories";
import { ProgramFileExpert } from "../../program-file-expert";

const nullDispatcherPort = { dispatch() {} };

function createProgramFileExpert() {
	return new ProgramFileExpert({
		settings: {
			aliases: new Rec<string, string>(),
			extraPackageEntries: { fileNames: [], filePaths: [] },
		},
	});
}

describe("file-items-transformer", () => {
	it.each([
		{
			name: "should be empty result from empty files list",
			fileItems: [],
			result: createFileEntries([]),
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
			result: createFileEntries([
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
		const { fileEntries } = await transformFileItems({
			fileItems: createFileItemsGenerator(fileItems),
			programFileExpert: createProgramFileExpert(),
			dispatcherPort: nullDispatcherPort,
		});

		expect(fileEntries).toEqual(result);
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
		const { parserErrors } = await transformFileItems({
			fileItems: createFileItemsGenerator([fileItem]),
			programFileExpert: createProgramFileExpert(),
			dispatcherPort: nullDispatcherPort,
		});

		expect(parserErrors.get(fileItem.path).message).toEqual(errorMessage);
	});

	it("should dispatch all events", async () => {
		const dispatcherPort = { dispatch: jest.fn() };

		await transformFileItems({
			fileItems: createFileItemsGenerator([
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
		});

		expect(dispatcherPort.dispatch.mock.calls).toEqual([
			["files-transformation:started"],
			["files-transformation:file-processed", { path: "/tmp/file1.ts" }],
			["files-transformation:file-processing-failed", { path: "/tmp/file2.js", error: expect.any(Error) }],
			["files-transformation:finished"],
		]);
	});
});
