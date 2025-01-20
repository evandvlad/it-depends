import { describe, expect, it } from "@jest/globals";
import { getBreadcrumbs, getName, getParentPath, joinPaths, normalizePath } from "../fs-path";

describe("fs-path", () => {
	describe("normalizePath", () => {
		it.each([
			{ name: "should be normalized windows relative path", path: ".\\tmp\\file.txt", result: "./tmp/file.txt" },
			{
				name: "should be normalized windows absolute path",
				path: "C:\\tmp\\file.txt",
				result: "C:/tmp/file.txt",
			},
			{ name: "should be not changed unix path", path: "./tmp/file.txt", result: "./tmp/file.txt" },
			{
				name: "should discard extra slashes from window path",
				path: "C://tmp/file.txt",
				result: "C:/tmp/file.txt",
			},
		])("$name", ({ path, result }) => {
			expect(normalizePath(path)).toEqual(result);
		});
	});

	describe("joinPaths", () => {
		it.each([
			{
				name: "should join paths",
				path1: "/tmp/dir",
				path2: "../file.txt",
				result: "/tmp/file.txt",
			},
		])("$name", ({ path1, path2, result }) => {
			expect(joinPaths(path1, path2)).toEqual(result);
		});
	});

	describe("getParentPath", () => {
		it.each([
			{
				name: "should get parent path for file",
				path: "/tmp/file.ts",
				result: "/tmp",
			},

			{
				name: "should get parent path for dir",
				path: "/tmp/dir",
				result: "/tmp",
			},

			{
				name: "should get parent path for root dir which is root dir",
				path: "/",
				result: "/",
			},
		])("$name", ({ path, result }) => {
			expect(getParentPath(path)).toEqual(result);
		});
	});

	describe("getName", () => {
		it.each([
			{
				name: "should be correct for unix root",
				path: "/",
				result: "/",
			},
			{
				name: "should be correct for windows root",
				path: "C:",
				result: "C:",
			},
			{
				name: "should be dir for path to folder",
				path: "/tmp/dir",
				result: "dir",
			},
			{
				name: "should be file for path to file",
				path: "C:/tmp/dir/file.js",
				result: "file.js",
			},
		])("$name", ({ path, result }) => {
			expect(getName(path)).toEqual(result);
		});
	});

	describe("getBreadcrumbs", () => {
		it.each([
			{
				name: "should get breadcrumbs for windows dir path",
				path: "C:/dir1/dir2",
				result: ["C:", "C:/dir1", "C:/dir1/dir2"],
			},
			{
				name: "should get breadcrumbs for windows file path",
				path: "C:/dir1/dir2/file.d.ts",
				result: ["C:", "C:/dir1", "C:/dir1/dir2", "C:/dir1/dir2/file.d.ts"],
			},
			{
				name: "should get breadcrumbs for unix dir path",
				path: "/dir1/dir2",
				result: ["/", "/dir1", "/dir1/dir2"],
			},
			{
				name: "should get breadcrumbs for unix file path",
				path: "/dir1/dir2/file.ts",
				result: ["/", "/dir1", "/dir1/dir2", "/dir1/dir2/file.ts"],
			},
			{
				name: "should get breadcrumbs for windows root dir path",
				path: "C:/",
				result: ["C:"],
			},
			{
				name: "should get breadcrumbs for unix root dir path",
				path: "/",
				result: ["/"],
			},
		])("$name", ({ path, result }) => {
			expect(getBreadcrumbs(path)).toEqual(result);
		});
	});
});
