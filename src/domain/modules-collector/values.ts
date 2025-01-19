import type { Rec } from "~/lib/rec";
import type { Language } from "../module-expert";

export type Aliases = Rec<string, string>;

export interface ImportSource {
	importPath: string;
	filePath?: string;
}

interface ImportData {
	importSource: ImportSource;
	values: string[];
}

export interface Module {
	path: string;
	name: string;
	package: string | null;
	language: Language;
	content: string;
	imports: ImportData[];
	exports: Rec<string, string[]>;
	unresolvedFullImports: ImportSource[];
	unresolvedFullExports: ImportSource[];
	shadowedExportValues: string[];
	unparsedDynamicImports: number;
}

export type ModulesCollection = Rec<string, Module>;
