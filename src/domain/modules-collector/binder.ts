import type { Import } from "../import";
import type { Module, ModulesCollection } from "./values";

class ResolvedMarks {
	#resolvedItems: Import[] = [];

	markResolved(item: Import) {
		this.#resolvedItems.push(item);
	}

	removeResolved(items: Import[]) {
		this.#resolvedItems.forEach((resolvedItem) => {
			const index = items.indexOf(resolvedItem);

			if (index !== -1) {
				items.splice(index, 1);
			}
		});
	}
}

function isImportInScope({ filePath }: Import) {
	return filePath !== null;
}

function getImportsInScope(imports: Import[]) {
	return imports.filter((imp) => isImportInScope(imp));
}

function createFullExportsResolver() {
	const enteredFilePaths = new Set<string>();

	function canProcessExportValues({ currentModule, sourceModule }: { currentModule: Module; sourceModule: Module }) {
		const hasOutOfScopeUnresolvedFullExportsOnCurrentModule = currentModule.unresolvedFullExports.some(
			(imp) => !isImportInScope(imp),
		);

		if (hasOutOfScopeUnresolvedFullExportsOnCurrentModule) {
			return false;
		}

		return sourceModule.unresolvedFullExports.length === 0;
	}

	function hasFullExportsForResolving(module: Module) {
		return module.unresolvedFullExports.some((imp) => isImportInScope(imp));
	}

	return function tryResolveFullExports(module: Module, modulesCollection: ModulesCollection) {
		const { path, unresolvedFullExports } = module;

		if (enteredFilePaths.has(path)) {
			return;
		}

		enteredFilePaths.add(path);

		if (!hasFullExportsForResolving(module)) {
			return;
		}

		const resolvedMarks = new ResolvedMarks();

		getImportsInScope(unresolvedFullExports).forEach((imp) => {
			const sourceModule = modulesCollection.get(imp.filePath!);

			if (hasFullExportsForResolving(sourceModule)) {
				tryResolveFullExports(sourceModule, modulesCollection);
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

			resolvedMarks.markResolved(imp);
		});

		resolvedMarks.removeResolved(unresolvedFullExports);
	};
}

function tryResolveFullImports(module: Module, modulesCollection: ModulesCollection) {
	const { unresolvedFullImports } = module;

	if (unresolvedFullImports.length === 0) {
		return;
	}

	const resolvedMarks = new ResolvedMarks();

	getImportsInScope(unresolvedFullImports).forEach((imp) => {
		const sourceModule = modulesCollection.get(imp.filePath!);

		if (sourceModule.unresolvedFullExports.length > 0) {
			return;
		}

		imp.resetValues(sourceModule.exports.toKeys());

		module.imports.push(imp);

		resolvedMarks.markResolved(imp);
	});

	resolvedMarks.removeResolved(unresolvedFullImports);
}

function bindExportValues({ path, imports }: Module, modulesCollection: ModulesCollection) {
	imports
		.filter((imp) => isImportInScope(imp))
		.forEach((imp) => {
			const importedFilePath = imp.filePath!;
			const { exports } = modulesCollection.get(importedFilePath);

			imp.values
				.filter((value) => exports.has(value) && !exports.get(value).includes(path))
				.forEach((value) => {
					exports.get(value).push(path);
				});
		});
}

export function bindModules(modulesCollection: ModulesCollection): ModulesCollection {
	const tryResolveFullExports = createFullExportsResolver();

	modulesCollection.forEach((module) => {
		tryResolveFullExports(module, modulesCollection);
		tryResolveFullImports(module, modulesCollection);
		bindExportValues(module, modulesCollection);
	});

	return modulesCollection;
}
