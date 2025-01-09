import type { DispatcherPort as ReportGeneratorDispatcherPort } from "../application/report-generator";
import type { DispatcherPort as DomainDispatcherPort } from "../domain";
import { EventBus, type EventBusDispatcher, type EventBusSubscriber } from "../lib/event-bus";

type ExtractRecord<T> = T extends EventBusDispatcher<infer V> ? V : never;

type GlobalEventBusRecord = ExtractRecord<DomainDispatcherPort> & ExtractRecord<ReportGeneratorDispatcherPort>;

export type GlobalEventBusSubscriber = EventBusSubscriber<GlobalEventBusRecord>;

export function createGlobalEventBus() {
	return new EventBus<GlobalEventBusRecord>();
}
