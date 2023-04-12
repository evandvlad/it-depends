import { PackagesRegistry, Module, ImportSource, Package } from "../values";

interface Options {
	packagesRegistry: PackagesRegistry;
}

export class IncorrectImportsFinder {
	#packagesRegistry: PackagesRegistry;

	constructor({ packagesRegistry }: Options) {
		this.#packagesRegistry = packagesRegistry;
	}

	find({ path, imports, unresolvedFullImports }: Module): ImportSource[] {
		const pack = this.#packagesRegistry.findByFilePath(path);

		if (!pack) {
			return [];
		}

		return imports
			.map(({ importSource }) => importSource)
			.concat(unresolvedFullImports)
			.filter((importSource) => !this.#isCorrectImport(pack, importSource));
	}

	#isCorrectImport(pack: Package, importSource: ImportSource) {
		const { filePath } = importSource;

		if (filePath === undefined) {
			return true;
		}

		const importPackage = this.#packagesRegistry.findByFilePath(filePath);

		if (!importPackage) {
			return true;
		}

		const isEntryPointImport = importPackage.entryPoint === filePath;

		if (pack.parent === importPackage.parent && isEntryPointImport) {
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

			movingPackage = movingPackage.parent ? this.#packagesRegistry.getByPath(movingPackage.parent) : null;
		}

		return false;
	}
}
