import { describe, expect, it, jest } from "@jest/globals";
import { fs, vol } from "memfs";

import { PathFilter, FSPath } from "../values";
import { loadFiles } from "../module-files-loader";

jest.mock("node:fs/promises", () => fs.promises);

const filePaths = [
	"C:/tmp/source1/file1.ts",
	"C:/tmp/source2/file1.ts",
	"C:/tmp/source2/dir1/file1.ts",
	"C:/tmp/source2/dir1/dir2/file1.ts",
	"C:/tmp/source2/dir1/dir2/dir3/file1.ts",
	"C:/tmp/source3/file1.ts",
	"C:/tmp/source3/file2.ts",
	"C:/tmp/source3/dir1/dir2/file1.ts",
	"C:/tmp/source3/dir1/dir2/file2.ts",
	"C:/tmp/source3/dir1/dir2/file3.ts",
	"C:/tmp/source4/index.mts",
	"C:/tmp/source4/index.cts",
	"C:/tmp/source4/index.mjs",
	"C:/tmp/source4/index.cjs",
	"C:/tmp/source4/index.scss",
	"C:/tmp/source4/index.svg",
];

vol.fromJSON(Object.fromEntries(filePaths.map((path) => [path, path])));

describe("module-files-loader", () => {
	async function loadAllFilesImmediately({
		paths,
		filter = () => true,
	}: {
		paths: FSPath[];
		filter?: PathFilter;
	}) {
		const entries = [];

		for await (const entry of loadFiles({ paths, filter })) {
			entries.push(entry);
		}

		return entries;
	}

	function getEntriesByPaths(paths: FSPath[]) {
		return paths.map((path) => ({ path, code: path }));
	}

	it("empty entries without paths", async () => {
		const entries = await loadAllFilesImmediately({ paths: [] });
		expect(entries).toEqual([]);
	});

	it("only acceptable files are loaded", async () => {
		const entries = await loadAllFilesImmediately({ paths: ["C:/tmp/source4"] });
		expect(entries).toEqual([]);
	});

	it("paths in result are normalized", async () => {
		const entries = await loadAllFilesImmediately({ paths: ["C:\\tmp\\source2"] });

		expect(entries).toEqual(
			getEntriesByPaths([
				"C:/tmp/source2/file1.ts",
				"C:/tmp/source2/dir1/file1.ts",
				"C:/tmp/source2/dir1/dir2/file1.ts",
				"C:/tmp/source2/dir1/dir2/dir3/file1.ts",
			]),
		);
	});

	it("duplicate paths are ignored", async () => {
		const entries = await loadAllFilesImmediately({
			paths: ["C:/tmp/source2/dir1/dir2/", "C:/tmp/source2/dir1/dir2/dir3"],
		});

		expect(entries).toHaveLength(2);
	});

	it("load single file", async () => {
		const path = "C:/tmp/source1/file1.ts";
		const entries = await loadAllFilesImmediately({ paths: [path] });

		expect(entries).toEqual(getEntriesByPaths([path]));
	});

	it("load files in multi nested structure", async () => {
		const entries = await loadAllFilesImmediately({ paths: ["C:/tmp/source2/"] });

		expect(entries).toEqual(
			getEntriesByPaths([
				"C:/tmp/source2/file1.ts",
				"C:/tmp/source2/dir1/file1.ts",
				"C:/tmp/source2/dir1/dir2/file1.ts",
				"C:/tmp/source2/dir1/dir2/dir3/file1.ts",
			]),
		);
	});

	it("filter by file names", async () => {
		const entries = await loadAllFilesImmediately({
			paths: ["C:/tmp/"],
			filter: (path) => path.endsWith("file2.ts"),
		});

		expect(entries).toEqual(getEntriesByPaths(["C:/tmp/source3/file2.ts", "C:/tmp/source3/dir1/dir2/file2.ts"]));
	});

	it("filter by directory names", async () => {
		const entries = await loadAllFilesImmediately({
			paths: ["C:/tmp/"],
			filter: (path) => !/^C:\/tmp\/source[1-3]\/dir1\/dir2/.test(path),
		});

		expect(entries).toEqual(
			getEntriesByPaths([
				"C:/tmp/source1/file1.ts",
				"C:/tmp/source2/file1.ts",
				"C:/tmp/source2/dir1/file1.ts",
				"C:/tmp/source3/file1.ts",
				"C:/tmp/source3/file2.ts",
			]),
		);
	});
});
