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
	readonly fullPath;
	readonly shortPath;
	readonly language;
	readonly code;
	readonly imports;
	readonly exportsByValues;
	readonly exportsByModules;
	readonly packageLinkData;
	readonly unparsedDynamicImports;
	readonly shadowedExportValues;
	readonly incorrectImports;
	readonly outOfScopeImports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;

	constructor({ version, path, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		const module = output.modules.getModule(path);

		this.fullPath = path;
		this.shortPath = output.fs.getShortPath(path);
		this.language = module.language;

		this.packageLinkData = module.package ? this.getPackageLinkData(module.package) : null;
		this.unparsedDynamicImports = module.unparsedDynamicImports;
		this.shadowedExportValues = module.shadowedExportValues;
		this.outOfScopeImports = module.outOfScopeImports.map(({ importPath }) => importPath);
		this.unresolvedFullImports = module.unresolvedFullImports.map(({ importPath }) => importPath);
		this.unresolvedFullExports = module.unresolvedFullExports.map(({ importPath }) => importPath);

		this.code = module.content;

		this.imports = module.imports
			.toSorted((first, second) => second.values.length - first.values.length)
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
		return exports.toEntries().toSorted((first, second) => second[1].length - first[1].length);
	}
}
