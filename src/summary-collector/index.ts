import { Module, Summary, ModulesRegistry, PackagesRegistry, ParserErrors } from "../values";
import { IncorrectImportsFinder } from "./incorrect-imports-finder";

interface Options {
	packagesRegistry: PackagesRegistry;
	modulesRegistry: ModulesRegistry;
	parserErrors: ParserErrors;
}

class Collector {
	#packagesRegistry: PackagesRegistry;
	#modulesRegistry: ModulesRegistry;
	#incorrectImportsFinder: IncorrectImportsFinder;

	#summary: Summary = {
		packagesCount: 0,
		modulesCounter: {
			typescript: 0,
			javascript: 0,
		},
		unparsedDynamicImportsCounter: {},
		unresolvedFullImportsCounter: {},
		unresolvedFullExportsCounter: {},
		shadowedExportValuesCounter: {},
		possiblyUnusedExportValues: {},
		outOfScopeImports: {},
		emptyExports: [],
		incorrectImports: {},
		parserErrors: {},
	};

	constructor({ packagesRegistry, modulesRegistry, parserErrors }: Options) {
		this.#packagesRegistry = packagesRegistry;
		this.#modulesRegistry = modulesRegistry;
		this.#incorrectImportsFinder = new IncorrectImportsFinder({ packagesRegistry });

		this.#summary.parserErrors = parserErrors;
	}

	collect() {
		this.#packagesRegistry.toList().forEach(() => {
			this.#handlePackage();
		});

		this.#modulesRegistry.toList().forEach((module) => {
			this.#handleModule(module);
		});

		return this.#summary;
	}

	#handlePackage() {
		this.#summary.packagesCount += 1;
	}

	#handleModule(module: Module) {
		const {
			path,
			language,
			imports,
			exports,
			unresolvedFullImports,
			unresolvedFullExports,
			shadowedExportValues,
			unparsedDynamicImportsCount,
		} = module;

		const {
			modulesCounter,
			unparsedDynamicImportsCounter,
			unresolvedFullImportsCounter,
			unresolvedFullExportsCounter,
			shadowedExportValuesCounter,
			outOfScopeImports,
			emptyExports,
			possiblyUnusedExportValues,
			incorrectImports,
		} = this.#summary;

		modulesCounter[language] += 1;

		if (unparsedDynamicImportsCount > 0) {
			unparsedDynamicImportsCounter[path] = unparsedDynamicImportsCount;
		}

		if (unresolvedFullImports.length > 0) {
			unresolvedFullImportsCounter[path] = unresolvedFullImports.length;
		}

		if (unresolvedFullExports.length > 0) {
			unresolvedFullExportsCounter[path] = unresolvedFullExports.length;
		}

		if (shadowedExportValues.length > 0) {
			shadowedExportValuesCounter[path] = shadowedExportValues.length;
		}

		imports.forEach(({ importSource }) => {
			if (importSource.filePath === undefined) {
				outOfScopeImports[path] = outOfScopeImports[path] ?? [];
				outOfScopeImports[path]!.push(importSource.importPath);
			}
		});

		const exportEntries = Object.entries(exports);

		exportEntries.forEach(([value, paths]) => {
			if (paths.length === 0) {
				possiblyUnusedExportValues[path] = possiblyUnusedExportValues[path] ?? [];
				possiblyUnusedExportValues[path]!.push(value);
			}
		});

		if (exportEntries.length === 0 && unresolvedFullExports.length === 0) {
			emptyExports.push(path);
		}

		const incorrectImportsSources = this.#incorrectImportsFinder.find(module);

		if (incorrectImportsSources.length > 0) {
			incorrectImports[path] = incorrectImportsSources;
		}
	}
}

export function collectSummary(options: Options) {
	const collector = new Collector(options);
	return collector.collect();
}
