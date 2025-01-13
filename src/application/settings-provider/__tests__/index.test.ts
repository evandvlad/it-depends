import { describe, expect, it } from "@jest/globals";
import { AppError } from "~/lib/errors";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import { createSettings } from "..";

const conf = { version: "999", reportStaticAssetsPath: "/assets" as AbsoluteFsPath };

const confLoaderPort = {
	load() {
		return Promise.resolve(conf);
	},
};

describe("settings-provider", () => {
	it("should be error if pathes are empty", async () => {
		await expect(
			createSettings({
				options: { paths: [] },
				confLoaderPort,
			}),
		).rejects.toThrow(new AppError("Empty paths"));
	});

	it("should be error if not all paths are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src", "../dir"] },
				confLoaderPort,
			}),
		).rejects.toThrow(new AppError("All paths should be absolute"));
	});

	it("should be error if not all paths in aliases are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src", "/src/dir"], aliases: { "@root": "/src", "@components": "./dir" } },
				confLoaderPort,
			}),
		).rejects.toThrow(new AppError("All paths for aliases should be absolute"));
	});

	it("should be error if not all some extra package entry paths are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src"], extraPackageEntries: { filePaths: ["/dir1", "./dir2"] } },
				confLoaderPort,
			}),
		).rejects.toThrow(new AppError("All paths for package entries should be absolute"));
	});

	it("should be error if report path isn't absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src"], report: { path: "../report" } },
				confLoaderPort,
			}),
		).rejects.toThrow(new AppError("Path for report should be absolute"));
	});

	it("should be normalized all paths", async () => {
		const settings = await createSettings({
			options: {
				paths: ["/src/dir1", "/src\\dir2"],
				aliases: { "@1": "/src\\dir1", "@2": "/src/dir2" },
				extraPackageEntries: { filePaths: ["/src\\dir3//index.ts"] },
				report: { path: "/report" },
			},
			confLoaderPort,
		});

		expect(settings.paths).toEqual(["/src/dir1", "/src/dir2"]);

		expect(settings.aliases.toEntries()).toEqual([
			["@1", "/src/dir1"],
			["@2", "/src/dir2"],
		]);

		expect(settings.extraPackageEntries.filePaths).toEqual(["/src/dir3/index.ts"]);
		expect(settings.report?.path).toEqual("/report");
	});

	it("should provide correct settings with default values", async () => {
		const settings = await createSettings({
			options: { paths: ["/src"] },
			confLoaderPort,
		});

		expect(settings).toEqual({
			paths: ["/src"],
			pathFilter: expect.any(Function),
			aliases: new Rec(),
			extraPackageEntries: { fileNames: [], filePaths: [] },
			report: null,
		});
	});

	it("should provide correct settings", async () => {
		const options = {
			paths: ["/src"],
			pathFilter() {
				return true;
			},
			aliases: {
				"@": "/src",
			},
			extraPackageEntries: { fileNames: ["entry.index"], filePaths: ["/src/main.js"] },
			report: { path: "/report" },
		};

		const settings = await createSettings({
			options,
			confLoaderPort,
		});

		expect(settings).toEqual({
			paths: ["/src"],
			pathFilter: options.pathFilter,
			aliases: Rec.fromObject({ "@": "/src" }),
			extraPackageEntries: options.extraPackageEntries,
			report: {
				version: conf.version,
				path: options.report.path,
				staticAssetsPath: conf.reportStaticAssetsPath,
			},
		});
	});
});
