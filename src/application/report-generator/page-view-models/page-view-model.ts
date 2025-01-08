import type { FSNavCursor } from "../../../lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "../../../lib/fs-path";
import type { PathInformer } from "../path-informer";
import type { LinkData } from "./values";

interface Params {
	version: string;
	pathInformer: PathInformer;
	fsNavCursor: FSNavCursor;
}

export abstract class PageViewModel {
	readonly version;
	readonly assetsPath;
	readonly indexHtmlPagePath;

	#fsNavCursor;
	#pathInformer;

	constructor({ version, pathInformer, fsNavCursor }: Params) {
		this.version = version;
		this.assetsPath = pathInformer.assetsPath;
		this.indexHtmlPagePath = pathInformer.indexHtmlPagePath;

		this.#fsNavCursor = fsNavCursor;
		this.#pathInformer = pathInformer;
	}

	protected getModuleLinkData(path: AbsoluteFsPath): LinkData {
		return {
			url: this.#pathInformer.getModuleHtmlPagePathByRealPath(path),
			content: this.#fsNavCursor.getShortPathByPath(path),
		};
	}

	protected getPackageLinkData(path: AbsoluteFsPath): LinkData {
		return {
			url: this.#pathInformer.getPackageHtmlPagePathByRealPath(path),
			content: this.#fsNavCursor.getShortPathByPath(path),
		};
	}
}
