import { describe, expect, it } from "@jest/globals";
import { processFileItems } from "~/__test-utils__/entity-factories";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { PathInformer } from "../../path-informer";
import { ModulePageViewModel } from "../module-page-view-model";

async function createPageViewModelParams() {
	const rootPath = "/report" as AbsoluteFsPath;
	const modulePath = "/src/lib/a/index.ts" as AbsoluteFsPath;

	const { modulesCollection, fsNavCursor, summary } = await processFileItems([
		{
			path: "/src/index.ts",
			content: `import { a } from "./lib/a";`,
		},
		{
			path: modulePath,
			content: `export { f } from "foo"; export * from "bar"; export { b } from "./b/c"; export const a = "aaa";`,
		},
		{
			path: "/src/lib/a/b/index.ts",
			content: "export const b = 1;",
		},
		{
			path: "/src/lib/a/b/c.ts",
			content: "export const b = 2;",
		},
	]);

	return {
		path: modulePath,
		version: "999",
		modulesCollection,
		fsNavCursor,
		summary,
		pathInformer: new PathInformer({ rootPath, fsNavCursor }),
	};
}

describe("module-page-view-model", () => {
	it("should get layout properties correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new ModulePageViewModel(params);

		expect(pageViewModel.version).toEqual(params.version);
		expect(pageViewModel.assetsPath).toEqual("/report/assets");
		expect(pageViewModel.indexHtmlPagePath).toEqual("/report/content/index.html");
	});

	it("should get base module properties correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new ModulePageViewModel(params);

		expect(pageViewModel.fullPath).toEqual("/src/lib/a/index.ts");
		expect(pageViewModel.shortPath).toEqual("src/lib/a/index.ts");
		expect(pageViewModel.language).toEqual("typescript");
		expect(pageViewModel.code).toEqual(
			`export { f } from "foo"; export * from "bar"; export { b } from "./b/c"; export const a = "aaa";`,
		);
		expect(pageViewModel.numOfImports).toEqual(2);
		expect(pageViewModel.numOfExports).toEqual(1);
		expect(pageViewModel.packageLinkData).toEqual({
			content: "src/lib/a",
			url: "/report/content/packages/src/lib/a.html",
		});
		expect(pageViewModel.unparsedDynamicImports).toEqual(0);
		expect(pageViewModel.unresolvedFullImports).toEqual(["bar"]);
		expect(pageViewModel.unresolvedFullExports).toEqual(["bar"]);
		expect(pageViewModel.shadowedExportValues).toEqual([]);
		expect(pageViewModel.outOfScopeImports).toEqual(["foo"]);
	});

	it("should collect import items correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new ModulePageViewModel(params);

		const importItems = pageViewModel.collectImportItems((params) => params);

		expect(importItems).toEqual([
			{ linkData: null, name: "foo", values: ["f"] },
			{
				linkData: { url: "/report/content/modules/src/lib/a/b/c.ts.html", content: "src/lib/a/b/c.ts" },
				name: "./b/c",
				values: ["b"],
			},
		]);
	});

	it("should collect export items by values correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new ModulePageViewModel(params);

		const exportItems = pageViewModel.collectExportItemsByValues((params) => params);

		expect(exportItems).toEqual([
			{ linksData: [], value: "f" },
			{ linksData: [], value: "b" },
			{ linksData: [{ url: "/report/content/modules/src/index.ts.html", content: "src/index.ts" }], value: "a" },
		]);
	});

	it("should collect export items by modules correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new ModulePageViewModel(params);

		const exportItems = pageViewModel.collectExportItemsByModules((params) => params);

		expect(exportItems).toEqual([
			{ linkData: { url: "/report/content/modules/src/index.ts.html", content: "src/index.ts" }, values: ["a"] },
		]);
	});

	it("should collect incorrect imports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new ModulePageViewModel(params);

		const incorrectImports = pageViewModel.collectIncorrectImportItems((params) => params);

		expect(incorrectImports).toEqual([{ url: "/report/content/modules/src/lib/a/b/c.ts.html", content: "./b/c" }]);
	});
});
