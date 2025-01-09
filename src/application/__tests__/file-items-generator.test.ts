import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { fs, vol } from "memfs";
import { FSys } from "../../adapters/fsys";
import type { AbsoluteFsPath } from "../../lib/fs-path";
import { type PathFilter, createFileItemsGenerator } from "../file-items-generator";

jest.mock("node:fs/promises", () => fs.promises);

async function loadAllFilesAndGetPathsImmediately({
	paths,
	pathFilter = () => true,
}: {
	paths: string[];
	pathFilter?: PathFilter;
}) {
	const entries: string[] = [];

	for await (const entry of createFileItemsGenerator({
		pathFilter,
		paths: paths as AbsoluteFsPath[],
		fSysPort: new FSys(),
	})) {
		entries.push(entry.path);
	}

	return entries.sort();
}

describe("file-items-generator", () => {
	beforeAll(() => {
		const filePaths = [
			"/tmp/source1/file1.ts",
			"/tmp/source2/file1.ts",
			"/tmp/source2/dir1/file1.ts",
			"/tmp/source2/dir1/dir2/file1.ts",
			"/tmp/source2/dir1/dir2/dir3/file1.ts",
			"/tmp/source3/file1.ts",
			"/tmp/source3/file2.ts",
			"/tmp/source3/dir1/dir2/file1.ts",
			"/tmp/source3/dir1/dir2/file2.ts",
			"/tmp/source3/dir1/dir2/file3.ts",
		];

		vol.fromJSON(Object.fromEntries(filePaths.map((path) => [path, path])));
	});

	afterAll(() => {
		vol.reset();
	});

	it("should be empty entries without paths", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: [] });
		expect(entries).toEqual([]);
	});

	it("should be normalized paths in result", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: ["/tmp/source2"] });

		expect(entries).toEqual([
			"/tmp/source2/dir1/dir2/dir3/file1.ts",
			"/tmp/source2/dir1/dir2/file1.ts",
			"/tmp/source2/dir1/file1.ts",
			"/tmp/source2/file1.ts",
		]);
	});

	it("should be ignored duplicate paths", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({
			paths: ["/tmp/source2/dir1/dir2/", "/tmp/source2/dir1/dir2/dir3"],
		});

		expect(entries).toHaveLength(2);
	});

	it("should load single file", async () => {
		const path = "/tmp/source1/file1.ts";
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: [path] });

		expect(entries).toEqual([path]);
	});

	it("should load files in multi nested structure", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: ["/tmp/source2/"] });

		expect(entries).toEqual([
			"/tmp/source2/dir1/dir2/dir3/file1.ts",
			"/tmp/source2/dir1/dir2/file1.ts",
			"/tmp/source2/dir1/file1.ts",
			"/tmp/source2/file1.ts",
		]);
	});

	it("should filter by file names", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({
			paths: ["/tmp/"],
			pathFilter: (path) => path.endsWith("file2.ts"),
		});

		expect(entries).toEqual(["/tmp/source3/dir1/dir2/file2.ts", "/tmp/source3/file2.ts"]);
	});

	it("should filter by directory names", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({
			paths: ["/tmp/"],
			pathFilter: (path) => !/^\/tmp\/source[1-3]\/dir1\/dir2/.test(path),
		});

		expect(entries).toEqual([
			"/tmp/source1/file1.ts",
			"/tmp/source2/dir1/file1.ts",
			"/tmp/source2/file1.ts",
			"/tmp/source3/file1.ts",
			"/tmp/source3/file2.ts",
		]);
	});
});
