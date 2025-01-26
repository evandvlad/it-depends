import { describe, expect, it, jest } from "@jest/globals";
import type { PathFilter } from "~/values";
import { ProgramFilesLoader } from "../program-files-loader";

function createSutComponents({ pathFilter = () => true }: { pathFilter?: PathFilter } = {}) {
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
		[
			"/tmp/source3",
			{ type: "dir", children: ["/tmp/source3/file6.ts", "/tmp/source3/file7.ts", "/tmp/source3/dir4"] },
		],
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

	const params = {
		pathFilter,
		dispatcherPort: {
			dispatch: jest.fn(() => {}),
		},
		fSysPort: {
			getStatEntryType(path: string) {
				return Promise.resolve(fsTestData.get(path)!.type as "file" | "dir");
			},
			readFile(path: string) {
				return Promise.resolve(fsTestData.get(path)!.content!);
			},
			readDir(path: string) {
				return Promise.resolve(fsTestData.get(path)!.children!);
			},
		},
	};

	return new ProgramFilesLoader(params);
}

describe("program-files-loader", () => {
	it("should be empty entries without paths", async () => {
		const instance = createSutComponents();
		const entries = await instance.load([]);

		expect(entries.toKeys()).toEqual([]);
	});

	it("should be normalized paths in result", async () => {
		const instance = createSutComponents();
		const entries = await instance.load(["/tmp/source2"]);

		expect(entries.toKeys()).toEqual([
			"/tmp/source2/file2.ts",
			"/tmp/source2/dir1/file3.ts",
			"/tmp/source2/dir1/dir2/file4.ts",
			"/tmp/source2/dir1/dir2/dir3/file5.ts",
		]);
	});

	it("should be ignored duplicate paths", async () => {
		const instance = createSutComponents();
		const entries = await instance.load(["/tmp/source2/dir1/dir2", "/tmp/source2/dir1/dir2/dir3"]);

		expect(entries.size).toEqual(2);
	});

	it("should load single file", async () => {
		const path = "/tmp/source1/file1.ts";
		const instance = createSutComponents();
		const entries = await instance.load([path]);

		expect(entries.toKeys()).toEqual([path]);
	});

	it("should load files in multi nested structure", async () => {
		const instance = createSutComponents();
		const entries = await instance.load(["/tmp/source2"]);

		expect(entries.toKeys()).toEqual([
			"/tmp/source2/file2.ts",
			"/tmp/source2/dir1/file3.ts",
			"/tmp/source2/dir1/dir2/file4.ts",
			"/tmp/source2/dir1/dir2/dir3/file5.ts",
		]);
	});

	it("should filter by file names", async () => {
		const instance = createSutComponents({
			pathFilter: ({ name, isFile }) => (isFile ? name === "file2.ts" : true),
		});

		const entries = await instance.load(["/tmp"]);

		expect(entries.toKeys()).toEqual(["/tmp/source2/file2.ts"]);
	});

	it("should filter by directory names", async () => {
		const instance = createSutComponents({
			pathFilter: ({ path }) => !/^\/tmp\/source[1-3]\/dir1\/dir2/.test(path),
		});

		const entries = await instance.load(["/tmp"]);

		expect(entries.toKeys()).toEqual([
			"/tmp/source1/file1.ts",
			"/tmp/source2/file2.ts",
			"/tmp/source2/dir1/file3.ts",
			"/tmp/source3/file6.ts",
			"/tmp/source3/file7.ts",
			"/tmp/source3/dir4/dir5/file8.ts",
			"/tmp/source3/dir4/dir5/file9.ts",
			"/tmp/source3/dir4/dir5/file10.ts",
		]);
	});
});
