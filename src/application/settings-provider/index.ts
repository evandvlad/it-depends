import { OptionProcessor } from "./option-processor";
import type { ConfLoaderPort, FSysPort, Options, Settings } from "./values";

interface Params {
	options: Options;
	fSysPort: FSysPort;
	confLoaderPort: ConfLoaderPort;
}

export type { Options };

export async function createSettings({ options, fSysPort, confLoaderPort }: Params): Promise<Settings> {
	const optionProcessor = new OptionProcessor({ fSysPort });

	const { version, reportStaticAssetsPath } = await confLoaderPort.load();

	const report = await optionProcessor.processReport(options.report);

	return {
		paths: await optionProcessor.processPaths(options.paths),
		pathFilter: optionProcessor.processPathFilter(options.pathFilter),
		aliases: await optionProcessor.processAliases(options.aliases),
		extraPackageEntries: await optionProcessor.processExtraPackageEntries(options.extraPackageEntries),
		report: report ? { version, path: report.path, staticAssetsPath: reportStaticAssetsPath } : null,
	};
}
