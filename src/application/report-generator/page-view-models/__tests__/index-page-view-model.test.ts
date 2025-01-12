import { describe, expect, it } from "@jest/globals";
import { processFileItems } from "~/__test-utils__/entity-factories";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { PathInformer } from "../../path-informer";
import { IndexPageViewModel } from "../index-page-view-model";

async function createPageViewModelParams() {
	const { modulesCollection, packagesCollection, fsNavCursor, summary } = await processFileItems([
		{
			path: "/src/main.ts",
			content: `import { a } from "./lib/a/a";`,
		},
		{
			path: "/src/lib/a/index.ts",
			content: `
				export { f } from "blabla";
				export * from "./a";
				export const a = "aaa";
			`,
		},
		{
			path: "/src/lib/a/a.js",
			content: `
				const a = "a";
				const t = await import("/module/" + a);
				export { a };
			`,
		},
		{
			path: "/src/lib/a/b.js",
			content: "Parser error should be",
		},
		{
			path: "/src/lib/a/c.js",
			content: `
				export * from "nowhere";
			`,
		},
	]);

	return {
		version: "999",
		modulesCollection,
		packagesCollection,
		fsNavCursor,
		summary,
		pathInformer: new PathInformer({ rootPath: "/report" as AbsoluteFsPath, fsNavCursor }),
	};
}

describe("index-page-view-model", () => {
	it("should get layout properties correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		expect(pageViewModel.version).toEqual(params.version);
		expect(pageViewModel.assetsPath).toEqual("/report/assets");
		expect(pageViewModel.indexHtmlPagePath).toEqual("/report/content/index.html");
	});

	it("should get counters correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		expect(pageViewModel.numOfModules).toEqual(4);
		expect(pageViewModel.numOfPackages).toEqual(1);
		expect(pageViewModel.numOfIncorrectImports).toEqual(1);
		expect(pageViewModel.numOfPossiblyUnusedExports).toEqual(2);
		expect(pageViewModel.numOfOutOfScopeImports).toEqual(1);
		expect(pageViewModel.numOfShadowedExportValues).toEqual(1);
		expect(pageViewModel.numOfUnparsedDynamicImports).toEqual(1);
		expect(pageViewModel.numOfUnresolvedFullIE).toEqual(2);
	});

	it("should get lang counters correclty", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		expect(pageViewModel.langCountList).toEqual([
			{ label: "typescript", value: "2" },
			{ label: "javascript", value: "2" },
		]);
	});

	it("should collect modules list correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

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

	it("should collect modules tree correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

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

	it("should collect packages list correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const packagesList = pageViewModel.collectPackagesList((item) => item);

		expect(packagesList).toEqual([
			{
				content: "src/lib/a",
				url: "/report/content/packages/src/lib/a.html",
			},
		]);
	});

	it("should collect packages tree correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

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

	it("should collect parser errors correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const parserErrors = pageViewModel.collectParserErrors((item) => item);

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

	it("should collect incorrect imports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

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

	it("should collect possibly unused exports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const possiblyUnusedExports = pageViewModel.collectPossiblyUnusedExports((item) => item);

		expect(possiblyUnusedExports).toEqual([
			{
				linkData: { content: "src/lib/a/index.ts", url: "/report/content/modules/src/lib/a/index.ts.html" },
				values: ["f", "a"],
				isFullyUnused: true,
			},
		]);
	});

	it("should collect out of scope imports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const outOfScopeImports = pageViewModel.collectOutOfScopeImports((item) => item);

		expect(outOfScopeImports).toEqual([
			{
				linkData: { content: "src/lib/a/index.ts", url: "/report/content/modules/src/lib/a/index.ts.html" },
				values: ["blabla"],
			},
		]);
	});

	it("should collect empty exports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const emptyExports = pageViewModel.collectEmptyExports((item) => item);

		expect(emptyExports).toEqual([
			{
				content: "src/main.ts",
				url: "/report/content/modules/src/main.ts.html",
			},
		]);
	});

	it("should collect unparsed dynamic imports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const unparsedDynamicImports = pageViewModel.collectUnparsedDynamicImports((item) => item);

		expect(unparsedDynamicImports).toEqual([
			{
				linkData: { content: "src/lib/a/a.js", url: "/report/content/modules/src/lib/a/a.js.html" },
				num: 1,
			},
		]);
	});

	it("should collect unresolved full imports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const unresolvedFullImports = pageViewModel.collectUnresolvedFullImports((item) => item);

		expect(unresolvedFullImports).toEqual([
			{ linkData: { content: "src/lib/a/c.js", url: "/report/content/modules/src/lib/a/c.js.html" }, num: 1 },
		]);
	});

	it("should collect unresolved full exports correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const unresolvedFullExports = pageViewModel.collectUnresolvedFullExports((item) => item);

		expect(unresolvedFullExports).toEqual([
			{ linkData: { content: "src/lib/a/c.js", url: "/report/content/modules/src/lib/a/c.js.html" }, num: 1 },
		]);
	});

	it("should collect shadowed exports values correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new IndexPageViewModel(params);

		const shadowedExportValues = pageViewModel.collectShadowedExportValues((item) => item);

		expect(shadowedExportValues).toEqual([
			{
				linkData: { content: "src/lib/a/index.ts", url: "/report/content/modules/src/lib/a/index.ts.html" },
				num: 1,
			},
		]);
	});
});
