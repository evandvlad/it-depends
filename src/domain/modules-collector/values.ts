import type { Rec } from "~/lib/rec";
import type { Exports } from "../exports";
import type { Import } from "../import";
import type { Language } from "../program-file-expert";

export interface Module {
	path: string;
	name: string;
	package: string | null;
	language: Language;
	content: string;
	imports: Import[];
	exports: Exports;
	unresolvedFullImports: Import[];
	unresolvedFullExports: Import[];
	shadowedExportValues: string[];
	unparsedDynamicImports: number;
}

export type ModulesCollection = Rec<string, Module>;
