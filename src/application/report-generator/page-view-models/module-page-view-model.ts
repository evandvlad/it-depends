import type { Modules } from "../../../domain";
import type { FSNavCursor } from "../../../lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "../../../lib/fs-path";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: AbsoluteFsPath;
	fsNavCursor: FSNavCursor;
	pathInformer: PathInformer;
	modules: Modules;
}

export class ModulePageViewModel extends PageViewModel {
	readonly fullPath;
	readonly shortPath;
	readonly code;
	readonly numOfImports;
	readonly numOfExports;
	readonly packageLinkData;
	readonly unparsedDynamicImports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;
	readonly shadowedExportValues;

	#module;

	constructor({ version, path, pathInformer, fsNavCursor, modules }: Params) {
		super({ version, pathInformer, fsNavCursor });

		this.#module = modules.get(path);

		this.fullPath = path;
		this.shortPath = fsNavCursor.getShortPathByPath(path);

		const module = modules.get(path);

		this.packageLinkData = module.package ? this.getPackageLinkData(module.package) : null;
		this.unparsedDynamicImports = module.unparsedDynamicImports;
		this.shadowedExportValues = module.shadowedExportValues;

		this.code = module.content.split("\r\n").join("\n");

		this.unresolvedFullImports = module.unresolvedFullImports.map(({ importPath }) => importPath);
		this.unresolvedFullExports = module.unresolvedFullExports.map(({ importPath }) => importPath);

		this.numOfImports = module.imports.reduce((acc, { values }) => acc + values.length, 0);
		this.numOfExports = module.exports.reduce((acc, paths) => acc + paths.length, 0);
	}

	collectImportItems<T>(handler: (params: { name: string; moduleLink: LinkData | null; values: string[] }) => T) {
		return this.#module.imports.map(({ importSource, values }) =>
			handler({
				name: importSource.importPath,
				moduleLink: importSource.filePath ? this.getModuleLinkData(importSource.filePath) : null,
				values,
			}),
		);
	}

	collectExportItems<T>(handler: (params: { moduleLinks: LinkData[]; value: string }) => T) {
		return this.#module.exports.toEntries().map(([value, paths]) =>
			handler({
				value,
				moduleLinks: paths.map((path) => this.getModuleLinkData(path)),
			}),
		);
	}
}
