import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { ImportSource, Module } from "../modules-collector";
import type { Package, PackagesCollection } from "../packages-collector";

interface Params {
	packagesCollection: PackagesCollection;
	fsNavCursor: FSNavCursor;
}

export class IncorrectImportsFinder {
	#packagesCollection;
	#fsNavCursor;

	constructor({ fsNavCursor, packagesCollection }: Params) {
		this.#fsNavCursor = fsNavCursor;
		this.#packagesCollection = packagesCollection;
	}

	find({ path, imports, unresolvedFullImports }: Module): ImportSource[] {
		const pack = this.#findPackageByFilePath(path);

		return imports
			.map(({ importSource }) => importSource)
			.concat(unresolvedFullImports)
			.filter((importSource) =>
				pack
					? !this.#isCorrectImportFromPackage(pack, importSource)
					: !this.#isCorrectImportWithoutPackage(importSource),
			);
	}

	#isCorrectImportFromPackage(pack: Package, importSource: ImportSource) {
		const { filePath } = importSource;

		if (filePath === undefined) {
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

	#isCorrectImportWithoutPackage(importSource: ImportSource) {
		const { filePath } = importSource;

		if (filePath !== undefined) {
			const importPackage = this.#findPackageByFilePath(filePath);

			if (importPackage) {
				return importPackage.entryPoint === filePath;
			}
		}

		return true;
	}

	#findPackageByFilePath(filePath: AbsoluteFsPath): Package | null {
		let parentNode = this.#fsNavCursor.getNodeByPath(filePath).parent;

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
