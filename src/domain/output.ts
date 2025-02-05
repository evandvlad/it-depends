import type { FSTree } from "./fs-tree";
import type { Summary } from "./summary-collector";
import type { ModulesCollection, PackagesCollection, ProcessorErrors } from "./values";

interface Params {
	processorErrors: ProcessorErrors;
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
	summary: Summary;
	fSTree: FSTree;
}

export class Output {
	readonly fs;
	readonly modules;
	readonly packages;
	readonly processorErrors;
	readonly summary;

	constructor({ processorErrors, modulesCollection, packagesCollection, summary, fSTree }: Params) {
		this.processorErrors = processorErrors;
		this.summary = summary;

		this.fs = this.#createFS(fSTree);
		this.modules = this.#createModules(modulesCollection);
		this.packages = this.#createPackages(packagesCollection);
	}

	#createFS(fSTree: FSTree) {
		return {
			getShortPath(path: string) {
				return fSTree.getShortPathByPath(path);
			},

			getNode(path: string | null) {
				return fSTree.getNodeByPath(path ?? fSTree.shortRootPath);
			},

			getNodeChildren(path: string | null) {
				return fSTree.getNodeChildrenByPath(path ?? fSTree.shortRootPath);
			},
		};
	}

	#createModules(modulesCollection: ModulesCollection) {
		return {
			getAllModules() {
				return modulesCollection.toValues();
			},

			getModule(path: string) {
				return modulesCollection.get(path);
			},

			hasModule(path: string) {
				return modulesCollection.has(path);
			},
		};
	}

	#createPackages(packagesCollection: PackagesCollection) {
		return {
			getAllPackages() {
				return packagesCollection.toValues();
			},

			getPackage(path: string) {
				return packagesCollection.get(path);
			},

			hasPackage(path: string) {
				return packagesCollection.has(path);
			},
		};
	}
}
