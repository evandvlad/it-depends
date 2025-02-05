import type { FSTree } from "./fs-tree";
import type { Summary } from "./summary-collector";
import type { ModulesCollection, PackagesCollection } from "./values";

interface Params {
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
	summary: Summary;
	fSTree: FSTree;
}

export class Output {
	readonly modulesCollection;
	readonly packagesCollection;
	readonly summary;
	readonly fSTree;

	constructor({ modulesCollection, packagesCollection, summary, fSTree }: Params) {
		this.modulesCollection = modulesCollection;
		this.packagesCollection = packagesCollection;
		this.summary = summary;
		this.fSTree = fSTree;
	}
}
