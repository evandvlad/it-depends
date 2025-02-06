import { getName } from "~/lib/fs-path";
import { type ReadonlyRec, Rec } from "~/lib/rec";
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
	incorrectImports: ImportData[];
	shadowedExportValues: string[];
	unparsedDynamicImports: number;
}

export class Module {
	readonly path;
	readonly name;
	readonly package;
	readonly language;
	readonly content;
	readonly hasExports;
	readonly unparsedDynamicImports;
	readonly imports: readonly Import[];
	readonly unresolvedFullImports: readonly Import[];
	readonly unresolvedFullExports: readonly Import[];
	readonly outOfScopeImports: readonly Import[];
	readonly incorrectImports: readonly Import[];
	readonly shadowedExportValues: readonly string[];
	readonly possiblyUnusedExports: readonly string[];
	readonly exportsByValue: ReadonlyRec<string, string[]>;
	readonly exportsByModule: ReadonlyRec<string, string[]>;

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
		incorrectImports,
	}: Params) {
		this.path = path;
		this.package = pack;
		this.name = getName(path);
		this.language = language;
		this.content = content;
		this.exportsByValue = exports;
		this.exportsByModule = this.#getExportsByModule();
		this.imports = imports.map((importData) => new Import(importData));
		this.unresolvedFullImports = unresolvedFullImports.map((importData) => new Import(importData));
		this.unresolvedFullExports = unresolvedFullExports.map((importData) => new Import(importData));
		this.incorrectImports = incorrectImports.map((importData) => new Import(importData));
		this.shadowedExportValues = shadowedExportValues;
		this.unparsedDynamicImports = unparsedDynamicImports;
		this.outOfScopeImports = this.imports.filter(({ isInScope }) => !isInScope);
		this.hasExports = this.exportsByValue.size > 0 || this.unresolvedFullExports.length > 0;

		this.possiblyUnusedExports = this.exportsByValue
			.toEntries()
			.filter(([_, paths]) => paths.length === 0)
			.map(([value]) => value);
	}

	#getExportsByModule() {
		const rec = new Rec<string, string[]>();

		this.exportsByValue.forEach((paths, value) => {
			paths.forEach((path) => {
				const values = rec.getOrDefault(path, []);
				values.push(value);
				rec.set(path, values);
			});
		});

		return rec;
	}
}
