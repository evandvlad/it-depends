import type { DispatcherPort as ReportGeneratorDispatcherPort } from "~/application/report-generator";
import type { DispatcherPort as DomainDispatcherPort } from "~/domain";
import type { EventBusDispatcher, EventBusSubscriber } from "~/lib/event-bus";

type ExtractEventBusRecord<T> = T extends EventBusDispatcher<infer V> ? V : never;

export type GlobalEventBusRecord = ExtractEventBusRecord<DomainDispatcherPort> &
	ExtractEventBusRecord<ReportGeneratorDispatcherPort>;

export type GlobalEventBusSubscriber = EventBusSubscriber<GlobalEventBusRecord>;

export interface Options {
	paths: string[];
	pathFilter?: (path: string) => boolean;
	aliases?: Record<string, string>;
	extraPackageEntries?: { fileNames?: string[]; filePaths?: string[] };
	turnOffLogging?: boolean;
	report?: { path: string };
}
