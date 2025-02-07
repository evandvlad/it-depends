import { isRelative } from "~/lib/import-path";
import type { ImportData } from "./values";

export class Import {
	readonly importPath;
	readonly filePath;
	readonly isInScope;
	readonly isDynamic;
	readonly isRelative;
	readonly isAlias;
	readonly isExternal;
	readonly values: readonly string[];

	constructor({ importPath, filePath, isDynamic, isAlias, values }: ImportData) {
		this.importPath = importPath;
		this.filePath = filePath;
		this.isDynamic = isDynamic;
		this.isRelative = isRelative(importPath);
		this.isAlias = isAlias;
		this.isExternal = !(this.isRelative || isAlias);
		this.isInScope = filePath !== null;
		this.values = values;
	}
}
