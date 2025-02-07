import { joinPaths } from "~/lib/fs-path";

interface Conf {
	version: string;
	reportStaticAssetsPath: string;
}

export class ConfLoader {
	#confPath;

	constructor(appRootPath: string) {
		this.#confPath = joinPaths(appRootPath, "../.it-depends-conf.js");
	}

	async load() {
		const importModule = await import(this.#confPath);
		return (importModule as { default: Conf }).default;
	}
}
