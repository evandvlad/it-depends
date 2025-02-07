import type { FSTree } from "../fs-tree";
import type { ModuleBuildersCollection, PackagesCollection } from "../values";
import { IncorrectImportsProcessor } from "./incorrect-imports-processor";

interface Params {
	fSTree: FSTree;
	packagesCollection: PackagesCollection;
	moduleBuildersCollection: ModuleBuildersCollection;
}

export function processCollections({ fSTree, packagesCollection, moduleBuildersCollection }: Params) {
	const incorrectImportsProcessor = new IncorrectImportsProcessor({ fSTree, packagesCollection });

	moduleBuildersCollection.forEach((builder) => {
		incorrectImportsProcessor.process(builder);
	});
}
