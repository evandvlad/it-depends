import { assert } from "~/lib/errors";
import { FSTree } from "~/lib/fs-tree";
import { type ModulesCollection, collectModules } from "./modules-collector";
import { type PackagesCollection, PackagesCollector } from "./packages-collector";
import {
	type Aliases,
	type ExtraPackageEntries,
	type ProgramFileDetails,
	ProgramFileExpert,
} from "./program-file-expert";
import {
	type DispatcherPort,
	type IEItem,
	type ProgramFileItem,
	type ProgramFileItems,
	type ProgramFileProcessorPort,
	ieValueAll,
	processProgramFileItems,
} from "./program-file-items-processor";
import { type Summary, SummaryCollector } from "./summary-collector";

interface Settings {
	aliases: Aliases;
	pathFilter: (path: string) => boolean;
	extraPackageEntries: ExtraPackageEntries;
}

interface Params {
	dispatcherPort: DispatcherPort;
	programFileProcessorPort: ProgramFileProcessorPort;
	settings: Settings;
}

export interface Result {
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
	summary: Summary;
	fSTree: FSTree;
}

export type {
	IEItem,
	Aliases,
	ProgramFileItem,
	ProgramFileItems,
	DispatcherPort,
	ModulesCollection,
	PackagesCollection,
	Summary,
	ExtraPackageEntries,
	ProgramFileDetails,
};

export { ieValueAll };

export class Domain {
	#settings;
	#programFileExpert;
	#dispatcherPort;
	#programFileProcessorPort;

	constructor({ settings, dispatcherPort, programFileProcessorPort }: Params) {
		this.#settings = settings;
		this.#dispatcherPort = dispatcherPort;
		this.#programFileProcessorPort = programFileProcessorPort;
		this.#programFileExpert = new ProgramFileExpert({ settings });
	}

	pathFilter = (path: string) => {
		if (!this.#programFileExpert.isAcceptableFile(path)) {
			return false;
		}

		return this.#settings.pathFilter(path);
	};

	async process(items: ProgramFileItems): Promise<Result> {
		const { entries, processorErrors } = await processProgramFileItems({
			items,
			programFileExpert: this.#programFileExpert,
			programFileProcessorPort: this.#programFileProcessorPort,
			dispatcherPort: this.#dispatcherPort,
		});
		const allFilePaths = entries.toKeys();

		assert(
			allFilePaths.length > 0,
			"No files have been found for processing. It seems like a problem with the configuration.",
		);

		const fSTree = new FSTree(allFilePaths);
		const importSourceResolver = this.#programFileExpert.createImportSourceResolver({ fSTree });
		const modulesCollection = collectModules({ entries, importSourceResolver });

		const packagesCollector = new PackagesCollector({
			fSTree,
			modulesCollection,
			programFileExpert: this.#programFileExpert,
		});
		const packagesCollection = packagesCollector.collect();

		const summaryCollector = new SummaryCollector({ fSTree, modulesCollection, packagesCollection, processorErrors });
		const summary = summaryCollector.collect();

		return { modulesCollection, packagesCollection, summary, fSTree };
	}
}
