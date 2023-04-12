import { describe, it, expect } from "@jest/globals";

import { AppError } from "../../lib/errors";
import { FSTree } from "../fs-tree";

describe("fs-tree", () => {
	it("error for empty file paths list", () => {
		expect(() => {
			new FSTree([]);
		}).toThrow(new AppError("File paths list is empty"));
	});

	it("error on trying to get not exists node by path", () => {
		expect(() => {
			const fsTree = new FSTree(["C:/dir/file.ts"]);
			fsTree.getNodeByPath("C:/dir2/dir3/file.ts");
		}).toThrow(new AppError(`Node by path "C:/dir2/dir3/file.ts" wasn't found`));
	});

	it("error on trying to get children from not exists node by path", () => {
		expect(() => {
			const fsTree = new FSTree(["C:/dir/file.ts"]);
			fsTree.getNodeChildrenByPath("C:/dir2");
		}).toThrow(new AppError(`Node by path "C:/dir2" wasn't found`));
	});

	it.each([
		{
			name: "take file node by path",
			filePaths: ["/dir/file.ts"],
			path: "/dir/file.ts",
			isFile: true,
		},
		{
			name: "take dir node by path",
			filePaths: ["C:/dir/file.ts"],
			path: "C:/dir",
			isFile: false,
		},
		{
			name: "take windows root node by path",
			filePaths: ["C:/dir/file.ts"],
			path: "C:",
			isFile: false,
		},
		{
			name: "take linux root node by path",
			filePaths: ["/dir/file.ts"],
			path: "",
			isFile: false,
		},
	])("$name", ({ filePaths, path, isFile }) => {
		const fsTree = new FSTree(filePaths);
		const node = fsTree.getNodeByPath(path);

		expect(node.isFile).toEqual(isFile);
		expect(node.path).toEqual(path);
	});

	it("take children by path", () => {
		const fsTree = new FSTree([
			"C:/dir1/dir2/dir3/file.ts",
			"C:/dir1/file1.ts",
			"C:/dir2/file.ts",
			"C:/dir1/file2.ts",
		]);

		const nodes = fsTree.getNodeChildrenByPath("C:/dir1");
		const paths = nodes.map(({ path }) => path);

		expect(paths).toEqual(["C:/dir1/dir2", "C:/dir1/file1.ts", "C:/dir1/file2.ts"]);
	});

	it("windows root path", () => {
		const fsTree = new FSTree(["C:/dir/file.ts"]);
		expect(fsTree.rootPath).toEqual("C:");
	});

	it("unix root path", () => {
		const fsTree = new FSTree(["/dir/file.ts"]);
		expect(fsTree.rootPath).toEqual("");
	});
});
