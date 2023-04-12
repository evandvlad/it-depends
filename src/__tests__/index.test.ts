import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fs, vol } from "memfs";
import { createPackage, createModule, createSummary } from "../__test-utils__";

import { ItDepends, AppError } from "..";

jest.mock("node:fs/promises", () => fs.promises);

describe("index", () => {
	describe("configuration errors", () => {
		it.each([
			{
				name: "empty paths",
				options: {
					paths: [],
				},
				errorMessage: "Empty paths",
			},

			{
				name: "not all paths are absolute",
				options: {
					paths: ["C:\\source1", "..\\source2\\"],
				},
				errorMessage: "All path should be absolute",
			},

			{
				name: "not all file paths for package entries are absolute",
				options: {
					paths: ["C:/source"],
					extraPackageEntryFilePaths: ["C:/source/main.ts", "../../entry.js"],
				},
				errorMessage: "All paths for package entries should be absolute",
			},
		])("$name", async ({ options, errorMessage }) => {
			await expect(async () => {
				const itDepends = new ItDepends(options);
				await itDepends.run();
			}).rejects.toThrow(new AppError(errorMessage));
		});
	});

	beforeEach(() => {
		vol.reset();
	});

	it("common case", async () => {
		vol.fromJSON({
			"C:/source/file.ts": `export const foo = "foo";`,
			"C:/source/main.ts": `
				import { foo } from "./file";
				export default function() {};
			`,
			"C:/source/main.css": `* { margin: 0 }`,
			"C:/source/tmp/file.ts": `export const bar = "bar";`,
		});

		const fn = jest.fn();

		const itDepends = new ItDepends({
			paths: ["C:/source"],
			extraPackageEntryFilePaths: ["C:/source/main.ts"],
			pathFilter: (filePath) => !filePath.startsWith("C:/source/tmp"),
		});

		itDepends.on("file-processed", fn);

		const { packagesRegistry, modulesRegistry, summary } = await itDepends.run();

		expect(packagesRegistry.toList()).toEqual([
			createPackage({
				path: "C:/source",
				entryPoint: "C:/source/main.ts",
				modules: ["C:/source/file.ts", "C:/source/main.ts"],
			}),
		]);

		expect(modulesRegistry.toList()).toEqual([
			createModule({
				path: "C:/source/file.ts",
				exports: {
					foo: ["C:/source/main.ts"],
				},
			}),
			createModule({
				path: "C:/source/main.ts",
				exports: {
					default: [],
				},
				imports: [
					{
						importSource: { filePath: "C:/source/file.ts", importPath: "./file" },
						values: ["foo"],
					},
				],
			}),
		]);

		expect(summary).toEqual(
			createSummary({
				modulesCounter: {
					typescript: 2,
					javascript: 0,
				},
				packagesCount: 1,
				possiblyUnusedExportValues: {
					"C:/source/main.ts": ["default"],
				},
			}),
		);

		expect(fn).toHaveBeenCalledTimes(2);
	});
});
