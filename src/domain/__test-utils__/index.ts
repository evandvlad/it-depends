import { expect } from "@jest/globals";

import type { AbsoluteFsPath } from "../../lib/fs-path";
import { Rec } from "../../lib/rec";
import type { FileEntries, FileEntry, FileItem, FileItems } from "../file-items-transformer";
import type { Module, Modules } from "../modules-collector";
import type { Package, Packages } from "../packages-collector";
import type { Summary } from "../summary-collector";

export async function* createFileItemsGenerator(
	fileItems: Array<Omit<FileItem, "path"> & { path: string }>,
): FileItems {
	for await (const fileItem of fileItems) {
		yield Promise.resolve(fileItem as FileItem);
	}
}

export function createFileEntries(fileEntriesList: Array<Omit<FileEntry, "path"> & { path: string }>): FileEntries {
	return Rec.fromEntries(
		fileEntriesList.map((fileEntry) => [fileEntry.path as AbsoluteFsPath, fileEntry as FileEntry]),
	);
}

export function createModule(parts: Record<string, unknown>) {
	return {
		path: "",
		name: "",
		package: null,
		language: "typescript",
		content: expect.any(String) as unknown as string,
		imports: [],
		exports: new Rec(),
		unparsedDynamicImportsCount: 0,
		shadowedExportValues: [],
		unresolvedFullImports: [],
		unresolvedFullExports: [],
		...parts,
	} as unknown as Module;
}

export function createModules(modulesList: Module[]): Modules {
	return Rec.fromEntries(modulesList.map((module) => [module.path, module]));
}

export function createPackage(parts: Record<string, unknown>) {
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

export function createPackages(packagesList: Package[]): Packages {
	return Rec.fromEntries(packagesList.map((pack) => [pack.path, pack]));
}

export function createSummary(parts: Record<string, unknown>): Summary {
	return {
		packagesCount: 0,
		modulesCounter: Rec.fromObject({
			typescript: 0,
			javascript: 0,
		}),
		unparsedDynamicImportsCounter: new Rec(),
		unresolvedFullImportsCounter: new Rec(),
		unresolvedFullExportsCounter: new Rec(),
		shadowedExportValuesCounter: new Rec(),
		outOfScopeImports: new Rec(),
		emptyExports: [],
		possiblyUnusedExportValues: new Rec(),
		incorrectImports: new Rec(),
		parserErrors: new Rec(),
		...parts,
	};
}
