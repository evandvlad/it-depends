import { assert } from "~/lib/errors";
import { FSTree } from "~/lib/fs-tree";
import { type DispatcherPort, type FileItem, type FileItems, transformFileItems } from "./file-items-transformer";
import { type ModulesCollection, collectModules } from "./modules-collector";
import { type PackagesCollection, PackagesCollector } from "./packages-collector";
import { type Aliases, type ExtraPackageEntries, ProgramFileExpert } from "./program-file-expert";
import { type Summary, SummaryCollector } from "./summary-collector";

interface Settings {
	aliases: Aliases;
	pathFilter: (path: string) => boolean;
	extraPackageEntries: ExtraPackageEntries;
}

interface Params {
	dispatcherPort: DispatcherPort;
	settings: Settings;
}

export interface Result {
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
	summary: Summary;
	fSTree: FSTree;
}

export type {
	Aliases,
	FileItem,
	FileItems,
	DispatcherPort,
	ModulesCollection,
	PackagesCollection,
	Summary,
	ExtraPackageEntries,
};

export class Domain {
	#dispatcherPort;
	#settings;
	#programFileExpert;

	constructor({ dispatcherPort, settings }: Params) {
		this.#dispatcherPort = dispatcherPort;
		this.#settings = settings;
		this.#programFileExpert = new ProgramFileExpert({ settings });
	}

	pathFilter = (path: string) => {
		if (!this.#programFileExpert.isAcceptableFile(path)) {
			return false;
		}

		return this.#settings.pathFilter(path);
	};

	async process(fileItems: FileItems): Promise<Result> {
		const { fileEntries, parserErrors } = await transformFileItems({
			fileItems,
			programFileExpert: this.#programFileExpert,
			dispatcherPort: this.#dispatcherPort,
		});
		const allFilePaths = fileEntries.toKeys();

		assert(
			allFilePaths.length > 0,
			"No files have been found for processing. It seems like a problem with the configuration.",
		);

		const fSTree = new FSTree(allFilePaths);
		const importSourceResolver = this.#programFileExpert.createImportSourceResolver({ fSTree });
		const modulesCollection = collectModules({ fileEntries, importSourceResolver });

		const packagesCollector = new PackagesCollector({
			fSTree,
			modulesCollection,
			programFileExpert: this.#programFileExpert,
		});
		const packagesCollection = packagesCollector.collect();

		const summaryCollector = new SummaryCollector({ fSTree, modulesCollection, packagesCollection, parserErrors });
		const summary = summaryCollector.collect();

		return { modulesCollection, packagesCollection, summary, fSTree };
	}
}
