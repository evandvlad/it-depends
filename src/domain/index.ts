import { FSTree } from "~/lib/fs-tree";
import type { ExtraPackageEntries, PathFilter } from "~/values";
import { type Module, type ModulesCollection, collectModules } from "./modules-collector";
import { type Package, type PackagesCollection, PackagesCollector } from "./packages-collector";
import { type Aliases, type ProgramFileDetails, ProgramFileExpert } from "./program-file-expert";
import { type Summary, SummaryCollector } from "./summary-collector";
import {
	type IEItem,
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
	Module,
	Package,
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
		const modulesCollection = collectModules({ entries, importSourceResolver });

		const packagesCollector = new PackagesCollector({
			fSTree,
			modulesCollection,
			programFileExpert: this.#programFileExpert,
		});
		const packagesCollection = packagesCollector.collect();

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
