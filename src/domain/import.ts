interface Params {
	sourcePath: string;
	importPath: string;
	filePath: string | null;
	values: string[];
}

export class Import {
	readonly sourcePath;
	readonly importPath;
	readonly filePath;

	#values;

	constructor({ sourcePath, importPath, filePath, values }: Params) {
		this.sourcePath = sourcePath;
		this.importPath = importPath;
		this.filePath = filePath;
		this.#values = values;
	}

	get values() {
		return this.#values;
	}

	resetValues(values: string[]) {
		this.#values = values;
	}
}
