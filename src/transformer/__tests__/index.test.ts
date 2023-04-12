import { describe, it, expect, jest } from "@jest/globals";
import { createFilesGenerator, createModule } from "../../__test-utils__";

import { ImportPath } from "../../values";
import { transformFiles } from "..";

describe("transformer", () => {
	it.each([
		{
			name: "empty result from empty module files list",
			files: createFilesGenerator([]),
			result: [],
		},

		{
			name: "single module without imports/exports",
			files: createFilesGenerator([{ path: "C:/file.ts", code: `console.log("Hello world")` }]),
			result: [
				createModule({
					path: "C:/file.ts",
				}),
			],
		},

		{
			name: "single module with out of scope named import",
			files: createFilesGenerator([
				{
					path: "C:/file.ts",
					code: `import { bar, baz } from "foo";`,
				},
			]),
			result: [
				createModule({
					path: "C:/file.ts",
					imports: [
						{
							importSource: { importPath: "foo" },
							values: ["bar", "baz"],
						},
					],
				}),
			],
		},

		{
			name: "two linked modules",
			files: createFilesGenerator([
				{
					path: "/file1.js",
					code: `
						export const foo = "foo";
						export const bar = "bar";
						export default function() {}; 
					`,
				},
				{
					path: "/file2.jsx",
					code: `import baz, { foo, bar } from "./file1";`,
				},
			]),
			result: [
				createModule({
					path: "/file1.js",
					language: "javascript",
					exports: {
						foo: ["/file2.jsx"],
						bar: ["/file2.jsx"],
						default: ["/file2.jsx"],
					},
				}),
				createModule({
					path: "/file2.jsx",
					language: "javascript",
					imports: [
						{
							importSource: { filePath: "/file1.js", importPath: "./file1" },
							values: ["default", "foo", "bar"],
						},
					],
				}),
			],
		},

		{
			name: "three linked modules",
			files: createFilesGenerator([
				{
					path: "C:/dir1/file1.ts",
					code: `
						export const foo = 1;
						export const bar = 2;
						export const baz = 3;
						export default function() {};
					`,
				},
				{
					path: "C:/file2.ts",
					code: `import { foo, default as qux } from "../dir1/file1";`,
				},
				{
					path: "C:/dir2/dir3/file3.ts",
					code: `import qux, { foo, bar } from "../../dir1/file1";`,
				},
			]),
			result: [
				createModule({
					path: "C:/dir1/file1.ts",
					exports: {
						foo: ["C:/file2.ts", "C:/dir2/dir3/file3.ts"],
						bar: ["C:/dir2/dir3/file3.ts"],
						baz: [],
						default: ["C:/file2.ts", "C:/dir2/dir3/file3.ts"],
					},
				}),
				createModule({
					path: "C:/file2.ts",
					imports: [
						{
							importSource: {
								filePath: "C:/dir1/file1.ts",
								importPath: "../dir1/file1",
							},
							values: ["foo", "default"],
						},
					],
				}),
				createModule({
					path: "C:/dir2/dir3/file3.ts",
					imports: [
						{
							importSource: {
								filePath: "C:/dir1/file1.ts",
								importPath: "../../dir1/file1",
							},
							values: ["default", "foo", "bar"],
						},
					],
				}),
			],
		},

		{
			name: "alias import mapping",
			files: createFilesGenerator([
				{
					path: "C:/file1.tsx",
					code: `export default class {};`,
				},
				{
					path: "C:/file2.tsx",
					code: `import foo from "~/file1";`,
				},
			]),
			importAliasMapper(importPath: ImportPath) {
				return importPath === "~/file1" ? "C:/file1" : null;
			},
			result: [
				createModule({
					path: "C:/file1.tsx",
					exports: {
						default: ["C:/file2.tsx"],
					},
				}),
				createModule({
					path: "C:/file2.tsx",
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
			],
		},

		{
			name: "out of scope named import",
			files: createFilesGenerator([
				{
					path: "C:/file.ts",
					code: `import { qux, quux } from "../../../../out-of-scope";`,
				},
			]),
			result: [
				createModule({
					path: "C:/file.ts",
					imports: [
						{
							importSource: { importPath: "../../../../out-of-scope" },
							values: ["qux", "quux"],
						},
					],
				}),
			],
		},

		{
			name: "out of scope full import",
			files: createFilesGenerator([
				{
					path: "C:/file.ts",
					code: `import * as foo from "../../../../out-of-scope";`,
				},
			]),
			result: [
				createModule({
					path: "C:/file.ts",
					unresolvedFullImports: [{ importPath: "../../../../out-of-scope" }],
				}),
			],
		},

		{
			name: "side effect import",
			files: createFilesGenerator([
				{
					path: "C:/dir1/dir2/file1.ts",
					code: `export default class {}`,
				},
				{
					path: "C:/dir1/dir2/file2.ts",
					code: `import "./file1";`,
				},
			]),
			result: [
				createModule({
					path: "C:/dir1/dir2/file1.ts",
					exports: {
						default: [],
					},
				}),
				createModule({
					path: "C:/dir1/dir2/file2.ts",
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
			],
		},

		{
			name: "empty named import",
			files: createFilesGenerator([
				{
					path: "/file1.ts",
					code: `export const foo = "foo";`,
				},
				{
					path: "/file2.ts",
					code: `import {} from "./file1";`,
				},
			]),
			result: [
				createModule({
					path: "/file1.ts",
					exports: {
						foo: [],
					},
				}),
				createModule({
					path: "/file2.ts",
					imports: [
						{
							importSource: { filePath: "/file1.ts", importPath: "./file1" },
							values: [],
						},
					],
				}),
			],
		},

		{
			name: "empty exports",
			files: createFilesGenerator([
				{
					path: "C:/dir/index.jsx",
					code: `export {};`,
				},
				{
					path: "C:/file.ts",
					code: `import * as all from "./dir";`,
				},
			]),
			result: [
				createModule({
					path: "C:/dir/index.jsx",
					language: "javascript",
				}),
				createModule({
					path: "C:/file.ts",
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
			],
		},

		{
			name: "parsed dynamic import",
			files: createFilesGenerator([
				{
					path: "C:/dir/index.ts",
					code: `
						export const foo = "foo";
						export const bar = "bar";
					`,
				},
				{
					path: "C:/dir/file.ts",
					code: `const data = await import(".");`,
				},
			]),
			result: [
				createModule({
					path: "C:/dir/index.ts",
					exports: {
						foo: ["C:/dir/file.ts"],
						bar: ["C:/dir/file.ts"],
					},
				}),
				createModule({
					path: "C:/dir/file.ts",
					imports: [
						{
							importSource: { filePath: "C:/dir/index.ts", importPath: "." },
							values: ["foo", "bar"],
						},
					],
				}),
			],
		},

		{
			name: "unparsed dynamic import",
			files: createFilesGenerator([
				{
					path: "C:/file1.ts",
					code: `
						export const foo = "foo";
						export const bar = "bar";
					`,
				},
				{
					path: "C:/file2.ts",
					code: `
						const importPath = "./file1";
						const data = await import(importPath);
					`,
				},
			]),
			result: [
				createModule({
					path: "C:/file1.ts",
					exports: {
						foo: [],
						bar: [],
					},
				}),
				createModule({
					path: "C:/file2.ts",
					unparsedDynamicImportsCount: 1,
				}),
			],
		},

		{
			name: "simple re-export",
			files: createFilesGenerator([
				{
					path: "C:/file1.ts",
					code: `
						export type Bar = string | number;
						export default class {};
					`,
				},
				{
					path: "C:/file2.ts",
					code: `export { Bar as Baz } from "./file1";`,
				},
				{
					path: "C:/dir/file3.ts",
					code: `
						import { Baz } from "../file2";
						import foo from "../file1";
					`,
				},
			]),
			result: [
				createModule({
					path: "C:/file1.ts",
					exports: {
						default: ["C:/dir/file3.ts"],
						Bar: ["C:/file2.ts"],
					},
				}),
				createModule({
					path: "C:/file2.ts",
					imports: [
						{
							importSource: { filePath: "C:/file1.ts", importPath: "./file1" },
							values: ["Bar"],
						},
					],
					exports: {
						Baz: ["C:/dir/file3.ts"],
					},
				}),
				createModule({
					path: "C:/dir/file3.ts",
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
			],
		},

		{
			name: "full re-export/import",
			files: createFilesGenerator([
				{
					path: "C:/file1.d.ts",
					code: `
						export interface Qux {};
						export type Quux = Qux | null;
					`,
				},
				{
					path: "C:/file2/index.ts",
					code: `export * from "../file1";`,
				},
				{
					path: "C:/file3.tsx",
					code: `import * as all from "./file2"`,
				},
			]),
			result: [
				createModule({
					path: "C:/file1.d.ts",
					exports: {
						Qux: ["C:/file2/index.ts"],
						Quux: ["C:/file2/index.ts"],
					},
				}),
				createModule({
					path: "C:/file2/index.ts",
					imports: [
						{
							importSource: { filePath: "C:/file1.d.ts", importPath: "../file1" },
							values: ["Qux", "Quux"],
						},
					],
					exports: {
						Qux: ["C:/file3.tsx"],
						Quux: ["C:/file3.tsx"],
					},
				}),
				createModule({
					path: "C:/file3.tsx",
					imports: [
						{
							importSource: { filePath: "C:/file2/index.ts", importPath: "./file2" },
							values: ["Qux", "Quux"],
						},
					],
				}),
			],
		},

		{
			name: "export of duplicate values",
			files: createFilesGenerator([
				{
					path: "C:/dir/file1.ts",
					code: `
						export const foo = "foo";
						export const bar = "bar";
					`,
				},
				{
					path: "C:/dir/file2.ts",
					code: `
						export const bar = "BAR";
						export * from "./file1";
					`,
				},
				{
					path: "C:/dir/file3.ts",
					code: `import * as all from "./file2";`,
				},
			]),
			result: [
				createModule({
					path: "C:/dir/file1.ts",
					exports: {
						foo: ["C:/dir/file2.ts"],
						bar: ["C:/dir/file2.ts"],
					},
				}),
				createModule({
					path: "C:/dir/file2.ts",
					imports: [
						{
							importSource: { filePath: "C:/dir/file1.ts", importPath: "./file1" },
							values: ["foo", "bar"],
						},
					],
					exports: {
						bar: ["C:/dir/file3.ts"],
						foo: ["C:/dir/file3.ts"],
					},
					shadowedExportValues: ["bar"],
				}),
				createModule({
					path: "C:/dir/file3.ts",
					imports: [
						{
							importSource: { filePath: "C:/dir/file2.ts", importPath: "./file2" },
							values: ["bar", "foo"],
						},
					],
				}),
			],
		},

		{
			name: "out of scope full re-export",
			files: createFilesGenerator([
				{
					path: "/file1.ts",
					code: `export * from "foo";`,
				},
				{
					path: "/file2.ts",
					code: `import { bar } from "./file1";`,
				},
			]),

			result: [
				createModule({
					path: "/file1.ts",
					unresolvedFullExports: [{ importPath: "foo" }],
					unresolvedFullImports: [{ importPath: "foo" }],
				}),
				createModule({
					path: "/file2.ts",
					imports: [
						{
							importSource: { filePath: "/file1.ts", importPath: "./file1" },
							values: ["bar"],
						},
					],
				}),
			],
		},

		{
			name: "nested full re-exports with out of scope item",
			files: createFilesGenerator([
				{
					path: "C:/file4.ts",
					code: `import * as all from "./file3";`,
				},
				{
					path: "C:/file3.ts",
					code: `export * from "./file2";`,
				},
				{
					path: "C:/file2.ts",
					code: `
						export * from "./file1";
						export * from "bar";
					`,
				},
				{
					path: "C:/file1.tsx",
					code: `
						export const foo = "foo";
						export default function Foo() { return <span></span>;}
					`,
				},
			]),
			result: [
				createModule({
					path: "C:/file4.ts",
					unresolvedFullImports: [{ filePath: "C:/file3.ts", importPath: "./file3" }],
				}),
				createModule({
					path: "C:/file3.ts",
					unresolvedFullExports: [{ filePath: "C:/file2.ts", importPath: "./file2" }],
					unresolvedFullImports: [{ filePath: "C:/file2.ts", importPath: "./file2" }],
				}),
				createModule({
					path: "C:/file2.ts",
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
					exports: {
						foo: ["C:/file2.ts"],
						default: ["C:/file2.ts"],
					},
				}),
			],
		},

		{
			name: "cycled dependencies",
			files: createFilesGenerator([
				{
					path: "C:/dir/index.ts",
					code: `	
						import { type Foo } from "./dir2/file";
						export enum Bar {};
						export default class C implements Foo {}
					`,
				},
				{
					path: "C:/dir/dir2/file.ts",
					code: `
						import { Bar } from "..";
						export interface Foo {
							bar: Bar;
						}
					`,
				},
			]),
			result: [
				createModule({
					path: "C:/dir/index.ts",
					exports: {
						Bar: ["C:/dir/dir2/file.ts"],
						default: [],
					},
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
					exports: {
						Foo: ["C:/dir/index.ts"],
					},
					imports: [
						{
							importSource: { filePath: "C:/dir/index.ts", importPath: ".." },
							values: ["Bar"],
						},
					],
				}),
			],
		},

		{
			names: "several imports from the same source",
			files: createFilesGenerator([
				{
					path: "C:/file1/index.ts",
					code: `
						export const foo = "foo";
						export const bar = "bar";
						export const baz = "baz";
						export default async function* qux() {} 
					`,
				},
				{
					path: "C:/file2.ts",
					code: `
						import { foo, default as Quux } from "./file1";
						import quux from "~/file1";
						import { bar, baz } from "./file1/index"; 
					`,
				},
			]),
			importAliasMapper(importPath: ImportPath) {
				return importPath === "~/file1" ? "C:/file1" : null;
			},
			result: [
				createModule({
					path: "C:/file1/index.ts",
					exports: {
						foo: ["C:/file2.ts"],
						bar: ["C:/file2.ts"],
						baz: ["C:/file2.ts"],
						default: ["C:/file2.ts"],
					},
				}),
				createModule({
					path: "C:/file2.ts",
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
			],
		},
	])("$name", async ({ files, importAliasMapper = () => null, result }) => {
		const fn = jest.fn();
		const { modulesRegistry } = await transformFiles({ files, importAliasMapper, eventSender: fn });
		const modules = modulesRegistry.toList();

		expect(modules).toEqual(result);
		expect(fn).toHaveBeenCalledTimes(modules.length + 1);
	});

	it.each([
		{
			name: "error on incorrect syntax in module",
			file: {
				path: "C:/file.ts",
				code: `import foo from 123;`,
			},
			errorMessage: "Unexpected token (1:16)",
		},

		{
			name: "error on JSX syntax in ts file",
			file: {
				path: "C:/file.ts",
				code: `
					export default function Foo() {
						return <div></div>;
					}
				`,
			},
			errorMessage: "Unexpected token (3:19)",
		},

		{
			name: "error on types in js file",
			file: {
				path: "C:/file.js",
				code: `
					export default function foo(a: string, b: string): string {
						return a + b;
					}
				`,
			},
			errorMessage: `Unexpected token, expected "," (2:34)`,
		},
	])("$name", async ({ file, errorMessage }) => {
		const fn = jest.fn();

		const { parserErrors } = await transformFiles({
			files: createFilesGenerator([file]),
			importAliasMapper: () => null,
			eventSender: fn,
		});

		const error = parserErrors[file.path]!;

		expect(error.message).toEqual(errorMessage);

		expect(fn).toHaveBeenNthCalledWith(1, "file-processing-failed", { path: file.path, error });
		expect(fn).toHaveBeenNthCalledWith(2, "files-processing-completed", null);
	});
});
