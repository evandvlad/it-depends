import type { ExtraPackageEntries, PathFilter } from "~/values";
import { processCollections } from "./collections-processor";
import { FSTree } from "./fs-tree";
import { ModuleBuildersCollector } from "./module-builders-collector";
import { Output } from "./output";
import { PackagesCollector } from "./packages-collector";
import { type Aliases, type ProgramFileDetails, ProgramFileExpert } from "./program-file-expert";
import {
	type IEItem,
	type Language,
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

export type {
	IEItem,
	Aliases,
	ProgramFileEntry,
	ProgramFileDetails,
	ProcessorErrors,
	ProgramFileEntries,
	Output,
	Language,
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

	process({ entries, processorErrors }: { entries: ProgramFileEntries; processorErrors: ProcessorErrors }): Output {
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

		processCollections({ fSTree, packagesCollection, moduleBuildersCollection });

		const modulesCollection = moduleBuildersCollection.mapValue((moduleBuilder) => moduleBuilder.build());

		return new Output({ processorErrors, modulesCollection, packagesCollection, fSTree });
	}
}
