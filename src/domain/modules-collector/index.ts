import type { ImportSourceResolver } from "../program-file-expert";
import type { ProgramFileEntries } from "../values";
import { bindModules } from "./binder";
import { ModuleFactory } from "./module-factory";
import type { Module, ModulesCollection } from "./values";

interface Params {
	entries: ProgramFileEntries;
	importSourceResolver: ImportSourceResolver;
}

export type { Module, ModulesCollection };

export function collectModules({ entries, importSourceResolver }: Params) {
	const moduleFactory = new ModuleFactory(importSourceResolver);
	const modulesCollection = entries.mapValue((entry) => moduleFactory.create(entry));

	return bindModules(modulesCollection);
}
