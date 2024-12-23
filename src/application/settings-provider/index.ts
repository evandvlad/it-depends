import type { ImportAliasMapper } from "../../domain";
import { assert } from "../../lib/errors";
import { type AbsoluteFsPath, absoluteFsPath, isAbsolutePath, normalizePath } from "../../lib/fs-path";
import type { PathFilter } from "../file-items-generator";
import { loadConf } from "./conf-loader";
import type { Options, Settings } from "./values";

function assertAllAbsolutePaths(paths: string[], message: string) {
	assert(
		paths.every((path) => isAbsolutePath(path)),
		message,
	);
}

function normalizePaths(paths: AbsoluteFsPath[]) {
	return paths.map((path) => normalizePath(path));
}

export type { Options };

export async function createSettings({
	paths,
	pathFilter = () => true,
	importAliasMapper = () => null,
	extraPackageEntries = {},
	report,
}: Options): Promise<Settings> {
	const { version, reportStaticAssetsPath } = await loadConf();

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
