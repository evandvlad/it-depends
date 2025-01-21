import { assert } from "~/lib/errors";
import { FSTree } from "~/lib/fs-tree";
import { type DispatcherPort, type FileItem, type FileItems, transformFileItems } from "./file-items-transformer";
import { isAcceptableFile } from "./module-expert";
import { type Aliases, type ModulesCollection, collectModules } from "./modules-collector";
import { type ExtraPackageEntries, type PackagesCollection, PackagesCollector } from "./packages-collector";
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

	constructor({ dispatcherPort, settings }: Params) {
		this.#dispatcherPort = dispatcherPort;
		this.#settings = settings;
	}

	pathFilter = (path: string) => {
		if (!isAcceptableFile(path)) {
			return false;
		}

		return this.#settings.pathFilter(path);
	};

	async process(fileItems: FileItems): Promise<Result> {
		const { fileEntries, parserErrors } = await transformFileItems({
			fileItems,
			dispatcherPort: this.#dispatcherPort,
		});
		const allFilePaths = fileEntries.toKeys();

		assert(
			allFilePaths.length > 0,
			"No files have been found for processing. It seems like a problem with the configuration.",
		);

		const fSTree = new FSTree(allFilePaths);
		const modulesCollection = collectModules({ fSTree, fileEntries, aliases: this.#settings.aliases });

		const packagesCollector = new PackagesCollector({
			fSTree,
			modulesCollection,
			extraPackageEntries: this.#settings.extraPackageEntries,
		});
		const packagesCollection = packagesCollector.collect();

		const summaryCollector = new SummaryCollector({ fSTree, modulesCollection, packagesCollection, parserErrors });
		const summary = summaryCollector.collect();

		return { modulesCollection, packagesCollection, summary, fSTree };
	}
}
