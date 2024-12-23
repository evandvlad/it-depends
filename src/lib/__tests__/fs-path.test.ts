import { platform } from "node:os";
import { describe, expect, it } from "@jest/globals";
import { type AbsoluteFsPath, getName, getParentPath, isAbsolutePath, joinPaths, normalizePath } from "../fs-path";

const isWindows = platform() === "win32";

describe("fs-path", () => {
	describe("isAbsolutePath", () => {
		it.each([
			{ name: "should be absolute windows path", path: "C:\\tmp\\dir", result: isWindows },
			{ name: "should be absolute normalized windows path", path: "C:/tmp/dir", result: isWindows },
			{ name: "should be absolute unix path", path: "/tmp/dir", result: true },
			{ name: "should be relative windows path", path: ".\\tmp\\dir", result: false },
			{ name: "should be relative normalized path", path: "../tmp/dir", result: false },
		])("$name", ({ path, result }) => {
			expect(isAbsolutePath(path)).toEqual(result);
		});
	});

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
			expect(normalizePath(path as AbsoluteFsPath)).toEqual(result);
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
			expect(joinPaths(path1 as AbsoluteFsPath, path2)).toEqual(result);
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
			expect(getParentPath(path as AbsoluteFsPath)).toEqual(result);
		});
	});

	describe("getName", () => {
		it.each([
			{
				name: "should be empty for root",
				path: "/",
				result: "",
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
			expect(getName(path as AbsoluteFsPath)).toEqual(result);
		});
	});
});
