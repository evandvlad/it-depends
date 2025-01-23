import { describe, expect, it, jest } from "@jest/globals";
import { AppError } from "~/lib/errors";
import { Rec } from "~/lib/rec";
import { writeReport } from "../report-writer";

function createSutComponents() {
	const params = {
		rootPath: "/report",
		assetsPath: "/report/assets",
		staticAssetsPath: "/assets",
		htmlPages: Rec.fromObject({
			"/report/content/f1.html": "f1",
			"/report/content/f2.html": "f2",
			"/report/content/f3.html": "f3",
		}) as unknown as Rec<string, string>,
		fSysPort: {
			removeDir: jest.fn(() => Promise.resolve()),
			makeDir: jest.fn(() => Promise.resolve()),
			copy: jest.fn(() => Promise.resolve()),
			writeFile: jest.fn(() => Promise.resolve()),
		},
	};

	const instance = () => writeReport(params);

	return { params, instance };
}

describe("report-writer", () => {
	it("should try to remove dir if it exists before creating", async () => {
		let isRemoved = false;
		const { params, instance } = createSutComponents();

		params.fSysPort.removeDir.mockImplementationOnce(() => {
			isRemoved = true;
			return Promise.resolve();
		});

		params.fSysPort.makeDir.mockImplementationOnce(() => {
			return isRemoved ? Promise.resolve() : Promise.reject("Oops, dir wasn't removed");
		});

		await instance();

		expect(params.fSysPort.removeDir).toHaveBeenCalledWith(params.rootPath);
		expect(params.fSysPort.makeDir).toHaveBeenCalledWith(params.rootPath);
	});

	it("should be error if root dir isn't ready", async () => {
		const { params, instance } = createSutComponents();

		params.fSysPort.makeDir.mockImplementationOnce(() => {
			return Promise.reject("Error");
		});

		await expect(instance()).rejects.toThrow(
			new AppError(`Can't create the directory '${params.rootPath}' for the report.`),
		);
	});

	it("should make report writing correctly", async () => {
		const events: string[] = [];
		const { params, instance } = createSutComponents();

		params.fSysPort.removeDir.mockImplementationOnce(() => {
			events.push("dir was removed");
			return Promise.resolve();
		});

		params.fSysPort.makeDir.mockImplementationOnce(() => {
			events.push("dir was created");
			return Promise.resolve();
		});

		params.fSysPort.copy.mockImplementationOnce(() => {
			events.push("dir was copied");
			return Promise.resolve();
		});

		params.fSysPort.writeFile.mockImplementation(() => {
			events.push("file was written");
			return Promise.resolve();
		});

		await instance();

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
