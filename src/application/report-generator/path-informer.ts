import { joinPaths } from "~/lib/fs-path";

interface Params {
	rootPath: string;
	fs: {
		getShortPath: (path: string) => string;
	};
}

export class PathInformer {
	readonly rootPath;
	readonly assetsPath;
	readonly indexHtmlPagePath;

	#fs;
	#modulesFolderPath;
	#packagesFolderPath;

	constructor({ rootPath, fs }: Params) {
		this.#fs = fs;

		this.rootPath = rootPath;
		this.assetsPath = joinPaths(this.rootPath, "assets");

		const contentPath = joinPaths(this.rootPath, "content");

		this.indexHtmlPagePath = joinPaths(contentPath, "index.html");

		this.#modulesFolderPath = joinPaths(contentPath, "modules");
		this.#packagesFolderPath = joinPaths(contentPath, "packages");
	}

	getModuleHtmlPagePathByRealPath(path: string) {
		const shortPath = this.#fs.getShortPath(path);
		return joinPaths(this.#modulesFolderPath, `${shortPath}.html`);
	}

	getPackageHtmlPagePathByRealPath(path: string) {
		const shortPath = this.#fs.getShortPath(path);
		return joinPaths(this.#packagesFolderPath, `${shortPath}.html`);
	}
}
