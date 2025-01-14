import { FSTree } from "~/lib/fs-tree";
import {
	type DispatcherPort,
	type FileItem,
	type FileItems,
	type ImportPath,
	transformFileItems,
} from "./file-items-transformer";
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
	ImportPath,
};

export async function process({
	fileItems,
	dispatcherPort,
	settings: { aliases, extraPackageEntries },
}: Params): Promise<Result> {
	const { fileEntries, parserErrors } = await transformFileItems({ fileItems, dispatcherPort });

	const fSTree = new FSTree(fileEntries.toKeys());
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
