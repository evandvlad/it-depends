import { describe, it, expect } from "@jest/globals";
import { createFilesGenerator, createSummary } from "../../__test-utils__";

import { ModuleFile } from "../../values";
import { FSTree } from "../../lib/fs-tree";
import { transformFiles } from "../../transformer";
import { collectPackages } from "../../packages-collector";
import { collectSummary } from "..";

describe("summary-collector", () => {
	async function collectSummaryFromModuleFiles(files: ModuleFile[]) {
		const { modulesRegistry } = await transformFiles({
			files: createFilesGenerator(files),
			importAliasMapper: () => null,
			eventSender: () => {},
		});

		const fsTree = new FSTree(modulesRegistry.paths);

		const packagesRegistry = collectPackages({
			fsTree,
			extraPackageEntryFileNames: [],
			extraPackageEntryFilePaths: [],
		});

		return collectSummary({ modulesRegistry, packagesRegistry, parserErrors: {} });
	}

	it.each([
		{
			name: "single module & with out of scope import",
			files: [
				{
					path: "C:/dir/index.ts",
					code: `
						import bar from "foo";
						export const foo = "foo";
					`,
				},
			],
			result: createSummary({
				packagesCount: 1,
				modulesCounter: {
					typescript: 1,
					javascript: 0,
				},
				outOfScopeImports: {
					"C:/dir/index.ts": ["foo"],
				},
				possiblyUnusedExportValues: {
					"C:/dir/index.ts": ["foo"],
				},
			}),
		},

		{
			name: "module with dynamic imports",
			files: [
				{
					path: "/dir/file.jsx",
					code: `
						export const foo = "foo";
						
						const path1 = "bar";
						const path2 = "baz";

						await import(path1);
						await import(path2);
					`,
				},
				{
					path: "/dir/index.ts",
					code: `import * as bar from "./file";`,
				},
			],
			result: createSummary({
				packagesCount: 1,
				modulesCounter: {
					typescript: 1,
					javascript: 1,
				},
				unparsedDynamicImportsCounter: {
					"/dir/file.jsx": 2,
				},
				emptyExports: ["/dir/index.ts"],
			}),
		},

		{
			name: "module with unresolved full imports",
			files: [
				{
					path: "C:/dir/index.tsx",
					code: `
						import * as foo from "foo";
						import * as bar from "bar";
					`,
				},
			],
			result: createSummary({
				packagesCount: 1,
				modulesCounter: {
					typescript: 1,
					javascript: 0,
				},
				unresolvedFullImportsCounter: {
					"C:/dir/index.tsx": 2,
				},
				emptyExports: ["C:/dir/index.tsx"],
			}),
		},

		{
			name: "module with unresolved re-exports",
			files: [
				{
					path: "C:/dir/index.tsx",
					code: `import { bar } from "./file";`,
				},
				{
					path: "C:/dir/file.ts",
					code: `export * from "foo";`,
				},
			],
			result: createSummary({
				packagesCount: 1,
				modulesCounter: {
					typescript: 2,
					javascript: 0,
				},
				unresolvedFullImportsCounter: {
					"C:/dir/file.ts": 1,
				},
				unresolvedFullExportsCounter: {
					"C:/dir/file.ts": 1,
				},
				emptyExports: ["C:/dir/index.tsx"],
			}),
		},

		{
			name: "module with shadowed export value",
			files: [
				{
					path: "/dir/file1.js",
					code: `
						export const foo = "foo";
						export const bar = "bar";
					`,
				},
				{
					path: "/dir/file2.js",
					code: `
						export * from "./file1";
						export const bar = "baz";
					`,
				},
				{
					path: "/dir/index.js",
					code: `import { foo, bar } from "./file2";`,
				},
			],
			result: createSummary({
				packagesCount: 1,
				modulesCounter: {
					typescript: 0,
					javascript: 3,
				},
				shadowedExportValuesCounter: {
					"/dir/file2.js": 1,
				},
				emptyExports: ["/dir/index.js"],
			}),
		},

		{
			name: "module with incorrect import",
			files: [
				{
					path: "/dir1/file.ts",
					code: `export const foo = "foo";`,
				},
				{
					path: "/dir1/index.ts",
					code: `import { foo } from "./file";`,
				},
				{
					path: "/dir2/index.ts",
					code: `import { foo } from "../dir1/file";`,
				},
			],
			result: createSummary({
				packagesCount: 2,
				modulesCounter: {
					typescript: 3,
					javascript: 0,
				},
				emptyExports: ["/dir1/index.ts", "/dir2/index.ts"],
				incorrectImports: {
					"/dir2/index.ts": [{ filePath: "/dir1/file.ts", importPath: "../dir1/file" }],
				},
			}),
		},
	])("$name", async ({ files, result }) => {
		const summary = await collectSummaryFromModuleFiles(files);
		expect(summary).toEqual(result);
	});

	describe("incorrect imports", () => {
		it.each([
			{
				name: "correct for files in the same package",
				files: [
					{
						path: "/dir/file.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "/dir/index.ts",
						code: `import { foo } from "./file"`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct for the same package & import of entry point",
				files: [
					{
						path: "C:/dir/index.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "C:/dir/file.ts",
						code: `import { foo } from "."`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct for explicit entry point",
				files: [
					{
						path: "/dir/index.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "/dir/file.ts",
						code: `import { foo } from "./index"`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct import of out of scope module",
				files: [
					{
						path: "/dir/index.ts",
						code: `import foo from "../../foo";`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct import for module without package",
				files: [
					{
						path: "C:/dir1/index.ts",
						code: `import foo from "../dir2/file";`,
					},
					{
						path: "C:/dir2/file.ts",
						code: `export default function() {}`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct import for both modules without packages",
				files: [
					{
						path: "C:/dir1/file.ts",
						code: `import foo from "../dir2/file";`,
					},
					{
						path: "C:/dir2/file.ts",
						code: `export default function() {}`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct for the sibling packages with import from entry point",
				files: [
					{
						path: "/dir1/file.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "/dir1/index.tsx",
						code: `export * from "./file";`,
					},
					{
						path: "/dir2/index.js",
						code: `import { foo } from "../dir1";`,
					},
				],
				isCorrect: true,
			},
			{
				name: "incorrect for the sibling packages with import from not entry point",
				files: [
					{
						path: "/dir1/file.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "/dir1/index.tsx",
						code: `export * from "./file";`,
					},
					{
						path: "/dir2/index.js",
						code: `import { foo } from "../dir1/file";`,
					},
				],
				isCorrect: false,
			},

			{
				name: "correct from parent package with import from not entry point",
				files: [
					{
						path: "C:/dir1/index.tsx",
						code: `export * from "./file1"`,
					},
					{
						path: "C:/dir1/file1.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "C:/dir1/dir2/file2.js",
						code: `import { foo } from "../file1";`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct from direct ancestor package with import from not entry point",
				files: [
					{
						path: "/dir1/index.tsx",
						code: `export * from "./file";`,
					},
					{
						path: "/dir1/file1.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "/dir1/dir2/index.js",
						code: `export * from "./dir3";`,
					},
					{
						path: "/dir1/dir2/dir3/index.jsx",
						code: `export * from "./file2";`,
					},
					{
						path: "/dir1/dir2/dir3/file2.ts",
						code: `
							import { foo } from "../../file1";
							export const bar = "bar";
						`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct from direct ancestor package with import from entry point",
				files: [
					{
						path: "C:/dir1/index.tsx",
						code: `export * from "./file1";`,
					},
					{
						path: "C:/dir1/file1.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "C:/dir1/dir2/index.js",
						code: `export * from "./dir3";`,
					},
					{
						path: "C:/dir1/dir2/dir3/index.jsx",
						code: `export * from "./file2";`,
					},
					{
						path: "C:/dir1/dir2/dir3/file2.ts",
						code: `
							import { foo } from "../..";
							export const bar = "bar";
						`,
					},
				],
				isCorrect: true,
			},

			{
				name: "correct from outer package with import from entry point",
				files: [
					{
						path: "/dir1/index.tsx",
						code: `export * from "./dir2";`,
					},
					{
						path: "/dir1/dir2/index.js",
						code: `export * from "./dir3";`,
					},
					{
						path: "/dir1/dir22/index.js",
						code: `export const bar = "bar";`,
					},
					{
						path: "/dir1/dir2/dir3/index.jsx",
						code: `export * from "./file2";`,
					},
					{
						path: "/dir1/dir2/dir3/file2.ts",
						code: `
							import { foo } from "../../dir22";
							export const bar = "bar";
						`,
					},
				],
				isCorrect: true,
			},

			{
				name: "incorrect from outer package with import from not entry point",
				files: [
					{
						path: "C:/dir1/index.tsx",
						code: `export * from "./dir22";`,
					},
					{
						path: "C:/dir1/dir22/index.ts",
						code: `export * from "./file1";`,
					},
					{
						path: "C:/dir1/dir22/file1.ts",
						code: `export const foo = "foo";`,
					},
					{
						path: "C:/dir1/dir2/index.js",
						code: `export * from "./dir3";`,
					},
					{
						path: "C:/dir1/dir2/dir3/index.jsx",
						code: `export * from "./file2";`,
					},
					{
						path: "C:/dir1/dir2/dir3/file2.ts",
						code: `
							import { foo } from "../../dir22/file1";
							export const bar = "bar";
						`,
					},
				],
				isCorrect: false,
			},

			{
				name: "correct from child package from entry point",
				files: [
					{
						path: "/dir1/index.ts",
						code: `import { foo } from "./dir2";`,
					},
					{
						path: "/dir1/dir2/index.ts",
						code: `export const foo = "foo";`,
					},
				],
				isCorrect: true,
			},

			{
				name: "incorrect from child package from non entry point",
				files: [
					{
						path: "C:/dir1/index.ts",
						code: `import { foo } from "./dir2/file";`,
					},
					{
						path: "C:/dir1/dir2/index.ts",
						code: `export * from "./file";`,
					},
					{
						path: "C:/dir1/dir2/file.ts",
						code: `export const foo = "foo";`,
					},
				],
				isCorrect: false,
			},

			{
				name: "incorrect from descendant package with violation on child package",
				files: [
					{
						path: "/dir1/index.ts",
						code: `import { foo } from "./dir2/dir3";`,
					},
					{
						path: "/dir1/dir2/index.ts",
						code: `export * from "./dir3"`,
					},
					{
						path: "/dir1/dir2/dir3/index.ts",
						code: `export const foo = "foo";`,
					},
				],
				isCorrect: false,
			},
		])("$name", async ({ files, isCorrect }) => {
			const summary = await collectSummaryFromModuleFiles(files);
			expect(Object.keys(summary.incorrectImports).length === 0).toEqual(isCorrect);
		});
	});
});
