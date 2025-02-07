import { Package } from "../package";

interface Params {
	path: string;
	entryPoint: string;
}

export class PackageBuilder {
	readonly path;

	#entryPoint;
	#parent: string | null = null;
	#modules: string[] = [];
	#packages: string[] = [];

	constructor({ path, entryPoint }: Params) {
		this.path = path;
		this.#entryPoint = entryPoint;
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

	build() {
		return new Package({
			path: this.path,
			entryPoint: this.#entryPoint,
			parent: this.#parent,
			modules: this.#modules,
			packages: this.#packages,
		});
	}
}
