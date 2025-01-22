import type { FileEntries } from "../file-items-transformer";
import type { ImportSourceResolver } from "../program-file-expert";
import { bindModules } from "./binder";
import { ModuleFactory } from "./module-factory";
import type { Module, ModulesCollection } from "./values";

interface Params {
	fileEntries: FileEntries;
	importSourceResolver: ImportSourceResolver;
}

export type { Module, ModulesCollection };

export function collectModules({ fileEntries, importSourceResolver }: Params) {
	const moduleFactory = new ModuleFactory(importSourceResolver);
	const modulesCollection = fileEntries.mapValue((entry) => moduleFactory.create(entry));

	return bindModules(modulesCollection);
}
