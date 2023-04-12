import { FSPath, IEItem, Module, ieValueAll, IEValue } from "../values";
import { assertNever, assert } from "../lib/errors";
import { getModuleFileInfo } from "../lib/module-details";
import { type ImportSourceResolver } from "./import-source-resolver";

export class ModuleFactory {
	#importSourceResolver: ImportSourceResolver;

	constructor(importSourceResolver: ImportSourceResolver) {
		this.#importSourceResolver = importSourceResolver;
	}

	create({ filePath, ieItems }: { filePath: FSPath, ieItems: IEItem[]}) {
		const module = this.#createModule(filePath);

		ieItems.forEach((ieItem) => {
			const { type } = ieItem;

			switch (type) {
				case "standard-import": {
					const { source, values } = ieItem;
					const importSource = this.#importSourceResolver.resolve({ filePath, importPath: source });

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
					const importSource = this.#importSourceResolver.resolve({ filePath, importPath: source });

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
						"Incorrect result processing of parser in re-export case",
					);
					this.#fillExportValuesToModule(module, outputValues);

					return;
				}

				case "dynamic-import": {
					const { source } = ieItem;

					if (source === null) {
						module.unparsedDynamicImportsCount += 1;
						return;
					}

					const importSource = this.#importSourceResolver.resolve({ filePath, importPath: source });
					module.unresolvedFullImports.push(importSource);

					return;
				}

				default:
					assertNever(type);
			}
		});

		return module;
	}

	#createModule(path: FSPath): Module {
		const { language } = getModuleFileInfo(path);

		return {
			path,
			language,
			imports: [],
			exports: {},
			unparsedDynamicImportsCount: 0,
			unresolvedFullImports: [],
			unresolvedFullExports: [],
			shadowedExportValues: [],
		};
	}

	#fillExportValuesToModule(module: Module, values: IEValue[]) {
		values.forEach((value) => {
			module.exports[value] = [];
		});
	}
}
