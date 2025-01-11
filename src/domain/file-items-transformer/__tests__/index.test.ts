import { describe, expect, it, jest } from "@jest/globals";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { type FileItem, type ImportPath, transformFileItems } from "..";
import { createFileEntries, createFileItemsGenerator } from "../../__test-utils__/domain-entity-factories";

function createEmptyFileItem(path: string) {
	return { path, content: "" } as FileItem;
}

const nullDispatcherPort = { dispatch() {} };

describe("file-items-transformer", () => {
	it.each([
		{
			name: "should be empty result from empty files list",
			fileItems: [],
			result: createFileEntries([]),
		},

		{
			name: "should be empty result for no script files",
			fileItems: [
				createEmptyFileItem("/tmp/file.css"),
				createEmptyFileItem("/tmp/file.html"),
				createEmptyFileItem("/tmp/file.readme"),
				createEmptyFileItem("/tmp/.gitignore"),
				createEmptyFileItem("/tmp/file.json"),
				createEmptyFileItem("/tmp/file.pdf"),
				createEmptyFileItem("/tmp/file.js.orig"),
			],
			result: createFileEntries([]),
		},

		{
			name: "should discard c* & m.* script files",
			fileItems: [
				createEmptyFileItem("/tmp/file.mjs"),
				createEmptyFileItem("/tmp/file.mjsx"),
				createEmptyFileItem("/tmp/file.mts"),
				createEmptyFileItem("/tmp/file.mtsx"),
				createEmptyFileItem("/tmp/file.d.mts"),
				createEmptyFileItem("/tmp/file.cjs"),
				createEmptyFileItem("/tmp/file.cjsx"),
				createEmptyFileItem("/tmp/file.cts"),
				createEmptyFileItem("/tmp/file.ctsx"),
				createEmptyFileItem("/tmp/file.d.cts"),
				createEmptyFileItem("/tmp/file.js"),
				createEmptyFileItem("/tmp/file.jsx"),
				createEmptyFileItem("/tmp/file.ts"),
				createEmptyFileItem("/tmp/file.tsx"),
				createEmptyFileItem("/tmp/file.d.ts"),
			],
			result: createFileEntries([
				{
					content: "",
					path: "/tmp/file.js",
					language: "javascript",
					ieItems: [],
				},
				{
					content: "",
					path: "/tmp/file.jsx",
					language: "javascript",
					ieItems: [],
				},
				{
					content: "",
					path: "/tmp/file.d.ts",
					language: "typescript",
					ieItems: [],
				},
				{
					content: "",
					path: "/tmp/file.ts",
					language: "typescript",
					ieItems: [],
				},
				{
					content: "",
					path: "/tmp/file.tsx",
					language: "typescript",
					ieItems: [],
				},
			]),
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
							source: "b" as ImportPath,
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
			dispatcherPort: nullDispatcherPort,
		});

		expect(parserErrors.get(fileItem.path as AbsoluteFsPath).message).toEqual(errorMessage);
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
					path: "/tmp/file2.css",
					content: "* { margin: 0; padding: 0 }",
				},
				{
					path: "/tmp/file3.js",
					content: "incorrect content",
				},
			]),
			dispatcherPort,
		});

		expect(dispatcherPort.dispatch.mock.calls).toEqual([
			["file-item-processed", { path: "/tmp/file1.ts" }],
			["file-item-processing-failed", { path: "/tmp/file3.js", error: expect.any(Error) }],
			["all-file-items-processed"],
		]);
	});
});
