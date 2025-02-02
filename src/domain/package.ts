import { getName } from "~/lib/fs-path";

interface Params {
	path: string;
	entryPoint: string;
	parent: string | null;
	modules: readonly string[];
	packages: readonly string[];
}

export class Package {
	readonly path;
	readonly entryPoint;
	readonly name;
	readonly parent;
	readonly modules;
	readonly packages;

	constructor({ path, entryPoint, parent, modules, packages }: Params) {
		this.path = path;
		this.entryPoint = entryPoint;
		this.name = getName(path);
		this.parent = parent;
		this.modules = modules;
		this.packages = packages;
	}
}
