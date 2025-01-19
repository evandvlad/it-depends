import { describe, expect, it } from "@jest/globals";
import { type PathFilter, createFileItemsGenerator } from "../file-items-generator";

const fsTestData = new Map([
	["/", { type: "dir", children: ["/tmp"] }],
	["/tmp", { type: "dir", children: ["/tmp/source1", "/tmp/source2", "/tmp/source3"] }],
	["/tmp/source1", { type: "dir", children: ["/tmp/source1/file1.ts"] }],
	["/tmp/source1/file1.ts", { type: "file", content: "/tmp/source1/file1.ts" }],
	["/tmp/source2", { type: "dir", children: ["/tmp/source2/file2.ts", "/tmp/source2/dir1"] }],
	["/tmp/source2/file2.ts", { type: "file", content: "/tmp/source2/file2.ts" }],
	["/tmp/source2/dir1", { type: "dir", children: ["/tmp/source2/dir1/file3.ts", "/tmp/source2/dir1/dir2"] }],
	["/tmp/source2/dir1/file3.ts", { type: "file", content: "/tmp/source2/dir1/file3.ts" }],
	[
		"/tmp/source2/dir1/dir2",
		{ type: "dir", children: ["/tmp/source2/dir1/dir2/file4.ts", "/tmp/source2/dir1/dir2/dir3"] },
	],
	["/tmp/source2/dir1/dir2/file4.ts", { type: "file", content: "/tmp/source2/dir1/dir2/file4.ts" }],
	["/tmp/source2/dir1/dir2/dir3", { type: "dir", children: ["/tmp/source2/dir1/dir2/dir3/file5.ts"] }],
	["/tmp/source2/dir1/dir2/dir3/file5.ts", { type: "file", content: "/tmp/source2/dir1/dir2/dir3/file5.ts" }],
	["/tmp/source3", { type: "dir", children: ["/tmp/source3/file6.ts", "/tmp/source3/file7.ts", "/tmp/source3/dir4"] }],
	["/tmp/source3/file6.ts", { type: "file", content: "/tmp/source3/file6.ts" }],
	["/tmp/source3/file7.ts", { type: "file", content: "/tmp/source3/file7.ts" }],
	["/tmp/source3/dir4", { type: "dir", children: ["/tmp/source3/dir4/dir5"] }],
	[
		"/tmp/source3/dir4/dir5",
		{
			type: "dir",
			children: [
				"/tmp/source3/dir4/dir5/file8.ts",
				"/tmp/source3/dir4/dir5/file9.ts",
				"/tmp/source3/dir4/dir5/file10.ts",
			],
		},
	],
	["/tmp/source3/dir4/dir5/file8.ts", { type: "file", content: "/tmp/source3/dir4/dir5/file8.ts" }],
	["/tmp/source3/dir4/dir5/file9.ts", { type: "file", content: "/tmp/source3/dir4/dir5/file9.ts" }],
	["/tmp/source3/dir4/dir5/file10.ts", { type: "file", content: "/tmp/source3/dir4/dir5/file10.ts" }],
]);

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
		paths: paths,
		fSysPort: {
			getStatEntryType(path) {
				return Promise.resolve(fsTestData.get(path)!.type as "file" | "dir");
			},
			readFile(path) {
				return Promise.resolve(fsTestData.get(path)!.content!);
			},
			readDir(path) {
				return Promise.resolve(fsTestData.get(path)!.children!);
			},
		},
	})) {
		entries.push(entry.path);
	}

	return entries.sort();
}

describe("file-items-generator", () => {
	it("should be empty entries without paths", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: [] });
		expect(entries).toEqual([]);
	});

	it("should be normalized paths in result", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: ["/tmp/source2"] });

		expect(entries).toEqual([
			"/tmp/source2/dir1/dir2/dir3/file5.ts",
			"/tmp/source2/dir1/dir2/file4.ts",
			"/tmp/source2/dir1/file3.ts",
			"/tmp/source2/file2.ts",
		]);
	});

	it("should be ignored duplicate paths", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({
			paths: ["/tmp/source2/dir1/dir2", "/tmp/source2/dir1/dir2/dir3"],
		});

		expect(entries).toHaveLength(2);
	});

	it("should load single file", async () => {
		const path = "/tmp/source1/file1.ts";
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: [path] });

		expect(entries).toEqual([path]);
	});

	it("should load files in multi nested structure", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({ paths: ["/tmp/source2"] });

		expect(entries).toEqual([
			"/tmp/source2/dir1/dir2/dir3/file5.ts",
			"/tmp/source2/dir1/dir2/file4.ts",
			"/tmp/source2/dir1/file3.ts",
			"/tmp/source2/file2.ts",
		]);
	});

	it("should filter by file names", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({
			paths: ["/tmp"],
			pathFilter: (path) => path.endsWith("file2.ts"),
		});

		expect(entries).toEqual(["/tmp/source2/file2.ts"]);
	});

	it("should filter by directory names", async () => {
		const entries = await loadAllFilesAndGetPathsImmediately({
			paths: ["/tmp"],
			pathFilter: (path) => !/^\/tmp\/source[1-3]\/dir1\/dir2/.test(path),
		});

		expect(entries).toEqual([
			"/tmp/source1/file1.ts",
			"/tmp/source2/dir1/file3.ts",
			"/tmp/source2/file2.ts",
			"/tmp/source3/dir4/dir5/file10.ts",
			"/tmp/source3/dir4/dir5/file8.ts",
			"/tmp/source3/dir4/dir5/file9.ts",
			"/tmp/source3/file6.ts",
			"/tmp/source3/file7.ts",
		]);
	});
});
