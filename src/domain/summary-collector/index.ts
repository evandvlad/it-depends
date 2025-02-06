import { Rec } from "~/lib/rec";
import type { FSTree } from "../fs-tree";
import type { Import } from "../import";
import type { Module } from "../module";
import type { ModulesCollection, PackagesCollection } from "../values";
import { IncorrectImportsFinder } from "./incorrect-imports-finder";

interface Params {
	fSTree: FSTree;
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
}

export interface Summary {
	outOfScopeImports: Rec<string, string[]>;
	possiblyUnusedExportValues: Rec<string, string[]>;
	incorrectImports: Rec<string, Import[]>;
	emptyExports: string[];
}

export class SummaryCollector {
	#modulesCollection;
	#incorrectImportsFinder;

	#summary: Summary = {
		possiblyUnusedExportValues: new Rec(),
		outOfScopeImports: new Rec(),
		emptyExports: [],
		incorrectImports: new Rec(),
	};

	constructor({ fSTree, packagesCollection, modulesCollection }: Params) {
		this.#modulesCollection = modulesCollection;
		this.#incorrectImportsFinder = new IncorrectImportsFinder({ fSTree, packagesCollection });
	}

	collect() {
		this.#modulesCollection.forEach((module) => {
			this.#handleModule(module);
		});

		return this.#summary;
	}

	#handleModule(module: Module) {
		const { path, imports, exports } = module;

		const { outOfScopeImports, emptyExports, possiblyUnusedExportValues, incorrectImports } = this.#summary;

		imports.forEach(({ isInScope, importPath }) => {
			if (!isInScope) {
				if (!outOfScopeImports.has(path)) {
					outOfScopeImports.set(path, []);
				}

				outOfScopeImports.get(path).push(importPath);
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
