import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { ImportSource, Module } from "../modules-collector";
import type { Package, Packages } from "../packages-collector";

interface Params {
	packages: Packages;
	fsNavCursor: FSNavCursor;
}

export class IncorrectImportsFinder {
	#packages;
	#fsNavCursor;

	constructor({ fsNavCursor, packages }: Params) {
		this.#fsNavCursor = fsNavCursor;
		this.#packages = packages;
	}

	find({ path, imports, unresolvedFullImports }: Module): ImportSource[] {
		const pack = this.#findPackageByFilePath(path);

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

			movingPackage = movingPackage.parent ? this.#packages.get(movingPackage.parent) : null;
		}

		return false;
	}

	#findPackageByFilePath(filePath: AbsoluteFsPath): Package | null {
		let parentNode = this.#fsNavCursor.getNodeByPath(filePath).parent;

		while (parentNode) {
			const { path } = parentNode;

			if (this.#packages.has(path)) {
				return this.#packages.get(path);
			}

			parentNode = parentNode.parent;
		}

		return null;
	}
}
