import { describe, expect, it } from "@jest/globals";
import { processFileItems } from "~/__test-utils__/entity-factories";
import { PathInformer } from "../../path-informer";
import { PackagePageViewModel } from "../package-page-view-model";

async function createPageViewModelParams() {
	const rootPath = "/report";

	const { packagesCollection, fSTree } = await processFileItems([
		{
			path: "/src/index.ts",
			content: `import { a } from "./lib/a";`,
		},
		{
			path: "/src/lib/a/index.ts",
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
		fSTree,
		path: "/src/lib/a",
		version: "999",
		packagesCollection,
		pathInformer: new PathInformer({ rootPath, fSTree }),
	};
}

describe("package-page-view-model", () => {
	it("should get layout properties correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new PackagePageViewModel(params);

		expect(pageViewModel.version).toEqual(params.version);
		expect(pageViewModel.layoutParams).toEqual({
			indexHtmlPagePath: "/report/content/index.html",
			externalStylePaths: ["/report/assets/index.css"],
			externalScriptPaths: ["/report/assets/index.js"],
		});
	});

	it("should get base package properties correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new PackagePageViewModel(params);

		expect(pageViewModel.fullPath).toEqual("/src/lib/a");
		expect(pageViewModel.shortPath).toEqual("src/lib/a");
		expect(pageViewModel.entryPointLinkData).toEqual({
			url: "/report/content/modules/src/lib/a/index.ts.html",
			content: "src/lib/a/index.ts",
		});
		expect(pageViewModel.parentPackageLinkData).toEqual({
			url: "/report/content/packages/src.html",
			content: "src",
		});
	});

	it("should collect module links correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new PackagePageViewModel(params);

		const moduleLinks = pageViewModel.collectModuleLinks((params) => params);

		expect(moduleLinks).toEqual([
			{ url: "/report/content/modules/src/lib/a/index.ts.html", content: "src/lib/a/index.ts" },
		]);
	});

	it("should collect child package links correctly", async () => {
		const params = await createPageViewModelParams();
		const pageViewModel = new PackagePageViewModel(params);

		const moduleLinks = pageViewModel.collectChildPackageLinks((params) => params);

		expect(moduleLinks).toEqual([{ url: "/report/content/packages/src/lib/a/b.html", content: "src/lib/a/b" }]);
	});
});
