import { describe, expect, it, jest } from "@jest/globals";
import { AppError } from "~/lib/errors";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import { writeReport } from "../report-writer";

const rootPath = "/report" as AbsoluteFsPath;
const assetsPath = "/report/assets" as AbsoluteFsPath;
const staticAssetsPath = "/assets" as AbsoluteFsPath;

const htmlPages = Rec.fromObject({
	"/report/content/f1.html": "f1",
	"/report/content/f2.html": "f2",
	"/report/content/f3.html": "f3",
}) as unknown as Rec<AbsoluteFsPath, string>;

function createFSysPort() {
	return {
		removeDir: jest.fn(() => Promise.resolve()),
		makeDir: jest.fn(() => Promise.resolve()),
		copy: jest.fn(() => Promise.resolve()),
		writeFile: jest.fn(() => Promise.resolve()),
	};
}

describe("report-writer", () => {
	it("should try to remove dir if it exists before creating", async () => {
		let isRemoved = false;
		const fSysPort = createFSysPort();

		fSysPort.removeDir.mockImplementationOnce(() => {
			isRemoved = true;
			return Promise.resolve();
		});

		fSysPort.makeDir.mockImplementationOnce(() => {
			return isRemoved ? Promise.resolve() : Promise.reject("Oops, dir wasn't removed");
		});

		await writeReport({ rootPath, assetsPath, staticAssetsPath, htmlPages, fSysPort });

		expect(fSysPort.removeDir).toHaveBeenCalledWith(rootPath);
		expect(fSysPort.makeDir).toHaveBeenCalledWith(rootPath);
	});

	it("should be error if root dir isn't ready", async () => {
		const fSysPort = createFSysPort();

		fSysPort.makeDir.mockImplementationOnce(() => {
			return Promise.reject("Error");
		});

		await expect(writeReport({ rootPath, assetsPath, staticAssetsPath, htmlPages, fSysPort })).rejects.toThrow(
			new AppError(`Can't create the directory '${rootPath}' for the report.`),
		);
	});

	it("should make report writing correctly", async () => {
		const events: string[] = [];
		const fSysPort = createFSysPort();

		fSysPort.removeDir.mockImplementationOnce(() => {
			events.push("dir was removed");
			return Promise.resolve();
		});

		fSysPort.makeDir.mockImplementationOnce(() => {
			events.push("dir was created");
			return Promise.resolve();
		});

		fSysPort.copy.mockImplementationOnce(() => {
			events.push("dir was copied");
			return Promise.resolve();
		});

		fSysPort.writeFile.mockImplementation(() => {
			events.push("file was written");
			return Promise.resolve();
		});

		await writeReport({ rootPath, assetsPath, staticAssetsPath, htmlPages, fSysPort });

		expect(events).toEqual([
			"dir was removed",
			"dir was created",
			"dir was copied",
			"file was written",
			"file was written",
			"file was written",
		]);
	});
});
