import type { FSTree } from "~/lib/fs-tree";
import type { Import } from "../import";
import type { Module } from "../modules-collector";
import type { Package } from "../package";
import type { PackagesCollection } from "../packages-collector";

interface Params {
	fSTree: FSTree;
	packagesCollection: PackagesCollection;
}

export class IncorrectImportsFinder {
	#fSTree;
	#packagesCollection;

	constructor({ fSTree, packagesCollection }: Params) {
		this.#fSTree = fSTree;
		this.#packagesCollection = packagesCollection;
	}

	find({ path, imports, unresolvedFullImports }: Module): Import[] {
		const pack = this.#findPackageByFilePath(path);

		return imports
			.concat(unresolvedFullImports)
			.filter((imp) =>
				pack ? !this.#isCorrectImportFromPackage(pack, imp) : !this.#isCorrectImportWithoutPackage(imp),
			);
	}

	#isCorrectImportFromPackage(pack: Package, imp: Import) {
		const { filePath } = imp;

		if (filePath === null) {
			return true;
		}

		const importPackage = this.#findPackageByFilePath(filePath);

		if (!importPackage) {
			return true;
		}

		const isEntryPointImport = importPackage.entryPoint === filePath;

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

	#isCorrectImportWithoutPackage(imp: Import) {
		const { filePath } = imp;

		if (filePath !== null) {
			const importPackage = this.#findPackageByFilePath(filePath);

			if (importPackage) {
				return importPackage.entryPoint === filePath && importPackage.parent === null;
			}
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
