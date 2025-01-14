import type { PackagesCollection } from "~/domain";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: AbsoluteFsPath;
	fSTree: FSTree;
	pathInformer: PathInformer;
	packagesCollection: PackagesCollection;
}

export class PackagePageViewModel extends PageViewModel {
	readonly fullPath;
	readonly shortPath;
	readonly entryPointLinkData;
	readonly parentPackageLinkData;

	#package;

	constructor({ version, path, pathInformer, fSTree, packagesCollection }: Params) {
		super({ version, pathInformer, fSTree });

		this.#package = packagesCollection.get(path);

		this.fullPath = path;
		this.shortPath = fSTree.getShortPathByPath(path);
		this.entryPointLinkData = this.getModuleLinkData(this.#package.entryPoint);
		this.parentPackageLinkData = this.#package.parent ? this.getPackageLinkData(this.#package.parent) : null;
	}

	collectModuleLinks<T>(handler: (linkData: LinkData) => T) {
		return this.#package.modules.toSorted().map((path) => handler(this.getModuleLinkData(path)));
	}

	collectChildPackageLinks<T>(handler: (linkData: LinkData) => T) {
		return this.#package.packages.toSorted().map((path) => handler(this.getPackageLinkData(path)));
	}
}
