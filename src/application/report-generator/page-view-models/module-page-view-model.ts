import type { Output } from "~/domain";
import { Rec } from "~/lib/rec";
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

	#module;

	constructor({ version, path, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		this.#module = output.modules.getModule(path);

		this.fullPath = path;
		this.shortPath = output.fs.getShortPath(path);
		this.language = this.#module.language;

		this.packageLinkData = this.#module.package ? this.getPackageLinkData(this.#module.package) : null;
		this.unparsedDynamicImports = this.#module.unparsedDynamicImports;
		this.shadowedExportValues = this.#module.shadowedExportValues;

		this.code = this.#module.content;

		this.imports = this.#module.imports
			.toSorted((first, second) => second.values.length - first.values.length)
			.map((imp) => ({
				name: imp.importPath,
				linkData: imp.filePath ? this.getModuleLinkData(imp.filePath) : null,
				values: imp.values,
			}));

		this.exportsByValues = this.#getExportsByValues();
		this.exportsByModules = this.#getExportsByModules();

		this.incorrectImports = output.summary.incorrectImports
			.getOrDefault(this.fullPath, [])
			.map(({ importPath, filePath }) => ({
				url: pathInformer.getModuleHtmlPagePathByRealPath(filePath!),
				content: importPath,
			}));

		this.outOfScopeImports = output.summary.outOfScopeImports.getOrDefault(this.fullPath, []);
		this.unresolvedFullImports = this.#module.unresolvedFullImports.map(({ importPath }) => importPath);
		this.unresolvedFullExports = this.#module.unresolvedFullExports.map(({ importPath }) => importPath);
	}

	#getExportsByValues() {
		return this.#module.exports
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([value, paths]) => ({
				value,
				linksData: paths.map((path) => this.getModuleLinkData(path)),
			}));
	}

	#getExportsByModules() {
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
			.map(([path, values]) => ({
				values,
				linkData: this.getModuleLinkData(path),
			}));
	}
}
