import type { Output } from "~/domain";
import { Rec } from "~/lib/rec";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: string;
	pathInformer: PathInformer;
	output: Output;
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

	#output;
	#pathInformer;
	#module;

	constructor({ version, path, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		this.#output = output;
		this.#pathInformer = pathInformer;
		this.#module = this.#output.modulesCollection.get(path);

		this.fullPath = path;
		this.shortPath = this.#output.fSTree.getShortPathByPath(path);
		this.language = this.#module.language;

		this.packageLinkData = this.#module.package ? this.getPackageLinkData(this.#module.package) : null;
		this.unparsedDynamicImports = this.#module.unparsedDynamicImports;
		this.shadowedExportValues = this.#module.shadowedExportValues;

		this.code = this.#module.content;

		this.numOfImports = this.#module.imports.reduce((acc, { values }) => acc + values.length, 0);
		this.numOfExports = this.#module.exports.reduce((acc, paths) => acc + paths.length, 0);
	}

	collectImportItems<T>(handler: (params: { name: string; linkData: LinkData | null; values: string[] }) => T) {
		return this.#module.imports
			.toSorted((first, second) => second.values.length - first.values.length)
			.map((imp) =>
				handler({
					name: imp.importPath,
					linkData: imp.filePath ? this.getModuleLinkData(imp.filePath) : null,
					values: imp.values,
				}),
			);
	}

	collectExportItemsByValues<T>(handler: (params: { linksData: LinkData[]; value: string }) => T) {
		return this.#module.exports
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([value, paths]) =>
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
		}, new Rec<string, string[]>());

		return rec
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, values]) =>
				handler({
					values,
					linkData: this.getModuleLinkData(path),
				}),
			);
	}

	collectIncorrectImportItems<T>(handler: (linkData: LinkData) => T) {
		return this.#output.summary.incorrectImports.getOrDefault(this.fullPath, []).map(({ importPath, filePath }) =>
			handler({
				url: this.#pathInformer.getModuleHtmlPagePathByRealPath(filePath!),
				content: importPath,
			}),
		);
	}

	collectOutOfScopeImports<T>(handler: (path: string) => T) {
		return this.#output.summary.outOfScopeImports.getOrDefault(this.fullPath, []).map((path) => handler(path));
	}

	collectUnresolvedFullImports<T>(handler: (path: string) => T) {
		return this.#module.unresolvedFullImports.map(({ importPath }) => handler(importPath));
	}

	collectUnresolvedFullExports<T>(handler: (path: string) => T) {
		return this.#module.unresolvedFullExports.map(({ importPath }) => handler(importPath));
	}
}
