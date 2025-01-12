import { ConfLoader } from "~/adapters/conf-loader";
import { FSys } from "~/adapters/fsys";
import { type GlobalEventBusSubscriber, createGlobalEventBus } from "~/adapters/global-event-bus";
import { createFileItemsGenerator } from "~/application/file-items-generator";
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

		this.#eventBus = createGlobalEventBus();

		this.on = this.#eventBus.on;
	}

	run = async (): Promise<Result> => {
		const fSysPort = new FSys();
		const confLoaderPort = new ConfLoader(__dirname);

		const settings = await createSettings({ options: this.#options, confLoaderPort });

		const fileItems = createFileItemsGenerator({
			fSysPort,
			paths: settings.paths,
			pathFilter: settings.pathFilter,
		});

		const { modulesCollection, packagesCollection, summary, fsNavCursor } = await process({
			fileItems,
			settings,
			dispatcherPort: this.#eventBus as DomainDispatcherPort,
		});

		if (settings.report) {
			await generateReport({
				fSysPort,
				summary,
				fsNavCursor,
				modulesCollection,
				packagesCollection,
				settings: settings.report,
				dispatcherPort: this.#eventBus as ReportGeneratorDispatcherPort,
			});
		}

		return { modulesCollection, packagesCollection, summary };
	};
}
