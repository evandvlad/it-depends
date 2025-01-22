import { expect } from "@jest/globals";

import { Rec } from "~/lib/rec";
import type { Module, ModulesCollection } from "../modules-collector";
import type { Package, PackagesCollection } from "../packages-collector";
import type { ProgramFileEntries, ProgramFileEntry } from "../program-file-items-processor";
import type { Summary } from "../summary-collector";

export function createProgramFileEntries(entriesList: ProgramFileEntry[]): ProgramFileEntries {
	return Rec.fromEntries(entriesList.map((entry) => [entry.path, entry as ProgramFileEntry]));
}

export function createModule(parts: Partial<Module>) {
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
	} as unknown as Module;
}

export function createModulesCollection(modulesList: Module[]): ModulesCollection {
	return Rec.fromEntries(modulesList.map((module) => [module.path, module]));
}

export function createPackage(parts: Partial<Package>) {
	return {
		path: "",
		name: "",
		entryPoint: "",
		parent: null,
		modules: new Rec(),
		packages: [],
		...parts,
	} as unknown as Package;
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
