import { describe, expect, it, jest } from "@jest/globals";
import { createDomain, createProcessParams, createProgramFileEntry } from "~/__test-utils__/components-factories";
import { Rec } from "~/lib/rec";
import { generateReport } from "..";

function createSutComponents() {
	const domain = createDomain();

	const output = domain.process(
		createProcessParams({
			entries: [
				createProgramFileEntry({
					path: "/src/main.ts",
					content: `import { a } from "./lib/a";`,
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
					content: "export const b = 1;",
					ieItems: [{ type: "standard-export", values: ["b"] }],
				}),
				createProgramFileEntry({
					path: "/src/lib/a/b/c.ts",
					content: "export const b = 2;",
					ieItems: [{ type: "standard-export", values: ["b"] }],
				}),
			],
			processorErrors: Rec.fromObject({ "/src/lib/a/b/d.ts": new Error("Some error") }),
		}),
	);

	const params = {
		settings: {
			version: "777",
			path: "/report",
			staticAssetsPath: "/assets",
		},
		dispatcherPort: {
			dispatch: jest.fn(),
		},
		fSysPort: {
			removeDir: jest.fn(() => Promise.resolve()),
			makeDir: jest.fn(() => Promise.resolve()),
			copy: jest.fn(() => Promise.resolve()),
			writeFile: jest.fn<(path: string, html: string) => Promise<void>>(() => Promise.resolve()),
		},
		output,
	};

	const instance = () => generateReport(params);

	return { params, instance };
}

describe("report-generator", () => {
	it("should write correct number of html files", async () => {
		const { params, instance } = createSutComponents();

		await instance();

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
		const { params, instance } = createSutComponents();

		await instance();

		expect(params.dispatcherPort.dispatch).toHaveBeenNthCalledWith(1, "report-generation:started");
		expect(params.dispatcherPort.dispatch).toHaveBeenNthCalledWith(2, "report-generation:finished", {
			path: "/report/content/index.html",
		});
	});
});
