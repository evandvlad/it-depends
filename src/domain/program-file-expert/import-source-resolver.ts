import { delimiter, getParentPath, joinPaths } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import { type Aliases, entryPointFileName, orderedByResolvingPriorityAcceptableFileExtNames } from "./values";

interface PathInfo {
	filePath: string;
	importPath: string;
}

interface ResolvingDetails {
	filePath: string | null;
	isRelative: boolean;
	isAlias: boolean;
}

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

	resolve(pathInfo: PathInfo): ResolvingDetails {
		const isRelative = this.#isRelativeImport(pathInfo.importPath);

		const details: ResolvingDetails = {
			isRelative,
			filePath: null,
			isAlias: false,
		};

		const absoluteImportPath = isRelative
			? this.#calcAbsoluteImportPathFromRelativeImportPath(pathInfo)
			: this.#calcAbsoluteImportPathFromNonRelativeImportPath(pathInfo);

		if (absoluteImportPath) {
			const candidates = this.#getImportResolutionPaths(absoluteImportPath);

			details.isAlias = !isRelative;
			details.filePath =
				candidates.find((importPathCandidate) => this.#fSTree.hasNodeByPath(importPathCandidate)) ?? null;
		}

		return details;
	}

	#isRelativeImport(importPath: string) {
		return (
			importPath === "." ||
			importPath === ".." ||
			importPath.startsWith(`.${delimiter}`) ||
			importPath.startsWith(`..${delimiter}`)
		);
	}

	#calcAbsoluteImportPathFromRelativeImportPath({ filePath, importPath }: PathInfo) {
		const dirPath = getParentPath(filePath);
		return joinPaths(dirPath, importPath);
	}

	#calcAbsoluteImportPathFromNonRelativeImportPath({ importPath }: PathInfo) {
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

	#getImportResolutionPaths(absoluteImportPath: string) {
		return [
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) => `${absoluteImportPath}${extName}`),
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) =>
				joinPaths(absoluteImportPath, `${entryPointFileName}${extName}`),
			),
		];
	}
}
