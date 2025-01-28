import { describe, expect, it } from "@jest/globals";
import { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import { ImportSourceResolver } from "../import-source-resolver";

describe("import-source-resolver", () => {
	it.each([
		{
			name: "should be out of scope relative import",
			filePaths: ["/dir/index.ts"],
			filePath: "/dir/index.ts",
			importPath: "../out-of-scope",
			result: null,
		},

		{
			name: "should be out of scope absolute import",
			filePaths: ["C:/dir/index.ts"],
			filePath: "C:/dir/index.ts",
			importPath: "out-of-scope",
			result: null,
		},

		{
			name: "should be out of scope alias import",
			filePaths: ["/dir/index.ts", "/dir2/file.tsx"],
			aliases: {
				"~/dir2": "/dir2",
			},
			filePath: "/dir/index.ts",
			importPath: "~/dir2/foo",
			result: null,
		},

		{
			name: "should be resolved imported module by alias",
			filePaths: ["C:/dir/file1.tsx", "C:/dir/file2.jsx"],
			aliases: {
				"~": "C:/dir",
			},
			filePath: "C:/dir/file1.tsx",
			importPath: "~/file2",
			result: "C:/dir/file2.jsx",
		},

		{
			name: "should be resolved imported module by alias when it equals to path",
			filePaths: ["C:/dir/file1.tsx", "C:/dir/index.jsx"],
			aliases: {
				"~": "C:/dir",
			},
			filePath: "C:/dir/file1.tsx",
			importPath: "~",
			result: "C:/dir/index.jsx",
		},

		{
			name: "should be resolved sibling module",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.js"],
			filePath: "C:/dir/file1.ts",
			importPath: "./file2",
			result: "C:/dir/file2.js",
		},

		{
			name: "should be resolved sibling index module",
			filePaths: ["/dir/index.ts", "/dir/file.ts"],
			filePath: "/dir/file.ts",
			importPath: ".",
			result: "/dir/index.ts",
		},

		{
			name: "should be resolved sibling index module explicitly",
			filePaths: ["/dir/index.ts", "/dir/file.ts"],
			filePath: "/dir/file.ts",
			importPath: "./index",
			result: "/dir/index.ts",
		},

		{
			name: "should be resolved child module",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/file.d.ts"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2/file",
			result: "C:/dir/dir2/file.d.ts",
		},

		{
			name: "should be resolved child index module",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/index.tsx"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2",
			result: "C:/dir/dir2/index.tsx",
		},

		{
			name: "should be resolved child index module explicitly",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/index.tsx"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2/index",
			result: "C:/dir/dir2/index.tsx",
		},

		{
			name: "should be resolved parent module",
			filePaths: ["/dir/dir2/file.ts", "/dir/file.jsx"],
			filePath: "/dir/dir2/file.ts",
			importPath: "../file",
			result: "/dir/file.jsx",
		},

		{
			name: "should be resolved parent index module",
			filePaths: ["C:/dir/dir2/file.ts", "C:/dir/index.jsx"],
			filePath: "C:/dir/dir2/file.ts",
			importPath: "..",
			result: "C:/dir/index.jsx",
		},

		{
			name: "should be resolved parent index module explicitly",
			filePaths: ["/dir/dir2/file.ts", "/dir/index.jsx"],
			filePath: "/dir/dir2/file.ts",
			importPath: "../index",
			result: "/dir/index.jsx",
		},

		{
			name: "should be resolved descendant module",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/file.jsx"],
			filePath: "/dir/file.jsx",
			importPath: "./dir2/dir3/dir4/file",
			result: "/dir/dir2/dir3/dir4/file.ts",
		},

		{
			name: "should be resolved descendant index module",
			filePaths: ["C:/dir/dir2/dir3/dir4/index.ts", "C:/dir/file.jsx"],
			filePath: "C:/dir/file.jsx",
			importPath: "./dir2/dir3/dir4",
			result: "C:/dir/dir2/dir3/dir4/index.ts",
		},

		{
			name: "should be resolved descendant index module explicitly",
			filePaths: ["/dir/dir2/dir3/dir4/index.ts", "/dir/file.jsx"],
			filePath: "/dir/file.jsx",
			importPath: "./dir2/dir3/dir4/index",
			result: "/dir/dir2/dir3/dir4/index.ts",
		},

		{
			name: "should be resolved ancestor module",
			filePaths: ["C:/dir/dir2/dir3/dir4/file.ts", "C:/dir/file.jsx"],
			filePath: "C:/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../file",
			result: "C:/dir/file.jsx",
		},

		{
			name: "should be resolved ancestor index module",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/index.jsx"],
			filePath: "/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../..",
			result: "/dir/index.jsx",
		},

		{
			name: "should be resolved ancestor index module expicitly",
			filePaths: ["C:/dir/dir2/dir3/dir4/file.ts", "C:/dir/index.jsx"],
			filePath: "C:/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../index",
			result: "C:/dir/index.jsx",
		},

		{
			name: "should be resolved ancestor module by sub path",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/file.jsx"],
			filePath: "/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../../dir/file",
			result: "/dir/file.jsx",
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
			result: "C:/dir/file2.ts",
		},

		{
			name: "should be resolved with tsx extension second",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.js", "C:/dir/file2.tsx", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: "C:/dir/file2.tsx",
		},

		{
			name: "should be resolved with js extension third",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.js", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: "C:/dir/file2.js",
		},

		{
			name: "should be resolved with jsx extension forth",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: "C:/dir/file2.jsx",
		},

		{
			name: "should be resolved with d.ts extension fifth",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: "C:/dir/file2.d.ts",
		},

		{
			name: "should be resolved with file early than dir with index",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.d.ts", "C:/dir/file2/index.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: "C:/dir/file2.d.ts",
		},
	])("$name", ({ filePaths, filePath, aliases = {}, importPath, result }) => {
		const importSourceResolver = new ImportSourceResolver({
			fSTree: new FSTree(filePaths),
			aliases: Rec.fromObject(aliases as Record<string, string>),
		});

		const ret = importSourceResolver.resolve({
			filePath,
			importPath,
		});

		expect(ret).toEqual(result);
	});
});
