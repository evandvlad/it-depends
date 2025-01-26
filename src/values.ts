import type { DispatcherPort as DomainDispatcherPort } from "~/application/program-file-entries-collector";
import type { DispatcherPort as ProgramFilesLoaderDispatcherPort } from "~/application/program-files-loader";
import type { DispatcherPort as ReportGeneratorDispatcherPort } from "~/application/report-generator";
import type { DispatcherPort as SettingsProviderDispatcherPort } from "~/application/settings-provider";
import type { EventBusDispatcher, EventBusSubscriber } from "~/lib/event-bus";

type ExtractEventBusRecord<T> = T extends EventBusDispatcher<infer V> ? V : never;

export type GlobalEventBusRecord = ExtractEventBusRecord<DomainDispatcherPort> &
	ExtractEventBusRecord<ReportGeneratorDispatcherPort> &
	ExtractEventBusRecord<ProgramFilesLoaderDispatcherPort> &
	ExtractEventBusRecord<SettingsProviderDispatcherPort> & { "app:started": []; "app:finished": [] };

export type GlobalEventBusSubscriber = EventBusSubscriber<GlobalEventBusRecord>;

export type PathFilter = (params: { path: string; name: string; isFile: boolean }) => boolean;

export interface Options {
	paths: string[];
	pathFilter?: PathFilter;
	aliases?: Record<string, string>;
	extraPackageEntries?: { fileNames?: string[]; filePaths?: string[] };
	turnOffLogging?: boolean;
	report?: { path: string };
}
