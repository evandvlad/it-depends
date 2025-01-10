import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import { type AbsoluteFsPath, getName } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import { entryPointFileName, orderedByResolvingPriorityAcceptableFileExtNames } from "./module-expert";
import type { Modules } from "./modules-collector";

interface Params {
	modules: Modules;
	fsNavCursor: FSNavCursor;
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

export type Packages = Rec<AbsoluteFsPath, Package>;

export class PackagesCollector {
	#modules;
	#fsNavCursor;
	#extraPackageEntries;

	constructor({ modules, fsNavCursor, extraPackageEntries }: Params) {
		this.#modules = modules;
		this.#fsNavCursor = fsNavCursor;
		this.#extraPackageEntries = extraPackageEntries;
	}

	collect() {
		const packages: Packages = new Rec();
		this.#collectPackages(packages, this.#fsNavCursor.rootPath);
		return this.#fillPackages(packages);
	}

	#collectPackages(packages: Packages, parentPath: AbsoluteFsPath) {
		const nodes = this.#fsNavCursor.getNodeChildrenByPath(parentPath);

		const filePaths = nodes.filter(({ isFile }) => isFile).map(({ path }) => path);
		const packageEntryPoint = this.#resolveEntryPointModule(filePaths);

		if (packageEntryPoint) {
			const pack = this.#createPackage({ path: parentPath, entryPoint: packageEntryPoint });
			packages.set(pack.path, pack);
		}

		nodes
			.filter(({ isFile }) => !isFile)
			.forEach(({ path }) => {
				this.#collectPackages(packages, path);
			});
	}

	#fillPackages(packages: Packages) {
		packages.forEach((pack) => {
			this.#fillPackage(packages, pack, pack.path);
		});

		return packages;
	}

	#fillPackage(packages: Packages, pack: Package, currentPath: AbsoluteFsPath) {
		const subPaths: AbsoluteFsPath[] = [];

		this.#fsNavCursor.getNodeChildrenByPath(currentPath).forEach(({ path, isFile }) => {
			if (isFile) {
				pack.modules.push(path);
				this.#modules.get(path).package = pack.path;
				return;
			}

			if (packages.has(path)) {
				pack.packages.push(path);
				packages.get(path).parent = pack.path;
				return;
			}

			subPaths.push(path);
		});

		subPaths.forEach((subPath) => {
			this.#fillPackage(packages, pack, subPath);
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
