import type { AbsoluteFsPath } from "../../lib/fs-path";
import type { ImportSource, Module, Modules } from "./values";

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

function isImportSourceInScope(importSource: ImportSource) {
	return importSource.filePath !== undefined;
}

function getImportSourcesInScope(importSources: ImportSource[]) {
	return importSources.filter((importSource) => isImportSourceInScope(importSource));
}

function createFullExportsResolver() {
	const enteredFilePaths = new Set<AbsoluteFsPath>();

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

	return function tryResolveFullExports(module: Module, modules: Modules) {
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
			const sourceModule = modules.get(importSource.filePath!);

			if (hasFullExportsForResolving(sourceModule)) {
				tryResolveFullExports(sourceModule, modules);
			}

			if (!canProcessExportValues({ currentModule: module, sourceModule })) {
				return;
			}

			sourceModule.exports.forEach((_, value) => {
				if (!module.exports.has(value)) {
					module.exports.set(value, []);
					return;
				}

				if (!module.shadowedExportValues.includes(value)) {
					module.shadowedExportValues.push(value);
				}
			});

			resolvedMarks.markResolved(importSource);
		});

		resolvedMarks.removeResolved(unresolvedFullExports);
	};
}

function tryResolveFullImports(module: Module, modules: Modules) {
	const { unresolvedFullImports } = module;

	if (unresolvedFullImports.length === 0) {
		return;
	}

	const resolvedMarks = new ResolvedMarks();

	getImportSourcesInScope(unresolvedFullImports).forEach((importSource) => {
		const sourceModule = modules.get(importSource.filePath!);

		if (sourceModule.unresolvedFullExports.length > 0) {
			return;
		}

		module.imports.push({
			importSource,
			values: sourceModule.exports.toKeys(),
		});

		resolvedMarks.markResolved(importSource);
	});

	resolvedMarks.removeResolved(unresolvedFullImports);
}

function bindExportValues({ path, imports }: Module, modules: Modules) {
	imports
		.filter(({ importSource }) => isImportSourceInScope(importSource))
		.forEach(({ importSource, values }) => {
			const importedFilePath = importSource.filePath!;
			const { exports } = modules.get(importedFilePath);

			values
				.filter((value) => exports.has(value) && !exports.get(value).includes(path))
				.forEach((value) => {
					exports.get(value).push(path);
				});
		});
}

export function bindModules(modules: Modules): Modules {
	const tryResolveFullExports = createFullExportsResolver();

	modules.forEach((module) => {
		tryResolveFullExports(module, modules);
		tryResolveFullImports(module, modules);
		bindExportValues(module, modules);
	});

	return modules;
}
