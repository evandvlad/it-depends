import type { AbsoluteFsPath } from "../../lib/fs-path";
import type { Rec } from "../../lib/rec";
import type { ImportPath } from "../file-items-transformer";
import type { Language } from "../module-expert";

export type ImportAliasMapper = (path: ImportPath) => AbsoluteFsPath | null;

export interface ImportSource {
	importPath: ImportPath;
	filePath?: AbsoluteFsPath;
}

export interface ImportData {
	importSource: ImportSource;
	values: string[];
}

export interface Module {
	path: AbsoluteFsPath;
	name: string;
	package: AbsoluteFsPath | null;
	language: Language;
	content: string;
	imports: ImportData[];
	exports: Rec<string, AbsoluteFsPath[]>;
	unresolvedFullImports: ImportSource[];
	unresolvedFullExports: ImportSource[];
	shadowedExportValues: string[];
	unparsedDynamicImportsCount: number;
}

export type Modules = Rec<AbsoluteFsPath, Module>;
