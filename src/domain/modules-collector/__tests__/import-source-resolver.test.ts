import { describe, expect, it } from "@jest/globals";
import { FSNavCursor } from "~/lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { ImportPath } from "../../file-items-transformer";
import { ImportSourceResolver } from "../import-source-resolver";

describe("import-source-resolver", () => {
	it.each([
		{
			name: "should be out of scope relative import",
			filePaths: ["/dir/index.ts"],
			filePath: "/dir/index.ts",
			importPath: "../out-of-scope",
			result: {
				importPath: "../out-of-scope",
			},
		},

		{
			name: "should be out of scope absolute import",
			filePaths: ["C:/dir/index.ts"],
			filePath: "C:/dir/index.ts",
			importPath: "out-of-scope",
			result: {
				importPath: "out-of-scope",
			},
		},

		{
			name: "should be out of scope alias import",
			filePaths: ["/dir/index.ts", "/dir2/file.tsx"],
			aliases: {
				"~/dir2": "/dir2",
			},
			filePath: "/dir/index.ts",
			importPath: "~/dir2/foo",
			result: {
				importPath: "~/dir2/foo",
			},
		},

		{
			name: "should be resolved imported module by alias",
			filePaths: ["C:/dir/file1.tsx", "C:/dir/file2.jsx"],
			aliases: {
				"~": "C:/dir",
			},
			filePath: "C:/dir/file1.tsx",
			importPath: "~/file2",
			result: {
				filePath: "C:/dir/file2.jsx",
				importPath: "~/file2",
			},
		},

		{
			name: "should be resolved sibling module",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.js"],
			filePath: "C:/dir/file1.ts",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.js",
				importPath: "./file2",
			},
		},

		{
			name: "should be resolved sibling index module",
			filePaths: ["/dir/index.ts", "/dir/file.ts"],
			filePath: "/dir/file.ts",
			importPath: ".",
			result: {
				filePath: "/dir/index.ts",
				importPath: ".",
			},
		},

		{
			name: "should be resolved sibling index module explicitly",
			filePaths: ["/dir/index.ts", "/dir/file.ts"],
			filePath: "/dir/file.ts",
			importPath: "./index",
			result: {
				filePath: "/dir/index.ts",
				importPath: "./index",
			},
		},

		{
			name: "should be resolved child module",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/file.d.ts"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2/file",
			result: {
				filePath: "C:/dir/dir2/file.d.ts",
				importPath: "./dir2/file",
			},
		},

		{
			name: "should be resolved child index module",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/index.tsx"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2",
			result: {
				filePath: "C:/dir/dir2/index.tsx",
				importPath: "./dir2",
			},
		},

		{
			name: "should be resolved child index module explicitly",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/index.tsx"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2/index",
			result: {
				filePath: "C:/dir/dir2/index.tsx",
				importPath: "./dir2/index",
			},
		},

		{
			name: "should be resolved parent module",
			filePaths: ["/dir/dir2/file.ts", "/dir/file.jsx"],
			filePath: "/dir/dir2/file.ts",
			importPath: "../file",
			result: {
				filePath: "/dir/file.jsx",
				importPath: "../file",
			},
		},

		{
			name: "should be resolved parent index module",
			filePaths: ["C:/dir/dir2/file.ts", "C:/dir/index.jsx"],
			filePath: "C:/dir/dir2/file.ts",
			importPath: "..",
			result: {
				filePath: "C:/dir/index.jsx",
				importPath: "..",
			},
		},

		{
			name: "should be resolved parent index module explicitly",
			filePaths: ["/dir/dir2/file.ts", "/dir/index.jsx"],
			filePath: "/dir/dir2/file.ts",
			importPath: "../index",
			result: {
				filePath: "/dir/index.jsx",
				importPath: "../index",
			},
		},

		{
			name: "should be resolved descendant module",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/file.jsx"],
			filePath: "/dir/file.jsx",
			importPath: "./dir2/dir3/dir4/file",
			result: {
				filePath: "/dir/dir2/dir3/dir4/file.ts",
				importPath: "./dir2/dir3/dir4/file",
			},
		},

		{
			name: "should be resolved descendant index module",
			filePaths: ["C:/dir/dir2/dir3/dir4/index.ts", "C:/dir/file.jsx"],
			filePath: "C:/dir/file.jsx",
			importPath: "./dir2/dir3/dir4",
			result: {
				filePath: "C:/dir/dir2/dir3/dir4/index.ts",
				importPath: "./dir2/dir3/dir4",
			},
		},

		{
			name: "should be resolved descendant index module explicitly",
			filePaths: ["/dir/dir2/dir3/dir4/index.ts", "/dir/file.jsx"],
			filePath: "/dir/file.jsx",
			importPath: "./dir2/dir3/dir4/index",
			result: {
				filePath: "/dir/dir2/dir3/dir4/index.ts",
				importPath: "./dir2/dir3/dir4/index",
			},
		},

		{
			name: "should be resolved ancestor module",
			filePaths: ["C:/dir/dir2/dir3/dir4/file.ts", "C:/dir/file.jsx"],
			filePath: "C:/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../file",
			result: {
				filePath: "C:/dir/file.jsx",
				importPath: "../../../file",
			},
		},

		{
			name: "should be resolved ancestor index module",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/index.jsx"],
			filePath: "/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../..",
			result: {
				filePath: "/dir/index.jsx",
				importPath: "../../..",
			},
		},

		{
			name: "should be resolved ancestor index module expicitly",
			filePaths: ["C:/dir/dir2/dir3/dir4/file.ts", "C:/dir/index.jsx"],
			filePath: "C:/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../index",
			result: {
				filePath: "C:/dir/index.jsx",
				importPath: "../../../index",
			},
		},

		{
			name: "should be resolved ancestor module by sub path",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/file.jsx"],
			filePath: "/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../../dir/file",
			result: {
				filePath: "/dir/file.jsx",
				importPath: "../../../../dir/file",
			},
		},

		{
			name: "should be resolved with ts extension first",
			filePaths: [
				"C:/dir/file1.ts",
				"C:/dir/file2.jsx",
				"C:/dir/file2.js",
				"C:/dir/file2.d.ts",
				"C:/dir/file2.tsx",
				"C:/dir/file2.ts",
			],
			filePath: "C:/dir/file1.ts",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.ts",
				importPath: "./file2",
			},
		},

		{
			name: "should be resolved with tsx extension second",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.js", "C:/dir/file2.tsx", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.tsx",
				importPath: "./file2",
			},
		},

		{
			name: "should be resolved with js extension third",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.js", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.js",
				importPath: "./file2",
			},
		},

		{
			name: "should be resolved with jsx extension forth",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.jsx",
				importPath: "./file2",
			},
		},

		{
			name: "should be resolved with d.ts extension fifth",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.d.ts",
				importPath: "./file2",
			},
		},

		{
			name: "should be resolved with file early than dir with index",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.d.ts", "C:/dir/file2/index.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.d.ts",
				importPath: "./file2",
			},
		},
	])("$name", ({ filePaths, filePath, aliases = {}, importPath, result }) => {
		const fsNavCursor = new FSNavCursor(filePaths as AbsoluteFsPath[]);
		const importSourceResolver = new ImportSourceResolver({
			fsNavCursor,
			aliases: Rec.fromObject(aliases as Record<string, AbsoluteFsPath>),
		});

		expect(
			importSourceResolver.resolve({
				filePath: filePath as AbsoluteFsPath,
				importPath: importPath as ImportPath,
			}),
		).toEqual(result);
	});
});
