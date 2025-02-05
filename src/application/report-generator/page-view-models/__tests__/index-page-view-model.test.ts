import { describe, expect, it } from "@jest/globals";
import { createDomain, createProcessParams, createProgramFileEntry } from "~/__test-utils__/components-factories";
import { Rec } from "~/lib/rec";
import { PathInformer } from "../../path-informer";
import { IndexPageViewModel } from "../index-page-view-model";

function createSutComponents() {
	const domain = createDomain();

	const output = domain.process(
		createProcessParams({
			entries: [
				createProgramFileEntry({
					path: "/src/main.ts",
					ieItems: [{ type: "standard-import", source: "./lib/a/a", values: ["a"] }],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/index.ts",
					ieItems: [
						{ type: "re-export", source: "blabla", inputValues: ["f"], outputValues: ["f"] },
						{ type: "re-export", source: "./a", inputValues: ["*"], outputValues: ["*"] },
						{ type: "standard-export", values: ["a"] },
					],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/a.js",
					language: "javascript",
					ieItems: [
						{ type: "dynamic-import", source: null },
						{ type: "standard-export", values: ["a"] },
					],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/c.js",
					language: "javascript",
					ieItems: [{ type: "re-export", source: "nowhere", inputValues: ["*"], outputValues: ["*"] }],
				}),
			],
			processorErrors: Rec.fromObject({ "/src/lib/a/b.js": new Error("Some error") }),
		}),
	);

	return new IndexPageViewModel({
		output,
		version: "999",
		pathInformer: new PathInformer({ rootPath: "/report", fs: output.fs }),
	});
}

