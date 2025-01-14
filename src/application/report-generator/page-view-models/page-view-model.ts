import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import type { PathInformer } from "../path-informer";
import type { LinkData } from "./values";

interface Params {
	version: string;
	pathInformer: PathInformer;
	fSTree: FSTree;
}

export abstract class PageViewModel {
	readonly version;
	readonly assetsPath;
	readonly indexHtmlPagePath;

	#fSTree;
	#pathInformer;

	constructor({ version, pathInformer, fSTree }: Params) {
		this.version = version;
		this.assetsPath = pathInformer.assetsPath;
		this.indexHtmlPagePath = pathInformer.indexHtmlPagePath;

		this.#fSTree = fSTree;
		this.#pathInformer = pathInformer;
	}

	protected getModuleLinkData(path: AbsoluteFsPath): LinkData {
		return {
			url: this.#pathInformer.getModuleHtmlPagePathByRealPath(path),
			content: this.#fSTree.getShortPathByPath(path),
		};
	}

	protected getPackageLinkData(path: AbsoluteFsPath): LinkData {
		return {
			url: this.#pathInformer.getPackageHtmlPagePathByRealPath(path),
			content: this.#fSTree.getShortPathByPath(path),
		};
	}
}
