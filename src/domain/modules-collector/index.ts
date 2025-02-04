import { assert, assertNever } from "~/lib/errors";
import type { Rec } from "~/lib/rec";
import type { ImportSourceResolver } from "../program-file-expert";
import { type IEItem, type ImportData, type ProgramFileEntries, ieValueAll } from "../values";
import { ModuleBuilder } from "./module-builder";

type BuildersCollection = Rec<string, ModuleBuilder>;

interface Params {
	importSourceResolver: ImportSourceResolver;
}

export class ModulesCollector {
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

		return buildersCollection.mapValue((builder) => {
			this.#tryToResolveFullExports(builder, buildersCollection, enteredFilePaths);
			this.#tryToResolveFullImports(builder, buildersCollection);
			this.#bindExportValues(builder, buildersCollection);

			return builder.build();
		});
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
		buildersCollection: BuildersCollection,
		enteredFilePaths: Set<string>,
	) {
		if (enteredFilePaths.has(builder.path)) {
			return;
		}

		enteredFilePaths.add(builder.path);

		const resolvedFullExports: ImportData[] = [];

		builder.getInScopeUnresolvedFullExports().forEach((importData) => {
			const sourceBuilder = buildersCollection.get(importData.filePath!);

			if (sourceBuilder.getInScopeUnresolvedFullExports().length > 0) {
				this.#tryToResolveFullExports(sourceBuilder, buildersCollection, enteredFilePaths);
			}

			if (!this.#canTransferFullExportValues(builder, sourceBuilder)) {
				return;
			}

			sourceBuilder.getExportValues().forEach((exportValue) => {
				if (!builder.isExportValueDefined(exportValue)) {
					builder.defineExportValue(exportValue);
					return;
				}

				builder.setShadowExportValue(exportValue);
			});

			resolvedFullExports.push(importData);
		});

		builder.removeResolvedFullExports(resolvedFullExports);
	}

	#tryToResolveFullImports(builder: ModuleBuilder, buildersCollection: BuildersCollection) {
		const resolvedFullImports: ImportData[] = [];

		builder.getInScopeUnresolvedFullImports().forEach((importData) => {
			const sourceBuilder = buildersCollection.get(importData.filePath!);

			if (sourceBuilder.hasUnresolvedFullExports()) {
				return;
			}

			builder.replaceImportValues(importData, sourceBuilder.getExportValues());

			resolvedFullImports.push(importData);
		});

		builder.removeResolvedFullImports(resolvedFullImports);
	}

	#bindExportValues(builder: ModuleBuilder, buildersCollection: BuildersCollection) {
		builder.getInScopeImports().forEach((importData) => {
			const sourceBuilder = buildersCollection.get(importData.filePath!);

			importData.values.forEach((value) => {
				sourceBuilder.attachPathToExportValue(value, builder.path);
			});
		});
	}

	#canTransferFullExportValues(currentBuilder: ModuleBuilder, sourceBuilder: ModuleBuilder) {
		if (currentBuilder.hasOutOfScopeUnresolvedFullExports()) {
			return false;
		}

		return !sourceBuilder.hasUnresolvedFullExports();
	}
}
