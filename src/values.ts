export interface ExtraPackageEntries {
	fileNames: string[];
	filePaths: string[];
}

export type PathFilter = (params: { path: string; name: string; isFile: boolean }) => boolean;

export interface Options {
	paths: string[];
	pathFilter?: PathFilter;
	aliases?: Record<string, string>;
	extraPackageEntries?: Partial<ExtraPackageEntries>;
	turnOffLogging?: boolean;
	report?: { path: string };
}
