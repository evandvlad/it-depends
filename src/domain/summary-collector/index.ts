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
	incorrectImports: Rec<string, Import[]>;
}

export class SummaryCollector {
	#modulesCollection;
	#incorrectImportsFinder;

	#summary: Summary = {
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
		const { path } = module;

		const { incorrectImports } = this.#summary;

		const incorrectImportsSources = this.#incorrectImportsFinder.find(module);

		if (incorrectImportsSources.length > 0) {
			incorrectImports.set(path, incorrectImportsSources);
		}
	}
}
