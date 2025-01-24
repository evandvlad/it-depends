import { describe, expect, it } from "@jest/globals";
import { createDomain, createProcessParams, createProgramFileEntry } from "~/__test-utils__/components-factories";
import { PathInformer } from "../../path-informer";
import { ModulePageViewModel } from "../module-page-view-model";

function createSutComponents() {
	const domain = createDomain();

	const { modulesCollection, fSTree, summary } = domain.process(
		createProcessParams({
			entries: [
				createProgramFileEntry({
					path: "/src/index.ts",
					ieItems: [{ type: "standard-import", source: "./lib/a", values: ["a"] }],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/index.ts",
					content: `export { f } from "foo"; export * from "bar"; export { b } from "./b/c"; export const a = "aaa";`,
					ieItems: [
						{ type: "re-export", source: "foo", inputValues: ["f"], outputValues: ["f"] },
						{ type: "re-export", source: "bar", inputValues: ["*"], outputValues: ["*"] },
						{ type: "re-export", source: "./b/c", inputValues: ["b"], outputValues: ["b"] },
						{ type: "standard-export", values: ["a"] },
					],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/b/index.ts",
					ieItems: [{ type: "standard-export", values: ["b"] }],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/b/c.ts",
					ieItems: [{ type: "standard-export", values: ["b"] }],
				}),
			],
		}),
	);

	return new ModulePageViewModel({
		fSTree,
		path: "/src/lib/a/index.ts",
		version: "999",
		modulesCollection,
		summary,
		pathInformer: new PathInformer({ rootPath: "/report", fSTree }),
	});
}

describe("module-page-view-model", () => {
	it("should get layout properties correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.version).toEqual("999");
		expect(pageViewModel.layoutParams).toEqual({
			indexHtmlPagePath: "/report/content/index.html",
			externalStylePaths: ["/report/assets/index.css"],
			externalScriptPaths: ["/report/assets/index.js"],
		});
	});

	it("should get base module properties correctly", () => {
		const pageViewModel = createSutComponents();

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
		expect(pageViewModel.shadowedExportValues).toEqual([]);
	});

	it("should collect import items correctly", () => {
		const pageViewModel = createSutComponents();
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

	it("should collect export items by values correctly", () => {
		const pageViewModel = createSutComponents();
		const exportItems = pageViewModel.collectExportItemsByValues((params) => params);

		expect(exportItems).toEqual([
			{ linksData: [{ url: "/report/content/modules/src/index.ts.html", content: "src/index.ts" }], value: "a" },
			{ linksData: [], value: "f" },
			{ linksData: [], value: "b" },
		]);
	});

	it("should collect export items by modules correctly", () => {
		const pageViewModel = createSutComponents();
		const exportItems = pageViewModel.collectExportItemsByModules((params) => params);

		expect(exportItems).toEqual([
			{ linkData: { url: "/report/content/modules/src/index.ts.html", content: "src/index.ts" }, values: ["a"] },
		]);
	});

	it("should collect incorrect imports correctly", () => {
		const pageViewModel = createSutComponents();
		const incorrectImports = pageViewModel.collectIncorrectImportItems((params) => params);

		expect(incorrectImports).toEqual([{ url: "/report/content/modules/src/lib/a/b/c.ts.html", content: "./b/c" }]);
	});

	it("should collect unresolved full imports correctly", () => {
		const pageViewModel = createSutComponents();
		const unresolvedFullImports = pageViewModel.collectUnresolvedFullImports((params) => params);

		expect(unresolvedFullImports).toEqual(["bar"]);
	});

	it("should collect unresolved full exports correctly", () => {
		const pageViewModel = createSutComponents();
		const unresolvedFullExports = pageViewModel.collectUnresolvedFullExports((params) => params);

		expect(unresolvedFullExports).toEqual(["bar"]);
	});

	it("should collect out of scope imports correctly", () => {
		const pageViewModel = createSutComponents();
		const outOfScopeImports = pageViewModel.collectOutOfScopeImports((params) => params);

		expect(outOfScopeImports).toEqual(["foo"]);
	});
});
