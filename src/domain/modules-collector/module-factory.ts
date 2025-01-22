import { assert, assertNever } from "~/lib/errors";
import { getName } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { ImportSourceResolver } from "../program-file-expert";
import { type ProgramFileEntry, ieValueAll } from "../program-file-items-processor";
import type { Module } from "./values";

export class ModuleFactory {
	#importSourceResolver;

	constructor(importSourceResolver: ImportSourceResolver) {
		this.#importSourceResolver = importSourceResolver;
	}

	create(entry: ProgramFileEntry) {
		const module = this.#createModule(entry);

		entry.ieItems.forEach((ieItem) => {
			const { type } = ieItem;

			switch (type) {
				case "standard-import": {
					const { source, values } = ieItem;

					const importSource = this.#importSourceResolver.resolve({
						filePath: entry.path,
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
						filePath: entry.path,
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

					assert(
						!outputValues.includes(ieValueAll),
						"Incorrect result processing of the parser for the re-export case",
					);

					this.#fillExportValuesToModule(module, outputValues);

					return;
				}

				case "dynamic-import": {
					const { source } = ieItem;

					if (source === null) {
						module.unparsedDynamicImports += 1;
						return;
					}

					const importSource = this.#importSourceResolver.resolve({
						filePath: entry.path,
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

	#createModule({ path, content, language }: ProgramFileEntry): Module {
		return {
			path,
			language,
			content: content,
			name: getName(path),
			package: null,
			imports: [],
			exports: new Rec(),
			unparsedDynamicImports: 0,
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
