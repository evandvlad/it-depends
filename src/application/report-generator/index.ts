import type { ModulesCollection, PackagesCollection, Summary } from "~/domain";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import { indexPage, modulePage, packagePage } from "./html-pages";
import { IndexPageViewModel, ModulePageViewModel, PackagePageViewModel } from "./page-view-models";
import { PathInformer } from "./path-informer";
import { writeReport } from "./report-writer";
import type { DispatcherPort, FSysPort, ReportSettings } from "./values";

interface Params {
	settings: ReportSettings;
	dispatcherPort: DispatcherPort;
	fSysPort: FSysPort;
	summary: Summary;
	fSTree: FSTree;
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
}

export type { ReportSettings, DispatcherPort };

export async function generateReport({
	settings,
	dispatcherPort,
	fSysPort,
	summary,
	fSTree,
	modulesCollection,
	packagesCollection,
}: Params) {
	const pathInformer = new PathInformer({ rootPath: settings.path, fSTree });

	dispatcherPort.dispatch("report-generation-started");

	const { version } = settings;
	const htmlPages = new Rec<AbsoluteFsPath, string>();

	htmlPages.set(
		pathInformer.indexHtmlPagePath,
		indexPage(
			new IndexPageViewModel({ version, pathInformer, fSTree, summary, modulesCollection, packagesCollection }),
		),
	);

	modulesCollection.forEach(({ path }) => {
		htmlPages.set(
			pathInformer.getModuleHtmlPagePathByRealPath(path),
			modulePage(new ModulePageViewModel({ version, path, pathInformer, fSTree, modulesCollection, summary })),
		);
	});

	packagesCollection.forEach(({ path }) => {
		htmlPages.set(
			pathInformer.getPackageHtmlPagePathByRealPath(path),
			packagePage(new PackagePageViewModel({ version, path, pathInformer, fSTree, packagesCollection })),
		);
	});

	await writeReport({
		fSysPort,
		htmlPages,
		rootPath: pathInformer.rootPath,
		assetsPath: pathInformer.assetsPath,
		staticAssetsPath: settings.staticAssetsPath,
	});

	dispatcherPort.dispatch("report-generation-completed");
}
