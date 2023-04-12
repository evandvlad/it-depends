import { FSPath, Package, FSTree } from "../values";
import { resolveEntryPointModule } from "../lib/module-details";
import { PackagesRegistry } from "./packages-registry";

interface Options {
	fsTree: FSTree;
	extraPackageEntryFileNames: string[];
	extraPackageEntryFilePaths: FSPath[];
}

type Packages = Record<FSPath, Package>;

class PackagesCollector {
	#fsTree: FSTree;
	#extraPackageEntryFileNames: string[];
	#extraPackageEntryFilePaths: FSPath[];

	constructor({ fsTree, extraPackageEntryFileNames, extraPackageEntryFilePaths }: Options) {
		this.#fsTree = fsTree;
		this.#extraPackageEntryFileNames = extraPackageEntryFileNames;
		this.#extraPackageEntryFilePaths = extraPackageEntryFilePaths;
	}

	collect() {
		const packages: Packages = {};
		this.#collectPackages(packages, this.#fsTree.rootPath);
		return this.#fillPackages(new PackagesRegistry(packages));
	}

	#collectPackages(packages: Packages, parentPath: FSPath) {
		const nodes = this.#fsTree.getNodeChildrenByPath(parentPath);

		const filePaths = nodes.filter(({ isFile }) => isFile).map(({ path }) => path);
		const packageEntryPoint =
			filePaths.length > 0
				? resolveEntryPointModule({
						filePaths,
						extraEntryFilePaths: this.#extraPackageEntryFilePaths,
						extraEntryFileNames: this.#extraPackageEntryFileNames,
				  })
				: null;

		if (packageEntryPoint) {
			const pack = this.#createPackage({ path: parentPath, entryPoint: packageEntryPoint });
			packages[pack.path] = pack;
		}

		nodes
			.filter(({ isFile }) => !isFile)
			.forEach(({ path }) => {
				this.#collectPackages(packages, path);
			});
	}

	#fillPackages(packagesRegistry: PackagesRegistry) {
		packagesRegistry.toList().forEach((pack) => {
			this.#fillPackage(packagesRegistry, pack, pack.path);
		});

		return packagesRegistry;
	}

	#fillPackage(packagesRegistry: PackagesRegistry, pack: Package, currentPath: FSPath) {
		const subPaths: FSPath[] = [];

		this.#fsTree.getNodeChildrenByPath(currentPath).forEach(({ isFile, path }) => {
			if (isFile) {
				pack.modules.push(path);
				return;
			}

			if (packagesRegistry.hasByPath(path)) {
				pack.packages.push(path);
				packagesRegistry.getByPath(path).parent = pack.path;
				return;
			}

			subPaths.push(path);
		});

		subPaths.forEach((subPath) => {
			this.#fillPackage(packagesRegistry, pack, subPath);
		});
	}

	#createPackage({ path, entryPoint }: { path: FSPath; entryPoint: FSPath }): Package {
		return {
			path,
			entryPoint,
			parent: null,
			modules: [],
			packages: [],
		};
	}
}

export function collectPackages(options: Options): PackagesRegistry {
	const packagesCollector = new PackagesCollector(options);
	return packagesCollector.collect();
}
