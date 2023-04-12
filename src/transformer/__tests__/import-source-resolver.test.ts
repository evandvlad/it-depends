import { describe, it, expect } from "@jest/globals";

import { ImportSourceResolver } from "../import-source-resolver";

describe("import-source-resolver", () => {
	it.each([
		{
			name: "out of scope relative import",
			filePaths: ["/dir/index.ts"],
			filePath: "/dir/index.ts",
			importPath: "../out-of-scope",
			result: {
				importPath: "../out-of-scope",
			},
		},

		{
			name: "out of scope absolute import",
			filePaths: ["C:/dir/index.ts"],
			filePath: "C:/dir/index.ts",
			importPath: "out-of-scope",
			result: {
				importPath: "out-of-scope",
			},
		},

		{
			name: "out of scope alias import",
			filePaths: ["/dir/index.ts", "/dir2/file.tsx"],
			importAliasMapper(path: string) {
				return path.startsWith("~/dir2") ? path.replace(/^~\/dir2/, "/dir2") : null;
			},
			filePath: "/dir/index.ts",
			importPath: "~/dir2/foo",
			result: {
				importPath: "~/dir2/foo",
			},
		},

		{
			name: "import module by alias",
			filePaths: ["C:/dir/file1.tsx", "C:/dir/file2.jsx"],
			importAliasMapper(path: string) {
				return path.startsWith("~/") ? path.replace(/^~\//, "C:/dir/") : null;
			},
			filePath: "C:/dir/file1.tsx",
			importPath: "~/file2",
			result: {
				filePath: "C:/dir/file2.jsx",
				importPath: "~/file2",
			},
		},

		{
			name: "sibling module",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.js"],
			filePath: "C:/dir/file1.ts",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.js",
				importPath: "./file2",
			},
		},

		{
			name: "sibling index module",
			filePaths: ["/dir/index.ts", "/dir/file.ts"],
			filePath: "/dir/file.ts",
			importPath: ".",
			result: {
				filePath: "/dir/index.ts",
				importPath: ".",
			},
		},

		{
			name: "sibling index module explicitly",
			filePaths: ["/dir/index.ts", "/dir/file.ts"],
			filePath: "/dir/file.ts",
			importPath: "./index",
			result: {
				filePath: "/dir/index.ts",
				importPath: "./index",
			},
		},

		{
			name: "child module",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/file.d.ts"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2/file",
			result: {
				filePath: "C:/dir/dir2/file.d.ts",
				importPath: "./dir2/file",
			},
		},

		{
			name: "child index module",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/index.tsx"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2",
			result: {
				filePath: "C:/dir/dir2/index.tsx",
				importPath: "./dir2",
			},
		},

		{
			name: "child index module explicitly",
			filePaths: ["C:/dir/file.ts", "C:/dir/dir2/index.tsx"],
			filePath: "C:/dir/file.ts",
			importPath: "./dir2/index",
			result: {
				filePath: "C:/dir/dir2/index.tsx",
				importPath: "./dir2/index",
			},
		},

		{
			name: "parent module",
			filePaths: ["/dir/dir2/file.ts", "/dir/file.jsx"],
			filePath: "/dir/dir2/file.ts",
			importPath: "../file",
			result: {
				filePath: "/dir/file.jsx",
				importPath: "../file",
			},
		},

		{
			name: "parent index module",
			filePaths: ["C:/dir/dir2/file.ts", "C:/dir/index.jsx"],
			filePath: "C:/dir/dir2/file.ts",
			importPath: "..",
			result: {
				filePath: "C:/dir/index.jsx",
				importPath: "..",
			},
		},

		{
			name: "parent index module explicitly",
			filePaths: ["/dir/dir2/file.ts", "/dir/index.jsx"],
			filePath: "/dir/dir2/file.ts",
			importPath: "../index",
			result: {
				filePath: "/dir/index.jsx",
				importPath: "../index",
			},
		},

		{
			name: "descendant module",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/file.jsx"],
			filePath: "/dir/file.jsx",
			importPath: "./dir2/dir3/dir4/file",
			result: {
				filePath: "/dir/dir2/dir3/dir4/file.ts",
				importPath: "./dir2/dir3/dir4/file",
			},
		},

		{
			name: "descendant index module",
			filePaths: ["C:/dir/dir2/dir3/dir4/index.ts", "C:/dir/file.jsx"],
			filePath: "C:/dir/file.jsx",
			importPath: "./dir2/dir3/dir4",
			result: {
				filePath: "C:/dir/dir2/dir3/dir4/index.ts",
				importPath: "./dir2/dir3/dir4",
			},
		},

		{
			name: "descendant index module explicitly",
			filePaths: ["/dir/dir2/dir3/dir4/index.ts", "/dir/file.jsx"],
			filePath: "/dir/file.jsx",
			importPath: "./dir2/dir3/dir4/index",
			result: {
				filePath: "/dir/dir2/dir3/dir4/index.ts",
				importPath: "./dir2/dir3/dir4/index",
			},
		},

		{
			name: "ancestor module",
			filePaths: ["C:/dir/dir2/dir3/dir4/file.ts", "C:/dir/file.jsx"],
			filePath: "C:/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../file",
			result: {
				filePath: "C:/dir/file.jsx",
				importPath: "../../../file",
			},
		},

		{
			name: "ancestor index module",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/index.jsx"],
			filePath: "/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../..",
			result: {
				filePath: "/dir/index.jsx",
				importPath: "../../..",
			},
		},

		{
			name: "ancestor index module expicitly",
			filePaths: ["C:/dir/dir2/dir3/dir4/file.ts", "C:/dir/index.jsx"],
			filePath: "C:/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../index",
			result: {
				filePath: "C:/dir/index.jsx",
				importPath: "../../../index",
			},
		},

		{
			name: "ancestor module by sub path",
			filePaths: ["/dir/dir2/dir3/dir4/file.ts", "/dir/file.jsx"],
			filePath: "/dir/dir2/dir3/dir4/file.ts",
			importPath: "../../../../dir/file",
			result: {
				filePath: "/dir/file.jsx",
				importPath: "../../../../dir/file",
			},
		},

		{
			name: "ts extension is resolved first",
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
			name: "tsx extension is resolved second",
			filePaths: [
				"C:/dir/file1.ts",
				"C:/dir/file2.jsx",
				"C:/dir/file2.js",
				"C:/dir/file2.tsx",
				"C:/dir/file2.d.ts",
			],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.tsx",
				importPath: "./file2",
			},
		},

		{
			name: "js extension is resolved third",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.js", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.js",
				importPath: "./file2",
			},
		},

		{
			name: "jsx extension is resolved forth",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.jsx",
				importPath: "./file2",
			},
		},

		{
			name: "d.ts extension is resolved fifth",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.d.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.d.ts",
				importPath: "./file2",
			},
		},

		{
			name: "file is resolved early than dir with index",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.d.ts", "C:/dir/file2/index.ts"],
			filePath: "C:/dir/file1.tsx",
			importPath: "./file2",
			result: {
				filePath: "C:/dir/file2.d.ts",
				importPath: "./file2",
			},
		},
	])("$name", ({ filePaths, importAliasMapper = () => null, filePath, importPath, result }) => {
		const importSourceResolver = new ImportSourceResolver({ filePaths, importAliasMapper });
		expect(importSourceResolver.resolve({ filePath, importPath })).toEqual(result);
	});
});
