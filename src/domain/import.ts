import type { ImportData } from "./values";

export class Import {
	readonly importPath;
	readonly filePath;
	readonly isInScope;
	readonly isDynamic;
	readonly isRelative;
	readonly isAlias;
	readonly isExternal;
	readonly values;

	constructor({ importPath, filePath, isDynamic, isRelative, isAlias, values }: ImportData) {
		this.importPath = importPath;
		this.filePath = filePath;
		this.isDynamic = isDynamic;
		this.isRelative = isRelative;
		this.isAlias = isAlias;
		this.isExternal = !(isRelative || isAlias);
		this.isInScope = filePath !== null;
		this.values = values;
	}
}
