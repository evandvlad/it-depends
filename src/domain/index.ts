import type { EventBusDispatcher } from "../lib/event-bus";
import { FSNavCursor } from "../lib/fs-nav-cursor";
import { type DispatcherRecord, type FileItems, type ParserErrors, transformFileItems } from "./file-items-transformer";
import {
	type ImportAliasMapper,
	type ImportData,
	type ImportSource,
	type Module,
	type Modules,
	collectModules,
} from "./modules-collector";
import { type ExtraPackageEntries, type Package, type Packages, PackagesCollector } from "./packages-collector";
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
	Module,
	Modules,
	Package,
	Packages,
	Summary,
	ImportAliasMapper,
	ParserErrors,
	ImportSource,
	ImportData,
	ExtraPackageEntries,
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
