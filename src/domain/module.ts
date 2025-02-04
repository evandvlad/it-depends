import { getName } from "~/lib/fs-path";
import { Import } from "./import";
import type { Language } from "./program-file-expert";
import type { Exports, ImportData } from "./values";

interface Params {
	path: string;
	language: Language;
	content: string;
	imports: ImportData[];
	exports: Exports;
	unresolvedFullImports: ImportData[];
	unresolvedFullExports: ImportData[];
	shadowedExportValues: string[];
	unparsedDynamicImports: number;
}

export class Module {
	readonly path;
	readonly name;
	readonly language;
	readonly content;
	readonly imports;
	readonly exports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;
	readonly shadowedExportValues;
	readonly unparsedDynamicImports;

	#package: string | null = null;

	constructor({
		path,
		language,
		content,
		imports,
		exports,
		unresolvedFullImports,
		unresolvedFullExports,
		shadowedExportValues,
		unparsedDynamicImports,
	}: Params) {
		this.path = path;
		this.name = getName(path);
		this.language = language;
		this.content = content;
		this.imports = imports.map((importData) => new Import(importData));
		this.exports = exports;
		this.unresolvedFullImports = unresolvedFullImports.map((importData) => new Import(importData));
		this.unresolvedFullExports = unresolvedFullExports.map((importData) => new Import(importData));
		this.shadowedExportValues = shadowedExportValues;
		this.unparsedDynamicImports = unparsedDynamicImports;
	}

	get package() {
		return this.#package;
	}

	setPackage(path: string) {
		this.#package = path;
	}
}
