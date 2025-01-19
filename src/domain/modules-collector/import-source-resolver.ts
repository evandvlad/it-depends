import { delimiter, getParentPath, joinPaths } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import { entryPointFileName, orderedByResolvingPriorityAcceptableFileExtNames } from "../module-expert";
import type { Aliases, ImportSource } from "./values";

interface Params {
	fSTree: FSTree;
	aliases: Aliases;
}

export class ImportSourceResolver {
	#fSTree;
	#aliases;

	constructor({ fSTree, aliases }: Params) {
		this.#fSTree = fSTree;
		this.#aliases = aliases;
	}

	resolve({ filePath, importPath }: { filePath: string; importPath: string }) {
		const importSource: ImportSource = {
			importPath,
		};

		const resolvedFilePath = this.#resolvePath(filePath, importPath);

		if (resolvedFilePath) {
			importSource.filePath = resolvedFilePath;
		}

		return importSource;
	}

	#isRelativeImport(importPath: string) {
		return (
			importPath === "." ||
			importPath === ".." ||
			importPath.startsWith(`.${delimiter}`) ||
			importPath.startsWith(`..${delimiter}`)
		);
	}

	#resolvePath(filePath: string, importPath: string) {
		const absoluteImportPath = this.#calcAbsoluteImportPath(filePath, importPath);

		if (!absoluteImportPath) {
			return null;
		}

		const candidates = this.#getImportResolutionFSPaths(absoluteImportPath);

		return candidates.find((importPathCandidate) => this.#fSTree.hasNodeByPath(importPathCandidate)) ?? null;
	}

	#calcAbsoluteImportPath(filePath: string, importPath: string) {
		const isRelativeImport = this.#isRelativeImport(importPath);

		if (isRelativeImport) {
			const dirPath = getParentPath(filePath);
			return joinPaths(dirPath, importPath);
		}

		for (const [name, path] of this.#aliases.toEntries()) {
			if (importPath === name) {
				return path;
			}

			const prefix = `${name}${delimiter}`;

			if (importPath.startsWith(prefix)) {
				return joinPaths(path, importPath.slice(prefix.length));
			}
		}

		return null;
	}

	#getImportResolutionFSPaths(absoluteImportPath: string) {
		return [
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) => `${absoluteImportPath}${extName}`),
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) =>
				joinPaths(absoluteImportPath, `${entryPointFileName}${extName}`),
			),
		];
	}
}
