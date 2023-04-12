import { describe, it, expect } from "@jest/globals";

import { isAbsolutePath, normalizePath, joinPaths, getPathBreadcrumbs } from "../fs-path";

describe("fs-path", () => {
	describe("isAbsolutePath", () => {
		it.each([
			{ name: "absolute windows path", path: "C:\\tmp\\dir", result: true },
			{ name: "absolute normalized windows path", path: "C:/tmp/dir", result: true },
			{ name: "absolute unix path", path: "/tmp/dir", result: true },
			{ name: "relative windows path", path: ".\\tmp\\dir", result: false },
			{ name: "relative normalized path", path: "../tmp/dir", result: false },
		])("$name", ({ path, result }) => {
			expect(isAbsolutePath(path)).toEqual(result);
		});
	});

	describe("normalizePath", () => {
		it.each([
			{ name: "normalized windows relative path", path: ".\\tmp\\file.txt", result: "./tmp/file.txt" },
			{ name: "normalized windows absolute path", path: "C:\\tmp\\file.txt", result: "C:/tmp/file.txt" },
			{ name: "unix path isn't changed", path: "./tmp/file.txt", result: "./tmp/file.txt" },
			{ name: "discard extra slashes for window path", path: "C://tmp/file.txt", result: "C:/tmp/file.txt" },
		])("$name", ({ path, result }) => {
			expect(normalizePath(path)).toEqual(result);
		});
	});

	describe("joinPaths", () => {
		it.each([
			{
				name: "result for not normalized paths is normalized",
				path1: "C:\\tmp\\dir",
				path2: "..\\file.txt",
				result: "C:/tmp/file.txt",
			},
		])("$name", ({ path1, path2, result }) => {
			expect(joinPaths(path1, path2)).toEqual(result);
		});
	});

	describe("getPathBreadcrumbs", () => {
		it.each([
			{
				name: "windows dir path",
				path: "C:/dir1/dir2",
				result: ["C:", "C:/dir1", "C:/dir1/dir2"],
			},
			{
				name: "windows file path",
				path: "C:/dir1/dir2/file.d.ts",
				result: ["C:", "C:/dir1", "C:/dir1/dir2", "C:/dir1/dir2/file.d.ts"],
			},
			{
				name: "unix dir path",
				path: "/dir1/dir2",
				result: ["", "/dir1", "/dir1/dir2"],
			},
			{
				name: "unix file path",
				path: "/dir1/dir2/file.ts",
				result: ["", "/dir1", "/dir1/dir2", "/dir1/dir2/file.ts"],
			},
			{
				name: "windows root dir path",
				path: "C:/",
				result: ["C:"],
			},
			{
				name: "unix root dir path",
				path: "/",
				result: [""],
			},
		])("$name", ({ path, result }) => {
			expect(getPathBreadcrumbs(path)).toEqual(result);
		});
	});
});
