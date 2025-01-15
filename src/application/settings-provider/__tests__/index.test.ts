import { describe, expect, it, jest } from "@jest/globals";
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

function createFSysPort() {
	return {
		checkAccess: jest.fn((_p: string) => Promise.resolve(true)),
	};
}

function createDispatcherPort() {
	return {
		dispatch: jest.fn(),
	};
}

describe("settings-provider", () => {
	it("should be error if pathes are empty", async () => {
		await expect(
			createSettings({
				options: { paths: [] },
				confLoaderPort,
				fSysPort: createFSysPort(),
				dispatcherPort: createDispatcherPort(),
			}),
		).rejects.toThrow(new AppError("Option 'paths' should be an array fulfilled with real absolute paths."));
	});

	it("should be error if not all paths are absolute", async () => {
		await expect(
			createSettings({
				options: { paths: ["/src", "../dir"] },
				confLoaderPort,
				fSysPort: createFSysPort(),
				dispatcherPort: createDispatcherPort(),
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'paths' should be an array fulfilled with real absolute paths. Path '../dir' is not absolute.",
			),
		);
	});

	it("should be error if not all paths are accessible", async () => {
		const fSysPort = createFSysPort();

		fSysPort.checkAccess.mockImplementation(async (path) => path === "/src");

		await expect(
			createSettings({
				options: { paths: ["/src", "/src2"] },
				confLoaderPort,
				fSysPort,
				dispatcherPort: createDispatcherPort(),
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
				confLoaderPort,
				fSysPort: createFSysPort(),
				dispatcherPort: createDispatcherPort(),
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'aliases' should be a record of names and real absolute paths. Path './dir' for name '@components' is not absolute.",
			),
		);
	});

	it("should be error if not all paths in aliases are accessible", async () => {
		const fSysPort = createFSysPort();

		fSysPort.checkAccess.mockImplementation(async (path) => path !== "/src/dir1");

		await expect(
			createSettings({
				options: { paths: ["/src"], aliases: { "@root": "/src/dir1", "@components": "/src/dir2" } },
				confLoaderPort,
				fSysPort,
				dispatcherPort: createDispatcherPort(),
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
				confLoaderPort,
				fSysPort: createFSysPort(),
				dispatcherPort: createDispatcherPort(),
			}),
		).rejects.toThrow(
			new AppError(
				"Option 'extraPackageEntries.filePaths' should be an array fulfilled with real absolute paths Path './dir2' is not absolute.",
			),
		);
	});

	it("should be error if not all some extra package entry paths are accessible", async () => {
		const fSysPort = createFSysPort();

		fSysPort.checkAccess.mockImplementation(async (path) => path !== "/dir1");

		await expect(
			createSettings({
				options: { paths: ["/src"], extraPackageEntries: { filePaths: ["/dir1", "/dir2"] } },
				confLoaderPort,
				fSysPort,
				dispatcherPort: createDispatcherPort(),
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
				confLoaderPort,
				fSysPort: createFSysPort(),
				dispatcherPort: createDispatcherPort(),
			}),
		).rejects.toThrow(
			new AppError("Option 'report.path' should be a real absolute path. Path '../report' is not absolute."),
		);
	});

	it("should be error if report path isn't accessible", async () => {
		const fSysPort = createFSysPort();

		fSysPort.checkAccess.mockImplementation(async (path) => path !== "/report");

		await expect(
			createSettings({
				options: { paths: ["/src"], report: { path: "/report" } },
				confLoaderPort,
				fSysPort,
				dispatcherPort: createDispatcherPort(),
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
			confLoaderPort,
			fSysPort: createFSysPort(),
			dispatcherPort: createDispatcherPort(),
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
			fSysPort: createFSysPort(),
			dispatcherPort: createDispatcherPort(),
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
			fSysPort: createFSysPort(),
			dispatcherPort: createDispatcherPort(),
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
		const dispatcherPort = createDispatcherPort();

		await createSettings({
			options: { paths: ["/src"] },
			confLoaderPort,
			fSysPort: createFSysPort(),
			dispatcherPort,
		});

		expect(dispatcherPort.dispatch).toHaveBeenNthCalledWith(1, "settings-preparation:started");
		expect(dispatcherPort.dispatch).toHaveBeenNthCalledWith(2, "settings-preparation:finished");
	});
});
