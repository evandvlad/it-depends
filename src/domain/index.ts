import type { EventBusDispatcher } from "../lib/event-bus";
import { FSNavCursor } from "../lib/fs-nav-cursor";
import { type DispatcherRecord, type FileItems, type ImportPath, transformFileItems } from "./file-items-transformer";
import { type ImportAliasMapper, type Modules, collectModules } from "./modules-collector";
import { type ExtraPackageEntries, type Packages, PackagesCollector } from "./packages-collector";
import { type Summary, SummaryCollector } from "./summary-collector";

interface Settings {
	importAliasMapper: ImportAliasMapper;
	extraPackageEntries: ExtraPackageEntries;
}

interface Params {
	fileItems: FileItems;
	dispatcher: EventBusDispatcher<DispatcherRecord>;
	settings: Settings;
}

interface Result {
	modules: Modules;
	packages: Packages;
	summary: Summary;
	fsNavCursor: FSNavCursor;
}

export type {
	FileItems,
	DispatcherRecord,
	Modules,
	Packages,
	Summary,
	ImportAliasMapper,
	ExtraPackageEntries,
	ImportPath,
};

export async function process({
	fileItems,
	dispatcher,
	settings: { importAliasMapper, extraPackageEntries },
}: Params): Promise<Result> {
	const { fileEntries, parserErrors } = await transformFileItems({ fileItems, dispatcher });

	const fsNavCursor = new FSNavCursor(fileEntries.toKeys());
	const modules = collectModules({ fsNavCursor, fileEntries, importAliasMapper });

	const packagesCollector = new PackagesCollector({
		fsNavCursor,
		modules,
		extraPackageEntries,
	});
	const packages = packagesCollector.collect();

	const summaryCollector = new SummaryCollector({ fsNavCursor, modules, packages, parserErrors });
	const summary = summaryCollector.collect();

	return { modules, packages, summary, fsNavCursor };
}
