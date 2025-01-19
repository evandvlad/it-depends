import { joinPaths } from "~/lib/fs-path";
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
	readonly layoutParams;

	#fSTree;
	#pathInformer;

	constructor({ version, pathInformer, fSTree }: Params) {
		this.#fSTree = fSTree;
		this.#pathInformer = pathInformer;

		this.version = version;

		this.layoutParams = {
			indexHtmlPagePath: pathInformer.indexHtmlPagePath,
			externalStylePaths: [joinPaths(pathInformer.assetsPath, "index.css")],
			externalScriptPaths: [joinPaths(pathInformer.assetsPath, "index.js")],
		};
	}

	protected getModuleLinkData(path: string): LinkData {
		return {
			url: this.#pathInformer.getModuleHtmlPagePathByRealPath(path),
			content: this.#fSTree.getShortPathByPath(path),
		};
	}

	protected getPackageLinkData(path: string): LinkData {
		return {
			url: this.#pathInformer.getPackageHtmlPagePathByRealPath(path),
			content: this.#fSTree.getShortPathByPath(path),
		};
	}
}
