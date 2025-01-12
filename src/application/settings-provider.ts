import type { PathFilter } from "~/application/file-items-generator";
import type { ReportSettings } from "~/application/report-generator";
import type { ExtraPackageEntries, ImportAliasMapper } from "~/domain";
import { assert } from "~/lib/errors";
import { type AbsoluteFsPath, absoluteFsPath, isAbsolutePath, normalizePath } from "~/lib/fs-path";

function normalizePaths(paths: AbsoluteFsPath[]) {
	return paths.map((path) => normalizePath(path));
}

function assertAllAbsolutePaths(paths: string[], message: string) {
	assert(
		paths.every((path) => isAbsolutePath(path)),
		message,
	);
}

interface Conf {
	version: string;
	reportStaticAssetsPath: AbsoluteFsPath;
}

interface ConfLoaderPort {
	load: () => Promise<Conf>;
}

export interface Options {
	paths: string[];
	pathFilter?: (path: string) => boolean;
	importAliasMapper?: (importPath: string) => string | null;
	extraPackageEntries?: { fileNames?: string[]; filePaths?: string[] };
	report?: { path: string };
}

interface Settings {
	paths: AbsoluteFsPath[];
	pathFilter: PathFilter;
	importAliasMapper: ImportAliasMapper;
	extraPackageEntries: ExtraPackageEntries;
	report: ReportSettings | null;
}

interface Params {
	options: Options;
	confLoaderPort: ConfLoaderPort;
}

export async function createSettings({
	options: { paths, pathFilter = () => true, importAliasMapper = () => null, extraPackageEntries = {}, report },
	confLoaderPort,
}: Params): Promise<Settings> {
	const { version, reportStaticAssetsPath } = await confLoaderPort.load();

	assert(paths.length > 0, "Empty paths");
	assertAllAbsolutePaths(paths, "All paths should be absolute");

	const { filePaths = [], fileNames = [] } = extraPackageEntries;

	assertAllAbsolutePaths(filePaths, "All paths for package entries should be absolute");

	if (report) {
		assert(isAbsolutePath(report.path), "Path for report should be absolute");
	}

	return {
		paths: normalizePaths(paths as AbsoluteFsPath[]),
		pathFilter: pathFilter as PathFilter,
		importAliasMapper: importAliasMapper as ImportAliasMapper,
		extraPackageEntries: {
			fileNames,
			filePaths: normalizePaths(filePaths as AbsoluteFsPath[]),
		},
		report: report ? { version, path: absoluteFsPath(report.path), staticAssetsPath: reportStaticAssetsPath } : null,
	};
}
