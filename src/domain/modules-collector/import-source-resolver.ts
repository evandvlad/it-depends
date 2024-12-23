import type { FSNavCursor } from "../../lib/fs-nav-cursor";
import { type AbsoluteFsPath, absoluteFsPath, getParentPath, joinPaths, normalizePath } from "../../lib/fs-path";
import type { ImportPath } from "../file-items-transformer";
import { entryPointFileName, orderedByResolvingPriorityAcceptableFileExtNames } from "../module-expert";
import type { ImportAliasMapper, ImportSource } from "./values";

interface Params {
	fsNavCursor: FSNavCursor;
	importAliasMapper: ImportAliasMapper;
}

export class ImportSourceResolver {
	#fsNavCursor;
	#importAliasMapper;

	constructor({ fsNavCursor, importAliasMapper }: Params) {
		this.#fsNavCursor = fsNavCursor;
		this.#importAliasMapper = importAliasMapper;
	}

	resolve({ filePath, importPath }: { filePath: AbsoluteFsPath; importPath: ImportPath }) {
		const importSource: ImportSource = {
			importPath,
		};

		const isRelative = this.#isRelativeImport(importPath);
		const resolvedFilePath = this.#resolvePath(filePath, importPath, isRelative);

		if (resolvedFilePath) {
			importSource.filePath = resolvedFilePath;
		}

		return importSource;
	}

	#isRelativeImport(path: ImportPath) {
		return path === "." || path === ".." || path.startsWith("./") || path.startsWith("../");
	}

	#resolvePath(filePath: AbsoluteFsPath, importPath: ImportPath, isRelative: boolean) {
		const absoluteImportPath = isRelative
			? this.#calcAbsoluteImportPath(filePath, importPath)
			: this.#importAliasMapper(importPath);

		if (!absoluteImportPath) {
			return null;
		}

		const normalizedPath = normalizePath(absoluteImportPath);

		const candidates = this.#getImportResolutionFSPaths(normalizedPath);

		return candidates.find((importPathCandidate) => this.#fsNavCursor.hasNodeByPath(importPathCandidate)) ?? null;
	}

	#calcAbsoluteImportPath(filePath: AbsoluteFsPath, importPath: ImportPath) {
		const dirPath = getParentPath(filePath);
		return joinPaths(dirPath, importPath);
	}

	#getImportResolutionFSPaths(absoluteImportPath: AbsoluteFsPath) {
		return [
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) =>
				absoluteFsPath(`${absoluteImportPath}${extName}`),
			),
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) =>
				joinPaths(absoluteImportPath, `${entryPointFileName}${extName}`),
			),
		];
	}
}
