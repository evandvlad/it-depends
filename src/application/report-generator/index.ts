import type { Output } from "~/domain";
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
	output: Output;
}

export type { ReportSettings, DispatcherPort, FSysPort };

export async function generateReport({ settings, dispatcherPort, fSysPort, output }: Params) {
	const pathInformer = new PathInformer({ rootPath: settings.path, fs: output.fs });

	dispatcherPort.dispatch("report-generation:started");

	const { version } = settings;
	const htmlPages = new Rec<string, string>();

	htmlPages.set(pathInformer.indexHtmlPagePath, indexPage(new IndexPageViewModel({ version, pathInformer, output })));

	output.modules.getAllModules().forEach(({ path }) => {
		htmlPages.set(
			pathInformer.getModuleHtmlPagePathByRealPath(path),
			modulePage(new ModulePageViewModel({ version, path, pathInformer, output })),
		);
	});

	output.packages.getAllPackages().forEach(({ path }) => {
		htmlPages.set(
			pathInformer.getPackageHtmlPagePathByRealPath(path),
			packagePage(new PackagePageViewModel({ version, path, pathInformer, output })),
		);
	});

	await writeReport({
		fSysPort,
		htmlPages,
		rootPath: pathInformer.rootPath,
		assetsPath: pathInformer.assetsPath,
		staticAssetsPath: settings.staticAssetsPath,
	});

	dispatcherPort.dispatch("report-generation:finished", { path: pathInformer.indexHtmlPagePath });
}
