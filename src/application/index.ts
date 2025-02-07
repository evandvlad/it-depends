import { Domain, type Output } from "~/domain";
import { EventBus } from "~/lib/event-bus";
import type { Options } from "~/values";
import { Logger, type TerminalPort } from "./logger";
import {
	ProgramFileEntriesCollector,
	type DispatcherPort as ProgramFileEntriesCollectorDispatcherPort,
	type ProgramFileProcessorPort,
} from "./program-file-entries-collector";
import {
	ProgramFilesLoader,
	type DispatcherPort as ProgramFilesLoaderDispatcherPort,
	type FSysPort as ProgramFilesLoaderFSysPort,
} from "./program-files-loader";
import {
	type DispatcherPort as ReportGeneratorDispatcherPort,
	type FSysPort as ReportGeneratorFSysPort,
	generateReport,
} from "./report-generator";
import { type ConfLoaderPort, type FSysPort as SettingsProviderFSysPort, createSettings } from "./settings-provider";
import type { GlobalEventBusRecord, GlobalEventBusSubscriber } from "./values";

interface FSysPort extends SettingsProviderFSysPort, ProgramFilesLoaderFSysPort, ReportGeneratorFSysPort {}

export type { GlobalEventBusSubscriber };

interface Params {
	options: Options;
	fSysPort: FSysPort;
	terminalPort: TerminalPort;
	confLoaderPort: ConfLoaderPort;
	programFileProcessorPort: ProgramFileProcessorPort;
}

export class Application {
	on;

	#options;
	#fSysPort;
	#terminalPort;
	#confLoaderPort;
	#programFileProcessorPort;
	#eventBus;

	constructor({ options, fSysPort, terminalPort, confLoaderPort, programFileProcessorPort }: Params) {
		this.#options = options;
		this.#fSysPort = fSysPort;
		this.#terminalPort = terminalPort;
		this.#confLoaderPort = confLoaderPort;
		this.#programFileProcessorPort = programFileProcessorPort;

		this.#eventBus = new EventBus<GlobalEventBusRecord>();

		this.on = this.#eventBus.on;
	}

	async run(): Promise<Output> {
		let logger: Logger | null = null;

		try {
			if (!this.#options.turnOffLogging) {
				logger = new Logger({
					terminalPort: this.#terminalPort,
					subscriber: this.#eventBus,
				});
			}

			this.#eventBus.dispatch("app:started");

			const settings = await createSettings({
				options: this.#options,
				fSysPort: this.#fSysPort,
				confLoaderPort: this.#confLoaderPort,
				dispatcherPort: this.#eventBus,
			});

			const domain = new Domain({ settings });

			const programFileEntriesCollector = new ProgramFileEntriesCollector({
				programFileDetailsGetter: domain.programFileDetailsGetter,
				dispatcherPort: this.#eventBus as ProgramFileEntriesCollectorDispatcherPort,
				programFileProcessorPort: this.#programFileProcessorPort,
			});

			const programFilesLoader = new ProgramFilesLoader({
				fSysPort: this.#fSysPort,
				dispatcherPort: this.#eventBus as ProgramFilesLoaderDispatcherPort,
				pathFilter: domain.pathFilter,
			});

			const programFiles = await programFilesLoader.load(settings.paths);

			const programFileEntries = programFileEntriesCollector.collect(programFiles);

			const output = domain.process(programFileEntries);

			if (settings.report) {
				await generateReport({
					output,
					fSysPort: this.#fSysPort,
					settings: settings.report,
					dispatcherPort: this.#eventBus as ReportGeneratorDispatcherPort,
				});
			}

			this.#eventBus.dispatch("app:finished");

			return output;
		} catch (e) {
			logger?.acceptAppLevelError(e as Error);
			throw e;
		}
	}
}
