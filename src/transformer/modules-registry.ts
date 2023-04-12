import { ModulesRegistry as IModulesRegistry, FSPath, Module } from "../values";
import { assert } from "../lib/errors";

export class ModulesRegistry implements IModulesRegistry {
	#modules: Record<FSPath, Module>;

	constructor(modules: Record<FSPath, Module>) {
		this.#modules = modules;
	}

	get paths(): FSPath[] {
		return Object.keys(this.#modules);
	}

	hasByFilePath(filePath: FSPath) {
		return Object.hasOwn(this.#modules, filePath);
	}

	getByFilePath(filePath: FSPath) {
		assert(this.hasByFilePath(filePath), `Module by file path: "${filePath}" wasn't found`);
		return this.#modules[filePath]!;
	}

	toList() {
		return Object.values(this.#modules);
	}
}
