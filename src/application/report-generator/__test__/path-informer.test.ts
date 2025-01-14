import { describe, expect, it } from "@jest/globals";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { FSTree } from "~/lib/fs-tree";
import { PathInformer } from "../path-informer";

const rootPath = "/report" as AbsoluteFsPath;

const fSTree = new FSTree([
	"/user/someone/project/src/index.ts",
	"/user/someone/project/src/lib/index.ts",
	"/user/someone/project/src/lib/lib.ts",
] as AbsoluteFsPath[]);

describe("path-informer", () => {
	it("should get root path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fSTree });
		expect(pathInformer.rootPath).toEqual("/report");
	});

	it("should get assets path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fSTree });
		expect(pathInformer.assetsPath).toEqual("/report/assets");
	});

	it("should get index html page path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fSTree });
		expect(pathInformer.indexHtmlPagePath).toEqual("/report/content/index.html");
	});

	it("should get module html page path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fSTree });

		expect(
			pathInformer.getModuleHtmlPagePathByRealPath("/user/someone/project/src/lib/lib.ts" as AbsoluteFsPath),
		).toEqual("/report/content/modules/src/lib/lib.ts.html");
	});

	it("should get package html page path correctly", () => {
		const pathInformer = new PathInformer({ rootPath, fSTree });

		expect(pathInformer.getPackageHtmlPagePathByRealPath("/user/someone/project/src/lib" as AbsoluteFsPath)).toEqual(
			"/report/content/packages/src/lib.html",
		);
	});
});
