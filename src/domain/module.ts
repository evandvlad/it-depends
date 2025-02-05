import { getName } from "~/lib/fs-path";
import { Import } from "./import";
import type { Exports, ImportData, Language } from "./values";

interface Params {
	path: string;
	package: string | null;
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
	readonly package;
	readonly language;
	readonly content;
	readonly imports;
	readonly exports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;
	readonly shadowedExportValues;
	readonly unparsedDynamicImports;

	constructor({
		path,
		package: pack,
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
		this.package = pack;
		this.name = getName(path);
		this.language = language;
		this.content = content;
		this.exports = exports;
		this.imports = imports.map((importData) => new Import(importData));
		this.unresolvedFullImports = unresolvedFullImports.map((importData) => new Import(importData));
		this.unresolvedFullExports = unresolvedFullExports.map((importData) => new Import(importData));
		this.shadowedExportValues = shadowedExportValues;
		this.unparsedDynamicImports = unparsedDynamicImports;
	}
}
