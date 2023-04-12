import { FSPath, ImportAliasMapper, ImportPath, ImportSource } from "../values";
import { isRelativeImport, getImportResolutionFSPaths } from "../lib/module-details";
import { joinPaths } from "../lib/fs-path";

interface Options {
	filePaths: FSPath[];
	importAliasMapper: ImportAliasMapper;
}

export class ImportSourceResolver {
	#filePaths: FSPath[];
	#importAliasMapper: ImportAliasMapper;

	constructor({ filePaths, importAliasMapper }: Options) {
		this.#filePaths = filePaths;
		this.#importAliasMapper = importAliasMapper;
	}

	resolve({ filePath, importPath }: { filePath: FSPath; importPath: ImportPath }) {
		const isRelative = isRelativeImport(importPath);

		const importSource: ImportSource = {
			importPath,
		};

		const resolvedFilePath = this.#resolvePath(filePath, importPath, isRelative);

		if (resolvedFilePath) {
			importSource.filePath = resolvedFilePath;
		}

		return importSource;
	}

	#resolvePath(filePath: FSPath, importPath: ImportPath, isRelative: boolean) {
		const absoluteImportPath = isRelative
			? this.#calcAbsoluteImportPath(filePath, importPath)
			: this.#importAliasMapper(importPath);

		if (!absoluteImportPath) {
			return null;
		}

		return (
			getImportResolutionFSPaths(absoluteImportPath).find((importPathCandidate) =>
				this.#filePaths.includes(importPathCandidate),
			) ?? null
		);
	}

	#calcAbsoluteImportPath(filePath: FSPath, importPath: ImportPath): ImportPath {
		const dirPath = joinPaths(filePath, "..");
		return joinPaths(dirPath, importPath);
	}
}
