import type { FSTree } from "../fs-tree";
import type { ModuleBuilder } from "../module-builder";
import type { Package } from "../package";
import type { ImportData, PackagesCollection } from "../values";

interface Params {
	fSTree: FSTree;
	packagesCollection: PackagesCollection;
}

export class IncorrectImportsProcessor {
	#fSTree;
	#packagesCollection;

	constructor({ fSTree, packagesCollection }: Params) {
		this.#fSTree = fSTree;
		this.#packagesCollection = packagesCollection;
	}

	process(builder: ModuleBuilder) {
		const pack = this.#findPackageByFilePath(builder.path);

		const incorrectImports = builder
			.getAllImports()
			.filter((importData) =>
				pack ? !this.#isCorrectImportFromPackage(pack, importData) : !this.#isCorrectImportWithoutPackage(importData),
			);

		builder.setIncorrectImports(incorrectImports);
	}

	#isCorrectImportFromPackage(pack: Package, importData: ImportData) {
		if (!importData.filePath) {
			return true;
		}

		const importPackage = this.#findPackageByFilePath(importData.filePath);

		if (!importPackage) {
			return true;
		}

		const isEntryPointImport = importPackage.entryPoint === importData.filePath;

		if ((pack.parent === importPackage.parent || importPackage.parent === null) && isEntryPointImport) {
			return true;
		}

		let movingPackage: Package | null = pack;

		while (movingPackage) {
			if (movingPackage.path === importPackage.path) {
				return true;
			}

			if (movingPackage.packages.includes(importPackage.path) && isEntryPointImport) {
				return true;
			}

			movingPackage = movingPackage.parent ? this.#packagesCollection.get(movingPackage.parent) : null;
		}

		return false;
	}

	#isCorrectImportWithoutPackage(importData: ImportData) {
		if (!importData.filePath) {
			return true;
		}

		const importPackage = this.#findPackageByFilePath(importData.filePath);

		if (importPackage) {
			return importPackage.entryPoint === importData.filePath && importPackage.parent === null;
		}

		return true;
	}

	#findPackageByFilePath(filePath: string): Package | null {
		let parentNode = this.#fSTree.getNodeByPath(filePath).parent;

		while (parentNode) {
			const { path } = parentNode;

			if (this.#packagesCollection.has(path)) {
				return this.#packagesCollection.get(path);
			}

			parentNode = parentNode.parent;
		}

		return null;
	}
}
