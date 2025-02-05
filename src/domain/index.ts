import { FSTree } from "~/lib/fs-tree";
import type { ExtraPackageEntries, PathFilter } from "~/values";
import { ModuleBuildersCollector } from "./module-builders-collector";
import { PackagesCollector } from "./packages-collector";
import { type Aliases, type ProgramFileDetails, ProgramFileExpert } from "./program-file-expert";
import { type Summary, SummaryCollector } from "./summary-collector";
import {
	type IEItem,
	type ModulesCollection,
	type PackagesCollection,
	type ProcessorErrors,
	type ProgramFileEntries,
	type ProgramFileEntry,
	ieValueAll,
} from "./values";

interface Settings {
	aliases: Aliases;
	pathFilter: PathFilter;
	extraPackageEntries: ExtraPackageEntries;
}

interface Params {
	settings: Settings;
}

interface Result {
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
	summary: Summary;
	fSTree: FSTree;
}

export type {
	IEItem,
	Aliases,
	ProgramFileEntry,
	ModulesCollection,
	PackagesCollection,
	Summary,
	ProgramFileDetails,
	ProcessorErrors,
	ProgramFileEntries,
};

export { ieValueAll };

export class Domain {
	#settings;
	#programFileExpert;

	constructor({ settings }: Params) {
		this.#settings = settings;
		this.#programFileExpert = new ProgramFileExpert({ settings });
	}

	pathFilter: PathFilter = (params) => {
		if (params.isFile && !this.#programFileExpert.isAcceptableFile(params.path)) {
			return false;
		}

		return this.#settings.pathFilter(params);
	};

	programFileDetailsGetter = (path: string) => {
		return this.#programFileExpert.getDetails(path);
	};

	process({ entries, processorErrors }: { entries: ProgramFileEntries; processorErrors: ProcessorErrors }): Result {
		const allFilePaths = entries.toKeys();

		const fSTree = new FSTree(allFilePaths);
		const importSourceResolver = this.#programFileExpert.createImportSourceResolver({ fSTree });

		const moduleBuildersCollector = new ModuleBuildersCollector({ importSourceResolver });
		const moduleBuildersCollection = moduleBuildersCollector.collect(entries);

		const packagesCollector = new PackagesCollector({
			fSTree,
			moduleBuildersCollection,
			programFileExpert: this.#programFileExpert,
		});

		const packagesCollection = packagesCollector.collect();
		const modulesCollection = moduleBuildersCollection.mapValue((moduleBuilder) => moduleBuilder.build());

		const summaryCollector = new SummaryCollector({
			fSTree,
			modulesCollection,
			packagesCollection,
			processorErrors,
		});
		const summary = summaryCollector.collect();

		return { modulesCollection, packagesCollection, summary, fSTree };
	}
}
