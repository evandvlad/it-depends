import { describe, expect, it, jest } from "@jest/globals";
import { AppError } from "~/lib/errors";
import { Rec } from "~/lib/rec";
import { createSettings } from "..";

const conf = { version: "999", reportStaticAssetsPath: "/assets" };

function createSutDependencies() {
	return {
		confLoaderPort: {
			load() {
				return Promise.resolve(conf);
			},
		},
		fSysPort: {
			isAbsolutePath: jest.fn((path: string) => path.startsWith("/")),
			checkAccess: jest.fn((_p: string) => Promise.resolve(true)),
		},
		dispatcherPort: {
			dispatch: jest.fn(),
		},
	};
}

describe("settings-provider", () => {
	it("should be error if pathes are empty", async () => {
		await expect(
			createSettings({
				options: { paths: [] },
				...createSutDependencies(),
			}),
		).rejects.toThrow(new AppError("Option 'paths' should be an array fulfilled with real absolute paths."));
	});

	it("should be error if not all paths are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src", "../dir"] },
				...createSutDependencies(),
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'paths' should be an array fulfilled with real absolute paths. Path '../dir' is not absolute.",
			),
		);
	});

	it("should be error if not all paths are accessible", async () => {
		const deps = createSutDependencies();

		deps.fSysPort.checkAccess.mockImplementation(async (path) => path === "/src");

		await expect(
			createSettings({
				options: { paths: ["/src", "/src2"] },
				...deps,
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'paths' should be an array fulfilled with real absolute paths. Path '/src2' doesn't exist or is not accessible.",
			),
		);
	});

	it("should be error if not all paths in aliases are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src", "/src/dir"], aliases: { "@root": "/src", "@components": "./dir" } },
				...createSutDependencies(),
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'aliases' should be a record of names and real absolute paths. Path './dir' for name '@components' is not absolute.",
			),
		);
	});

	it("should be error if not all paths in aliases are accessible", async () => {
		const deps = createSutDependencies();
		deps.fSysPort.checkAccess.mockImplementation(async (path) => path !== "/src/dir1");

		await expect(
			createSettings({
				options: { paths: ["/src"], aliases: { "@root": "/src/dir1", "@components": "/src/dir2" } },
				...deps,
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'aliases' should be a record of names and real absolute paths. Path '/src/dir1' for '@root' doesn't exist or is not accessible.",
			),
		);
	});

	it("should be error if not all some extra package entry paths are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src"], extraPackageEntries: { filePaths: ["/dir1", "./dir2"] } },
				...createSutDependencies(),
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'extraPackageEntries.filePaths' should be an array fulfilled with real absolute paths Path './dir2' is not absolute.",
			),
		);
	});

	it("should be error if not all some extra package entry paths are accessible", async () => {
		const deps = createSutDependencies();

		deps.fSysPort.checkAccess.mockImplementation(async (path) => path !== "/dir1");

		await expect(
			createSettings({
				options: { paths: ["/src"], extraPackageEntries: { filePaths: ["/dir1", "/dir2"] } },
				...deps,
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'extraPackageEntries.filePaths' should be an array fulfilled with real absolute paths Path '/dir1' doesn't exist or is not accessible.",
			),
		);
	});

	it("should be error if report path isn't absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src"], report: { path: "../report" } },
				...createSutDependencies(),
			}),
		).rejects.toThrow(
			new AppError("Option 'report.path' should be a real absolute path. Path '../report' is not absolute."),
		);
	});

	it("should be error if report path isn't accessible", async () => {
		const deps = createSutDependencies();

		deps.fSysPort.checkAccess.mockImplementation(async (path) => path !== "/report");

		await expect(
			createSettings({
				options: { paths: ["/src"], report: { path: "/report" } },
				...deps,
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'report.path' should be a real absolute path. Path '/report' doesn't exist or is not accessible.",
			),
		);
	});

	it("should be normalized all paths", async () => {
		const settings = await createSettings({
			options: {
				paths: ["/src/dir1", "/src\\dir2"],
				aliases: { "@1": "/src\\dir1", "@2": "/src/dir2" },
				extraPackageEntries: { filePaths: ["/src\\dir3//index.ts"] },
				report: { path: "/report" },
			},
			...createSutDependencies(),
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
			...createSutDependencies(),
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
			...createSutDependencies(),
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

	it("should dispatch events correctly", async () => {
		const deps = createSutDependencies();

		await createSettings({
			options: { paths: ["/src"] },
			...deps,
		});

		expect(deps.dispatcherPort.dispatch).toHaveBeenNthCalledWith(1, "settings-preparation:started");
		expect(deps.dispatcherPort.dispatch).toHaveBeenNthCalledWith(2, "settings-preparation:finished");
	});
});
