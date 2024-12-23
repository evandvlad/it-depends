import { createFileItemsGenerator } from "./application/file-items-generator";
import {
	type DispatcherRecord as ReportGeneratorDispatcherRecord,
	generateReport,
} from "./application/report-generator";
import { type Options, createSettings } from "./application/settings-provider";
import {
	type DispatcherRecord as DomainDispatcherRecord,
	type Modules,
	type Packages,
	type Summary,
	process,
} from "./domain";
import { AppError } from "./lib/errors";
import { EventBus, type EventBusDispatcher, type EventBusSubscriber } from "./lib/event-bus";

type EventBusRecord = DomainDispatcherRecord & ReportGeneratorDispatcherRecord;

interface Result {
	modules: Modules;
	packages: Packages;
	summary: Summary;
}

export { AppError };

export class ItDepends implements EventBusSubscriber<EventBusRecord> {
	on;

	#options;
	#eventBus;

	constructor(options: Options) {
		this.#options = options;

		this.#eventBus = new EventBus<EventBusRecord>();

		this.on = this.#eventBus.on;
	}

	run = async (): Promise<Result> => {
		const settings = await createSettings(this.#options);

		const fileItems = createFileItemsGenerator(settings);

		const { modules, packages, summary, fsNavCursor } = await process({
			fileItems,
			settings,
			dispatcher: this.#eventBus as EventBusDispatcher<DomainDispatcherRecord>,
		});

		if (settings.report) {
			await generateReport({
				modules,
				packages,
				summary,
				fsNavCursor,
				settings: settings.report,
				dispatcher: this.#eventBus as EventBusDispatcher<ReportGeneratorDispatcherRecord>,
			});
		}

		return { modules, packages, summary };
	};
}
