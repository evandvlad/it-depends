import { describe, expect, it, jest } from "@jest/globals";
import { PathInformer } from "../path-informer";

const rootPath = "/report";

function createFS(impl = () => "") {
	return {
		getShortPath: jest.fn(impl),
	};
}

describe("path-informer", () => {
	it("should get root path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fs: createFS() });
		expect(pathInformer.rootPath).toEqual("/report");
	});

	it("should get assets path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fs: createFS() });
		expect(pathInformer.assetsPath).toEqual("/report/assets");
	});

	it("should get index html page path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fs: createFS() });
		expect(pathInformer.indexHtmlPagePath).toEqual("/report/content/index.html");
	});

	it("should get module html page path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fs: createFS(() => "src/lib/lib.ts") });

		expect(pathInformer.getModuleHtmlPagePathByRealPath("/user/someone/project/src/lib/lib.ts")).toEqual(
			"/report/content/modules/src/lib/lib.ts.html",
		);
	});

	it("should get package html page path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fs: createFS(() => "src/lib") });

		expect(pathInformer.getPackageHtmlPagePathByRealPath("/user/someone/project/src/lib")).toEqual(
			"/report/content/packages/src/lib.html",
		);
	});
});
