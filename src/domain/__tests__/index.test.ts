import { describe, expect, it } from "@jest/globals";
import { createProcessParams, createProgramFileEntry } from "~/__test-utils__/components-factories";
import { AppError } from "~/lib/errors";
import { Rec } from "~/lib/rec";
import type { PathFilter } from "~/values";
import { Domain } from "..";
import { Exports } from "../exports";
import { Import } from "../import";
import type { Module, ModulesCollection } from "../modules-collector";
import { Package } from "../package";
import type { PackagesCollection } from "../packages-collector";
import type { Summary } from "../summary-collector";

function createSutComponents() {
	const params = {
		settings: {
			aliases: new Rec<string, string>(),
			pathFilter: ((_params) => true) as PathFilter,
			extraPackageEntries: { fileNames: [] as string[], filePaths: [] as string[] },
		},
	};

	const instance = new Domain(params);

	return { params, instance };
}

function createPathFilterParams(path: string) {
	return {
		path,
		name: path.split("/").at(-1)!,
		isFile: true,
	};
}

function createImport({
	sourcePath,
	importPath,
	filePath = null,
	isDynamic = false,
	isRelative = true,
	isAlias = false,
	values = [],
}: {
	sourcePath: string;
	importPath: string;
	isDynamic?: boolean;
	isRelative?: boolean;
	isAlias?: boolean;
	filePath?: string | null;
	values?: string[];
}) {
	return new Import({
		sourcePath,
		importPath,
		filePath,
		isDynamic,
		isRelative,
		isAlias,
		values,
	});
}

function createExports({ sourcePath, data = {} }: { sourcePath: string; data?: Record<string, string[]> }) {
	const exp = new Exports({ sourcePath });

	Object.entries(data).forEach(([value, paths]) => {
		exp.defineValue(value);

		paths.forEach((path) => {
			exp.attachPathToValue(value, path);
		});
	});

	return exp;
}

function createModule(parts: Partial<Module>): Module {
	return {
		path: "",
		name: "",
		package: null,
		language: "typescript",
		content: expect.any(String) as unknown as string,
		imports: [],
		exports: new Exports({ sourcePath: parts.path ?? "" }),
		unparsedDynamicImports: 0,
		shadowedExportValues: [],
		unresolvedFullImports: [],
		unresolvedFullExports: [],
		...parts,
	};
}

function createModulesCollection(modulesList: Module[]): ModulesCollection {
	return Rec.fromEntries(modulesList.map((module) => [module.path, module]));
}

function createSummary(parts: Partial<Summary>): Summary {
	return {
		packages: 0,
		languages: Rec.fromObject({
			typescript: 0,
			javascript: 0,
		}),
		unparsedDynamicImports: new Rec(),
		unresolvedFullImports: new Rec(),
		unresolvedFullExports: new Rec(),
		shadowedExportValues: new Rec(),
		outOfScopeImports: new Rec(),
		emptyExports: [],
		possiblyUnusedExportValues: new Rec(),
		incorrectImports: new Rec(),
		processorErrors: new Rec(),
		...parts,
	};
}

function createPackagesCollection(
	packageParams: Array<{
		path: string;
		entryPoint: string;
		parent?: string;
		modules?: string[];
		packages?: string[];
	}>,
): PackagesCollection {
	return Rec.fromEntries(
		packageParams.map(({ path, entryPoint, parent = null, modules = [], packages = [] }) => {
			const pack = new Package({ path, entryPoint, parent, modules, packages });
			return [path, pack];
		}),
	);
}

