import type { EventBusDispatcher } from "~/lib/event-bus";
import type { ProgramFileDetails } from "../program-file-expert";
import type { ProgramFileEntry } from "../values";

export interface ProgramFileItem {
	path: string;
	content: string;
}

export interface ProgramFileProcessorPort {
	process: (params: { path: string; content: string; details: ProgramFileDetails }) => ProgramFileEntry;
}

export type DispatcherPort = EventBusDispatcher<{
	"program-files-processing:started": [];
	"program-files-processing:program-file-processed": [{ path: string }];
	"program-files-processing:program-file-processing-failed": [{ path: string; error: Error }];
	"program-files-processing:finished": [];
}>;

export type ProgramFileItems = AsyncGenerator<ProgramFileItem>;
