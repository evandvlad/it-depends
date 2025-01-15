import { ConfLoader } from "~/adapters/conf-loader";
import { FSys } from "~/adapters/fsys";
import { Terminal } from "~/adapters/terminal";
import { createFileItemsGenerator } from "~/application/file-items-generator";
import { Logger } from "~/application/logger";
import { type DispatcherPort as ReportGeneratorDispatcherPort, generateReport } from "~/application/report-generator";
import { type Options, createSettings } from "~/application/settings-provider";
import {
	type DispatcherPort as DomainDispatcherPort,
	type ModulesCollection,
	type PackagesCollection,
	type Summary,
	process,
} from "~/domain";
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

			const fileItems = createFileItemsGenerator({
				fSysPort,
				paths: settings.paths,
				pathFilter: settings.pathFilter,
			});

			const { modulesCollection, packagesCollection, summary, fSTree } = await process({
				fileItems,
				settings,
				dispatcherPort: this.#eventBus as DomainDispatcherPort,
			});

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