describe("index-page-view-model", () => {
	it("should get layout properties correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.version).toEqual("999");
		expect(pageViewModel.layoutParams).toEqual({
			indexHtmlPagePath: "/report/content/index.html",
			externalStylePaths: ["/report/assets/index.css"],
			externalScriptPaths: ["/report/assets/index.js"],
		});
	});

	it("should get counters correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.numOfModules).toEqual(4);
		expect(pageViewModel.numOfPackages).toEqual(1);
		expect(pageViewModel.numOfIncorrectImports).toEqual(1);
		expect(pageViewModel.numOfPossiblyUnusedExports).toEqual(2);
		expect(pageViewModel.numOfOutOfScopeImports).toEqual(1);
		expect(pageViewModel.numOfShadowedExportValues).toEqual(1);
		expect(pageViewModel.numOfUnparsedDynamicImports).toEqual(1);
		expect(pageViewModel.numOfUnresolvedFullIE).toEqual(2);
	});

	it("should get lang counters correclty", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.langCountList).toEqual([
			{ label: "typescript", value: "2" },
			{ label: "javascript", value: "2" },
		]);
	});

	it("should collect modules list correctly", () => {
		const pageViewModel = createSutComponents();
		const modulesList = pageViewModel.collectModulesList((item) => item);

		expect(modulesList).toEqual([
			{
				content: "src/main.ts",
				url: "/report/content/modules/src/main.ts.html",
			},
			{
				content: "src/lib/a/index.ts",
				url: "/report/content/modules/src/lib/a/index.ts.html",
			},
			{
				content: "src/lib/a/a.js",
				url: "/report/content/modules/src/lib/a/a.js.html",
			},
			{
				content: "src/lib/a/c.js",
				url: "/report/content/modules/src/lib/a/c.js.html",
			},
		]);
	});

	it("should collect modules tree correctly", () => {
		const pageViewModel = createSutComponents();
		const modulesTree = pageViewModel.collectModulesTree((item) => JSON.stringify(item));

		expect(modulesTree).toEqual([
			{
				children: [
					{
						children: [
							{
								children: [],
								content: JSON.stringify({
									name: "index.ts",
									linkData: {
										url: "/report/content/modules/src/lib/a/index.ts.html",
										content: "index.ts",
									},
								}),
								title: "src/lib/a/index.ts",
							},
							{
								children: [],
								content: JSON.stringify({
									name: "a.js",
									linkData: {
										url: "/report/content/modules/src/lib/a/a.js.html",
										content: "a.js",
									},
								}),
								title: "src/lib/a/a.js",
							},
							{
								children: [],
								content: JSON.stringify({
									name: "c.js",
									linkData: {
										url: "/report/content/modules/src/lib/a/c.js.html",
										content: "c.js",
									},
								}),
								title: "src/lib/a/c.js",
							},
						],
						content: JSON.stringify({
							name: "a",
							linkData: null,
						}),
						title: "src/lib/a",
					},
				],
				content: JSON.stringify({
					name: "lib",
					linkData: null,
				}),
				title: "src/lib",
			},
			{
				children: [],
				content: JSON.stringify({
					name: "main.ts",
					linkData: {
						url: "/report/content/modules/src/main.ts.html",
						content: "main.ts",
					},
				}),
				title: "src/main.ts",
			},
		]);
	});

	it("should collect packages list correctly", () => {
		const pageViewModel = createSutComponents();
		const packagesList = pageViewModel.collectPackagesList((item) => item);

		expect(packagesList).toEqual([
			{
				content: "src/lib/a",
				url: "/report/content/packages/src/lib/a.html",
			},
		]);
	});

	it("should collect packages tree correctly", () => {
		const pageViewModel = createSutComponents();
		const packagesTree = pageViewModel.collectPackagesTree((item) => item);

		expect(packagesTree).toEqual([
			{
				children: [],
				content: {
					linkData: {
						content: "a",
						url: "/report/content/packages/src/lib/a.html",
					},
					name: "a",
				},
				title: "src/lib/a",
			},
		]);
	});

	it("should collect processor errors correctly", () => {
		const pageViewModel = createSutComponents();
		const parserErrors = pageViewModel.collectProcessorErrors((item) => item);

		expect(parserErrors).toEqual([
			{
				error: expect.any(Error),
				linkData: {
					url: "/report/content/modules/src/lib/a/b.js.html",
					content: "src/lib/a/b.js",
				},
			},
		]);
	});

	it("should collect incorrect imports correctly", () => {
		const pageViewModel = createSutComponents();
		const incorrectImports = pageViewModel.collectIncorrectImports((item) => item);

		expect(incorrectImports).toEqual([
			{
				importItems: [
					{
						linkData: { content: "./lib/a/a", url: "/report/content/modules/src/lib/a/a.js.html" },
						name: "./lib/a/a",
					},
				],
				linkData: { content: "src/main.ts", url: "/report/content/modules/src/main.ts.html" },
			},
		]);
	});

	it("should collect possibly unused exports correctly", () => {
		const pageViewModel = createSutComponents();
		const possiblyUnusedExports = pageViewModel.collectPossiblyUnusedExports((item) => item);

		expect(possiblyUnusedExports).toEqual([
			{
				linkData: { content: "src/lib/a/index.ts", url: "/report/content/modules/src/lib/a/index.ts.html" },
				values: ["f", "a"],
				isFullyUnused: true,
			},
		]);
	});

	it("should collect out of scope imports correctly", () => {
		const pageViewModel = createSutComponents();
		const outOfScopeImports = pageViewModel.collectOutOfScopeImports((item) => item);

		expect(outOfScopeImports).toEqual([
			{
				linkData: { content: "src/lib/a/index.ts", url: "/report/content/modules/src/lib/a/index.ts.html" },
				values: ["blabla"],
			},
		]);
	});

	it("should collect empty exports correctly", () => {
		const pageViewModel = createSutComponents();
		const emptyExports = pageViewModel.collectEmptyExports((item) => item);

		expect(emptyExports).toEqual([
			{
				content: "src/main.ts",
				url: "/report/content/modules/src/main.ts.html",
			},
		]);
	});

	it("should collect unparsed dynamic imports correctly", () => {
		const pageViewModel = createSutComponents();
		const unparsedDynamicImports = pageViewModel.collectUnparsedDynamicImports((item) => item);

		expect(unparsedDynamicImports).toEqual([
			{
				linkData: { content: "src/lib/a/a.js", url: "/report/content/modules/src/lib/a/a.js.html" },
				num: 1,
			},
		]);
	});

	it("should collect unresolved full imports correctly", () => {
		const pageViewModel = createSutComponents();
		const unresolvedFullImports = pageViewModel.collectUnresolvedFullImports((item) => item);

		expect(unresolvedFullImports).toEqual([
			{ linkData: { content: "src/lib/a/c.js", url: "/report/content/modules/src/lib/a/c.js.html" }, num: 1 },
		]);
	});

	it("should collect unresolved full exports correctly", () => {
		const pageViewModel = createSutComponents();
		const unresolvedFullExports = pageViewModel.collectUnresolvedFullExports((item) => item);

		expect(unresolvedFullExports).toEqual([
			{ linkData: { content: "src/lib/a/c.js", url: "/report/content/modules/src/lib/a/c.js.html" }, num: 1 },
		]);
	});

	it("should collect shadowed exports values correctly", async () => {
		const pageViewModel = createSutComponents();
		const shadowedExportValues = pageViewModel.collectShadowedExportValues((item) => item);

		expect(shadowedExportValues).toEqual([
			{
				linkData: { content: "src/lib/a/index.ts", url: "/report/content/modules/src/lib/a/index.ts.html" },
				num: 1,
			},
		]);
	});
});
