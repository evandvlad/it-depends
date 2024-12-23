import type { FSNavCursor } from "../../lib/fs-nav-cursor";
import { type AbsoluteFsPath, joinPaths } from "../../lib/fs-path";

interface Params {
	rootPath: AbsoluteFsPath;
	fsNavCursor: FSNavCursor;
}

export class PathInformer {
	readonly rootPath;
	readonly assetsPath;
	readonly indexHtmlPagePath;

	#modulesFolderPath;
	#packagesFolderPath;
	#fsNavCursor;

	constructor({ rootPath, fsNavCursor }: Params) {
		this.#fsNavCursor = fsNavCursor;

		this.rootPath = rootPath;
		this.assetsPath = joinPaths(this.rootPath, "assets");

		const contentPath = joinPaths(this.rootPath, "content");

		this.indexHtmlPagePath = joinPaths(contentPath, "index.html");

		this.#modulesFolderPath = joinPaths(contentPath, "modules");
		this.#packagesFolderPath = joinPaths(contentPath, "packages");
	}

	getModuleHtmlPagePathByRealPath(path: AbsoluteFsPath) {
		const shortPath = this.#fsNavCursor.getShortPathByPath(path);
		return joinPaths(this.#modulesFolderPath, `${shortPath}.html`);
	}

	getPackageHtmlPagePathByRealPath(path: AbsoluteFsPath) {
		const shortPath = this.#fsNavCursor.getShortPathByPath(path);
		return joinPaths(this.#packagesFolderPath, `${shortPath}.html`);
	}
}
