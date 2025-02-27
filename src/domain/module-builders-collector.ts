import { assert, assertNever } from "~/lib/errors";
import { ModuleBuilder } from "./module-builder";
import type { ImportSourceResolver } from "./program-file-expert";
import { type IEItem, type ModuleBuildersCollection, type ProgramFileEntries, ieValueAll } from "./values";

interface Params {
	importSourceResolver: ImportSourceResolver;
}

export class ModuleBuildersCollector {
	#importSourceResolver;

	constructor({ importSourceResolver }: Params) {
		this.#importSourceResolver = importSourceResolver;
	}

	collect(entries: ProgramFileEntries) {
		const buildersCollection = entries.mapValue((entry) => {
			const builder = new ModuleBuilder(entry);

			entry.ieItems.forEach((ieItem) => {
				this.#processIEItem(builder, ieItem);
			});

			return builder;
		});

		const enteredFilePaths = new Set<string>();

		buildersCollection.forEach((builder) => {
			this.#tryToResolveFullExports(builder, buildersCollection, enteredFilePaths);
			this.#tryToResolveFullImports(builder, buildersCollection);
			this.#bindExportValues(builder, buildersCollection);
		});

		return buildersCollection;
	}

	#processIEItem(builder: ModuleBuilder, ieItem: IEItem) {
		const { type } = ieItem;

		switch (type) {
			case "standard-import": {
				const { source, values } = ieItem;

				const details = this.#importSourceResolver.resolve({
					filePath: builder.path,
					importPath: source,
				});

				const importData = {
					...details,
					importPath: source,
					isDynamic: false,
					values,
				};

				if (values.includes(ieValueAll)) {
					builder.addUnresolvedFullImport(importData);
					return;
				}

				builder.addImport(importData);
				return;
			}

			case "standard-export": {
				builder.defineExportValues(ieItem.values);
				return;
			}

			case "re-export": {
				const { source, inputValues, outputValues } = ieItem;

				const details = this.#importSourceResolver.resolve({
					filePath: builder.path,
					importPath: source,
				});

				const importData = {
					...details,
					importPath: source,
					isDynamic: false,
					values: inputValues,
				};

				if (inputValues.includes(ieValueAll)) {
					builder.addUnresolvedFullImport(importData);

					if (outputValues.includes(ieValueAll)) {
						builder.addUnresolvedFullExport(importData);
						return;
					}
				} else {
					builder.addImport(importData);
				}

				assert(!outputValues.includes(ieValueAll), "Incorrect result processing of the parser for the re-export case");

				builder.defineExportValues(outputValues);
				return;
			}

			case "dynamic-import": {
				const { source } = ieItem;

				if (source === null) {
					builder.incrementUnparsedDynamicImports();
					return;
				}

				const details = this.#importSourceResolver.resolve({
					filePath: builder.path,
					importPath: source,
				});

				const importData = {
					...details,
					importPath: source,
					isDynamic: true,
					values: [ieValueAll],
				};

				builder.addUnresolvedFullImport(importData);
				return;
			}

			default:
				assertNever(type);
		}
	}

	#tryToResolveFullExports(
		builder: ModuleBuilder,
		buildersCollection: ModuleBuildersCollection,
		enteredFilePaths: Set<string>,
	) {
		if (enteredFilePaths.has(builder.path)) {
			return;
		}

		enteredFilePaths.add(builder.path);

		builder.getInScopeUnresolvedFullExports().forEach((importData) => {
			const sourceBuilder = buildersCollection.get(importData.filePath!);

			if (sourceBuilder.getInScopeUnresolvedFullExports().length > 0) {
				this.#tryToResolveFullExports(sourceBuilder, buildersCollection, enteredFilePaths);
			}

			if (sourceBuilder.hasUnresolvedFullExports()) {
				return;
			}

			sourceBuilder.getExportValues().forEach((exportValue) => {
				if (!builder.isExportValueDefined(exportValue)) {
					builder.defineExportValue(exportValue);
					return;
				}

				builder.setShadowExportValue(exportValue);
			});

			builder.removeResolvedFullExport(importData);
		});
	}

	#tryToResolveFullImports(builder: ModuleBuilder, buildersCollection: ModuleBuildersCollection) {
		builder.getInScopeUnresolvedFullImports().forEach((importData) => {
			const sourceBuilder = buildersCollection.get(importData.filePath!);

			if (sourceBuilder.hasUnresolvedFullExports()) {
				return;
			}

			builder.removeResolvedFullImport(importData, sourceBuilder.getExportValues());
		});
	}

	#bindExportValues(builder: ModuleBuilder, buildersCollection: ModuleBuildersCollection) {
		builder.getInScopeImports().forEach((importData) => {
			const sourceBuilder = buildersCollection.get(importData.filePath!);

			importData.values.forEach((value) => {
				sourceBuilder.attachPathToExportValue(value, builder.path);
			});
		});
	}
}
