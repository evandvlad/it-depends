import { describe, expect, it } from "@jest/globals";
import type { AbsoluteFsPath } from "../../fs-path";
import { getBreadcrumbs } from "../path-breadcrumbs";

describe("path-breadcrumbs", () => {
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
		expect(getBreadcrumbs(path as AbsoluteFsPath)).toEqual(result);
	});
});
