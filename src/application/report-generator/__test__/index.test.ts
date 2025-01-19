import { describe, expect, it, jest } from "@jest/globals";
import { processFileItems } from "~/__test-utils__/entity-factories";
import { generateReport } from "..";

async function createParams() {
	const { packagesCollection, fSTree, summary, modulesCollection } = await processFileItems([
		{
			path: "/src/main.ts",
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
		{
			path: "/src/lib/a/b/d.ts",
			content: "Parse error should be",
		},
	]);

	const dispatcherPort = {
		dispatch: jest.fn(),
	};

	const fSysPort = {
		removeDir: jest.fn(() => Promise.resolve()),
		makeDir: jest.fn(() => Promise.resolve()),
		copy: jest.fn(() => Promise.resolve()),
		writeFile: jest.fn<(path: string, html: string) => Promise<void>>(() => Promise.resolve()),
	};

	return {
		settings: {
			version: "777",
			path: "/report",
			staticAssetsPath: "/assets",
		},
		dispatcherPort,
		fSysPort,
		modulesCollection,
		packagesCollection,
		fSTree,
		summary,
	};
}

describe("report-generator", () => {
	it("should write correct number of html files", async () => {
		const params = await createParams();

		await generateReport(params);

		const pages = params.fSysPort.writeFile.mock.calls.map(([path]) => path);

		expect(pages).toEqual([
			"/report/content/index.html",
			"/report/content/modules/src/main.ts.html",
			"/report/content/modules/src/lib/a/index.ts.html",
			"/report/content/modules/src/lib/a/b/index.ts.html",
			"/report/content/modules/src/lib/a/b/c.ts.html",
			"/report/content/packages/src/lib/a.html",
			"/report/content/packages/src/lib/a/b.html",
		]);
	});

	it("should dispatch events correctly", async () => {
		const params = await createParams();

		await generateReport(params);

		expect(params.dispatcherPort.dispatch).toHaveBeenNthCalledWith(1, "report-generation:started");
		expect(params.dispatcherPort.dispatch).toHaveBeenNthCalledWith(2, "report-generation:finished", {
			path: "/report/content/index.html",
		});
	});
});
