interface Params {
	sourcePath: string;
	importPath: string;
	filePath: string | null;
	isDynamic: boolean;
	isRelative: boolean;
	isAlias: boolean;
	values: string[];
}

export class Import {
	readonly sourcePath;
	readonly importPath;
	readonly filePath;
	readonly isInScope;
	readonly isDynamic;
	readonly isRelative;
	readonly isAlias;
	readonly isExternal;

	#values;

	constructor({ sourcePath, importPath, filePath, isDynamic, isRelative, isAlias, values }: Params) {
		this.sourcePath = sourcePath;
		this.importPath = importPath;
		this.filePath = filePath;
		this.isDynamic = isDynamic;
		this.isRelative = isRelative;
		this.isAlias = isAlias;
		this.isExternal = !(isRelative || isAlias);
		this.isInScope = filePath !== null;

		this.#values = values;
	}

	get values() {
		return this.#values;
	}

	changeValues(values: string[]) {
		this.#values = values;
	}
}
