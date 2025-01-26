import type { EventBusDispatcher, EventBusSubscriber } from "~/lib/event-bus";
import type { DispatcherPort as ProgramFileEntriesCollectorDispatcherPort } from "./program-file-entries-collector";
import type { DispatcherPort as ProgramFilesLoaderDispatcherPort } from "./program-files-loader";
import type { DispatcherPort as ReportGeneratorDispatcherPort } from "./report-generator";
import type { DispatcherPort as SettingsProviderDispatcherPort } from "./settings-provider";

type ExtractEventBusRecord<T> = T extends EventBusDispatcher<infer V> ? V : never;

export type GlobalEventBusRecord = ExtractEventBusRecord<ProgramFileEntriesCollectorDispatcherPort> &
	ExtractEventBusRecord<ReportGeneratorDispatcherPort> &
	ExtractEventBusRecord<ProgramFilesLoaderDispatcherPort> &
	ExtractEventBusRecord<SettingsProviderDispatcherPort> & { "app:started": []; "app:finished": [] };

export type GlobalEventBusSubscriber = EventBusSubscriber<GlobalEventBusRecord>;
