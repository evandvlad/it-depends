import type { EventBusDispatcher } from "~/lib/event-bus";
import type { Rec } from "~/lib/rec";
import type { Language, ProgramFileDetails } from "../program-file-expert";

export interface ProgramFileItem {
	path: string;
	content: string;
}

export interface ProgramFileProcessorPort {
	process: (params: { content: string; programFileDetails: ProgramFileDetails }) => IEItem[];
}

export type DispatcherPort = EventBusDispatcher<{
	"program-files-processing:started": [];
	"program-files-processing:program-file-processed": [{ path: string }];
	"program-files-processing:program-file-processing-failed": [{ path: string; error: Error }];
	"program-files-processing:finished": [];
}>;

export type ProgramFileItems = AsyncGenerator<ProgramFileItem>;

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
