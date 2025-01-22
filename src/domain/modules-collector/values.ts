import type { Rec } from "~/lib/rec";
import type { ImportSource, Language } from "../program-file-expert";

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
