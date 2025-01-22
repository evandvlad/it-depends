import type { EventBusDispatcher } from "~/lib/event-bus";
import type { Rec } from "~/lib/rec";
import type { Language } from "../program-file-expert";

export interface FileItem {
	path: string;
	content: string;
}

export type DispatcherPort = EventBusDispatcher<{
	"files-transformation:started": [];
	"files-transformation:file-processed": [{ path: string }];
	"files-transformation:file-processing-failed": [{ path: string; error: Error }];
	"files-transformation:finished": [];
}>;

export type FileItems = AsyncGenerator<FileItem>;

export const ieValueAll = "*";

export type IEItem =
	| { type: "standard-import"; source: string; values: string[] }
	| { type: "dynamic-import"; source: string | null }
	| { type: "re-export"; source: string; inputValues: string[]; outputValues: string[] }
	| { type: "standard-export"; values: string[] };

export interface FileEntry {
	path: string;
	content: string;
	language: Language;
	ieItems: IEItem[];
}

export type FileEntries = Rec<string, FileEntry>;

export type ParserErrors = Rec<string, Error>;
