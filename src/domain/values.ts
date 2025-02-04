import type { Rec } from "~/lib/rec";
import type { Module } from "./module";
import type { Package } from "./package";

export type Language = "typescript" | "javascript";

export const ieValueAll = "*";

export type IEItem =
	| { type: "standard-import"; source: string; values: string[] }
	| { type: "dynamic-import"; source: string | null }
	| { type: "re-export"; source: string; inputValues: string[]; outputValues: string[] }
	| { type: "standard-export"; values: string[] };

export interface ProgramFileEntry {
	path: string;
	content: string;
	language: Language;
	ieItems: IEItem[];
}

export type ProgramFileEntries = Rec<string, ProgramFileEntry>;

export type ProcessorErrors = Rec<string, Error>;

export interface ImportData {
	importPath: string;
	filePath: string | null;
	isDynamic: boolean;
	isRelative: boolean;
	isAlias: boolean;
	values: string[];
}

export type Exports = Rec<string, string[]>;

export type ModulesCollection = Rec<string, Module>;

export type PackagesCollection = Rec<string, Package>;