describe("domain", () => {
	describe("path-filtration", () => {
		it("should ignore non script files", () => {
			const { instance } = createSutComponents();

			const paths = [
				"/tmp/file.css",
				"/tmp/file.html",
				"/tmp/file.readme",
				"/tmp/.gitignore",
				"/tmp/file.json",
				"/tmp/file.pdf",
				"/tmp/file.js.orig",
			];

			const result = paths.filter((path) => instance.pathFilter(createPathFilterParams(path)));
			expect(result).toEqual([]);
		});

		it("should ignore c* & m.* script files", () => {
			const { instance } = createSutComponents();

			const paths = [
				"/tmp/file.mjs",
				"/tmp/file.mjsx",
				"/tmp/file.mts",
				"/tmp/file.mtsx",
				"/tmp/file.d.mts",
				"/tmp/file.cjs",
				"/tmp/file.cjsx",
				"/tmp/file.cts",
				"/tmp/file.ctsx",
				"/tmp/file.d.cts",
			];

			const result = paths.filter((path) => instance.pathFilter(createPathFilterParams(path)));
			expect(result).toEqual([]);
		});

		it("shouldn't ignore script files", () => {
			const { instance } = createSutComponents();

			const paths = ["/tmp/file.js", "/tmp/file.jsx", "/tmp/file.ts", "/tmp/file.tsx", "/tmp/file.d.ts"];
			const result = paths.filter((path) => instance.pathFilter(createPathFilterParams(path)));

			expect(result).toEqual(paths);
		});

		it("should apply user filter correcly", () => {
			const { params, instance } = createSutComponents();

			params.settings.pathFilter = ({ path }) => !path.endsWith("x");

			const paths = [
				"/tmp/file.css",
				"/tmp/file.html",
				"/tmp/file.js",
				"/tmp/file.jsx",
				"/tmp/file.ts",
				"/tmp/file.tsx",
				"/tmp/file.d.ts",
				"/tmp/file.mts",
				"/tmp/file.mtsx",
			];

			const result = paths.filter((path) => instance.pathFilter(createPathFilterParams(path)));

			expect(result).toEqual(["/tmp/file.js", "/tmp/file.ts", "/tmp/file.d.ts"]);
		});
	});

	describe("get-details", () => {
		it("should get details correctly", () => {
			const { instance } = createSutComponents();
			const details = instance.programFileDetailsGetter("/src/index.tsx");

			expect(details).toEqual({ language: "typescript", allowedJSXSyntax: true });
		});

		it("should throw error for unsupported file", () => {
			const { instance } = createSutComponents();

			expect(() => {
				instance.programFileDetailsGetter("/src/index.json");
			}).toThrow(new AppError("Unsupported extension name for file '/src/index.json'"));
		});
	});

	describe("modules", () => {
		it.each([
			{
				name: "should be single module without imports/exports",
				entries: [createProgramFileEntry({ path: "C:/file.ts" })],
				result: createModulesCollection([
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
					}),
				]),
			},

			{
				name: "should be single module with out of scope named import",
				entries: [
					createProgramFileEntry({
						path: "C:/file.ts",
						ieItems: [{ type: "standard-import", source: "foo", values: ["bar", "baz"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
						imports: [createImport({ sourcePath: "C:/file.ts", importPath: "foo", values: ["bar", "baz"] })],
					}),
				]),
			},

			{
				name: "should be two linked modules",
				entries: [
					createProgramFileEntry({
						path: "/file1.js",
						language: "javascript",
						ieItems: [{ type: "standard-export", values: ["foo", "bar", "default"] }],
					}),
					createProgramFileEntry({
						path: "/file2.jsx",
						language: "javascript",
						ieItems: [{ type: "standard-import", source: "./file1", values: ["default", "foo", "bar"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "/file1.js",
						name: "file1.js",
						language: "javascript",
						exports: createExports({
							sourcePath: "/file1.js",
							data: {
								foo: ["/file2.jsx"],
								bar: ["/file2.jsx"],
								default: ["/file2.jsx"],
							},
						}),
					}),
					createModule({
						path: "/file2.jsx",
						name: "file2.jsx",
						language: "javascript",
						imports: [
							createImport({
								sourcePath: "/file2.tsx",
								filePath: "/file1.js",
								importPath: "./file1",
								values: ["default", "foo", "bar"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be three linked modules",
				entries: [
					createProgramFileEntry({
						path: "/dir1/file1.ts",
						ieItems: [{ type: "standard-export", values: ["foo", "bar", "baz", "default"] }],
					}),
					createProgramFileEntry({
						path: "/file2.ts",
						ieItems: [{ type: "standard-import", source: "./dir1/file1", values: ["foo", "default"] }],
					}),
					createProgramFileEntry({
						path: "/dir2/dir3/file3.ts",
						ieItems: [{ type: "standard-import", source: "../../dir1/file1", values: ["default", "foo", "bar"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "/dir1/file1.ts",
						name: "file1.ts",
						exports: createExports({
							sourcePath: "/dir1/file1.ts",
							data: {
								foo: ["/file2.ts", "/dir2/dir3/file3.ts"],
								bar: ["/dir2/dir3/file3.ts"],
								baz: [],
								default: ["/file2.ts", "/dir2/dir3/file3.ts"],
							},
						}),
					}),
					createModule({
						path: "/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "/file2.ts",
								filePath: "/dir1/file1.ts",
								importPath: "../dir1/file1",
								values: ["foo", "default"],
							}),
						],
					}),
					createModule({
						path: "/dir2/dir3/file3.ts",
						name: "file3.ts",
						imports: [
							createImport({
								sourcePath: "/dir2/dir3/file3.ts",
								filePath: "/dir1/file1.ts",
								importPath: "../../dir1/file1",
								values: ["default", "foo", "bar"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed with aliases",
				entries: [
					createProgramFileEntry({
						path: "C:/file1.tsx",
						ieItems: [{ type: "standard-export", values: ["default"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2.tsx",
						ieItems: [{ type: "standard-import", source: "~/file1", values: ["default"] }],
					}),
				],
				aliases: {
					"~": "C:/",
				},
				result: createModulesCollection([
					createModule({
						path: "C:/file1.tsx",
						name: "file1.tsx",
						exports: createExports({
							sourcePath: "C:/file1.tsx",
							data: {
								default: ["C:/file2.tsx"],
							},
						}),
					}),
					createModule({
						path: "C:/file2.tsx",
						name: "file2.tsx",
						imports: [
							createImport({
								sourcePath: "C:/file2.tsx",
								filePath: "C:/file1.tsx",
								importPath: "~/file1",
								values: ["default"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as out of scope named import",
				entries: [
					createProgramFileEntry({
						path: "C:/dir1/dir2/dir3/dir4/file.ts",
						ieItems: [{ type: "standard-import", source: "../../../../out-of-scope", values: ["qux", "quux"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir1/dir2/dir3/dir4/file.ts",
						name: "file.ts",
						imports: [
							createImport({
								sourcePath: "C:/dir1/dir2/dir3/dir4/file.ts",
								importPath: "../../../../out-of-scope",
								values: ["qux", "quux"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as out of scope full import",
				entries: [
					createProgramFileEntry({
						path: "C:/dir1/dir2/dir3/dir4/file.ts",
						ieItems: [{ type: "standard-import", source: "../../../../out-of-scope", values: ["*"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir1/dir2/dir3/dir4/file.ts",
						name: "file.ts",
						unresolvedFullImports: [
							createImport({
								sourcePath: "C:/dir1/dir2/dir3/dir4/file.ts",
								importPath: "../../../../out-of-scope",
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as side effect import",
				entries: [
					createProgramFileEntry({
						path: "C:/dir1/dir2/file1.ts",
						ieItems: [{ type: "standard-export", values: ["default"] }],
					}),
					createProgramFileEntry({
						path: "C:/dir1/dir2/file2.ts",
						ieItems: [{ type: "standard-import", source: "./file1", values: [] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir1/dir2/file1.ts",
						name: "file1.ts",
						exports: createExports({
							sourcePath: "C:/dir1/dir2/file1.ts",
							data: {
								default: [],
							},
						}),
					}),
					createModule({
						path: "C:/dir1/dir2/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "C:/dir1/dir2/file2.ts",
								filePath: "C:/dir1/dir2/file1.ts",
								importPath: "./file1",
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as empty named import",
				entries: [
					createProgramFileEntry({
						path: "/file1.ts",
						ieItems: [{ type: "standard-export", values: ["foo"] }],
					}),
					createProgramFileEntry({
						path: "/file2.ts",
						ieItems: [{ type: "standard-import", source: "./file1", values: [] }],
					}),
				],

				result: createModulesCollection([
					createModule({
						path: "/file1.ts",
						name: "file1.ts",
						exports: createExports({
							sourcePath: "/file1.ts",
							data: {
								foo: [],
							},
						}),
					}),
					createModule({
						path: "/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "/file2.ts",
								filePath: "/file1.ts",
								importPath: "./file1",
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as empty exports",
				entries: [
					createProgramFileEntry({
						path: "C:/dir/index.jsx",
						ieItems: [{ type: "standard-export", values: [] }],
					}),
					createProgramFileEntry({
						path: "C:/file.ts",
						ieItems: [{ type: "standard-import", source: "./dir", values: ["*"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir/index.jsx",
						name: "index.jsx",
						package: "C:/dir",
						language: "javascript",
					}),
					createModule({
						path: "C:/file.ts",
						name: "file.ts",
						imports: [
							createImport({
								sourcePath: "C:/file.ts",
								filePath: "C:/dir/index.jsx",
								importPath: "./dir",
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as dynamic import",
				entries: [
					createProgramFileEntry({
						path: "C:/dir/index.ts",
						ieItems: [{ type: "standard-export", values: ["foo", "bar"] }],
					}),
					createProgramFileEntry({
						path: "C:/dir/file.ts",
						ieItems: [{ type: "dynamic-import", source: "." }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir/index.ts",
						name: "index.ts",
						package: "C:/dir",
						exports: createExports({
							sourcePath: "C:/dir/index.ts",
							data: {
								foo: ["C:/dir/file.ts"],
								bar: ["C:/dir/file.ts"],
							},
						}),
					}),
					createModule({
						path: "C:/dir/file.ts",
						name: "file.ts",
						package: "C:/dir",
						imports: [
							createImport({
								sourcePath: "C:/dir/file.ts",
								filePath: "C:/dir/index.ts",
								importPath: ".",
								isDynamic: true,
								values: ["foo", "bar"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as unparsed dynamic import",
				entries: [
					createProgramFileEntry({
						path: "C:/file1.ts",
						ieItems: [{ type: "standard-export", values: ["foo", "bar"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2.ts",
						ieItems: [{ type: "dynamic-import", source: null }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/file1.ts",
						name: "file1.ts",
						exports: createExports({
							sourcePath: "C:/file1.ts",
							data: {
								foo: [],
								bar: [],
							},
						}),
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						unparsedDynamicImports: 1,
					}),
				]),
			},

			{
				name: "should be processed as simple re-export",
				entries: [
					createProgramFileEntry({
						path: "C:/file1.ts",
						ieItems: [{ type: "standard-export", values: ["Bar", "default"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2.ts",
						ieItems: [{ type: "re-export", source: "./file1", inputValues: ["Bar"], outputValues: ["Baz"] }],
					}),
					createProgramFileEntry({
						path: "C:/dir/file3.ts",
						ieItems: [
							{ type: "standard-import", source: "../file2", values: ["Baz"] },
							{ type: "standard-import", source: "../file1", values: ["default"] },
						],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/file1.ts",
						name: "file1.ts",
						exports: createExports({
							sourcePath: "C:/file1.ts",
							data: {
								default: ["C:/dir/file3.ts"],
								Bar: ["C:/file2.ts"],
							},
						}),
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "C:/file2.ts",
								filePath: "C:/file1.ts",
								importPath: "./file1",
								values: ["Bar"],
							}),
						],
						exports: createExports({
							sourcePath: "C:/file2.ts",
							data: {
								Baz: ["C:/dir/file3.ts"],
							},
						}),
					}),
					createModule({
						path: "C:/dir/file3.ts",
						name: "file3.ts",
						imports: [
							createImport({
								sourcePath: "C:/dir/file3.ts",
								filePath: "C:/file2.ts",
								importPath: "../file2",
								values: ["Baz"],
							}),
							createImport({
								sourcePath: "C:/dir/file3.ts",
								filePath: "C:/file1.ts",
								importPath: "../file1",
								values: ["default"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed with full re-export/import",
				entries: [
					createProgramFileEntry({
						path: "C:/file1.d.ts",
						ieItems: [{ type: "standard-export", values: ["Qux", "Quux"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2/index.ts",
						ieItems: [{ type: "re-export", source: "../file1", inputValues: ["*"], outputValues: ["*"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2.tsx",
						ieItems: [{ type: "standard-import", source: "./file2", values: ["*"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/file1.d.ts",
						name: "file1.d.ts",
						exports: createExports({
							sourcePath: "C:/file1.d.ts",
							data: {
								Qux: ["C:/file2/index.ts"],
								Quux: ["C:/file2/index.ts"],
							},
						}),
					}),
					createModule({
						path: "C:/file2/index.ts",
						name: "index.ts",
						package: "C:/file2",
						imports: [
							createImport({
								sourcePath: "C:/file2/index.ts",
								filePath: "C:/file1.d.ts",
								importPath: "../file1",
								values: ["Qux", "Quux"],
							}),
						],
						exports: createExports({
							sourcePath: "C:/file2/index.ts",
							data: {
								Qux: ["C:/file3.tsx"],
								Quux: ["C:/file3.tsx"],
							},
						}),
					}),
					createModule({
						path: "C:/file3.tsx",
						name: "file3.tsx",
						imports: [
							createImport({
								sourcePath: "C:/file3.tsx",
								filePath: "C:/file2/index.ts",
								importPath: "./file2",
								values: ["Qux", "Quux"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as export of duplicate values",
				entries: [
					createProgramFileEntry({
						path: "C:/dir/file1.ts",
						ieItems: [{ type: "standard-export", values: ["foo", "bar"] }],
					}),
					createProgramFileEntry({
						path: "C:/dir/file2.ts",
						ieItems: [
							{ type: "standard-export", values: ["bar"] },
							{ type: "re-export", source: "./file1", inputValues: ["*"], outputValues: ["*"] },
						],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir/file1.ts",
						name: "file1.ts",
						exports: createExports({
							sourcePath: "C:/dir/file1.ts",
							data: {
								foo: ["C:/dir/file2.ts"],
								bar: ["C:/dir/file2.ts"],
							},
						}),
					}),
					createModule({
						path: "C:/dir/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "C:/dir/file2.ts",
								filePath: "C:/dir/file1.ts",
								importPath: "./file1",
								values: ["foo", "bar"],
							}),
						],
						exports: createExports({
							sourcePath: "C:/dir/file2.ts",
							data: {
								bar: ["C:/dir/file3.ts"],
								foo: ["C:/dir/file3.ts"],
							},
						}),
						shadowedExportValues: ["bar"],
					}),
					createModule({
						path: "C:/dir/file3.ts",
						name: "file3.ts",
						imports: [
							createImport({
								sourcePath: "C:/dir/file3.ts",
								filePath: "C:/dir/file2.ts",
								importPath: "./file2",
								values: ["bar", "foo"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be processed as out of scope full re-export",
				entries: [
					createProgramFileEntry({
						path: "/file1.ts",
						ieItems: [{ type: "re-export", source: "foo", inputValues: ["*"], outputValues: ["*"] }],
					}),
					createProgramFileEntry({
						path: "./file2.ts",
						ieItems: [{ type: "standard-import", source: "./file1", values: ["bar"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "/file1.ts",
						name: "file1.ts",
						unresolvedFullExports: [createImport({ sourcePath: "/file1.ts", importPath: "foo" })],
						unresolvedFullImports: [createImport({ sourcePath: "/file1.ts", importPath: "foo" })],
					}),
					createModule({
						path: "/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "/file2.ts",
								filePath: "/file1.ts",
								importPath: "./file1",
								values: ["bar"],
							}),
						],
					}),
				]),
			},

			{
				name: "should be process as nested full re-exports with out of scope item",
				entries: [
					createProgramFileEntry({
						path: "C:/file4.ts",
						ieItems: [{ type: "standard-import", source: "./file3", values: ["*"] }],
					}),
					createProgramFileEntry({
						path: "C:/file3.ts",
						ieItems: [{ type: "re-export", source: "./file2", inputValues: ["*"], outputValues: ["*"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2.ts",
						ieItems: [
							{ type: "re-export", source: "./file1", inputValues: ["*"], outputValues: ["*"] },
							{ type: "re-export", source: "bar", inputValues: ["*"], outputValues: ["*"] },
						],
					}),
					createProgramFileEntry({
						path: "C:/file1.tsx",
						ieItems: [{ type: "standard-export", values: ["foo", "default"] }],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/file4.ts",
						name: "file4.ts",
						unresolvedFullImports: [
							createImport({ sourcePath: "C:/file4.ts", filePath: "C:/file3.ts", importPath: "./file3" }),
						],
					}),
					createModule({
						path: "C:/file3.ts",
						name: "file3.ts",
						unresolvedFullExports: [
							createImport({ sourcePath: "C:/file3.ts", filePath: "C:/file2.ts", importPath: "./file2" }),
						],
						unresolvedFullImports: [
							createImport({ sourcePath: "C:/file3.ts", filePath: "C:/file2.ts", importPath: "./file2" }),
						],
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "C:/file2.ts",
								filePath: "C:/file1.tsx",
								importPath: "./file1",
								values: ["foo", "default"],
							}),
						],
						unresolvedFullExports: [
							createImport({
								sourcePath: "C:/file2.ts",
								filePath: "C:/file1.tsx",
								importPath: "./file1",
							}),
							createImport({ sourcePath: "C:/file2.ts", importPath: "bar" }),
						],
						unresolvedFullImports: [createImport({ sourcePath: "C:/file2.ts", importPath: "bar" })],
					}),
					createModule({
						path: "C:/file1.tsx",
						name: "file1.tsx",
						exports: createExports({
							sourcePath: "C:/file1.tsx",
							data: {
								foo: ["C:/file2.ts"],
								default: ["C:/file2.ts"],
							},
						}),
					}),
				]),
			},

			{
				name: "should process cycled dependencies",
				entries: [
					createProgramFileEntry({
						path: "C:/dir/index.ts",
						ieItems: [
							{ type: "standard-import", source: "./dir2/file", values: ["Foo"] },
							{ type: "standard-export", values: ["Bar", "default"] },
						],
					}),
					createProgramFileEntry({
						path: "C:/dir/dir2/file.ts",
						ieItems: [
							{ type: "standard-import", source: "..", values: ["Bar"] },
							{ type: "standard-export", values: ["Foo"] },
						],
					}),
				],
				result: createModulesCollection([
					createModule({
						path: "C:/dir/index.ts",
						name: "index.ts",
						package: "C:/dir",
						exports: createExports({
							sourcePath: "C:/dir/index.ts",
							data: {
								Bar: ["C:/dir/dir2/file.ts"],
								default: [],
							},
						}),
						imports: [
							createImport({
								sourcePath: "C:/dir/index.ts",
								filePath: "C:/dir/dir2/file.ts",
								importPath: "./dir2/file",
								values: ["Foo"],
							}),
						],
					}),
					createModule({
						path: "C:/dir/dir2/file.ts",
						name: "file.ts",
						package: "C:/dir",
						exports: createExports({
							sourcePath: "C:/dir/dir2/file.ts",
							data: {
								Foo: ["C:/dir/index.ts"],
							},
						}),
						imports: [
							createImport({
								sourcePath: "C:/dir/dir2/file.ts",
								filePath: "C:/dir/index.ts",
								importPath: "..",
								values: ["Bar"],
							}),
						],
					}),
				]),
			},

			{
				name: "should process several imports from the same source",
				entries: [
					createProgramFileEntry({
						path: "C:/file1/index.ts",
						ieItems: [{ type: "standard-export", values: ["foo", "bar", "baz", "default"] }],
					}),
					createProgramFileEntry({
						path: "C:/file2.ts",
						ieItems: [
							{ type: "standard-import", source: "./file1", values: ["foo", "default"] },
							{ type: "standard-import", source: "~/file1", values: ["default"] },
							{ type: "standard-import", source: "./file1/index", values: ["bar", "baz"] },
						],
					}),
				],
				aliases: {
					"~": "C:/",
				},
				result: createModulesCollection([
					createModule({
						path: "C:/file1/index.ts",
						name: "index.ts",
						package: "C:/file1",
						exports: createExports({
							sourcePath: "C:/file1/index.ts",
							data: {
								foo: ["C:/file2.ts"],
								bar: ["C:/file2.ts"],
								baz: ["C:/file2.ts"],
								default: ["C:/file2.ts"],
							},
						}),
					}),
					createModule({
						path: "C:/file2.ts",
						name: "file2.ts",
						imports: [
							createImport({
								sourcePath: "C:/file2.ts",
								filePath: "C:/file1/index.ts",
								importPath: "./file1",
								values: ["foo", "default"],
							}),
							createImport({
								sourcePath: "C:/file2.ts",
								filePath: "C:/file1/index.ts",
								importPath: "~/file1",
								values: ["default"],
							}),
							createImport({
								sourcePath: "C:/file2.ts",
								filePath: "C:/file1/index.ts",
								importPath: "./file1/index",
								values: ["bar", "baz"],
							}),
						],
					}),
				]),
			},
		])("$name", ({ entries, result, aliases = {} }) => {
			const { params, instance } = createSutComponents();
			params.settings.aliases = Rec.fromObject(aliases as Record<string, string>);

			const { modulesCollection } = instance.process(createProcessParams({ entries }));

			expect(modulesCollection).toEqual(result);
		});

		describe("packages", () => {
			it.each([
				{
					name: "should be modules without package",
					filePaths: ["C:/dir/file1.ts", "C:/dir/file2.jsx"],
					packages: createPackagesCollection([]),
				},

				{
					name: "should be single package with standard entry point",
					filePaths: ["C:/dir/index.ts"],
					packages: createPackagesCollection([
						{
							path: "C:/dir",
							entryPoint: "C:/dir/index.ts",
							modules: ["C:/dir/index.ts"],
						},
					]),
				},

				{
					name: "should be single package with custom entry point",
					filePaths: ["/dir/index.entry.tsx"],
					extraPackageEntries: { fileNames: ["index.entry"] },
					packages: createPackagesCollection([
						{
							path: "/dir",
							entryPoint: "/dir/index.entry.tsx",
							modules: ["/dir/index.entry.tsx"],
						},
					]),
				},

				{
					name: "should be single package with custom entry point mapping",
					filePaths: ["C:/dir/main.js"],
					extraPackageEntries: { filePaths: ["C:/dir/main.js"] },
					packages: createPackagesCollection([
						{
							path: "C:/dir",
							entryPoint: "C:/dir/main.js",
							modules: ["C:/dir/main.js"],
						},
					]),
				},

				{
					name: "should be single package with several flat modules",
					filePaths: ["/dir/file1.ts", "/dir/file2.js", "/dir/index.tsx"],
					packages: createPackagesCollection([
						{
							path: "/dir",
							entryPoint: "/dir/index.tsx",
							modules: ["/dir/file1.ts", "/dir/file2.js", "/dir/index.tsx"],
						},
					]),
				},

				{
					name: "should be correct resolution package's entry point",
					filePaths: ["/dir/index.d.ts", "/dir/index.ts", "/dir/index.js"],
					packages: createPackagesCollection([
						{
							path: "/dir",
							entryPoint: "/dir/index.ts",
							modules: ["/dir/index.d.ts", "/dir/index.ts", "/dir/index.js"],
						},
					]),
				},

				{
					name: "should be single package with several nested modules",
					filePaths: [
						"C:/dir/file1.ts",
						"C:/dir/dir2/file.d.ts",
						"C:/dir/file2.js",
						"C:/dir/index.tsx",
						"C:/dir/dir2/dir3/file.jsx",
					],
					packages: createPackagesCollection([
						{
							path: "C:/dir",
							entryPoint: "C:/dir/index.tsx",
							modules: [
								"C:/dir/file1.ts",
								"C:/dir/file2.js",
								"C:/dir/index.tsx",
								"C:/dir/dir2/file.d.ts",
								"C:/dir/dir2/dir3/file.jsx",
							],
						},
					]),
				},

				{
					name: "should be main package with inner flat packages",
					filePaths: [
						"/dir/index.ts",
						"/dir/dir1/file.tsx",
						"/dir/dir1/index.js",
						"/dir/dir2/file.jsx",
						"/dir/dir2/index.ts",
					],
					packages: createPackagesCollection([
						{
							path: "/dir",
							entryPoint: "/dir/index.ts",
							modules: ["/dir/index.ts"],
							packages: ["/dir/dir1", "/dir/dir2"],
						},
						{
							path: "/dir/dir1",
							parent: "/dir",
							entryPoint: "/dir/dir1/index.js",
							modules: ["/dir/dir1/file.tsx", "/dir/dir1/index.js"],
						},
						{
							path: "/dir/dir2",
							parent: "/dir",
							entryPoint: "/dir/dir2/index.ts",
							modules: ["/dir/dir2/file.jsx", "/dir/dir2/index.ts"],
						},
					]),
				},

				{
					name: "should be main package with inner nested packages",
					filePaths: [
						"C:/dir/dir1/dir2/index.ts",
						"C:/dir/dir1/dir2/file.jsx",
						"C:/dir/dir1/index.js",
						"C:/dir/dir1/file.tsx",
						"C:/dir/index.ts",
					],
					packages: createPackagesCollection([
						{
							path: "C:/dir",
							entryPoint: "C:/dir/index.ts",
							modules: ["C:/dir/index.ts"],
							packages: ["C:/dir/dir1"],
						},
						{
							path: "C:/dir/dir1",
							parent: "C:/dir",
							entryPoint: "C:/dir/dir1/index.js",
							modules: ["C:/dir/dir1/index.js", "C:/dir/dir1/file.tsx"],
							packages: ["C:/dir/dir1/dir2"],
						},
						{
							path: "C:/dir/dir1/dir2",
							parent: "C:/dir/dir1",
							entryPoint: "C:/dir/dir1/dir2/index.ts",
							modules: ["C:/dir/dir1/dir2/index.ts", "C:/dir/dir1/dir2/file.jsx"],
						},
					]),
				},

				{
					name: "should be complex packages tree",
					filePaths: [
						"/dir/dir1/dir1/index.ts",
						"/dir/dir1/dir1/file.jsx",
						"/dir/dir1/index.js",
						"/dir/dir1/file.tsx",
						"/dir/dir2/index.d.ts",
						"/dir/dir2/index.js",
						"/dir/index.ts",
						"/dir/dir1/dir2/index.tsx",
						"/dir/dir1/dir3/index.jsx",
						"/dir/main.ts",
					],
					extraPackageEntries: { filePaths: ["/dir/main.ts"] },
					packages: createPackagesCollection([
						{
							path: "/dir",
							entryPoint: "/dir/main.ts",
							modules: ["/dir/index.ts", "/dir/main.ts"],
							packages: ["/dir/dir1", "/dir/dir2"],
						},
						{
							path: "/dir/dir1",
							parent: "/dir",
							entryPoint: "/dir/dir1/index.js",
							modules: ["/dir/dir1/index.js", "/dir/dir1/file.tsx"],
							packages: ["/dir/dir1/dir1", "/dir/dir1/dir2", "/dir/dir1/dir3"],
						},
						{
							path: "/dir/dir1/dir1",
							parent: "/dir/dir1",
							entryPoint: "/dir/dir1/dir1/index.ts",
							modules: ["/dir/dir1/dir1/index.ts", "/dir/dir1/dir1/file.jsx"],
						},
						{
							path: "/dir/dir1/dir2",
							parent: "/dir/dir1",
							entryPoint: "/dir/dir1/dir2/index.tsx",
							modules: ["/dir/dir1/dir2/index.tsx"],
						},
						{
							path: "/dir/dir1/dir3",
							parent: "/dir/dir1",
							entryPoint: "/dir/dir1/dir3/index.jsx",
							modules: ["/dir/dir1/dir3/index.jsx"],
						},
						{
							path: "/dir/dir2",
							parent: "/dir",
							entryPoint: "/dir/dir2/index.js",
							modules: ["/dir/dir2/index.d.ts", "/dir/dir2/index.js"],
						},
					]),
				},
			])("$name", ({ filePaths, packages, extraPackageEntries = {} }) => {
				const { params, instance } = createSutComponents();
				params.settings.extraPackageEntries = { fileNames: [], filePaths: [], ...extraPackageEntries };

				const entries = filePaths.map((path) => createProgramFileEntry({ path }));

				const { packagesCollection } = instance.process(createProcessParams({ entries }));

				expect(packagesCollection).toEqual(packages);
			});
		});

		describe("summary", () => {
			it.each([
				{
					name: "should be single module & with out of scope import",
					entries: [
						createProgramFileEntry({
							path: "C:/dir/index.ts",
							ieItems: [
								{ type: "standard-import", source: "foo", values: ["default"] },
								{ type: "standard-export", values: ["foo"] },
							],
						}),
					],
					result: createSummary({
						packages: 1,
						languages: Rec.fromObject({
							typescript: 1,
							javascript: 0,
						}),
						outOfScopeImports: Rec.fromEntries([["C:/dir/index.ts", ["foo"]]]),
						possiblyUnusedExportValues: Rec.fromEntries([["C:/dir/index.ts", ["foo"]]]),
					}),
				},

				{
					name: "should be module with dynamic imports",
					entries: [
						createProgramFileEntry({
							path: "/dir/file.jsx",
							language: "javascript",
							ieItems: [
								{ type: "standard-export", values: ["foo"] },
								{ type: "dynamic-import", source: null },
								{ type: "dynamic-import", source: null },
							],
						}),
						createProgramFileEntry({
							path: "/dir/index.ts",
							ieItems: [{ type: "standard-import", source: "./file", values: ["*"] }],
						}),
					],
					result: createSummary({
						packages: 1,
						languages: Rec.fromObject({
							typescript: 1,
							javascript: 1,
						}),
						unparsedDynamicImports: Rec.fromEntries([["/dir/file.jsx", 2]]),
						emptyExports: ["/dir/index.ts"],
					}),
				},

				{
					name: "should be module with unresolved full imports",
					entries: [
						createProgramFileEntry({
							path: "C:/dir/index.tsx",
							ieItems: [
								{ type: "standard-import", source: "foo", values: ["*"] },
								{ type: "standard-import", source: "bar", values: ["*"] },
							],
						}),
					],
					result: createSummary({
						packages: 1,
						languages: Rec.fromObject({
							typescript: 1,
							javascript: 0,
						}),
						unresolvedFullImports: Rec.fromEntries([["C:/dir/index.tsx", 2]]),
						emptyExports: ["C:/dir/index.tsx"],
					}),
				},

				{
					name: "should be module with unresolved re-exports",
					entries: [
						createProgramFileEntry({
							path: "C:/dir/index.tsx",
							ieItems: [{ type: "standard-import", source: "./file", values: ["bar"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir/file.ts",
							ieItems: [{ type: "re-export", source: "foo", inputValues: ["*"], outputValues: ["*"] }],
						}),
					],
					result: createSummary({
						packages: 1,
						languages: Rec.fromObject({
							typescript: 2,
							javascript: 0,
						}),
						unresolvedFullImports: Rec.fromEntries([["C:/dir/file.ts", 1]]),
						unresolvedFullExports: Rec.fromEntries([["C:/dir/file.ts", 1]]),
						emptyExports: ["C:/dir/index.tsx"],
					}),
				},

				{
					name: "should be module with shadowed export value",
					entries: [
						createProgramFileEntry({
							path: "/dir/file1.js",
							language: "javascript",
							ieItems: [{ type: "standard-export", values: ["foo", "bar"] }],
						}),
						createProgramFileEntry({
							path: "/dir/file2.js",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./file1", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir/index.js",
							language: "javascript",
							ieItems: [{ type: "standard-import", source: "./file2", values: ["foo", "bar"] }],
						}),
					],
					result: createSummary({
						packages: 1,
						languages: Rec.fromObject({
							typescript: 0,
							javascript: 3,
						}),
						shadowedExportValues: Rec.fromEntries([["/dir/file2.js", 1]]),
						emptyExports: ["/dir/index.js"],
					}),
				},

				{
					name: "should be module with incorrect import",
					entries: [
						createProgramFileEntry({
							path: "/dir1/file.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/index.ts",
							ieItems: [{ type: "standard-import", source: "./file", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir2/index.ts",
							ieItems: [{ type: "standard-import", source: "../dir1/file", values: ["foo"] }],
						}),
					],
					result: createSummary({
						packages: 2,
						languages: Rec.fromObject({
							typescript: 3,
							javascript: 0,
						}),
						emptyExports: ["/dir1/index.ts", "/dir2/index.ts"],
						incorrectImports: Rec.fromEntries([
							[
								"/dir2/index.ts",
								[
									createImport({
										sourcePath: "/dir2/index.ts",
										filePath: "/dir1/file.ts",
										importPath: "../dir1/file",
									}),
								],
							],
						]),
					}),
				},
			])("$name", ({ entries, result }) => {
				const { instance } = createSutComponents();

				const { summary } = instance.process(createProcessParams({ entries }));
				expect(summary).toEqual(result);
			});
		});

		describe("incorrect imports", () => {
			it.each([
				{
					name: "should be correct for files in the same package",
					entries: [
						createProgramFileEntry({
							path: "/dir/file.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir/index.ts",
							ieItems: [{ type: "standard-import", source: "./file", values: ["foo"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct for the same package & import of entry point",
					entries: [
						createProgramFileEntry({
							path: "C:/dir/index.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir/file.ts",
							ieItems: [{ type: "standard-import", source: ".", values: ["foo"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct for explicit entry point",
					entries: [
						createProgramFileEntry({
							path: "/dir/index.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir/file.ts",
							ieItems: [{ type: "standard-import", source: "./index", values: ["foo"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct import of out of scope module",
					entries: [
						createProgramFileEntry({
							path: "/dir1/dir2/dir3/index.ts",
							ieItems: [{ type: "standard-import", source: "../../foo", values: ["default"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct import for module without package",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/index.ts",
							ieItems: [{ type: "standard-import", source: "../dir2/file", values: ["default"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir2/file.ts",
							ieItems: [{ type: "standard-export", values: ["default"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct import for both modules without packages",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/file.ts",
							ieItems: [{ type: "standard-import", source: "../dir2/file", values: ["default"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir2/file.ts",
							ieItems: [{ type: "standard-export", values: ["default"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct import for module from root package with nesting",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/index.ts",
							ieItems: [{ type: "standard-export", values: ["default"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir2/index.ts",
							ieItems: [{ type: "standard-import", source: "./dir3", values: ["default"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir2/dir3/index.ts",
							ieItems: [{ type: "standard-import", source: "../../dir1", values: ["default"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir2/dir3/file.ts",
							ieItems: [{ type: "standard-import", source: "../../dir1", values: ["default"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct for the sibling packages with import from entry point",
					entries: [
						createProgramFileEntry({
							path: "/dir1/file.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./file", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir2/index.js",
							language: "javascript",
							ieItems: [{ type: "standard-import", source: "../dir1", values: ["foo"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be incorrect for the sibling packages with import from not entry point",
					entries: [
						createProgramFileEntry({
							path: "/dir1/file.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./file", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir2/index.js",
							language: "javascript",
							ieItems: [{ type: "standard-import", source: "../dir1/file", values: ["foo"] }],
						}),
					],
					isCorrect: false,
				},

				{
					name: "should be correct from parent package with import from not entry point",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./file1", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/file1.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/file2.js",
							language: "javascript",
							ieItems: [{ type: "standard-import", source: "../file1", values: ["foo"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct from direct ancestor package with import from not entry point",
					entries: [
						createProgramFileEntry({
							path: "/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./file", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/file1.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/index.js",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./dir3", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/dir3/index.jsx",
							ieItems: [{ type: "re-export", source: "./file2", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/dir3/file2.ts",
							ieItems: [
								{ type: "standard-import", source: "../../file1", values: ["foo"] },
								{ type: "standard-export", values: ["bar"] },
							],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct from direct ancestor package with import from entry point",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./file1", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/file1.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/index.js",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./dir3", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/dir3/index.jsx",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./file2", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/dir3/file2.ts",
							ieItems: [
								{ type: "standard-import", source: "../..", values: ["foo"] },
								{ type: "standard-export", values: ["bar"] },
							],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be correct from outer package with import from entry point",
					entries: [
						createProgramFileEntry({
							path: "/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./dir2", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/index.js",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./dir3", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir22/index.js",
							language: "javascript",
							ieItems: [{ type: "standard-export", values: ["bar"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/dir2/index.jsx",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./file2", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/dir3/file2.ts",
							ieItems: [
								{ type: "standard-import", source: "../../dir22", values: ["foo"] },
								{ type: "standard-export", values: ["bar"] },
							],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be incorrect from outer package with import from not entry point",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/index.tsx",
							ieItems: [{ type: "re-export", source: "./dir22", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir22/index.ts",
							ieItems: [{ type: "re-export", source: "./file1", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir22/file1.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/index.js",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./dir3", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/dir3/index.jsx",
							language: "javascript",
							ieItems: [{ type: "re-export", source: "./file2", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/dir3/file2.ts",
							ieItems: [
								{ type: "standard-import", source: "../../dir22/file1", values: ["foo"] },
								{ type: "standard-export", values: ["bar"] },
							],
						}),
					],
					isCorrect: false,
				},

				{
					name: "should be correct from child package from entry point",
					entries: [
						createProgramFileEntry({
							path: "/dir1/index.ts",
							ieItems: [{ type: "standard-import", source: "./dir2", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/index.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
					],
					isCorrect: true,
				},

				{
					name: "should be incorrect from child package from non entry point",
					entries: [
						createProgramFileEntry({
							path: "C:/dir1/index.ts",
							ieItems: [{ type: "standard-import", source: "./dir2/file", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/index.ts",
							ieItems: [{ type: "re-export", source: "./file", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "C:/dir1/dir2/file.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
					],
					isCorrect: false,
				},

				{
					name: "should be incorrect from descendant package with violation on child package",
					entries: [
						createProgramFileEntry({
							path: "/dir1/index.ts",
							ieItems: [{ type: "standard-import", source: "./dir2/dir3", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/index.ts",
							ieItems: [{ type: "re-export", source: "./dir3", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/dir1/dir2/dir3/index.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
					],
					isCorrect: false,
				},

				{
					name: "should be incorrect for import to module without package from module with package",
					entries: [
						createProgramFileEntry({
							path: "/src/main.ts",
							ieItems: [{ type: "standard-import", source: "./lib/a/a", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/index.ts",
							ieItems: [{ type: "re-export", source: "./a", inputValues: ["foo"], outputValues: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/a.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
					],
					isCorrect: false,
				},

				{
					name: "should be incorrect for import to module without package from modules with nested package and from entry point",
					entries: [
						createProgramFileEntry({
							path: "/src/main.ts",
							ieItems: [{ type: "standard-import", source: "./lib/a/b", values: ["bar"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/index.ts",
							ieItems: [{ type: "re-export", source: "./a", inputValues: ["foo"], outputValues: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/a.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/b/index.ts",
							ieItems: [{ type: "standard-export", values: ["bar"] }],
						}),
					],
					isCorrect: false,
				},

				{
					name: "should be incorrect for import to module without package from modules with nested package and not from entry point",
					entries: [
						createProgramFileEntry({
							path: "/src/main.ts",
							ieItems: [{ type: "standard-import", source: "./lib/a/b/c", values: ["baz"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/index.ts",
							ieItems: [{ type: "re-export", source: "./a", inputValues: ["*"], outputValues: ["*"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/a.ts",
							ieItems: [{ type: "standard-export", values: ["foo"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/b/index.ts",
							ieItems: [{ type: "standard-export", values: ["bar"] }],
						}),
						createProgramFileEntry({
							path: "/src/lib/a/b/c.ts",
							ieItems: [{ type: "standard-export", values: ["baz"] }],
						}),
					],
					isCorrect: false,
				},
			])("$name", ({ entries, isCorrect }) => {
				const { instance } = createSutComponents();

				const { summary } = instance.process(createProcessParams({ entries }));

				expect(summary.incorrectImports.size === 0).toEqual(isCorrect);
			});
		});
	});
});
