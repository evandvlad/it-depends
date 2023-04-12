import { describe, expect, it } from "@jest/globals";
import { createPackage } from "../../__test-utils__";

import { FSTree } from "../../lib/fs-tree";
import { collectPackages } from "..";

describe("packages-collector", () => {
	it.each([
		{
			name: "modules without package",
			filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx"],
			packages: [],
		},

		{
			name: "single package with standard entry point",
			filePaths: ["C:/dir/index.ts"],
			packages: [
				createPackage({
					path: "C:/dir",
					entryPoint: "C:/dir/index.ts",
					modules: ["C:/dir/index.ts"],
				}),
			],
		},

		{
			name: "single package with custom entry point",
			filePaths: ["/dir/index.entry.tsx"],
			extraPackageEntryFileNames: ["index.entry"],
			packages: [
				createPackage({
					path: "/dir",
					entryPoint: "/dir/index.entry.tsx",
					modules: ["/dir/index.entry.tsx"],
				}),
			],
		},

		{
			name: "single package with custom entry point mapping",
			filePaths: ["C:/dir/main.js"],
			extraPackageEntryFilePaths: ["C:/dir/main.js"],
			packages: [
				createPackage({
					path: "C:/dir",
					entryPoint: "C:/dir/main.js",
					modules: ["C:/dir/main.js"],
				}),
			],
		},

		{
			name: "single package with several flat modules",
			filePaths: ["/dir/file1.ts", "/dir/file2.js", "/dir/index.tsx"],
			packages: [
				createPackage({
					path: "/dir",
					entryPoint: "/dir/index.tsx",
					modules: ["/dir/file1.ts", "/dir/file2.js", "/dir/index.tsx"],
				}),
			],
		},

		{
			name: "correct resolution package's entry point",
			filePaths: ["/dir/index.d.ts", "/dir/index.ts", "/dir/index.js"],
			packages: [
				createPackage({
					path: "/dir",
					entryPoint: "/dir/index.ts",
					modules: ["/dir/index.d.ts", "/dir/index.ts", "/dir/index.js"],
				}),
			],
		},

		{
			name: "single package with several nested modules",
			filePaths: [
				"C:/dir/file1.ts",
				"C:/dir/dir2/file.d.ts",
				"C:/dir/file2.js",
				"C:/dir/index.tsx",
				"C:/dir/dir2/dir3/file.jsx",
			],
			packages: [
				createPackage({
					path: "C:/dir",
					entryPoint: "C:/dir/index.tsx",
					modules: [
						"C:/dir/file1.ts",
						"C:/dir/file2.js",
						"C:/dir/index.tsx",
						"C:/dir/dir2/file.d.ts",
						"C:/dir/dir2/dir3/file.jsx",
					],
				}),
			],
		},

		{
			name: "main package with inner flat packages",
			filePaths: [
				"/dir/index.ts",
				"/dir/dir1/file.tsx",
				"/dir/dir1/index.js",
				"/dir/dir2/file.jsx",
				"/dir/dir2/index.ts",
			],
			packages: [
				createPackage({
					path: "/dir",
					entryPoint: "/dir/index.ts",
					modules: ["/dir/index.ts"],
					packages: ["/dir/dir1", "/dir/dir2"],
				}),
				createPackage({
					path: "/dir/dir1",
					parent: "/dir",
					entryPoint: "/dir/dir1/index.js",
					modules: ["/dir/dir1/file.tsx", "/dir/dir1/index.js"],
				}),
				createPackage({
					path: "/dir/dir2",
					parent: "/dir",
					entryPoint: "/dir/dir2/index.ts",
					modules: ["/dir/dir2/file.jsx", "/dir/dir2/index.ts"],
				}),
			],
		},

		{
			name: "main package with inner nested packages",
			filePaths: [
				"C:/dir/dir1/dir2/index.ts",
				"C:/dir/dir1/dir2/file.jsx",
				"C:/dir/dir1/index.js",
				"C:/dir/dir1/file.tsx",
				"C:/dir/index.ts",
			],
			packages: [
				createPackage({
					path: "C:/dir",
					entryPoint: "C:/dir/index.ts",
					modules: ["C:/dir/index.ts"],
					packages: ["C:/dir/dir1"],
				}),
				createPackage({
					path: "C:/dir/dir1",
					parent: "C:/dir",
					entryPoint: "C:/dir/dir1/index.js",
					modules: ["C:/dir/dir1/index.js", "C:/dir/dir1/file.tsx"],
					packages: ["C:/dir/dir1/dir2"],
				}),
				createPackage({
					path: "C:/dir/dir1/dir2",
					parent: "C:/dir/dir1",
					entryPoint: "C:/dir/dir1/dir2/index.ts",
					modules: ["C:/dir/dir1/dir2/index.ts", "C:/dir/dir1/dir2/file.jsx"],
				}),
			],
		},

		{
			name: "complex packages tree",
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
			extraPackageEntryFilePaths: ["/dir/main.ts"],
			packages: [
				createPackage({
					path: "/dir",
					entryPoint: "/dir/main.ts",
					modules: ["/dir/index.ts", "/dir/main.ts"],
					packages: ["/dir/dir1", "/dir/dir2"],
				}),
				createPackage({
					path: "/dir/dir1",
					parent: "/dir",
					entryPoint: "/dir/dir1/index.js",
					modules: ["/dir/dir1/index.js", "/dir/dir1/file.tsx"],
					packages: ["/dir/dir1/dir1", "/dir/dir1/dir2", "/dir/dir1/dir3"],
				}),
				createPackage({
					path: "/dir/dir1/dir1",
					parent: "/dir/dir1",
					entryPoint: "/dir/dir1/dir1/index.ts",
					modules: ["/dir/dir1/dir1/index.ts", "/dir/dir1/dir1/file.jsx"],
				}),
				createPackage({
					path: "/dir/dir1/dir2",
					parent: "/dir/dir1",
					entryPoint: "/dir/dir1/dir2/index.tsx",
					modules: ["/dir/dir1/dir2/index.tsx"],
				}),
				createPackage({
					path: "/dir/dir1/dir3",
					parent: "/dir/dir1",
					entryPoint: "/dir/dir1/dir3/index.jsx",
					modules: ["/dir/dir1/dir3/index.jsx"],
				}),
				createPackage({
					path: "/dir/dir2",
					parent: "/dir",
					entryPoint: "/dir/dir2/index.js",
					modules: ["/dir/dir2/index.d.ts", "/dir/dir2/index.js"],
				}),
			],
		},
	])("$name", ({ filePaths, packages, extraPackageEntryFileNames = [], extraPackageEntryFilePaths = [] }) => {
		const fsTree = new FSTree(filePaths);

		const packagesList = collectPackages({
			fsTree,
			extraPackageEntryFileNames,
			extraPackageEntryFilePaths,
		}).toList();

		expect(packagesList).toEqual(packages);
	});
});
