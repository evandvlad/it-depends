import { type AbsoluteFsPath, getName } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import { entryPointFileName, orderedByResolvingPriorityAcceptableFileExtNames } from "./module-expert";
import type { ModulesCollection } from "./modules-collector";

interface Params {
	fSTree: FSTree;
	modulesCollection: ModulesCollection;
	extraPackageEntries: ExtraPackageEntries;
}

export interface ExtraPackageEntries {
	fileNames: string[];
	filePaths: AbsoluteFsPath[];
}

export interface Package {
	path: AbsoluteFsPath;
	name: string;
	entryPoint: AbsoluteFsPath;
	parent: AbsoluteFsPath | null;
	modules: AbsoluteFsPath[];
	packages: AbsoluteFsPath[];
}

export type PackagesCollection = Rec<AbsoluteFsPath, Package>;

export class PackagesCollector {
	#fSTree;
	#modulesCollection;
	#extraPackageEntries;

	constructor({ fSTree, modulesCollection, extraPackageEntries }: Params) {
		this.#fSTree = fSTree;
		this.#modulesCollection = modulesCollection;
		this.#extraPackageEntries = extraPackageEntries;
	}

	collect() {
		const packagesCollection: PackagesCollection = new Rec();
		this.#collectPackages(packagesCollection, this.#fSTree.rootPath);
		return this.#fillPackages(packagesCollection);
	}

	#collectPackages(packagesCollection: PackagesCollection, parentPath: AbsoluteFsPath) {
		const nodes = this.#fSTree.getNodeChildrenByPath(parentPath);

		const filePaths = nodes.filter(({ isFile }) => isFile).map(({ path }) => path);
		const packageEntryPoint = this.#resolveEntryPointModule(filePaths);

		if (packageEntryPoint) {
			const pack = this.#createPackage({ path: parentPath, entryPoint: packageEntryPoint });
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

	#fillPackage(packagesCollection: PackagesCollection, pack: Package, currentPath: AbsoluteFsPath) {
		const subPaths: AbsoluteFsPath[] = [];

		this.#fSTree.getNodeChildrenByPath(currentPath).forEach(({ path, isFile }) => {
			if (isFile) {
				pack.modules.push(path);
				this.#modulesCollection.get(path).package = pack.path;
				return;
			}

			if (packagesCollection.has(path)) {
				pack.packages.push(path);
				packagesCollection.get(path).parent = pack.path;
				return;
			}

			subPaths.push(path);
		});

		subPaths.forEach((subPath) => {
			this.#fillPackage(packagesCollection, pack, subPath);
		});
	}

	#resolveEntryPointModule(filePaths: AbsoluteFsPath[]) {
		if (filePaths.length === 0) {
			return null;
		}

		for (const filePath of filePaths) {
			if (this.#extraPackageEntries.filePaths.includes(filePath)) {
				return filePath;
			}
		}

		const entryPointNames = [entryPointFileName, ...this.#extraPackageEntries.fileNames];
		const orderedEntryPointFullNames = entryPointNames.flatMap((baseName) =>
			orderedByResolvingPriorityAcceptableFileExtNames.map((extName) => `${baseName}${extName}`),
		);

		const entryPointCandidates = filePaths.reduce((acc, filePath) => {
			const fileName = getName(filePath);
			const index = orderedEntryPointFullNames.indexOf(fileName);

			if (index !== -1) {
				acc.set(index, filePath);
			}

			return acc;
		}, new Map<number, AbsoluteFsPath>());

		if (entryPointCandidates.size === 0) {
			return null;
		}

		const minIndex = Math.min(...entryPointCandidates.keys());
		return entryPointCandidates.get(minIndex)!;
	}

	#createPackage({ path, entryPoint }: { path: AbsoluteFsPath; entryPoint: AbsoluteFsPath }): Package {
		return {
			path,
			entryPoint,
			name: getName(path),
			parent: null,
			modules: [],
			packages: [],
		};
	}
}
