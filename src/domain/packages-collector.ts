import type { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import type { ModulesCollection } from "./modules-collector";
import { Package } from "./package";
import type { ProgramFileExpert } from "./program-file-expert";

interface Params {
	fSTree: FSTree;
	programFileExpert: ProgramFileExpert;
	modulesCollection: ModulesCollection;
}

export type PackagesCollection = Rec<string, Package>;

export class PackagesCollector {
	#fSTree;
	#modulesCollection;
	#programFileExpert;

	constructor({ fSTree, programFileExpert, modulesCollection }: Params) {
		this.#fSTree = fSTree;
		this.#programFileExpert = programFileExpert;
		this.#modulesCollection = modulesCollection;
	}

	collect() {
		const packagesCollection: PackagesCollection = new Rec();
		this.#collectPackages(packagesCollection, this.#fSTree.rootPath);
		return this.#fillPackages(packagesCollection);
	}

	#collectPackages(packagesCollection: PackagesCollection, parentPath: string) {
		const nodes = this.#fSTree.getNodeChildrenByPath(parentPath);

		const filePaths = nodes.filter(({ isFile }) => isFile).map(({ path }) => path);
		const packageEntryPoint = this.#programFileExpert.getPackageEntryPoint(filePaths);

		if (packageEntryPoint) {
			const pack = new Package({ path: parentPath, entryPoint: packageEntryPoint });
			packagesCollection.set(pack.path, pack);
		}

		nodes
			.filter(({ isFile }) => !isFile)
			.forEach(({ path }) => {
				this.#collectPackages(packagesCollection, path);
			});
	}

	#fillPackages(packagesCollection: PackagesCollection) {
		packagesCollection.forEach((pack) => {
			this.#fillPackage(packagesCollection, pack, pack.path);
		});

		return packagesCollection;
	}

	#fillPackage(packagesCollection: PackagesCollection, pack: Package, currentPath: string) {
		const subPaths: string[] = [];

		this.#fSTree.getNodeChildrenByPath(currentPath).forEach(({ path, isFile }) => {
			if (isFile) {
				pack.addModule(path);
				this.#modulesCollection.get(path).package = pack.path;
				return;
			}

			if (packagesCollection.has(path)) {
				pack.addPackage(path);
				packagesCollection.get(path).setParent(pack.path);
				return;
			}

			subPaths.push(path);
		});

		subPaths.forEach((subPath) => {
			this.#fillPackage(packagesCollection, pack, subPath);
		});
	}
}
