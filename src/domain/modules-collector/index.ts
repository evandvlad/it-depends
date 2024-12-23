import type { FSNavCursor } from "../../lib/fs-nav-cursor";
import type { FileEntries } from "../file-items-transformer";
import { bindModules } from "./binder";
import { ImportSourceResolver } from "./import-source-resolver";
import { ModuleFactory } from "./module-factory";
import type { ImportAliasMapper, ImportData, ImportSource, Module, Modules } from "./values";

interface Params {
	fileEntries: FileEntries;
	fsNavCursor: FSNavCursor;
	importAliasMapper: ImportAliasMapper;
}

export type { Module, Modules, ImportSource, ImportAliasMapper, ImportData };

export function collectModules({ fsNavCursor, fileEntries, importAliasMapper }: Params) {
	const importSourceResolver = new ImportSourceResolver({ fsNavCursor, importAliasMapper });
	const moduleFactory = new ModuleFactory(importSourceResolver);
	const modules = fileEntries.mapValue((entry) => moduleFactory.create(entry));

	return bindModules(modules);
}
