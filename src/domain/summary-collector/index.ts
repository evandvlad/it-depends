import type { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import type { Module, ModulesCollection } from "../modules-collector";
import type { PackagesCollection } from "../packages-collector";
import type { ImportSource, Language } from "../program-file-expert";
import type { ProcessorErrors } from "../program-file-items-processor";
import { IncorrectImportsFinder } from "./incorrect-imports-finder";

interface Params {
	fSTree: FSTree;
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
	processorErrors: ProcessorErrors;
}

export interface Summary {
	packages: number;
	languages: Rec<Language, number>;
	unparsedDynamicImports: Rec<string, number>;
	unresolvedFullImports: Rec<string, number>;
	unresolvedFullExports: Rec<string, number>;
	shadowedExportValues: Rec<string, number>;
	outOfScopeImports: Rec<string, string[]>;
	possiblyUnusedExportValues: Rec<string, string[]>;
	incorrectImports: Rec<string, ImportSource[]>;
	emptyExports: string[];
	processorErrors: ProcessorErrors;
}

export class SummaryCollector {
	#packagesCollection;
	#modulesCollection;
	#incorrectImportsFinder;

	#summary: Summary = {
		packages: 0,
		languages: Rec.fromObject({
			typescript: 0,
			javascript: 0,
		}),
		unparsedDynamicImports: new Rec(),
		unresolvedFullImports: new Rec(),
		unresolvedFullExports: new Rec(),
		shadowedExportValues: new Rec(),
		possiblyUnusedExportValues: new Rec(),
		outOfScopeImports: new Rec(),
		emptyExports: [],
		incorrectImports: new Rec(),
		processorErrors: new Rec(),
	};

	constructor({ fSTree, packagesCollection, modulesCollection, processorErrors }: Params) {
		this.#packagesCollection = packagesCollection;
		this.#modulesCollection = modulesCollection;
		this.#incorrectImportsFinder = new IncorrectImportsFinder({ fSTree, packagesCollection });
		this.#summary.processorErrors = processorErrors;
	}

	collect() {
		this.#summary.packages = this.#packagesCollection.size;

		this.#modulesCollection.forEach((module) => {
			this.#handleModule(module);
		});

		return this.#summary;
	}

	#handleModule(module: Module) {
		const { path, language, imports, exports } = module;

		const {
			languages,
			unparsedDynamicImports,
			unresolvedFullImports,
			unresolvedFullExports,
			shadowedExportValues,
			outOfScopeImports,
			emptyExports,
			possiblyUnusedExportValues,
			incorrectImports,
		} = this.#summary;

		languages.set(language, languages.get(language) + 1);

		if (module.unparsedDynamicImports > 0) {
			unparsedDynamicImports.set(path, module.unparsedDynamicImports);
		}

		if (module.unresolvedFullImports.length > 0) {
			unresolvedFullImports.set(path, module.unresolvedFullImports.length);
		}

		if (module.unresolvedFullExports.length > 0) {
			unresolvedFullExports.set(path, module.unresolvedFullExports.length);
		}

		if (module.shadowedExportValues.length > 0) {
			shadowedExportValues.set(path, module.shadowedExportValues.length);
		}

		imports.forEach(({ importSource }) => {
			if (importSource.filePath === undefined) {
				if (!outOfScopeImports.has(path)) {
					outOfScopeImports.set(path, []);
				}

				outOfScopeImports.get(path).push(importSource.importPath);
			}
		});

		exports.forEach((paths, value) => {
			if (paths.length === 0) {
				if (!possiblyUnusedExportValues.has(path)) {
					possiblyUnusedExportValues.set(path, []);
				}

				possiblyUnusedExportValues.get(path).push(value);
			}
		});

		if (exports.size === 0 && module.unresolvedFullExports.length === 0) {
			emptyExports.push(path);
		}

		const incorrectImportsSources = this.#incorrectImportsFinder.find(module);

		if (incorrectImportsSources.length > 0) {
			incorrectImports.set(path, incorrectImportsSources);
		}
	}
}
