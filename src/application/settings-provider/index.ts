import type { AbsoluteFsPath } from "~/lib/fs-path";
import { processOptions } from "./options-processor";
import type { Options, Settings } from "./values";

interface Conf {
	version: string;
	reportStaticAssetsPath: AbsoluteFsPath;
}

interface ConfLoaderPort {
	load: () => Promise<Conf>;
}

interface Params {
	options: Options;
	confLoaderPort: ConfLoaderPort;
}

export type { Options };

export async function createSettings({ options, confLoaderPort }: Params): Promise<Settings> {
	const { version, reportStaticAssetsPath } = await confLoaderPort.load();

	const { paths, pathFilter, extraPackageEntries, aliases, report } = processOptions({ options });

	return {
		paths,
		pathFilter,
		aliases,
		extraPackageEntries,
		report: report ? { version, path: report.path, staticAssetsPath: reportStaticAssetsPath } : null,
	};
}
