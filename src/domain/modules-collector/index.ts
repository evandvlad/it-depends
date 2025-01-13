import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import type { FileEntries } from "../file-items-transformer";
import { bindModules } from "./binder";
import { ImportSourceResolver } from "./import-source-resolver";
import { ModuleFactory } from "./module-factory";
import type { Aliases, ImportSource, Module, ModulesCollection } from "./values";

interface Params {
	fileEntries: FileEntries;
	fsNavCursor: FSNavCursor;
	aliases: Aliases;
}

export type { Module, ModulesCollection, ImportSource, Aliases };

export function collectModules({ fsNavCursor, fileEntries, aliases }: Params) {
	const importSourceResolver = new ImportSourceResolver({ fsNavCursor, aliases });
	const moduleFactory = new ModuleFactory(importSourceResolver);
	const modulesCollection = fileEntries.mapValue((entry) => moduleFactory.create(entry));

	return bindModules(modulesCollection);
}
