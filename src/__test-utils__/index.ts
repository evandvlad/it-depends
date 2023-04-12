import { Module, Package, ModuleFile, Summary } from "../values";

export async function* createFilesGenerator(files: ModuleFile[]): AsyncGenerator<ModuleFile> {
	for (const file of files) {
		yield Promise.resolve(file);
	}
}

export function createModule(parts: Partial<Module>): Module {
	return {
		path: "",
		language: "typescript",
		imports: [],
		exports: {},
		unparsedDynamicImportsCount: 0,
		shadowedExportValues: [],
		unresolvedFullImports: [],
		unresolvedFullExports: [],
		...parts,
	};
}

export function createPackage(parts: Partial<Package>): Package {
	return {
		path: "",
		entryPoint: "",
		parent: null,
		modules: [],
		packages: [],
		...parts,
	};
}

export function createSummary(parts: Partial<Summary>): Summary {
	return {
		packagesCount: 0,
		modulesCounter: {
			typescript: 0,
			javascript: 0,
		},
		unparsedDynamicImportsCounter: {},
		unresolvedFullImportsCounter: {},
		unresolvedFullExportsCounter: {},
		shadowedExportValuesCounter: {},
		outOfScopeImports: {},
		emptyExports: [],
		possiblyUnusedExportValues: {},
		incorrectImports: {},
		parserErrors: {},
		...parts,
	};
}
