import { Rec } from "~/lib/rec";
import { Module } from "../module";
import type { ImportData, Language } from "../values";

interface Params {
	path: string;
	language: Language;
	content: string;
}

export class ModuleBuilder {
	readonly path;

	#language;
	#content;
	#imports: ImportData[] = [];
	#unresolvedFullImports: ImportData[] = [];
	#unresolvedFullExports: ImportData[] = [];
	#unparsedDynamicImports = 0;
	#exports = new Rec<string, string[]>();
	#shadowedExportValues: string[] = [];

	constructor({ path, language, content }: Params) {
		this.path = path;
		this.#language = language;
		this.#content = content;
	}

	addImport(importData: ImportData) {
		this.#imports.push(importData);
	}

	addUnresolvedFullImport(importData: ImportData) {
		this.#unresolvedFullImports.push(importData);
	}

	addUnresolvedFullExport(importData: ImportData) {
		this.#unresolvedFullExports.push(importData);
	}

	incrementUnparsedDynamicImports() {
		this.#unparsedDynamicImports += 1;
	}

	defineExportValue(value: string) {
		this.defineExportValues([value]);
	}

	defineExportValues(values: string[]) {
		values.forEach((value) => {
			if (!this.isExportValueDefined(value)) {
				this.#exports.set(value, []);
			}
		});
	}

	isExportValueDefined(value: string) {
		return this.#exports.has(value);
	}

	getExportValues() {
		return this.#exports.toKeys();
	}

	attachPathToExportValue(value: string, path: string) {
		if (!this.isExportValueDefined(value)) {
			return;
		}

		const paths = this.#exports.get(value);

		if (paths.includes(path)) {
			return;
		}

		paths.push(path);

		this.#exports.set(value, paths);
	}

	getInScopeImports() {
		return this.#imports.filter((importData) => this.#isInScopeImport(importData));
	}

	hasUnresolvedFullExports() {
		return this.#unresolvedFullExports.length > 0;
	}

	getInScopeUnresolvedFullExports() {
		return this.#unresolvedFullExports.filter((importData) => this.#isInScopeImport(importData));
	}

	getInScopeUnresolvedFullImports() {
		return this.#unresolvedFullImports.filter((importData) => this.#isInScopeImport(importData));
	}

	hasOutOfScopeUnresolvedFullExports() {
		return this.#unresolvedFullExports.some((importData) => !this.#isInScopeImport(importData));
	}

	replaceImportValues(importData: ImportData, exportValues: string[]) {
		importData.values = exportValues;
	}

	removeResolvedFullExports(importDataList: ImportData[]) {
		this.#unresolvedFullExports = this.#unresolvedFullExports.filter((item) => !importDataList.includes(item));
	}

	removeResolvedFullImports(importDataList: ImportData[]) {
		this.#unresolvedFullImports = this.#unresolvedFullImports.filter((item) => !importDataList.includes(item));
	}

	setShadowExportValue(value: string) {
		if (!this.#shadowedExportValues.includes(value)) {
			this.#shadowedExportValues.push(value);
		}
	}

	build() {
		return new Module({
			path: this.path,
			language: this.#language,
			content: this.#content,
			imports: this.#imports,
			exports: this.#exports,
			unresolvedFullImports: this.#unresolvedFullImports,
			unresolvedFullExports: this.#unresolvedFullExports,
			shadowedExportValues: this.#shadowedExportValues,
			unparsedDynamicImports: this.#unparsedDynamicImports,
		});
	}

	#isInScopeImport({ filePath }: ImportData) {
		return filePath !== null;
	}
}
