import type { PathFilter } from "../../application/file-items-generator";
import type { ReportSettings } from "../../application/report-generator";
import type { ExtraPackageEntries, ImportAliasMapper } from "../../domain";
import type { AbsoluteFsPath } from "../../lib/fs-path";

export const confFileName = ".it-depends-conf.js";

export interface Conf {
	version: string;
	reportStaticAssetsPath: AbsoluteFsPath;
}

export interface Options {
	paths: string[];
	pathFilter?: (path: string) => boolean;
	importAliasMapper?: (importPath: string) => string | null;
	extraPackageEntries?: { fileNames?: string[]; filePaths?: string[] };
	report?: { path: string };
}

export interface Settings {
	paths: AbsoluteFsPath[];
	pathFilter: PathFilter;
	importAliasMapper: ImportAliasMapper;
	extraPackageEntries: ExtraPackageEntries;
	report: ReportSettings | null;
}
