import { ConfLoader } from "~/adapters/conf-loader";
import { FSys } from "~/adapters/fsys";
import { ProgramFileProcessor } from "~/adapters/program-file-processor";
import { Terminal } from "~/adapters/terminal";
import { Logger } from "~/application/logger";
import {
	type DispatcherPort as ProgramFileEntriesCollectorDispatcherPort,
	ProgramFilesEntriesCollector,
} from "~/application/program-file-entries-collector";
import { createProgramFileItemsGenerator } from "~/application/program-file-items-generator";
import { type DispatcherPort as ReportGeneratorDispatcherPort, generateReport } from "~/application/report-generator";
import { type Options, createSettings } from "~/application/settings-provider";
import { Domain, type ModulesCollection, type PackagesCollection, type Summary } from "~/domain";
import { AppError } from "~/lib/errors";
import { EventBus } from "~/lib/event-bus";
import type { GlobalEventBusRecord, GlobalEventBusSubscriber } from "./values";

interface Result {
	summary: Summary;
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
}

export { AppError };

export class ItDepends implements GlobalEventBusSubscriber {
	on;

	#options;
	#eventBus;

	constructor(options: Options) {
		this.#options = options;

		this.#eventBus = new EventBus<GlobalEventBusRecord>();

		this.on = this.#eventBus.on;
	}

	run = async (): Promise<Result> => {
		let logger: Logger | null = null;

		try {
			const fSysPort = new FSys();
			const programFileProcessor = new ProgramFileProcessor();
			const confLoaderPort = new ConfLoader(__dirname);

			if (!this.#options.turnOffLogging) {
				logger = new Logger({
					terminalPort: new Terminal(),
					subscriberPort: this.#eventBus,
				});
			}

			this.#eventBus.dispatch("app:started");

			const settings = await createSettings({
				options: this.#options,
				fSysPort,
				confLoaderPort,
				dispatcherPort: this.#eventBus,
			});

			const domain = new Domain({ settings });

			const programFileEntriesCollector = new ProgramFilesEntriesCollector({
				programFileDetailsGetter: domain.programFileDetailsGetter,
				dispatcherPort: this.#eventBus as ProgramFileEntriesCollectorDispatcherPort,
				programFileProcessorPort: programFileProcessor,
			});

			const programFileItems = createProgramFileItemsGenerator({
				fSysPort,
				paths: settings.paths,
				pathFilter: domain.pathFilter,
			});

			const programFileEntries = await programFileEntriesCollector.collect(programFileItems);

			const { modulesCollection, packagesCollection, summary, fSTree } = domain.process(programFileEntries);

			if (settings.report) {
				await generateReport({
					fSysPort,
					summary,
					fSTree,
					modulesCollection,
					packagesCollection,
					settings: settings.report,
					dispatcherPort: this.#eventBus as ReportGeneratorDispatcherPort,
				});
			}

			this.#eventBus.dispatch("app:finished");

			return { modulesCollection, packagesCollection, summary };
		} catch (e) {
			logger?.acceptAppLevelError(e as Error);
			throw e;
		}
	};
}
