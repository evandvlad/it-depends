import { assert } from "~/lib/errors";
import { FSTree } from "~/lib/fs-tree";
import { type DispatcherPort, type FileItem, type FileItems, transformFileItems } from "./file-items-transformer";
import { type Aliases, type ModulesCollection, collectModules } from "./modules-collector";
import { type ExtraPackageEntries, type PackagesCollection, PackagesCollector } from "./packages-collector";
import { type Summary, SummaryCollector } from "./summary-collector";

interface Settings {
	aliases: Aliases;
	extraPackageEntries: ExtraPackageEntries;
}

interface Params {
	fileItems: FileItems;
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

export async function process({
	fileItems,
	dispatcherPort,
	settings: { aliases, extraPackageEntries },
}: Params): Promise<Result> {
	const { fileEntries, parserErrors } = await transformFileItems({ fileItems, dispatcherPort });
	const allFilePaths = fileEntries.toKeys();

	assert(
		allFilePaths.length > 0,
		"No files have been found for processing. It seems like a problem with the configuration.",
	);

	const fSTree = new FSTree(allFilePaths);
	const modulesCollection = collectModules({ fSTree, fileEntries, aliases });

	const packagesCollector = new PackagesCollector({
		fSTree,
		modulesCollection,
		extraPackageEntries,
	});
	const packagesCollection = packagesCollector.collect();

	const summaryCollector = new SummaryCollector({ fSTree, modulesCollection, packagesCollection, parserErrors });
	const summary = summaryCollector.collect();

	return { modulesCollection, packagesCollection, summary, fSTree };
}
