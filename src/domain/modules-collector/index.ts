import type { FSTree } from "~/lib/fs-tree";
import type { FileEntries } from "../file-items-transformer";
import { bindModules } from "./binder";
import { ImportSourceResolver } from "./import-source-resolver";
import { ModuleFactory } from "./module-factory";
import type { Aliases, ImportSource, Module, ModulesCollection } from "./values";

interface Params {
	fileEntries: FileEntries;
	fSTree: FSTree;
	aliases: Aliases;
}

export type { Module, ModulesCollection, ImportSource, Aliases };

export function collectModules({ fSTree, fileEntries, aliases }: Params) {
	const importSourceResolver = new ImportSourceResolver({ fSTree, aliases });
	const moduleFactory = new ModuleFactory(importSourceResolver);
	const modulesCollection = fileEntries.mapValue((entry) => moduleFactory.create(entry));

	return bindModules(modulesCollection);
}
