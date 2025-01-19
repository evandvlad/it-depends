import { describe, expect, it } from "@jest/globals";
import { getAcceptableFileExtNameByPath } from "../module-expert";

describe("module-expert", () => {
	describe("getAcceptableFileExtNameByPath", () => {
		it.each([
			{ name: "should be .js for *.js", path: "C:/dir/file.js", result: ".js" },
			{ name: "should be .jsx for *.jsx", path: "C:/dir/file.jsx", result: ".jsx" },
			{ name: "should be .ts for *.ts", path: "C:/dir/file.ts", result: ".ts" },
			{ name: "should be .tsx for *.tsx", path: "C:/dir/file.tsx", result: ".tsx" },
			{ name: "should be .d.ts for *.d.ts", path: "C:/dir/file.d.ts", result: ".d.ts" },
			{ name: "should be null for *.mjs", path: "C:/dir/file.mjs", result: null },
			{ name: "should be null for *.cjs", path: "C:/dir/file.cjs", result: null },
			{ name: "should be null for *.d.mts", path: "C:/dir/file.d.mts", result: null },
			{ name: "should be null for *.d.cts", path: "C:/dir/file.d.cts", result: null },
			{ name: "should be .js for *.d.js", path: "C:/dir/file.d.js", result: ".js" },
			{ name: "should be .jsx for *.d.jsx", path: "C:/dir/file.d.jsx", result: ".jsx" },
			{ name: "should be .tsx for *.d.tsx", path: "C:/dir/file.d.tsx", result: ".tsx" },
			{ name: "should be .ts for *.ddd.ts", path: "C:/dir/file.ddd.ts", result: ".ts" },
			{ name: "should be null for dot file without extension", path: "C:/dir/.ignore", result: null },
			{ name: "should be null for file without extension", path: "C:/dir/file", result: null },
			{ name: "should be null for *.css", path: "C:/dir/file.css", result: null },
			{ name: "should be null for *.scss", path: "C:/dir/file.scss", result: null },
			{ name: "should be null for *.svg", path: "C:/dir/file.svg", result: null },
			{ name: "should be null for *.json", path: "C:/dir/file.json", result: null },
		])("$name", ({ path, result }) => {
			expect(getAcceptableFileExtNameByPath(path)).toEqual(result);
		});
	});
});
