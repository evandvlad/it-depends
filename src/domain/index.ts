import { FSNavCursor } from "~/lib/fs-nav-cursor";
import {
	type DispatcherPort,
	type FileItem,
	type FileItems,
	type ImportPath,
	transformFileItems,
} from "./file-items-transformer";
import { type ImportAliasMapper, type ModulesCollection, collectModules } from "./modules-collector";
import { type ExtraPackageEntries, type PackagesCollection, PackagesCollector } from "./packages-collector";
import { type Summary, SummaryCollector } from "./summary-collector";

interface Settings {
	importAliasMapper: ImportAliasMapper;
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
	fsNavCursor: FSNavCursor;
}

export type {
	FileItem,
	FileItems,
	DispatcherPort,
	ModulesCollection,
	PackagesCollection,
	Summary,
	ImportAliasMapper,
	ExtraPackageEntries,
	ImportPath,
};

export async function process({
	fileItems,
	dispatcherPort,
	settings: { importAliasMapper, extraPackageEntries },
}: Params): Promise<Result> {
	const { fileEntries, parserErrors } = await transformFileItems({ fileItems, dispatcherPort });

	const fsNavCursor = new FSNavCursor(fileEntries.toKeys());
	const modulesCollection = collectModules({ fsNavCursor, fileEntries, importAliasMapper });

	const packagesCollector = new PackagesCollector({
		fsNavCursor,
		modulesCollection,
		extraPackageEntries,
	});
	const packagesCollection = packagesCollector.collect();

	const summaryCollector = new SummaryCollector({ fsNavCursor, modulesCollection, packagesCollection, parserErrors });
	const summary = summaryCollector.collect();

	return { modulesCollection, packagesCollection, summary, fsNavCursor };
}
