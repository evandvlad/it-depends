import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
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
	packages: number;
	languages: Rec<Language, number>;
	unparsedDynamicImports: Rec<AbsoluteFsPath, number>;
	unresolvedFullImports: Rec<AbsoluteFsPath, number>;
	unresolvedFullExports: Rec<AbsoluteFsPath, number>;
	shadowedExportValues: Rec<AbsoluteFsPath, number>;
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
		packages: 0,
		languages: Rec.fromObject({
			typescript: 0,
			javascript: 0,
		}),
		unparsedDynamicImports: new Rec(),
		unresolvedFullImports: new Rec(),
		unresolvedFullExports: new Rec(),
		shadowedExportValues: new Rec(),
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
		this.#summary.packages = this.#packages.size;

		this.#modules.forEach((module) => {
			this.#handleModule(module);
		});

		return this.#summary;
	}

	#handleModule(module: Module) {
		const { path, language, imports, exports } = module;

		const {
			languages,
			unparsedDynamicImports,
			unresolvedFullImports,
			unresolvedFullExports,
			shadowedExportValues,
			outOfScopeImports,
			emptyExports,
			possiblyUnusedExportValues,
			incorrectImports,
		} = this.#summary;

		languages.set(language, languages.get(language) + 1);

		if (module.unparsedDynamicImports > 0) {
			unparsedDynamicImports.set(path, module.unparsedDynamicImports);
		}

		if (module.unresolvedFullImports.length > 0) {
			unresolvedFullImports.set(path, module.unresolvedFullImports.length);
		}

		if (module.unresolvedFullExports.length > 0) {
			unresolvedFullExports.set(path, module.unresolvedFullExports.length);
		}

		if (module.shadowedExportValues.length > 0) {
			shadowedExportValues.set(path, module.shadowedExportValues.length);
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

		if (exports.size === 0 && module.unresolvedFullExports.length === 0) {
			emptyExports.push(path);
		}

		const incorrectImportsSources = this.#incorrectImportsFinder.find(module);

		if (incorrectImportsSources.length > 0) {
			incorrectImports.set(path, incorrectImportsSources);
		}
	}
}
