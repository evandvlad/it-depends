import type { FSNavCursor } from "../../lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "../../lib/fs-path";
import { Rec } from "../../lib/rec";
import type { ImportPath, ParserErrors } from "../file-items-transformer";
import type { Language } from "../module-expert";
import type { ImportSource, Module, Modules } from "../modules-collector";
import type { Packages } from "../packages-collector";
import { IncorrectImportsFinder } from "./incorrect-imports-finder";

interface Params {
	packages: Packages;
	fsNavCursor: FSNavCursor;
	modules: Modules;
	parserErrors: ParserErrors;
}

export interface Summary {
	packagesCount: number;
	modulesCounter: Rec<Language, number>;
	unparsedDynamicImportsCounter: Rec<AbsoluteFsPath, number>;
	unresolvedFullImportsCounter: Rec<AbsoluteFsPath, number>;
	unresolvedFullExportsCounter: Rec<AbsoluteFsPath, number>;
	shadowedExportValuesCounter: Rec<AbsoluteFsPath, number>;
	outOfScopeImports: Rec<AbsoluteFsPath, ImportPath[]>;
	possiblyUnusedExportValues: Rec<AbsoluteFsPath, string[]>;
	incorrectImports: Rec<AbsoluteFsPath, ImportSource[]>;
	emptyExports: AbsoluteFsPath[];
	parserErrors: ParserErrors;
}

export class SummaryCollector {
	#packages;
	#modules;
	#incorrectImportsFinder;

	#summary: Summary = {
		packagesCount: 0,
		modulesCounter: Rec.fromObject({
			typescript: 0,
			javascript: 0,
		}),
		unparsedDynamicImportsCounter: new Rec(),
		unresolvedFullImportsCounter: new Rec(),
		unresolvedFullExportsCounter: new Rec(),
		shadowedExportValuesCounter: new Rec(),
		possiblyUnusedExportValues: new Rec(),
		outOfScopeImports: new Rec(),
		emptyExports: [],
		incorrectImports: new Rec(),
		parserErrors: new Rec(),
	};

	constructor({ fsNavCursor, packages, modules, parserErrors }: Params) {
		this.#packages = packages;
		this.#modules = modules;
		this.#incorrectImportsFinder = new IncorrectImportsFinder({ fsNavCursor, packages });
		this.#summary.parserErrors = parserErrors;
	}

	collect() {
		this.#summary.packagesCount = this.#packages.size;

		this.#modules.forEach((module) => {
			this.#handleModule(module);
		});

		return this.#summary;
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

		modulesCounter.set(language, modulesCounter.get(language) + 1);

		if (unparsedDynamicImportsCount > 0) {
			unparsedDynamicImportsCounter.set(path, unparsedDynamicImportsCount);
		}

		if (unresolvedFullImports.length > 0) {
			unresolvedFullImportsCounter.set(path, unresolvedFullImports.length);
		}

		if (unresolvedFullExports.length > 0) {
			unresolvedFullExportsCounter.set(path, unresolvedFullExports.length);
		}

		if (shadowedExportValues.length > 0) {
			shadowedExportValuesCounter.set(path, shadowedExportValues.length);
		}

		imports.forEach(({ importSource }) => {
			if (importSource.filePath === undefined) {
				if (!outOfScopeImports.has(path)) {
					outOfScopeImports.set(path, []);
				}

				outOfScopeImports.get(path).push(importSource.importPath);
			}
		});

		exports.forEach((paths, value) => {
			if (paths.length === 0) {
				if (!possiblyUnusedExportValues.has(path)) {
					possiblyUnusedExportValues.set(path, []);
				}

				possiblyUnusedExportValues.get(path).push(value);
			}
		});

		if (exports.size === 0 && unresolvedFullExports.length === 0) {
			emptyExports.push(path);
		}

		const incorrectImportsSources = this.#incorrectImportsFinder.find(module);

		if (incorrectImportsSources.length > 0) {
			incorrectImports.set(path, incorrectImportsSources);
		}
	}
}
