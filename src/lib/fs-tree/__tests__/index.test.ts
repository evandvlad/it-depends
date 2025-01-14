import { describe, expect, it } from "@jest/globals";
import { AppError } from "~/lib/errors";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { FSTree } from "..";

describe("fs-tree", () => {
	it("should throw error for empty file paths list", () => {
		expect(() => {
			new FSTree([]);
		}).toThrow(new AppError("File paths list is empty"));
	});

	it("should throw error on trying to get node by path which doesn't exist", () => {
		expect(() => {
			const fSTree = new FSTree(["C:/dir/file.ts"] as AbsoluteFsPath[]);
			fSTree.getNodeByPath("C:/dir2/dir3/file.ts" as AbsoluteFsPath);
		}).toThrow(new AppError(`Value by key "C:/dir2/dir3/file.ts" wasn't found in rec`));
	});

	it("should throw error on trying to get children by path which don't exist", () => {
		expect(() => {
			const fSTree = new FSTree(["C:/dir/file.ts"] as AbsoluteFsPath[]);
			fSTree.getNodeChildrenByPath("C:/dir2" as AbsoluteFsPath);
		}).toThrow(new AppError(`Value by key "C:/dir2" wasn't found in rec`));
	});

	it.each([
		{
			name: "should be true if node exists",
			filePaths: ["/dir1/dir2/file.ts"],
			path: "/dir1",
			isExists: true,
		},
		{
			name: "should be false if node doesn't exist",
			filePaths: ["C:/dir/file.ts"],
			path: "C:/dir/file2.js",
			isExists: false,
		},
	])("$name", ({ filePaths, path, isExists }) => {
		const fSTree = new FSTree(filePaths as AbsoluteFsPath[]);
		expect(fSTree.hasNodeByPath(path as AbsoluteFsPath)).toEqual(isExists);
	});

	it.each([
		{
			name: "should be file node",
			filePaths: ["/dir1/dir2/file.ts"],
			path: "/dir1/dir2/file.ts",
			entryName: "file.ts",
			isFile: true,
		},
		{
			name: "shouldn't be file node for dir node",
			filePaths: ["C:/dir/file.ts"],
			path: "C:/dir",
			entryName: "dir",
			isFile: false,
		},
		{
			name: "shouldn't be file node for windows root node",
			filePaths: ["C:/dir/file.ts"],
			path: "C:",
			entryName: "C:",
			isFile: false,
		},
		{
			name: "shouldn't be file node for linux root node",
			filePaths: ["/dir/file.ts"],
			path: "/",
			entryName: "",
			isFile: false,
		},
	])("$name", ({ filePaths, path, entryName, isFile }) => {
		const fSTree = new FSTree(filePaths as AbsoluteFsPath[]);
		const node = fSTree.getNodeByPath(path as AbsoluteFsPath);

		expect(node.isFile).toEqual(isFile);
		expect(node.path).toEqual(path);
		expect(node.name).toEqual(entryName);
	});

	it("should get child nodes by path", () => {
		const fSTree = new FSTree([
			"C:/dir1/dir2/dir3/file.ts",
			"C:/dir1/file1.ts",
			"C:/dir2/file.ts",
			"C:/dir1/file2.ts",
		] as AbsoluteFsPath[]);

		const nodes = fSTree.getNodeChildrenByPath("C:/dir1" as AbsoluteFsPath);
		const paths = nodes.map(({ path }) => path);

		expect(paths).toEqual(["C:/dir1/dir2", "C:/dir1/file1.ts", "C:/dir1/file2.ts"]);
	});

	it("should be windows root path", () => {
		const fSTree = new FSTree(["C:/dir/file.ts"] as AbsoluteFsPath[]);
		expect(fSTree.rootPath).toEqual("C:");
	});

	it("should be unix root path", () => {
		const fSTree = new FSTree(["/dir/file.ts"] as AbsoluteFsPath[]);
		expect(fSTree.rootPath).toEqual("/");
	});

	it.each([
		{
			name: "should get short root path for big tree",
			filePaths: ["/my/proj/src/index.ts", "/my/proj/src/dir1/dir1/dir3/index.js", "/my/proj/src/dir1/dir2/index.tsx"],
			shortRootPath: "/my/proj/src",
		},
		{
			name: "should get short root path for short tree",
			filePaths: ["/index.ts", "/dir1/dir1/dir3/index.js", "/dir1/dir2/index.tsx"],
			shortRootPath: "/",
		},
	])("$name", ({ filePaths, shortRootPath }) => {
		const fSTree = new FSTree(filePaths as AbsoluteFsPath[]);
		expect(fSTree.shortRootPath).toEqual(shortRootPath);
	});

	it("should get short path by absolute windows path", () => {
		const fSTree = new FSTree(["C:/tmp/proj/src/index.ts", "C:/tmp/proj/src/dir/file.js"] as AbsoluteFsPath[]);

		expect(fSTree.getShortPathByPath("C:/tmp/proj/src/index.ts" as AbsoluteFsPath)).toEqual("src/index.ts");
		expect(fSTree.getShortPathByPath("C:/tmp/proj/src/dir" as AbsoluteFsPath)).toEqual("src/dir");
		expect(fSTree.getShortPathByPath("C:/tmp" as AbsoluteFsPath)).toEqual("C:/tmp");
		expect(fSTree.getShortPathByPath("D:/index.ts" as AbsoluteFsPath)).toEqual("D:/index.ts");
	});

	it("should get short path by absolute unix path", () => {
		const fSTree = new FSTree(["/src/index.ts", "/src/dir/file.js"] as AbsoluteFsPath[]);

		expect(fSTree.getShortPathByPath("/src/index.ts" as AbsoluteFsPath)).toEqual("src/index.ts");
	});
});
