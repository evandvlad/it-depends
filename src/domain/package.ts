import { getName } from "~/lib/fs-path";

interface Params {
	path: string;
	entryPoint: string;
}

export class Package {
	readonly path;
	readonly entryPoint;
	readonly name;

	#parent: string | null = null;
	#modules: string[] = [];
	#packages: string[] = [];

	constructor({ path, entryPoint }: Params) {
		this.path = path;
		this.entryPoint = entryPoint;
		this.name = getName(path);
	}

	get parent() {
		return this.#parent;
	}

	get modules(): readonly string[] {
		return this.#modules;
	}

	get packages(): readonly string[] {
		return this.#packages;
	}

	setParent(path: string) {
		this.#parent = path;
	}

	addModule(path: string) {
		this.#modules.push(path);
	}

	addPackage(path: string) {
		this.#packages.push(path);
	}
}
