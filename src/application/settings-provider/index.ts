import type { Options } from "../../values";
import { OptionProcessor } from "./option-processor";
import type { ConfLoaderPort, DispatcherPort, FSysPort, Settings } from "./values";

interface Params {
	options: Options;
	fSysPort: FSysPort;
	confLoaderPort: ConfLoaderPort;
	dispatcherPort: DispatcherPort;
}

export type { Options, DispatcherPort };

export async function createSettings({ options, fSysPort, confLoaderPort, dispatcherPort }: Params): Promise<Settings> {
	dispatcherPort.dispatch("settings-preparation:started");

	const optionProcessor = new OptionProcessor({ fSysPort });

	const { version, reportStaticAssetsPath } = await confLoaderPort.load();

	const report = await optionProcessor.processReport(options.report);

	const settings = {
		paths: await optionProcessor.processPaths(options.paths),
		pathFilter: optionProcessor.processPathFilter(options.pathFilter),
		aliases: await optionProcessor.processAliases(options.aliases),
		extraPackageEntries: await optionProcessor.processExtraPackageEntries(options.extraPackageEntries),
		report: report ? { version, path: report.path, staticAssetsPath: reportStaticAssetsPath } : null,
	};

	dispatcherPort.dispatch("settings-preparation:finished");

	return settings;
}
