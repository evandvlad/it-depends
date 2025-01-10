import type { EventBusDispatcher } from "~/lib/event-bus";
import type { AbsoluteFsPath } from "~/lib/fs-path";

export interface FSysPort {
	makeDir: (path: AbsoluteFsPath) => Promise<void>;
	removeDir: (path: AbsoluteFsPath) => Promise<void>;
	copy: (sourcePath: AbsoluteFsPath, destinationPath: AbsoluteFsPath) => Promise<void>;
	writeFile: (path: AbsoluteFsPath, content: string) => Promise<void>;
}

export interface ReportSettings {
	version: string;
	path: AbsoluteFsPath;
	staticAssetsPath: AbsoluteFsPath;
}

export type DispatcherPort = EventBusDispatcher<{
	"report-generation-started": [];
	"report-generation-completed": [];
}>;
