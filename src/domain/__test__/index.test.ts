import { describe, expect, it, jest } from "@jest/globals";
import { AppError } from "../../lib/errors";
import type { AbsoluteFsPath } from "../../lib/fs-path";
import { Rec } from "../../lib/rec";
import {
	createFileItemsGenerator,
	createModule,
	createModules,
	createPackage,
	createPackages,
	createSummary,
} from "../__test-utils__";

import { type ImportAliasMapper, process } from "..";

const nullDispatcherPort = { dispatch() {} };
const nullSettings = { importAliasMapper: () => null, extraPackageEntries: { fileNames: [], filePaths: [] } };

describe("domain", () => {
	it("should be error for empty file items", async () => {
		await expect(
			process({ fileItems: createFileItemsGenerator([]), dispatcherPort: nullDispatcherPort, settings: nullSettings }),
		).rejects.toThrow(new AppError("File paths list is empty"));
	});

	describe("modules", () => {
		it.each([
			{
				name: "should be single module without imports/exports",
				fileItems: [{ path: "C:/file.ts", content: `console.log("Hello world")` }],
				result: createModules([
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
					}),
				]),
			},

			{
				name: "should be single module with out of scope named import",
				fileItems: [
					{
						path: "C:/file.ts",
						content: `import { bar, baz } from "foo";`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
						imports: [
							{
								importSource: { importPath: "foo" },
								values: ["bar", "baz"],
							},
						],
					}),
				]),
			},

			{
				name: "should be two linked modules",
				fileItems: [
					{
						path: "/file1.js",
						content: `
								export const foo = "foo";
								export const bar = "bar";
								export default function() {}; 
							`,
					},
					{
						path: "/file2.jsx",
						content: `import baz, { foo, bar } from "./file1";`,
					},
				],
				result: createModules([
					createModule({
						path: "/file1.js",
						name: "file1.js",
						language: "javascript",
						exports: Rec.fromObject({
							foo: ["/file2.jsx"],
							bar: ["/file2.jsx"],
							default: ["/file2.jsx"],
						}),
					}),
					createModule({
						path: "/file2.jsx",
						name: "file2.jsx",
						language: "javascript",
						imports: [
							{
								importSource: { filePath: "/file1.js", importPath: "./file1" },
								values: ["default", "foo", "bar"],
							},
						],
					}),
				]),
			},

			{
				name: "should be three linked modules",
				fileItems: [
					{
						path: "/dir1/file1.ts",
						content: `
								export const foo = 1;
								export const bar = 2;
								export const baz = 3;
								export default function() {};
							`,
					},
					{
						path: "/file2.ts",
						content: `import { foo, default as qux } from "../dir1/file1";`,
					},
					{
						path: "/dir2/dir3/file3.ts",
						content: `import qux, { foo, bar } from "../../dir1/file1";`,
					},
				],
				result: createModules([
					createModule({
						path: "/dir1/file1.ts",
						name: "file1.ts",
						exports: Rec.fromObject({
							foo: ["/file2.ts", "/dir2/dir3/file3.ts"],
							bar: ["/dir2/dir3/file3.ts"],
							baz: [],
							default: ["/file2.ts", "/dir2/dir3/file3.ts"],
						}),
					}),
					createModule({
						path: "/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: {
									filePath: "/dir1/file1.ts",
									importPath: "../dir1/file1",
								},
								values: ["foo", "default"],
							},
						],
					}),
					createModule({
						path: "/dir2/dir3/file3.ts",
						name: "file3.ts",
						imports: [
							{
								importSource: {
									filePath: "/dir1/file1.ts",
									importPath: "../../dir1/file1",
								},
								values: ["default", "foo", "bar"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed with alias import mapping",
				fileItems: [
					{
						path: "C:/file1.tsx",
						content: "export default class {};",
					},
					{
						path: "C:/file2.tsx",
						content: `import foo from "~/file1";`,
					},
				],
				importAliasMapper(importPath: string) {
					return importPath === "~/file1" ? "C:/file1" : null;
				},
				result: createModules([
					createModule({
						path: "C:/file1.tsx",
						name: "file1.tsx",
						exports: Rec.fromObject({
							default: ["C:/file2.tsx"],
						}),
					}),
					createModule({
						path: "C:/file2.tsx",
						name: "file2.tsx",
						imports: [
							{
								importSource: {
									filePath: "C:/file1.tsx",
									importPath: "~/file1",
								},
								values: ["default"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as out of scope named import",
				fileItems: [
					{
						path: "C:/file.ts",
						content: `import { qux, quux } from "../../../../out-of-scope";`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
						imports: [
							{
								importSource: { importPath: "../../../../out-of-scope" },
								values: ["qux", "quux"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as out of scope full import",
				fileItems: [
					{
						path: "C:/file.ts",
						content: `import * as foo from "../../../../out-of-scope";`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
						unresolvedFullImports: [{ importPath: "../../../../out-of-scope" }],
					}),
				]),
			},

			{
				name: "should be processed as side effect import",
				fileItems: [
					{
						path: "C:/dir1/dir2/file1.ts",
						content: "export default class {}",
					},
					{
						path: "C:/dir1/dir2/file2.ts",
						content: `import "./file1";`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/dir1/dir2/file1.ts",
						name: "file1.ts",
						exports: Rec.fromObject({
							default: [],
						}),
					}),
					createModule({
						path: "C:/dir1/dir2/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: {
									filePath: "C:/dir1/dir2/file1.ts",
									importPath: "./file1",
								},
								values: [],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as empty named import",
				fileItems: [
					{
						path: "/file1.ts",
						content: `export const foo = "foo";`,
					},
					{
						path: "/file2.ts",
						content: `import {} from "./file1";`,
					},
				],
				result: createModules([
					createModule({
						path: "/file1.ts",
						name: "file1.ts",
						exports: Rec.fromObject({
							foo: [],
						}),
					}),
					createModule({
						path: "/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: { filePath: "/file1.ts", importPath: "./file1" },
								values: [],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as empty exports",
				fileItems: [
					{
						path: "C:/dir/index.jsx",
						content: "export {};",
					},
					{
						path: "C:/file.ts",
						content: `import * as all from "./dir";`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/dir/index.jsx",
						name: "index.jsx",
						package: "C:/dir",
						language: "javascript",
					}),
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
						imports: [
							{
								importSource: {
									filePath: "C:/dir/index.jsx",
									importPath: "./dir",
								},
								values: [],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as dynamic import",
				fileItems: [
					{
						path: "C:/dir/index.ts",
						content: `
								export const foo = "foo";
								export const bar = "bar";
							`,
					},
					{
						path: "C:/dir/file.ts",
						content: `const data = await import(".");`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/dir/index.ts",
						name: "index.ts",
						package: "C:/dir",
						exports: Rec.fromObject({
							foo: ["C:/dir/file.ts"],
							bar: ["C:/dir/file.ts"],
						}),
					}),
					createModule({
						path: "C:/dir/file.ts",
						name: "file.ts",
						package: "C:/dir",
						imports: [
							{
								importSource: { filePath: "C:/dir/index.ts", importPath: "." },
								values: ["foo", "bar"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as unparsed dynamic import",
				fileItems: [
					{
						path: "C:/file1.ts",
						content: `
								export const foo = "foo";
								export const bar = "bar";
							`,
					},
					{
						path: "C:/file2.ts",
						content: `
								const importPath = "./file1";
								const data = await import(importPath);
							`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file1.ts",
						name: "file1.ts",
						exports: Rec.fromObject({
							foo: [],
							bar: [],
						}),
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						unparsedDynamicImports: 1,
					}),
				]),
			},

			{
				name: "should be processed as simple re-export",
				fileItems: [
					{
						path: "C:/file1.ts",
						content: `
								export type Bar = string | number;
								export default class {};
							`,
					},
					{
						path: "C:/file2.ts",
						content: `export { Bar as Baz } from "./file1";`,
					},
					{
						path: "C:/dir/file3.ts",
						content: `
								import { Baz } from "../file2";
								import foo from "../file1";
							`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file1.ts",
						name: "file1.ts",
						exports: Rec.fromObject({
							default: ["C:/dir/file3.ts"],
							Bar: ["C:/file2.ts"],
						}),
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: { filePath: "C:/file1.ts", importPath: "./file1" },
								values: ["Bar"],
							},
						],
						exports: Rec.fromObject({
							Baz: ["C:/dir/file3.ts"],
						}),
					}),
					createModule({
						path: "C:/dir/file3.ts",
						name: "file3.ts",
						imports: [
							{
								importSource: { filePath: "C:/file2.ts", importPath: "../file2" },
								values: ["Baz"],
							},
							{
								importSource: { filePath: "C:/file1.ts", importPath: "../file1" },
								values: ["default"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed with full re-export/import",
				fileItems: [
					{
						path: "C:/file1.d.ts",
						content: `
								export interface Qux {};
								export type Quux = Qux | null;
							`,
					},
					{
						path: "C:/file2/index.ts",
						content: `export * from "../file1";`,
					},
					{
						path: "C:/file3.tsx",
						content: `import * as all from "./file2"`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file1.d.ts",
						name: "file1.d.ts",
						exports: Rec.fromObject({
							Qux: ["C:/file2/index.ts"],
							Quux: ["C:/file2/index.ts"],
						}),
					}),
					createModule({
						path: "C:/file2/index.ts",
						name: "index.ts",
						package: "C:/file2",
						imports: [
							{
								importSource: { filePath: "C:/file1.d.ts", importPath: "../file1" },
								values: ["Qux", "Quux"],
							},
						],
						exports: Rec.fromObject({
							Qux: ["C:/file3.tsx"],
							Quux: ["C:/file3.tsx"],
						}),
					}),
					createModule({
						path: "C:/file3.tsx",
						name: "file3.tsx",
						imports: [
							{
								importSource: { filePath: "C:/file2/index.ts", importPath: "./file2" },
								values: ["Qux", "Quux"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as export of duplicate values",
				fileItems: [
					{
						path: "C:/dir/file1.ts",
						content: `
								export const foo = "foo";
								export const bar = "bar";
							`,
					},
					{
						path: "C:/dir/file2.ts",
						content: `
								export const bar = "BAR";
								export * from "./file1";
							`,
					},
					{
						path: "C:/dir/file3.ts",
						content: `import * as all from "./file2";`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/dir/file1.ts",
						name: "file1.ts",
						exports: Rec.fromObject({
							foo: ["C:/dir/file2.ts"],
							bar: ["C:/dir/file2.ts"],
						}),
					}),
					createModule({
						path: "C:/dir/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: { filePath: "C:/dir/file1.ts", importPath: "./file1" },
								values: ["foo", "bar"],
							},
						],
						exports: Rec.fromObject({
							bar: ["C:/dir/file3.ts"],
							foo: ["C:/dir/file3.ts"],
						}),
						shadowedExportValues: ["bar"],
					}),
					createModule({
						path: "C:/dir/file3.ts",
						name: "file3.ts",
						imports: [
							{
								importSource: { filePath: "C:/dir/file2.ts", importPath: "./file2" },
								values: ["bar", "foo"],
							},
						],
					}),
				]),
			},

			{
				name: "should be processed as out of scope full re-export",
				fileItems: [
					{
						path: "/file1.ts",
						content: `export * from "foo";`,
					},
					{
						path: "/file2.ts",
						content: `import { bar } from "./file1";`,
					},
				],
				result: createModules([
					createModule({
						path: "/file1.ts",
						name: "file1.ts",
						unresolvedFullExports: [{ importPath: "foo" }],
						unresolvedFullImports: [{ importPath: "foo" }],
					}),
					createModule({
						path: "/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: { filePath: "/file1.ts", importPath: "./file1" },
								values: ["bar"],
							},
						],
					}),
				]),
			},

			{
				name: "should be process as nested full re-exports with out of scope item",
				fileItems: [
					{
						path: "C:/file4.ts",
						content: `import * as all from "./file3";`,
					},
					{
						path: "C:/file3.ts",
						content: `export * from "./file2";`,
					},
					{
						path: "C:/file2.ts",
						content: `
								export * from "./file1";
								export * from "bar";
							`,
					},
					{
						path: "C:/file1.tsx",
						content: `
								export const foo = "foo";
								export default function Foo() { return <span></span>;}
							`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/file4.ts",
						name: "file4.ts",
						unresolvedFullImports: [{ filePath: "C:/file3.ts", importPath: "./file3" }],
					}),
					createModule({
						path: "C:/file3.ts",
						name: "file3.ts",
						unresolvedFullExports: [{ filePath: "C:/file2.ts", importPath: "./file2" }],
						unresolvedFullImports: [{ filePath: "C:/file2.ts", importPath: "./file2" }],
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: { filePath: "C:/file1.tsx", importPath: "./file1" },
								values: ["foo", "default"],
							},
						],
						unresolvedFullExports: [{ filePath: "C:/file1.tsx", importPath: "./file1" }, { importPath: "bar" }],
						unresolvedFullImports: [{ importPath: "bar" }],
					}),
					createModule({
						path: "C:/file1.tsx",
						name: "file1.tsx",
						exports: Rec.fromObject({
							foo: ["C:/file2.ts"],
							default: ["C:/file2.ts"],
						}),
					}),
				]),
			},

			{
				name: "should process cycled dependencies",
				fileItems: [
					{
						path: "C:/dir/index.ts",
						content: `	
								import { type Foo } from "./dir2/file";
								export enum Bar {};
								export default class C implements Foo {}
							`,
					},
					{
						path: "C:/dir/dir2/file.ts",
						content: `
								import { Bar } from "..";
								export interface Foo {
									bar: Bar;
								}
							`,
					},
				],
				result: createModules([
					createModule({
						path: "C:/dir/index.ts",
						name: "index.ts",
						package: "C:/dir",
						exports: Rec.fromObject({
							Bar: ["C:/dir/dir2/file.ts"],
							default: [],
						}),
						imports: [
							{
								importSource: {
									filePath: "C:/dir/dir2/file.ts",
									importPath: "./dir2/file",
								},
								values: ["Foo"],
							},
						],
					}),
					createModule({
						path: "C:/dir/dir2/file.ts",
						name: "file.ts",
						package: "C:/dir",
						exports: Rec.fromObject({
							Foo: ["C:/dir/index.ts"],
						}),
						imports: [
							{
								importSource: { filePath: "C:/dir/index.ts", importPath: ".." },
								values: ["Bar"],
							},
						],
					}),
				]),
			},

			{
				name: "should process several imports from the same source",
				fileItems: [
					{
						path: "C:/file1/index.ts",
						content: `
								export const foo = "foo";
								export const bar = "bar";
								export const baz = "baz";
								export default async function* qux() {} 
							`,
					},
					{
						path: "C:/file2.ts",
						content: `
								import { foo, default as Quux } from "./file1";
								import quux from "~/file1";
								import { bar, baz } from "./file1/index"; 
							`,
					},
				],
				importAliasMapper(importPath: string) {
					return importPath === "~/file1" ? "C:/file1" : null;
				},
				result: createModules([
					createModule({
						path: "C:/file1/index.ts",
						name: "index.ts",
						package: "C:/file1",
						exports: Rec.fromObject({
							foo: ["C:/file2.ts"],
							bar: ["C:/file2.ts"],
							baz: ["C:/file2.ts"],
							default: ["C:/file2.ts"],
						}),
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						imports: [
							{
								importSource: { filePath: "C:/file1/index.ts", importPath: "./file1" },
								values: ["foo", "default"],
							},
							{
								importSource: {
									filePath: "C:/file1/index.ts",
									importPath: "~/file1",
								},
								values: ["default"],
							},
							{
								importSource: {
									filePath: "C:/file1/index.ts",
									importPath: "./file1/index",
								},
								values: ["bar", "baz"],
							},
						],
					}),
				]),
			},
		])("$name", async ({ fileItems, importAliasMapper = () => null, result }) => {
			const fn = jest.fn();

			const { modules } = await process({
				fileItems: createFileItemsGenerator(fileItems),
				dispatcherPort: {
					dispatch: fn,
				},
				settings: { ...nullSettings, importAliasMapper: importAliasMapper as ImportAliasMapper },
			});

			expect(modules).toEqual(result);
			expect(fn).toHaveBeenCalledTimes(modules.size + 1);
		});
	});

	describe("packages", () => {
		it.each([
			{
				name: "should be modules without package",
				filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx"],
				packages: createPackages([]),
			},

			{
				name: "should be single package with standard entry point",
				filePaths: ["C:/dir/index.ts"],
				packages: createPackages([
					createPackage({
						path: "C:/dir",
						name: "dir",
						entryPoint: "C:/dir/index.ts",
						modules: ["C:/dir/index.ts"],
					}),
				]),
			},

			{
				name: "should be single package with custom entry point",
				filePaths: ["/dir/index.entry.tsx"],
				extraPackageEntries: { fileNames: ["index.entry"] },
				packages: createPackages([
					createPackage({
						path: "/dir",
						name: "dir",
						entryPoint: "/dir/index.entry.tsx",
						modules: ["/dir/index.entry.tsx"],
					}),
				]),
			},

			{
				name: "should be single package with custom entry point mapping",
				filePaths: ["C:/dir/main.js"],
				extraPackageEntries: { filePaths: ["C:/dir/main.js" as AbsoluteFsPath] },
				packages: createPackages([
					createPackage({
						path: "C:/dir",
						name: "dir",
						entryPoint: "C:/dir/main.js",
						modules: ["C:/dir/main.js"],
					}),
				]),
			},

			{
				name: "should be single package with several flat modules",
				filePaths: ["/dir/file1.ts", "/dir/file2.js", "/dir/index.tsx"],
				packages: createPackages([
					createPackage({
						path: "/dir",
						name: "dir",
						entryPoint: "/dir/index.tsx",
						modules: ["/dir/file1.ts", "/dir/file2.js", "/dir/index.tsx"],
					}),
				]),
			},

			{
				name: "should be correct resolution package's entry point",
				filePaths: ["/dir/index.d.ts", "/dir/index.ts", "/dir/index.js"],
				packages: createPackages([
					createPackage({
						path: "/dir",
						name: "dir",
						entryPoint: "/dir/index.ts",
						modules: ["/dir/index.d.ts", "/dir/index.ts", "/dir/index.js"],
					}),
				]),
			},

			{
				name: "should be single package with several nested modules",
				filePaths: [
					"C:/dir/file1.ts",
					"C:/dir/dir2/file.d.ts",
					"C:/dir/file2.js",
					"C:/dir/index.tsx",
					"C:/dir/dir2/dir3/file.jsx",
				],
				packages: createPackages([
					createPackage({
						path: "C:/dir",
						name: "dir",
						entryPoint: "C:/dir/index.tsx",
						modules: [
							"C:/dir/file1.ts",
							"C:/dir/file2.js",
							"C:/dir/index.tsx",
							"C:/dir/dir2/file.d.ts",
							"C:/dir/dir2/dir3/file.jsx",
						],
					}),
				]),
			},

			{
				name: "should be main package with inner flat packages",
				filePaths: [
					"/dir/index.ts",
					"/dir/dir1/file.tsx",
					"/dir/dir1/index.js",
					"/dir/dir2/file.jsx",
					"/dir/dir2/index.ts",
				],
				packages: createPackages([
					createPackage({
						path: "/dir",
						name: "dir",
						entryPoint: "/dir/index.ts",
						modules: ["/dir/index.ts"],
						packages: ["/dir/dir1", "/dir/dir2"],
					}),
					createPackage({
						path: "/dir/dir1",
						name: "dir1",
						parent: "/dir",
						entryPoint: "/dir/dir1/index.js",
						modules: ["/dir/dir1/file.tsx", "/dir/dir1/index.js"],
					}),
					createPackage({
						path: "/dir/dir2",
						name: "dir2",
						parent: "/dir",
						entryPoint: "/dir/dir2/index.ts",
						modules: ["/dir/dir2/file.jsx", "/dir/dir2/index.ts"],
					}),
				]),
			},

			{
				name: "should be main package with inner nested packages",
				filePaths: [
					"C:/dir/dir1/dir2/index.ts",
					"C:/dir/dir1/dir2/file.jsx",
					"C:/dir/dir1/index.js",
					"C:/dir/dir1/file.tsx",
					"C:/dir/index.ts",
				],
				packages: createPackages([
					createPackage({
						path: "C:/dir",
						name: "dir",
						entryPoint: "C:/dir/index.ts",
						modules: ["C:/dir/index.ts"],
						packages: ["C:/dir/dir1"],
					}),
					createPackage({
						path: "C:/dir/dir1",
						name: "dir1",
						parent: "C:/dir",
						entryPoint: "C:/dir/dir1/index.js",
						modules: ["C:/dir/dir1/index.js", "C:/dir/dir1/file.tsx"],
						packages: ["C:/dir/dir1/dir2"],
					}),
					createPackage({
						path: "C:/dir/dir1/dir2",
						name: "dir2",
						parent: "C:/dir/dir1",
						entryPoint: "C:/dir/dir1/dir2/index.ts",
						modules: ["C:/dir/dir1/dir2/index.ts", "C:/dir/dir1/dir2/file.jsx"],
					}),
				]),
			},

			{
				name: "should be complex packages tree",
				filePaths: [
					"/dir/dir1/dir1/index.ts",
					"/dir/dir1/dir1/file.jsx",
					"/dir/dir1/index.js",
					"/dir/dir1/file.tsx",
					"/dir/dir2/index.d.ts",
					"/dir/dir2/index.js",
					"/dir/index.ts",
					"/dir/dir1/dir2/index.tsx",
					"/dir/dir1/dir3/index.jsx",
					"/dir/main.ts",
				],
				extraPackageEntries: { filePaths: ["/dir/main.ts" as AbsoluteFsPath] },
				packages: createPackages([
					createPackage({
						path: "/dir",
						name: "dir",
						entryPoint: "/dir/main.ts",
						modules: ["/dir/index.ts", "/dir/main.ts"],
						packages: ["/dir/dir1", "/dir/dir2"],
					}),
					createPackage({
						path: "/dir/dir1",
						name: "dir1",
						parent: "/dir",
						entryPoint: "/dir/dir1/index.js",
						modules: ["/dir/dir1/index.js", "/dir/dir1/file.tsx"],
						packages: ["/dir/dir1/dir1", "/dir/dir1/dir2", "/dir/dir1/dir3"],
					}),
					createPackage({
						path: "/dir/dir1/dir1",
						name: "dir1",
						parent: "/dir/dir1",
						entryPoint: "/dir/dir1/dir1/index.ts",
						modules: ["/dir/dir1/dir1/index.ts", "/dir/dir1/dir1/file.jsx"],
					}),
					createPackage({
						path: "/dir/dir1/dir2",
						name: "dir2",
						parent: "/dir/dir1",
						entryPoint: "/dir/dir1/dir2/index.tsx",
						modules: ["/dir/dir1/dir2/index.tsx"],
					}),
					createPackage({
						path: "/dir/dir1/dir3",
						name: "dir3",
						parent: "/dir/dir1",
						entryPoint: "/dir/dir1/dir3/index.jsx",
						modules: ["/dir/dir1/dir3/index.jsx"],
					}),
					createPackage({
						path: "/dir/dir2",
						name: "dir2",
						parent: "/dir",
						entryPoint: "/dir/dir2/index.js",
						modules: ["/dir/dir2/index.d.ts", "/dir/dir2/index.js"],
					}),
				]),
			},
		])("$name", async ({ filePaths, packages, extraPackageEntries = {} }) => {
			const fileItems = filePaths.map((path) => ({ path, content: "" }));
			const { packages: packs } = await process({
				fileItems: createFileItemsGenerator(fileItems),
				dispatcherPort: nullDispatcherPort,
				settings: {
					...nullSettings,
					extraPackageEntries: { fileNames: [], filePaths: [], ...extraPackageEntries },
				},
			});

			expect(packs).toEqual(packages);
		});
	});

	describe("summary", () => {
		it.each([
			{
				name: "should be single module & with out of scope import",
				fileItems: [
					{
						path: "C:/dir/index.ts",
						content: `
							import bar from "foo";
							export const foo = "foo";
						`,
					},
				],
				result: createSummary({
					packages: 1,
					languages: Rec.fromObject({
						typescript: 1,
						javascript: 0,
					}),
					outOfScopeImports: Rec.fromObject({
						"C:/dir/index.ts": ["foo"],
					}),
					possiblyUnusedExportValues: Rec.fromObject({
						"C:/dir/index.ts": ["foo"],
					}),
				}),
			},

			{
				name: "should be module with dynamic imports",
				fileItems: [
					{
						path: "/dir/file.jsx",
						content: `
							export const foo = "foo";
							
							const path1 = "bar";
							const path2 = "baz";

							await import(path1);
							await import(path2);
						`,
					},
					{
						path: "/dir/index.ts",
						content: `import * as bar from "./file";`,
					},
				],
				result: createSummary({
					packages: 1,
					languages: Rec.fromObject({
						typescript: 1,
						javascript: 1,
					}),
					unparsedDynamicImports: Rec.fromObject({
						"/dir/file.jsx": 2,
					}),
					emptyExports: ["/dir/index.ts"],
				}),
			},

			{
				name: "should be module with unresolved full imports",
				fileItems: [
					{
						path: "C:/dir/index.tsx",
						content: `
							import * as foo from "foo";
							import * as bar from "bar";
						`,
					},
				],
				result: createSummary({
					packages: 1,
					languages: Rec.fromObject({
						typescript: 1,
						javascript: 0,
					}),
					unresolvedFullImports: Rec.fromObject({
						"C:/dir/index.tsx": 2,
					}),
					emptyExports: ["C:/dir/index.tsx"],
				}),
			},

			{
				name: "should be module with unresolved re-exports",
				fileItems: [
					{
						path: "C:/dir/index.tsx",
						content: `import { bar } from "./file";`,
					},
					{
						path: "C:/dir/file.ts",
						content: `export * from "foo";`,
					},
				],
				result: createSummary({
					packages: 1,
					languages: Rec.fromObject({
						typescript: 2,
						javascript: 0,
					}),
					unresolvedFullImports: Rec.fromObject({
						"C:/dir/file.ts": 1,
					}),
					unresolvedFullExports: Rec.fromObject({
						"C:/dir/file.ts": 1,
					}),
					emptyExports: ["C:/dir/index.tsx"],
				}),
			},

			{
				name: "should be module with shadowed export value",
				fileItems: [
					{
						path: "/dir/file1.js",
						content: `
							export const foo = "foo";
							export const bar = "bar";
						`,
					},
					{
						path: "/dir/file2.js",
						content: `
							export * from "./file1";
							export const bar = "baz";
						`,
					},
					{
						path: "/dir/index.js",
						content: `import { foo, bar } from "./file2";`,
					},
				],
				result: createSummary({
					packages: 1,
					languages: Rec.fromObject({
						typescript: 0,
						javascript: 3,
					}),
					shadowedExportValues: Rec.fromObject({
						"/dir/file2.js": 1,
					}),
					emptyExports: ["/dir/index.js"],
				}),
			},

			{
				name: "should be module with incorrect import",
				fileItems: [
					{
						path: "/dir1/file.ts",
						content: `export const foo = "foo";`,
					},
					{
						path: "/dir1/index.ts",
						content: `import { foo } from "./file";`,
					},
					{
						path: "/dir2/index.ts",
						content: `import { foo } from "../dir1/file";`,
					},
				],
				result: createSummary({
					packages: 2,
					languages: Rec.fromObject({
						typescript: 3,
						javascript: 0,
					}),
					emptyExports: ["/dir1/index.ts", "/dir2/index.ts"],
					incorrectImports: Rec.fromObject({
						"/dir2/index.ts": [{ filePath: "/dir1/file.ts", importPath: "../dir1/file" }],
					}),
				}),
			},
		])("$name", async ({ fileItems, result }) => {
			const { summary } = await process({
				fileItems: createFileItemsGenerator(fileItems),
				dispatcherPort: nullDispatcherPort,
				settings: nullSettings,
			});

			expect(summary).toEqual(result);
		});

		describe("incorrect imports", () => {
			it.each([
				{
					name: "should be correct for files in the same package",
					fileItems: [
						{
							path: "/dir/file.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "/dir/index.ts",
							content: `import { foo } from "./file"`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct for the same package & import of entry point",
					fileItems: [
						{
							path: "C:/dir/index.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "C:/dir/file.ts",
							content: `import { foo } from "."`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct for explicit entry point",
					fileItems: [
						{
							path: "/dir/index.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "/dir/file.ts",
							content: `import { foo } from "./index"`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct import of out of scope module",
					fileItems: [
						{
							path: "/dir/index.ts",
							content: `import foo from "../../foo";`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct import for module without package",
					fileItems: [
						{
							path: "C:/dir1/index.ts",
							content: `import foo from "../dir2/file";`,
						},
						{
							path: "C:/dir2/file.ts",
							content: "export default function() {}",
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct import for both modules without packages",
					fileItems: [
						{
							path: "C:/dir1/file.ts",
							content: `import foo from "../dir2/file";`,
						},
						{
							path: "C:/dir2/file.ts",
							content: "export default function() {}",
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct import for module from root package with nesting",
					fileItems: [
						{
							path: "C:/dir1/index.ts",
							content: "export default function() {}",
						},
						{
							path: "C:/dir2/index.ts",
							content: `import foo from "./dir3";`,
						},
						{
							path: "C:/dir2/dir3/index.ts",
							content: `import foo from "../../dir1";`,
						},
						{
							path: "C:/dir2/dir3/file.ts",
							content: `import foo from "../../dir1";`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct for the sibling packages with import from entry point",
					fileItems: [
						{
							path: "/dir1/file.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "/dir1/index.tsx",
							content: `export * from "./file";`,
						},
						{
							path: "/dir2/index.js",
							content: `import { foo } from "../dir1";`,
						},
					],
					isCorrect: true,
				},
				{
					name: "should be incorrect for the sibling packages with import from not entry point",
					fileItems: [
						{
							path: "/dir1/file.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "/dir1/index.tsx",
							content: `export * from "./file";`,
						},
						{
							path: "/dir2/index.js",
							content: `import { foo } from "../dir1/file";`,
						},
					],
					isCorrect: false,
				},

				{
					name: "should be correct from parent package with import from not entry point",
					fileItems: [
						{
							path: "C:/dir1/index.tsx",
							content: `export * from "./file1"`,
						},
						{
							path: "C:/dir1/file1.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "C:/dir1/dir2/file2.js",
							content: `import { foo } from "../file1";`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct from direct ancestor package with import from not entry point",
					fileItems: [
						{
							path: "/dir1/index.tsx",
							content: `export * from "./file";`,
						},
						{
							path: "/dir1/file1.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "/dir1/dir2/index.js",
							content: `export * from "./dir3";`,
						},
						{
							path: "/dir1/dir2/dir3/index.jsx",
							content: `export * from "./file2";`,
						},
						{
							path: "/dir1/dir2/dir3/file2.ts",
							content: `
								import { foo } from "../../file1";
								export const bar = "bar";
							`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct from direct ancestor package with import from entry point",
					fileItems: [
						{
							path: "C:/dir1/index.tsx",
							content: `export * from "./file1";`,
						},
						{
							path: "C:/dir1/file1.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "C:/dir1/dir2/index.js",
							content: `export * from "./dir3";`,
						},
						{
							path: "C:/dir1/dir2/dir3/index.jsx",
							content: `export * from "./file2";`,
						},
						{
							path: "C:/dir1/dir2/dir3/file2.ts",
							content: `
								import { foo } from "../..";
								export const bar = "bar";
							`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be correct from outer package with import from entry point",
					fileItems: [
						{
							path: "/dir1/index.tsx",
							content: `export * from "./dir2";`,
						},
						{
							path: "/dir1/dir2/index.js",
							content: `export * from "./dir3";`,
						},
						{
							path: "/dir1/dir22/index.js",
							content: `export const bar = "bar";`,
						},
						{
							path: "/dir1/dir2/dir3/index.jsx",
							content: `export * from "./file2";`,
						},
						{
							path: "/dir1/dir2/dir3/file2.ts",
							content: `
								import { foo } from "../../dir22";
								export const bar = "bar";
							`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be incorrect from outer package with import from not entry point",
					fileItems: [
						{
							path: "C:/dir1/index.tsx",
							content: `export * from "./dir22";`,
						},
						{
							path: "C:/dir1/dir22/index.ts",
							content: `export * from "./file1";`,
						},
						{
							path: "C:/dir1/dir22/file1.ts",
							content: `export const foo = "foo";`,
						},
						{
							path: "C:/dir1/dir2/index.js",
							content: `export * from "./dir3";`,
						},
						{
							path: "C:/dir1/dir2/dir3/index.jsx",
							content: `export * from "./file2";`,
						},
						{
							path: "C:/dir1/dir2/dir3/file2.ts",
							content: `
								import { foo } from "../../dir22/file1";
								export const bar = "bar";
							`,
						},
					],
					isCorrect: false,
				},

				{
					name: "should be correct from child package from entry point",
					fileItems: [
						{
							path: "/dir1/index.ts",
							content: `import { foo } from "./dir2";`,
						},
						{
							path: "/dir1/dir2/index.ts",
							content: `export const foo = "foo";`,
						},
					],
					isCorrect: true,
				},

				{
					name: "should be incorrect from child package from non entry point",
					fileItems: [
						{
							path: "C:/dir1/index.ts",
							content: `import { foo } from "./dir2/file";`,
						},
						{
							path: "C:/dir1/dir2/index.ts",
							content: `export * from "./file";`,
						},
						{
							path: "C:/dir1/dir2/file.ts",
							content: `export const foo = "foo";`,
						},
					],
					isCorrect: false,
				},

				{
					name: "should be incorrect from descendant package with violation on child package",
					fileItems: [
						{
							path: "/dir1/index.ts",
							content: `import { foo } from "./dir2/dir3";`,
						},
						{
							path: "/dir1/dir2/index.ts",
							content: `export * from "./dir3"`,
						},
						{
							path: "/dir1/dir2/dir3/index.ts",
							content: `export const foo = "foo";`,
						},
					],
					isCorrect: false,
				},
			])("$name", async ({ fileItems, isCorrect }) => {
				const { summary } = await process({
					fileItems: createFileItemsGenerator(fileItems),
					dispatcherPort: nullDispatcherPort,
					settings: nullSettings,
				});

				expect(summary.incorrectImports.size === 0).toEqual(isCorrect);
			});
		});
	});
});
