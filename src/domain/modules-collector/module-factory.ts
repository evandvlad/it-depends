import { assert, assertNever } from "../../lib/errors";
import { getName } from "../../lib/fs-path";
import { Rec } from "../../lib/rec";
import { type FileEntry, ieValueAll } from "../file-items-transformer";
import type { ImportSourceResolver } from "./import-source-resolver";
import type { Module } from "./values";

export class ModuleFactory {
	#importSourceResolver;

	constructor(importSourceResolver: ImportSourceResolver) {
		this.#importSourceResolver = importSourceResolver;
	}

	create(fileEntry: FileEntry) {
		const module = this.#createModule(fileEntry);

		fileEntry.ieItems.forEach((ieItem) => {
			const { type } = ieItem;

			switch (type) {
				case "standard-import": {
					const { source, values } = ieItem;

					const importSource = this.#importSourceResolver.resolve({
						filePath: fileEntry.path,
						importPath: source,
					});

					if (values.includes(ieValueAll)) {
						module.unresolvedFullImports.push(importSource);
						return;
					}

					module.imports.push({ importSource, values });

					return;
				}

				case "standard-export": {
					this.#fillExportValuesToModule(module, ieItem.values);
					return;
				}

				case "re-export": {
					const { source, inputValues, outputValues } = ieItem;

					const importSource = this.#importSourceResolver.resolve({
						filePath: fileEntry.path,
						importPath: source,
					});

					if (inputValues.includes(ieValueAll)) {
						module.unresolvedFullImports.push(importSource);

						if (outputValues.includes(ieValueAll)) {
							module.unresolvedFullExports.push(importSource);
							return;
						}
					} else {
						module.imports.push({ importSource, values: inputValues });
					}

					assert(!outputValues.includes(ieValueAll), "Incorrect result processing of parser in re-export case");

					this.#fillExportValuesToModule(module, outputValues);

					return;
				}

				case "dynamic-import": {
					const { source } = ieItem;

					if (source === null) {
						module.unparsedDynamicImportsCount += 1;
						return;
					}

					const importSource = this.#importSourceResolver.resolve({
						filePath: fileEntry.path,
						importPath: source,
					});

					module.unresolvedFullImports.push(importSource);

					return;
				}

				default:
					assertNever(type);
			}
		});

		return module;
	}

	#createModule({ path, content, language }: FileEntry): Module {
		return {
			path,
			language,
			content,
			name: getName(path),
			package: null,
			imports: [],
			exports: new Rec(),
			unparsedDynamicImportsCount: 0,
			unresolvedFullImports: [],
			unresolvedFullExports: [],
			shadowedExportValues: [],
		};
	}

	#fillExportValuesToModule(module: Module, values: string[]) {
		values.forEach((value) => {
			module.exports.set(value, []);
		});
	}
}
