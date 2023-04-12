import { describe, it, expect } from "@jest/globals";

import { AppError } from "../../lib/errors";

import {
	isAcceptableFile,
	getModuleFileInfo,
	isRelativeImport,
	getImportResolutionFSPaths,
	resolveEntryPointModule,
} from "../module-details";

describe("module-details", () => {
	describe("isAcceptableFile", () => {
		it.each([
			{ name: "js file is acceptable", path: "C:/dir/file.js", result: true },
			{ name: "jsx file is acceptable", path: "C:/dir/file.jsx", result: true },
			{ name: "ts file is acceptable", path: "C:/dir/file.ts", result: true },
			{ name: "tsx file is acceptable", path: "C:/dir/file.tsx", result: true },
			{ name: "d.ts file is acceptable", path: "C:/dir/file.d.ts", result: true },
			{ name: "mjs file isn't acceptable", path: "C:/dir/file.mjs", result: false },
			{ name: "cjs file isn't acceptable", path: "C:/dir/file.cjs", result: false },
			{ name: "d.mts file isn't acceptable", path: "C:/dir/file.d.mts", result: false },
			{ name: "d.cts file isn't acceptable", path: "C:/dir/file.d.cts", result: false },
			{ name: "d.js file is acceptable", path: "C:/dir/file.d.js", result: true },
			{ name: "jsx file is acceptable", path: "C:/dir/file.d.jsx", result: true },
			{ name: "tsx file is acceptable", path: "C:/dir/file.d.tsx", result: true },
			{ name: "some prefix except d for ts file is acceptable", path: "C:/dir/file.ddd.ts", result: true },
			{ name: "file without explicit ext name isn't acceptable", path: "C:/dir/.ignore", result: false },
			{ name: "file without ext name isn't acceptable", path: "C:/dir/file", result: false },
			{ name: "css file isn't acceptable", path: "C:/dir/file.css", result: false },
			{ name: "scss file isn't acceptable", path: "C:/dir/file.scss", result: false },
			{ name: "svg file isn't acceptable", path: "C:/dir/file.svg", result: false },
		])("$name", ({ path, result }) => {
			expect(isAcceptableFile(path)).toEqual(result);
		});
	});

	describe("getModuleFileInfo", () => {
		it.each([
			{
				name: "js module file info",
				path: "C:/dir/file.js",
				result: {
					language: "javascript",
					allowedJSXSyntax: true,
					fullName: "file.js",
				},
			},
			{
				name: "jsx module file info",
				path: "C:/dir/file.jsx",
				result: {
					language: "javascript",
					allowedJSXSyntax: true,
					fullName: "file.jsx",
				},
			},
			{
				name: "ts module file info",
				path: "C:/dir/file.ts",
				result: {
					language: "typescript",
					allowedJSXSyntax: false,
					fullName: "file.ts",
				},
			},
			{
				name: "tsx module file info",
				path: "C:/dir/file.tsx",
				result: {
					language: "typescript",
					allowedJSXSyntax: true,
					fullName: "file.tsx",
				},
			},
			{
				name: "d.ts module file info",
				path: "C:/dir/file.d.ts",
				result: {
					language: "typescript",
					allowedJSXSyntax: false,
					fullName: "file.d.ts",
				},
			},
			{
				name: "file with dots on path",
				path: "C:/dir/file.a.b.c.ts",
				result: {
					language: "typescript",
					allowedJSXSyntax: false,
					fullName: "file.a.b.c.ts",
				},
			},
			{
				name: "d.tsx module file has corret ext name",
				path: "C:/dir/file.d.tsx",
				result: {
					language: "typescript",
					allowedJSXSyntax: true,
					fullName: "file.d.tsx",
				},
			},
		])("$name", ({ path, result }) => {
			expect(getModuleFileInfo(path)).toEqual(result);
		});

		it("error for isn't acceptable file", () => {
			expect(() => {
				getModuleFileInfo("C:/dir/file.mts");
			}).toThrow(new AppError(`File by path "C:/dir/file.mts" isn't acceptable by ext name`));
		});
	});

	describe("isRelativeImport", () => {
		it.each([
			{ name: "relative for '.'", path: ".", result: true },
			{ name: "relative for '..'", path: "..", result: true },
			{ name: "relative for './'", path: "./file", result: true },
			{ name: "relative for '../'", path: "../file", result: true },
			{ name: "relative for nestes '../'", path: "../../../file", result: true },
			{ name: "not relative for nestes '/'", path: "/file", result: false },
			{ name: "not relative for nestes '~/'", path: "~/file", result: false },
			{ name: "not relative for external module", path: "file", result: false },
		])("$name", ({ path, result }) => {
			expect(isRelativeImport(path)).toEqual(result);
		});
	});

	describe("getImportResolutionFSPaths", () => {
		it("collect all file system path by resolution priority", () => {
			expect(getImportResolutionFSPaths("/file")).toEqual([
				"/file.ts",
				"/file.tsx",
				"/file.js",
				"/file.jsx",
				"/file.d.ts",
				"/file/index.ts",
				"/file/index.tsx",
				"/file/index.js",
				"/file/index.jsx",
				"/file/index.d.ts",
			]);
		});
	});

	describe("resolveEntryPointModule", () => {
		it.each([
			{
				name: "standard index file",
				filePaths: ["C:/dir/index.ts"],
				result: "C:/dir/index.ts",
			},
			{
				name: "not entry point module",
				filePaths: ["/dir/main.ts"],
				result: null,
			},
			{
				name: "entry point module by extra file names",
				filePaths: ["C:/dir/index.entry.tsx"],
				extraEntryFileNames: ["index.entry"],
				result: "C:/dir/index.entry.tsx",
			},
			{
				name: "entry point module by extra file path",
				filePaths: ["C:/dir/index.entry.tsx"],
				extraEntryFilePaths: ["C:/dir/index.entry.tsx"],
				result: "C:/dir/index.entry.tsx",
			},
			{
				name: "entry point module by extra file path has highest priority",
				filePaths: ["C:/dir/index.ts", "C:/dir/index.entry.tsx", "C:/dir/index.js", "C:/dir/main.ts"],
				extraEntryFilePaths: ["C:/dir/index.entry.tsx"],
				extraEntryFileNames: ["main"],
				result: "C:/dir/index.entry.tsx",
			},
			{
				name: "standart index file has higher priority than extra file names",
				filePaths: ["/dir/entry.ts", "/dir/index.js"],
				extraEntryFileNames: ["entry"],
				result: "/dir/index.js",
			},
			{
				name: "resolve index file by ext name priority",
				filePaths: ["C:/dir/index.tsx", "C:/dir/index.js", "C:/dir/index.ts", "C:/dir/index.d.ts"],
				result: "C:/dir/index.ts",
			},
		])("$name", ({ filePaths, result, extraEntryFilePaths = [], extraEntryFileNames = [] }) => {
			expect(resolveEntryPointModule({ filePaths, extraEntryFileNames, extraEntryFilePaths })).toEqual(result);
		});
	});
});
