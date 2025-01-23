import type { Rec } from "~/lib/rec";
import type { Language } from "./program-file-expert";

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
