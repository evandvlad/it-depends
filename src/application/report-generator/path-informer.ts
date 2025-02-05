import { joinPaths } from "~/lib/fs-path";

interface Params {
	rootPath: string;
	fSTree: {
		getShortPathByPath: (path: string) => string;
	};
}

export class PathInformer {
	readonly rootPath;
	readonly assetsPath;
	readonly indexHtmlPagePath;

	#fSTree;
	#modulesFolderPath;
	#packagesFolderPath;

	constructor({ rootPath, fSTree }: Params) {
		this.#fSTree = fSTree;

		this.rootPath = rootPath;
		this.assetsPath = joinPaths(this.rootPath, "assets");

		const contentPath = joinPaths(this.rootPath, "content");

		this.indexHtmlPagePath = joinPaths(contentPath, "index.html");

		this.#modulesFolderPath = joinPaths(contentPath, "modules");
		this.#packagesFolderPath = joinPaths(contentPath, "packages");
	}

	getModuleHtmlPagePathByRealPath(path: string) {
		const shortPath = this.#fSTree.getShortPathByPath(path);
		return joinPaths(this.#modulesFolderPath, `${shortPath}.html`);
	}

	getPackageHtmlPagePathByRealPath(path: string) {
		const shortPath = this.#fSTree.getShortPathByPath(path);
		return joinPaths(this.#packagesFolderPath, `${shortPath}.html`);
	}
}
