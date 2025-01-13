import type { PathFilter } from "~/application/file-items-generator";
import type { ReportSettings } from "~/application/report-generator";
import type { Aliases, ExtraPackageEntries } from "~/domain";
import type { AbsoluteFsPath } from "~/lib/fs-path";

export interface Options {
	paths: string[];
	pathFilter?: (path: string) => boolean;
	aliases?: Record<string, string>;
	extraPackageEntries?: { fileNames?: string[]; filePaths?: string[] };
	report?: { path: string };
}

export interface Settings {
	paths: AbsoluteFsPath[];
	pathFilter: PathFilter;
	aliases: Aliases;
	extraPackageEntries: ExtraPackageEntries;
	report: ReportSettings | null;
}
