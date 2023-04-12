import { FSPath, Package, PackagesRegistry as IPackagesRegistry } from "../values";
import { assert } from "../lib/errors";
import { getPathBreadcrumbs } from "../lib/fs-path";

export class PackagesRegistry implements IPackagesRegistry {
	#packages: Record<FSPath, Package>;

	constructor(packages: Record<FSPath, Package>) {
		this.#packages = packages;
	}

	get paths(): FSPath[] {
		return Object.keys(this.#packages);
	}

	hasByPath(dirPath: FSPath) {
		return Object.hasOwn(this.#packages, dirPath);
	}

	getByPath(dirPath: FSPath): Package {
		assert(this.hasByPath(dirPath), `Package by directory path: "${dirPath}" wasn't found`);
		return this.#packages[dirPath]!;
	}

	findByFilePath(filePath: FSPath): Package | null {
		const breadcrumbs = getPathBreadcrumbs(filePath).slice(0, -1).reverse();

		for (const currentPath of breadcrumbs) {
			if (this.hasByPath(currentPath)) {
				return this.getByPath(currentPath);
			}
		}

		return null;
	}

	toList() {
		return Object.values(this.#packages);
	}
}