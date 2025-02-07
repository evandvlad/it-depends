import { describe, expect, it } from "@jest/globals";
import { isRelative } from "../import-path";

describe("import-path", () => {
	describe("isRelative", () => {
		it.each([
			{
				name: "should be relative for .",
				path: ".",
				result: true,
			},
			{
				name: "should be relative for ..",
				path: "..",
				result: true,
			},
			{
				name: "should be relative for .. with additional parts",
				path: "../../dir1",
				result: true,
			},
			{
				name: "should be relative for . with additional parts",
				path: "./dir1/dir2",
				result: true,
			},
			{
				name: "shouldn't be relative for ~",
				path: "~",
				result: false,
			},
			{
				name: "shouldn't be relative for ~ with additional parts",
				path: "~/dir",
				result: false,
			},
			{
				name: "shoudn't be relative for /",
				path: "/",
				result: false,
			},
			{
				name: "shouldn't be relative for / with additional parts",
				path: "/dir1/dir2",
				result: false,
			},
			{
				name: "shouldn't be relative for common external module name",
				path: "react",
				result: false,
			},
		])("$name", ({ path, result }) => {
			expect(isRelative(path)).toEqual(result);
		});
	});
});
