import { expect } from "@jest/globals";
import {
	Domain,
	type Module,
	type ModulesCollection,
	type Package,
	type PackagesCollection,
	type ProcessorErrors,
	type ProgramFileEntry,
	type Summary,
} from "~/domain";
import { Rec } from "~/lib/rec";

export async function* createProgramFileItems(items: Array<{ content: string; path: string }>) {
	for await (const item of items) {
		yield Promise.resolve(item);
	}
}

export function createProgramFileEntry(parts: Partial<ProgramFileEntry>): ProgramFileEntry {
	return {
		path: "",
		content: "",
		language: "typescript",
		ieItems: [],
		...parts,
	};
}

export function createModule(parts: Partial<Module>): Module {
	return {
		path: "",
		name: "",
		package: null,
		language: "typescript",
		content: expect.any(String) as unknown as string,
		imports: [],
		exports: new Rec(),
		unparsedDynamicImports: 0,
		shadowedExportValues: [],
		unresolvedFullImports: [],
		unresolvedFullExports: [],
		...parts,
	};
}

export function createModulesCollection(modulesList: Module[]): ModulesCollection {
	return Rec.fromEntries(modulesList.map((module) => [module.path, module]));
}

export function createPackage(parts: Partial<Package>): Package {
	return {
		path: "",
		name: "",
		entryPoint: "",
		parent: null,
		modules: [],
		packages: [],
		...parts,
	};
}

export function createPackagesCollection(packagesList: Package[]): PackagesCollection {
	return Rec.fromEntries(packagesList.map((pack) => [pack.path, pack]));
}

export function createSummary(parts: Partial<Summary>): Summary {
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

export function createDomain() {
	return new Domain({
		settings: {
			aliases: new Rec<string, string>(),
			pathFilter: () => true,
			extraPackageEntries: { fileNames: [] as string[], filePaths: [] as string[] },
		},
	});
}

export function createProcessParams({
	entries,
	processorErrors = new Rec<string, Error>(),
}: {
	entries: ProgramFileEntry[];
	processorErrors?: ProcessorErrors;
}) {
	return {
		processorErrors,
		entries: Rec.fromEntries(entries.map((entry) => [entry.path, entry])),
	};
}
