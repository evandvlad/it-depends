import type { Modules, Summary } from "~/domain";
import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: AbsoluteFsPath;
	fsNavCursor: FSNavCursor;
	pathInformer: PathInformer;
	modules: Modules;
	summary: Summary;
}

export class ModulePageViewModel extends PageViewModel {
	readonly fullPath;
	readonly shortPath;
	readonly language;
	readonly code;
	readonly numOfImports;
	readonly numOfExports;
	readonly packageLinkData;
	readonly unparsedDynamicImports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;
	readonly shadowedExportValues;
	readonly outOfScopeImports;

	#summary;
	#pathInformer;
	#module;

	constructor({ version, path, pathInformer, fsNavCursor, modules, summary }: Params) {
		super({ version, pathInformer, fsNavCursor });

		this.#summary = summary;
		this.#pathInformer = pathInformer;
		this.#module = modules.get(path);

		this.fullPath = path;
		this.shortPath = fsNavCursor.getShortPathByPath(path);
		this.language = this.#module.language;

		const module = modules.get(path);

		this.packageLinkData = module.package ? this.getPackageLinkData(module.package) : null;
		this.unparsedDynamicImports = module.unparsedDynamicImports;
		this.shadowedExportValues = module.shadowedExportValues;

		this.code = module.content.split("\r\n").join("\n");

		this.unresolvedFullImports = module.unresolvedFullImports.map(({ importPath }) => importPath);
		this.unresolvedFullExports = module.unresolvedFullExports.map(({ importPath }) => importPath);

		this.numOfImports = module.imports.reduce((acc, { values }) => acc + values.length, 0);
		this.numOfExports = module.exports.reduce((acc, paths) => acc + paths.length, 0);

		this.outOfScopeImports = summary.outOfScopeImports.getOrDefault(path, []);
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

	collectExportItemsByValues<T>(handler: (params: { linksData: LinkData[]; value: string }) => T) {
		return this.#module.exports.toEntries().map(([value, paths]) =>
			handler({
				value,
				linksData: paths.map((path) => this.getModuleLinkData(path)),
			}),
		);
	}

	collectExportItemsByModules<T>(handler: (params: { linkData: LinkData; values: string[] }) => T) {
		const rec = this.#module.exports.reduce((acc, paths, value) => {
			paths.forEach((path) => {
				const values = acc.getOrDefault(path, []);
				values.push(value);
				acc.set(path, values);
			});

			return acc;
		}, new Rec<AbsoluteFsPath, string[]>());

		return rec.toEntries().map(([path, values]) =>
			handler({
				values,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectIncorrectImportItems<T>(handler: (linkData: LinkData) => T) {
		return this.#summary.incorrectImports.getOrDefault(this.fullPath, []).map(({ importPath, filePath }) =>
			handler({
				url: this.#pathInformer.getModuleHtmlPagePathByRealPath(filePath!),
				content: importPath,
			}),
		);
	}
}
