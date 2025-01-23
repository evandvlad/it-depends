import { describe, expect, it } from "@jest/globals";
import { AppError } from "~/lib/errors";
import { Rec } from "~/lib/rec";
import { ProgramFileExpert } from "..";

function createSutComponents() {
	const params = {
		settings: {
			aliases: new Rec<string, string>(),
			extraPackageEntries: { fileNames: [] as string[], filePaths: [] as string[] },
		},
	};

	const instance = new ProgramFileExpert(params);

	return { params, instance };
}

describe("program-file-expert", () => {
	describe("isAcceptableFile", () => {
		it.each([
			{ name: "should be true for *.js", path: "C:/dir/file.js", result: true },
			{ name: "should be true for *.jsx", path: "C:/dir/file.jsx", result: true },
			{ name: "should be true for *.ts", path: "C:/dir/file.ts", result: true },
			{ name: "should be true for *.tsx", path: "C:/dir/file.tsx", result: true },
			{ name: "should be true for *.d.ts", path: "C:/dir/file.d.ts", result: true },
			{ name: "should be false for *.mjs", path: "C:/dir/file.mjs", result: false },
			{ name: "should be false for *.cjs", path: "C:/dir/file.cjs", result: false },
			{ name: "should be false for *.d.mts", path: "C:/dir/file.d.mts", result: false },
			{ name: "should be false for *.d.cts", path: "C:/dir/file.d.cts", result: false },
			{ name: "should be true for *.d.js", path: "C:/dir/file.d.js", result: true },
			{ name: "should be true for *.d.jsx", path: "C:/dir/file.d.jsx", result: true },
			{ name: "should be true for *.d.tsx", path: "C:/dir/file.d.tsx", result: true },
			{ name: "should be true for *.ddd.ts", path: "C:/dir/file.ddd.ts", result: true },
			{ name: "should be false for dot file without extension", path: "C:/dir/.ignore", result: false },
			{ name: "should be false for file without extension", path: "C:/dir/file", result: false },
			{ name: "should be false for *.css", path: "C:/dir/file.css", result: false },
			{ name: "should be false for *.scss", path: "C:/dir/file.scss", result: false },
			{ name: "should be false for *.svg", path: "C:/dir/file.svg", result: false },
			{ name: "should be false for *.json", path: "C:/dir/file.json", result: false },
		])("$name", ({ path, result }) => {
			const { instance } = createSutComponents();
			expect(instance.isAcceptableFile(path)).toEqual(result);
		});
	});

	describe("getDetails", () => {
		it.each([
			{
				name: "should get module details for *.d.ts",
				path: "/src/index.d.ts",
				result: { language: "typescript", allowedJSXSyntax: false },
			},
			{
				name: "should get module details for *.ts",
				path: "/src/index.ts",
				result: { language: "typescript", allowedJSXSyntax: false },
			},
			{
				name: "should get module details for *.tsx",
				path: "/src/index.tsx",
				result: { language: "typescript", allowedJSXSyntax: true },
			},
			{
				name: "should get module details for *.js",
				path: "/src/index.js",
				result: { language: "javascript", allowedJSXSyntax: true },
			},
			{
				name: "should get module details for *.jsx",
				path: "/src/index.jsx",
				result: { language: "javascript", allowedJSXSyntax: true },
			},
		])("$name", ({ path, result }) => {
			const { instance } = createSutComponents();
			expect(instance.getDetails(path)).toEqual(result);
		});

		it("should throw error for unsupported file extension", () => {
			expect(() => {
				const { instance } = createSutComponents();
				instance.getDetails("/src/index.css");
			}).toThrow(new AppError("Unsupported extension name for file '/src/index.css'"));
		});
	});

	describe("getPackageEntryPoint", () => {
		it("should be null for empty paths", () => {
			const { instance } = createSutComponents();
			expect(instance.getPackageEntryPoint([])).toEqual(null);
		});

		it("should take index file", () => {
			const { instance } = createSutComponents();
			expect(instance.getPackageEntryPoint(["/src/main.ts", "/src/index.ts"])).toEqual("/src/index.ts");
		});

		it("should take ts index file at first", () => {
			const { instance } = createSutComponents();
			expect(instance.getPackageEntryPoint(["/src/index.js", "/src/index.ts"])).toEqual("/src/index.ts");
		});

		it("should take from extra entries file names if index doesn't exist", () => {
			const { params, instance } = createSutComponents();
			params.settings.extraPackageEntries.fileNames.push("main");

			expect(instance.getPackageEntryPoint(["/src/main.jsx", "/src/file.ts"])).toEqual("/src/main.jsx");
		});

		it("shouldn't take from extra entries file names if index exists", () => {
			const { params, instance } = createSutComponents();
			params.settings.extraPackageEntries.fileNames.push("main");

			expect(instance.getPackageEntryPoint(["/src/main.jsx", "/src/index.d.ts"])).toEqual("/src/index.d.ts");
		});

		it("should return null if entry point wasn't found", () => {
			const { instance } = createSutComponents();
			expect(instance.getPackageEntryPoint(["/src/file1.ts", "/src/file2.ts"])).toEqual(null);
		});

		it("should take from extra entries file paths at first", () => {
			const { params, instance } = createSutComponents();
			params.settings.extraPackageEntries.filePaths.push("/src/main.js");

			expect(instance.getPackageEntryPoint(["/src/main.js", "/src/index.ts"])).toEqual("/src/main.js");
		});
	});
});
