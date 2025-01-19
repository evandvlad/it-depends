import type { EventBusDispatcher } from "~/lib/event-bus";

export interface FSysPort {
	makeDir: (path: string) => Promise<void>;
	removeDir: (path: string) => Promise<void>;
	copy: (sourcePath: string, destinationPath: string) => Promise<void>;
	writeFile: (path: string, content: string) => Promise<void>;
}

export interface ReportSettings {
	version: string;
	path: string;
	staticAssetsPath: string;
}

export type DispatcherPort = EventBusDispatcher<{
	"report-generation:started": [];
	"report-generation:finished": [{ path: string }];
}>;
