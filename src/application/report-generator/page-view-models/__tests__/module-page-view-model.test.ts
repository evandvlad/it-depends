import { describe, expect, it } from "@jest/globals";
import { createDomain, createProcessParams, createProgramFileEntry } from "~/__test-utils__/components-factories";
import { PathInformer } from "../../path-informer";
import { ModulePageViewModel } from "../module-page-view-model";

function createSutComponents() {
	const domain = createDomain();

	const output = domain.process(
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
		output,
		path: "/src/lib/a/index.ts",
		version: "999",
		pathInformer: new PathInformer({ rootPath: "/report", fs: output.fs }),
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

		expect(pageViewModel.name).toEqual("index.ts");
		expect(pageViewModel.shortPath).toEqual("src/lib/a/index.ts");
		expect(pageViewModel.language).toEqual("typescript");
		expect(pageViewModel.code).toEqual(
			`export { f } from "foo"; export * from "bar"; export { b } from "./b/c"; export const a = "aaa";`,
		);
		expect(pageViewModel.packageLinkData).toEqual({
			content: "a",
			title: "src/lib/a",
			url: "/report/content/packages/src/lib/a.html",
		});
		expect(pageViewModel.unparsedDynamicImports).toEqual(0);
		expect(pageViewModel.shadowedExportValues).toEqual([]);
	});

	it("should collect imports correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.imports).toEqual([
			{
				linkData: { url: "/report/content/modules/src/lib/a/b/c.ts.html", content: "src/lib/a/b/c.ts" },
				name: "./b/c",
				values: ["b"],
			},
			{ linkData: null, name: "foo", values: ["f"] },
		]);
	});

	it("should collect exports by values correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.exportsByValues).toEqual([
			{ linksData: [{ url: "/report/content/modules/src/index.ts.html", content: "src/index.ts" }], value: "a" },
			{ linksData: [], value: "b" },
			{ linksData: [], value: "f" },
		]);
	});

	it("should collect exports by modules correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.exportsByModules).toEqual([
			{ linkData: { url: "/report/content/modules/src/index.ts.html", content: "src/index.ts" }, values: ["a"] },
		]);
	});

	it("should collect incorrect imports correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.incorrectImports).toEqual([
			{ url: "/report/content/modules/src/lib/a/b/c.ts.html", content: "./b/c" },
		]);
	});

	it("should collect unresolved full imports correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.unresolvedFullImports).toEqual(["bar"]);
	});

	it("should collect unresolved full exports correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.unresolvedFullExports).toEqual(["bar"]);
	});

	it("should collect out of scope imports correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.outOfScopeImports).toEqual(["foo"]);
	});
});
