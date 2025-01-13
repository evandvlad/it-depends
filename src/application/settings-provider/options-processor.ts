import type { PathFilter } from "~/application/file-items-generator";
import type { ExtraPackageEntries } from "~/domain";
import { assert } from "~/lib/errors";
import { type AbsoluteFsPath, isAbsolutePath, normalizePath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { Options } from "./values";

interface Params {
	options: Options;
}

function processPaths(paths: string[]) {
	assert(paths.length > 0, "Empty paths");

	assert(
		paths.every((path) => isAbsolutePath(path)),
		"All paths should be absolute",
	);

	return paths.map((path) => normalizePath(path));
}

function processPathFilter(filter?: (path: string) => boolean) {
	return (filter ?? (() => true)) as PathFilter;
}

function processAliases(rawAliases?: Record<string, string>) {
	const aliases = Rec.fromObject((rawAliases ?? {}) as Record<string, AbsoluteFsPath>);

	assert(
		aliases.toValues().every((path) => isAbsolutePath(path)),
		"All paths for aliases should be absolute",
	);

	return aliases.mapValue((path) => normalizePath(path));
}

function processExtraPackageEntries(rawEntries?: { filePaths?: string[]; fileNames?: string[] }) {
	const entries = {
		fileNames: [],
		filePaths: [],
		...rawEntries,
	} as ExtraPackageEntries;

	assert(
		entries.filePaths.every((path) => isAbsolutePath(path)),
		"All paths for package entries should be absolute",
	);

	entries.filePaths = entries.filePaths.map((path) => normalizePath(path));

	return entries;
}

function processReport(report?: { path: string }) {
	if (!report) {
		return null;
	}

	assert(isAbsolutePath(report.path), "Path for report should be absolute");

	return {
		path: normalizePath(report.path),
	};
}

export function processOptions({ options: { paths, pathFilter, extraPackageEntries, aliases, report } }: Params) {
	return {
		paths: processPaths(paths),
		pathFilter: processPathFilter(pathFilter),
		aliases: processAliases(aliases),
		extraPackageEntries: processExtraPackageEntries(extraPackageEntries),
		report: processReport(report),
	};
}
