import { describe, expect, it } from "@jest/globals";
import { createDomain, createProcessParams, createProgramFileEntry } from "~/__test-utils__/components-factories";
import { PathInformer } from "../../path-informer";
import { PackagePageViewModel } from "../package-page-view-model";

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

	return new PackagePageViewModel({
		output,
		path: "/src/lib/a",
		version: "999",
		pathInformer: new PathInformer({ rootPath: "/report", fs: output.fs }),
	});
}

describe("package-page-view-model", () => {
	it("should get layout properties correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.version).toEqual("999");
		expect(pageViewModel.layoutParams).toEqual({
			indexHtmlPagePath: "/report/content/index.html",
			externalStylePaths: ["/report/assets/index.css"],
			externalScriptPaths: ["/report/assets/index.js"],
		});
	});

	it("should get base package properties correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.name).toEqual("a");
		expect(pageViewModel.shortPath).toEqual("src/lib/a");
		expect(pageViewModel.entryPointLinkData).toEqual({
			url: "/report/content/modules/src/lib/a/index.ts.html",
			content: "index.ts",
			title: "src/lib/a/index.ts",
		});
		expect(pageViewModel.parentPackageLinkData).toEqual({
			url: "/report/content/packages/src.html",
			content: "src",
			title: "src",
		});
	});

	it("should collect module links correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.moduleLinks).toEqual([
			{ url: "/report/content/modules/src/lib/a/index.ts.html", content: "src/lib/a/index.ts" },
		]);
	});

	it("should collect child package links correctly", () => {
		const pageViewModel = createSutComponents();

		expect(pageViewModel.childPackageLinks).toEqual([
			{ url: "/report/content/packages/src/lib/a/b.html", content: "src/lib/a/b" },
		]);
	});
});
