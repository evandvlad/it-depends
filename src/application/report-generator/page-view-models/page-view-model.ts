import type { Output } from "~/domain";
import { joinPaths } from "~/lib/fs-path";
import type { PathInformer } from "../path-informer";
import type { LinkData } from "./values";

interface Params {
	version: string;
	pathInformer: PathInformer;
	output: Output;
}

export abstract class PageViewModel {
	readonly version;
	readonly layoutParams;

	#output;
	#pathInformer;

	constructor({ version, pathInformer, output }: Params) {
		this.#output = output;
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
			content: this.#output.fs.getShortPath(path),
		};
	}

	protected getPackageLinkData(path: string): LinkData {
		return {
			url: this.#pathInformer.getPackageHtmlPagePathByRealPath(path),
			content: this.#output.fs.getShortPath(path),
		};
	}
}
