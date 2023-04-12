import { Module, ImportSource, IEValue, ModulesRegistry } from "../values";

class ResolvedMarks {
	#resolvedItems: ImportSource[] = [];

	markResolved(item: ImportSource) {
		this.#resolvedItems.push(item);
	}

	removeResolved(items: ImportSource[]) {
		this.#resolvedItems.forEach((resolvedItem) => {
			const index = items.indexOf(resolvedItem);

			if (index !== -1) {
				items.splice(index, 1);
			}
		});
	}
}

function extractAllExportValues(module: Module): IEValue[] {
	return Object.keys(module.exports);
}

function isImportSourceInScope(importSource: ImportSource) {
	return importSource.filePath !== undefined;
}

function getImportSourcesInScope(importSources: ImportSource[]) {
	return importSources.filter((importSource) => isImportSourceInScope(importSource));
}

function createFullExportsResolver() {
	const enteredFilePaths = new Set<string>();

	function canProcessExportValues({ currentModule, sourceModule }: { currentModule: Module; sourceModule: Module }) {
		const hasOutOfScopeUnresolvedFullExportsOnCurrentModule = currentModule.unresolvedFullExports.some(
			(importSource) => !isImportSourceInScope(importSource),
		);

		if (hasOutOfScopeUnresolvedFullExportsOnCurrentModule) {
			return false;
		}

		return sourceModule.unresolvedFullExports.length === 0;
	}

	function hasFullExportsForResolving(module: Module) {
		return module.unresolvedFullExports.some((importSource) => isImportSourceInScope(importSource));
	}

	return function tryResolveFullExports(module: Module, modulesRegistry: ModulesRegistry) {
		const { path, unresolvedFullExports } = module;

		if (enteredFilePaths.has(path)) {
			return;
		}

		enteredFilePaths.add(path);

		if (!hasFullExportsForResolving(module)) {
			return;
		}

		const resolvedMarks = new ResolvedMarks();

		getImportSourcesInScope(unresolvedFullExports).forEach((importSource) => {
			const sourceModule = modulesRegistry.getByFilePath(importSource.filePath!);

			if (hasFullExportsForResolving(sourceModule)) {
				tryResolveFullExports(sourceModule, modulesRegistry);
			}

			if (!canProcessExportValues({ currentModule: module, sourceModule })) {
				return;
			}

			extractAllExportValues(sourceModule).forEach((value) => {
				if (!Object.hasOwn(module.exports, value)) {
					module.exports[value] = [];
				} else {
					if (!module.shadowedExportValues.includes(value)) {
						module.shadowedExportValues.push(value);
					}
				}
			});

			resolvedMarks.markResolved(importSource);
		});

		resolvedMarks.removeResolved(unresolvedFullExports);
	};
}

function tryResolveFullImports(module: Module, modulesRegistry: ModulesRegistry) {
	const { unresolvedFullImports } = module;

	if (unresolvedFullImports.length === 0) {
		return;
	}

	const resolvedMarks = new ResolvedMarks();

	getImportSourcesInScope(unresolvedFullImports).forEach((importSource) => {
		const sourceModule = modulesRegistry.getByFilePath(importSource.filePath!);

		if (sourceModule.unresolvedFullExports.length > 0) {
			return;
		}

		module.imports.push({
			importSource,
			values: extractAllExportValues(sourceModule),
		});

		resolvedMarks.markResolved(importSource);
	});

	resolvedMarks.removeResolved(unresolvedFullImports);
}

function bindExportValues({ path, imports }: Module, modulesRegistry: ModulesRegistry) {
	imports
		.filter(({ importSource }) => isImportSourceInScope(importSource))
		.forEach(({ importSource, values }) => {
			const importedFilePath = importSource.filePath!;
			const { exports } = modulesRegistry.getByFilePath(importedFilePath);

			values
				.filter((value) => Array.isArray(exports[value]) && !exports[value]!.includes(path))
				.forEach((value) => {
					exports[value]!.push(path);
				});
		});
}

export function bindModules(modulesRegistry: ModulesRegistry): ModulesRegistry {
	const tryResolveFullExports = createFullExportsResolver();

	modulesRegistry.toList().forEach((module) => {
		tryResolveFullExports(module, modulesRegistry);
		tryResolveFullImports(module, modulesRegistry);
		bindExportValues(module, modulesRegistry);
	});

	return modulesRegistry;
}
