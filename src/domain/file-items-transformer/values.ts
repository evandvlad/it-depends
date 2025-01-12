import type { EventBusDispatcher } from "~/lib/event-bus";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { Rec } from "~/lib/rec";
import type { Language } from "../module-expert";

export type ImportPath = string & { __brand: "import-path" };

export function importPath(path: string) {
	return path as ImportPath;
}

export interface FileItem {
	path: AbsoluteFsPath;
	content: string;
}

export type DispatcherPort = EventBusDispatcher<{
	"file-item-processed": [{ path: AbsoluteFsPath }];
	"file-item-processing-failed": [{ path: AbsoluteFsPath; error: Error }];
	"all-file-items-processed": [];
}>;

export type FileItems = AsyncGenerator<FileItem>;

export const ieValueAll = "*";

export type IEItem =
	| { type: "standard-import"; source: ImportPath; values: string[] }
	| { type: "dynamic-import"; source: ImportPath | null }
	| { type: "re-export"; source: ImportPath; inputValues: string[]; outputValues: string[] }
	| { type: "standard-export"; values: string[] };

export interface FileEntry {
	path: AbsoluteFsPath;
	content: string;
	language: Language;
	ieItems: IEItem[];
}

export type FileEntries = Rec<AbsoluteFsPath, FileEntry>;

export type ParserErrors = Rec<AbsoluteFsPath, Error>;
