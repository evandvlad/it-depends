import type { ImportPath, ModulesCollection, Summary } from "~/domain";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: AbsoluteFsPath;
	fSTree: FSTree;
	pathInformer: PathInformer;
	modulesCollection: ModulesCollection;
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
	readonly shadowedExportValues;

	#summary;
	#pathInformer;
	#module;

	constructor({ version, path, pathInformer, fSTree, modulesCollection, summary }: Params) {
		super({ version, pathInformer, fSTree });

		this.#summary = summary;
		this.#pathInformer = pathInformer;
		this.#module = modulesCollection.get(path);

		this.fullPath = path;
		this.shortPath = fSTree.getShortPathByPath(path);
		this.language = this.#module.language;

		this.packageLinkData = this.#module.package ? this.getPackageLinkData(this.#module.package) : null;
		this.unparsedDynamicImports = this.#module.unparsedDynamicImports;
		this.shadowedExportValues = this.#module.shadowedExportValues;

		this.code = this.#module.content;

		this.numOfImports = this.#module.imports.reduce((acc, { values }) => acc + values.length, 0);
		this.numOfExports = this.#module.exports.reduce((acc, paths) => acc + paths.length, 0);
	}

	collectImportItems<T>(handler: (params: { name: string; linkData: LinkData | null; values: string[] }) => T) {
		return this.#module.imports.map(({ importSource, values }) =>
			handler({
				name: importSource.importPath,
				linkData: importSource.filePath ? this.getModuleLinkData(importSource.filePath) : null,
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

	collectOutOfScopeImports<T>(handler: (path: ImportPath) => T) {
		return this.#summary.outOfScopeImports.getOrDefault(this.fullPath, []).map((path) => handler(path));
	}

	collectUnresolvedFullImports<T>(handler: (path: ImportPath) => T) {
		return this.#module.unresolvedFullImports.map(({ importPath }) => handler(importPath));
	}

	collectUnresolvedFullExports<T>(handler: (path: ImportPath) => T) {
		return this.#module.unresolvedFullExports.map(({ importPath }) => handler(importPath));
	}
}
