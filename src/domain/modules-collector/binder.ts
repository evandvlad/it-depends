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

function getImportsInScope(imports: Import[]) {
	return imports.filter((imp) => imp.isInScope);
}

function createFullExportsResolver() {
	const enteredFilePaths = new Set<string>();

	function canProcessExportValues({ currentModule, sourceModule }: { currentModule: Module; sourceModule: Module }) {
		const hasOutOfScopeUnresolvedFullExportsOnCurrentModule = currentModule.unresolvedFullExports.some(
			(imp) => !imp.isInScope,
		);

		if (hasOutOfScopeUnresolvedFullExportsOnCurrentModule) {
			return false;
		}

		return sourceModule.unresolvedFullExports.length === 0;
	}

	function hasFullExportsForResolving(module: Module) {
		return module.unresolvedFullExports.some((imp) => imp.isInScope);
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

			sourceModule.exports.values.forEach((value) => {
				if (!module.exports.isValueDefined(value)) {
					module.exports.defineValue(value);
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

		imp.changeValues(sourceModule.exports.values);

		module.imports.push(imp);

		resolvedMarks.markResolved(imp);
	});

	resolvedMarks.removeResolved(unresolvedFullImports);
}

function bindExportValues({ path, imports }: Module, modulesCollection: ModulesCollection) {
	getImportsInScope(imports).forEach((imp) => {
		const { exports } = modulesCollection.get(imp.filePath!);

		imp.values.forEach((value) => {
			exports.attachPathToValue(value, path);
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
