import type { DispatcherPort as DomainDispatcherPort } from "~/application/program-file-entries-collector";
import type { DispatcherPort as ReportGeneratorDispatcherPort } from "~/application/report-generator";
import type { EventBusDispatcher, EventBusSubscriber } from "~/lib/event-bus";
import type { DispatcherPort as SettingsProviderDispatcherPort } from "./application/settings-provider";

type ExtractEventBusRecord<T> = T extends EventBusDispatcher<infer V> ? V : never;

export type GlobalEventBusRecord = ExtractEventBusRecord<DomainDispatcherPort> &
	ExtractEventBusRecord<ReportGeneratorDispatcherPort> &
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
