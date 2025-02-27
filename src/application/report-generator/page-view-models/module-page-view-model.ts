import type { Output } from "~/domain";
import type { ReadonlyRec } from "~/lib/rec";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";

interface Params {
	version: string;
	path: string;
	pathInformer: PathInformer;
	output: Output;
}

export class ModulePageViewModel extends PageViewModel {
	readonly name;
	readonly fullPath;
	readonly shortPath;
	readonly language;
	readonly code;
	readonly imports;
	readonly exportsByValues;
	readonly exportsByModules;
	readonly packageData;
	readonly unparsedDynamicImports;
	readonly shadowedExportValues;
	readonly incorrectImports;
	readonly outOfScopeImports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;

	constructor({ version, path, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		const module = output.modules.getModule(path);

		this.name = module.name;
		this.fullPath = path;
		this.shortPath = output.fs.getShortPath(path);
		this.language = module.language;

		this.packageData = module.package
			? {
					...this.getPackageLinkData(module.package),
					content: output.packages.getPackage(module.package).name,
					title: output.fs.getShortPath(module.package),
					shortPath: output.fs.getShortPath(module.package),
					fullPath: module.package,
				}
			: null;

		this.unparsedDynamicImports = module.unparsedDynamicImports;
		this.shadowedExportValues = module.shadowedExportValues;
		this.outOfScopeImports = module.outOfScopeImports.map(({ importPath }) => importPath);
		this.unresolvedFullImports = module.unresolvedFullImports.map(({ importPath }) => importPath);
		this.unresolvedFullExports = module.unresolvedFullExports.map(({ importPath }) => importPath);

		this.code = module.content;

		this.imports = module.imports
			.toSorted((first, second) => {
				const sortByValues = second.values.length - first.values.length;
				return sortByValues === 0 ? first.importPath.localeCompare(second.importPath) : sortByValues;
			})
			.map((imp) => ({
				name: imp.importPath,
				linkData: imp.filePath ? this.getModuleLinkData(imp.filePath) : null,
				values: imp.values,
			}));

		this.exportsByValues = this.#convertExportsToEntriesAndSort(module.exportsByValue).map(([value, paths]) => ({
			value,
			linksData: paths.map((path) => this.getModuleLinkData(path)),
		}));

		this.exportsByModules = this.#convertExportsToEntriesAndSort(module.exportsByModule).map(([path, values]) => ({
			values,
			linkData: this.getModuleLinkData(path),
		}));

		this.incorrectImports = module.incorrectImports.map(({ importPath, filePath }) => ({
			url: pathInformer.getModuleHtmlPagePathByRealPath(filePath!),
			content: importPath,
		}));
	}

	#convertExportsToEntriesAndSort(exports: ReadonlyRec<string, string[]>) {
		return exports.toEntries().toSorted((first, second) => {
			const primarySort = second[1].length - first[1].length;
			return primarySort === 0 ? first[0].localeCompare(second[0]) : primarySort;
		});
	}
}
